/* =========================================
   AI TIMETABLE — PART 1A
========================================= */

"use strict";


/*
    Backend address.

    இதை பின்னர் Render deployment URL-க்கு
    மாற்றுவோம்.
*/

/* ================================= */
/* RENDER BACKEND CONFIG */
/* ================================= */

const API_URL =
    "https://student-digital-hub.onrender.com";

/*
    IMPORTANT:

    இங்கே Student UUID hardcode செய்யவில்லை.

    Login செய்யப்பட்ட மாணவனின் student_id/session
    பின்னர் இங்கே dynamic-ஆக பெறப்படும்.
*/

let loggedInStudentId = null;


/*
    Generated timetable state
*/

let generatedTimetable = [];

let generatedPriorityOrder = [];


/* =========================================
   DOM ELEMENTS
========================================= */

const studentNameInput =
    document.getElementById("studentName");

const studentGradeInput =
    document.getElementById("studentGrade");

const wakeTimeInput =
    document.getElementById("wakeTime");

const sleepTimeInput =
    document.getElementById("sleepTime");

const schoolStartInput =
    document.getElementById("schoolStart");

const schoolEndInput =
    document.getElementById("schoolEnd");

const dailyStudyMinutesInput =
    document.getElementById("dailyStudyMinutes");

const breakMinutesInput =
    document.getElementById("breakMinutes");

const subjectsContainer =
    document.getElementById("subjectsContainer");

const addSubjectBtn =
    document.getElementById("addSubjectBtn");

const examModeInput =
    document.getElementById("examMode");

const addBusyTimeBtn =
    document.getElementById("addBusyTimeBtn");

const addBreakTimeBtn =
    document.getElementById("addBreakTimeBtn");

const busyTimesContainer =
    document.getElementById("busyTimesContainer");

const breakTimesContainer =
    document.getElementById("breakTimesContainer");

const generateBtn =
    document.getElementById("generateBtn");

const saveTimetableBtn =
    document.getElementById("saveTimetableBtn");

const generatorStatus =
    document.getElementById("generatorStatus");

const topTimetablePreview =
    document.getElementById("topTimetablePreview");

const finalTimetable =
    document.getElementById("finalTimetable");
/* =========================================
   SUBJECT MANAGEMENT
========================================= */

function addSubjectRow() {

    const row =
        document.createElement("div");

    row.className = "subject-row";


    row.innerHTML = `

        <input
            type="text"
            class="subject-name"
            placeholder="Subject name"
        >

        <select class="subject-priority">

            <option value="high">
                ⭐ High
            </option>

            <option value="medium" selected>
                🟡 Medium
            </option>

            <option value="low">
                🟢 Low
            </option>

        </select>

        <input
            type="number"
            class="subject-minutes"
            value="60"
            min="15"
            max="600"
            placeholder="Minutes"
        >

        <input
            type="date"
            class="subject-exam-date"
        >

    `;


    subjectsContainer.appendChild(row);
}


addSubjectBtn.addEventListener(
    "click",
    addSubjectRow
);


/* =========================================
   BUSY TIME
========================================= */

function addBusyTime() {

    const item =
        document.createElement("div");

    item.className =
        "dynamic-planner-item";


    item.innerHTML = `

        <input
            type="text"
            class="busy-title"
            placeholder="Busy activity"
        >

        <input
            type="time"
            class="busy-start"
        >

        <input
            type="time"
            class="busy-end"
        >

    `;


    busyTimesContainer.appendChild(item);
}


addBusyTimeBtn.addEventListener(
    "click",
    addBusyTime
);


/* =========================================
   BREAK TIME
========================================= */

function addBreakTime() {

    const item =
        document.createElement("div");

    item.className =
        "dynamic-planner-item";


    item.innerHTML = `

        <input
            type="text"
            class="break-title"
            placeholder="Break name"
        >

        <input
            type="time"
            class="break-start"
        >

        <input
            type="time"
            class="break-end"
        >

    `;


    breakTimesContainer.appendChild(item);
}


addBreakTimeBtn.addEventListener(
    "click",
    addBreakTime
);
/* =========================================
   COLLECT STUDENT INFORMATION
========================================= */

function collectStudentInfo() {

    return {

        name:
            studentNameInput.value.trim(),

        grade:
            studentGradeInput.value.trim(),

        wake_time:
            wakeTimeInput.value,

        sleep_time:
            sleepTimeInput.value,

        school_start_time:
            schoolStartInput.value,

        school_end_time:
            schoolEndInput.value,

        daily_study_minutes:
            Number(
                dailyStudyMinutesInput.value
            ),

        break_minutes:
            Number(
                breakMinutesInput.value
            ),

        exam_mode:
            examModeInput.checked
    };
}


