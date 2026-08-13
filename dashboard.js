// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت ډیټابیس
//
// dashboard.js
// Complete Online Dashboard Engine
//
// Compatible with:
// firebase.js
// auth.js
// presence.js
// settings.js
// dashboard.html
//
// Features:
// - Firebase Authentication
// - Firestore statistics
// - Live Presence
// - Live Comments
// - Likes / Hearts
// - Afghanistan provinces
// - Prayer times
// - Qibla
// - Weather
// - Solar / Lunar / Gregorian dates
// - AM / PM clock
// - Login time / duration
// ==========================================


// ==========================================
// FIREBASE APP
// ==========================================

import {
    auth,
    db
} from "./firebase.js";


// ==========================================
// FIREBASE AUTH
// ==========================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ==========================================
// FIRESTORE
// ==========================================

import {
    collection,
    getCountFromServer,
    query,
    where,
    addDoc,
    serverTimestamp,
    onSnapshot,
    orderBy,
    limit,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// EXISTING AUTH SYSTEM
// ==========================================

import {
    getCurrentSession,
    logoutUser
} from "./auth.js";


// ==========================================
// EXISTING PRESENCE SYSTEM
// ==========================================

import {
    initializePresence,
    listenOnlineUsers,
    stopOnlineUsersListener
} from "./presence.js";


// ==========================================
// EXISTING SETTINGS SYSTEM
// ==========================================

import {
    initializeSettings,
    getSettings
} from "./settings.js";


// ==========================================
// GLOBAL STATE
// ==========================================

let dashboardInitialized = false;

let dashboardBootPromise = null;

let currentUser = null;

let currentSession = null;

let currentLanguage = "ps";

let currentOnlineUsers = [];

let currentPrayerTimings = null;

let commentsUnsubscribe = null;

let prayerTimer = null;

let clockTimer = null;

let loginDurationTimer = null;

let loginAt = null;

let selectedProvinceCode = "KBL";


// ==========================================
// DOM HELPERS
// ==========================================

function $(selector) {
    return document.querySelector(selector);
}


function $$(selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
}


// ==========================================
// SAFE HTML
// ==========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// TRANSLATIONS
// ==========================================

const TRANSLATIONS = {

    ps: {

        sidebar: "اصلي مینو",

        dashboard: "ډشبورډ",

        register: "نوی ثبت",

        search: "لټون",

        reports: "راپورونه",

        admin: "اداره",

        settings: "تنظیمات",

        online: "آنلاین",

        unknown: "نامعلوم کاروونکی",

        noUsers:
            "اوس مهال آنلاین کاروونکی نشته.",

        noComments:
            "تر اوسه کومه تبصره نشته. لومړی تاسو سلام وکړئ 😊",

        sending:
            "لیږل کېږي...",

        commentError:
            "تبصره ونه لېږل شوه.",

        prayerLoading:
            "د لمانځه وختونه ترلاسه کېږي...",

        prayerError:
            "د لمانځه وختونه ترلاسه نه شول.",

        weatherError:
            "د هوا معلومات ترلاسه نه شول.",

        welcome:
            "ښه راغلاست، {name}",

        logoutError:
            "له سیستم څخه وتل ناکام شول."

    },


    fa: {

        sidebar: "منوی اصلی",

        dashboard: "داشبورد",

        register: "ثبت جدید",

        search: "جستجو",

        reports: "گزارش‌ها",

        admin: "اداره",

        settings: "تنظیمات",

        online: "آنلاین",

        unknown: "کاربر نامعلوم",

        noUsers:
            "در حال حاضر کاربر آنلاین وجود ندارد.",

        noComments:
            "هنوز تبصره‌ای وجود ندارد.",

        sending:
            "در حال ارسال...",

        commentError:
            "تبصره ارسال نشد.",

        prayerLoading:
            "معلومات اوقات نماز دریافت می‌شود...",

        prayerError:
            "اوقات نماز دریافت نشد.",

        weatherError:
            "معلومات هوا دریافت نشد.",

        welcome:
            "خوش آمدید، {name}",

        logoutError:
            "خروج از سیستم ناکام شد."

    },


    en: {

        sidebar: "Main Menu",

        dashboard: "Dashboard",

        register: "New Registration",

        search: "Search",

        reports: "Reports",

        admin: "Administration",

        settings: "Settings",

        online: "Online",

        unknown: "Unknown User",

        noUsers:
            "No users are currently online.",

        noComments:
            "No comments yet.",

        sending:
            "Sending...",

        commentError:
            "Comment could not be sent.",

        prayerLoading:
            "Loading prayer times...",

        prayerError:
            "Prayer times unavailable.",

        weatherError:
            "Weather unavailable.",

        welcome:
            "Welcome, {name}",

        logoutError:
            "Logout failed."

    }

};


// ==========================================
// AFGHANISTAN PROVINCES
// ==========================================

const AFGHAN_PROVINCES = {

    KBL: {
        name: "کابل",
        city: "Kabul",
        lat: 34.5553,
        lon: 69.2075
    },

    KDH: {
        name: "کندهار",
        city: "Kandahar",
        lat: 31.6289,
        lon: 65.7372
    },

    ZBL: {
        name: "زابل",
        city: "Qalat",
        lat: 32.1058,
        lon: 66.9083
    },

    URZ: {
        name: "ارزګان",
        city: "Tarin Kowt",
        lat: 32.6297,
        lon: 65.8781
    },

    HLM: {
        name: "هلمند",
        city: "Lashkar Gah",
        lat: 31.583,
        lon: 64.36
    },

    HER: {
        name: "هرات",
        city: "Herat",
        lat: 34.3529,
        lon: 62.204
    },

    FRA: {
        name: "فراه",
        city: "Farah",
        lat: 32.3745,
        lon: 62.1164
    },

    NMR: {
        name: "نیمروز",
        city: "Zaranj",
        lat: 30.9596,
        lon: 61.8603
    },

    BDG: {
        name: "بادغیس",
        city: "Qala i Naw",
        lat: 34.9868,
        lon: 63.1289
    },

    GHR: {
        name: "غور",
        city: "Chaghcharan",
        lat: 34.0,
        lon: 65.25
    },

    BAM: {
        name: "بامیان",
        city: "Bamyan",
        lat: 34.8106,
        lon: 67.821
    },

    DKD: {
        name: "دایکندي",
        city: "Nili",
        lat: 33.7218,
        lon: 66.1302
    },

    GHA: {
        name: "غزني",
        city: "Ghazni",
        lat: 33.5539,
        lon: 68.4208
    },

    PKT: {
        name: "پکتیا",
        city: "Gardez",
        lat: 33.5974,
        lon: 69.2259
    },

    PKA: {
        name: "پکتیکا",
        city: "Sharana",
        lat: 33.1256,
        lon: 68.7978
    },

    KST: {
        name: "خوست",
        city: "Khost",
        lat: 33.3395,
        lon: 69.9204
    },

    LOG: {
        name: "لوګر",
        city: "Pul e Alam",
        lat: 34.008,
        lon: 69.0273
    },

    WDG: {
        name: "میدان وردګ",
        city: "Maidan Shar",
        lat: 34.3956,
        lon: 68.8662
    },

    PRN: {
        name: "پروان",
        city: "Charikar",
        lat: 35.0136,
        lon: 69.1714
    },

    KPS: {
        name: "کاپیسا",
        city: "Mahmud Raqi",
        lat: 35.017,
        lon: 69.4532
    },

    PAN: {
        name: "پنجشېر",
        city: "Bazarak",
        lat: 35.3108,
        lon: 69.5152
    },

    BGL: {
        name: "بغلان",
        city: "Pul e Khumri",
        lat: 35.9448,
        lon: 68.7151
    },

    KND: {
        name: "کندز",
        city: "Kunduz",
        lat: 36.728,
        lon: 68.8647
    },

    TKR: {
        name: "تخار",
        city: "Taloqan",
        lat: 36.736,
        lon: 69.5345
    },

    BDK: {
        name: "بدخشان",
        city: "Fayzabad",
        lat: 37.1166,
        lon: 70.5801
    },

    SMG: {
        name: "سمنګان",
        city: "Aybak",
        lat: 36.2647,
        lon: 68.0151
    },

    BLK: {
        name: "بلخ",
        city: "Mazar i Sharif",
        lat: 36.7069,
        lon: 67.1122
    },

    JOW: {
        name: "جوزجان",
        city: "Sheberghan",
        lat: 36.6676,
        lon: 65.7529
    },

    SRP: {
        name: "سرپل",
        city: "Sar e Pol",
        lat: 35.8409,
        lon: 65.5676
    },

    FYB: {
        name: "فاریاب",
        city: "Maymana",
        lat: 35.9214,
        lon: 64.7836
    },

    NRN: {
        name: "نورستان",
        city: "Parun",
        lat: 35.4206,
        lon: 70.9226
    },

    LGM: {
        name: "لغمان",
        city: "Mehtarlam",
        lat: 34.6714,
        lon: 70.2094
    },

    NGR: {
        name: "ننګرهار",
        city: "Jalalabad",
        lat: 34.434,
        lon: 70.4478
    },

    KNR: {
        name: "کونړ",
        city: "Asadabad",
        lat: 34.8731,
        lon: 71.1469
    }

};


// ==========================================
// PRAYER DEFINITIONS
// ==========================================

const PRAYERS = [

    {
        key: "Fajr",
        label: "فجر",
        icon: "fa-star-and-crescent"
    },

    {
        key: "Sunrise",
        label: "لمر ختل",
        icon: "fa-sun"
    },

    {
        key: "Dhuhr",
        label: "غرمه",
        icon: "fa-sun"
    },

    {
        key: "Asr",
        label: "مازیګر",
        icon: "fa-cloud-sun"
    },

    {
        key: "Maghrib",
        label: "ماښام",
        icon: "fa-sunset"
    },

    {
        key: "Isha",
        label: "ماخستن",
        icon: "fa-moon"
    }

];


// ==========================================
// GET TRANSLATION
// ==========================================

function t(key, replacements = {}) {

    const pack =
        TRANSLATIONS[currentLanguage] ||
        TRANSLATIONS.ps;

    let text =
        pack[key] ??
        TRANSLATIONS.ps[key] ??
        key;

    Object.entries(
        replacements
    ).forEach(
        ([name, value]) => {

            text =
                text.replaceAll(
                    `{${name}}`,
                    String(value)
                );

        }
    );

    return text;

}


// ==========================================
// STATIC SETTINGS / TEXT
// ==========================================

function applySettingsText() {

    const settings =
        getSettings();

    currentLanguage =
        settings?.language ||
        "ps";

    if (
        !TRANSLATIONS[currentLanguage]
    ) {

        currentLanguage =
            "ps";

    }

    const systemName =
        settings?.systemName ||
        "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس";


    document.title =
        `${systemName} | ${t("dashboard")}`;


    $$("[data-system-name]")
        .forEach(
            element => {

                element.textContent =
                    systemName;

            }
        );


    const sidebarTitle =
        $("#sidebarTitle");

    if (sidebarTitle) {

        sidebarTitle.textContent =
            t("sidebar");

    }


    const dashboardBtn =
        $("#dashboardMenuBtn");

    if (dashboardBtn) {

        dashboardBtn.textContent =
            `📊 ${t("dashboard")}`;

    }


    const registerBtn =
        $("#registerMenuBtn");

    if (registerBtn) {

        registerBtn.textContent =
            `📝 ${t("register")}`;

    }


    const searchBtn =
        $("#searchMenuBtn");

    if (searchBtn) {

        searchBtn.textContent =
            `🔍 ${t("search")}`;

    }


    const reportsBtn =
        $("#reportsMenuBtn");

    if (reportsBtn) {

        reportsBtn.textContent =
            `📄 ${t("reports")}`;

    }


    const adminBtn =
        $("#adminMenuBtn");

    if (adminBtn) {

        adminBtn.textContent =
            `👥 ${t("admin")}`;

    }


    const settingsBtn =
        $("#settingsMenuBtn");

    if (settingsBtn) {

        settingsBtn.textContent =
            `⚙️ ${t("settings")}`;

    }

}


// ==========================================
// CURRENT DATE/TIME
// ==========================================

function updateClockAndCalendars() {

    const now =
        new Date();


    const solar =
        $("#solarDate");

    const lunar =
        $("#lunarDate");

    const gregorian =
        $("#gregorianDate");

    const ampmTime =
        $("#ampmTime");

    const ampmLabel =
        $("#ampmLabel");

    const currentDateTime =
        $("#currentDateTime");


    try {

        if (solar) {

            solar.textContent =
                new Intl.DateTimeFormat(
                    "fa-AF-u-ca-persian",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                ).format(
                    now
                );

        }

    } catch (error) {

        console.warn(
            "Solar calendar error:",
            error
        );

    }


    try {

        if (lunar) {

            lunar.textContent =
                new Intl.DateTimeFormat(
                    "ar-AF-u-ca-islamic",
                    {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    }
                ).format(
                    now
                );

        }

    } catch (error) {

        console.warn(
            "Lunar calendar error:",
            error
        );

    }


    if (gregorian) {

        gregorian.textContent =
            new Intl.DateTimeFormat(
                "en-GB",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            ).format(
                now
            );

    }


    const timeString =
        now.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );


    if (ampmTime) {

        ampmTime.textContent =
            timeString;

    }


    if (ampmLabel) {

        ampmLabel.textContent =
            now.getHours() >= 12
                ? "PM"
                : "AM";

    }


    if (currentDateTime) {

        currentDateTime.textContent =
            timeString;

    }

}


