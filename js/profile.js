document.addEventListener("DOMContentLoaded", () => {

const profileForm =
    document.getElementById("profileForm");

const avatarUrl =
    document.getElementById("avatar_url");

const avatarPreview =
    document.getElementById("avatarPreview");

const profileMessage =
    document.getElementById("profileMessage");

const saveButton =
    document.getElementById("saveProfileBtn");

const buttonText =
    document.getElementById("buttonText");

const buttonLoader =
    document.getElementById("buttonLoader");


/* =========================================
   SHOW MESSAGE
========================================= */

function showMessage(message, type) {

    profileMessage.textContent = message;

    profileMessage.className =
        "profile-message " + type;
}


/* =========================================
   AVATAR PREVIEW
========================================= */

avatarUrl.addEventListener("input", () => {

    const url =
        avatarUrl.value.trim();

    if (!url) {

        avatarPreview.innerHTML = "👤";

        return;
    }

    avatarPreview.innerHTML = "";

    const image =
        document.createElement("img");

    image.src = url;

    image.alt = "Profile Picture";

    image.onload = () => {

        avatarPreview.innerHTML = "";

        avatarPreview.appendChild(image);

    };

    image.onerror = () => {

        avatarPreview.innerHTML = "👤";

    };

});


/* =========================================
   LOAD EXISTING PROFILE
========================================= */

async function loadProfile() {

    try {

        const response =
            await fetch("/api/auth/profile", {
                method: "GET",
                credentials: "include"
            });

        const data =
            await response.json();


        if (!response.ok ||
            data.authenticated === false) {

            window.location.href =
                "/index.html";

            return;
        }


        const profile =
            data.profile;


        if (!profile) {
            return;
        }


        /* PROFILE DATA */

        document.getElementById("avatar_url").value =
            profile.avatar_url || "";

        document.getElementById("bio").value =
            profile.bio || "";

        document.getElementById("grade").value =
            profile.grade || "";

        document.getElementById("school").value =
            profile.school || "";

        document.getElementById("district").value =
            profile.district || "";

        document.getElementById("ambition").value =
            profile.ambition || "";

        document.getElementById("hobby").value =
            profile.hobby || "";

        document.getElementById("gender").value =
            profile.gender || "";

        document.getElementById("other_details").value =
            profile.other_details || "";


        /* AVATAR */

        if (profile.avatar_url) {

            avatarPreview.innerHTML = "";

            const image =
                document.createElement("img");

            image.src =
                profile.avatar_url;

            image.alt =
                "Profile Picture";

            image.onerror = () => {

                avatarPreview.innerHTML =
                    "👤";

            };

            avatarPreview.appendChild(image);
        }


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        showMessage(
            "Unable to load your profile.",
            "error"
        );

    }

}


/* =========================================
   SAVE PROFILE
========================================= */

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const profileData = {

            avatar_url:
                avatarUrl.value.trim() || null,

            bio:
                document
                    .getElementById("bio")
                    .value
                    .trim() || null,

            grade:
                document
                    .getElementById("grade")
                    .value
                    .trim() || null,

            school:
                document
                    .getElementById("school")
                    .value
                    .trim() || null,

            district:
                document
                    .getElementById("district")
                    .value
                    .trim() || null,

            ambition:
                document
                    .getElementById("ambition")
                    .value
                    .trim() || null,

            hobby:
                document
                    .getElementById("hobby")
                    .value
                    .trim() || null,

            gender:
                document
                    .getElementById("gender")
                    .value || null,

            other_details:
                document
                    .getElementById("other_details")
                    .value
                    .trim() || null

        };


        /* LOADING STATE */

        saveButton.disabled = true;

        buttonText.classList.add("hidden");

        buttonLoader.classList.remove("hidden");

        profileMessage.className =
            "profile-message";


        try {

            const response =
                await fetch(
                    "/api/auth/profile",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(
                                profileData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok ||
                data.success === false) {

                throw new Error(
                    data.message ||
                    "Unable to save profile."
                );

            }


            /* SUCCESS */

            showMessage(
                "Profile saved successfully!",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "/dashboard.html";

            }, 800);


        } catch (error) {

            console.error(
                "Profile save error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to save your profile.",
                "error"
            );


        } finally {

            saveButton.disabled = false;

            buttonText.classList.remove(
                "hidden"
            );

            buttonLoader.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================
   START
========================================= */

loadProfile();

});