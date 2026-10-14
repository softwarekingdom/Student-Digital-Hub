"use strict";

document.addEventListener("DOMContentLoaded", () => {
const connectForm = document.getElementById("connectForm");
const studentIdInput = document.getElementById("studentIdInput");
const connectStatus = document.getElementById("connectStatus");

const rulesAccepted = document.getElementById("rulesAccepted");
const rulesStatus = document.getElementById("rulesStatus");

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

const leaveChatBtn = document.getElementById("leaveChatBtn");
const messageForm = document.getElementById("messageForm");

// Frontend only. No API requests or fake IDs/messages.
const BACKEND_CONNECTED = false;

let pendingSafetyAction = null;

function showStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("status-error", isError);
}

// Validate the 10-digit ID. No request is sent yet.
connectForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const studentId = studentIdInput.value.trim();

    if (!/^\d{10}$/.test(studentId)) {
        showStatus(
            connectStatus,
            "Enter a valid Student Chat ID containing exactly 10 digits.",
            true
        );
        studentIdInput.focus();
        return;
    }

    if (!rulesAccepted.checked) {
        showStatus(
            connectStatus,
            "Please accept the Community Chat Rules before sending a request.",
            true
        );
        document.getElementById("rules-title")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        return;
    }

    if (!BACKEND_CONNECTED) {
        showStatus(
            connectStatus,
            "Preview only: your request has not been sent. Backend integration is required.",
            true
        );
    }
});

// Allow digits only in the Student Chat ID field.
studentIdInput.addEventListener("input", () => {
    const cleaned = studentIdInput.value
        .replace(/\D/g, "")
        .slice(0, 10);

    if (studentIdInput.value !== cleaned) {
        studentIdInput.value = cleaned;
    }

    showStatus(connectStatus, "");
});

// The checkbox only records the current preview choice.
rulesAccepted.addEventListener("change", () => {
    if (rulesAccepted.checked) {
        showStatus(
            rulesStatus,
            "Rules accepted for this preview. This choice is not saved to your account."
        );
    } else {
        showStatus(
            rulesStatus,
            "Please read and accept the Community Chat Rules before using the future chat service."
        );
    }

    showStatus(connectStatus, "");
});

function openSafetyDialog(action) {
    pendingSafetyAction = action;
    dialogStatus.textContent = "";
    reportReason.value = "";

    if (action === "block") {
        dialogTitle.textContent = "Block Student";
        dialogText.textContent =
            "Blocking will be connected to the secure backend later. In this preview, no student is blocked.";

        reportReason.hidden = true;
        reportReasonLabel.hidden = true;
    } else {
        dialogTitle.textContent = "Report a Concern";
        dialogText.textContent =
            "If someone is harassing or threatening you, leave the conversation and seek help from a trusted adult when appropriate. Reports will be submitted only after backend implementation.";

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

leaveChatBtn.addEventListener("click", () => {
    showStatus(
        safetyStatus,
        "No active chat exists in this frontend preview."
    );
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showStatus(
        safetyStatus,
        "Messaging is disabled in this preview. No message was sent or stored."
    );
});

showStatus(
    connectStatus,
    "Preview mode: ID validation works, but requests, online status, Block, Report, and messaging are not connected."
);

});