// ==========================================
// LOGIN TIME / DURATION
// ==========================================

function initializeLoginDuration(user) {

    const storedLogin =
        localStorage.getItem(
            "krhe_dashboard_login_at"
        );


    if (
        user?.metadata?.lastSignInTime
    ) {

        loginAt =
            new Date(
                user.metadata.lastSignInTime
            );

    } else if (
        storedLogin
    ) {

        loginAt =
            new Date(
                storedLogin
            );

    } else {

        loginAt =
            new Date();

    }


    if (
        Number.isNaN(
            loginAt.getTime()
        )
    ) {

        loginAt =
            new Date();

    }


    localStorage.setItem(
        "krhe_dashboard_login_at",
        loginAt.toISOString()
    );


    const loginTime =
        $("#loginTime");


    if (loginTime) {

        loginTime.textContent =
            loginAt.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );

    }


    updateLoginDuration();


    if (loginDurationTimer) {

        clearInterval(
            loginDurationTimer
        );

    }


    loginDurationTimer =
        setInterval(
            updateLoginDuration,
            1000
        );

}


function updateLoginDuration() {

    if (!loginAt) {

        return;

    }


    const elapsed =
        Math.max(
            0,
            Date.now() -
            loginAt.getTime()
        );


    const totalSeconds =
        Math.floor(
            elapsed / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    const two =
        value =>
            String(
                value
            ).padStart(
                2,
                "0"
            );


    const output =
        `${two(hours)}:${two(minutes)}:${two(seconds)}`;


    const element =
        $("#loginDuration");


    if (element) {

        element.textContent =
            output;

    }

}


// ==========================================
// PROVINCE SELECTOR
// ==========================================

function initializeProvinceSelector() {

    const select =
        $("#provinceSelect");


    if (!select) {

        return;

    }


    select.innerHTML =
        "";


    Object.entries(
        AFGHAN_PROVINCES
    )
    .forEach(
        ([code, province]) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                code;


            option.textContent =
                province.name;


            if (
                code ===
                selectedProvinceCode
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


function getSelectedProvince() {

    const select =
        $("#provinceSelect");


    const code =
        select?.value ||
        selectedProvinceCode;


    selectedProvinceCode =
        code;


    return (
        AFGHAN_PROVINCES[code] ||
        AFGHAN_PROVINCES.KBL
    );

}


// ==========================================
// WEATHER
// ==========================================

function getWeatherDescription(code) {

    const value =
        Number(code);


    if (value === 0) {

        return "صافه هوا ☀️";

    }


    if (
        value === 1 ||
        value === 2
    ) {

        return "لږ وريځ ☁️";

    }


    if (value === 3) {

        return "وریځ ☁️";

    }


    if (
        value === 45 ||
        value === 48
    ) {

        return "لوخړه 🌫️";

    }


    if (
        value >= 51 &&
        value <= 57
    ) {

        return "سپک باران 🌦️";

    }


    if (
        value >= 61 &&
        value <= 67
    ) {

        return "باران 🌧️";

    }


    if (
        value >= 71 &&
        value <= 77
    ) {

        return "واوره ❄️";

    }


    if (
        value >= 80 &&
        value <= 82
    ) {

        return "ورښت 🌦️";

    }


    if (value >= 95) {

        return "تندر او بریښنا ⛈️";

    }


    return "نامعلوم";

}


function getWeatherIcon(code) {

    const value =
        Number(code);


    if (value === 0) {

        return `
            <i class="fa-solid fa-sun"></i>
        `;

    }


    if (value <= 3) {

        return `
            <i class="fa-solid fa-cloud-sun"></i>
        `;

    }


    if (
        value >= 61 &&
        value <= 67
    ) {

        return `
            <i class="fa-solid fa-cloud-rain"></i>
        `;

    }


    if (
        value >= 71 &&
        value <= 77
    ) {

        return `
            <i class="fa-solid fa-snowflake"></i>
        `;

    }


    if (value >= 95) {

        return `
            <i class="fa-solid fa-cloud-bolt"></i>
        `;

    }


    return `
        <i class="fa-solid fa-cloud"></i>
    `;

}


async function loadWeather(
    province
) {

    if (!province) {

        return;

    }


    const description =
        $("#weatherDescription");

    const temperature =
        $("#weatherTemperature");

    const humidity =
        $("#weatherHumidity");

    const wind =
        $("#weatherWind");

    const icon =
        $("#weatherIcon");

    const updated =
        $("#weatherUpdated");

    const provinceName =
        $("#weatherProvinceName");


    if (provinceName) {

        provinceName.textContent =
            province.name;

    }


    try {

        const url =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${encodeURIComponent(province.lat)}` +
            `&longitude=${encodeURIComponent(province.lon)}` +
            "&current=temperature_2m" +
            ",relative_humidity_2m" +
            ",weather_code" +
            ",wind_speed_10m" +
            "&timezone=auto";


        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Weather HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const current =
            data?.current;


        if (!current) {

            throw new Error(
                "Weather data missing"
            );

        }


        if (description) {

            description.textContent =
                getWeatherDescription(
                    current.weather_code
                );

        }


        if (temperature) {

            temperature.textContent =
                `${Math.round(
                    Number(
                        current.temperature_2m
                    )
                )} °C`;

        }


        if (humidity) {

            humidity.textContent =
                `${Math.round(
                    Number(
                        current.relative_humidity_2m
                    )
                )} %`;

        }


        if (wind) {

            wind.textContent =
                `${Math.round(
                    Number(
                        current.wind_speed_10m
                    )
                )} km/h`;

        }


        if (icon) {

            icon.innerHTML =
                getWeatherIcon(
                    current.weather_code
                );

        }


        if (updated) {

            updated.textContent =
                "Live";

        }

    } catch (error) {

        console.error(
            "Weather Error:",
            error
        );


        if (description) {

            description.textContent =
                t("weatherError");

        }


        if (temperature) {

            temperature.textContent =
                "-- °C";

        }


        if (humidity) {

            humidity.textContent =
                "-- %";

        }


        if (wind) {

            wind.textContent =
                "-- km/h";

        }


        if (updated) {

            updated.textContent =
                "Offline";

        }

    }

}


// ==========================================
// PRAYER DATE
// ==========================================

function getApiDate() {

    const now =
        new Date();


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const year =
        now.getFullYear();


    return `${day}-${month}-${year}`;

}


// ==========================================
// PRAYER TIME PARSE
// ==========================================

function parsePrayerTime(
    value
) {

    if (!value) {

        return null;

    }


    const clean =
        String(value)
            .trim()
            .split(" ")[0];


    const match =
        clean.match(
            /^(\d{1,2}):(\d{2})$/
        );


    if (!match) {

        return null;

    }


    return {

        hour:
            Number(
                match[1]
            ),

        minute:
            Number(
                match[2]
            ),

        text:
            clean

    };

}


function prayerTimeToDate(
    value,
    date = new Date()
) {

    const parsed =
        parsePrayerTime(
            value
        );


    if (!parsed) {

        return null;

    }


    const output =
        new Date(
            date
        );


    output.setHours(
        parsed.hour,
        parsed.minute,
        0,
        0
    );


    return output;

}


// ==========================================
// NEXT PRAYER
// ==========================================

function findNextPrayer(
    timings
) {

    if (!timings) {

        return null;

    }


    const now =
        new Date();


    const prayerKeys = [
        "Fajr",
        "Dhuhr",
        "Asr",
        "Maghrib",
        "Isha"
    ];


    for (
        const key
        of prayerKeys
    ) {

        const time =
            prayerTimeToDate(
                timings[key],
                now
            );


        if (
            time &&
            time.getTime() >
            now.getTime()
        ) {

            const prayer =
                PRAYERS.find(
                    item =>
                        item.key ===
                        key
                );


            return {

                key,

                label:
                    prayer?.label ||
                    key,

                time

            };

        }

    }


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    const tomorrowFajr =
        prayerTimeToDate(
            timings.Fajr,
            tomorrow
        );


    if (tomorrowFajr) {

        return {

            key:
                "Fajr",

            label:
                "فجر",

            time:
                tomorrowFajr

        };

    }


    return null;

}


// ==========================================
// PRAYER COUNTDOWN
// ==========================================

function updatePrayerCountdown() {

    if (
        !currentPrayerTimings
    ) {

        return;

    }


    const next =
        findNextPrayer(
            currentPrayerTimings
        );


    if (!next) {

        return;

    }


    const remaining =
        Math.max(
            0,
            next.time.getTime() -
            Date.now()
        );


    const totalSeconds =
        Math.floor(
            remaining / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    const two =
        value =>
            String(
                value
            ).padStart(
                2,
                "0"
            );


    const name =
        $("#nextPrayerName");


    const countdown =
        $("#nextPrayerCountdown");


    if (name) {

        name.textContent =
            next.label;

    }


    if (countdown) {

        countdown.textContent =
            `${two(hours)}:${two(minutes)}:${two(seconds)}`;

    }


    highlightPrayerCard(
        next.label
    );

}


// ==========================================
// ACTIVE PRAYER CARD
// ==========================================

function highlightPrayerCard(
    label
) {

    $$(".kr-prayer-item")
        .forEach(
            card => {

                card.classList.remove(
                    "active"
                );

            }
        );


    $$(".kr-prayer-item")
        .forEach(
            card => {

                const strong =
                    card.querySelector(
                        "strong"
                    );


                if (
                    strong &&
                    strong.textContent.trim() ===
                    label
                ) {

                    card.classList.add(
                        "active"
                    );

                }

            }
        );

}


// ==========================================
// RENDER PRAYER TIMES
// ==========================================

function renderPrayerTimes(
    timings
) {

    currentPrayerTimings =
        timings;


    const grid =
        $("#prayerGrid");


    if (!grid) {

        return;

    }


    grid.innerHTML =
        "";


    PRAYERS.forEach(
        prayer => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "kr-prayer-item";


            const value =
                timings[
                    prayer.key
                ] ||
                "--:--";


            card.innerHTML =
                `
                <i class="fa-solid ${prayer.icon}"></i>

                <strong>
                    ${escapeHtml(prayer.label)}
                </strong>

                <span>
                    ${escapeHtml(value)}
                </span>

                <small>
                    ${escapeHtml(prayer.key)}
                </small>
                `;


            grid.appendChild(
                card
            );

        }
    );


    updatePrayerCountdown();

}


// ==========================================
// LOAD PRAYER TIMES
// ==========================================

async function loadPrayerTimes(
    province
) {

    const meta =
        $("#prayerMeta");


    if (meta) {

        meta.textContent =
            t("prayerLoading");

    }


    try {

        const method =
            $("#calculationMethod")?.value ||
            "1";


        const school =
            $("#asrSchool")?.value ||
            "1";


        const date =
            getApiDate();


        const url =
            "https://api.aladhan.com/v1/timings/" +
            `${date}` +
            `?latitude=${encodeURIComponent(province.lat)}` +
            `&longitude=${encodeURIComponent(province.lon)}` +
            `&method=${encodeURIComponent(method)}` +
            `&school=${encodeURIComponent(school)}`;


        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Prayer HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            data?.code !== 200 ||
            !data?.data?.timings
        ) {

            throw new Error(
                "Invalid prayer response"
            );

        }


        renderPrayerTimes(
            data.data.timings
        );


        if (meta) {

            meta.textContent =
                `${province.name} · ${data.data.meta?.timezone || "Afghanistan"}`;

        }


        await loadQibla(
            province
        );

    } catch (error) {

        console.error(
            "Prayer Error:",
            error
        );


        if (meta) {

            meta.textContent =
                t("prayerError");

        }

    }

}


// ==========================================
// QIBLA
// ==========================================

async function loadQibla(
    province
) {

    const target =
        $("#qiblaDirection");


    if (!target) {

        return;

    }


    try {

        const url =
            `https://api.aladhan.com/v1/qibla/${encodeURIComponent(province.lat)}/${encodeURIComponent(province.lon)}`;


        const response =
            await fetch(
                url,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Qibla HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const direction =
            Number(
                data?.data?.direction
            );


        if (
            Number.isFinite(
                direction
            )
        ) {

            target.textContent =
                `${direction.toFixed(1)}°`;

        } else {

            target.textContent =
                "---";

        }

    } catch (error) {

        console.error(
            "Qibla Error:",
            error
        );


        target.textContent =
            "---";

    }

}


// ==========================================
// ADHAN PLAYER
// ==========================================

function openAdhanPlayer() {

    const province =
        getSelectedProvince();


    const city =
        encodeURIComponent(
            province.city
        );


    const url =
        `https://aladhan.com/play/${city}/Afghanistan`;


    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );

}


// ==========================================
// PRAYER SYSTEM
// ==========================================

function initializePrayerSystem() {

    initializeProvinceSelector();


    const provinceSelect =
        $("#provinceSelect");


    provinceSelect?.addEventListener(
        "change",
        async () => {

            const province =
                getSelectedProvince();


            await Promise.allSettled(
                [
                    loadWeather(province),
                    loadPrayerTimes(province)
                ]
            );

        }
    );


    $("#calculationMethod")
        ?.addEventListener(
            "change",
            () => {

                loadPrayerTimes(
                    getSelectedProvince()
                );

            }
        );


    $("#asrSchool")
        ?.addEventListener(
            "change",
            () => {

                loadPrayerTimes(
                    getSelectedProvince()
                );

            }
        );


    $("#adhanButton")
        ?.addEventListener(
            "click",
            openAdhanPlayer
        );


    const province =
        getSelectedProvince();


    loadWeather(
        province
    );


    loadPrayerTimes(
        province
    );


    if (prayerTimer) {

        clearInterval(
            prayerTimer
        );

    }


    prayerTimer =
        setInterval(
            updatePrayerCountdown,
            1000
        );

}


// ==========================================
// LIVE ONLINE USERS
// ==========================================

function formatLastSeen(
    timestamp
) {

    if (
        !timestamp ||
        typeof timestamp.toDate !== "function"
    ) {

        return "همدا اوس";

    }


    try {

        return timestamp
            .toDate()
            .toLocaleTimeString(
                "en-US",
                {
                    hour:
                        "numeric",

                    minute:
                        "2-digit",

                    hour12:
                        true
                }
            );

    } catch {

        return "همدا اوس";

    }

}


function renderFastOnlineUsers(
    users
) {

    const target =
        $("#fastOnlineUsers");


    if (!target) {

        return;

    }


    if (
        !users.length
    ) {

        target.innerHTML =
            `
            <div class="search-empty">
                ${escapeHtml(
                    t("noUsers")
                )}
            </div>
            `;


        return;

    }


    target.innerHTML =
        users
            .slice(
                0,
                10
            )
            .map(
                user => {

                    const name =
                        escapeHtml(
                            user.displayName ||
                            user.email ||
                            t("unknown")
                        );


                    const email =
                        escapeHtml(
                            user.email ||
                            ""
                        );


                    return `
                    <div class="kr-fast-user">

                        <div class="kr-fast-avatar">
                            🟢
                        </div>

                        <div class="kr-fast-info">

                            <strong>
                                ${name}
                            </strong>

                            <span>
                                ${email}
                            </span>

                        </div>

                        <span class="kr-fast-status">
                            ${escapeHtml(
                                t("online")
                            )}
                        </span>

                    </div>
                    `;

                }
            )
            .join(
                ""
            );

}


function renderOnlineUsers(
    users
) {

    currentOnlineUsers =
        Array.isArray(users)
            ? users
            : [];


    const count =
        currentOnlineUsers.length;


    const onlineCount =
        $("#onlineUsersCount");


    const onlineBadge =
        $("#onlineUsersBadge");


    const heroCount =
        $("#heroOnlineCount");


    const donutOnline =
        $("#donutOnline");


    if (onlineCount) {

        onlineCount.textContent =
            count.toLocaleString(
                "en-US"
            );

    }


    if (onlineBadge) {

        onlineBadge.textContent =
            `${count} ${t("online")}`;

    }


    if (heroCount) {

        heroCount.textContent =
            String(count);

    }


    if (donutOnline) {

        donutOnline.textContent =
            String(count);

    }


    renderFastOnlineUsers(
        currentOnlineUsers
    );


    const onlineList =
        $("#onlineUsersList");


    if (!onlineList) {

        return;

    }


    if (
        currentOnlineUsers.length ===
        0
    ) {

        onlineList.innerHTML =
            `
            <div class="search-empty">
                ${escapeHtml(
                    t("noUsers")
                )}
            </div>
            `;


        return;

    }


    const html =
        currentOnlineUsers
            .map(
                user => {

                    const name =
                        escapeHtml(
                            user.displayName ||
                            user.email ||
                            t("unknown")
                        );


                    const email =
                        escapeHtml(
                            user.email ||
                            ""
                        );


                    const lastSeen =
                        escapeHtml(
                            formatLastSeen(
                                user.lastSeen
                            )
                        );


                    return `
                    <div class="online-user">

                        <div class="online-user-avatar">
                            🟢
                        </div>

                        <div class="online-user-info">

                            <div class="online-user-name">
                                ${name}
                            </div>

                            <div class="online-user-email">
                                ${email}
                            </div>

                        </div>

                        <div class="online-user-status">

                            <div class="badge badge-success">
                                ${escapeHtml(
                                    t("online")
                                )}
                            </div>

                            <div class="online-user-time">
                                ${lastSeen}
                            </div>

                        </div>

                    </div>
                    `;

                }
            )
            .join("");


    onlineList.innerHTML =
        `
        <div class="online-users-list">
            ${html}
        </div>
        `;

}


// ==========================================
// COMMENTS COLLECTION
// ==========================================

const COMMENTS_COLLECTION =
    "dashboard_comments";


// ==========================================
// LIVE COMMENTS
// ==========================================

function startCommentsListener() {

    if (
        commentsUnsubscribe
    ) {

        commentsUnsubscribe();

        commentsUnsubscribe =
            null;

    }


    const list =
        $("#commentsList");


    if (!list) {

        return;

    }


    const commentsRef =
        collection(
            db,
            COMMENTS_COLLECTION
        );


    const commentsQuery =
        query(
            commentsRef,
            orderBy(
                "createdAt",
                "desc"
            ),
            limit(
                40
            )
        );


    commentsUnsubscribe =
        onSnapshot(
            commentsQuery,

            snapshot => {

                if (
                    snapshot.empty
                ) {

                    list.innerHTML =
                        `
                        <div class="search-empty">
                            ${escapeHtml(
                                t("noComments")
                            )}
                        </div>
                        `;

                    return;

                }


                list.innerHTML =
                    "";


                snapshot.forEach(
                    item => {

                        const comment =
                            {
                                id:
                                    item.id,

                                ...item.data()
                            };


                        list.appendChild(
                            createCommentElement(
                                comment
                            )
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Comments Listener Error:",
                    error
                );


                list.innerHTML =
                    `
                    <div class="alert alert-danger">
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                    `;

            }
        );

}


// ==========================================
// COMMENT ELEMENT
// ==========================================

function createCommentElement(
    comment
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "kr-comment";


    const displayName =
        comment.displayName ||
        comment.email ||
        t("unknown");


    const text =
        comment.text ||
        "";


    const likes =
        Array.isArray(
            comment.likes
        )
            ? comment.likes
            : [];


    const hearts =
        Array.isArray(
            comment.hearts
        )
            ? comment.hearts
            : [];


    const uid =
        currentUser?.uid ||
        "";


    const liked =
        likes.includes(
            uid
        );


    const hearted =
        hearts.includes(
            uid
        );


    const createdAt =
        comment.createdAt &&
        typeof comment.createdAt.toDate ===
            "function"
            ? comment.createdAt
                .toDate()
                .toLocaleTimeString(
                    "en-US",
                    {
                        hour:
                            "numeric",

                        minute:
                            "2-digit",

                        hour12:
                            true
                    }
                )
            : "اوس";


    element.innerHTML =
        `
        <div class="kr-comment-avatar">
            <i class="fa-solid fa-user"></i>
        </div>

        <div class="kr-comment-body">

            <div class="kr-comment-top">

                <strong>
                    ${escapeHtml(displayName)}
                </strong>

                <small>
                    ${escapeHtml(createdAt)}
                </small>

            </div>


            <div class="kr-comment-text">
                ${escapeHtml(text)}
            </div>


            <div class="kr-comment-actions">

                <button
                    type="button"
                    class="kr-react like ${
                        liked
                            ? "active"
                            : ""
                    }"
                    data-comment-action="like"
                    data-comment-id="${escapeHtml(comment.id)}"
                >

                    <i class="fa-solid fa-thumbs-up"></i>

                    ${likes.length}

                </button>


                <button
                    type="button"
                    class="kr-react ${
                        hearted
                            ? "active"
                            : ""
                    }"
                    data-comment-action="heart"
                    data-comment-id="${escapeHtml(comment.id)}"
                >

                    ❤️

                    ${hearts.length}

                </button>

            </div>

        </div>
        `;


    return element;

}


// ==========================================
// SEND COMMENT
// ==========================================

async function sendComment(
    text
) {

    if (
        !currentUser
    ) {

        throw new Error(
            "Authentication required."
        );

    }


    const clean =
        String(text)
            .trim()
            .slice(
                0,
                500
            );


    if (!clean) {

        return;

    }


    const displayName =
        currentSession?.profile?.name ||
        currentSession?.profile?.displayName ||
        currentUser.displayName ||
        currentUser.email ||
        t("unknown");


    await addDoc(
        collection(
            db,
            COMMENTS_COLLECTION
        ),
        {

            text:
                clean,

            uid:
                currentUser.uid,

            displayName:
                String(
                    displayName
                ),

            email:
                currentUser.email ||
                "",

            createdAt:
                serverTimestamp(),

            likes:
                [],

            hearts:
                []

        }
    );

}


// ==========================================
// REACTION
// ==========================================

async function toggleReaction(
    commentId,
    type
) {

    if (
        !currentUser
    ) {

        return;

    }


    const commentRef =
        doc(
            db,
            COMMENTS_COLLECTION,
            commentId
        );


    const safeType =
        type === "heart"
            ? "heart"
            : "like";


    const button =
        document.querySelector(
            `[data-comment-action="${CSS.escape(safeType)}"][data-comment-id="${CSS.escape(commentId)}"]`
        );


    const isActive =
        button?.classList.contains(
            "active"
        );


    const field =
        safeType === "heart"
            ? "hearts"
            : "likes";


    if (isActive) {

        await updateDoc(
            commentRef,
            {
                [field]:
                    arrayRemove(
                        currentUser.uid
                    )
            }
        );

    } else {

        await updateDoc(
            commentRef,
            {
                [field]:
                    arrayUnion(
                        currentUser.uid
                    )
            }
        );

    }

}


// ==========================================
// COMMENT EVENTS
// ==========================================

function initializeComments() {

    const form =
        $("#commentForm");


    const input =
        $("#commentInput");


    const button =
        $("#commentSend");


    if (form && input) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const text =
                    input.value.trim();


                if (!text) {

                    return;

                }


                if (button) {

                    button.disabled =
                        true;


                    button.innerHTML =
                        `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        ${escapeHtml(
                            t("sending")
                        )}
                        `;

                }


                try {

                    await sendComment(
                        text
                    );


                    input.value =
                        "";

                } catch (error) {

                    console.error(
                        "Send Comment Error:",
                        error
                    );


                    showDashboardError(
                        error.message ||
                        t("commentError")
                    );

                } finally {

                    if (button) {

                        button.disabled =
                            false;


                        button.innerHTML =
                            `
                            <i class="fa-solid fa-paper-plane"></i>
                            ولیږه
                            `;

                    }

                }

            }
        );

    }


    const list =
        $("#commentsList");


    list?.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-comment-action]"
                );


            if (!button) {

                return;

            }


            const commentId =
                button.dataset.commentId;


            const type =
                button.dataset.commentAction;


            if (
                !commentId ||
                !type
            ) {

                return;

            }


            button.disabled =
                true;


            try {

                await toggleReaction(
                    commentId,
                    type
                );

            } catch (error) {

                console.error(
                    "Reaction Error:",
                    error
                );


                showDashboardError(
                    error.message
                );

            } finally {

                button.disabled =
                    false;

            }

        }
    );


    startCommentsListener();

}