/* =========================================
   COLLECT SUBJECTS
========================================= */

function collectSubjects() {

    const rows =
        document.querySelectorAll(
            ".subject-row"
        );


    const subjects = [];


    rows.forEach((row) => {

        const name =
            row
                .querySelector(".subject-name")
                .value
                .trim();


        if (!name) {
            return;
        }


        const priority =
            row
                .querySelector(".subject-priority")
                .value;


        const targetMinutes =
            Number(
                row
                    .querySelector(".subject-minutes")
                    .value
            );


        const examDate =
            row
                .querySelector(".subject-exam-date")
                .value;


        subjects.push({

            subject_name: name,

            priority: priority,

            target_minutes:
                targetMinutes,

            exam_date:
                examDate || null

        });

    });


    return subjects;
}


/* =========================================
   COLLECT BUSY TIMES
========================================= */

function collectBusyTimes() {

    const items =
        document.querySelectorAll(
            "#busyTimesContainer .dynamic-planner-item"
        );


    return Array.from(items).map((item) => ({

        title:
            item
                .querySelector(".busy-title")
                .value
                .trim(),

        start_time:
            item
                .querySelector(".busy-start")
                .value,

        end_time:
            item
                .querySelector(".busy-end")
                .value

    }));
}


/* =========================================
   COLLECT BREAK TIMES
========================================= */

function collectBreakTimes() {

    const items =
        document.querySelectorAll(
            "#breakTimesContainer .dynamic-planner-item"
        );


    return Array.from(items).map((item) => ({

        title:
            item
                .querySelector(".break-title")
                .value
                .trim(),

        start_time:
            item
                .querySelector(".break-start")
                .value,

        end_time:
            item
                .querySelector(".break-end")
                .value

    }));
}
/* =========================================
   PART 2A
   EXTRA PLANNER CONTROLS
========================================= */


/*
    இந்த API configuration-ஐ ஒரே இடத்தில்
    வைத்திருக்கிறோம்.

    Local:
    http://127.0.0.1:3000

    Render:
    https://YOUR-BACKEND.onrender.com

    பின்னர் ஒரு இடத்தை மட்டும் மாற்றினால் போதும்.
/* ================================= */
/* RENDER BACKEND CONFIG */
/* ================================= */



/* =========================================
   EXTRA DOM
========================================= */

const busyDetailsList =
    document.getElementById(
        "busyDetailsList"
    );


const breakDetailsList =
    document.getElementById(
        "breakDetailsList"
    );


const addBusyDetailBtn =
    document.getElementById(
        "addBusyDetailBtn"
    );


const addBreakDetailBtn =
    document.getElementById(
        "addBreakDetailBtn"
    );


const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );


const summaryStudent =
    document.getElementById(
        "summaryStudent"
    );


const summarySubjects =
    document.getElementById(
        "summarySubjects"
    );


const summaryStudy =
    document.getElementById(
        "summaryStudy"
    );


const summaryMode =
    document.getElementById(
        "summaryMode"
    );
/* =========================================
   ADD BUSY DETAIL
========================================= */

function createBusyDetail() {

    const row =
        document.createElement("div");

    row.className =
        "detail-row";


    row.innerHTML = `

        <input
            type="text"
            class="detail-title"
            placeholder="உதாரணம்: Tuition"
        >

        <select class="detail-day">

            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>

        </select>

        <input
            type="time"
            class="detail-start"
        >

        <input
            type="time"
            class="detail-end"
        >

    `;


    busyDetailsList.appendChild(row);
}


addBusyDetailBtn.addEventListener(
    "click",
    createBusyDetail
);


/* =========================================
   ADD BREAK DETAIL
========================================= */

function createBreakDetail() {

    const row =
        document.createElement("div");

    row.className =
        "detail-row";


    row.innerHTML = `

        <input
            type="text"
            class="detail-title"
            placeholder="உதாரணம்: Dinner"
        >

        <select class="detail-day">

            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>

        </select>

        <input
            type="time"
            class="detail-start"
        >

        <input
            type="time"
            class="detail-end"
        >

    `;


    breakDetailsList.appendChild(row);
}


addBreakDetailBtn.addEventListener(
    "click",
    createBreakDetail
);
/* =========================================
   PART 3A
   SCHOOL TIMETABLE
========================================= */

