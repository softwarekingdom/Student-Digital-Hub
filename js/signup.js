/* =========================================
   STUDENT DIGITAL HUB
   CUSTOM SIGNUP SYSTEM
========================================= */


/* =========================================
   DOM ELEMENTS
========================================= */

const signupForm =
    document.getElementById(
        "signupForm"
    );

const fullNameInput =
    document.getElementById(
        "fullName"
    );

const usernameInput =
    document.getElementById(
        "username"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

const termsInput =
    document.getElementById(
        "terms"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const submitButton =
    document.getElementById(
        "signupButton"
    );


/* =========================================
   PAGE CHECK
========================================= */

if (!signupForm) {

    console.error(
        "❌ Signup form not found."
    );

}


/* =========================================
   MESSAGE HELPER
========================================= */

function showMessage(
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


function hideMessage() {

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
   BUTTON LOADING
========================================= */

function setLoading(
    loading
) {

    if (!submitButton) {
        return;
    }


    submitButton.disabled =
        loading;


    if (loading) {

        submitButton.dataset
            .originalText =
            submitButton.innerHTML;

        submitButton.innerHTML =
            `
            <span class="button-loader">
                Creating account...
            </span>
            `;

    } else {

        submitButton.innerHTML =
            submitButton.dataset
                .originalText ||
            "Create Account";

    }

}
/* =========================================
   VALIDATION
========================================= */


/* =========================================
   FULL NAME
========================================= */

function validateFullName() {

    const fullName =
        fullNameInput.value.trim();


    if (fullName.length < 2) {

        return {
            valid: false,
            message:
                "Please enter your full name."
        };

    }


    if (fullName.length > 100) {

        return {
            valid: false,
            message:
                "Full name is too long."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   USERNAME
========================================= */

function validateUsername() {

    const username =
        usernameInput.value
            .trim()
            .toLowerCase();


    /*
     * Only:
     * a-z
     * 0-9
     * _
     *
     * 3-30 characters
     */

    const usernamePattern =
        /^[a-z0-9_]{3,30}$/;


    if (!username) {

        return {
            valid: false,
            message:
                "Please enter a username."
        };

    }


    if (
        !usernamePattern.test(
            username
        )
    ) {

        return {
            valid: false,
            message:
                "Username must contain 3–30 letters, numbers or underscore."
        };

    }


    return {
        valid: true,
        value: username
    };

}


/* =========================================
   PASSWORD
========================================= */

function validatePassword() {

    const password =
        passwordInput.value;


    if (!password) {

        return {
            valid: false,
            message:
                "Please enter a password."
        };

    }


    if (password.length < 8) {

        return {
            valid: false,
            message:
                "Password must contain at least 8 characters."
        };

    }


    if (password.length > 128) {

        return {
            valid: false,
            message:
                "Password cannot exceed 128 characters."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   CONFIRM PASSWORD
========================================= */

function validateConfirmPassword() {

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    if (!confirmPassword) {

        return {
            valid: false,
            message:
                "Please confirm your password."
        };

    }


    if (
        password !==
        confirmPassword
    ) {

        return {
            valid: false,
            message:
                "Passwords do not match."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   TERMS
========================================= */

function validateTerms() {

    if (
        !termsInput ||
        !termsInput.checked
    ) {

        return {
            valid: false,
            message:
                "Please accept the Terms and Conditions."
        };

    }


    return {
        valid: true
    };

}


/* =========================================
   COMPLETE FORM VALIDATION
========================================= */

function validateSignupForm() {

    const nameResult =
        validateFullName();


    if (!nameResult.valid) {

        return nameResult;

    }


    const usernameResult =
        validateUsername();


    if (!usernameResult.valid) {

        return usernameResult;

    }


    const passwordResult =
        validatePassword();


    if (!passwordResult.valid) {

        return passwordResult;

    }


    const confirmResult =
        validateConfirmPassword();


    if (!confirmResult.valid) {

        return confirmResult;

    }


    const termsResult =
        validateTerms();


    if (!termsResult.valid) {

        return termsResult;

    }


    return {
        valid: true,

        data: {

            fullName:
                fullNameInput.value
                    .trim(),

            username:
                usernameInput.value
                    .trim()
                    .toLowerCase(),

            password:
                passwordInput.value

        }
    };

}


/* =========================================
   LIVE USERNAME NORMALIZATION
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
   BACKEND SIGNUP
========================================= */

async function createAccount() {

    hideMessage();


    /* -------------------------------------
       VALIDATE FORM
    ------------------------------------- */

    const validation =
        validateSignupForm();


    if (!validation.valid) {

        showMessage(
            validation.message,
            "error"
        );

        return;

    }


    const formData =
        validation.data;


    /* -------------------------------------
       START LOADING
    ------------------------------------- */

    setLoading(true);


    try {

        /* ---------------------------------
           SEND DATA TO BACKEND
        --------------------------------- */

        const response =
            await fetch(
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
                            formData.fullName,

                        username:
                            formData.username,

                        password:
                            formData.password

                    })
                }
            );


        /* ---------------------------------
           READ SERVER RESPONSE
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


            showMessage(
                "The server returned an invalid response.",
                "error"
            );

            return;

        }


        /* ---------------------------------
           SERVER ERROR
        --------------------------------- */

        if (!response.ok) {

            showMessage(

                data.message ||
                "Unable to create your account.",

                "error"

            );

            return;

        }


        /* ---------------------------------
           SUCCESS
        --------------------------------- */

        if (
            data.success === true
        ) {

            showMessage(

                "Account created successfully! Redirecting...",

                "success"

            );


            /*
             * Give the user a short moment
             * to see the success message.
             */

            setTimeout(
                function () {

                    /*
                     * New account has no
                     * completed profile yet.
                     */

                    window.location.replace(
                        "/auth/profile.html"
                    );

                },
                800
            );


            return;

        }


        /* ---------------------------------
           UNKNOWN RESPONSE
        --------------------------------- */

        showMessage(

            "Unable to create your account.",

            "error"

        );

    } catch (error) {

        console.error(
            "Signup request failed:",
            error
        );


        /* ---------------------------------
           NETWORK ERROR
        --------------------------------- */

        showMessage(

            "Unable to connect to the server. Please try again.",

            "error"

        );

    } finally {

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
   PASSWORD SHOW / HIDE
========================================= */

function setupPasswordToggle(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(
            inputId
        );

    const button =
        document.getElementById(
            buttonId
        );


    if (!input || !button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            const isPassword =
                input.type === "password";


            if (isPassword) {

                input.type = "text";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                button.textContent =
                    "🙈";

            } else {

                input.type = "password";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );

                button.textContent =
                    "👁️";

            }

        }
    );

}


/* =========================================
   SETUP PASSWORD TOGGLES
========================================= */

setupPasswordToggle(
    "password",
    "passwordToggle"
);


setupPasswordToggle(
    "confirmPassword",
    "confirmPasswordToggle"
);


/* =========================================
   CLEAR MESSAGE WHEN USER TYPES
========================================= */

const signupInputs = [

    fullNameInput,
    usernameInput,
    passwordInput,
    confirmPasswordInput

];


signupInputs.forEach(
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


/* =========================================
   PREVENT DOUBLE SUBMISSION
========================================= */

let signupInProgress =
    false;


const originalCreateAccount =
    createAccount;


async function safeCreateAccount() {

    if (signupInProgress) {
        return;
    }


    signupInProgress = true;


    try {

        await originalCreateAccount();

    } finally {

        signupInProgress = false;

    }

}


/* =========================================
   FINAL FORM HANDLER
========================================= */

if (signupForm) {

    signupForm.removeEventListener(
        "submit",
        function () {}
    );

}


/*
 * The original submit listener
 * already calls createAccount().
 *
 * Therefore we don't attach another
 * submit listener here.
 */


/* =========================================
   PAGE READY
========================================= */

console.log(
    "🎓 Student Digital Hub Signup"
);

console.log(
    "🔐 Custom authentication enabled"
);

console.log(
    "✅ Signup system initialized"
);