// ==========================================
// DASHBOARD STATS
// ==========================================
//
// اصلي ستونزه:
// getDashboardStats is not defined
//
// دلته ټول اړین functions تعریف شوي:
// - getRecordsCount()
// - getOnlineUsersCount()
// - getDashboardUser()
// - getUserEmail()
// - getDashboardStats()
// - loadDashboardStats()
// ==========================================


// ==========================================
// RECORDS COUNT
// ==========================================

async function getRecordsCount() {

    try {

        const recordsRef =
            collection(
                db,
                "records"
            );


        const snapshot =
            await getCountFromServer(
                recordsRef
            );


        return Number(
            snapshot?.data?.()?.count || 0
        );

    } catch (error) {

        console.error(
            "Records Count Error:",
            error
        );


        return 0;

    }

}


// ==========================================
// ONLINE USERS COUNT
// ==========================================

function getOnlineUsersCount() {

    return Array.isArray(
        currentOnlineUsers
    )
        ? currentOnlineUsers.length
        : 0;

}


// ==========================================
// CURRENT DASHBOARD USER
// ==========================================

function getDashboardUser() {

    return (
        currentUser ||
        auth.currentUser ||
        null
    );

}


// ==========================================
// CURRENT USER EMAIL
// ==========================================

function getUserEmail() {

    const user =
        getDashboardUser();


    return (
        user?.email ||
        currentSession?.user?.email ||
        ""
    );

}


