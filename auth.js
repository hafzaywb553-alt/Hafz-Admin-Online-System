// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
// auth.js
// Authentication Engine + Secure Logout History Guard
// ==========================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// System Name
// ==========================================

const SYSTEM_NAME =
    "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس";


// ==========================================
// Login Page
// ==========================================

const LOGIN_PAGE = "./index.html";


// ==========================================
// Firestore Collection
// ==========================================

const ADMINS_COLLECTION = "admins";


// ==========================================
// Allowed Roles
// ==========================================

const ALLOWED_ROLES = [
    "superadmin",
    "admin",
    "user"
];


// ==========================================
// Security Storage Keys
// ==========================================

const LOGOUT_MARKER_KEY =
    "krha_auth_logout_required_v2";

const LOGOUT_IN_PROGRESS_KEY =
    "krha_auth_logout_in_progress_v2";


// ==========================================
// History State Marker
// ==========================================

const LOGIN_HISTORY_MARKER =
    "__krha_login_history_entry_v2";


// ==========================================
// Runtime State
// ==========================================

let redirectingToLogin = false;

let logoutNavigationStarted = false;

let logoutFallbackTimer = null;

let authInitialized = false;

let resolveAuthReady;

let logoutConfirmationOpen = false;

let previousBodyOverflow = "";


// ==========================================
// Auth Ready Promise
// ==========================================

const authReadyPromise =
    new Promise(resolve => {
        resolveAuthReady = resolve;
    });


// ==========================================
// Normalize Helpers
// ==========================================

function normalizeText(value) {
    return String(value || "").trim();
}


function normalizeRole(role) {
    return normalizeText(role).toLowerCase();
}


function isValidRole(role) {
    return ALLOWED_ROLES.includes(
        normalizeRole(role)
    );
}


// ==========================================
// Login Page Detector
// ==========================================

function isLoginPage() {

    try {

        if (
            typeof window === "undefined" ||
            !window.location
        ) {
            return false;
        }

        const pathname =
            String(
                window.location.pathname || ""
            )
                .toLowerCase()
                .replace(/\/+$/, "");

        const fileName =
            pathname.split("/").pop() || "";

        return (
            fileName === "" ||
            fileName === "index.html" ||
            fileName === "login.html"
        );

    } catch (error) {

        console.error(
            "Login Page Detect Error:",
            error
        );

        return false;
    }
}


// ==========================================
// Storage Helpers
// ==========================================

function setLogoutMarker() {

    try {

        sessionStorage.setItem(
            LOGOUT_MARKER_KEY,
            "1"
        );

    } catch (error) {

        console.warn(
            "Set Logout Marker Error:",
            error
        );
    }
}


function clearLogoutMarker() {

    try {

        sessionStorage.removeItem(
            LOGOUT_MARKER_KEY
        );

    } catch (error) {

        console.warn(
            "Clear Logout Marker Error:",
            error
        );
    }
}


function hasLogoutMarker() {

    try {

        return (
            sessionStorage.getItem(
                LOGOUT_MARKER_KEY
            ) === "1"
        );

    } catch (error) {

        console.warn(
            "Read Logout Marker Error:",
            error
        );

        return false;
    }
}


function setLogoutProgress() {

    try {

        sessionStorage.setItem(
            LOGOUT_IN_PROGRESS_KEY,
            "1"
        );

    } catch (error) {

        console.warn(
            "Set Logout Progress Error:",
            error
        );
    }
}


function clearLogoutProgress() {

    try {

        sessionStorage.removeItem(
            LOGOUT_IN_PROGRESS_KEY
        );

    } catch (error) {

        console.warn(
            "Clear Logout Progress Error:",
            error
        );
    }
}


function hasLogoutProgress() {

    try {

        return (
            sessionStorage.getItem(
                LOGOUT_IN_PROGRESS_KEY
            ) === "1"
        );

    } catch (error) {

        console.warn(
            "Read Logout Progress Error:",
            error
        );

        return false;
    }
}


// ==========================================
// Login History Entry
// ==========================================

function ensureLoginHistoryMarker() {

    if (
        typeof window === "undefined" ||
        !window.history
    ) {
        return;
    }

    if (
        !isLoginPage()
    ) {
        return;
    }

    try {

        const currentState =
            window.history.state || {};


        if (
            currentState &&
            currentState[
                LOGIN_HISTORY_MARKER
            ] === true
        ) {

            return;
        }


        const newState = {

            ...currentState,

            [LOGIN_HISTORY_MARKER]:
                true
        };


        window.history.replaceState(
            newState,
            "",
            window.location.href
        );

    } catch (error) {

        console.error(
            "Ensure Login History Marker Error:",
            error
        );
    }
}


// ==========================================
// Is Original Login History Entry
// ==========================================

function isOriginalLoginHistoryEntry() {

    try {

        if (
            typeof window === "undefined" ||
            !window.history
        ) {
            return false;
        }

        const state =
            window.history.state || {};

        return (
            state[
                LOGIN_HISTORY_MARKER
            ] === true
        );

    } catch (error) {

        console.error(
            "Login History Marker Error:",
            error
        );

        return false;
    }
}


// ==========================================
// Lock Current Page During Logout
// ==========================================
//
// مهم:
// دلته نور visibility:hidden نه استعمالېږي.
//
// ځکه visibility:hidden د څو ثانیو لپاره
// سپین/خالي Screen جوړولای شي.
//
// یوازې interaction بندېږي، خو پاڼه پټه نه کېږي.
// ځکه سمدستي index.html ته replace کېږي.
//

