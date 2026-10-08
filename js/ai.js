/* =========================================
   STUDYMATE AI
   FRONTEND
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const chatMessages = document.getElementById("chatMessages");

const aiForm = document.getElementById("aiForm");

const promptInput = document.getElementById("promptInput");

const sendButton = document.getElementById("sendButton");

const clearChatBtn = document.getElementById("clearChatBtn");

const statusMessage = document.getElementById("statusMessage");

const suggestions = document.querySelectorAll(".suggestion");


/* =========================================
   STATE
========================================= */

let isLoading = false;


/* =========================================
   AUTO RESIZE TEXTAREA
========================================= */

function resizeTextarea() {

    promptInput.style.height = "auto";

    promptInput.style.height =
        Math.min(promptInput.scrollHeight, 150) + "px";
}


promptInput.addEventListener("input", resizeTextarea);


/* =========================================
   SCROLL TO BOTTOM
========================================= */

function scrollToBottom() {

    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: "smooth"
    });

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* =========================================
   ADD USER MESSAGE
========================================= */

function addUserMessage(message) {

    const messageElement = document.createElement("div");

    messageElement.className =
        "message user-message";


    messageElement.innerHTML = `

        <div class="message-avatar">
            👤
        </div>

        <div class="message-content">

            <div class="message-name">
                You
            </div>

            <div class="message-bubble">
                ${escapeHTML(message)}
            </div>

        </div>

    `;


    chatMessages.appendChild(messageElement);

    scrollToBottom();

}


/* =========================================
   ADD AI MESSAGE
========================================= */

function addAIMessage(message) {

    const messageElement = document.createElement("div");

    messageElement.className =
        "message ai-message";


    messageElement.innerHTML = `

        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-name">
                StudyMate
            </div>

            <div class="message-bubble">
                ${escapeHTML(message)}
            </div>

        </div>

    `;


    chatMessages.appendChild(messageElement);

    scrollToBottom();

}


/* =========================================
   LOADING MESSAGE
========================================= */

function addLoadingMessage() {

    const loadingElement =
        document.createElement("div");

    loadingElement.id =
        "aiLoadingMessage";

    loadingElement.className =
        "message ai-message";


    loadingElement.innerHTML = `

        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">

            <div class="message-name">
                StudyMate
            </div>

            <div class="message-bubble">
                <span class="loading-dots">
                    Thinking...
                </span>
            </div>

        </div>

    `;


    chatMessages.appendChild(loadingElement);

    scrollToBottom();

}


/* =========================================
   REMOVE LOADING MESSAGE
========================================= */

function removeLoadingMessage() {

    const loadingElement =
        document.getElementById(
            "aiLoadingMessage"
        );


    if (loadingElement) {

        loadingElement.remove();

    }

}


/* =========================================
   STATUS
========================================= */

function showStatus(message) {

    statusMessage.textContent = message;

}


function clearStatus() {

    statusMessage.textContent = "";

}


/* =========================================
   SEND TO BACKEND
========================================= */

async function sendMessage(message) {

    if (isLoading) {
        return;
    }


    if (!message || !message.trim()) {
        return;
    }


    const cleanMessage =
        message.trim();


    isLoading = true;

    sendButton.disabled = true;

    promptInput.disabled = true;


    clearStatus();


    addUserMessage(cleanMessage);

    addLoadingMessage();


    try {

        const response =
            await fetch(
                "/api/ai/gemini",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        prompt: cleanMessage
                    })
                }
            );


        let data;


        try {

            data = await response.json();

        } catch (jsonError) {

            throw new Error(
                "Server returned an invalid response."
            );

        }


        removeLoadingMessage();


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "AI request failed."
            );

        }


        if (!data.success) {

            throw new Error(
                data?.message ||
                "StudyMate could not generate a response."
            );

        }


        if (
            !data.response ||
            typeof data.response !== "string"
        ) {

            throw new Error(
                "AI returned an empty response."
            );

        }


        addAIMessage(
            data.response
        );


    } catch (error) {

        removeLoadingMessage();


        console.error(
            "StudyMate error:",
            error
        );


        addAIMessage(
            "Sorry, I couldn't connect to StudyMate right now. Please try again."
        );


        showStatus(
            error.message ||
            "Something went wrong."
        );


    } finally {

        isLoading = false;

        sendButton.disabled = false;

        promptInput.disabled = false;

        promptInput.focus();

    }

}


/* =========================================
   FORM SUBMIT
========================================= */

aiForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const message =
            promptInput.value;


        if (
            !message.trim() ||
            isLoading
        ) {
            return;
        }


        promptInput.value = "";

        resizeTextarea();


        sendMessage(message);

    }
);


/* =========================================
   ENTER TO SEND
========================================= */

promptInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            aiForm.requestSubmit();

        }

    }
);


/* =========================================
   SUGGESTION BUTTONS
========================================= */

suggestions.forEach(
    function (suggestion) {

        suggestion.addEventListener(
            "click",
            function () {

                if (isLoading) {
                    return;
                }


                const prompt =
                    suggestion.dataset.prompt;


                if (!prompt) {
                    return;
                }


                promptInput.value = prompt;

                resizeTextarea();

                promptInput.focus();

            }
        );

    }
);


/* =========================================
   CLEAR CHAT
========================================= */

clearChatBtn.addEventListener(
    "click",
    function () {

        if (isLoading) {
            return;
        }


        const confirmed =
            window.confirm(
                "Clear this conversation?"
            );


        if (!confirmed) {
            return;
        }


        chatMessages.innerHTML = "";


        const welcome =
            document.createElement("div");

        welcome.className =
            "welcome-screen";


        welcome.innerHTML = `

            <div class="welcome-logo">
                🤖
            </div>

            <h2>
                What can I help you learn?
            </h2>

            <p>
                Ask questions, explain lessons,
                solve problems and explore ideas.
            </p>

            <div class="suggestion-grid">

                <button
                    class="suggestion"
                    data-prompt="Explain Newton's first law in simple words."
                    type="button"
                >
                    ⚡
                    <span>
                        Explain Physics
                    </span>
                </button>

                <button
                    class="suggestion"
                    data-prompt="Explain photosynthesis for a school student."
                    type="button"
                >
                    🌱
                    <span>
                        Explain Science
                    </span>
                </button>

                <button
                    class="suggestion"
                    data-prompt="Give me a simple study technique for remembering lessons."
                    type="button"
                >
                    📚
                    <span>
                        Study Help
                    </span>
                </button>

                <button
                    class="suggestion"
                    data-prompt="Teach me an interesting fact about space."
                    type="button"
                >
                    🚀
                    <span>
                        Explore Space
                    </span>
                </button>

            </div>

        `;


        chatMessages.appendChild(welcome);


        attachSuggestionEvents();


        clearStatus();

        promptInput.value = "";

        resizeTextarea();

        scrollToBottom();

    }
);


/* =========================================
   SUGGESTION EVENT SETUP
========================================= */

function attachSuggestionEvents() {

    const buttons =
        document.querySelectorAll(
            ".suggestion"
        );


    buttons.forEach(
        function (suggestion) {

            suggestion.addEventListener(
                "click",
                function () {

                    if (isLoading) {
                        return;
                    }


                    const prompt =
                        suggestion.dataset.prompt;


                    if (!prompt) {
                        return;
                    }


                    promptInput.value =
                        prompt;

                    resizeTextarea();

                    promptInput.focus();

                }
            );

        }
    );

}


/* =========================================
   INITIAL SETUP
========================================= */

resizeTextarea();

promptInput.focus();