// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
// auth.js
// Authentication Engine + Secure Logout Guard
// ==========================================

import {
    auth,
    db
} from "./firebase.js";


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

const LOGIN_PAGE =
    "./index.html";


// ==========================================
// Firestore Collection
// ==========================================

const ADMINS_COLLECTION =
    "admins";


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

const LOGOUT_HISTORY_COLLAPSE_KEY =
    "krha_auth_logout_history_collapse_v1";


// ==========================================
// History Marker
// ==========================================

const LOGIN_HISTORY_MARKER =
    "__krha_login_history_entry_v2";


// ==========================================
// Runtime State
// ==========================================

let redirectingToLogin =
    false;

let logoutNavigationStarted =
    false;

let logoutFallbackTimer =
    null;

let authInitialized =
    false;

let resolveAuthReady;

let logoutConfirmationOpen =
    false;

let previousBodyOverflow =
    "";


// ==========================================
// Auth Ready Promise
// ==========================================

const authReadyPromise =
    new Promise(
        resolve => {

            resolveAuthReady =
                resolve;

        }
    );


// ==========================================
// Normalize Helpers
// ==========================================

function normalizeText(
    value
) {

    return String(
        value || ""
    ).trim();

}


function normalizeRole(
    role
) {

    return normalizeText(
        role
    ).toLowerCase();

}


function isValidRole(
    role
) {

    return ALLOWED_ROLES.includes(
        normalizeRole(
            role
        )
    );

}


// ==========================================
// Login Page Detector
// ==========================================

