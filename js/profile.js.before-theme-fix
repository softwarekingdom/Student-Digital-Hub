document.addEventListener("DOMContentLoaded", () => {

    const profileForm =
        document.getElementById("profileForm");

    const avatarFile =
        document.getElementById("avatar_file");

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
       PREVIEW SELECTED PHOTO
    ========================================= */

    function previewPhoto(file) {

        if (!file) {
            avatarPreview.innerHTML = "👤";
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {

            avatarPreview.innerHTML = "";

            const image =
                document.createElement("img");

            image.src = reader.result;
            image.alt = "Profile Picture";

            avatarPreview.appendChild(image);
        };

        reader.readAsDataURL(file);
    }


    /* =========================================
       PHOTO SELECTION
    ========================================= */

    if (avatarFile) {

        avatarFile.addEventListener(
            "change",
            function () {

                const file =
                    avatarFile.files[0];

                if (!file) {
                    return;
                }


                /* MAXIMUM 5 MB */

                const maxSize =
                    5 * 1024 * 1024;

                if (file.size > maxSize) {

                    showMessage(
                        "Photo must be smaller than 5 MB.",
                        "error"
                    );

                    avatarFile.value = "";

                    avatarPreview.innerHTML =
                        "👤";

                    return;
                }


                /* ALLOWED IMAGE TYPES */

                const allowedTypes = [
                    "image/jpeg",
                    "image/png"
                ];

                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    showMessage(
                        "Only JPG and PNG photos are allowed.",
                        "error"
                    );

                    avatarFile.value = "";

                    avatarPreview.innerHTML =
                        "👤";

                    return;
                }


                showMessage("", "");

                previewPhoto(file);
            }
        );
    }


    /* =========================================
       LOAD EXISTING PROFILE
    ========================================= */

    async function loadProfile() {

        try {

            const response =
                await fetch(
                    "/api/auth/profile",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                data.authenticated === false
            ) {

                window.location.href =
                    "/index.html";

                return;
            }


            const profile =
                data.profile;


            if (!profile) {
                return;
            }


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


            /* EXISTING PROFILE PHOTO */

            if (profile.avatar_url) {

                avatarPreview.innerHTML = "";

                const image =
                    document.createElement("img");

                image.src =
                    profile.avatar_url;

                image.alt =
                    "Profile Picture";

                image.onerror = function () {

                    avatarPreview.innerHTML =
                        "👤";
                };

                avatarPreview.appendChild(
                    image
                );
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
        async function (event) {

            event.preventDefault();


            /* FORM DATA */

            const formData =
                new FormData();


            formData.append(
                "bio",
                document
                    .getElementById("bio")
                    .value
                    .trim()
            );

            formData.append(
                "grade",
                document
                    .getElementById("grade")
                    .value
                    .trim()
            );

            formData.append(
                "school",
                document
                    .getElementById("school")
                    .value
                    .trim()
            );

            formData.append(
                "district",
                document
                    .getElementById("district")
                    .value
                    .trim()
            );

            formData.append(
                "ambition",
                document
                    .getElementById("ambition")
                    .value
                    .trim()
            );


            /* PHOTO */

            if (
                avatarFile &&
                avatarFile.files.length > 0
            ) {

                formData.append(
                    "avatar",
                    avatarFile.files[0]
                );
            }


            /* LOADING */

            saveButton.disabled = true;

            buttonText.classList.add(
                "hidden"
            );

            buttonLoader.classList.remove(
                "hidden"
            );

            profileMessage.className =
                "profile-message";


            try {

                const response =
                    await fetch(
                        "/api/auth/profile",
                        {
                            method: "PUT",
                            credentials: "include",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    data.success === false
                ) {

                    throw new Error(
                        data.message ||
                        "Unable to save profile."
                    );
                }


                showMessage(
                    "Profile saved successfully!",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "/dashboard.html";

                    },
                    800
                );


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
