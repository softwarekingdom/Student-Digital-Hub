/* =========================================================
   STUDENT DIGITAL HUB
   GEMINI AI CHAT
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const form =
    document.getElementById("geminiForm");

const input =
    document.getElementById("promptInput");

const messages =
    document.getElementById("chatMessages");

const sendButton =
    document.getElementById("sendButton");

const clearButton =
    document.getElementById("clearChatBtn");

const statusMessage =
    document.getElementById("statusMessage");


/* =========================================================
   STATE
========================================================= */

let isThinking = false;


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessage(
    text,
    type
) {

    const message =
        document.createElement("div");

    message.className =
        `message ${type}-message`;


    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        type === "user"
            ? "👤"
            : "✨";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("div");

    name.className =
        "message-name";

    name.textContent =
        type === "user"
            ? "You"
            : "Gemini";


    const messageText =
        document.createElement("div");

    messageText.className =
        "message-text";

    messageText.textContent =
        text;


    content.appendChild(name);

    content.appendChild(messageText);

    message.appendChild(avatar);

    message.appendChild(content);

    messages.appendChild(message);


    scrollToBottom();

}


/* =========================================================
   SCROLL TO BOTTOM
========================================================= */

function scrollToBottom() {

    window.requestAnimationFrame(
        function() {

            window.scrollTo(
                {
                    top:
                        document.body.scrollHeight,

                    behavior:
                        "smooth"
                }
            );

        }
    );

}


/* =========================================================
   THINKING MESSAGE
========================================================= */

function showThinking() {

    removeThinking();


    const message =
        document.createElement("div");

    message.className =
        "message ai-message";

    message.id =
        "thinkingMessage";


    message.innerHTML = `

        <div class="message-avatar">
            ✨
        </div>

        <div class="message-content">

            <div class="message-name">
                Gemini
            </div>

            <div class="thinking">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;


    messages.appendChild(message);


    scrollToBottom();

}


/* =========================================================
   REMOVE THINKING
========================================================= */

function removeThinking() {

    const thinking =
        document.getElementById(
            "thinkingMessage"
        );


    if (thinking) {

        thinking.remove();

    }

}


/* =========================================================
   ASK GEMINI
========================================================= */

async function askGemini(
    prompt
) {

    const response =
        await fetch(
            "/api/ai/gemini",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            prompt:
                                prompt
                        }
                    )
            }
        );


    let data;


    try {

        data =
            await response.json();

    }

    catch (error) {

        throw new Error(
            "Server returned an invalid response."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Gemini request failed."
        );

    }


    if (
        !data.success ||
        typeof data.response !==
            "string"
    ) {

        throw new Error(
            "Gemini returned an invalid response."
        );

    }


    return data.response;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isThinking) {

        return;

    }


    const prompt =
        input.value.trim();


    if (!prompt) {

        return;

    }


    isThinking =
        true;


    statusMessage.textContent =
        "";


    input.value =
        "";

    input.style.height =
        "auto";


    addMessage(
        prompt,
        "user"
    );


    showThinking();


    sendButton.disabled =
        true;


    try {

        const answer =
            await askGemini(
                prompt
            );


        removeThinking();


        addMessage(
            answer,
            "ai"
        );

    }

    catch (error) {

        removeThinking();


        addMessage(
            "Sorry, I couldn't connect to Gemini right now.",
            "ai"
        );


        statusMessage.textContent =
            error.message ||
            "Something went wrong.";

        console.error(
            "Gemini error:",
            error
        );

    }

    finally {

        isThinking =
            false;

        sendButton.disabled =
            false;

        input.focus();

    }

}


/* =========================================================
   FORM SUBMIT
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            sendMessage();

        }
    );

}


/* =========================================================
   ENTER TO SEND
========================================================= */

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


/* =========================================================
   AUTO RESIZE TEXTAREA
========================================================= */

if (input) {

    input.addEventListener(
        "input",
        function() {

            this.style.height =
                "auto";


            const newHeight =
                Math.min(
                    this.scrollHeight,
                    180
                );


            this.style.height =
                `${newHeight}px`;

        }
    );

}


/* =========================================================
   SUGGESTION BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".suggestion"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    if (isThinking) {

                        return;

                    }


                    const prompt =
                        this.dataset.prompt;


                    if (!prompt) {

                        return;

                    }


                    input.value =
                        prompt;


                    input.dispatchEvent(
                        new Event(
                            "input"
                        )
                    );


                    input.focus();

                }
            );

        }
    );


/* =========================================================
   CLEAR CHAT
========================================================= */

if (clearButton) {

    clearButton.addEventListener(
        "click",
        function() {

            if (isThinking) {

                return;

            }


            const confirmed =
                window.confirm(
                    "Clear this conversation?"
                );


            if (!confirmed) {

                return;

            }


            messages.innerHTML = `

                <div class="welcome-screen">

                    <div class="welcome-logo">
                        ✨
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
                        >
                            ⚡
                            <span>
                                Explain Physics
                            </span>
                        </button>


                        <button
                            class="suggestion"
                            data-prompt="Explain photosynthesis for a school student."
                        >
                            🌱
                            <span>
                                Explain Science
                            </span>
                        </button>


                        <button
                            class="suggestion"
                            data-prompt="Give me a simple study technique for remembering lessons."
                        >
                            📚
                            <span>
                                Study Help
                            </span>
                        </button>


                        <button
                            class="suggestion"
                            data-prompt="Teach me an interesting fact about space."
                        >
                            🚀
                            <span>
                                Explore Space
                            </span>
                        </button>

                    </div>

                </div>

            `;


            statusMessage.textContent =
                "";


            attachSuggestionEvents();


            input.focus();

        }
    );

}


/* =========================================================
   RECONNECT SUGGESTION EVENTS
========================================================= */

function attachSuggestionEvents() {

    document
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        if (isThinking) {

                            return;

                        }


                        const prompt =
                            this.dataset.prompt;


                        if (!prompt) {

                            return;

                        }


                        input.value =
                            prompt;


                        input.dispatchEvent(
                            new Event(
                                "input"
                            )
                        );


                        input.focus();

                    }
                );

            }
        );

}


/* =========================================================
   INITIAL SETUP
========================================================= */

attachSuggestionEvents();

if (input) {

    input.focus();

}