function isLoginPage() {

    try {

        if (
            typeof window ===
            "undefined" ||
            !window.location
        ) {

            return false;

        }


        const pathname =
            String(
                window.location.pathname ||
                ""
            )
                .toLowerCase()
                .replace(
                    /\/+$/,
                    ""
                );


        const fileName =
            pathname
                .split("/")
                .pop() || "";


        return (

            fileName === "" ||

            fileName ===
                "index.html" ||

            fileName ===
                "login.html"

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
        typeof window ===
            "undefined" ||
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
            window.history.state ||
            {};


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
// Lock Current Page
// ==========================================
//
// مهم:
//
// visibility:hidden نه استعمالېږي.
//
// هدف دا دی چې د Logout پر مهال
// سپین Screen جوړ نه شي.
//

function lockCurrentPageDuringLogout() {

    try {

        if (
            typeof document !==
                "undefined" &&
            document.documentElement
        ) {

            document.documentElement.dataset.krhaLogout =
                "true";


            document.documentElement.style.pointerEvents =
                "none";


            document.documentElement.style.userSelect =
                "none";

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
            typeof document !==
                "undefined" &&
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

function showLogoutConfirmation() {

    return new Promise(
        resolve => {

            // ======================================
            // Browser Fallback
            // ======================================

            if (
                typeof document ===
                "undefined"
            ) {

                resolve(
                    window.confirm(
                        "ایا تاسې رښتیا غواړئ له دې سیسټم څخه ووځئ؟"
                    )
                );

                return;

            }


            // ======================================
            // Prevent Duplicate Modal
            // ======================================

            if (
                logoutConfirmationOpen
            ) {

                return;

            }


            logoutConfirmationOpen =
                true;


            // ======================================
            // Remove Existing Modal
            // ======================================

            const oldModal =
                document.getElementById(
                    "krhaLogoutConfirmModal"
                );


            if (
                oldModal
            ) {

                try {

                    oldModal.remove();

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

                    position:
                        "fixed",

                    inset:
                        "0",

                    zIndex:
                        "2147483647",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    padding:
                        "18px",

                    boxSizing:
                        "border-box",

                    background:
                        "radial-gradient(circle at top,rgba(18,62,51,.30),transparent 45%),rgba(1,5,10,.78)",

                    backdropFilter:
                        "blur(14px) saturate(125%)",

                    WebkitBackdropFilter:
                        "blur(14px) saturate(125%)",

                    fontFamily:
                        "'Noto Naskh Arabic',Tahoma,Arial,sans-serif",

                    direction:
                        "rtl"

                }
            );


            // ======================================
            // Modal CSS
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
                            transform:scale(1);
                        }

                        50% {
                            transform:scale(1.045);
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

                    position:
                        "relative",

                    width:
                        "min(560px,100%)",

                    maxWidth:
                        "560px",

                    boxSizing:
                        "border-box",

                    padding:
                        "30px 28px 24px",

                    borderRadius:
                        "28px",

                    background:
                        "linear-gradient(145deg,rgba(12,25,36,.99),rgba(4,12,20,.99))",

                    border:
                        "1px solid rgba(255,255,255,.13)",

                    boxShadow:
                        "0 30px 90px rgba(0,0,0,.60),inset 0 1px 0 rgba(255,255,255,.05)",

                    color:
                        "#fff",

                    textAlign:
                        "center",

                    direction:
                        "rtl"

                }
            );


            // ======================================
            // Accent
            // ======================================

            const accent =
                document.createElement(
                    "div"
                );


            Object.assign(
                accent.style,
                {

                    position:
                        "absolute",

                    top:
                        "0",

                    left:
                        "12%",

                    right:
                        "12%",

                    height:
                        "3px",

                    borderRadius:
                        "0 0 99px 99px",

                    background:
                        "linear-gradient(90deg,transparent,#23EFA2,#25DFFF,transparent)",

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

                    width:
                        "82px",

                    height:
                        "82px",

                    margin:
                        "0 auto 16px",

                    borderRadius:
                        "24px",

                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "center",

                    background:
                        "linear-gradient(145deg,rgba(255,92,92,.20),rgba(185,28,28,.08))",

                    border:
                        "1px solid rgba(255,110,110,.22)",

                    boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,.08),0 14px 36px rgba(0,0,0,.28)",

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

                    fontSize:
                        "40px",

                    lineHeight:
                        "1"

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

                    display:
                        "inline-flex",

                    alignItems:
                        "center",

                    gap:
                        "7px",

                    padding:
                        "6px 11px",

                    marginBottom:
                        "8px",

                    borderRadius:
                        "999px",

                    background:
                        "rgba(35,239,162,.08)",

                    border:
                        "1px solid rgba(35,239,162,.18)",

                    color:
                        "#9CF7D2",

                    fontSize:
                        "13px",

                    fontWeight:
                        "900"

                }
            );


            const statusDot =
                document.createElement(
                    "span"
                );


            Object.assign(
                statusDot.style,
                {

                    width:
                        "7px",

                    height:
                        "7px",

                    borderRadius:
                        "50%",

                    background:
                        "#23EFA2",

                    boxShadow:
                        "0 0 10px rgba(35,239,162,.72)"

                }
            );


            status.appendChild(
                statusDot
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

                    fontSize:
                        "30px",

                    lineHeight:
                        "1.5",

                    fontWeight:
                        "900",

                    marginBottom:
                        "10px"

                }
            );


            // ======================================
            // Main Message
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

                    fontSize:
                        "19px",

                    lineHeight:
                        "1.9",

                    fontWeight:
                        "800",

                    color:
                        "rgba(255,255,255,.94)",

                    marginBottom:
                        "7px"

                }
            );


            // ======================================
            // Secondary
            // ======================================

            const secondary =
                document.createElement(
                    "div"
                );


            secondary.textContent =
                "د وتلو په صورت کې به ستاسو اوسنی Login Session پای ته ورسېږي او تر نوي Login پورې به سیسټم ته لاسرسی نه وي.";


            Object.assign(
                secondary.style,
                {

                    fontSize:
                        "16px",

                    lineHeight:
                        "1.95",

                    fontWeight:
                        "600",

                    color:
                        "rgba(196,211,221,.78)",

                    marginBottom:
                        "21px"

                }
            );


            // ======================================
            // Warning
            // ======================================

            const notice =
                document.createElement(
                    "div"
                );


            notice.textContent =
                "⚠️ که «نه» وټاکئ، Logout نه ترسره کېږي او تاسې به همدلته پاتې شئ.";


            Object.assign(
                notice.style,
                {

                    marginBottom:
                        "22px",

                    padding:
                        "11px 13px",

                    borderRadius:
                        "14px",

                    background:
                        "rgba(255,212,90,.07)",

                    border:
                        "1px solid rgba(255,212,90,.16)",

                    color:
                        "#FFE39A",

                    fontSize:
                        "14px",

                    lineHeight:
                        "1.75",

                    fontWeight:
                        "700"

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

                    display:
                        "grid",

                    gridTemplateColumns:
                        "1fr 1fr",

                    gap:
                        "12px",

                    width:
                        "100%"

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

                    minHeight:
                        "60px",

                    border:
                        "1px solid rgba(255,112,112,.18)",

                    borderRadius:
                        "16px",

                    padding:
                        "12px 16px",

                    cursor:
                        "pointer",

                    fontFamily:
                        "inherit",

                    fontSize:
                        "17px",

                    fontWeight:
                        "900",

                    color:
                        "#fff",

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

                    minHeight:
                        "60px",

                    border:
                        "1px solid rgba(255,255,255,.14)",

                    borderRadius:
                        "16px",

                    padding:
                        "12px 16px",

                    cursor:
                        "pointer",

                    fontFamily:
                        "inherit",

                    fontSize:
                        "17px",

                    fontWeight:
                        "900",

                    color:
                        "#fff",

                    background:
                        "linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.055))",

                    boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,.05)",

                    transition:
                        "transform .16s ease,background .16s ease"

                }
            );


            // ======================================
            // Hover
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
            // Close
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

                } catch {}



                resolve(
                    Boolean(
                        result
                    )
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
            // Buttons
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
            // Overlay Click
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

            (
                document.body ||
                document.documentElement
            ).appendChild(
                overlay
            );


            // ======================================
            // Keyboard
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

        }
    );

}


