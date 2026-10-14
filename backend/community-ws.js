const http = require("http");
const {
    WebSocketServer,
    WebSocket
} = require("ws");

function startCommunityWebSocketServer({
    app,
    PORT,
    getCurrentSession,
    supabase,
    SESSION_COOKIE
}) {
    const server = http.createServer(app);

    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 8192
    });

    // Online students are stored in memory only.
    const onlineStudents = new Map();

    const allowedOrigins = new Set(
        (
            process.env.COMMUNITY_WS_ALLOWED_ORIGINS ||
            [
                "https://student-digital-hub.onrender.com",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ].join(",")
        )
            .split(",")
            .map(value => value.trim())
            .filter(Boolean)
    );

    function rejectUpgrade(socket, status, message) {
        if (socket.destroyed) return;

        const body = message;
        const response = [
            `HTTP/1.1 ${status} ${status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : status === 404 ? "Not Found" : "Internal Server Error"}`,
            "Connection: close",
            "Content-Type: text/plain; charset=utf-8",
            `Content-Length: ${Buffer.byteLength(body)}`,
            "",
            body
        ].join("\r\n");

        socket.end(response);
    }

    function readCookie(req, name) {
        const header = req.headers.cookie || "";

        for (const part of header.split(";")) {
            const index = part.indexOf("=");

            if (index < 0) continue;

            const key = part.slice(0, index).trim();
            const value = part.slice(index + 1).trim();

            if (key !== name) continue;

            try {
                return decodeURIComponent(value);
            } catch {
                return null;
            }
        }

        return null;
    }

    function normalizeGender(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function sendJson(ws, payload) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        }
    }

    function visibleStudents(gender, excludeProfileId) {
        const normalized = normalizeGender(gender);

        if (!normalized) return [];

        return Array.from(onlineStudents.values())
            .filter(student =>
                student.profileId !== excludeProfileId &&
                student.gender === normalized
            )
            .map(student => student.publicProfile);
    }

    function broadcastOnlineLists() {
        for (const client of wss.clients) {
            if (client.readyState !== WebSocket.OPEN) {
                continue;
            }

            sendJson(client, {
                type: "online_students",
                students: visibleStudents(
                    client.gender,
                    client.profileId
                )
            });
        }
    }

    function removeSocket(ws) {
        if (!ws.profileId) return;

        const record = onlineStudents.get(ws.profileId);

        if (!record) return;

        record.connections.delete(ws);

        // Another browser tab may still be connected.
        if (record.connections.size === 0) {
            onlineStudents.delete(ws.profileId);
            broadcastOnlineLists();
        }
    }

    server.on("upgrade", (req, socket, head) => {
        let pathname;

        try {
            pathname = new URL(
                req.url,
                "http://localhost"
            ).pathname;
        } catch {
            rejectUpgrade(socket, 400, "Invalid request.");
            return;
        }

        if (pathname !== "/ws/community") {
            rejectUpgrade(socket, 404, "WebSocket endpoint not found.");
            return;
        }

        const origin = req.headers.origin;

        if (!origin || !allowedOrigins.has(origin)) {
            rejectUpgrade(socket, 403, "Origin not allowed.");
            return;
        }

        void (async () => {
            const rawToken = readCookie(
                req,
                SESSION_COOKIE
            );

            if (!rawToken) {
                rejectUpgrade(socket, 401, "Login required.");
                return;
            }

            // Reuse the existing SDH session system.
            const session = await getCurrentSession({
                cookies: {
                    [SESSION_COOKIE]: rawToken
                }
            });

            if (!session || !session.profile_id) {
                rejectUpgrade(socket, 401, "Valid login required.");
                return;
            }

            const {
                data: profile,
                error: profileError
            } = await supabase
                .from("profiles")
                .select(
                    "id, full_name, username, avatar_url, grade, gender"
                )
                .eq("id", session.profile_id)
                .maybeSingle();

            if (profileError) {
                console.error(
                    "Community WebSocket profile error:",
                    profileError
                );

                rejectUpgrade(
                    socket,
                    500,
                    "Could not verify student profile."
                );
                return;
            }

            if (!profile) {
                rejectUpgrade(socket, 401, "Student profile not found.");
                return;
            }

            const {
                data: chatIdentity,
                error: identityError
            } = await supabase
                .from("community_student_ids")
                .select("chat_id")
                .eq("profile_id", profile.id)
                .maybeSingle();

            if (identityError) {
                console.error(
                    "Community WebSocket Chat ID lookup error:",
                    identityError
                );

                rejectUpgrade(
                    socket,
                    500,
                    "Could not load student identity."
                );
                return;
            }

            if (socket.destroyed) return;

            const gender = normalizeGender(profile.gender);

            const publicProfile = {
                fullName: profile.full_name || "",
                username: profile.username || "",
                chatId: chatIdentity?.chat_id || null,
                avatarUrl: profile.avatar_url || null,
                grade: profile.grade || null
            };

            wss.handleUpgrade(req, socket, head, ws => {
                ws.profileId = profile.id;
                ws.gender = gender;
                ws.isAlive = true;

                let record = onlineStudents.get(profile.id);

                if (!record) {
                    record = {
                        profileId: profile.id,
                        gender,
                        publicProfile,
                        connections: new Set()
                    };

                    onlineStudents.set(profile.id, record);
                } else {
                    record.gender = gender;
                    record.publicProfile = publicProfile;
                }

                record.connections.add(ws);

                ws.on("pong", () => {
                    ws.isAlive = true;
                });

                ws.on("message", (data, isBinary) => {
                    if (isBinary) {
                        ws.close(1003, "Text messages only.");
                        return;
                    }

                    let message;

                    try {
                        message = JSON.parse(data.toString());
                    } catch {
                        sendJson(ws, {
                            type: "error",
                            message: "Invalid message format."
                        });
                        return;
                    }

                    // Chat messages will be implemented separately.
                    if (message.type === "ping") {
                        sendJson(ws, {
                            type: "pong",
                            timestamp: Date.now()
                        });
                        return;
                    }

                    sendJson(ws, {
                        type: "error",
                        message: "Unsupported message type."
                    });
                });

                ws.on("close", () => removeSocket(ws));
                ws.on("error", () => removeSocket(ws));

                sendJson(ws, {
                    type: "connected",
                    message: "SDH Community connected."
                });

                sendJson(ws, {
                    type: "online_students",
                    students: visibleStudents(
                        gender,
                        profile.id
                    )
                });

                broadcastOnlineLists();
            });
        })().catch(error => {
            console.error(
                "Community WebSocket error:",
                error.message
            );

            rejectUpgrade(
                socket,
                500,
                "WebSocket connection failed."
            );
        });
    });

    // Detect broken connections and clean up offline students.
    const heartbeat = setInterval(() => {
        for (const ws of wss.clients) {
            if (ws.isAlive === false) {
                ws.terminate();
                continue;
            }

            ws.isAlive = false;
            ws.ping();
        }
    }, 30000);

    heartbeat.unref();

    wss.on("close", () => {
        clearInterval(heartbeat);
    });

    server.listen(PORT, () => {
        console.log("======================================");
        console.log("🎓 Student Digital Hub");
        console.log("🔐 Custom Authentication Backend");
        console.log(`🚀 Server running on port ${PORT}`);
        console.log("🔌 Community WebSocket: /ws/community");
        console.log("======================================");
    });

    return server;
}

module.exports = {
    startCommunityWebSocketServer
};
