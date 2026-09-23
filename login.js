"use strict";


import {
    loginUser,
    resetPassword,
    listenAuth
} from "./auth.js";


import {
    initializeSettings
} from "./settings.js";


/*
==========================================================
 CONFIGURATION
==========================================================
*/

const DASHBOARD_URL =
    "./dashboard.html";


const WHATSAPP_NUMBER =
    "93705965475";


const EMAIL_KEY =
    "kr_secure_email";


const REMEMBER_KEY =
    "kr_secure_remember";


/*
==========================================================
 DOM
==========================================================
*/

const loginForm =
    document.getElementById(
        "loginForm"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const rememberMe =
    document.getElementById(
        "rememberMe"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const loginButtonContent =
    document.getElementById(
        "loginButtonContent"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );


const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );


const whatsappButton =
    document.getElementById(
        "whatsappButton"
    );


const clearEmailButton =
    document.getElementById(
        "clearEmailButton"
    );


const togglePasswordButton =
    document.getElementById(
        "togglePasswordButton"
    );


const passwordStatus =
    document.getElementById(
        "passwordStatus"
    );


const networkStatus =
    document.getElementById(
        "networkStatus"
    );


const networkDot =
    document.getElementById(
        "networkDot"
    );


const profileModal =
    document.getElementById(
        "profileModal"
    );


const closeProfileModal =
    document.getElementById(
        "closeProfileModal"
    );


/*
==========================================================
 MESSAGE
==========================================================
*/

function showMessage(
    message,
    type = "error"
) {

    loginMessage.textContent =
        message;


    loginMessage.className =
        `login-message show ${type}`;

}


function hideMessage() {

    loginMessage.textContent =
        "";

    loginMessage.className =
        "login-message";

}


/*
==========================================================
 NETWORK
==========================================================
*/

function updateNetworkStatus() {

    const online =
        navigator.onLine;


    networkStatus.textContent =
        online
            ? "ONLINE"
            : "OFFLINE";


    networkDot.classList.toggle(
        "offline",
        !online
    );

}


window.addEventListener(
    "online",
    updateNetworkStatus
);


window.addEventListener(
    "offline",
    updateNetworkStatus
);


updateNetworkStatus();


/*
==========================================================
 EMAIL
==========================================================
*/

function validEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            email
        );

}


function loadRememberedEmail() {

    try {

        const remember =
            localStorage.getItem(
                REMEMBER_KEY
            );


        const email =
            localStorage.getItem(
                EMAIL_KEY
            );


        rememberMe.checked =
            remember ===
            "true";


        if (
            rememberMe.checked &&
            email
        ) {

            emailInput.value =
                email;

        }

    }

    catch (error) {

        console.warn(
            error
        );

    }

}


function saveRememberedEmail(
    email
) {

    try {

        if (
            rememberMe.checked
        ) {

            localStorage.setItem(
                EMAIL_KEY,
                email
            );


            localStorage.setItem(
                REMEMBER_KEY,
                "true"
            );

        }

        else {

            localStorage.removeItem(
                EMAIL_KEY
            );


            localStorage.setItem(
                REMEMBER_KEY,
                "false"
            );

        }

    }

    catch (error) {

        console.warn(
            error
        );

    }

}


/*
==========================================================
 PASSWORD STATUS
==========================================================
*/

function updatePasswordStatus() {

    const value =
        passwordInput.value;


    if (!value) {

        passwordStatus.textContent =
            "";

        return;

    }


    if (
        value.length < 6
    ) {

        passwordStatus.textContent =
            "SECURITY STATUS: TOO SHORT";

        return;

    }


    passwordStatus.textContent =
        "SECURITY STATUS: ACCEPTED";

}


/*
==========================================================
 PASSWORD TOGGLE
==========================================================
*/

