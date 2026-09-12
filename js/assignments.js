/* =========================================
   STUDENT DIGITAL HUB
   ASSIGNMENTS.JS
   PART 1 / 4

   Configuration
   State
   Initialization
   Profile Loading
========================================= */


/* =========================================
   API CONFIGURATION
========================================= */

const API_BASE = "/api";


/* =========================================
   APPLICATION STATE
========================================= */

let assignments = [];

let filteredAssignments = [];

let currentEditingId = null;

let currentProfile = null;


/* =========================================
   DOM REFERENCES
========================================= */

const assignmentSearch =
    document.getElementById(
        "assignmentSearch"
    );

const subjectFilter =
    document.getElementById(
        "subjectFilter"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );

const assignmentsList =
    document.getElementById(
        "assignmentsList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const assignmentModal =
    document.getElementById(
        "assignmentModal"
    );

const assignmentForm =
    document.getElementById(
        "assignmentForm"
    );

const addAssignmentBtn =
    document.getElementById(
        "addAssignmentBtn"
    );

const closeModalBtn =
    document.getElementById(
        "closeModalBtn"
    );

const cancelAssignmentBtn =
    document.getElementById(
        "cancelAssignmentBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAssignmentsPage();

    }
);


/* =========================================
   INITIALIZE PAGE
========================================= */

async function initializeAssignmentsPage() {

    console.log(
        "📝 Initializing Assignments..."
    );

    setupEventListeners();

    setDefaultAssignedDate();

    await loadStudentProfile();

    await loadAssignments();

}


/* =========================================
   EVENT LISTENERS
========================================= */

function setupEventListeners() {

    if (assignmentSearch) {

        assignmentSearch.addEventListener(
            "input",
            applyFilters
        );

    }


    if (subjectFilter) {

        subjectFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (addAssignmentBtn) {

        addAssignmentBtn.addEventListener(
            "click",
            function () {

                openAssignmentModal();

            }
        );

    }


    if (closeModalBtn) {

        closeModalBtn.addEventListener(
            "click",
            closeAssignmentModal
        );

    }


    if (cancelAssignmentBtn) {

        cancelAssignmentBtn.addEventListener(
            "click",
            closeAssignmentModal
        );

    }


    if (assignmentForm) {

        assignmentForm.addEventListener(
            "submit",
            handleAssignmentSubmit
        );

    }


    if (assignmentModal) {

        const overlay =
            assignmentModal.querySelector(
                ".modal-overlay"
            );

        if (overlay) {

            overlay.addEventListener(
                "click",
                closeAssignmentModal
            );

        }

    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            handleLogout
        );

    }


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                assignmentModal &&
                assignmentModal.classList.contains(
                    "active"
                )
            ) {

                closeAssignmentModal();

            }

        }
    );

}


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile() {

    try {

        const response =
            await fetch(
                API_BASE +
                "/auth/profile",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load profile."
            );

        }


        currentProfile =
            data.profile;


        displayStudentProfile(
            currentProfile
        );


        console.log(
            "✅ Student profile loaded."
        );


    } catch (error) {

        console.error(
            "❌ Profile loading error:",
            error
        );

        showPageMessage(
            "Unable to load your profile."
        );

    }

}


/* =========================================
   DISPLAY STUDENT PROFILE
========================================= */

function displayStudentProfile(
    profile
) {

    if (!profile) {
        return;
    }


    const nameElement =
        document.getElementById(
            "studentName"
        );

    const gradeElement =
        document.getElementById(
            "studentGrade"
        );

    const avatarElement =
        document.getElementById(
            "studentAvatar"
        );


    /* STUDENT NAME */

    if (nameElement) {

        nameElement.textContent =
            profile.full_name ||
            profile.name ||
            profile.username ||
            "Student";

    }


    /* STUDENT GRADE */

    if (gradeElement) {

        gradeElement.textContent =
            profile.grade ||
            "Student";

    }


    /* PROFILE PHOTO */

    if (avatarElement) {

        const avatar =
            profile.avatar_url;


        if (avatar) {

            avatarElement.src =
                avatar;

        } else {

            avatarElement.src =
                "../assets/images/default-avatar.png";

        }


        avatarElement.onerror =
            function () {

                this.src =
                    "../assets/images/default-avatar.png";

            };

    }

}


/* =========================================
   DEFAULT ASSIGNED DATE
========================================= */