function lockCurrentPageDuringLogout() {

    try {

        if (
            typeof document !== "undefined" &&
            document.documentElement
        ) {

            document.documentElement.dataset.krhaLogout =
                "true";

            document.documentElement.style.pointerEvents =
                "none";

            document.documentElement.style.userSelect =
                "none";

            /*
             * visibility:hidden عمداً حذف شوی.
             *
             * هدف:
             * د Logout پر مهال سپین Screen
             * رامنځته نه شي.
             */

        }

    } catch (error) {

        console.warn(
            "Logout Page Lock Error:",
            error
        );
    }
}


// ==========================================
// Unlock Current Page
// ==========================================

function unlockCurrentPage() {

    try {

        if (
            typeof document !== "undefined" &&
            document.documentElement
        ) {

            document.documentElement.dataset.krhaLogout =
                "false";

            document.documentElement.style.pointerEvents =
                "";

            document.documentElement.style.userSelect =
                "";

        }

    } catch (error) {

        console.warn(
            "Unlock Current Page Error:",
            error
        );
    }
}


// ==========================================
// Logout Confirmation Modal
// ==========================================
//
// هو:
//      Logout اجرا کېږي.
//
// نه:
//      هماغه برخه کې پاتې کېږي.
//
// ESC:
//      Cancel.
//
// Enter:
//      Confirm.
//

