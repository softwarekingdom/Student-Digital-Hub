/* =========================================
   STUDENT DIGITAL HUB
   SIGNUP SYSTEM
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const signupForm =
    document.getElementById("signupForm");

const fullNameInput =
    document.getElementById("fullName");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const termsInput =
    document.getElementById("terms");

const signupButton =
    document.getElementById("signupButton");

const signupButtonText =
    document.getElementById("signupButtonText");

const signupLoader =
    document.getElementById("signupLoader");

const formMessage =
    document.getElementById("formMessage");

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(message, type = "error") {

    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;

    formMessage.className =
        `form-message ${type}`;

    formMessage.hidden = false;
}


/* =========================================
   HIDE MESSAGE
========================================= */

function hideMessage() {

    if (!formMessage) {
        return;
    }

    formMessage.hidden = true;

    formMessage.textContent = "";

}


/* =========================================
   PASSWORD TOGGLE
========================================= */

function setupPasswordToggle(
    button,
    input
) {

    if (!button || !input) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            if (input.type === "password") {

                input.type = "text";

                button.textContent = "🙈";

            } else {

                input.type = "password";

                button.textContent = "👁";

            }

        }
    );

}


setupPasswordToggle(
    togglePassword,
    passwordInput
);


setupPasswordToggle(
    toggleConfirmPassword,
    confirmPasswordInput
);


/* =========================================
   USERNAME VALIDATION
========================================= */

function validateUsername(username) {

    /*
     * Allowed:
     * letters
     * numbers
     * underscore
     */

    const usernamePattern =
        /^[a-zA-Z0-9_]+$/;

    if (username.length < 3) {

        return {
            valid: false,
            message:
                "Username must contain at least 3 characters."
        };

    }


    if (username.length > 30) {

        return {
            valid: false,
            message:
                "Username cannot exceed 30 characters."
        };

    }


    if (!usernamePattern.test(username)) {

        return {
            valid: false,
            message:
                "Username can only contain letters, numbers and underscore."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   PASSWORD VALIDATION
========================================= */

function validatePassword(password) {

    if (password.length < 8) {

        return {
            valid: false,
            message:
                "Password must contain at least 8 characters."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(isLoading) {

    if (!signupButton) {
        return;
    }


    signupButton.disabled =
        isLoading;


    if (isLoading) {

        signupButtonText.hidden =
            true;

        signupLoader.hidden =
            false;

    } else {

        signupButtonText.hidden =
            false;

        signupLoader.hidden =
            true;

    }

}


/* =========================================
   SIGNUP REQUEST
========================================= */

async function createAccount() {

    const fullName =
        fullNameInput.value.trim();

    const username =
        usernameInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    /* -------------------------------------
       FULL NAME
    ------------------------------------- */

    if (fullName.length < 2) {

        showMessage(
            "Please enter your full name."
        );

        fullNameInput.focus();

        return;

    }


    /* -------------------------------------
       USERNAME
    ------------------------------------- */

    const usernameResult =
        validateUsername(username);


    if (!usernameResult.valid) {

        showMessage(
            usernameResult.message
        );

        usernameInput.focus();

        return;

    }


    /* -------------------------------------
       PASSWORD
    ------------------------------------- */

    const passwordResult =
        validatePassword(password);


    if (!passwordResult.valid) {

        showMessage(
            passwordResult.message
        );

        passwordInput.focus();

        return;

    }


    /* -------------------------------------
       CONFIRM PASSWORD
    ------------------------------------- */

    if (password !== confirmPassword) {

        showMessage(
            "Passwords do not match."
        );

        confirmPasswordInput.focus();

        return;

    }


    /* -------------------------------------
       TERMS
    ------------------------------------- */

    if (!termsInput.checked) {

        showMessage(
            "Please accept the Terms and Privacy Policy."
        );

        return;

    }


    /* -------------------------------------
       START LOADING
    ------------------------------------- */

    hideMessage();

    setLoading(true);


    try {

        /*
         * IMPORTANT
         *
         * This endpoint belongs to our
         * custom authentication backend.
         *
         * Supabase Auth is NOT used.
         */

        const response = await fetch(
            "/api/auth/signup",
            {
                method: "POST",

                credentials: "include",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body: JSON.stringify({

                    fullName:
                        fullName,

                    username:
                        username,

                    password:
                        password

                })
            }
        );


        let data = null;


        try {

            data =
                await response.json();

        } catch (jsonError) {

            data = null;

        }


        /* -------------------------------------
           SERVER ERROR
        ------------------------------------- */

        if (!response.ok) {

            const serverMessage =
                data?.message ||
                "Unable to create your account.";

            showMessage(
                serverMessage
            );

            setLoading(false);

            return;

        }


        /* -------------------------------------
           SUCCESS
        ------------------------------------- */

        showMessage(
            "Account created successfully! Redirecting...",
            "success"
        );


        /*
         * Backend may return:
         *
         * authenticated: true
         *
         * or simply:
         *
         * success: true
         */

        if (
            data?.authenticated === true ||
            data?.success === true
        ) {

            setTimeout(
                function () {

                    if (
                        data.profileCompleted === true
                    ) {

                        window.location.replace(
                            "../dashboard/dashboard.html"
                        );

                    } else {

                        window.location.replace(
                            "profile.html"
                        );

                    }

                },
                700
            );

            return;

        }


        /*
         * If backend creates the account
         * but does not automatically login,
         * send the user to login.
         */

        setTimeout(
            function () {

                window.location.replace(
                    "login.html"
                );

            },
            900
        );


    } catch (error) {

        console.error(
            "Signup error:",
            error
        );


        showMessage(
            "Unable to connect to the server. Please try again."
        );


        setLoading(false);

    }

}


/* =========================================
   FORM SUBMIT
========================================= */

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            createAccount();

        }
    );

}


/* =========================================
   USERNAME CLEANUP
========================================= */

if (usernameInput) {

    usernameInput.addEventListener(
        "input",
        function () {

            /*
             * Keep username clean.
             */

            this.value =
                this.value
                    .replace(/\s/g, "")
                    .toLowerCase();

        }
    );

}


/* =========================================
   CLEAR ERROR WHEN USER TYPES
========================================= */

[
    fullNameInput,
    usernameInput,
    passwordInput,
    confirmPasswordInput
].forEach(
    function (input) {

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            function () {

                if (
                    formMessage &&
                    !formMessage.hidden
                ) {

                    hideMessage();

                }

            }
        );

    }
);