function setDefaultAssignedDate() {

    const assignedDate =
        document.getElementById(
            "assignedDate"
        );


    if (!assignedDate) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    assignedDate.value =
        `${year}-${month}-${day}`;

}


/* =========================================
   LOGIN REDIRECT
========================================= */

function redirectToLogin() {

    window.location.href =
        "../login.html";

}


/* =========================================
   PAGE MESSAGE
========================================= */

function showPageMessage(
    message
) {

    console.warn(
        "Assignments:",
        message
    );

}


/* =========================================
   LOGOUT
========================================= */

async function handleLogout() {

    try {

        const response =
            await fetch(
                API_BASE +
                "/auth/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );


        if (response.ok) {

            redirectToLogin();

            return;

        }


        console.warn(
            "Logout request failed."
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }


    redirectToLogin();

}


/* =========================================
   END PART 1
========================================= */
/* =========================================
   ASSIGNMENTS.JS
   PART 2 / 4

   Assignment Loading
   Summary Statistics
   Filters
========================================= */


/* =========================================
   LOAD ASSIGNMENTS
========================================= */

async function loadAssignments() {

    try {

        showLoadingState();


        const response =
            await fetch(
                API_BASE +
                "/assignments",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load assignments."
            );

        }


        assignments =
            Array.isArray(
                data.assignments
            )
                ? data.assignments
                : [];


        console.log(
            "✅ Assignments loaded:",
            assignments.length
        );


        updateSummaryCards();

        populateSubjectFilters();

        applyFilters();


    } catch (error) {

        console.error(
            "❌ Assignment loading error:",
            error
        );


        assignments = [];

        filteredAssignments = [];

        updateSummaryCards();

        renderAssignments();


        showPageMessage(
            "Unable to load assignments."
        );

    }

}


/* =========================================
   UPDATE SUMMARY CARDS
========================================= */

function updateSummaryCards() {

    const total =
        assignments.length;


    const pending =
        assignments.filter(
            function (assignment) {

                return (
                    assignment.status ===
                    "pending"
                );

            }
        ).length;


    const inProgress =
        assignments.filter(
            function (assignment) {

                return (
                    assignment.status ===
                    "in-progress"
                );

            }
        ).length;


    const completed =
        assignments.filter(
            function (assignment) {

                return (
                    assignment.status ===
                    "completed"
                );

            }
        ).length;


    const overdue =
        assignments.filter(
            function (assignment) {

                return isAssignmentOverdue(
                    assignment
                );

            }
        ).length;


    setElementText(
        "totalAssignments",
        total
    );


    setElementText(
        "pendingAssignments",
        pending
    );


    setElementText(
        "progressAssignments",
        inProgress
    );


    setElementText(
        "completedAssignments",
        completed
    );


    setElementText(
        "overdueAssignments",
        overdue
    );

}


/* =========================================
   SET ELEMENT TEXT
========================================= */

function setElementText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================
   CHECK OVERDUE
========================================= */

function isAssignmentOverdue(
    assignment
) {

    if (
        assignment.status ===
        "completed"
    ) {

        return false;

    }


    if (
        !assignment.due_date
    ) {

        return false;

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const dueDate =
        new Date(
            assignment.due_date +
            "T00:00:00"
        );


    return dueDate < today;

}


/* =========================================
   POPULATE SUBJECT FILTERS
========================================= */

function populateSubjectFilters() {

    if (!subjectFilter) {
        return;
    }


    const currentValue =
        subjectFilter.value;


    const subjects =
        assignments
            .map(
                function (assignment) {

                    return assignment.subject;

                }
            )
            .filter(
                function (subject) {

                    return (
                        typeof subject ===
                        "string" &&
                        subject.trim() !== ""
                    );

                }
            );


    const uniqueSubjects =
        [...new Set(subjects)]
            .sort(
                function (a, b) {

                    return a.localeCompare(b);

                }
            );


    subjectFilter.innerHTML =
        `
        <option value="all">
            All Subjects
        </option>
        `;


    uniqueSubjects.forEach(
        function (subject) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject;


            option.textContent =
                subject;


            subjectFilter.appendChild(
                option
            );

        }
    );


    if (
        uniqueSubjects.includes(
            currentValue
        )
    ) {

        subjectFilter.value =
            currentValue;

    } else {

        subjectFilter.value =
            "all";

    }

}


/* =========================================
   APPLY ALL FILTERS
========================================= */

function applyFilters() {

    const searchText =
        assignmentSearch
            ? assignmentSearch.value
                .trim()
                .toLowerCase()
            : "";


    const selectedSubject =
        subjectFilter
            ? subjectFilter.value
            : "all";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const selectedPriority =
        priorityFilter
            ? priorityFilter.value
            : "all";


    filteredAssignments =
        assignments.filter(
            function (assignment) {


                /* SEARCH */

                const searchableText =
                    [
                        assignment.title,
                        assignment.description,
                        assignment.subject
                    ]
                        .filter(
                            Boolean
                        )
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !searchText ||
                    searchableText.includes(
                        searchText
                    );


                /* SUBJECT */

                const matchesSubject =
                    selectedSubject ===
                    "all" ||
                    assignment.subject ===
                    selectedSubject;


                /* STATUS */

                let assignmentStatus =
                    assignment.status ||
                    "pending";


                if (
                    isAssignmentOverdue(
                        assignment
                    )
                ) {

                    assignmentStatus =
                        "overdue";

                }


                const matchesStatus =
                    selectedStatus ===
                    "all" ||
                    assignmentStatus ===
                    selectedStatus;


                /* PRIORITY */

                const matchesPriority =
                    selectedPriority ===
                    "all" ||
                    assignment.priority ===
                    selectedPriority;


                return (
                    matchesSearch &&
                    matchesSubject &&
                    matchesStatus &&
                    matchesPriority
                );

            }
        );


    renderAssignments();

}


/* =========================================
   SORT ASSIGNMENTS
========================================= */

function sortAssignments(
    list
) {

    return [...list].sort(
        function (a, b) {

            /* Completed items go lower */

            if (
                a.status === "completed" &&
                b.status !== "completed"
            ) {

                return 1;

            }


            if (
                a.status !== "completed" &&
                b.status === "completed"
            ) {

                return -1;

            }


            /* Due date */

            if (
                a.due_date &&
                b.due_date
            ) {

                return (
                    new Date(
                        a.due_date
                    ) -
                    new Date(
                        b.due_date
                    )
                );

            }


            if (a.due_date) {
                return -1;
            }


            if (b.due_date) {
                return 1;
            }


            return (
                new Date(
                    b.created_at || 0
                ) -
                new Date(
                    a.created_at || 0
                )
            );

        }
    );

}


/* =========================================
   LOADING STATE
========================================= */

function showLoadingState() {

    if (!assignmentsList) {
        return;
    }


    assignmentsList.innerHTML =
        `
        <div class="empty-state">
            <div class="empty-icon">
                ⏳
            </div>

            <h3>
                Loading assignments...
            </h3>

            <p>
                Please wait while we load your work.
            </p>
        </div>
        `;

}


/* =========================================
   END PART 2
========================================= */
/* =========================================
   STUDENT DIGITAL HUB
   ASSIGNMENTS.JS
   PART 3 / 4

   Assignment Rendering
   Assignment Cards
   Edit / Delete Actions
========================================= */


/* =========================================
   RENDER ASSIGNMENTS
========================================= */

function renderAssignments() {

    if (!assignmentsList) {
        return;
    }


    assignmentsList.innerHTML = "";


    if (
        !filteredAssignments ||
        filteredAssignments.length === 0
    ) {

        renderEmptyState();

        return;

    }


    const sortedAssignments =
        sortAssignments(
            filteredAssignments
        );


    sortedAssignments.forEach(
        function (assignment) {

            const card =
                createAssignmentCard(
                    assignment
                );

            assignmentsList.appendChild(
                card
            );

        }
    );

}


/* =========================================
   CREATE ASSIGNMENT CARD
========================================= */

function createAssignmentCard(
    assignment
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "assignment-card";


    card.dataset.id =
        assignment.id;


    const status =
        getAssignmentStatus(
            assignment
        );


    const priority =
        assignment.priority ||
        "medium";


    const progress =
        getProgressValue(
            assignment
        );


    const dueDate =
        formatDueDate(
            assignment.due_date
        );


    const dueLabel =
        getDueLabel(
            assignment
        );


    card.innerHTML =
        `
        <div class="assignment-card-top">

            <div class="assignment-main">

                <div class="assignment-title-row">

                    <h3>
                        ${escapeHTML(
                            assignment.title ||
                            "Untitled Assignment"
                        )}
                    </h3>

                    <span
                        class="priority-badge priority-${escapeHTML(
                            priority
                        )}"
                    >
                        ${capitalize(
                            priority
                        )}
                    </span>

                </div>


                <div class="assignment-meta">

                    ${
                        assignment.subject
                            ? `
                            <span>
                                📚
                                ${escapeHTML(
                                    assignment.subject
                                )}
                            </span>
                            `
                            : ""
                    }

                    ${
                        dueDate
                            ? `
                            <span
                                class="${
                                    status ===
                                    "overdue"
                                        ? "overdue-text"
                                        : ""
                                }"
                            >
                                📅
                                ${dueDate}
                            </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="assignment-actions">

                <button
                    type="button"
                    class="assignment-action edit-action"
                    data-action="edit"
                    data-id="${escapeHTML(
                        assignment.id
                    )}"
                    title="Edit assignment"
                >
                    ✏️
                </button>


                <button
                    type="button"
                    class="assignment-action delete-action"
                    data-action="delete"
                    data-id="${escapeHTML(
                        assignment.id
                    )}"
                    title="Delete assignment"
                >
                    🗑️
                </button>

            </div>

        </div>


        ${
            assignment.description
                ? `
                <p class="assignment-description">
                    ${escapeHTML(
                        assignment.description
                    )}
                </p>
                `
                : ""
        }


        <div class="assignment-status-row">

            <span
                class="status-badge status-${escapeHTML(
                    status
                )}"
            >
                ${getStatusIcon(status)}
                ${formatStatus(status)}
            </span>


            ${
                dueLabel
                    ? `
                    <span class="due-label">
                        ${dueLabel}
                    </span>
                    `
                    : ""
            }

        </div>


        <div class="assignment-progress">

            <div class="progress-header">

                <span>
                    Progress
                </span>

                <strong>
                    ${progress}%
                </strong>

            </div>


            <div class="progress-track">

                <div
                    class="progress-fill"
                    style="width: ${progress}%"
                ></div>

            </div>

        </div>


        <div class="assignment-footer">

            ${
                assignment.created_at
                    ? `
                    <span>
                        Added
                        ${formatDate(
                            assignment.created_at
                        )}
                    </span>
                    `
                    : ""
            }


            ${
                status !== "completed"
                    ? `
                    <button
                        type="button"
                        class="complete-assignment-btn"
                        data-action="complete"
                        data-id="${escapeHTML(
                            assignment.id
                        )}"
                    >
                        ✅ Mark Complete
                    </button>
                    `
                    : `
                    <span class="completed-label">
                        ✅ Completed
                    </span>
                    `
            }

        </div>
        `;


    attachCardEvents(
        card
    );


    return card;

}


/* =========================================
   ATTACH CARD EVENTS
========================================= */

function attachCardEvents(
    card
) {

    const buttons =
        card.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const action =
                        this.dataset.action;


                    const id =
                        this.dataset.id;


                    if (
                        action ===
                        "edit"
                    ) {

                        editAssignment(
                            id
                        );

                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        deleteAssignment(
                            id
                        );

                    }


                    if (
                        action ===
                        "complete"
                    ) {

                        markAssignmentCompleted(
                            id
                        );

                    }

                }
            );

        }
    );

}


/* =========================================
   GET ASSIGNMENT STATUS
========================================= */

function getAssignmentStatus(
    assignment
) {

    if (
        assignment.status ===
        "completed"
    ) {

        return "completed";

    }


    if (
        isAssignmentOverdue(
            assignment
        )
    ) {

        return "overdue";

    }


    return (
        assignment.status ||
        "pending"
    );

}


/* =========================================
   GET PROGRESS
========================================= */

function getProgressValue(
    assignment
) {

    let progress =
        Number(
            assignment.progress ||
            assignment.progress_percent ||
            0
        );


    if (
        assignment.status ===
        "completed"
    ) {

        progress = 100;

    }


    if (progress < 0) {
        progress = 0;
    }


    if (progress > 100) {
        progress = 100;
    }


    return Math.round(
        progress
    );

}


/* =========================================
   STATUS ICON
========================================= */

function getStatusIcon(
    status
) {

    const icons = {

        pending: "⏳",

        "in-progress": "🔄",

        completed: "✅",

        overdue: "⚠️"

    };


    return (
        icons[status] ||
        "📝"
    );

}


/* =========================================
   FORMAT STATUS
========================================= */

function formatStatus(
    status
) {

    if (!status) {
        return "Pending";
    }


    return status
        .split("-")
        .map(
            function (word) {

                return capitalize(
                    word
                );

            }
        )
        .join(" ");

}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================
   FORMAT DUE DATE
========================================= */

function formatDueDate(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(
            dateValue +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================
   DUE LABEL
========================================= */

function getDueLabel(
    assignment
) {

    if (
        !assignment.due_date ||
        assignment.status ===
        "completed"
    ) {

        return "";

    }


    if (
        isAssignmentOverdue(
            assignment
        )
    ) {

        return "⚠️ Overdue";

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const dueDate =
        new Date(
            assignment.due_date +
            "T00:00:00"
        );


    const difference =
        Math.ceil(
            (
                dueDate -
                today
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (
        difference === 0
    ) {

        return "🔥 Due today";

    }


    if (
        difference === 1
    ) {

        return "⏰ Due tomorrow";

    }


    if (
        difference > 1 &&
        difference <= 7
    ) {

        return `📌 Due in ${difference} days`;

    }


    return "";

}


/* =========================================
   EDIT ASSIGNMENT
========================================= */

function editAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(assignmentId)
                );

            }
        );


    if (!assignment) {

        console.error(
            "Assignment not found:",
            assignmentId
        );

        return;

    }


    currentEditingId =
        assignment.id;


    openAssignmentModal(
        assignment
    );

}


/* =========================================
   DELETE ASSIGNMENT
========================================= */

async function deleteAssignment(
    assignmentId
) {

    const assignment =
        assignments.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(assignmentId)
                );

            }
        );


    if (!assignment) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete "${assignment.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                "/assignments/" +
                encodeURIComponent(
                    assignmentId
                ),
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to delete assignment."
            );

        }


        assignments =
            assignments.filter(
                function (item) {

                    return (
                        String(item.id) !==
                        String(assignmentId)
                    );

                }
            );


        updateSummaryCards();

        populateSubjectFilters();

        applyFilters();


        console.log(
            "✅ Assignment deleted."
        );


    } catch (error) {

        console.error(
            "❌ Delete assignment error:",
            error
        );


        window.alert(
            error.message ||
            "Unable to delete assignment."
        );

    }

}


/* =========================================
   MARK COMPLETED
========================================= */

async function markAssignmentCompleted(
    assignmentId
) {

    const assignment =
        assignments.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(assignmentId)
                );

            }
        );


    if (!assignment) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE +
                "/assignments/" +
                encodeURIComponent(
                    assignmentId
                ),
                {
                    method: "PUT",

                    credentials:
                        "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status:
                                "completed",
                            progress:
                                100
                        })
                }
            );


        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;

        }


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to update assignment."
            );

        }


        const index =
            assignments.findIndex(
                function (item) {

                    return (
                        String(item.id) ===
                        String(assignmentId)
                    );

                }
            );


        if (index !== -1) {

            assignments[index] =
                data.assignment ||
                {
                    ...assignments[index],
                    status:
                        "completed"
                };

        }


        updateSummaryCards();

        applyFilters();


        console.log(
            "✅ Assignment completed."
        );


    } catch (error) {

        console.error(
            "❌ Complete assignment error:",
            error
        );


        window.alert(
            error.message ||
            "Unable to complete assignment."
        );

    }

}


/* =========================================
   EMPTY STATE
========================================= */

function renderEmptyState() {

    assignmentsList.innerHTML =
        `
        <div
            class="empty-state"
            id="emptyState"
        >

            <div class="empty-icon">
                📝
            </div>

            <h3>
                ${
                    assignments.length === 0
                        ? "No assignments yet"
                        : "No matching assignments"
                }
            </h3>

            <p>
                ${
                    assignments.length === 0
                        ? "Add your first assignment to start tracking your work."
                        : "Try changing your search or filters."
                }
            </p>

            ${
                assignments.length === 0
                    ? `
                    <button
                        type="button"
                        class="add-assignment-btn"
                        id="emptyAddAssignmentBtn"
                    >
                        + Add Assignment
                    </button>
                    `
                    : ""
            }

        </div>
        `;


    const emptyAddButton =
        document.getElementById(
            "emptyAddAssignmentBtn"
        );


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openAssignmentModal
        );

    }

}


/* =========================================
   CAPITALIZE
========================================= */

function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   END PART 3
========================================= */
/* =========================================
   PART 3/4
   EDIT • DELETE • STATUS • PROGRESS
========================================= */


/* =========================================
   OPEN EDIT MODAL
========================================= */

function editAssignment(id) {

    const assignment =
        assignments.find(function (item) {

            return item.id === id;

        });

    if (!assignment) {

        console.error(
            "Assignment not found:",
            id
        );

        return;

    }

    editingAssignmentId = id;

    modalTitle.textContent =
        "Edit Assignment";

    assignmentTitle.value =
        assignment.title || "";

    assignmentDescription.value =
        assignment.description || "";

    assignmentSubject.value =
        assignment.subject || "";

    assignmentPriority.value =
        assignment.priority || "medium";

    dueDate.value =
        assignment.due_date || "";

    if (assignedDate) {

        assignedDate.value =
            assignment.assigned_date || "";

    }

    if (estimatedTime) {

        estimatedTime.value =
            assignment.estimated_time || "";

    }

    if (assignmentProgress) {

        assignmentProgress.value =
            assignment.progress || 0;

    }

    if (assignmentResource) {

        assignmentResource.value =
            assignment.resource_url || "";

    }

    if (assignmentNotes) {

        assignmentNotes.value =
            assignment.notes || "";

    }

    assignmentModal.classList.add(
        "active"
    );

    assignmentModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================
   DELETE ASSIGNMENT
========================================= */

async function deleteAssignment(id) {

    const assignment =
        assignments.find(function (item) {

            return item.id === id;

        });

    if (!assignment) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${assignment.title}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        showPageMessage(
            "Deleting assignment...",
            "loading"
        );


        const response =
            await fetch(
                `${API_BASE}/api/assignments/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                redirectToLogin();

                return;

            }

            throw new Error(
                result.message ||
                "Unable to delete assignment."
            );

        }


        assignments =
            assignments.filter(
                function (item) {

                    return item.id !== id;

                }
            );


        renderAssignments();

        updateStatistics();

        updateSubjectFilters();


        showPageMessage(
            "Assignment deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete assignment error:",
            error
        );


        showPageMessage(
            error.message ||
            "Unable to delete assignment.",
            "error"
        );

    }

}


