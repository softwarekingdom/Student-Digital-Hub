"use strict";

document.addEventListener("DOMContentLoaded", () => {
const BACKEND_CONNECTED = false;

const studentSearch = document.getElementById("studentSearch");
const onlineEmpty = document.getElementById("onlineEmpty");
const studentList = document.getElementById("studentList");
const onlineCount = document.getElementById("onlineCount");

const rulesAccepted = document.getElementById("rulesAccepted");
const rulesStatus = document.getElementById("rulesStatus");

const messageForm = document.getElementById("messageForm");
const leaveGroupBtn = document.getElementById("leaveGroupBtn");
const blockBtn = document.getElementById("blockBtn");
const reportBtn = document.getElementById("reportBtn");
const safetyStatus = document.getElementById("safetyStatus");

const safetyDialog = document.getElementById("safetyDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const dialogConfirmBtn = document.getElementById("dialogConfirmBtn");
const dialogStatus = document.getElementById("dialogStatus");
const reportReason = document.getElementById("reportReason");
const reportReasonLabel = document.getElementById("reportReasonLabel");

let pendingSafetyAction = null;

function showStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("status-error", isError);
}

// No mock students or fake online identities are generated.
function showEmptyState() {
    onlineEmpty.hidden = false;
    studentList.hidden = true;
    onlineCount.textContent = "0 online";
}

studentSearch.addEventListener("input", () => {
    // No online student data exists until the backend is connected.
    showEmptyState();
});

rulesAccepted.addEventListener("change", () => {
    if (rulesAccepted.checked) {
        showStatus(
            rulesStatus,
            "Rules accepted for this preview. This choice is not saved to your account."
        );
    } else {
        showStatus(
            rulesStatus,
            "Please read and accept the Group Chat Rules before using the future group chat service."
        );
    }
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showStatus(
        safetyStatus,
        "Group messaging is disabled in this frontend preview. No message was sent or stored.",
        true
    );
});

leaveGroupBtn.addEventListener("click", () => {
    showStatus(
        safetyStatus,
        "You have not joined a group in this preview. No action was taken."
    );
});

function openSafetyDialog(action) {
    pendingSafetyAction = action;
    dialogStatus.textContent = "";
    reportReason.value = "";

    if (action === "block") {
        dialogTitle.textContent = "Block Student";
        dialogText.textContent =
            "Blocking will be connected to the secure backend later. No student is blocked in this preview.";

        reportReason.hidden = true;
        reportReasonLabel.hidden = true;
    } else {
        dialogTitle.textContent = "Report a Concern";
        dialogText.textContent =
            "If a student is harassing or threatening you, leave the conversation and seek help from a trusted adult when appropriate. Reports will be submitted only after backend implementation.";

        reportReason.hidden = false;
        reportReasonLabel.hidden = false;
    }

    dialogConfirmBtn.textContent = "Preview Only";

    if (typeof safetyDialog.showModal === "function") {
        safetyDialog.showModal();
    } else {
        showStatus(
            safetyStatus,
            "This browser does not support the safety dialog. No action was taken.",
            true
        );
    }
}

blockBtn.addEventListener("click", () => {
    openSafetyDialog("block");
});

reportBtn.addEventListener("click", () => {
    openSafetyDialog("report");
});

dialogConfirmBtn.addEventListener("click", () => {
    if (
        pendingSafetyAction === "report" &&
        reportReason.value.trim().length < 5
    ) {
        showStatus(
            dialogStatus,
            "Please enter at least 5 characters. Do not include sensitive personal data.",
            true
        );
        reportReason.focus();
        return;
    }

    const action = pendingSafetyAction === "block"
        ? "Block"
        : "Report";

    showStatus(
        dialogStatus,
        `${action} is preview-only. No data was sent and no action was applied.`
    );

    showStatus(
        safetyStatus,
        `${action} will work after secure backend integration.`
    );
});

safetyDialog.addEventListener("close", () => {
    pendingSafetyAction = null;
});

showEmptyState();

showStatus(
    safetyStatus,
    BACKEND_CONNECTED
        ? ""
        : "Preview mode: online discovery, group membership, messaging, Block and Report are not connected."
);

});