const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { spawn } = require("child_process");
const OpenAI = require("openai");

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    : null;

const deepseek = process.env.DEEPSEEK_API_KEY
    ? new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com"
    })
    : null;

const {
    createClient
} = require("@supabase/supabase-js");


const pythonProcess = spawn("python3", ["main.py"], {
    cwd: __dirname,
    env: process.env
});

pythonProcess.stdout.on("data", (data) => {
    console.log("[FastAPI]", data.toString().trim());
});

pythonProcess.stderr.on("data", (data) => {
    console.error("[FastAPI]", data.toString().trim());
});

pythonProcess.on("error", (error) => {
    console.error("[FastAPI] Failed to start:", error.message);
});

pythonProcess.on("exit", (code, signal) => {
    console.log(`[FastAPI] Process exited. code=${code}, signal=${signal}`);
});

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
   SERVE FRONTEND
========================================= */

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));


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
   PROFILE API
========================================= */

app.get(
    "/api/auth/profile",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(req);

            if (!session) {

                return res.status(401).json({

                    success: false,

                    authenticated: false,

                    message:
                        "Not authenticated."

                });
            }

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

            if (error) {

                console.error(
                    "Profile API error:",
                    error
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Unable to load profile."

                });
            }

            if (!profile) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Profile not found."

                });
            }

            return res.json({

                success: true,

                authenticated: true,

                profile: profile

            });

        } catch (error) {

            console.error(
                "Profile API exception:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Something went wrong."

            });

        }

    }
);

/* =========================================
   ASSIGNMENTS API
========================================= */

/* GET ASSIGNMENTS */

app.get(
    "/api/assignments",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(req);

            if (!session) {

                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: "Not authenticated."
                });

            }

            const {
                data: assignments,
                error
            } = await supabase
                .from("assignments")
                .select("*")
                .eq(
                    "student_id",
                    session.profile_id
                )
                .order(
                    "due_date",
                    {
                        ascending: true,
                        nullsFirst: false
                    }
                );

            if (error) {

                console.error(
                    "Assignments GET error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to load assignments."
                });

            }

            return res.json({
                success: true,
                assignments: assignments || []
            });

        } catch (error) {

            console.error(
                "Assignments GET exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Something went wrong."
            });

        }

    }
);


/* CREATE ASSIGNMENT */

app.post(
    "/api/assignments",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(req);

            if (!session) {

                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: "Not authenticated."
                });

            }

            const {
                title,
                description,
                subject,
                due_date,
                priority,
                status
            } = req.body;


            if (
                typeof title !== "string" ||
                !title.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Assignment title is required."
                });

            }


            const assignmentData = {

                student_id:
                    session.profile_id,

                title:
                    title.trim(),

                description:
                    typeof description === "string"
                        ? description.trim()
                        : null,

                subject:
                    typeof subject === "string"
                        ? subject.trim()
                        : null,

                due_date:
                    due_date || null,

                priority:
                    priority || "medium",

                status:
                    status || "pending"

            };


            const {
                data: assignment,
                error
            } = await supabase
                .from("assignments")
                .insert(assignmentData)
                .select("*")
                .single();


            if (error) {

                console.error(
                    "Assignment CREATE error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to create assignment."
                });

            }


            return res.status(201).json({

                success: true,

                message:
                    "Assignment created successfully.",

                assignment:
                    assignment

            });

        } catch (error) {

            console.error(
                "Assignment CREATE exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Something went wrong."
            });

        }

    }
);


/* UPDATE ASSIGNMENT */

app.put(
    "/api/assignments/:id",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(req);

            if (!session) {

                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: "Not authenticated."
                });

            }


            const assignmentId =
                req.params.id;


            const {
                title,
                description,
                subject,
                due_date,
                priority,
                status
            } = req.body;


            const updateData = {};


            if (typeof title === "string") {
                updateData.title =
                    title.trim();
            }

            if (typeof description === "string") {
                updateData.description =
                    description.trim();
            }

            if (typeof subject === "string") {
                updateData.subject =
                    subject.trim();
            }

            if (due_date !== undefined) {
                updateData.due_date =
                    due_date || null;
            }

            if (priority !== undefined) {
                updateData.priority =
                    priority;
            }

            if (status !== undefined) {
                updateData.status =
                    status;
            }


            updateData.updated_at =
                new Date().toISOString();


            const {
                data: assignment,
                error
            } = await supabase
                .from("assignments")
                .update(updateData)
                .eq(
                    "id",
                    assignmentId
                )
                .eq(
                    "student_id",
                    session.profile_id
                )
                .select("*")
                .single();


            if (error) {

                console.error(
                    "Assignment UPDATE error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to update assignment."
                });

            }


            return res.json({

                success: true,

                message:
                    "Assignment updated successfully.",

                assignment:
                    assignment

            });

        } catch (error) {

            console.error(
                "Assignment UPDATE exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Something went wrong."
            });

        }

    }
);


/* DELETE ASSIGNMENT */

