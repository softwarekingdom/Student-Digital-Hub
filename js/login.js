/* =========================================
   STUDENT DIGITAL HUB
   CUSTOM LOGIN SYSTEM
========================================= */


/* =========================================
   DOM ELEMENTS
========================================= */

const loginForm =
    document.getElementById(
        "loginForm"
    );

const usernameInput =
    document.getElementById(
        "username"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );


/* =========================================
   MESSAGE
========================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        message;

    formMessage.className =
        "form-message " + type;

    formMessage.hidden =
        false;
}


function hideLoginMessage() {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        "";

    formMessage.className =
        "form-message";

    formMessage.hidden =
        true;
}


/* =========================================
   LOADING STATE
========================================= */

function setLoginLoading(
    loading
) {

    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        loading;


    if (loading) {

        loginButton.dataset
            .originalText =
            loginButton.innerHTML;

        loginButton.innerHTML =
            `
            <span class="button-loader">
                Signing in...
            </span>
            `;

    } else {

        loginButton.innerHTML =
            loginButton.dataset
                .originalText ||
            "Login";

    }

}


/* =========================================
   USERNAME NORMALIZATION
========================================= */

if (usernameInput) {

    usernameInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9_]/g,
                        ""
                    );

        }
    );

}
/* =========================================
   LOGIN VALIDATION
========================================= */

function validateLoginForm() {

    const username =
        usernameInput.value
            .trim()
            .toLowerCase();

    const password =
        passwordInput.value;


    /* -------------------------------------
       USERNAME
    ------------------------------------- */

    if (!username) {

        return {
            valid: false,
            message:
                "Please enter your username."
        };

    }


    if (
        !/^[a-z0-9_]{3,30}$/
            .test(username)
    ) {

        return {
            valid: false,
            message:
                "Please enter a valid username."
        };

    }


    /* -------------------------------------
       PASSWORD
    ------------------------------------- */

    if (!password) {

        return {
            valid: false,
            message:
                "Please enter your password."
        };

    }


    return {

        valid: true,

        data: {

            username:
                username,

            password:
                password

        }

    };

}


/* =========================================
   PASSWORD SHOW / HIDE
========================================= */

const passwordToggle =
    document.getElementById(
        "passwordToggle"
    );


if (
    passwordInput &&
    passwordToggle
) {

    passwordToggle.addEventListener(
        "click",
        function () {

            const isPassword =
                passwordInput.type ===
                "password";


            if (isPassword) {

                passwordInput.type =
                    "text";

                passwordToggle.textContent =
                    "🙈";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type =
                    "password";

                passwordToggle.textContent =
                    "👁️";

                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


/* =========================================
   CLEAR ERROR WHEN USER TYPES
========================================= */

[
    usernameInput,
    passwordInput

].forEach(
    function (input) {

        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            function () {

                hideLoginMessage();

            }
        );

    }
);
/* =========================================
   LOGIN REQUEST
========================================= */

async function loginUser() {

    hideLoginMessage();


    /* -------------------------------------
       VALIDATE FORM
    ------------------------------------- */

    const validation =
        validateLoginForm();


    if (!validation.valid) {

        showLoginMessage(
            validation.message,
            "error"
        );

        return;

    }


    const loginData =
        validation.data;


    /* -------------------------------------
       LOADING
    ------------------------------------- */

    setLoginLoading(true);


    try {

        /* ---------------------------------
           SEND LOGIN REQUEST
        --------------------------------- */

        const response =
            await fetch(
                "/api/auth/login",
                {
                    method: "POST",

                    credentials: "include",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            username:
                                loginData.username,

                            password:
                                loginData.password

                        })

                }
            );


        /* ---------------------------------
           SERVER RESPONSE
        --------------------------------- */

        let data;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Invalid server response:",
                jsonError
            );


            showLoginMessage(
                "The server returned an invalid response.",
                "error"
            );

            return;

        }


        /* ---------------------------------
           LOGIN FAILED
        --------------------------------- */

        if (!response.ok) {

            showLoginMessage(

                data.message ||
                "Invalid username or password.",

                "error"

            );

            return;

        }


        /* ---------------------------------
           LOGIN SUCCESS
        --------------------------------- */

        if (
            data.success === true &&
            data.authenticated === true
        ) {

            showLoginMessage(

                "Login successful! Redirecting...",

                "success"

            );


            /* -----------------------------
               PROFILE STATUS
            ----------------------------- */

            if (
                data.profileCompleted === true
            ) {

                setTimeout(
                    function () {

                        window.location.replace(
                            "/dashboard/dashboard.html"
                        );

                    },
                    600
                );

            } else {

                setTimeout(
                    function () {

                        window.location.replace(
                            "/auth/profile.html"
                        );

                    },
                    600
                );

            }


            return;

        }


        /* ---------------------------------
           UNKNOWN RESPONSE
        --------------------------------- */

        showLoginMessage(

            "Login could not be completed.",

            "error"

        );


    } catch (error) {

        console.error(
            "Login request failed:",
            error
        );


        showLoginMessage(

            "Unable to connect to the server. Please try again.",

            "error"

        );

    } finally {

        setLoginLoading(false);

    }

}


/* =========================================
   FORM SUBMIT
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            loginUser();

        }
    );

}
/* =========================================
   CHECK EXISTING SESSION
========================================= */

async function checkExistingSession() {

    try {

        const response =
            await fetch(
                "/api/auth/session",
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        /*
         * If the student is already logged in,
         * there is no reason to show login again.
         */

        if (
            data.authenticated === true
        ) {

            if (
                data.profileCompleted === true
            ) {

                window.location.replace(
                    "/dashboard/dashboard.html"
                );

            } else {

                window.location.replace(
                    "/auth/profile.html"
                );

            }

        }

    } catch (error) {

        /*
         * Do not block the login page
         * if the session check fails.
         */

        console.warn(
            "Session check failed:",
            error
        );

    }

}


/* =========================================
   PREVENT DOUBLE LOGIN
========================================= */

let loginInProgress =
    false;


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (loginInProgress) {

                return;

            }


            loginInProgress =
                true;


            try {

                await loginUser();

            } finally {

                loginInProgress =
                    false;

            }

        }
    );

}


/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🎓 Student Digital Hub Login"
        );

        console.log(
            "🔐 Custom authentication enabled"
        );

        console.log(
            "✅ Login system initialized"
        );


        /*
         * Check whether a valid session
         * already exists.
         */

        checkExistingSession();

    }
);