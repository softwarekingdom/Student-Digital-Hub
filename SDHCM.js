"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const chatIdElement =
        document.getElementById("studentChatId");

    const copyButton =
        document.getElementById("copyIdBtn");

    const hintElement =
        document.getElementById("idHint");

    const statusElement =
        document.getElementById("statusMessage");

    if (
        !chatIdElement ||
        !copyButton ||
        !hintElement ||
        !statusElement
    ) {
        console.error(
            "SDH Community: Required UI elements are missing."
        );
        return;
    }

    let studentChatId = "";

    function updateCopyButton() {
        copyButton.disabled =
            !/^\d{10}$/.test(studentChatId);
    }

    async function loadStudentChatId() {
        chatIdElement.textContent = "Loading...";
        hintElement.textContent =
            "Fetching your Student Chat ID securely...";
        statusElement.textContent = "";

        try {
            const response = await fetch(
                "/api/community/me",
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load your student profile."
                );
            }

            const student = data.student;
            const chatId = String(
                student?.chatId ?? ""
            );

            if (!/^\d{10}$/.test(chatId)) {
                chatIdElement.textContent =
                    "Not assigned yet";

                hintElement.textContent =
                    "Your Student Chat ID is missing or invalid.";

                statusElement.textContent =
                    "Please contact the SDH administrator.";

                return;
            }

            studentChatId = chatId;
            chatIdElement.textContent = chatId;

            hintElement.textContent =
                "Your secure 10-digit Student Chat ID.";

            statusElement.textContent =
                "Student Chat ID loaded successfully.";

            updateCopyButton();

        } catch (error) {
            console.error(
                "SDH Community profile error:",
                error
            );

            chatIdElement.textContent =
                "Unable to load";

            hintElement.textContent =
                "We could not retrieve your Student Chat ID.";

            statusElement.textContent =
                error.message === "Failed to fetch"
                    ? "Connection failed. Check the server and API URL."
                    : error.message ||
                      "Please log in again and retry.";

            studentChatId = "";
            updateCopyButton();
        }
    }

    copyButton.addEventListener(
        "click",
        async () => {
            if (!/^\d{10}$/.test(studentChatId)) {
                statusElement.textContent =
                    "Your Student Chat ID is unavailable.";
                return;
            }

            try {
                await navigator.clipboard.writeText(
                    studentChatId
                );

                statusElement.textContent =
                    "Student Chat ID copied.";
            } catch (error) {
                statusElement.textContent =
                    "Copy failed. Please copy the ID manually.";
            }
        }
    );

    loadStudentChatId();
});
