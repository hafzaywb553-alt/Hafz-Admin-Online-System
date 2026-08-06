// ==========================================
// Hafz Admin Online System
// presence.js
// Online Users Presence Engine
// ==========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
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

let currentPresenceUser = null;


// ==========================================
// Presence Document Reference
// ==========================================

function getPresenceReference(uid) {

    return doc(
        db,
        PRESENCE_COLLECTION,
        uid
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


        const presenceRef =
            getPresenceReference(
                user.uid
            );


        await setDoc(

            presenceRef,

            {

                uid:
                    user.uid,

                email:
                    user.email || "",

                displayName:
                    user.displayName ||
                    user.email ||
                    "نامعلوم کاروونکی",

                online:
                    true,

                lastSeen:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            },

            {
                merge: true
            }

        );


        currentPresenceUser =
            user;


        return {

            success: true

        };


    } catch (error) {

        console.error(
            "Set Online Error:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "آنلاین حالت ثبت نه شو."

        };

    }

}


// ==========================================
// Heartbeat
// ==========================================

export async function updatePresenceHeartbeat() {

    try {

        const user =
            auth.currentUser;


        if (!user) {
            return;
        }


        const presenceRef =
            getPresenceReference(
                user.uid
            );


        await updateDoc(

            presenceRef,

            {

                online:
                    true,

                lastSeen:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }

        );


    } catch (error) {

        console.error(
            "Presence Heartbeat Error:",
            error
        );

    }

}


// ==========================================
// Set User Offline
// ==========================================

export async function setUserOffline(
    user = auth.currentUser
) {

    try {

        if (!user) {

            return {
                success: false
            };

        }


        const presenceRef =
            getPresenceReference(
                user.uid
            );


        await updateDoc(

            presenceRef,

            {

                online:
                    false,

                lastSeen:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }

        );


        stopPresenceHeartbeat();


        return {

            success: true

        };


    } catch (error) {

        console.error(
            "Set Offline Error:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "Offline حالت ثبت نه شو."

        };

    }

}


// ==========================================
// Start Heartbeat
// ==========================================

export function startPresenceHeartbeat() {

    stopPresenceHeartbeat();


    updatePresenceHeartbeat();


    heartbeatTimer =
        setInterval(

            () => {

                updatePresenceHeartbeat();

            },

            HEARTBEAT_INTERVAL

        );

}


// ==========================================
// Stop Heartbeat
// ==========================================

export function stopPresenceHeartbeat() {

    if (
        heartbeatTimer !== null
    ) {

        clearInterval(
            heartbeatTimer
        );

        heartbeatTimer = null;

    }

}


// ==========================================
// Start Presence System
// ==========================================

export function startPresence() {

    return onAuthStateChanged(

        auth,

        async (user) => {

            if (!user) {

                stopPresenceHeartbeat();

                currentPresenceUser =
                    null;

                return;

            }


            currentPresenceUser =
                user;


            await setUserOnline(
                user
            );


            startPresenceHeartbeat();

        }

    );

}


// ==========================================
// Listen to Online Users
// ==========================================

export function listenOnlineUsers(
    callback
) {

    if (
        typeof callback !==
        "function"
    ) {

        throw new Error(
            "Callback function ضروري دی."
        );

    }


    if (
        unsubscribePresence
    ) {

        unsubscribePresence();

        unsubscribePresence =
            null;

    }


    const presenceRef =
        collection(
            db,
            PRESENCE_COLLECTION
        );


    const onlineQuery =
        query(

            presenceRef,

            where(
                "online",
                "==",
                true
            ),

            orderBy(
                "lastSeen",
                "desc"
            )

        );


    unsubscribePresence =
        onSnapshot(

            onlineQuery,

            (snapshot) => {

                const now =
                    Date.now();


                const users =
                    [];


                snapshot.forEach(
                    (document) => {

                        const data =
                            document.data();


                        let lastSeenTime =
                            0;


                        if (
                            data.lastSeen &&
                            typeof data.lastSeen.toMillis ===
                            "function"
                        ) {

                            lastSeenTime =
                                data.lastSeen.toMillis();

                        }


                        const isReallyOnline =
                            lastSeenTime > 0 &&
                            (
                                now -
                                lastSeenTime
                            ) <=
                            ONLINE_TIMEOUT;


                        if (
                            isReallyOnline
                        ) {

                            users.push({

                                id:
                                    document.id,

                                uid:
                                    data.uid ||
                                    document.id,

                                email:
                                    data.email ||
                                    "",

                                displayName:
                                    data.displayName ||
                                    data.email ||
                                    "نامعلوم",

                                online:
                                    true,

                                lastSeen:
                                    data.lastSeen ||
                                    null

                            });

                        }

                    }
                );


                callback(

                    {

                        success: true,

                        users:
                            users,

                        count:
                            users.length

                    }

                );

            },

            (error) => {

                console.error(
                    "Online Users Listener Error:",
                    error
                );


                callback({

                    success: false,

                    users: [],

                    count: 0,

                    message:
                        error.message ||
                        "د آنلاین کسانو معلومات ترلاسه نه شول."

                });

            }

        );


    return unsubscribePresence;

}


// ==========================================
// Get Online Users Once
// ==========================================

export function subscribeToOnlineUsers(
    callback
) {

    return listenOnlineUsers(
        callback
    );

}


// ==========================================
// Stop Online Users Listener
// ==========================================

export function stopOnlineUsersListener() {

    if (
        unsubscribePresence
    ) {

        unsubscribePresence();

        unsubscribePresence =
            null;

    }

}


// ==========================================
// Browser Close / Page Hide
// ==========================================

window.addEventListener(

    "beforeunload",

    () => {

        const user =
            auth.currentUser;


        if (!user) {
            return;
        }


        stopPresenceHeartbeat();


        // دا غوښتنه best-effort ده.
        // اصلي Offline تشخیص د lastSeen
        // timeout له لارې هم کېږي.

        const presenceRef =
            getPresenceReference(
                user.uid
            );


        updateDoc(

            presenceRef,

            {

                online:
                    false,

                updatedAt:
                    serverTimestamp(),

                lastSeen:
                    serverTimestamp()

            }

        ).catch(
            () => {}
        );

    }

);


// ==========================================
// Page Visibility
// ==========================================

document.addEventListener(

    "visibilitychange",

    () => {

        const user =
            auth.currentUser;


        if (!user) {
            return;
        }


        if (
            document.visibilityState ===
            "visible"
        ) {

            updatePresenceHeartbeat();

            startPresenceHeartbeat();

        }

    }

);


// ==========================================
// Get Current Presence User
// ==========================================

export function getPresenceUser() {

    return currentPresenceUser;

}


// ==========================================
// Initialize Presence
// ==========================================

export function initializePresence() {

    return startPresence();

}


// ==========================================
// Default Export
// ==========================================

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

    getPresenceUser,

    initializePresence

};