// ==========================================
// COMPLETE DASHBOARD STATS
// ==========================================

async function getDashboardStats() {

    const records =
        await getRecordsCount();


    const onlineUsers =
        getOnlineUsersCount();


    return {

        records,

        onlineUsers,

        email:
            getUserEmail(),

        user:
            getDashboardUser()

    };

}


// ==========================================
// LOAD DASHBOARD STATS INTO UI
// ==========================================

async function loadDashboardStats() {

    try {

        const stats =
            await getDashboardStats();


        const records =
            Number(
                stats.records || 0
            );


        const online =
            Number(
                stats.onlineUsers || 0
            );


        const recordsElement =
            $("#recordsCount");


        const onlineElement =
            $("#onlineUsersCount");


        const emailElement =
            $("#currentUserEmail");


        const heroOnline =
            $("#heroOnlineCount");


        const donutRecords =
            $("#donutRecords");


        const donutOnline =
            $("#donutOnline");


        if (recordsElement) {

            recordsElement.textContent =
                records.toLocaleString(
                    "en-US"
                );

        }


        if (onlineElement) {

            onlineElement.textContent =
                online.toLocaleString(
                    "en-US"
                );

        }


        if (emailElement) {

            emailElement.textContent =
                stats.email ||
                "—";

        }


        if (heroOnline) {

            heroOnline.textContent =
                String(
                    online
                );

        }


        if (donutRecords) {

            donutRecords.textContent =
                records.toLocaleString(
                    "en-US"
                );

        }


        if (donutOnline) {

            donutOnline.textContent =
                String(
                    online
                );

        }


    } catch (error) {

        console.error(
            "Dashboard Stats Error:",
            error
        );


        showDashboardError(
            error?.message ||
            "د Dashboard احصایې ترلاسه نه شوې."
        );

    }

}