function showLogoutConfirmation() {

    return new Promise(resolve => {

        if (
            typeof document === "undefined"
        ) {

            resolve(
                window.confirm(
                    "ایا تاسې رښتیا غواړئ له دې سیسټم څخه ووځئ؟"
                )
            );

            return;
        }


        // ======================================
        // Duplicate Protection
        // ======================================

        if (
            logoutConfirmationOpen
        ) {
            return;
        }

        logoutConfirmationOpen =
            true;


        // ======================================
        // Remove Old Modal
        // ======================================

        const existing =
            document.getElementById(
                "krhaLogoutConfirmModal"
            );

        if (
            existing
        ) {

            try {
                existing.remove();
            } catch {}
        }


        // ======================================
        // Save Body Overflow
        // ======================================

        previousBodyOverflow =
            document.body?.style?.overflow ||
            "";


        if (
            document.body
        ) {

            document.body.style.overflow =
                "hidden";
        }


        // ======================================
        // Overlay
        // ======================================

        const overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "krhaLogoutConfirmModal";

        overlay.setAttribute(
            "dir",
            "rtl"
        );


        Object.assign(
            overlay.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "2147483647",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px",
                boxSizing: "border-box",
                background:
                    "radial-gradient(circle at top, rgba(18,62,51,.28), transparent 45%), rgba(1,5,10,.78)",
                backdropFilter:
                    "blur(14px) saturate(125%)",
                WebkitBackdropFilter:
                    "blur(14px) saturate(125%)",
                fontFamily:
                    "'Noto Naskh Arabic', Tahoma, Arial, sans-serif",
                direction: "rtl"
            }
        );


        // ======================================
        // Modal Animation CSS
        // ======================================

        if (
            !document.getElementById(
                "krhaLogoutModalStyles"
            )
        ) {

            const style =
                document.createElement(
                    "style"
                );

            style.id =
                "krhaLogoutModalStyles";

            style.textContent = `

                @keyframes krhaLogoutFadeIn {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }


                @keyframes krhaLogoutDialogIn {
                    from {
                        opacity: 0;
                        transform:
                            translateY(18px)
                            scale(.97);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0)
                            scale(1);
                    }
                }


                @keyframes krhaLogoutPulse {
                    0%,100% {
                        transform: scale(1);
                    }

                    50% {
                        transform: scale(1.045);
                    }
                }


                #krhaLogoutConfirmModal {
                    animation:
                        krhaLogoutFadeIn
                        .18s ease-out;
                }


                #krhaLogoutConfirmDialog {
                    animation:
                        krhaLogoutDialogIn
                        .22s ease-out;
                }


                #krhaLogoutConfirmModal button {
                    -webkit-tap-highlight-color:
                        transparent;
                }


                #krhaLogoutConfirmModal
                button:focus-visible {
                    outline:
                        3px solid
                        rgba(35,239,162,.40);

                    outline-offset:
                        3px;
                }


                @media(max-width:560px) {

                    #krhaLogoutConfirmDialog {
                        width:
                            100% !important;

                        max-width:
                            100% !important;

                        padding:
                            24px 18px 18px !important;

                        border-radius:
                            22px !important;
                    }


                    #krhaLogoutButtonGroup {
                        grid-template-columns:
                            1fr !important;
                    }


                    #krhaLogoutConfirmTitle {
                        font-size:
                            24px !important;
                    }


                    #krhaLogoutConfirmText {
                        font-size:
                            16px !important;
                    }

                }
            `;

            document.head?.appendChild(
                style
            );
        }


        // ======================================
        // Dialog
        // ======================================

        const dialog =
            document.createElement(
                "div"
            );

        dialog.id =
            "krhaLogoutConfirmDialog";


        Object.assign(
            dialog.style,
            {
                position: "relative",
                width: "min(560px,100%)",
                maxWidth: "560px",
                boxSizing: "border-box",
                padding: "30px 28px 24px",
                borderRadius: "28px",
                background:
                    "linear-gradient(145deg, rgba(12,25,36,.99), rgba(4,12,20,.99))",
                border:
                    "1px solid rgba(255,255,255,.13)",
                boxShadow:
                    "0 30px 90px rgba(0,0,0,.60), inset 0 1px 0 rgba(255,255,255,.05)",
                color: "#fff",
                textAlign: "center",
                direction: "rtl"
            }
        );


        // ======================================
        // Top Accent
        // ======================================

        const accent =
            document.createElement(
                "div"
            );


        Object.assign(
            accent.style,
            {
                position: "absolute",
                top: "0",
                left: "12%",
                right: "12%",
                height: "3px",
                borderRadius:
                    "0 0 99px 99px",
                background:
                    "linear-gradient(90deg, transparent, #23EFA2, #25DFFF, transparent)",
                boxShadow:
                    "0 0 18px rgba(35,239,162,.32)"
            }
        );


        // ======================================
        // Icon
        // ======================================

        const iconWrap =
            document.createElement(
                "div"
            );


        Object.assign(
            iconWrap.style,
            {
                width: "82px",
                height: "82px",
                margin: "0 auto 16px",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(145deg, rgba(255,92,92,.20), rgba(185,28,28,.08))",
                border:
                    "1px solid rgba(255,110,110,.22)",
                boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.08), 0 14px 36px rgba(0,0,0,.28)",
                animation:
                    "krhaLogoutPulse 2.3s ease-in-out infinite"
            }
        );


        const icon =
            document.createElement(
                "div"
            );

        icon.textContent =
            "🚪";


        Object.assign(
            icon.style,
            {
                fontSize: "40px",
                lineHeight: "1",
                filter:
                    "drop-shadow(0 5px 10px rgba(0,0,0,.28))"
            }
        );


        // ======================================
        // Security Label
        // ======================================

        const status =
            document.createElement(
                "div"
            );


        Object.assign(
            status.style,
            {
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 11px",
                marginBottom: "8px",
                borderRadius: "999px",
                background:
                    "rgba(35,239,162,.08)",
                border:
                    "1px solid rgba(35,239,162,.18)",
                color:
                    "#9CF7D2",
                fontSize: "13px",
                fontWeight: "900"
            }
        );


        const dot =
            document.createElement(
                "span"
            );


        Object.assign(
            dot.style,
            {
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background:
                    "#23EFA2",
                boxShadow:
                    "0 0 10px rgba(35,239,162,.72)"
            }
        );


        status.appendChild(
            dot
        );


        status.appendChild(
            document.createTextNode(
                "امنیتي تایید"
            )
        );


        // ======================================
        // Title
        // ======================================

        const title =
            document.createElement(
                "div"
            );


        title.id =
            "krhaLogoutConfirmTitle";


        title.textContent =
            "له سیسټم څخه وتل؟";


        Object.assign(
            title.style,
            {
                fontSize: "30px",
                lineHeight: "1.5",
                fontWeight: "900",
                marginBottom: "10px"
            }
        );


        // ======================================
        // Message
        // ======================================

        const message =
            document.createElement(
                "div"
            );


        message.id =
            "krhaLogoutConfirmText";


        message.textContent =
            "ایا تاسې رښتیا غواړئ له دې سیسټم څخه ووځئ؟";


        Object.assign(
            message.style,
            {
                fontSize: "19px",
                lineHeight: "1.9",
                fontWeight: "800",
                color:
                    "rgba(255,255,255,.94)",
                marginBottom: "7px"
            }
        );


        // ======================================
        // Secondary Text
        // ======================================

        const secondary =
            document.createElement(
                "div"
            );


        secondary.textContent =
            "د وتلو په صورت کې به ستاسو اوسنی Login Session پای ته ورسېږي او پخوانیو سیسټمي برخو ته به تر نوي Login پرته لاسرسی نه وي.";


        Object.assign(
            secondary.style,
            {
                fontSize: "16px",
                lineHeight: "1.95",
                fontWeight: "600",
                color:
                    "rgba(196,211,221,.78)",
                marginBottom: "21px"
            }
        );


        // ======================================
        // Notice
        // ======================================

        const notice =
            document.createElement(
                "div"
            );


        notice.textContent =
            "⚠️ که «نه» وټاکئ، Logout نه ترسره کېږي او تاسې به په هماغه برخه کې پاتې شئ.";


        Object.assign(
            notice.style,
            {
                marginBottom: "22px",
                padding: "11px 13px",
                borderRadius: "14px",
                background:
                    "rgba(255,212,90,.07)",
                border:
                    "1px solid rgba(255,212,90,.16)",
                color:
                    "#FFE39A",
                fontSize: "14px",
                lineHeight: "1.75",
                fontWeight: "700"
            }
        );


        // ======================================
        // Buttons
        // ======================================

        const buttons =
            document.createElement(
                "div"
            );


        buttons.id =
            "krhaLogoutButtonGroup";


        Object.assign(
            buttons.style,
            {
                display: "grid",
                gridTemplateColumns:
                    "1fr 1fr",
                gap: "12px",
                width: "100%"
            }
        );


        // ======================================
        // Confirm Button
        // ======================================

        const confirmButton =
            document.createElement(
                "button"
            );


        confirmButton.type =
            "button";


        confirmButton.textContent =
            "هو، له سیسټم څخه ووځم";


        Object.assign(
            confirmButton.style,
            {
                minHeight: "60px",
                border:
                    "1px solid rgba(255,112,112,.18)",
                borderRadius: "16px",
                padding: "12px 16px",
                cursor: "pointer",
                fontFamily:
                    "inherit",
                fontSize: "17px",
                fontWeight: "900",
                color: "#fff",
                background:
                    "linear-gradient(135deg,#C62828,#8E1515)",
                boxShadow:
                    "0 12px 28px rgba(198,40,40,.24)",
                transition:
                    "transform .16s ease,filter .16s ease"
            }
        );


        // ======================================
        // Cancel Button
        // ======================================

        const cancelButton =
            document.createElement(
                "button"
            );


        cancelButton.type =
            "button";


        cancelButton.textContent =
            "نه، په سیسټم کې پاتې کېږم";


        Object.assign(
            cancelButton.style,
            {
                minHeight: "60px",
                border:
                    "1px solid rgba(255,255,255,.14)",
                borderRadius: "16px",
                padding: "12px 16px",
                cursor: "pointer",
                fontFamily:
                    "inherit",
                fontSize: "17px",
                fontWeight: "900",
                color: "#fff",
                background:
                    "linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.055))",
                boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.05)",
                transition:
                    "transform .16s ease,background .16s ease"
            }
        );


        // ======================================
        // Hover Effects
        // ======================================

        confirmButton.addEventListener(
            "mouseenter",
            () => {

                confirmButton.style.transform =
                    "translateY(-2px)";

                confirmButton.style.filter =
                    "brightness(1.06)";
            }
        );


        confirmButton.addEventListener(
            "mouseleave",
            () => {

                confirmButton.style.transform =
                    "";

                confirmButton.style.filter =
                    "";
            }
        );


        cancelButton.addEventListener(
            "mouseenter",
            () => {

                cancelButton.style.transform =
                    "translateY(-2px)";

                cancelButton.style.background =
                    "linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.075))";
            }
        );


        cancelButton.addEventListener(
            "mouseleave",
            () => {

                cancelButton.style.transform =
                    "";

                cancelButton.style.background =
                    "linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.055))";
            }
        );


        // ======================================
        // Close Modal
        // ======================================

        let closed =
            false;


        function closeModal(
            result
        ) {

            if (
                closed
            ) {
                return;
            }


            closed =
                true;


            logoutConfirmationOpen =
                false;


            document.removeEventListener(
                "keydown",
                onKeyDown,
                true
            );


            if (
                document.body
            ) {

                document.body.style.overflow =
                    previousBodyOverflow;
            }


            try {

                overlay.remove();

            } catch (error) {

                console.warn(
                    "Logout Modal Remove Error:",
                    error
                );
            }


            resolve(
                Boolean(result)
            );
        }


        // ======================================
        // Keyboard
        // ======================================

        function onKeyDown(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                event.preventDefault();

                closeModal(
                    false
                );

                return;
            }


            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                closeModal(
                    true
                );
            }
        }


        // ======================================
        // Button Events
        // ======================================

        confirmButton.addEventListener(
            "click",
            () => {

                closeModal(
                    true
                );
            }
        );


        cancelButton.addEventListener(
            "click",
            () => {

                closeModal(
                    false
                );
            }
        );


        // ======================================
        // Outside Click = Cancel
        // ======================================

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeModal(
                        false
                    );
                }
            }
        );


        // ======================================
        // Build
        // ======================================

        iconWrap.appendChild(
            icon
        );


        dialog.appendChild(
            accent
        );

        dialog.appendChild(
            iconWrap
        );

        dialog.appendChild(
            status
        );

        dialog.appendChild(
            title
        );

        dialog.appendChild(
            message
        );

        dialog.appendChild(
            secondary
        );

        dialog.appendChild(
            notice
        );


        buttons.appendChild(
            confirmButton
        );

        buttons.appendChild(
            cancelButton
        );


        dialog.appendChild(
            buttons
        );


        overlay.appendChild(
            dialog
        );


        // ======================================
        // Insert
        // ======================================

        const parent =
            document.body ||
            document.documentElement;


        parent.appendChild(
            overlay
        );


        // ======================================
        // Keyboard Listener
        // ======================================

        document.addEventListener(
            "keydown",
            onKeyDown,
            true
        );


        // ======================================
        // Focus
        // ======================================

        try {

            confirmButton.focus();

        } catch {}
    });
}