// ==========================================
// Direct Login Redirect
// ==========================================
//
// Explicit Logout:
// مستقیم Login ته تلل.
//
// نور history.back() نه استعمالېږي.
//

function redirectToLogin() {

    if (
        typeof window ===
            "undefined" ||
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

        try {

            window.location.href =
                LOGIN_PAGE;

        } catch {}

    }

}


// ==========================================
// Continue Logout History
// ==========================================
//
// مهم:
//
// نوم یې د compatibility لپاره هماغه ساتل شوی.
//
// خو نور history.back() نه کوي.
//
// مستقیم Login ته ځي.
//

function continueLogoutHistory() {

    if (
        typeof window ===
            "undefined"
    ) {

        return;

    }


    if (
        !hasLogoutMarker()
    ) {

        return;

    }


    if (
        isLoginPage()
    ) {

        try {

            sessionStorage.removeItem(
                LOGOUT_HISTORY_COLLAPSE_KEY
            );

        } catch {}


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


    logoutNavigationStarted =
        true;


    setLogoutProgress();


    lockCurrentPageDuringLogout();


    try {

        const collapseStarted =
            sessionStorage.getItem(
                LOGOUT_HISTORY_COLLAPSE_KEY
            ) === "1";


        /*
         * Logout وروسته د موجود Web/TWA history
         * لومړي entry ته ځو.
         *
         * هدف:
         * Dashboard / Formic / Register / Search
         * او نور Protected pages د Android Back
         * له لارې بیا را ونه ګرځي.
         *
         * دا یوازې د Logout flow لپاره کار کوي.
         */

        if (
            !collapseStarted
        ) {

            sessionStorage.setItem(
                LOGOUT_HISTORY_COLLAPSE_KEY,
                "1"
            );


            const historySteps =
                Math.max(
                    0,
                    (window.history.length || 1) - 1
                );


            if (
                historySteps > 0
            ) {

                window.history.go(
                    -historySteps
                );

                return;

            }

        }

    } catch (error) {

        console.error(
            "Logout History Collapse Error:",
            error
        );

    }


    /*
     * که history موجود نه وي،
     * یا collapse already بشپړ شوی وي،
     * Login ته مستقیم replace.
     */

    try {

        sessionStorage.removeItem(
            LOGOUT_HISTORY_COLLAPSE_KEY
        );

    } catch {}


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

        } catch {}

    }

}


// ==========================================
// Protected Page Guard
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
    // Wait For Auth Initialization
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
    // No User
    // ======================================

    if (
        !auth.currentUser
    ) {

        redirectToLogin();

        return;

    }

}


// ==========================================
// Global Auth State
// ==========================================