app.delete(
    "/api/assignments/:id",
    async function (req, res) {

        try {

            const session =
                await getCurrentSession(req);

            if (!session) {

                return res.status(401).json({
                    success: false,
                    authenticated: false,
                    message: "Not authenticated."
                });

            }


            const assignmentId =
                req.params.id;


            const {
                error
            } = await supabase
                .from("assignments")
                .delete()
                .eq(
                    "id",
                    assignmentId
                )
                .eq(
                    "student_id",
                    session.profile_id
                );


            if (error) {

                console.error(
                    "Assignment DELETE error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to delete assignment."
                });

            }


            return res.json({

                success: true,

                message:
                    "Assignment deleted successfully."

            });

        } catch (error) {

            console.error(
                "Assignment DELETE exception:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Something went wrong."
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
   FASTAPI TIMETABLE PROXY
========================================= */

app.post("/api/ai", async (req, res) => {
    try {
        const task = req.body?.task;
        const prompt = req.body?.prompt;

        if (!task || typeof task !== "string") {
            return res.status(400).json({
                success: false,
                message: "AI task is required."
            });
        }

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                success: false,
                message: "Prompt is required."
            });
        }

        if (task === "physics") {
            if (!openai) {
                return res.status(503).json({
                    success: false,
                    message: "OpenAI API key is not configured yet."
                });
            }

            const response = await openai.responses.create({
                model: "gpt-5",
                input: prompt
            });

            return res.json({
                success: true,
                task: "physics",
                model: "gpt-5",
                response: response.output_text
            });
        }

        if (task === "python") {
            if (!deepseek) {
                return res.status(503).json({
                    success: false,
                    message: "DeepSeek API key is not configured yet."
                });
            }

            const response = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

            return res.json({
                success: true,
                task: "python",
                model: "deepseek-chat",
                response: response.choices[0].message.content
            });
        }

        if (task === "diagram") {
            try {
                const response = await gemini.models.generateContent({
                    model: "gemini-3.6-flash",
                    contents: prompt
                });

                return res.json({
                    success: true,
                    task: "diagram",
                    model: "gemini-3.6-flash",
                    response: response.text
                });

            } catch (error) {
                console.error("Gemini Router error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Gemini diagram request failed."
                });
            }
        }

        return res.status(400).json({
            success: false,
            message: "Unknown AI task."
        });

    } catch (error) {
        console.error("Central AI Router error:", error);

        return res.status(500).json({
            success: false,
            message: "AI router request failed."
        });
    }
});


app.post("/api/ai/openai", async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({
                success: false,
                message: "OpenAI API key is not configured yet."
            });
        }

        const prompt = req.body?.prompt;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                success: false,
                message: "Prompt is required."
            });
        }

        const response = await openai.responses.create({
            model: "gpt-5",
            input: prompt
        });

        return res.json({
            success: true,
            model: "gpt-5",
            response: response.output_text
        });

    } catch (error) {
        console.error("OpenAI API error:", error);

        return res.status(500).json({
            success: false,
            message: "OpenAI API request failed."
        });
    }
});


app.post("/api/ai/deepseek", async (req, res) => {
    try {
        if (!deepseek) {
            return res.status(503).json({
                success: false,
                message: "DeepSeek API key is not configured yet."
            });
        }

        const prompt = req.body?.prompt;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                success: false,
                message: "Prompt is required."
            });
        }

        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return res.json({
            success: true,
            model: "deepseek-chat",
            response: response.choices[0].message.content
        });

    } catch (error) {
        console.error("DeepSeek API error:", error);

        return res.status(500).json({
            success: false,
            message: "DeepSeek API request failed."
        });
    }
});


app.post("/api/ai/gemini", async (req, res) => {
    try {
        const prompt = req.body?.prompt;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                success: false,
                message: "Prompt is required."
            });
        }

        const response = await gemini.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        return res.json({
            success: true,
            model: "gemini-3.6-flash",
            response: response.text
        });
    } catch (error) {
        console.error("Gemini API error:", error);

        return res.status(500).json({
            success: false,
            message: "Gemini API request failed."
        });
    }
});

app.use(
    "/api/timetable",
    async function (req, res) {

        try {

            const targetUrl =
                "http://127.0.0.1:8000" +
                req.originalUrl;

            const response =
                await fetch(
                    targetUrl,
                    {
                        method: req.method,

                        headers: {
                            "content-type":
                                req.get("content-type") ||
                                "application/json"
                        },

                        body:
                            ["GET", "HEAD"].includes(req.method)
                                ? undefined
                                : JSON.stringify(req.body)
                    }
                );

            const responseText =
                await response.text();

            res.status(
                response.status
            );

            const contentType =
                response.headers.get(
                    "content-type"
                );

            if (contentType) {
                res.set(
                    "content-type",
                    contentType
                );
            }

            return res.send(
                responseText
            );

        } catch (error) {

            console.error(
                "FastAPI proxy error:",
                error
            );

            return res.status(502).json({

                success: false,

                message:
                    "AI Timetable backend is unavailable."

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