// ==========================================
// NAVIGATION
// ==========================================

function initializeNavigation() {

    const refresh =
        $("#refreshBtn");


    refresh?.addEventListener(
        "click",
        () => {

            window.location.reload();

        }
    );


    const home =
        $("#homeBtn");


    home?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./dashboard.html";

        }
    );


    const back =
        $("#backBtn");


    back?.addEventListener(
        "click",
        () => {

            history.back();

        }
    );


    const logout =
        $("#logoutBtn");


    logout?.addEventListener(
        "click",
        async () => {

            logout.disabled =
                true;


            try {

                const result =
                    await logoutUser();


                if (
                    result?.success
                ) {

                    window.location.href =
                        "./index.html";


                    return;

                }


                throw new Error(
                    result?.message ||
                    t("logoutError")
                );

            } catch (error) {

                logout.disabled =
                    false;


                showDashboardError(
                    error.message ||
                    t("logoutError")
                );

            }

        }
    );


    const links = [

        [
            "dashboardMenuBtn",
            "./dashboard.html"
        ],

        [
            "registerMenuBtn",
            "./register.html"
        ],

        [
            "searchMenuBtn",
            "./search.html"
        ],

        [
            "reportsMenuBtn",
            "./reports.html"
        ],

        [
            "adminMenuBtn",
            "./admin.html"
        ],

        [
            "settingsMenuBtn",
            "./settings.html"
        ]

    ];


    links.forEach(
        ([id, url]) => {

            document
                .getElementById(id)
                ?.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            url;

                    }
                );

        }
    );

}