onAuthStateChanged(
    auth,
    user => {

        // ==================================
        // First State
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


            /*
             * مهم:
             *
             * که Logout Marker موجود وي،
             * Login Page ته موجود user هم
             * Dashboard ته نه redirect کېږي.
             *
             * دا د:
             *
             * Login
             * ↓
             * Dashboard
             * ↓
             * Login
             *
             * فلیکر ختموي.
             */

            if (
                hasLogoutMarker() ||
                hasLogoutProgress()
            ) {

                clearLogoutProgress();

                unlockCurrentPage();

                return;

            }


            if (
                user
            ) {

                unlockCurrentPage();

            }


            return;

        }


        // ==================================
        // Logout State
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

            } catch {}

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
// Browser History / BFCache
// ==========================================

if (
    typeof window !==
    "undefined"
) {

    // ======================================
    // pageshow
    // ======================================

    window.addEventListener(
        "pageshow",
        () => {

            try {

                if (
                    sessionStorage.getItem(
                        LOGOUT_HISTORY_COLLAPSE_KEY
                    ) === "1"
                ) {

                    sessionStorage.removeItem(
                        LOGOUT_HISTORY_COLLAPSE_KEY
                    );


                    if (
                        !isLoginPage()
                    ) {

                        window.location.replace(
                            LOGIN_PAGE
                        );

                        return;

                    }

                }

            } catch (error) {

                console.error(
                    "Logout History Restore Guard Error:",
                    error
                );

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
                    !isLoginPage()
                ) {

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

                if (
                    !isLoginPage()
                ) {

                    continueLogoutHistory();

                }

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
                    !isLoginPage()
                ) {

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
// Global Logout Button
// ==========================================

if (
    typeof document !==
    "undefined"
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


            // ==================================
            // Logout
            // ==================================

            if (
                logoutButton
            ) {

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


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


                    // ==========================
                    // User Cancelled
                    // ==========================

                    if (
                        !confirmed
                    ) {

                        logoutButton.dataset.krhaConfirming =
                            "false";

                        return;

                    }


                    // ==========================
                    // User Confirmed
                    // ==========================

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
            // Internal Navigation
            // ==================================
            //
            // مهم:
            //
            // System Page -> System Page
            // باید history entry نه جوړوي.
            //
            // پخوانی Page د نوي Page ځای نیسي.
            //

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
            // Internal System Navigation Map
            // ==================================

            const navMap = {

                dashboardMenuBtn:
                    "/dashboard.html",

                formicMenuBtn:
                    "/formic.html",

                registerMenuBtn:
                    "/register.html",

                searchMenuBtn:
                    "/search.html",

                reportsMenuBtn:
                    "/reports.html",

                adminMenuBtn:
                    "/admin.html",

                settingsMenuBtn:
                    "/settings.html",

                dashboardBtn:
                    "/dashboard.html",

                homeBtn:
                    "/dashboard.html",

                homeMenuBtn:
                    "/dashboard.html"

            };


            let targetURL =
                null;


            const buttonID =
                String(
                    clickableElement.id ||
                    ""
                ).trim();


            if (
                navMap[
                    buttonID
                ]
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
                // Protected System Pages
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
                     * تر ټولو مهم:
                     *
                     * location.replace()
                     *
                     * نه:
                     *
                     * location.href
                     *
                     * او نه:
                     *
                     * history.pushState()
                     *
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
// Get Admin Profile
// ==========================================

export async function getAdminProfile(
    user
) {

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
        // Missing
        // ======================================

        if (
            !snapshot.exists()
        ) {

            return null;

        }


        const data =
            snapshot.data() ||
            {};


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
        // UID Check
        // ======================================

        if (
            storedUid &&
            storedUid !== currentUid
        ) {

            return null;

        }


        // ======================================
        // Email Check
        // ======================================

        if (
            storedEmail &&
            currentEmail &&
            storedEmail !== currentEmail
        ) {

            return null;

        }


        // ======================================
        // Active
        // ======================================

        if (
            data.active !==
            true
        ) {

            return null;

        }


        // ======================================
        // Role
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
                    data.name ||
                    ""
                ),

            role,

            active:
                true,

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
                email ||
                ""
            ).trim();


        password =
            String(
                password ||
                ""
            );


        // ======================================
        // Email
        // ======================================

        if (
            !email
        ) {

            return {

                success:
                    false,

                message:
                    "ایمیل ولیکئ."

            };

        }


        // ======================================
        // Password
        // ======================================

        if (
            !password
        ) {

            return {

                success:
                    false,

                message:
                    "پاسورډ ولیکئ."

            };

        }


        // ======================================
        // Sign In
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
        // No Profile
        // ======================================

        if (
            !profile
        ) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                message:
                    `ستاسو حساب د ${SYSTEM_NAME} په Admin لست کې نشته.`

            };

        }


        // ======================================
        // Inactive
        // ======================================

        if (
            profile.active !==
            true
        ) {

            await signOut(
                auth
            );


            return {

                success:
                    false,

                message:
                    "ستاسو حساب غیر فعال شوی دی."

            };

        }


        // ======================================
        // Role
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

                success:
                    false,

                message:
                    "ستاسو د حساب صلاحیت ناسم دی."

            };

        }


        // ======================================
        // Successful Login
        // ======================================
        //
        // Logout lock پاکوي.
        //

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


        ensureLoginHistoryMarker();


        return {

            success:
                true,

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

                break;

        }


        return {

            success:
                false,

            message

        };

    }

}


