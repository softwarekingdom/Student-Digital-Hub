require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const {
    createClient
} = require("@supabase/supabase-js");


const app = express();

const PORT =
    process.env.PORT || 3000;


/* =========================================
   SUPABASE
========================================= */

const SUPABASE_URL =
    process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;


if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
) {

    console.error(
        "❌ Missing Supabase environment variables."
    );

    process.exit(1);
}


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );


/* =========================================
   MIDDLEWARE
========================================= */

app.use(
    express.json({
        limit: "20kb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "20kb"
    })
);

app.use(cookieParser());


/* =========================================
   SESSION SETTINGS
========================================= */

const SESSION_COOKIE =
    "sdh_session";

const SESSION_DAYS = 7;

const SESSION_MAX_AGE =
    SESSION_DAYS *
    24 *
    60 *
    60 *
    1000;


/* =========================================
   HELPERS
========================================= */

function normalizeUsername(username) {

    return String(username || "")
        .trim()
        .toLowerCase();

}


function isValidUsername(username) {

    return /^[a-z0-9_]{3,30}$/
        .test(username);

}


function isValidPassword(password) {

    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 128
    );

}


function generateSessionToken() {

    return crypto
        .randomBytes(48)
        .toString("hex");

}


function hashSessionToken(token) {

    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

}


function setSessionCookie(
    response,
    token
) {

    response.cookie(
        SESSION_COOKIE,
        token,
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "lax",

            maxAge:
                SESSION_MAX_AGE,

            path: "/"
        }
    );

}


function clearSessionCookie(
    response
) {

    response.clearCookie(
        SESSION_COOKIE,
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "lax",

            path: "/"
        }
    );

}


function isProfileCompleted(profile) {

    return Boolean(
        profile &&
        profile.grade &&
        profile.school
    );

}
/* =========================================
   CREATE DATABASE SESSION
========================================= */

async function createDatabaseSession(profileId) {

    const rawToken =
        generateSessionToken();

    const tokenHash =
        hashSessionToken(rawToken);

    const expiresAt =
        new Date(
            Date.now() + SESSION_MAX_AGE
        ).toISOString();


    const { error } =
        await supabase
            .from("sessions")
            .insert({
                profile_id: profileId,
                token_hash: tokenHash,
                expires_at: expiresAt
            });


    if (error) {

        console.error(
            "Session creation error:",
            error
        );

        throw new Error(
            "SESSION_CREATE_FAILED"
        );
    }


    return rawToken;
}


/* =========================================
   GET CURRENT SESSION
========================================= */

async function getCurrentSession(req) {

    const rawToken =
        req.cookies[SESSION_COOKIE];


    if (!rawToken) {
        return null;
    }


    const tokenHash =
        hashSessionToken(rawToken);


    const { data: session, error } =
        await supabase
            .from("sessions")
            .select(
                "id, profile_id, expires_at"
            )
            .eq(
                "token_hash",
                tokenHash
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Session lookup error:",
            error
        );

        return null;
    }


    if (!session) {
        return null;
    }


    const expired =
        new Date(
            session.expires_at
        ).getTime() <= Date.now();


    if (expired) {

        await supabase
            .from("sessions")
            .delete()
            .eq(
                "id",
                session.id
            );

        return null;
    }


    return session;
}


/* =========================================
   HEALTH CHECK
========================================= */

app.get(
    "/api/health",
    function (req, res) {

        res.json({
            success: true,
            service:
                "Student Digital Hub Backend",
            status:
                "running"
        });

    }
);


/* =========================================
   SIGNUP
========================================= */