// ==========================================
// Safe Login Redirect
// ==========================================

function redirectToLogin() {

    if (
        typeof window === "undefined" ||
        !window.location
    ) {
        return;
    }


    if (
        isLoginPage()
    ) {
        return;
    }


    if (
        hasLogoutMarker()
    ) {

        continueLogoutHistory();

        return;
    }


    if (
        redirectingToLogin
    ) {
        return;
    }


    redirectingToLogin =
        true;


    try {

        window.location.replace(
            LOGIN_PAGE
        );

    } catch (error) {

        console.error(
            "Redirect To Login Error:",
            error
        );
    }
}


// ==========================================
// Continue Logout History
// ==========================================
//
// مهم بدلون:
//
// نور history.back() نه استعمالېږي.
//
// ځکه د Logout پر مهال باید:
// Protected Page
//      ↓
// مستقیم Login
//
// وي.
//
// دا د سپین Screen او د منځنیو System Pages
// د ښکاره کېدو مخه نیسي.
//

function continueLogoutHistory() {

    if (
        typeof window === "undefined" ||
        !window.location
    ) {
        return;
    }


    if (
        !hasLogoutMarker()
    ) {
        return;
    }


    // ======================================
    // Already Login Page
    // ======================================

    if (
        isLoginPage()
    ) {

        if (
            logoutFallbackTimer !==
            null
        ) {

            clearTimeout(
                logoutFallbackTimer
            );

            logoutFallbackTimer =
                null;
        }


        clearLogoutProgress();

        unlockCurrentPage();

        ensureLoginHistoryMarker();

        return;
    }


    // ======================================
    // Mark Progress
    // ======================================

    logoutNavigationStarted =
        true;

    setLogoutProgress();

    lockCurrentPageDuringLogout();


    // ======================================
    // DIRECT LOGIN
    // ======================================
    //
    // سمدستي Login ته ځي.
    //

    try {

        window.location.replace(
            LOGIN_PAGE
        );

    } catch (error) {

        console.error(
            "Direct Logout Login Redirect Error:",
            error
        );


        try {

            window.location.href =
                LOGIN_PAGE;

        } catch (fallbackError) {

            console.error(
                "Logout Login Fallback Error:",
                fallbackError
            );
        }
    }


    // ======================================
    // Safety Fallback
    // ======================================

    if (
        logoutFallbackTimer ===
        null
    ) {

        logoutFallbackTimer =
            setTimeout(() => {

                logoutFallbackTimer =
                    null;


                if (
                    !isLoginPage() &&
                    hasLogoutMarker()
                ) {

                    try {

                        window.location.replace(
                            LOGIN_PAGE
                        );

                    } catch (error) {

                        console.error(
                            "Logout Final Redirect Error:",
                            error
                        );
                    }
                }

            }, 1000);
    }
}


