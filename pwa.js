// ==========================================
// PWA Update Manager
// د افغانستان اسلامي امارت د کره کمیسیون
// Version + Update + Install Management
// ==========================================

(() => {

    "use strict";

    // ==========================================
    // PWA Settings
    // ==========================================

    const PWA_CONFIG = {

        // هر ځل چې نوې نسخه خپروې، دا شمېره بدلوه.
        VERSION: "1.0.1",
        REMOTE_VERSION_URL: "./version.json",

        // Service Worker فایل
        SERVICE_WORKER: "./sw.js",

        // د Version ساتلو Key
        VERSION_KEY: "hafz_pwa_version",

        // د Update پیغام
        UPDATE_MESSAGE:
            "د سیستم نوې نسخه موجوده ده. د نوي بدلونونو لپاره Update وکړئ."

    };


    // ==========================================
    // New Official Navigation
    // مسلک او زده کړې
    // ==========================================

    const PROFESSIONAL_EDUCATION_URL =
        "./profession-education/profession-education.html";


    const PROFESSIONAL_EDUCATION_LABELS = {

        ps:
            "🎓 مسلک او زده کړې",

        fa:
            "🎓 مسلک و آموزش",

        ur:
            "🎓 پیشہ اور تعلیم",

        ar:
            "🎓 المهن والتعليم",

        en:
            "🎓 Professions & Education"

    };


    function getProfessionalEducationLanguage(
        language = "ps"
    ) {

        const key =
            String(
                language ||
                document.documentElement.lang ||
                "ps"
            )
                .trim()
                .toLowerCase();

        return (
            PROFESSIONAL_EDUCATION_LABELS[key]
                ? key
                : "ps"
        );

    }


    function applyProfessionalEducationNavText(
        button,
        language = null
    ) {

        if (!button) {
            return;
        }

        const lang =
            getProfessionalEducationLanguage(
                language
            );

        const label =
            PROFESSIONAL_EDUCATION_LABELS[lang];

        button.setAttribute(
            "aria-label",
            label
        );

        const textElement =
            button.querySelector(
                ".professional-education-nav-text"
            );

        if (textElement) {
            textElement.textContent =
                label.replace(
                    /^🎓\s*/,
                    ""
                );
        }

    }


    function installProfessionalEducationNavigation() {

        const reportsButton =
            document.getElementById(
                "reportsMenuBtn"
            );

        if (!reportsButton) {
            return;
        }

        let button =
            document.getElementById(
                "professionalEducationMenuBtn"
            );


        if (!button) {

            button =
                reportsButton.cloneNode(
                    true
                );

            button.id =
                "professionalEducationMenuBtn";

            button.classList.remove(
                "active"
            );

            button.removeAttribute(
                "aria-current"
            );

            button.innerHTML = `

                <span
                    class="sidebar-icon"
                    aria-hidden="true"
                >
                    🎓
                </span>

                <span
                    class="professional-education-nav-text"
                >
                    مسلک او زده کړې
                </span>

            `;

            reportsButton.insertAdjacentElement(
                "afterend",
                button
            );

        }


        const currentPath =
            String(
                window.location.pathname ||
                ""
            );


        const isProfessionalEducationPage =
            currentPath.endsWith(
                "/profession-education/profession-education.html"
            ) ||
            currentPath.endsWith(
                "/profession-education/"
            );


        button.classList.toggle(
            "active",
            isProfessionalEducationPage
        );


        if (
            isProfessionalEducationPage
        ) {

            button.setAttribute(
                "aria-current",
                "page"
            );

        } else {

            button.removeAttribute(
                "aria-current"
            );

        }


        button.title =
            PROFESSIONAL_EDUCATION_LABELS[
                getProfessionalEducationLanguage()
            ];


        applyProfessionalEducationNavText(
            button
        );


        button.onclick = event => {

            event.preventDefault();

            const current =
                new URL(
                    window.location.href
                );

            const destination =
                new URL(
                    PROFESSIONAL_EDUCATION_URL,
                    window.location.href
                );

            if (
                current.pathname ===
                    destination.pathname
            ) {
                return;
            }

            window.location.href =
                PROFESSIONAL_EDUCATION_URL;

        };


        if (
            !window.__hafzProfessionalEducationNavLanguageListener
        ) {

            window.__hafzProfessionalEducationNavLanguageListener =
                true;

            window.addEventListener(
                "krha-settings-applied",
                event => {

                    const lang =
                        event.detail
                            ?.settings
                            ?.language ||
                        document.documentElement.lang ||
                        "ps";

                    const currentButton =
                        document.getElementById(
                            "professionalEducationMenuBtn"
                        );

                    applyProfessionalEducationNavText(
                        currentButton,
                        lang
                    );

                    if (currentButton) {

                        currentButton.title =
                            PROFESSIONAL_EDUCATION_LABELS[
                                getProfessionalEducationLanguage(
                                    lang
                                )
                            ];

                    }

                }
            );

        }

    }


    // ==========================================
    // State
    // ==========================================

    let deferredInstallPrompt = null;

    let updateAvailable = false;


    // ==========================================
    // Helpers
    // ==========================================

    function normalizeText(value) {

        return String(
            value ?? ""
        ).trim();

    }


    // ==========================================
    // Create Update Box
    // ==========================================

    function createUpdateBox() {

        if (
            document.getElementById(
                "pwaUpdateBox"
            )
        ) {

            return document.getElementById(
                "pwaUpdateBox"
            );

        }


        const box =
            document.createElement(
                "div"
            );

        box.id =
            "pwaUpdateBox";

        box.innerHTML = `

            <div
                style="
                    position:fixed;
                    left:16px;
                    right:16px;
                    bottom:16px;
                    z-index:999999;
                    max-width:520px;
                    margin:0 auto;
                    background:#ffffff;
                    color:#111827;
                    border:1px solid #d1d5db;
                    border-radius:16px;
                    box-shadow:0 10px 35px rgba(0,0,0,.18);
                    padding:16px;
                    direction:rtl;
                    font-family:
                        'Noto Naskh Arabic',
                        Arial,
                        sans-serif;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:10px;
                        align-items:flex-start;
                    "
                >

                    <div
                        style="
                            font-size:28px;
                            line-height:1;
                        "
                    >
                        🔄
                    </div>

                    <div
                        style="
                            flex:1;
                        "
                    >

                        <div
                            style="
                                font-size:17px;
                                font-weight:800;
                                margin-bottom:6px;
                            "
                        >
                            د سیستم نوې نسخه
                        </div>

                        <div
                            id="pwaUpdateText"
                            style="
                                font-size:13px;
                                line-height:1.8;
                                color:#4b5563;
                            "
                        >
                            ${PWA_CONFIG.UPDATE_MESSAGE}
                        </div>

                    </div>

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        margin-top:14px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        id="pwaUpdateNow"
                        style="
                            border:0;
                            border-radius:9px;
                            padding:9px 14px;
                            cursor:pointer;
                            font-size:13px;
                            font-weight:800;
                            background:#0B6B36;
                            color:#fff;
                        "
                    >
                        🔄 Update اوس
                    </button>


                    <button
                        type="button"
                        id="pwaUpdateLater"
                        style="
                            border:1px solid #d1d5db;
                            border-radius:9px;
                            padding:9px 14px;
                            cursor:pointer;
                            font-size:13px;
                            font-weight:700;
                            background:#fff;
                            color:#374151;
                        "
                    >
                        وروسته
                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(
            box
        );


        document
            .getElementById(
                "pwaUpdateNow"
            )
            ?.addEventListener(
                "click",
                async () => {

                    await activateUpdate();

                }
            );


        document
            .getElementById(
                "pwaUpdateLater"
            )
            ?.addEventListener(
                "click",
                () => {

                    box.remove();

                }
            );


        return box;

    }


    // ==========================================
    // Show Update Message
    // ==========================================

    function showUpdateMessage(
        message =
            PWA_CONFIG.UPDATE_MESSAGE
    ) {

        const box =
            createUpdateBox();

        const text =
            document.getElementById(
                "pwaUpdateText"
            );

        if (
            text
        ) {

            text.textContent =
                normalizeText(
                    message
                ) ||
                PWA_CONFIG.UPDATE_MESSAGE;

        }

        if (
            box
        ) {

            box.style.display =
                "block";

        }

    }


    // ==========================================
    // Activate Service Worker Update
    // ==========================================

    async function activateUpdate() {

        try {

            const registration =
                window.__hafzSwRegistration;

            if (
                !registration
            ) {

                window.location.reload();

                return;

            }


            const newWorker =
                registration.waiting;

            if (
                newWorker
            ) {

                newWorker.postMessage(
                    {
                        type:
                            "SKIP_WAITING"
                    }
                );

                return;

            }


            if (
                registration.installing
            ) {

                showUpdateMessage(
                    "نوې نسخه نصبېږي؛ مهرباني وکړئ..."
                );

                registration.installing.addEventListener(
                    "statechange",
                    () => {

                        if (
                            registration.installing?.state ===
                            "installed"
                        ) {

                            window.location.reload();

                        }

                    }
                );

                return;

            }


            await registration.update();

            window.location.reload();

        } catch (error) {

            console.error(
                "PWA Update Error:",
                error
            );

            window.location.reload();

        }

    }


    // ==========================================
    // Detect New Version
    // ==========================================

    async function checkRemoteVersion() {

        try {

            const response = await fetch(
                `${PWA_CONFIG.REMOTE_VERSION_URL}?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            const remoteVersion =
                normalizeText(data?.version);

            if (!remoteVersion) {
                return;
            }

            const savedVersion =
                localStorage.getItem(
                    PWA_CONFIG.VERSION_KEY
                );

            if (!savedVersion) {

                localStorage.setItem(
                    PWA_CONFIG.VERSION_KEY,
                    remoteVersion
                );

                return;

            }

            if (savedVersion !== remoteVersion) {

                localStorage.setItem(
                    PWA_CONFIG.VERSION_KEY,
                    remoteVersion
                );

                showUpdateMessage(
                    "د سیستم نوې نسخه خپره شوې ده. سیستم تازه کېږي..."
                );

                setTimeout(
                    () => window.location.reload(),
                    1200
                );

            }

        } catch (error) {

            console.error(
                "Remote version check failed:",
                error
            );

        }

    }


    // ==========================================
    // Register Service Worker
    // ==========================================

    async function registerServiceWorker() {

        if (
            !("serviceWorker" in navigator)
        ) {

            return null;

        }

        try {

            const registration =
                await navigator.serviceWorker.register(
                    PWA_CONFIG.SERVICE_WORKER,
                    {
                        scope: "./"
                    }
                );


            window.__hafzSwRegistration =
                registration;


            if (
                registration.waiting &&
                navigator.serviceWorker.controller
            ) {

                updateAvailable =
                    true;

                showUpdateMessage();

            }


            registration.addEventListener(
                "updatefound",
                () => {

                    const newWorker =
                        registration.installing;

                    if (
                        !newWorker
                    ) {

                        return;

                    }

                    newWorker.addEventListener(
                        "statechange",
                        () => {

                            if (
                                newWorker.state ===
                                "installed"
                            ) {

                                if (
                                    navigator
                                        .serviceWorker
                                        .controller
                                ) {

                                    updateAvailable =
                                        true;

                                    showUpdateMessage();

                                }

                            }

                        }
                    );

                }
            );


            window.addEventListener(
                "online",
                () => {

                    registration
                        .update()
                        .catch(
                            error =>
                                console.error(
                                    "PWA update check failed:",
                                    error
                                )
                        );

                }
            );


            setInterval(
                () => {

                    registration
                        .update()
                        .catch(
                            () => {}
                        );

                },
                5 * 60 * 1000
            );


            return registration;

        } catch (error) {

            console.error(
                "Service Worker Registration Error:",
                error
            );

            return null;

        }

    }


    // ==========================================
    // Controller Change
    // ==========================================

    function setupControllerChange() {

        let refreshing =
            false;

        navigator
            .serviceWorker
            .addEventListener(
                "controllerchange",
                () => {

                    if (
                        refreshing
                    ) {

                        return;

                    }

                    refreshing =
                        true;

                    window.location.reload();

                }
            );

    }


    // ==========================================
    // PWA Install
    // ==========================================

    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();

            deferredInstallPrompt =
                event;

            window.__hafzInstallPwa =
                async () => {

                    if (
                        !deferredInstallPrompt
                    ) {

                        return {
                            success: false,
                            message:
                                "د نصب غوښتنه اوس موجوده نه ده."
                        };

                    }

                    const prompt =
                        deferredInstallPrompt;

                    deferredInstallPrompt =
                        null;

                    await prompt.prompt();

                    const result =
                        await prompt.userChoice;

                    return {

                        success:
                            result.outcome ===
                            "accepted",

                        outcome:
                            result.outcome

                    };

                };

        }
    );


    // ==========================================
    // Installed Event
    // ==========================================

    window.addEventListener(
        "appinstalled",
        () => {

            deferredInstallPrompt =
                null;

            console.log(
                "Hafz PWA installed."
            );

        }
    );


    // ==========================================
    // Start
    // ==========================================

    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            installProfessionalEducationNavigation();

            await checkRemoteVersion();

            setInterval(
                () => {
                    checkRemoteVersion();
                },
                60 * 1000
            );

            setupControllerChange();

            await registerServiceWorker();

        }
    );


})();