const schoolTimetableList =
    document.getElementById(
        "schoolTimetableList"
    );


const addSchoolClassBtn =
    document.getElementById(
        "addSchoolClassBtn"
    );


function createSchoolRow() {

    const row =
        document.createElement("div");

    row.className =
        "school-row";


    row.innerHTML = `

        <select class="school-day">

            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>

        </select>

        <input
            type="text"
            class="school-subject"
            placeholder="Subject"
        >

        <input
            type="time"
            class="school-start"
        >

        <input
            type="time"
            class="school-end"
        >

    `;


    schoolTimetableList.appendChild(row);
}


addSchoolClassBtn.addEventListener(
    "click",
    createSchoolRow
);


/* =========================================
   COLLECT SCHOOL TIMETABLE
========================================= */

function collectSchoolTimetable() {

    const rows =
        schoolTimetableList.querySelectorAll(
            ".school-row"
        );


    return Array.from(rows).map((row) => {

        return {

            day_of_week:
                row
                    .querySelector(".school-day")
                    .value,

            subject_name:
                row
                    .querySelector(".school-subject")
                    .value
                    .trim(),

            start_time:
                row
                    .querySelector(".school-start")
                    .value,

            end_time:
                row
                    .querySelector(".school-end")
                    .value

        };

    }).filter((item) => {

        return (
            item.subject_name ||
            item.start_time ||
            item.end_time
        );

    });
}
/* =========================================
   STUDY GOAL
========================================= */

const studyGoalInput =
    document.getElementById(
        "studyGoal"
    );


function getStudyStyle() {

    const selected =
        document.querySelector(
            'input[name="studyStyle"]:checked'
        );


    return selected
        ? selected.value
        : "balanced";
}


/* =========================================
   CHECK SUMMARY
========================================= */

const checkStudent =
    document.getElementById(
        "checkStudent"
    );


const checkSubjects =
    document.getElementById(
        "checkSubjects"
    );


const checkSchool =
    document.getElementById(
        "checkSchool"
    );


const checkStudyTime =
    document.getElementById(
        "checkStudyTime"
    );


const checkWake =
    document.getElementById(
        "checkWake"
    );


const checkSleep =
    document.getElementById(
        "checkSleep"
    );


const checkMode =
    document.getElementById(
        "checkMode"
    );


function updateInformationCheck() {

    const student =
        collectStudentInfo();

    const subjects =
        collectSubjects();

    const school =
        collectSchoolTimetable();


    checkStudent.textContent =
        student.name || "Not entered";


    checkSubjects.textContent =
        subjects.length;


    checkSchool.textContent =
        school.length > 0
            ? `${school.length} classes`
            : "Not entered";


    checkStudyTime.textContent =
        `${student.daily_study_minutes || 0} min/day`;


    checkWake.textContent =
        student.wake_time || "—";


    checkSleep.textContent =
        student.sleep_time || "—";


    checkMode.textContent =
        student.exam_mode
            ? "Exam Mode"
            : "Normal";
}
/* =========================================
   COMPLETE PLANNER DATA
========================================= */

function collectCompletePlannerData() {

    const student =
        collectStudentInfo();


    return {

        student: student,

        subjects:
            collectSubjects(),

        busy_times:
            collectDetailedBusyTimes(),

        break_times:
            collectDetailedBreakTimes(),

        school_timetable:
            collectSchoolTimetable(),

        study_goal:
            studyGoalInput.value.trim(),

        study_style:
            getStudyStyle()

    };
}


/* =========================================
   UPDATE CHECK WHEN USER TYPES
========================================= */

[
    studentNameInput,
    studentGradeInput,
    wakeTimeInput,
    sleepTimeInput,
    schoolStartInput,
    schoolEndInput,
    dailyStudyMinutesInput,
    breakMinutesInput,
    examModeInput,
    studyGoalInput
].forEach((element) => {

    element.addEventListener(
        "input",
        updateInformationCheck
    );

    element.addEventListener(
        "change",
        updateInformationCheck
    );

});


subjectsContainer.addEventListener(
    "input",
    updateInformationCheck
);


subjectsContainer.addEventListener(
    "change",
    updateInformationCheck
);


schoolTimetableList.addEventListener(
    "input",
    updateInformationCheck
);


schoolTimetableList.addEventListener(
    "change",
    updateInformationCheck
);