// ==========================================
// Protected Page Access Guard
// ==========================================

async function enforceProtectedPageAccess() {

    // ======================================
    // Login Page
    // ======================================

    if (
        isLoginPage()
    ) {

        ensureLoginHistoryMarker();


        if (
            hasLogoutMarker() ||
            hasLogoutProgress()
        ) {

            clearLogoutProgress();

            unlockCurrentPage();
        }


        return;
    }


    // ======================================
    // Explicit Logout
    // ======================================

    if (
        hasLogoutMarker() ||
        hasLogoutProgress()
    ) {

        continueLogoutHistory();

        return;
    }


    // ======================================
    // Wait For Firebase Auth
    // ======================================

    if (
        !authInitialized
    ) {

        try {

            await authReadyPromise;

        } catch (error) {

            console.error(
                "Auth Ready Error:",
                error
            );
        }
    }


    // ======================================
    // No Firebase User
    // ======================================

    if (
        !auth.currentUser
    ) {

        redirectToLogin();

        return;
    }
}


// ==========================================
// Global Firebase Auth State Watcher
// ==========================================

onAuthStateChanged(
    auth,
    user => {

        // ==================================
        // First Auth State
        // ==================================

        if (
            !authInitialized
        ) {

            authInitialized =
                true;


            try {

                resolveAuthReady(
                    user
                );

            } catch (error) {

                console.error(
                    "Resolve Auth Ready Error:",
                    error
                );
            }
        }


        // ==================================
        // Login Page
        // ==================================

        if (
            isLoginPage()
        ) {

            ensureLoginHistoryMarker();


            if (
                user
            ) {

                if (
                    !hasLogoutMarker()
                ) {

                    unlockCurrentPage();
                }

            } else {

                if (
                    hasLogoutMarker() ||
                    hasLogoutProgress()
                ) {

                    clearLogoutProgress();

                    unlockCurrentPage();
                }
            }


            return;
        }


        // ==================================
        // Explicit Logout
        // ==================================

        if (
            hasLogoutMarker() ||
            hasLogoutProgress()
        ) {

            continueLogoutHistory();

            return;
        }


        // ==================================
        // No User
        // ==================================

        if (
            !user
        ) {

            redirectToLogin();

            return;
        }

    },

    error => {

        console.error(
            "Global Auth State Error:",
            error
        );


        if (
            !authInitialized
        ) {

            authInitialized =
                true;


            try {

                resolveAuthReady(
                    null
                );

            } catch (resolveError) {

                console.error(
                    "Resolve Auth Ready Error:",
                    resolveError
                );
            }
        }


        if (
            !isLoginPage()
        ) {

            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                continueLogoutHistory();

                return;
            }


            redirectToLogin();
        }
    }
);


// ==========================================
// Browser History / BFCache Guards
// ==========================================

if (
    typeof window !== "undefined"
) {

    // ======================================
    // pageshow
    // ======================================

    window.addEventListener(
        "pageshow",
        () => {

            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                if (
                    isLoginPage()
                ) {

                    clearLogoutProgress();

                    unlockCurrentPage();

                    ensureLoginHistoryMarker();

                } else {

                    continueLogoutHistory();
                }

                return;
            }


            enforceProtectedPageAccess();

        },
        true
    );


    // ======================================
    // popstate
    // ======================================

    window.addEventListener(
        "popstate",
        () => {

            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                if (
                    isLoginPage()
                ) {

                    clearLogoutProgress();

                    unlockCurrentPage();

                    ensureLoginHistoryMarker();

                } else {

                    continueLogoutHistory();
                }

                return;
            }


            enforceProtectedPageAccess();

        },
        true
    );


    // ======================================
    // hashchange
    // ======================================

    window.addEventListener(
        "hashchange",
        () => {

            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                continueLogoutHistory();

                return;
            }


            enforceProtectedPageAccess();

        },
        true
    );


    // ======================================
    // visibilitychange
    // ======================================

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState !==
                "visible"
            ) {
                return;
            }


            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                if (
                    isLoginPage()
                ) {

                    clearLogoutProgress();

                    unlockCurrentPage();

                    ensureLoginHistoryMarker();

                } else {

                    continueLogoutHistory();
                }

                return;
            }


            enforceProtectedPageAccess();

        },
        true
    );


    // ======================================
    // DOMContentLoaded
    // ======================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                if (
                    isLoginPage()
                ) {

                    ensureLoginHistoryMarker();

                    unlockCurrentPage();

                } else {

                    enforceProtectedPageAccess();
                }

            },
            {
                once: true
            }
        );

    } else {

        if (
            isLoginPage()
        ) {

            ensureLoginHistoryMarker();

            unlockCurrentPage();

        } else {

            enforceProtectedPageAccess();
        }
    }
}