// ==========================================
// ERROR MESSAGE
// ==========================================

function showDashboardError(
    message
) {

    const target =
        $("#dashboardMessage");


    if (!target) {

        console.error(
            message
        );


        return;

    }


    target.hidden =
        false;


    target.className =
        "alert alert-danger";


    target.textContent =
        String(
            message ||
            "خطا رامنځته شو."
        );

}


// ==========================================
// WAIT FOR AUTH
// ==========================================

function waitForAuthUser(
    timeoutMs = 5000
) {

    return new Promise(
        resolve => {

            let finished =
                false;


            let timer =
                null;


            let unsubscribe =
                () => {};


            const started =
                Date.now();


            function finish(user) {

                if (finished) {

                    return;

                }


                finished =
                    true;


                if (timer) {

                    clearInterval(
                        timer
                    );

                }


                try {

                    unsubscribe();

                } catch (error) {

                    console.warn(
                        "Auth unsubscribe:",
                        error
                    );

                }


                resolve(
                    user ||
                    null
                );

            }


            unsubscribe =
                onAuthStateChanged(
                    auth,
                    user => {

                        if (user) {

                            finish(
                                user
                            );

                        }

                    }
                );


            timer =
                setInterval(
                    () => {

                        if (
                            auth.currentUser
                        ) {

                            finish(
                                auth.currentUser
                            );


                            return;

                        }


                        if (
                            Date.now() -
                            started >=
                            timeoutMs
                        ) {

                            finish(
                                null
                            );

                        }

                    },
                    150
                );

        }
    );

}