// ==========================================
// Logout
// ==========================================
//
// مهم اصلاح:
//
// 1. Marker سمدستي.
// 2. Progress سمدستي.
// 3. Page hide نه کېږي.
// 4. Firebase signOut شروع کېږي.
// 5. login.html/index.html ته مستقیم replace.
//
// د Login Page لپاره marker د دې مخه نیسي
// چې پاتې Firebase user بېرته Dashboard ته
// redirect شي.
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

            success:
                true,

            alreadyLoggingOut:
                true

        };

    }


    logoutNavigationStarted =
        true;


    // ======================================
    // Security Marker FIRST
    // ======================================

    setLogoutMarker();


    setLogoutProgress();


    // ======================================
    // Do Not Hide Page
    // ======================================

    lockCurrentPageDuringLogout();


    // ======================================
    // Firebase SignOut
    // ======================================
    //
    // دا operation شروع کېږي.
    //
    // Login Page ته د تګ لپاره پرې
    // await نه کوو، څو UI ودریږي نه.
    //
    // د logout marker له امله Login Page
    // د لنډمهاله user state پر اساس
    // Dashboard ته نه ځي.
    //

    try {

        void signOut(
            auth
        ).catch(
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
    // DIRECT LOGIN
    // ======================================
    //
    // سمدستي.
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

        } catch {}

    }


    return {

        success:
            true

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
                email ||
                ""
            ).trim();


        if (
            !email
        ) {

            return {

                success:
                    false,

                message:
                    "خپل ایمیل ولیکئ."

            };

        }


        await sendPasswordResetEmail(
            auth,
            email
        );


        return {

            success:
                true,

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

                break;

        }


        return {

            success:
                false,

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
//
// مهم اصلاح:
//
// Login Page + Logout Marker
// = session callback بند.
//
// دا هغه مهمه برخه ده چې د
//
// Login -> Dashboard -> Login
//
// فلیکر ختموي.
//

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
            // LOGOUT STATE ON LOGIN PAGE
            // ==================================
            //
            // که Firebase لا د پخواني user
            // state ښيي هم، Login Page یې
            // Dashboard ته نه Redirect کوي.
            //

            if (
                isLoginPage() &&
                (
                    hasLogoutMarker() ||
                    hasLogoutProgress()
                )
            ) {

                callback(
                    null
                );

                return;

            }


            // ==================================
            // No User
            // ==================================

            if (
                !user
            ) {

                callback(
                    null
                );

                return;

            }


            // ==================================
            // Profile
            // ==================================

            try {

                const profile =
                    await getAdminProfile(
                        user
                    );


                // ==============================
                // Invalid
                // ==============================

                if (
                    !profile
                ) {

                    await signOut(
                        auth
                    );


                    callback(
                        null
                    );


                    return;

                }


                // ==============================
                // Inactive
                // ==============================

                if (
                    profile.active !==
                    true
                ) {

                    await signOut(
                        auth
                    );


                    callback(
                        null
                    );


                    return;

                }


                // ==============================
                // Valid
                // ==============================

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


                callback(
                    null
                );

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
            session.profile?.role ||
            ""
        )
            .trim()
            .toLowerCase();


    const normalizedAllowedRoles =
        allowedRoles.map(
            value =>
                String(
                    value
                )
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