// ==========================================
// Global Logout Button Interceptor
// ==========================================

if (
    typeof document !== "undefined"
) {

    document.addEventListener(
        "click",
        async event => {

            const target =
                event.target;


            if (
                !target ||
                typeof target.closest !==
                    "function"
            ) {
                return;
            }


            const logoutButton =
                target.closest(
                    "#logoutBtn"
                );


            if (
                logoutButton
            ) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                // ==================================
                // Prevent Double Click
                // ==================================

                if (
                    logoutButton.dataset.krhaConfirming ===
                    "true"
                ) {
                    return;
                }


                logoutButton.dataset.krhaConfirming =
                    "true";


                try {

                    const confirmed =
                        await showLogoutConfirmation();


                    // ==================================
                    // Cancel
                    // ==================================

                    if (
                        !confirmed
                    ) {

                        logoutButton.dataset.krhaConfirming =
                            "false";

                        return;
                    }


                    // ==================================
                    // Confirm
                    // ==================================

                    await logoutUser();

                } catch (error) {

                    console.error(
                        "Logout Confirmation Error:",
                        error
                    );


                    logoutButton.dataset.krhaConfirming =
                        "false";
                }


                return;
            }


            // ==================================
            // Internal System Navigation
            // ==================================

            const clickableElement =
                target.closest(
                    "a,button,[role='button']"
                );


            if (
                !clickableElement
            ) {
                return;
            }


            if (
                clickableElement.matches(
                    "#logoutBtn"
                )
            ) {
                return;
            }


            if (
                clickableElement.disabled
            ) {
                return;
            }


            // ==================================
            // Known Internal Menu IDs
            // ==================================

            const navMap = {

                dashboardMenuBtn:
                    "./dashboard.html",

                formicMenuBtn:
                    "./formic.html",

                registerMenuBtn:
                    "./register.html",

                searchMenuBtn:
                    "./search.html",

                reportsMenuBtn:
                    "./reports.html",

                adminMenuBtn:
                    "./admin.html",

                settingsMenuBtn:
                    "./settings.html",

                dashboardBtn:
                    "./dashboard.html"
            };


            let targetURL =
                null;


            const buttonID =
                String(
                    clickableElement.id || ""
                ).trim();


            if (
                navMap[buttonID]
            ) {

                targetURL =
                    navMap[
                        buttonID
                    ];
            }


            // ==================================
            // Anchor Href
            // ==================================

            if (
                !targetURL &&
                clickableElement.tagName ===
                "A"
            ) {

                targetURL =
                    clickableElement.getAttribute(
                        "href"
                    ) || "";
            }


            if (
                !targetURL ||
                targetURL === "#"
            ) {
                return;
            }


            try {

                const destination =
                    new URL(
                        targetURL,
                        window.location.href
                    );


                const current =
                    new URL(
                        window.location.href
                    );


                // ==================================
                // Same Page
                // ==================================

                if (
                    destination.origin ===
                        current.origin &&
                    destination.pathname ===
                        current.pathname &&
                    destination.search ===
                        current.search &&
                    destination.hash ===
                        current.hash
                ) {

                    return;
                }


                // ==================================
                // Internal System Pages
                // ==================================

                const protectedPages = [

                    "dashboard.html",
                    "formic.html",
                    "general-form.html",
                    "register.html",
                    "search.html",
                    "reports.html",
                    "admin.html",
                    "settings.html"
                ];


                const destinationFile =
                    destination.pathname
                        .toLowerCase()
                        .replace(
                            /\\/g,
                            "/"
                        )
                        .split("/")
                        .pop() || "";


                if (
                    destination.origin ===
                        current.origin &&
                    protectedPages.includes(
                        destinationFile
                    )
                ) {

                    event.preventDefault();

                    event.stopPropagation();

                    event.stopImmediatePropagation();


                    /*
                     * مهم:
                     *
                     * د System یوه برخه د بلې ځای نیسي.
                     * پخوانۍ برخه History ته نه داخلېږي.
                     */

                    window.location.replace(
                        destination.href
                    );

                    return;
                }

            } catch (error) {

                console.warn(
                    "System Navigation Error:",
                    error
                );
            }

        },
        true
    );
}


// ==========================================
// Get Admin Profile By UID
// ==========================================

export async function getAdminProfile(user) {

    try {

        if (
            !user ||
            !user.uid
        ) {
            return null;
        }


        const currentUid =
            normalizeText(
                user.uid
            );


        const uidDocRef =
            doc(
                db,
                ADMINS_COLLECTION,
                currentUid
            );


        let snapshot =
            await getDoc(
                uidDocRef
            );


        // ======================================
        // Legacy Fallback
        // ======================================

        if (
            !snapshot.exists()
        ) {

            const legacyRef =
                doc(
                    db,
                    ADMINS_COLLECTION,
                    "superadmin"
                );


            snapshot =
                await getDoc(
                    legacyRef
                );
        }


        // ======================================
        // Profile Not Found
        // ======================================

        if (
            !snapshot.exists()
        ) {
            return null;
        }


        const data =
            snapshot.data() || {};


        const storedUid =
            normalizeText(
                data.uid
            );


        const storedEmail =
            normalizeText(
                data.email
            ).toLowerCase();


        const currentEmail =
            normalizeText(
                user.email
            ).toLowerCase();


        // ======================================
        // UID Security Check
        // ======================================

        if (
            storedUid &&
            storedUid !== currentUid
        ) {
            return null;
        }


        // ======================================
        // Email Security Check
        // ======================================

        if (
            storedEmail &&
            currentEmail &&
            storedEmail !== currentEmail
        ) {
            return null;
        }


        // ======================================
        // Active Check
        // ======================================

        if (
            data.active !== true
        ) {
            return null;
        }


        // ======================================
        // Role Check
        // ======================================

        const role =
            normalizeRole(
                data.role
            );


        if (
            !isValidRole(
                role
            )
        ) {
            return null;
        }


        // ======================================
        // Return Profile
        // ======================================

        return {

            id:
                snapshot.id,

            uid:
                storedUid ||
                currentUid,

            email:
                storedEmail ||
                currentEmail ||
                "",

            name:
                normalizeText(
                    data.name || ""
                ),

            role,

            active: true,

            ...data
        };


    } catch (error) {

        console.error(
            "Get Admin Profile Error:",
            error
        );

        return null;
    }
}