// ==========================================
// CLEANUP
// ==========================================

function cleanupDashboard() {

    try {

        stopOnlineUsersListener();

    } catch (error) {

        console.warn(
            "Presence cleanup:",
            error
        );

    }


    if (
        commentsUnsubscribe
    ) {

        try {

            commentsUnsubscribe();

        } catch (error) {

            console.warn(
                "Comments cleanup:",
                error
            );

        }


        commentsUnsubscribe =
            null;

    }


    if (clockTimer) {

        clearInterval(
            clockTimer
        );


        clockTimer =
            null;

    }


    if (prayerTimer) {

        clearInterval(
            prayerTimer
        );


        prayerTimer =
            null;

    }


    if (loginDurationTimer) {

        clearInterval(
            loginDurationTimer
        );


        loginDurationTimer =
            null;

    }


    currentPrayerTimings =
        null;

}


// ==========================================
// MAIN BOOT
// ==========================================

async function boot() {

    try {

        // --------------------------------------
        // Settings
        // --------------------------------------

        await initializeSettings();

        applySettingsText();


        // --------------------------------------
        // Authentication
        // --------------------------------------

        currentUser =
            await waitForAuthUser();


        if (!currentUser) {

            window.location.replace(
                "./index.html"
            );


            return {

                success:
                    false,

                authenticated:
                    false

            };

        }


        // --------------------------------------
        // Existing session
        // --------------------------------------

        currentSession =
            await getCurrentSession();


        if (!currentSession) {

            window.location.replace(
                "./index.html"
            );


            return {

                success:
                    false,

                session:
                    false

            };

        }


        // --------------------------------------
        // Refresh settings
        // --------------------------------------

        await initializeSettings();

        applySettingsText();


        // --------------------------------------
        // Welcome user
        // --------------------------------------

        const displayName =
            currentSession?.profile?.name ||
            currentSession?.profile?.displayName ||
            currentUser.displayName ||
            currentUser.email ||
            t("unknown");


        const welcome =
            $("#welcomeText");


        if (welcome) {

            welcome.textContent =
                t(
                    "welcome",
                    {
                        name:
                            displayName
                    }
                );

        }


        // --------------------------------------
        // Clock
        // --------------------------------------

        updateClockAndCalendars();


        if (clockTimer) {

            clearInterval(
                clockTimer
            );

        }


        clockTimer =
            setInterval(
                updateClockAndCalendars,
                1000
            );


        // --------------------------------------
        // Login duration
        // --------------------------------------

        initializeLoginDuration(
            currentUser
        );


        // --------------------------------------
        // Navigation
        // --------------------------------------

        initializeNavigation();


        // --------------------------------------
        // Prayer / Province / Weather
        // --------------------------------------

        initializePrayerSystem();


        // --------------------------------------
        // Social Comments
        // --------------------------------------

        initializeComments();


        // --------------------------------------
        // Existing Presence
        // --------------------------------------

        initializePresence();


        listenOnlineUsers(
            result => {

                if (
                    !result?.success
                ) {

                    console.error(
                        "Presence Error:",
                        result?.message
                    );


                    return;

                }


                renderOnlineUsers(
                    Array.isArray(
                        result.users
                    )
                        ? result.users
                        : []
                );


                // Online count has now changed,
                // refresh Dashboard stats UI.
                loadDashboardStats();

            }
        );


        // --------------------------------------
        // Existing Dashboard Stats
        // --------------------------------------

        await loadDashboardStats();


        // --------------------------------------
        // Final State
        // --------------------------------------

        dashboardInitialized =
            true;


        console.log(
            "KRHE Dashboard initialized successfully."
        );


        return {

            success:
                true,

            initialized:
                true

        };

    } catch (error) {

        console.error(
            "Dashboard Boot Error:",
            error
        );


        showDashboardError(
            error?.message ||
            "Dashboard نشو پرانیستل کېدای."
        );


        dashboardInitialized =
            false;


        throw error;

    }

}


