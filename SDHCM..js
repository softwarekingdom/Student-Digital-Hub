
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const chatIdElement = document.getElementById("studentChatId");
    const copyButton = document.getElementById("copyIdBtn");
    const hintElement = document.getElementById("idHint");
    const statusElement = document.getElementById("statusMessage");

    if (
        !chatIdElement ||
        !copyButton ||
        !hintElement ||
        !statusElement
    ) {
        console.error("SDH Community: Required UI elements are missing.");
        return;
    }

    function getValidChatId() {
        const id = chatIdElement.textContent.trim();

        // Only accept exactly 10 digits.
        return /^\d{10}$/.test(id) ? id : null;
    }

    function updateCopyButton() {
        copyButton.disabled = !getValidChatId();
    }

    copyButton.addEventListener("click", async () => {
        const chatId = getValidChatId();

        if (!chatId) {
            statusElement.textContent =
                "Your Student Chat ID has not been assigned yet.";
            return;
        }

        try {
            await navigator.clipboard.writeText(chatId);
            statusElement.textContent = "Student Chat ID copied.";
        } catch (error) {
            statusElement.textContent =
                "Copy failed. Please copy your ID manually.";
        }
    });

    // No fake ID is generated in the frontend.
    updateCopyButton();

    hintElement.textContent =
        "Your unique 10-digit ID will appear after secure backend integration.";

    statusElement.textContent =
        "Community Chat preview loaded. Chat services are not connected yet.";
});