// ==========================================
// Login
// ==========================================

export async function loginUser(
    email,
    password
) {

    try {

        email =
            String(
                email || ""
            ).trim();


        password =
            String(
                password || ""
            );


        // ======================================
        // Email Validation
        // ======================================

        if (
            !email
        ) {

            return {

                success: false,

                message:
                    "ایمیل ولیکئ."
            };
        }


        // ======================================
        // Password Validation
        // ======================================

        if (
            !password
        ) {

            return {

                success: false,

                message:
                    "پاسورډ ولیکئ."
            };
        }


        // ======================================
        // Firebase Login
        // ======================================

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            result.user;


        // ======================================
        // Admin Profile
        // ======================================

        const profile =
            await getAdminProfile(
                user
            );


        // ======================================
        // Invalid Admin
        // ======================================

        if (
            !profile
        ) {

            await signOut(
                auth
            );


            return {

                success: false,

                message:
                    `ستاسو حساب د ${SYSTEM_NAME} په Admin لست کې نشته.`
            };
        }


        // ======================================
        // Active Check
        // ======================================

        if (
            profile.active !== true
        ) {

            await signOut(
                auth
            );


            return {

                success: false,

                message:
                    "ستاسو حساب غیر فعال شوی دی."
            };
        }


        // ======================================
        // Role Check
        // ======================================

        if (
            !ALLOWED_ROLES.includes(
                profile.role
            )
        ) {

            await signOut(
                auth
            );


            return {

                success: false,

                message:
                    "ستاسو د حساب صلاحیت ناسم دی."
            };
        }


        // ======================================
        // Successful Login
        // ======================================

        clearLogoutMarker();

        clearLogoutProgress();

        logoutNavigationStarted =
            false;

        redirectingToLogin =
            false;


        if (
            logoutFallbackTimer !==
            null
        ) {

            clearTimeout(
                logoutFallbackTimer
            );

            logoutFallbackTimer =
                null;
        }


        unlockCurrentPage();


        // ======================================
        // Login History Marker
        // ======================================

        if (
            typeof window !== "undefined" &&
            isLoginPage()
        ) {

            ensureLoginHistoryMarker();
        }


        return {

            success: true,

            user,

            profile
        };


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );


        let message =
            "Login ترسره نه شو.";


        switch (
            error.code
        ) {

            case "auth/invalid-email":

                message =
                    "ایمیل ناسم دی.";

                break;


            case "auth/user-not-found":

                message =
                    "دا ایمیل ثبت شوی نه دی.";

                break;


            case "auth/wrong-password":

                message =
                    "پاسورډ ناسم دی.";

                break;


            case "auth/invalid-credential":

                message =
                    "ایمیل یا پاسورډ ناسم دی.";

                break;


            case "auth/too-many-requests":

                message =
                    "ډېرې ناکامې هڅې شوې دي. لږ وروسته بیا هڅه وکړئ.";

                break;


            case "auth/user-disabled":

                message =
                    "دا حساب غیر فعال شوی دی.";

                break;


            case "auth/network-request-failed":

                message =
                    "د انټرنېټ اړیکه ستونزه لري.";

                break;


            case "auth/operation-not-allowed":

                message =
                    "د ایمیل او پاسورډ Login په Firebase کې فعال نه دی.";

                break;


            default:

                message =
                    error.message ||
                    message;
        }


        return {

            success: false,

            message
        };
    }
}


// ==========================================
// Logout
// ==========================================
//
// ډېر مهم:
//
// Logout نور د Firebase signOut() بشپړېدو
// ته انتظار نه کوي.
//
// ترتیب:
//
// 1. Logout Marker
// 2. Logout Progress
// 3. Firebase signOut() پیل
// 4. سمدستي index.html
//
// په دې ډول د کارونکي لپاره
// سپین/خالي Screen نه جوړېږي.
//
// ==========================================

export async function logoutUser() {

    // ======================================
    // Prevent Double Logout
    // ======================================

    if (
        logoutNavigationStarted
    ) {

        return {

            success: true,

            alreadyLoggingOut: true
        };
    }


    logoutNavigationStarted =
        true;


    // ======================================
    // Immediately Register Logout
    // ======================================

    setLogoutMarker();

    setLogoutProgress();


    // ======================================
    // Lock Interaction
    // ======================================

    lockCurrentPageDuringLogout();


    // ======================================
    // Start Firebase SignOut
    // ======================================
    //
    // مهم:
    // await نه کوو.
    //
    // ځکه User باید سمدستي Login Page ته
    // ولاړ شي.
    //

    try {

        const signOutPromise =
            signOut(
                auth
            );


        /*
         * signOut په شالید کې روان پرېږدو.
         *
         * د Logout اصلي امنیت marker لا دمخه
         * ثبت شوی.
         */

        void signOutPromise.catch(
            error => {

                console.error(
                    "Background Firebase SignOut Error:",
                    error
                );
            }
        );

    } catch (error) {

        console.error(
            "Firebase SignOut Start Error:",
            error
        );
    }


    // ======================================
    // DIRECT IMMEDIATE LOGIN REDIRECT
    // ======================================
    //
    // تر signOut وروسته await نشته.
    // همدا اوس Login Page ته ځي.
    //

    try {

        window.location.replace(
            LOGIN_PAGE
        );

    } catch (error) {

        console.error(
            "Immediate Login Redirect Error:",
            error
        );


        try {

            window.location.href =
                LOGIN_PAGE;

        } catch (fallbackError) {

            console.error(
                "Immediate Login Fallback Error:",
                fallbackError
            );
        }
    }


    return {

        success: true
    };
}