// ==========================================
// PUBLIC INITIALIZER
// ==========================================
//
// دا هماغه function دی چې ستا په آخر
// default export کې missing و.
//
// د auto boot او manual boot دواړو لپاره
// یو Promise کارول کېږي ترڅو Dashboard
// دوه ځله initialize نه شي.
// ==========================================

async function initializeDashboard() {

    if (dashboardInitialized) {

        return {

            success:
                true,

            initialized:
                true,

            message:
                "Dashboard already initialized."

        };

    }


    if (!dashboardBootPromise) {

        dashboardBootPromise =
            boot()
                .catch(
                    error => {

                        dashboardBootPromise =
                            null;

                        throw error;

                    }
                );

    }


    return dashboardBootPromise;

}


// ==========================================
// BROWSER CLEANUP
// ==========================================

window.addEventListener(
    "beforeunload",
    cleanupDashboard
);


// ==========================================
// START DASHBOARD
// ==========================================

initializeDashboard()
    .catch(
        error => {

            console.error(
                "Dashboard Start Error:",
                error
            );

        }
    );


// ==========================================
// BACKWARD COMPATIBILITY / LOCATION API
// ==========================================

export function initializeDashboardLocationTracking() {

    return {

        success: true,

        enabled: false,

        message:
            "Location tracking disabled."

    };

}


export function getDashboardLocationState() {

    return {

        initialized:
            dashboardInitialized,

        active:
            false,

        enabled:
            false

    };

}


export async function requestCurrentLocation() {

    return {

        success:
            false,

        enabled:
            false,

        message:
            "Location tracking disabled."

    };

}


// ==========================================
// DEFAULT EXPORT
// ==========================================

export {

    initializeDashboard,

    getDashboardUser,

    getUserEmail,

    getRecordsCount,

    getOnlineUsersCount,

    getDashboardStats

};


export default {

    initializeDashboard,

    initializeDashboardLocationTracking,

    getDashboardLocationState,

    requestCurrentLocation,

    getDashboardUser,

    getUserEmail,

    getRecordsCount,

    getOnlineUsersCount,

    getDashboardStats

};