/* =========================================
   GENERATOR BUTTON
   ACTUAL API CONNECTION COMES LATER
========================================= */

generateBtn.addEventListener(
    "click",
    () => {

        const plannerData =
            collectCompletePlannerData();


        console.log(
            "Planner data ready:",
            plannerData
        );

    }
);


/* Initial check */

updateInformationCheck();
/* ================================= */
/* PART 5 : UI FINAL CHECK HELPERS */
/* ================================= */

function refreshTimetablePage() {

    updateInformationCheck();

    const plannerData =
        collectCompletePlannerData();

    console.log(
        "Current Planner Data:",
        plannerData
    );
}


/* ================================= */
/* FORM CHANGE TRACKING */
/* ================================= */

document.addEventListener(
    "input",
    function () {

        updateInformationCheck();

    }
);

document.addEventListener(
    "change",
    function () {

        updateInformationCheck();

    }
);


/* ================================= */
/* INITIAL UI UPDATE */
/* ================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateInformationCheck();

        console.log(
            "AI Timetable Planner UI ready."
        );

    }
);
/* ================================= */
/* PART 6 : TIMETABLE RENDERING */
/* ================================= */

function getSessionBadgeClass(item) {

    if (item.is_exam_mode) {
        return "session-badge session-exam";
    }

    if (item.is_revision) {
        return "session-badge session-revision";
    }

    return "session-badge session-study";
}


function getSessionBadgeText(item) {

    if (item.is_exam_mode) {
        return "Exam Mode";
    }

    if (item.is_revision) {
        return "Revision";
    }

    return "Study";
}


/* ================================= */
/* RENDER TIMETABLE */
/* ================================= */