app.post(
    "/api/auth/signup",
    async function (req, res) {

        try {

            const fullName =
                String(
                    req.body.fullName || ""
                ).trim();

            const username =
                normalizeUsername(
                    req.body.username
                );

            const password =
                req.body.password;


            /* -----------------------------
               VALIDATION
            ----------------------------- */

            if (
                fullName.length < 2 ||
                fullName.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid full name."
                });
            }


            if (
                !isValidUsername(username)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Username must contain 3–30 letters, numbers or underscore."
                });
            }


            if (
                !isValidPassword(password)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain 8–128 characters."
                });
            }


            /* -----------------------------
               CHECK USERNAME
            ----------------------------- */

            const {
                data: existingAccount,
                error: accountCheckError
            } = await supabase
                .from("auth_accounts")
                .select("id")
                .eq(
                    "username",
                    username
                )
                .maybeSingle();


            if (accountCheckError) {

                console.error(
                    accountCheckError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to check username."
                });
            }


            if (existingAccount) {

                return res.status(409).json({
                    success: false,
                    message:
                        "That username is already taken."
                });
            }


            /* -----------------------------
               PASSWORD HASH
            ----------------------------- */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            /* -----------------------------
               CREATE PROFILE
            ----------------------------- */

            const {
                data: profile,
                error: profileError
            } = await supabase
                .from("profiles")
                .insert({
                    full_name: fullName,
                    username: username
                })
                .select(
                    "id, full_name, username"
                )
                .single();


            if (profileError) {

                console.error(
                    "Profile creation error:",
                    profileError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create your profile."
                });
            }


            /* -----------------------------
               CREATE AUTH ACCOUNT
            ----------------------------- */

            const {
                error: authError
            } = await supabase
                .from("auth_accounts")
                .insert({
                    profile_id:
                        profile.id,

                    username:
                        username,

                    password_hash:
                        passwordHash
                });


            if (authError) {

                console.error(
                    "Auth account error:",
                    authError
                );


                await supabase
                    .from("profiles")
                    .delete()
                    .eq(
                        "id",
                        profile.id
                    );


                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to create your account."
                });
            }


            /* -----------------------------
               CREATE SESSION
            ----------------------------- */

            let sessionToken;

            try {

                sessionToken =
                    await createDatabaseSession(
                        profile.id
                    );

            } catch (sessionError) {

                console.error(
                    sessionError
                );


                await supabase
                    .from("auth_accounts")
                    .delete()
                    .eq(
                        "profile_id",
                        profile.id
                    );


                await supabase
                    .from("profiles")
                    .delete()
                    .eq(
                        "id",
                        profile.id
                    );


                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to start your session."
                });
            }


            setSessionCookie(
                res,
                sessionToken
            );


            /* -----------------------------
               SUCCESS
            ----------------------------- */

            return res.status(201).json({

                success: true,

                authenticated: true,

                profileCompleted: false,

                user: {

                    id:
                        profile.id,

                    fullName:
                        profile.full_name,

                    username:
                        profile.username

                }

            });

        } catch (error) {

            console.error(
                "Signup error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Something went wrong while creating your account."

            });
        }

    }
);
/* =========================================
   LOGIN
========================================= */

app.post(
    "/api/auth/login",
    async function (req, res) {

        try {

            const username =
                normalizeUsername(
                    req.body.username
                );

            const password =
                req.body.password;


            /* -----------------------------
               VALIDATION
            ----------------------------- */

            if (
                !isValidUsername(username) ||
                typeof password !== "string" ||
                password.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });
            }


            /* -----------------------------
               FIND ACCOUNT
            ----------------------------- */

            const {
                data: account,
                error: accountError
            } = await supabase
                .from("auth_accounts")
                .select(
                    "id, profile_id, username, password_hash"
                )
                .eq(
                    "username",
                    username
                )
                .maybeSingle();


            if (accountError) {

                console.error(
                    "Account lookup error:",
                    accountError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to process login."

                });
            }


            /* -----------------------------
               INVALID USERNAME
            ----------------------------- */

            if (!account) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });
            }


            /* -----------------------------
               VERIFY PASSWORD
            ----------------------------- */

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    account.password_hash
                );


            if (!passwordMatches) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid username or password."

                });
            }


            /* -----------------------------
               GET PROFILE
            ----------------------------- */

            const {
                data: profile,
                error: profileError
            } = await supabase
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    account.profile_id
                )
                .maybeSingle();


            if (profileError) {

                console.error(
                    "Profile lookup error:",
                    profileError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to load your profile."

                });
            }


            if (!profile) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Your profile could not be found."

                });
            }


            /* -----------------------------
               CREATE NEW SESSION
            ----------------------------- */

            const sessionToken =
                await createDatabaseSession(
                    profile.id
                );


            setSessionCookie(
                res,
                sessionToken
            );


            /* -----------------------------
               PROFILE STATUS
            ----------------------------- */

            const profileCompleted =
                isProfileCompleted(
                    profile
                );


            /* -----------------------------
               LOGIN SUCCESS
            ----------------------------- */

            return res.json({

                success: true,

                authenticated: true,

                profileCompleted:
                    profileCompleted,

                user: {

                    id:
                        profile.id,

                    fullName:
                        profile.full_name,

                    username:
                        profile.username

                }

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Something went wrong while logging in."

            });
        }

    }
);


