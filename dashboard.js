/* ========================================
   STUDENT DIGITAL HUB
   DASHBOARD JAVASCRIPT
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log(
        "Student Digital Hub Dashboard loaded."
    );


    /* ========================================
       LOAD PROFILE DATA
       ======================================== */

    async function loadDashboardProfile() {

        const studentName =
            document.getElementById(
                "dashboardStudentName"
            );


        const studentGrade =
            document.getElementById(
                "dashboardStudentGrade"
            );


        const greeting =
            document.getElementById(
                "dashboardGreeting"
            );


        const profileImage =
            document.getElementById(
                "dashboardProfileImage"
            );


        const defaultName =
            "Student";


        const defaultGrade =
            "Student";


        const defaultImage =
            "assets/images/default-avatar.png";


        try {

            const response =
                await fetch(
                    "/api/auth/profile",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Profile API error: ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                !data.success ||
                !data.profile
            ) {

                throw new Error(
                    "Profile data unavailable."
                );

            }


            const profile =
                data.profile;


            /* ------------------------------
               Real Name
               ------------------------------ */

            const realName =
                profile.username ||
                defaultName;


            if (studentName) {

                studentName.textContent =
                    realName;

            }


            /* ------------------------------
               Real Grade
               ------------------------------ */

            const realGrade =
                profile.grade ||
                defaultGrade;


            if (studentGrade) {

                studentGrade.textContent =
                    realGrade;

            }


            /* ------------------------------
               Profile Photo
               ------------------------------ */

            if (profileImage) {

                const avatarUrl =
                    profile.avatar_url;


                if (
                    avatarUrl &&
                    avatarUrl.trim() !== ""
                ) {

                    profileImage.src =
                        avatarUrl;

                } else {

                    profileImage.src =
                        defaultImage;

                }

            }


            /* ------------------------------
               Welcome Message
               ------------------------------ */

            if (greeting) {

                greeting.textContent =
                    `Welcome back, ${realName}!`;

            }


            console.log(
                "Dashboard profile loaded successfully."
            );


        } catch (error) {

            console.error(
                "Dashboard profile loading failed:",
                error
            );


            /* ------------------------------
               Fallback
               ------------------------------ */

            if (studentName) {

                studentName.textContent =
                    defaultName;

            }


            if (studentGrade) {

                studentGrade.textContent =
                    defaultGrade;

            }


            if (profileImage) {

                profileImage.src =
                    defaultImage;

            }


            if (greeting) {

                greeting.textContent =
                    "Welcome back!";

            }

        }

    }


    /* ========================================
       DYNAMIC GREETING
       ======================================== */

    const welcomeLabel =
        document.querySelector(
            ".welcome-label"
        );


    function updateDashboardGreeting() {

        if (!welcomeLabel) {
            return;
        }


        const currentHour =
            new Date().getHours();


        let greetingText;


        if (
            currentHour >= 5 &&
            currentHour < 12
        ) {

            greetingText =
                "Good morning 👋";

        } else if (
            currentHour >= 12 &&
            currentHour < 17
        ) {

            greetingText =
                "Good afternoon 👋";

        } else if (
            currentHour >= 17 &&
            currentHour < 22
        ) {

            greetingText =
                "Good evening 👋";

        } else {

            greetingText =
                "Good night 👋";

        }


        welcomeLabel.textContent =
            greetingText;

    }


    updateDashboardGreeting();


    /* ========================================
       PROFILE IMAGE FALLBACK
       ======================================== */

    const dashboardProfileImage =
        document.getElementById(
            "dashboardProfileImage"
        );


    if (dashboardProfileImage) {

        dashboardProfileImage.addEventListener(
            "error",
            () => {

                dashboardProfileImage.src =
                    "assets/images/default-avatar.png";

            }
        );

    }


    /* ========================================
       LOAD PROFILE
       ======================================== */

    loadDashboardProfile();


    /* ========================================
       LOGOUT
       ======================================== */

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {
                    return;
                }


                try {

                    const response =
                        await fetch(
                            "/api/auth/logout",
                            {
                                method: "POST",
                                credentials: "include"
                            }
                        );


                    if (response.ok) {

                        window.location.href =
                            "login.html";

                    } else {

                        alert(
                            "Logout failed. Please try again."
                        );

                    }


                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );


                    alert(
                        "Unable to connect to the server."
                    );

                }

            }
        );

    }


    /* ========================================
       NOTIFICATIONS
       ======================================== */

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );


    const notificationBadge =
        document.getElementById(
            "notificationBadge"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                console.log(
                    "Notifications clicked."
                );

            }
        );

    }


    /* ========================================
       STUDY OVERVIEW
       ======================================== */

    const subjectsCount =
        document.getElementById(
            "subjectsCount"
        );


    const assignmentsCount =
        document.getElementById(
            "assignmentsCount"
        );


    const goalsCount =
        document.getElementById(
            "goalsCount"
        );


    const studyTimeValue =
        document.getElementById(
            "studyTimeValue"
        );


    /*
     * Real data will be connected
     * during Phase 4.
     *
     * Until then, "--" is displayed
     * instead of fake numbers.
     */


    /* ========================================
       TODAY'S STUDY
       ======================================== */

    const todayStudyList =
        document.getElementById(
            "todayStudyList"
        );


    const todayStudyEmpty =
        document.getElementById(
            "todayStudyEmpty"
        );


    /*
     * Real timetable data will be loaded
     * during the database integration phase.
     *
     * For now, the empty state is displayed.
     */


    /* ========================================
       STUDY PROGRESS
       ======================================== */

    const studyProgressList =
        document.getElementById(
            "studyProgressList"
        );


    const studyProgressEmpty =
        document.getElementById(
            "studyProgressEmpty"
        );


    /*
     * Real subject progress will be
     * loaded from the database later.
     *
     * No fake percentages are used.
     */


    /* ========================================
       GOALS PREVIEW
       ======================================== */

    const dashboardGoalsList =
        document.getElementById(
            "dashboardGoalsList"
        );


    const dashboardGoalsEmpty =
        document.getElementById(
            "dashboardGoalsEmpty"
        );


    /*
     * Real goals will be loaded
     * from the database during
     * Phase 4.
     *
     * No fake goal data is used.
     */

});


/* ========================================
   PHASE 3 — DASHBOARD THEME SYSTEM
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {

    async function loadDashboardTheme() {
        try {
            const response = await fetch("/api/auth/theme", {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Theme API error: ${response.status}`);
            }

            const data = await response.json();

            const theme = data.theme || "default";

            document.documentElement.setAttribute(
                "data-theme",
                theme
            );

            console.log("Dashboard theme loaded:", theme);

        } catch (error) {

            console.error(
                "Dashboard theme loading failed:",
                error
            );

            document.documentElement.setAttribute(
                "data-theme",
                "default"
            );
        }
    }

    loadDashboardTheme();

});