function renderTimetable(container, timetable) {

    if (!container) {
        return;
    }

    if (!Array.isArray(timetable) || timetable.length === 0) {

        container.innerHTML = `
            <div class="timetable-empty">
                📅 Timetable இன்னும் உருவாக்கப்படவில்லை.
            </div>
        `;

        return;
    }


    const tableWrapper =
        document.createElement("div");

    tableWrapper.className =
        "generated-timetable-container";


    const table =
        document.createElement("table");

    table.className =
        "generated-timetable-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Activity</th>
                <th>Duration</th>
                <th>AI Reason</th>
            </tr>
        </thead>
    `;


    const tbody =
        document.createElement("tbody");


    timetable.forEach(function (item) {

        const row =
            document.createElement("tr");


        const badgeClass =
            getSessionBadgeClass(item);

        const badgeText =
            getSessionBadgeText(item);


        row.innerHTML = `
            <td>
                <span class="timetable-day">
                    ${item.day_of_week || "-"}
                </span>
            </td>

            <td>
                <span class="timetable-time">
                    ${item.start_time || "-"}
                    -
                    ${item.end_time || "-"}
                </span>
            </td>

            <td>
                <span class="timetable-subject">
                    ${item.subject_name || "-"}
                </span>
            </td>

            <td>
                <span class="${badgeClass}">
                    ${badgeText}
                </span>
            </td>

            <td>
                ${item.duration_minutes || 0} min
            </td>

            <td>
                <span class="ai-reason">
                    ${item.ai_reason || "AI planned session"}
                </span>
            </td>
        `;


        tbody.appendChild(row);

    });


    table.appendChild(tbody);

    tableWrapper.appendChild(table);

    container.innerHTML = "";

    container.appendChild(tableWrapper);
}


/* ================================= */
/* TOP + FINAL PREVIEW */
/* ================================= */

function renderGeneratedTimetable(timetable) {

    generatedTimetable =
        Array.isArray(timetable)
            ? timetable
            : [];


    if (typeof topTimetablePreview !== "undefined") {

        renderTimetable(
            topTimetablePreview,
            generatedTimetable
        );

    }


    if (typeof finalTimetable !== "undefined") {

        renderTimetable(
            finalTimetable,
            generatedTimetable
        );

    }
}
/* ================================= */
/* PART 7 : AI PRIORITY + STATISTICS */
/* ================================= */

function calculateTimetableStatistics(timetable) {

    const statistics = {
        totalSessions: 0,
        totalMinutes: 0,
        studySessions: 0,
        revisionSessions: 0,
        examSessions: 0
    };


    if (!Array.isArray(timetable)) {
        return statistics;
    }


    timetable.forEach(function (item) {

        statistics.totalSessions++;

        const duration =
            Number(item.duration_minutes) || 0;

        statistics.totalMinutes += duration;


        if (item.is_exam_mode) {

            statistics.examSessions++;

        } else if (item.is_revision) {

            statistics.revisionSessions++;

        } else {

            statistics.studySessions++;

        }

    });


    return statistics;
}


/* ================================= */
/* UPDATE SUMMARY CARDS */
/* ================================= */

function updateTimetableStatistics(timetable) {

    const stats =
        calculateTimetableStatistics(timetable);


    const totalSessionsElement =
        document.getElementById("totalSessions");

    const totalMinutesElement =
        document.getElementById("totalMinutes");

    const studySessionsElement =
        document.getElementById("studySessions");

    const revisionSessionsElement =
        document.getElementById("revisionSessions");


    if (totalSessionsElement) {

        totalSessionsElement.textContent =
            stats.totalSessions;

    }


    if (totalMinutesElement) {

        totalMinutesElement.textContent =
            stats.totalMinutes + " min";

    }


    if (studySessionsElement) {

        studySessionsElement.textContent =
            stats.studySessions;

    }


    if (revisionSessionsElement) {

        revisionSessionsElement.textContent =
            stats.revisionSessions;

    }
}


/* ================================= */
/* AI PRIORITY DISPLAY */
/* ================================= */

function renderAIPriority(priorityOrder) {

    generatedPriorityOrder =
        Array.isArray(priorityOrder)
            ? priorityOrder
            : [];


    const priorityContainer =
        document.getElementById(
            "aiPriorityList"
        );


    if (!priorityContainer) {
        return;
    }


    if (generatedPriorityOrder.length === 0) {

        priorityContainer.innerHTML = `
            <div class="timetable-empty">
                AI priority இன்னும் கிடைக்கவில்லை.
            </div>
        `;

        return;
    }


    priorityContainer.innerHTML = "";


    generatedPriorityOrder.forEach(
        function (subject, index) {

            const item =
                document.createElement("div");

            item.className =
                "ai-priority-item";


            item.innerHTML = `
                <span class="ai-priority-number">
                    ${index + 1}
                </span>

                <span>
                    ${subject}
                </span>
            `;


            priorityContainer.appendChild(item);

        }
    );
}


/* ================================= */
/* COMPLETE RESULT UPDATE */
/* ================================= */

function updateGeneratedResult(result) {

    if (!result) {
        return;
    }


    const timetable =
        Array.isArray(result.timetable)
            ? result.timetable
            : [];


    renderGeneratedTimetable(
        timetable
    );


    renderAIPriority(
        result.priority_order
    );


    updateTimetableStatistics(
        timetable
    );


    const aiStatus =
        document.getElementById(
            "aiGenerationStatus"
        );


    if (aiStatus) {

        aiStatus.innerHTML = `
            <span class="ai-status-dot"></span>
            <span>
                AI timetable generated successfully.
            </span>
        `;

    }
}
/* ================================= */
/* PART 8 : TIMETABLE VALIDATION */
/* ================================= */

function timeToMinutes(time) {

    if (!time || typeof time !== "string") {
        return null;
    }

    const parts =
        time.split(":");

    if (parts.length !== 2) {
        return null;
    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return null;
    }

    return (hours * 60) + minutes;
}


/* ================================= */
/* CHECK SINGLE SESSION */
/* ================================= */

function validateTimetableItem(item) {

    const errors = [];


    if (!item) {
        errors.push(
            "Empty timetable item."
        );

        return errors;
    }


    if (!item.day_of_week) {

        errors.push(
            "Day missing."
        );

    }


    if (!item.subject_name) {

        errors.push(
            "Subject missing."
        );

    }


    const start =
        timeToMinutes(
            item.start_time
        );

    const end =
        timeToMinutes(
            item.end_time
        );


    if (
        start === null ||
        end === null
    ) {

        errors.push(
            "Invalid time."
        );

    } else if (end <= start) {

        errors.push(
            "End time must be after start time."
        );

    }


    const duration =
        Number(item.duration_minutes);


    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        errors.push(
            "Invalid duration."
        );

    }


    return errors;
}


/* ================================= */
/* CHECK OVERLAPPING SESSIONS */
/* ================================= */

function findTimetableConflicts(timetable) {

    const conflicts = [];


    if (!Array.isArray(timetable)) {
        return conflicts;
    }


    for (
        let i = 0;
        i < timetable.length;
        i++
    ) {

        const first =
            timetable[i];

        const firstStart =
            timeToMinutes(
                first.start_time
            );

        const firstEnd =
            timeToMinutes(
                first.end_time
            );


        if (
            firstStart === null ||
            firstEnd === null
        ) {
            continue;
        }


        for (
            let j = i + 1;
            j < timetable.length;
            j++
        ) {

            const second =
                timetable[j];


            if (
                first.day_of_week !==
                second.day_of_week
            ) {
                continue;
            }


            const secondStart =
                timeToMinutes(
                    second.start_time
                );

            const secondEnd =
                timeToMinutes(
                    second.end_time
                );


            if (
                secondStart === null ||
                secondEnd === null
            ) {
                continue;
            }


            const overlaps =
                firstStart < secondEnd &&
                secondStart < firstEnd;


            if (overlaps) {

                conflicts.push({
                    first: first,
                    second: second
                });

            }

        }

    }


    return conflicts;
}


/* ================================= */
/* COMPLETE VALIDATION */
/* ================================= */

function validateGeneratedTimetable(
    timetable
) {

    const errors = [];


    if (
        !Array.isArray(timetable) ||
        timetable.length === 0
    ) {

        errors.push(
            "Timetable is empty."
        );

        return {
            valid: false,
            errors: errors,
            conflicts: []
        };
    }


    timetable.forEach(
        function (item, index) {

            const itemErrors =
                validateTimetableItem(item);


            itemErrors.forEach(
                function (error) {

                    errors.push(
                        `Session ${index + 1}: ${error}`
                    );

                }
            );

        }
    );


    const conflicts =
        findTimetableConflicts(
            timetable
        );


    if (conflicts.length > 0) {

        errors.push(
            `${conflicts.length} timetable conflict(s) found.`
        );

    }


    return {
        valid:
            errors.length === 0,

        errors:
            errors,

        conflicts:
            conflicts
    };
}


/* ================================= */
/* UPDATE VALIDATION UI */
/* ================================= */

function updateTimetableValidation(
    timetable
) {

    const result =
        validateGeneratedTimetable(
            timetable
        );


    const statusElement =
        document.getElementById(
            "timetableValidation"
        );


    if (statusElement) {

        if (result.valid) {

            statusElement.className =
                "timetable-validation validation-success";

            statusElement.innerHTML = `
                ✅ Timetable சரியாக உள்ளது.
                Conflict எதுவும் கண்டுபிடிக்கப்படவில்லை.
            `;

        } else {

            statusElement.className =
                "timetable-validation validation-error";

            statusElement.innerHTML = `
                ⚠️ Timetable validation failed.
                ${result.errors.join(" | ")}
            `;

        }

    }


    if (saveTimetableBtn) {

        saveTimetableBtn.disabled =
            !result.valid;

        saveTimetableBtn.classList.toggle(
            "save-ready",
            result.valid
        );

        saveTimetableBtn.classList.toggle(
            "save-disabled",
            !result.valid
        );

    }


    return result;
}


/* ================================= */
/* CONNECT VALIDATION TO RESULT */
/* ================================= */

const originalUpdateGeneratedResult =
    updateGeneratedResult;


updateGeneratedResult =
    function (result) {

        originalUpdateGeneratedResult(
            result
        );


        const timetable =
            Array.isArray(result?.timetable)
                ? result.timetable
                : [];


        updateTimetableValidation(
            timetable
        );

    };
/* ================================= */
/* PART 9 : SAVE DATA PREPARATION */
/* ================================= */

function prepareTimetableForSave(timetable) {

    if (!Array.isArray(timetable)) {
        return [];
    }


    return timetable.map(
        function (item) {

            return {
                day_of_week:
                    item.day_of_week,

                subject_name:
                    item.subject_name,

                activity_type:
                    item.activity_type ||
                    "study",

                start_time:
                    item.start_time,

                end_time:
                    item.end_time,

                duration_minutes:
                    Number(
                        item.duration_minutes
                    ) || 0,

                is_revision:
                    Boolean(
                        item.is_revision
                    ),

                is_exam_mode:
                    Boolean(
                        item.is_exam_mode
                    ),

                ai_reason:
                    item.ai_reason ||
                    "AI generated study session."
            };

        }
    );
}


/* ================================= */
/* API MESSAGE HELPER */
/* ================================= */

function showApiMessage(
    message,
    type = "info",
    details = ""
) {

    let element =
        document.getElementById(
            "apiMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        "api-message show " +
        "api-message-" +
        type;


    element.innerHTML = `
        <div>${message}</div>

        ${
            details
                ? `<div class="api-error-details">
                    ${details}
                   </div>`
                : ""
        }
    `;
}


/* ================================= */
/* HIDE API MESSAGE */
/* ================================= */

function hideApiMessage() {

    const element =
        document.getElementById(
            "apiMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        "api-message";

    element.innerHTML = "";
}


/* ================================= */
/* PREPARE SAVE PAYLOAD */
/* ================================= */

function buildSavePayload() {

    if (
        !loggedInStudentId
    ) {

        throw new Error(
            "Logged-in student ID கிடைக்கவில்லை."
        );

    }


    const validation =
        validateGeneratedTimetable(
            generatedTimetable
        );


    if (!validation.valid) {

        throw new Error(
            "Timetable validation failed."
        );

    }


    return {
        student_id:
            loggedInStudentId,

        timetable:
            prepareTimetableForSave(
                generatedTimetable
            )
    };
}


/* ================================= */
/* SAVE BUTTON PREPARATION */
/* ================================= */

if (saveTimetableBtn) {

    saveTimetableBtn.addEventListener(
        "click",
        async function () {

            hideApiMessage();


            try {

                const payload =
                    buildSavePayload();


                console.log(
                    "Save payload ready:",
                    payload
                );


                showApiMessage(
                    "Timetable save request தயாராக உள்ளது.",
                    "info"
                );


                /*
                 * IMPORTANT:
                 *
                 * Actual fetch() request
                 * will be connected in PART 10.
                 *
                 * Backend + Qwen + Supabase
                 * connection will be completed there.
                 */


            } catch (error) {

                console.error(
                    "Save preparation error:",
                    error
                );


                showApiMessage(
                    "Timetable save செய்ய முடியவில்லை.",
                    "error",
                    error.message
                );

            }

        }
    );

}
/* ================================= */
/* PART 10 : BACKEND + AI CONNECTION */
/* ================================= */


/* ================================= */
/* LOAD SUPABASE CLIENT */
/* ================================= */

async function loadSupabaseClient() {

    if (
        typeof supabaseClient !==
        "undefined"
    ) {
        return supabaseClient;
    }


    if (
        typeof window.supabase ===
        "undefined"
    ) {

        await loadExternalScript(
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        );

    }


    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        await loadExternalScript(
            "supabase-config.js"
        );

    }


    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        throw new Error(
            "Supabase client load செய்ய முடியவில்லை."
        );

    }


    return supabaseClient;
}


/* ================================= */
/* EXTERNAL SCRIPT LOADER */
/* ================================= */

function loadExternalScript(src) {

    return new Promise(
        function (resolve, reject) {

            const script =
                document.createElement(
                    "script"
                );


            script.src = src;

            script.onload =
                function () {
                    resolve();
                };


            script.onerror =
                function () {

                    reject(
                        new Error(
                            "Script load failed: " +
                            src
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );
}


/* ================================= */
/* GET LOGGED-IN STUDENT ID */
/* ================================= */

async function getLoggedInStudentId() {

    const response =
        await fetch(
            API_URL +
            "/api/auth/session",
            {
                method: "GET",
                credentials: "include"
            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        console.error(
            "Session error:",
            result
        );

        throw new Error(
            result.error ||
            "Logged-in student verify செய்ய முடியவில்லை."
        );

    }


    if (
        !result ||
        !result.authenticated ||
        !result.user ||
        !result.user.id
    ) {

        throw new Error(
            "Please login first."
        );

    }


    loggedInStudentId =
        result.user.id;


    console.log(
        "Logged-in Student ID:",
        loggedInStudentId
    );


    return loggedInStudentId;
}


/* ================================= */
/* GENERATE TIMETABLE */
/* ================================= */

async function generateAITimetable() {

    const generateButton =
        document.getElementById(
            "generateBtn"
        );


    try {

        hideApiMessage();


        if (generateButton) {

            generateButton.disabled =
                true;

            generateButton.classList.add(
                "generator-loading"
            );

            generateButton.textContent =
                "🤖 AI உருவாக்குகிறது...";

        }


        showApiMessage(
            "Student account verify செய்கிறோம்...",
            "info"
        );


        /* ---------------------------------
           GET CURRENT STUDENT
        --------------------------------- */

        await getLoggedInStudentId();


        /* ---------------------------------
           COLLECT ALL PLANNER DATA
        --------------------------------- */

        const plannerData =
            collectCompletePlannerData();


        plannerData.student_id =
            loggedInStudentId;


        console.log(
            "Planner data:",
            plannerData
        );


        showApiMessage(
            "AI Planner data backend-க்கு அனுப்பப்படுகிறது...",
            "info"
        );


        /* ---------------------------------
           GENERATE API REQUEST
        --------------------------------- */

        const response =
            await fetch(
                API_URL +
                "/api/timetable/generate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            student_id:
                                loggedInStudentId,

                            planner_data:
                                plannerData
                        })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.error ||
                "Timetable generation failed."
            );

        }


        if (
            !result.success ||
            !Array.isArray(
                result.timetable
            )
        ) {

            throw new Error(
                "Backend returned an invalid timetable."
            );

        }


        /* ---------------------------------
           STORE RESULT
        --------------------------------- */

        generatedTimetable =
            result.timetable;


        generatedPriorityOrder =
            result.priority_order || [];


        /* ---------------------------------
           UPDATE UI
        --------------------------------- */

        updateGeneratedResult(
            result
        );


        updateTimetableValidation(
            generatedTimetable
        );


        showApiMessage(
            "🎉 AI Timetable வெற்றிகரமாக உருவாக்கப்பட்டது!",
            "success"
        );


        console.log(
            "AI timetable result:",
            result
        );


    } catch (error) {

        console.error(
            "Generate timetable error:",
            error
        );


        showApiMessage(
            "❌ Timetable உருவாக்க முடியவில்லை.",
            "error",
            error.message
        );


    } finally {

        if (generateButton) {

            generateButton.disabled =
                false;

            generateButton.classList.remove(
                "generator-loading"
            );

            generateButton.textContent =
                "🤖 Generate Timetable";

        }

    }

}


/* ================================= */
/* SAVE TIMETABLE TO BACKEND */
/* ================================= */

async function saveAITimetable() {

    try {

        hideApiMessage();


        if (
            !Array.isArray(
                generatedTimetable
            ) ||
            generatedTimetable.length === 0
        ) {

            throw new Error(
                "முதலில் timetable generate செய்யுங்கள்."
            );

        }


        await getLoggedInStudentId();


        const validation =
            validateGeneratedTimetable(
                generatedTimetable
            );


        if (!validation.valid) {

            throw new Error(
                "Invalid timetable. Save செய்ய முடியாது."
            );

        }


        const payload =
            buildSavePayload();


        saveTimetableBtn.disabled =
            true;


        saveTimetableBtn.textContent =
            "💾 Saving...";


        showApiMessage(
            "Timetable Supabase-ல் save செய்யப்படுகிறது...",
            "info"
        );


        const response =
            await fetch(
                API_URL +
                "/api/timetable/save",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                result.error ||
                "Save failed."
            );

        }


        showApiMessage(
            "✅ Timetable வெற்றிகரமாக Supabase-ல் save செய்யப்பட்டது!",
            "success"
        );


        console.log(
            "Saved timetable:",
            result
        );


    } catch (error) {

        console.error(
            "Save timetable error:",
            error
        );


        showApiMessage(
            "❌ Timetable save செய்ய முடியவில்லை.",
            "error",
            error.message
        );


    } finally {

        if (saveTimetableBtn) {

            saveTimetableBtn.disabled =
                false;

            saveTimetableBtn.textContent =
                "💾 Save Timetable";

        }

    }

}


/* ================================= */
/* FINAL GENERATE BUTTON */
/* ================================= */

if (generateBtn) {

    generateBtn.addEventListener(
        "click",
        async function () {

            await generateAITimetable();

        }
    );

}


/* ================================= */
/* FINAL SAVE BUTTON */
/* ================================= */

if (saveTimetableBtn) {

    saveTimetableBtn.replaceWith(
        saveTimetableBtn.cloneNode(true)
    );


    const refreshedSaveButton =
        document.getElementById(
            "saveTimetableBtn"
        );


    refreshedSaveButton.addEventListener(
        "click",
        async function () {

            await saveAITimetable();

        }
    );


    saveTimetableBtn =
        refreshedSaveButton;

}


/* ================================= */
/* FINAL INITIALIZATION */
/* ================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            await getLoggedInStudentId();


            showApiMessage(
                "🟢 Student account connected. AI Planner ready.",
                "success"
            );


        } catch (error) {

            console.warn(
                "Student authentication not available:",
                error.message
            );


            showApiMessage(
                "🔐 Please login to use AI Timetable.",
                "info"
            );

        }

    }
);


/* ================================= */
/* END OF TIMETABLE.JS */
/* ================================= */