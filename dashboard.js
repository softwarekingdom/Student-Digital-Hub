/* =========================================
   STUDENT DIGITAL HUB
   DASHBOARD JS — PART 1
========================================= */


/* =========================================
   MOBILE SIDEBAR
========================================= */

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.querySelector(".sidebar");


if (menuButton && sidebar) {

    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle("sidebar-open");

    });

}


/* =========================================
   CLOSE SIDEBAR
   WHEN NAVIGATION ITEM IS CLICKED
========================================= */

const navigationItems =
    document.querySelectorAll(
        ".sidebar-navigation .nav-item"
    );


navigationItems.forEach((item) => {

    item.addEventListener("click", () => {

        if (
            window.innerWidth <= 850 &&
            sidebar
        ) {

            sidebar.classList.remove(
                "sidebar-open"
            );

        }

    });

});
/* =========================================
   STUDENT DIGITAL HUB
   DASHBOARD JS — PART 2
========================================= */


/* =========================================
   DASHBOARD DEFAULT VALUES
========================================= */

const totalSubjects =
    document.getElementById("totalSubjects");

const pendingAssignments =
    document.getElementById("pendingAssignments");

const activeGoals =
    document.getElementById("activeGoals");

const studyHours =
    document.getElementById("studyHours");

const overallProgress =
    document.getElementById("overallProgress");


/*
   இவை தற்போது placeholder values.
   பின்னர் Supabase மூலம் உண்மையான
   மாணவர் தரவுகள் இங்கே வரும்.
*/

if (totalSubjects) {
    totalSubjects.textContent = "--";
}

if (pendingAssignments) {
    pendingAssignments.textContent = "--";
}

if (activeGoals) {
    activeGoals.textContent = "--";
}

if (studyHours) {
    studyHours.textContent = "--";
}

if (overallProgress) {
    overallProgress.textContent = "--";
}


/* =========================================
   UPCOMING ASSIGNMENTS
========================================= */

const upcomingAssignments =
    document.getElementById(
        "upcomingAssignments"
    );


if (upcomingAssignments) {

    upcomingAssignments.innerHTML = `
        <span>📝</span>
        <p>இன்னும் பணிகள் இல்லை</p>
    `;

}


/* =========================================
   TODAY'S SCHEDULE
========================================= */

const todaySchedule =
    document.getElementById(
        "todaySchedule"
    );


if (todaySchedule) {

    todaySchedule.innerHTML = `
        <span>📅</span>
        <p>இன்றைக்கு எந்த அட்டவணையும் இல்லை</p>
    `;

}


/* =========================================
   WEEKLY ACTIVITY
========================================= */

const weeklyActivityChart =
    document.getElementById(
        "weeklyActivityChart"
    );


if (weeklyActivityChart) {

    weeklyActivityChart.innerHTML = `
        <div>
            📈
            <br>
            <span>
                உங்கள் வாராந்திர படிப்பு
                செயல்பாடு இங்கே தோன்றும்
            </span>
        </div>
    `;

}