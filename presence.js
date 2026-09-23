// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
// presence.js
// Online Users Presence Engine
// ==========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ==========================================
// Configuration
// ==========================================

const PRESENCE_COLLECTION = "presence";
const HEARTBEAT_INTERVAL = 20000;

// تر دې وخت وروسته کاروونکی Offline ګڼل کېږي.
const ONLINE_TIMEOUT = 60000;


// ==========================================
// State
// ==========================================

let heartbeatTimer = null;
let unsubscribePresence = null;
let unsubscribeAuthPresence = null;
let currentPresenceUser = null;
let listenersBound = false;


// ==========================================
// Presence Document Reference
// ==========================================

function getPresenceReference(uid) {
    return doc(db, PRESENCE_COLLECTION, uid);
}

function getLastSeenMillis(value) {
    if (value && typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (value && typeof value.toDate === "function") {
        return value.toDate().getTime();
    }

    return 0;
}

async function writePresence(user, data = {}) {
    const presenceRef = getPresenceReference(user.uid);

    await setDoc(
        presenceRef,
        {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email || "نامعلوم کاروونکی",
            ...data,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
}


// ==========================================
// Create / Update Online Presence
// ==========================================

export async function setUserOnline(user = auth.currentUser) {
    try {
        if (!user) {
            return {
                success: false,
                message: "کاروونکی Login نه دی."
            };
        }

        await writePresence(user, {
            online: true,
            lastSeen: serverTimestamp()
        });

        currentPresenceUser = user;

        return {
            success: true
        };
    } catch (error) {
        console.error("Set Online Error:", error);

        return {
            success: false,
            message: error.message || "آنلاین حالت ثبت نه شو."
        };
    }
}


// ==========================================
// Heartbeat
// ==========================================

export async function updatePresenceHeartbeat() {
    try {
        const user = auth.currentUser || currentPresenceUser;

        if (!user) {
            return;
        }

        await writePresence(user, {
            online: true,
            lastSeen: serverTimestamp()
        });
    } catch (error) {
        console.error("Presence Heartbeat Error:", error);
    }
}


// ==========================================
// Set User Offline
// ==========================================

export async function setUserOffline(user = auth.currentUser || currentPresenceUser) {
    try {
        if (!user) {
            return {
                success: false
            };
        }

        await writePresence(user, {
            online: false,
            lastSeen: serverTimestamp()
        });

        stopPresenceHeartbeat();

        if (currentPresenceUser && currentPresenceUser.uid === user.uid) {
            currentPresenceUser = null;
        }

        return {
            success: true
        };
    } catch (error) {
        console.error("Set Offline Error:", error);

        return {
            success: false,
            message: error.message || "Offline حالت ثبت نه شو."
        };
    }
}


// ==========================================
// Start Heartbeat
// ==========================================

export function startPresenceHeartbeat() {
    stopPresenceHeartbeat();
    updatePresenceHeartbeat();

    heartbeatTimer = setInterval(() => {
        updatePresenceHeartbeat();
    }, HEARTBEAT_INTERVAL);
}


// ==========================================
// Stop Heartbeat
// ==========================================

export function stopPresenceHeartbeat() {
    if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}


// ==========================================
// Start Presence System
// ==========================================

export function startPresence() {
    if (unsubscribeAuthPresence) {
        return unsubscribeAuthPresence;
    }

    unsubscribeAuthPresence = onAuthStateChanged(auth, async (user) => {
        try {
            if (!user) {
                if (currentPresenceUser) {
                    await setUserOffline(currentPresenceUser);
                }

                currentPresenceUser = null;
                stopPresenceHeartbeat();
                return;
            }

            if (
                currentPresenceUser &&
                currentPresenceUser.uid &&
                currentPresenceUser.uid !== user.uid
            ) {
                await setUserOffline(currentPresenceUser);
            }

            currentPresenceUser = user;
            await setUserOnline(user);
            startPresenceHeartbeat();
        } catch (error) {
            console.error("Start Presence Error:", error);
        }
    });

    return unsubscribeAuthPresence;
}


// ==========================================
// Listen to Online Users
// ==========================================

export function listenOnlineUsers(callback) {
    if (typeof callback !== "function") {
        throw new Error("Callback function ضروري دی.");
    }

    if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
    }

    const presenceRef = collection(db, PRESENCE_COLLECTION);

    const onlineQuery = query(
        presenceRef,
        where("online", "==", true)
    );

    unsubscribePresence = onSnapshot(
        onlineQuery,
        (snapshot) => {
            const now = Date.now();
            const users = [];

            snapshot.forEach((document) => {
                const data = document.data() || {};
                const lastSeenMillis = getLastSeenMillis(data.lastSeen);

                const isReallyOnline =
                    lastSeenMillis > 0 &&
                    (now - lastSeenMillis) <= ONLINE_TIMEOUT;

                if (isReallyOnline) {
                    users.push({
                        id: document.id,
                        uid: data.uid || document.id,
                        email: data.email || "",
                        displayName: data.displayName || data.email || "نامعلوم",
                        online: true,
                        lastSeen: data.lastSeen || null,
                        lastSeenMillis
                    });
                }
            });

            users.sort((a, b) => (b.lastSeenMillis || 0) - (a.lastSeenMillis || 0));

            callback({
                success: true,
                users: users.map(({ lastSeenMillis, ...rest }) => rest),
                count: users.length
            });
        },
        (error) => {
            console.error("Online Users Listener Error:", error);

            callback({
                success: false,
                users: [],
                count: 0,
                message: error.message || "د آنلاین کسانو معلومات ترلاسه نه شول."
            });
        }
    );

    return unsubscribePresence;
}


// ==========================================
// Get Online Users Once
// ==========================================

export function subscribeToOnlineUsers(callback) {
    return listenOnlineUsers(callback);
}


// ==========================================
// Stop Online Users Listener
// ==========================================

export function stopOnlineUsersListener() {
    if (unsubscribePresence) {
        unsubscribePresence();
        unsubscribePresence = null;
    }
}


// ==========================================
// Stop Presence Listener
// ==========================================

export function stopPresenceListener() {
    if (unsubscribeAuthPresence) {
        unsubscribeAuthPresence();
        unsubscribeAuthPresence = null;
    }
}


// ==========================================
// Browser Close / Page Hide
// ==========================================

function bindBrowserEvents() {
    if (listenersBound || typeof window === "undefined" || typeof document === "undefined") {
        return;
    }

    listenersBound = true;

    window.addEventListener("beforeunload", () => {
        const user = auth.currentUser || currentPresenceUser;

        if (!user) {
            return;
        }

        stopPresenceHeartbeat();

        // دا best-effort ده.
        // Firestore کې synchronous offline write نه شي تضمین کېدای.
        setUserOffline(user).catch(() => {});
    });

    document.addEventListener("visibilitychange", () => {
        const user = auth.currentUser || currentPresenceUser;

        if (!user) {
            return;
        }

        if (document.visibilityState === "visible") {
            updatePresenceHeartbeat();
            startPresenceHeartbeat();
        }
    });
}


// ==========================================
// Get Current Presence User
// ==========================================

export function getPresenceUser() {
    return currentPresenceUser;
}


// ==========================================
// Destroy Presence System
// ==========================================

export async function destroyPresence() {
    stopPresenceHeartbeat();
    stopOnlineUsersListener();
    stopPresenceListener();

    if (currentPresenceUser) {
        try {
            await setUserOffline(currentPresenceUser);
        } catch (_) {}
    }

    currentPresenceUser = null;
}


// ==========================================
// Initialize Presence
// ==========================================

export function initializePresence() {
    bindBrowserEvents();
    return startPresence();
}


// ==========================================
// Default Export
// ==========================================

bindBrowserEvents();

export default {
    setUserOnline,
    updatePresenceHeartbeat,
    setUserOffline,
    startPresence,
    startPresenceHeartbeat,
    stopPresenceHeartbeat,
    listenOnlineUsers,
    subscribeToOnlineUsers,
    stopOnlineUsersListener,
    stopPresenceListener,
    getPresenceUser,
    initializePresence,
    destroyPresence
};