togglePasswordButton.addEventListener(
    "click",
    () => {

        const reveal =
            passwordInput.type ===
            "password";


        passwordInput.type =
            reveal
                ? "text"
                : "password";


        const icon =
            togglePasswordButton
                .querySelector(
                    "i"
                );


        if (icon) {

            icon.className =
                reveal

                    ? "fa-solid fa-eye-slash"

                    : "fa-solid fa-eye";

        }

    }
);


passwordInput.addEventListener(
    "input",
    updatePasswordStatus
);


/*
==========================================================
 CAPS LOCK
==========================================================
*/

passwordInput.addEventListener(
    "keydown",
    event => {

        if (
            event.getModifierState &&
            event.getModifierState(
                "CapsLock"
            )
        ) {

            passwordStatus.textContent =
                "⚠ CAPS LOCK IS ON";

        }

        else {

            updatePasswordStatus();

        }

    }
);


/*
==========================================================
 CLEAR EMAIL
==========================================================
*/

clearEmailButton.addEventListener(
    "click",
    () => {

        emailInput.value =
            "";

        emailInput.focus();

        hideMessage();

    }
);


/*
==========================================================
 LOADING
==========================================================
*/

function setLoading(
    loading
) {

    loginButton.disabled =
        loading;


    forgotPasswordButton.disabled =
        loading;


    whatsappButton.disabled =
        loading;


    if (loading) {

        loginButtonContent.innerHTML = `

            <span class="login-spinner"></span>

            <span>
                VERIFYING ACCESS...
            </span>

        `;

    }

    else {

        loginButtonContent.innerHTML = `

            <i class="fa-solid fa-shield-halved"></i>

            <span>
                SECURE SIGN IN
            </span>

            <i class="fa-solid fa-arrow-left"></i>

        `;

    }

}


/*
==========================================================
 ERROR TRANSLATION
==========================================================
*/

function authErrorMessage(
    error
) {

    const code =
        error?.code ||
        "";


    switch (code) {

        case "auth/invalid-email":

            return "ایمیل ناسم دی.";


        case "auth/user-not-found":

            return "دا ایمیل په Firebase Authentication کې نشته.";


        case "auth/wrong-password":

            return "پاسورډ ناسم دی.";


        case "auth/invalid-credential":

            return "ایمیل یا پاسورډ ناسم دی.";


        case "auth/user-disabled":

            return "دا حساب غیر فعال شوی دی.";


        case "auth/too-many-requests":

            return "ډېرې ناکامې هڅې شوې دي. لږ وروسته بیا هڅه وکړئ.";


        case "auth/network-request-failed":

            return "د انټرنېټ اړیکه ستونزه لري.";


        case "auth/operation-not-allowed":

            return "Email/Password Login په Firebase کې فعال نه دی.";


        default:

            return (
                error?.message ||
                "د ننوتلو پر مهال ستونزه رامنځته شوه."
            );

    }

}


/*
==========================================================
 LOGIN
==========================================================
*/

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        hideMessage();


        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;


        if (!email) {

            showMessage(
                "مهرباني وکړئ ایمیل ولیکئ."
            );

            emailInput.focus();

            return;

        }


        if (
            !validEmail(
                email
            )
        ) {

            showMessage(
                "مهرباني وکړئ صحیح ایمیل ولیکئ."
            );

            emailInput.focus();

            return;

        }


        if (!password) {

            showMessage(
                "مهرباني وکړئ پاسورډ ولیکئ."
            );

            passwordInput.focus();

            return;

        }


        if (
            password.length < 6
        ) {

            showMessage(
                "پاسورډ ناسم یا ډېر لنډ دی."
            );

            passwordInput.focus();

            return;

        }


        if (
            !navigator.onLine
        ) {

            showMessage(
                "انټرنېټ مو قطع دی. لومړی انټرنېټ وصل کړئ."
            );

            return;

        }


        saveRememberedEmail(
            email
        );


        setLoading(
            true
        );


        try {

            const result =
                await loginUser(
                    email,
                    password
                );


            if (
                !result ||
                result.success !== true
            ) {

                showMessage(
                    result?.message ||
                    "ننوتل بریالي نه شول."
                );

                return;

            }


            showMessage(
                "حساب تایید شو. Secure Dashboard ته ځئ...",
                "success"
            );


            setTimeout(
                () => {

                    window.location.replace(
                        DASHBOARD_URL
                    );

                },
                450
            );

        }

        catch (error) {

            console.error(
                "Secure Login Error:",
                error
            );


            showMessage(
                authErrorMessage(
                    error
                )
            );

        }

        finally {

            setLoading(
                false
            );

        }

    }
);