// ==========================================
// Password Reset
// ==========================================

export async function resetPassword(
    email
) {

    try {

        email =
            String(
                email || ""
            ).trim();


        if (
            !email
        ) {

            return {

                success: false,

                message:
                    "خپل ایمیل ولیکئ."
            };
        }


        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success: true,

            message:
                "د پاسورډ د بدلولو لینک ستاسو ایمیل ته واستول شو."
        };


    } catch (error) {

        console.error(
            "Password Reset Error:",
            error
        );


        let message =
            "د پاسورډ د بدلولو ایمیل ونه لېږل شو.";


        switch (
            error.code
        ) {

            case "auth/invalid-email":

                message =
                    "ایمیل ناسم دی.";

                break;


            case "auth/user-not-found":

                message =
                    "دا ایمیل په Firebase Authentication کې نشته.";

                break;


            case "auth/network-request-failed":

                message =
                    "د انټرنېټ اړیکه ستونزه لري.";

                break;


            default:

                message =
                    error.message ||
                    message;
        }


        return {

            success: false,

            message
        };
    }
}


// ==========================================
// Current Firebase User
// ==========================================

export function getCurrentUser() {

    return auth.currentUser;
}


// ==========================================
// Get Current Session
// ==========================================

export async function getCurrentSession() {

    try {

        const user =
            auth.currentUser;


        if (
            !user
        ) {
            return null;
        }


        const profile =
            await getAdminProfile(
                user
            );


        if (
            !profile
        ) {

            await signOut(
                auth
            );

            return null;
        }


        return {

            user,

            profile
        };


    } catch (error) {

        console.error(
            "Get Current Session Error:",
            error
        );

        return null;
    }
}


// ==========================================
// Authentication Listener
// ==========================================

export function listenAuth(
    callback
) {

    if (
        typeof callback !==
        "function"
    ) {

        throw new Error(
            "listenAuth callback باید function وي."
        );
    }


    return onAuthStateChanged(
        auth,
        async user => {

            // ==================================
            // No User
            // ==================================

            if (
                !user
            ) {

                // Explicit Logout
                if (
                    hasLogoutMarker() ||
                    hasLogoutProgress()
                ) {

                    if (
                        isLoginPage()
                    ) {

                        clearLogoutProgress();

                        unlockCurrentPage();

                        ensureLoginHistoryMarker();

                        callback(null);

                    } else {

                        continueLogoutHistory();
                    }

                    return;
                }


                // Normal Unauthorized
                callback(null);

                return;
            }


            // ==================================
            // Valid User
            // ==================================

            try {

                const profile =
                    await getAdminProfile(
                        user
                    );


                // ==================================
                // Invalid Profile
                // ==================================

                if (
                    !profile
                ) {

                    await signOut(
                        auth
                    );

                    callback(null);

                    return;
                }


                // ==================================
                // Active Check
                // ==================================

                if (
                    profile.active !== true
                ) {

                    await signOut(
                        auth
                    );

                    callback(null);

                    return;
                }


                // ==================================
                // Successful Session
                // ==================================

                callback({

                    user,

                    profile
                });


            } catch (error) {

                console.error(
                    "Auth Listener Error:",
                    error
                );


                try {

                    await signOut(
                        auth
                    );

                } catch (
                    signOutError
                ) {

                    console.error(
                        "Auth Listener SignOut Error:",
                        signOutError
                    );
                }


                callback(null);
            }
        }
    );
}


// ==========================================
// Check Authentication
// ==========================================

export async function isAuthenticated() {

    const session =
        await getCurrentSession();

    return Boolean(
        session
    );
}


// ==========================================
// Check Specific Role
// ==========================================

export async function hasRole(
    allowedRoles = []
) {

    const session =
        await getCurrentSession();


    if (
        !session
    ) {
        return false;
    }


    const role =
        String(
            session.profile?.role || ""
        )
            .trim()
            .toLowerCase();


    const normalizedAllowedRoles =
        allowedRoles.map(
            value =>
                String(value)
                    .trim()
                    .toLowerCase()
        );


    return normalizedAllowedRoles.includes(
        role
    );
}


// ==========================================
// Is Super Admin
// ==========================================

export async function isSuperAdmin() {

    return hasRole([
        "superadmin"
    ]);
}


// ==========================================
// Is Admin
// ==========================================

export async function isAdmin() {

    return hasRole([
        "superadmin",
        "admin"
    ]);
}


// ==========================================
// Is User
// ==========================================

export async function isUser() {

    return hasRole([
        "superadmin",
        "admin",
        "user"
    ]);
}


// ==========================================
// Export
// ==========================================

export default {

    getAdminProfile,

    loginUser,

    logoutUser,

    resetPassword,

    getCurrentUser,

    getCurrentSession,

    listenAuth,

    isAuthenticated,

    hasRole,

    isSuperAdmin,

    isAdmin,

    isUser
};