/* =========================================
   UPDATE ASSIGNMENT STATUS
========================================= */

async function updateAssignmentStatus(
    id,
    status
) {

    if (!id || !status) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/assignments/${id}`,
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: status
                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                redirectToLogin();

                return;

            }

            throw new Error(
                result.message ||
                "Unable to update status."
            );

        }


        assignments =
            assignments.map(
                function (item) {

                    if (item.id === id) {

                        return result.assignment ||
                            {
                                ...item,
                                status: status
                            };

                    }

                    return item;

                }
            );


        renderAssignments();

        updateStatistics();


        showPageMessage(
            "Assignment status updated.",
            "success"
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showPageMessage(
            error.message ||
            "Unable to update assignment status.",
            "error"
        );

    }

}


/* =========================================
   UPDATE PROGRESS
========================================= */

async function updateAssignmentProgress(
    id,
    progress
) {

    let value =
        Number(progress);


    if (Number.isNaN(value)) {

        value = 0;

    }


    value =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );


    try {

        const response =
            await fetch(
                `${API_BASE}/api/assignments/${id}`,
                {
                    method: "PUT",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        progress: value
                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                redirectToLogin();

                return;

            }

            throw new Error(
                result.message ||
                "Unable to update progress."
            );

        }


        assignments =
            assignments.map(
                function (item) {

                    if (item.id === id) {

                        return result.assignment ||
                            {
                                ...item,
                                progress: value
                            };

                    }

                    return item;

                }
            );


        renderAssignments();

        updateStatistics();


    } catch (error) {

        console.error(
            "Progress update error:",
            error
        );


        showPageMessage(
            error.message ||
            "Unable to update progress.",
            "error"
        );

    }

}


/* =========================================
   QUICK STATUS BUTTON
========================================= */

async function markAssignmentCompleted(
    id
) {

    await updateAssignmentStatus(
        id,
        "completed"
    );

}


/* =========================================
   MARK IN PROGRESS
========================================= */

async function markAssignmentInProgress(
    id
) {

    await updateAssignmentStatus(
        id,
        "in-progress"
    );

}


/* =========================================
   MARK PENDING
========================================= */

async function markAssignmentPending(
    id
) {

    await updateAssignmentStatus(
        id,
        "pending"
    );

}


/* =========================================
   ASSIGNMENT ACTION HANDLER
========================================= */

function handleAssignmentAction(
    action,
    id
) {

    if (!action || !id) {

        return;

    }


    switch (action) {

        case "edit":

            editAssignment(id);

            break;


        case "delete":

            deleteAssignment(id);

            break;


        case "complete":

            markAssignmentCompleted(id);

            break;


        case "progress":

            markAssignmentInProgress(id);

            break;


        case "pending":

            markAssignmentPending(id);

            break;


        default:

            console.warn(
                "Unknown assignment action:",
                action
            );

    }

}


/* =========================================
   EVENT DELEGATION
========================================= */

if (assignmentsList) {

    assignmentsList.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            handleAssignmentAction(
                action,
                id
            );

        }
    );

}


/* =========================================
   PROGRESS INPUT HANDLER
========================================= */

if (assignmentsList) {

    assignmentsList.addEventListener(
        "change",
        function (event) {

            const input =
                event.target.closest(
                    "[data-progress-id]"
                );


            if (!input) {

                return;

            }


            const id =
                input.dataset.progressId;


            updateAssignmentProgress(
                id,
                input.value
            );

        }
    );

}


/* =========================================
   STATUS SELECT HANDLER
========================================= */

if (assignmentsList) {

    assignmentsList.addEventListener(
        "change",
        function (event) {

            const select =
                event.target.closest(
                    "[data-status-id]"
                );


            if (!select) {

                return;

            }


            const id =
                select.dataset.statusId;


            updateAssignmentStatus(
                id,
                select.value
            );

        }
    );

}


/* =========================================
   DATE HELPERS
========================================= */

function isAssignmentOverdue(
    assignment
) {

    if (!assignment) {

        return false;

    }


    if (
        assignment.status ===
        "completed"
    ) {

        return false;

    }


    if (!assignment.due_date) {

        return false;

    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(
            assignment.due_date
        );

    due.setHours(
        0,
        0,
        0,
        0
    );


    return due < today;

}


/* =========================================
   DAYS REMAINING
========================================= */

function getDaysRemaining(
    dueDateValue
) {

    if (!dueDateValue) {

        return null;

    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const due =
        new Date(
            dueDateValue
        );

    due.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        due.getTime() -
        today.getTime();


    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

}


/* =========================================
   DEADLINE LABEL
========================================= */

function getDeadlineLabel(
    assignment
) {

    if (
        !assignment ||
        !assignment.due_date
    ) {

        return "No due date";

    }


    if (
        isAssignmentOverdue(
            assignment
        )
    ) {

        const days =
            Math.abs(
                getDaysRemaining(
                    assignment.due_date
                )
            );


        return days === 1
            ? "1 day overdue"
            : `${days} days overdue`;

    }


    const days =
        getDaysRemaining(
            assignment.due_date
        );


    if (days === 0) {

        return "Due today";

    }


    if (days === 1) {

        return "Due tomorrow";

    }


    if (days > 1) {

        return `${days} days remaining`;

    }


    return "Due date passed";

}


/* =========================================
   STATUS NORMALIZER
========================================= */

function normalizeAssignmentStatus(
    assignment
) {

    if (!assignment) {

        return "pending";

    }


    if (
        assignment.status ===
        "completed"
    ) {

        return "completed";

    }


    if (
        isAssignmentOverdue(
            assignment
        )
    ) {

        return "overdue";

    }


    if (
        assignment.status ===
        "in-progress"
    ) {

        return "in-progress";

    }


    return "pending";

}
/* =========================================
   STUDENT DIGITAL HUB
   ASSIGNMENTS.JS
   PART 4 / 4
   UI EVENTS + INITIALIZATION
========================================= */


/* =========================================
   MODAL EVENTS
========================================= */

function setupModalEvents() {

    const addBtn =
        document.getElementById("addAssignmentBtn");

    const closeBtn =
        document.getElementById("closeModalBtn");

    const cancelBtn =
        document.getElementById("cancelAssignmentBtn");

    const modal =
        document.getElementById("assignmentModal");


    if (addBtn) {

        addBtn.addEventListener(
            "click",
            function () {

                openAssignmentModal();

            }
        );

    }


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            function () {

                closeAssignmentModal();

            }
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            function () {

                closeAssignmentModal();

            }
        );

    }


    if (modal) {

        const overlay =
            modal.querySelector(".modal-overlay");

        if (overlay) {

            overlay.addEventListener(
                "click",
                function () {

                    closeAssignmentModal();

                }
            );

        }

    }

}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    const search =
        document.getElementById(
            "assignmentSearch"
        );

    if (!search) return;


    search.addEventListener(
        "input",
        function () {

            applyAssignmentFilters();

        }
    );

}


/* =========================================
   FILTER EVENTS
========================================= */

function setupFilters() {

    const subjectFilter =
        document.getElementById(
            "subjectFilter"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );


    if (subjectFilter) {

        subjectFilter.addEventListener(
            "change",
            applyAssignmentFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyAssignmentFilters
        );

    }


    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            applyAssignmentFilters
        );

    }

}


/* =========================================
   FORM SUBMIT
========================================= */

function setupAssignmentForm() {

    const form =
        document.getElementById(
            "assignmentForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            await saveAssignment();

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (!logoutBtn) return;


    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                logoutBtn.disabled = true;

                logoutBtn.innerHTML =
                    "<span>⏳</span><span>Logging out...</span>";


                const response =
                    await fetch(
                        "/api/auth/logout",
                        {
                            method: "POST",
                            credentials: "include"
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Logout failed."
                    );

                }


                window.location.href =
                    "../login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                logoutBtn.disabled = false;

                logoutBtn.innerHTML =
                    "<span>🚪</span><span>Logout</span>";

                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function setupMobileSidebar() {

    const menuBtn =
        document.getElementById(
            "mobileMenuBtn"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!menuBtn || !sidebar) return;


    menuBtn.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "active"
            );

            if (overlay) {

                overlay.classList.toggle(
                    "active"
                );

            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function () {

                sidebar.classList.remove(
                    "active"
                );

                overlay.classList.remove(
                    "active"
                );

            }
        );

    }

}


/* =========================================
   CLOSE SIDEBAR AFTER NAVIGATION
========================================= */

function setupSidebarLinks() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!sidebar) return;


    const links =
        sidebar.querySelectorAll(
            "a"
        );


    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove(
                        "active"
                    );

                    if (overlay) {

                        overlay.classList.remove(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================
   LOAD STUDENT PROFILE
========================================= */

async function loadStudentProfile() {

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

            if (response.status === 401) {

                window.location.href =
                    "../login.html";

                return;

            }

            throw new Error(
                "Unable to load profile."
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !data.profile
        ) {

            return;

        }


        const profile =
            data.profile;


        const nameElement =
            document.getElementById(
                "studentName"
            );

        const gradeElement =
            document.getElementById(
                "studentGrade"
            );

        const avatarElement =
            document.getElementById(
                "studentAvatar"
            );


        if (nameElement) {

            nameElement.textContent =
                profile.name ||
                profile.full_name ||
                "Student";

        }


        if (gradeElement) {

            gradeElement.textContent =
                profile.grade ||
                "Student";

        }


        if (
            avatarElement &&
            profile.avatar_url
        ) {

            avatarElement.src =
                profile.avatar_url;

        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }

}


/* =========================================
   LOAD EVERYTHING
========================================= */

async function initializeAssignmentsPage() {

    console.log(
        "🚀 Initializing Assignments..."
    );


    setupModalEvents();

    setupSearch();

    setupFilters();

    setupAssignmentForm();

    setupLogout();

    setupMobileSidebar();

    setupSidebarLinks();


    await loadStudentProfile();

    await loadSubjects();

    await loadAssignments();


    console.log(
        "✅ Assignments page ready."
    );

}


/* =========================================
   DOM READY
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAssignmentsPage
    );

} else {

    initializeAssignmentsPage();

}


/* =========================================
   GLOBAL EXPORTS
========================================= */

window.openAssignmentModal =
    openAssignmentModal;

window.closeAssignmentModal =
    closeAssignmentModal;

window.editAssignment =
    editAssignment;

window.deleteAssignment =
    deleteAssignment;

window.updateAssignmentStatus =
    updateAssignmentStatus;

window.applyAssignmentFilters =
    applyAssignmentFilters;