/* =========================================
   SESSION CHECK
========================================= */

app.get(
    "/api/auth/session",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(
                    req
                );


            /* -----------------------------
               NO SESSION
            ----------------------------- */

            if (!session) {

                return res.json({

                    authenticated:
                        false

                });
            }


            /* -----------------------------
               GET PROFILE
            ----------------------------- */

            const {
                data: profile,
                error
            } = await supabase
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    session.profile_id
                )
                .maybeSingle();


            /* -----------------------------
               PROFILE NOT FOUND
            ----------------------------- */

            if (
                error ||
                !profile
            ) {

                clearSessionCookie(
                    res
                );

                return res.json({

                    authenticated:
                        false

                });
            }


            /* -----------------------------
               SESSION SUCCESS
            ----------------------------- */

            return res.json({

                authenticated:
                    true,

                profileCompleted:
                    isProfileCompleted(
                        profile
                    ),

                user: {

                    id:
                        profile.id,

                    fullName:
                        profile.full_name,

                    username:
                        profile.username

                }

            });

        } catch (error) {

            console.error(
                "Session check error:",
                error
            );

            return res.status(500).json({

                authenticated:
                    false

            });
        }

    }
);
/* =========================================
   LOGOUT
========================================= */

app.post(
    "/api/auth/logout",
    async function (req, res) {

        try {

            const rawToken =
                req.cookies[
                    SESSION_COOKIE
                ];


            /*
             * If a session cookie exists,
             * remove its database session.
             */

            if (rawToken) {

                const tokenHash =
                    hashSessionToken(
                        rawToken
                    );


                const {
                    error
                } = await supabase
                    .from("sessions")
                    .delete()
                    .eq(
                        "token_hash",
                        tokenHash
                    );


                if (error) {

                    console.error(
                        "Session deletion error:",
                        error
                    );

                }
            }


            /*
             * Remove browser cookie.
             */

            clearSessionCookie(
                res
            );


            return res.json({

                success: true,

                message:
                    "Logged out successfully."

            });

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            /*
             * Even if database deletion
             * fails, remove the cookie.
             */

            clearSessionCookie(
                res
            );


            return res.json({

                success: true,

                message:
                    "Logged out successfully."

            });

        }

    }
);


/* =========================================
   CLEAN EXPIRED SESSIONS
========================================= */

app.post(
    "/api/auth/cleanup",
    async function (req, res) {

        try {

            const {
                error
            } = await supabase
                .from("sessions")
                .delete()
                .lt(
                    "expires_at",
                    new Date().toISOString()
                );


            if (error) {

                console.error(
                    "Cleanup error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to clean expired sessions."

                });

            }


            return res.json({

                success: true,

                message:
                    "Expired sessions cleaned."

            });

        } catch (error) {

            console.error(
                "Cleanup error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Cleanup failed."

            });

        }

    }
);


/* =========================================
   API 404
========================================= */

app.use(
    "/api",
    function (req, res) {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found."

        });

    }
);


/* =========================================
   GLOBAL ERROR HANDLER
========================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Unhandled server error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }
);


/* =========================================
   START SERVER
========================================= */

app.listen(
    PORT,
    function () {

        console.log(
            "======================================"
        );

        console.log(
            "🎓 Student Digital Hub"
        );

        console.log(
            "🔐 Custom Authentication Backend"
        );

        console.log(
            `🚀 Server running on port ${PORT}`
        );

        console.log(
            "======================================"
        );

    }
);