/*
==========================================================
 PASSWORD RESET
==========================================================
*/

forgotPasswordButton.addEventListener(
    "click",
    async () => {

        hideMessage();


        const email =
            emailInput.value.trim();


        if (!email) {

            showMessage(
                "لومړی خپل ایمیل ولیکئ."
            );

            emailInput.focus();

            return;

        }


        if (
            !validEmail(
                email
            )
        ) {

            showMessage(
                "صحیح ایمیل ولیکئ."
            );

            return;

        }


        forgotPasswordButton.disabled =
            true;


        forgotPasswordButton.textContent =
            "⏳ RESET REQUEST";


        try {

            const result =
                await resetPassword(
                    email
                );


            if (
                result?.success
            ) {

                showMessage(
                    result.message ||
                    "د پاسورډ Reset لینک واستول شو.",
                    "success"
                );

            }

            else {

                showMessage(
                    result?.message ||
                    "Reset ایمیل ونه لېږل شو."
                );

            }

        }

        catch (error) {

            console.error(
                error
            );


            showMessage(
                authErrorMessage(
                    error
                )
            );

        }

        finally {

            forgotPasswordButton.disabled =
                false;


            forgotPasswordButton.textContent =
                "پاسورډ مو هېر کړی؟";

        }

    }
);


/*
==========================================================
 WHATSAPP
==========================================================
*/

whatsappButton.addEventListener(
    "click",
    () => {

        const email =
            emailInput.value.trim();


        const message =
            email

                ? `سلام، زه د سیستم Login ستونزه لرم. زما ایمیل: ${email}`

                : "سلام، زه د سیستم Login ستونزه لرم. مهرباني وکړئ مرسته راسره وکړئ.";


        const url =
            `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

    }
);


/*
==========================================================
 EXISTING AUTH SESSION
==========================================================
*/

try {

    listenAuth(
        session => {

            if (
                session
            ) {

                showMessage(
                    "فعال Login session وموندل شو. Dashboard ته ځئ...",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.replace(
                            DASHBOARD_URL
                        );

                    },
                    350
                );

            }

        }
    );

}

catch (error) {

    console.error(
        "Auth Listener Error:",
        error
    );

}


/*
==========================================================
 PROFILE MODAL
==========================================================
*/

const ownerPhoto =
    document.querySelector(
        ".cyber-logo"
    );


/*
دلته که وروسته غواړې owner-photo.png
د Robot/Logo پر ځای د Profile په شکل
وکارول شي، Modal logic همدلته غځول کېدای شي.
*/


closeProfileModal?.addEventListener(
    "click",
    () => {

        profileModal.classList.remove(
            "show"
        );

        profileModal.setAttribute(
            "aria-hidden",
            "true"
        );

    }
);


profileModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            profileModal
        ) {

            profileModal.classList.remove(
                "show"
            );

            profileModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }
);


/*
==========================================================
 INIT
==========================================================
*/

async function initializeLogin() {

    try {

        await initializeSettings();

    }

    catch (error) {

        console.warn(
            "Settings initialization failed:",
            error
        );

    }


    loadRememberedEmail();


    updatePasswordStatus();


    updateNetworkStatus();

}


initializeLogin();