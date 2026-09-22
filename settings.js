/* =========================================================
   د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
   settings.js
   مرکزي Settings Engine
   ========================================================= */

import { db } from "./firebase.js";
import { applyGlobalLanguage, getGlobalTranslation } from "./i18n.js";

import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   ثابت معلومات
========================================================= */

export const SYSTEM_NAME =
    "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس";

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOCUMENT = "system";

const SETTINGS_CACHE_KEY =
    "krha_commission_settings_v3";

const OLD_CACHE_KEYS = [
    "hafz_admin_online_system_settings_v1",
    "krha_dashboard_settings_v2",
    "hafz_admin_online_system_language_v1"
];


/* =========================================================
   Default Settings
========================================================= */

export const DEFAULT_SETTINGS = {

    systemName: SYSTEM_NAME,

    language: "ps",

    directionMode: "auto",

    calendar: "solar",

    dateFormat: "medium",

    timeFormat: "24h",

    timeZone: "Asia/Kabul",

    weekStart: "saturday",

    numberSystem: "local",

    theme: "light",

    background: "natural",

    primaryColor: "#0B6B36",

    secondaryColor: "#084D27",

    accentColor: "#19A463",

    infoColor: "#175CD3",

    colorMode: "custom",

    colorPalette: "emerald",

    fontScale: "medium",

    density: "comfortable",

    fontFamily: "naskh",

    radius: "medium",

    shadows: "medium",

    glass: true,

    animations: true,

    reducedMotion: false,

    highContrast: false,

    stickyHeader: true,

    showFooter: true,

    sidebarLabels: true,

    sidebarIcons: true,

    sidebarHover: true,

    headerGlass: true,

    stickyTableHeader: true,

    tableBorders: true,

    tableStripes: true,

    tableHover: true,

    notificationPosition: "top-right",

    cacheEnabled: true,

    realtimeUpdates: true,

    printOrientation: "portrait",

    printMargin: "normal",

    updatedAt: null
};


/* =========================================================
   Languages
========================================================= */

export const LANGUAGES = {

    ps: {
        name: "پښتو",
        direction: "rtl"
    },

    fa: {
        name: "دري",
        direction: "rtl"
    },

    en: {
        name: "English",
        direction: "ltr"
    },

    ur: {
        name: "اردو",
        direction: "rtl"
    },

    ar: {
        name: "العربية",
        direction: "rtl"
    }
};


/* =========================================================
   Calendars
========================================================= */

export const CALENDARS = {

    solar: {
        name: "هجري شمسي"
    },

    lunar: {
        name: "هجري قمري"
    },

    gregorian: {
        name: "میلادي"
    }
};


/* =========================================================
   Themes
========================================================= */

export const THEMES = {

    light: {
        name: "روښانه"
    },

    dark: {
        name: "تیاره"
    },

    auto: {
        name: "د وسیلې حالت"
    }
};


/* =========================================================
   Directions
========================================================= */

export const DIRECTIONS = {

    auto: {
        name: "د ژبې له مخې"
    },

    rtl: {
        name: "له ښي څخه چپ"
    },

    ltr: {
        name: "له چپ څخه ښي"
    }
};


/* =========================================================
   Date Formats
========================================================= */

export const DATE_FORMATS = {

    short: {
        name: "لنډه"
    },

    medium: {
        name: "منځنۍ"
    },

    long: {
        name: "تفصیلي"
    },

    iso: {
        name: "ISO"
    }
};


/* =========================================================
   Time Formats
========================================================= */

export const TIME_FORMATS = {

    "12h": {
        name: "۱۲ ساعته"
    },

    "24h": {
        name: "۲۴ ساعته"
    }
};


/* =========================================================
   Time Zones
========================================================= */

export const TIME_ZONES = {

    "Asia/Kabul": {
        name: "کابل - افغانستان"
    },

    "UTC": {
        name: "UTC"
    },

    "Asia/Karachi": {
        name: "کراچۍ"
    },

    "Asia/Dubai": {
        name: "دوبۍ"
    },

    "Europe/London": {
        name: "لندن"
    }
};


/* =========================================================
   Number Systems
========================================================= */

export const NUMBER_SYSTEMS = {

    local: {
        name: "د ژبې له مخې"
    },

    latin: {
        name: "لاتیني 0-9"
    },

    arabicIndic: {
        name: "عربي ٠-٩"
    },

    easternArabic: {
        name: "ختیځې ۰-۹"
    }
};


/* =========================================================
   Backgrounds
========================================================= */

export const BACKGROUNDS = {

    natural: {
        name: "طبیعي"
    },

    clean: {
        name: "پاک"
    },

    soft: {
        name: "نرم"
    },

    flat: {
        name: "یوشان"
    },

    night: {
        name: "شپه يي"
    }
};


/* =========================================================
   Font Scales
========================================================= */

export const FONT_SCALES = {

    small: {
        name: "کوچنی",
        value: 0.94
    },

    medium: {
        name: "منځنی",
        value: 1
    },

    large: {
        name: "لوی",
        value: 1.08
    },

    extraLarge: {
        name: "ډېر لوی",
        value: 1.15
    }
};


/* =========================================================
   Density
========================================================= */

export const DENSITIES = {

    compact: {
        name: "کم فاصله"
    },

    comfortable: {
        name: "نورمال"
    },

    spacious: {
        name: "زیات فاصله"
    }
};


/* =========================================================
   Fonts
========================================================= */

export const FONT_FAMILIES = {

    naskh: {
        name: "Noto Naskh Arabic",
        value:
            "'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    },

    sans: {
        name: "System Sans",
        value:
            "Tahoma, Arial, sans-serif"
    },

    arabic: {
        name: "Arabic",
        value:
            "'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    },

    pashto: {
        name: "Pashto",
        value:
            "'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    },

    urdu: {
        name: "Urdu",
        value:
            "'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    }
};


/* =========================================================
   Radius
========================================================= */

export const RADIUS_MODES = {

    small: {
        name: "کوچنی",
        value: "8px"
    },

    medium: {
        name: "نورمال",
        value: "14px"
    },

    large: {
        name: "لوی",
        value: "18px"
    },

    extraLarge: {
        name: "ډېر لوی",
        value: "24px"
    }
};


/* =========================================================
   Shadows
========================================================= */

export const SHADOW_MODES = {

    none: {
        name: "بې سیوري"
    },

    soft: {
        name: "نرم"
    },

    medium: {
        name: "منځنی"
    },

    strong: {
        name: "پیاوړی"
    }
};


/* =========================================================
   Color Modes
========================================================= */

export const COLOR_MODES = {

    custom: {
        name: "یوه اصلي رنګ"
    },

    palette: {
        name: "څلور رنګیزه مجموعه"
    }
};


/* =========================================================
   Color Presets
========================================================= */

export const COLOR_PRESETS = {

    emerald: {
        name: "زمردي",
        colors: [
            "#0B6B36",
            "#084D27",
            "#19A463",
            "#175CD3"
        ]
    },

    ocean: {
        name: "سمندري",
        colors: [
            "#006B76",
            "#004F57",
            "#16A6B6",
            "#1769E0"
        ]
    },

    royal: {
        name: "شاهي",
        colors: [
            "#4338CA",
            "#312E81",
            "#7C3AED",
            "#2563EB"
        ]
    },

    darkgreen: {
        name: "ژور شین",
        colors: [
            "#14532D",
            "#052E16",
            "#16A34A",
            "#166534"
        ]
    },

    sunset: {
        name: "لمرلوېدنه",
        colors: [
            "#C2410C",
            "#7C2D12",
            "#EA580C",
            "#B91C1C"
        ]
    },

    slate: {
        name: "خړ شین",
        colors: [
            "#334155",
            "#1E293B",
            "#0F766E",
            "#2563EB"
        ]
    }
};


/* =========================================================
   Notification
========================================================= */

export const NOTIFICATION_POSITIONS = {

    "top-right": {
        name: "پورته ښي"
    },

    "top-left": {
        name: "پورته چپ"
    },

    "bottom-right": {
        name: "لاندې ښي"
    },

    "bottom-left": {
        name: "لاندې چپ"
    },

    "top-center": {
        name: "پورته منځ"
    },

    "bottom-center": {
        name: "لاندې منځ"
    }
};


/* =========================================================
   Print
========================================================= */

export const PRINT_ORIENTATIONS = {

    portrait: {
        name: "عمودي"
    },

    landscape: {
        name: "افقي"
    }
};


export const PRINT_MARGINS = {

    narrow: {
        name: "تنګه"
    },

    normal: {
        name: "نورمال"
    },

    wide: {
        name: "پراخه"
    }
};


/* =========================================================
   Translations
========================================================= */

export const TRANSLATIONS = {

    ps: {

        "menu.dashboard": "کورپاڼه",
        "menu.formic": "فورمیک",
        "menu.newRegister": "نوی ثبت",
        "menu.search": "لټون",
        "menu.reports": "راپورونه",
        "menu.admin": "اډمــینانوبرخه",
        "menu.settings": "تنظیمات",

        "settings.title": "⚙️ د سیستم تنظیمات",
        "settings.description":
            "د سیستم ټول عمومي تنظیمات له یوې مرکزي برخې څخه اداره کړئ.",

        "save": "💾 تنظیمات خوندي کول",
        "reset": "🔄 اصلي تنظیمات",
        "back": "↩️ شاته",

        "language": "ژبه",
        "calendar": "تقویم",
        "direction": "د لیک لوری",
        "dateFormat": "د نېټې بڼه",
        "timeFormat": "د وخت بڼه",
        "timeZone": "وخت سیمه",
        "fontScale": "د لیک اندازه",
        "density": "د فاصلې حالت",
        "fontFamily": "فونټ",
        "theme": "د سیستم بڼه",
        "background": "د شالید بڼه",

        "share": "📤 د تنظیماتو شریکول",
        "copyLink": "🔗 د شریکولو لینک",

        "saved": "تنظیمات په بریالیتوب خوندي شول.",
        "resetDone": "اصلي تنظیمات بېرته فعال شول.",
        "loadingSettings": "تنظیمات لوډ کېږي...",
        "linkCopied": "لینک کاپي شو.",
        "notificationTest":
            "دا د Settings خبرتیا ازموینه ده."
    },

    fa: {
        "menu.dashboard": "داشبورد",
        "menu.formic": "فرمیک",
        "menu.newRegister": "ثبت جدید",
        "menu.search": "جستجو",
        "menu.reports": "گزارش‌ها",
        "menu.admin": "بخش ادمین",
        "menu.settings": "تنظیمات",
        "settings.title": "⚙️ تنظیمات سیستم",
        "settings.description":
            "تمام تنظیمات عمومی سیستم را از یک بخش مرکزی مدیریت کنید.",
        "save": "💾 ذخیره تنظیمات",
        "reset": "🔄 تنظیمات اصلی",
        "back": "↩️ بازگشت",
        "language": "زبان",
        "calendar": "تقویم",
        "direction": "جهت متن",
        "dateFormat": "فرمت تاریخ",
        "timeFormat": "فرمت زمان",
        "timeZone": "منطقه زمانی",
        "fontScale": "اندازه متن",
        "density": "فاصله",
        "fontFamily": "فونت",
        "theme": "ظاهر سیستم",
        "background": "پس‌زمینه",
        "share": "📤 اشتراک تنظیمات",
        "copyLink": "🔗 لینک اشتراک",
        "saved": "تنظیمات با موفقیت ذخیره شد.",
        "resetDone": "تنظیمات اصلی فعال شد.",
        "loadingSettings": "در حال بارگذاری تنظیمات...",
        "linkCopied": "لینک کاپی شد.",
        "notificationTest":
            "این آزمایش اعلان تنظیمات است."
    },

    en: {
        "menu.dashboard": "Dashboard",
        "menu.formic": "Formic",
        "menu.newRegister": "New Registration",
        "menu.search": "Search",
        "menu.reports": "Reports",
        "menu.admin": "Administration",
        "menu.settings": "Settings",
        "settings.title": "⚙️ System Settings",
        "settings.description":
            "Manage the system-wide settings from one central page.",
        "save": "💾 Save Settings",
        "reset": "🔄 Default Settings",
        "back": "↩️ Back",
        "language": "Language",
        "calendar": "Calendar",
        "direction": "Text Direction",
        "dateFormat": "Date Format",
        "timeFormat": "Time Format",
        "timeZone": "Time Zone",
        "fontScale": "Font Size",
        "density": "Spacing",
        "fontFamily": "Font",
        "theme": "System Theme",
        "background": "Background",
        "share": "📤 Share Settings",
        "copyLink": "🔗 Share Link",
        "saved": "Settings saved successfully.",
        "resetDone": "Default settings restored.",
        "loadingSettings": "Loading settings...",
        "linkCopied": "Link copied.",
        "notificationTest":
            "This is a Settings notification test."
    },

    ur: {
        "menu.dashboard": "ڈیش بورڈ",
        "menu.formic": "فارمک",
        "menu.newRegister": "نیا اندراج",
        "menu.search": "تلاش",
        "menu.reports": "رپورٹس",
        "menu.admin": "انتظامیہ",
        "menu.settings": "ترتیبات",
        "settings.title": "⚙️ سسٹم کی ترتیبات",
        "settings.description":
            "سسٹم کی عمومی ترتیبات ایک مرکزی جگہ سے منظم کریں۔",
        "save": "💾 ترتیبات محفوظ کریں",
        "reset": "🔄 اصل ترتیبات",
        "back": "↩️ واپس",
        "language": "زبان",
        "calendar": "تقویم",
        "direction": "متن کی سمت",
        "dateFormat": "تاریخ کی شکل",
        "timeFormat": "وقت کی شکل",
        "timeZone": "ٹائم زون",
        "fontScale": "فونٹ سائز",
        "density": "فاصلہ",
        "fontFamily": "فونٹ",
        "theme": "سسٹم انداز",
        "background": "پس منظر",
        "share": "📤 ترتیبات شیئر کریں",
        "copyLink": "🔗 شیئر لنک",
        "saved": "ترتیبات کامیابی سے محفوظ ہوگئیں۔",
        "resetDone": "اصل ترتیبات بحال ہوگئیں۔",
        "loadingSettings": "ترتیبات لوڈ ہورہی ہیں...",
        "linkCopied": "لنک کاپی ہوگیا۔",
        "notificationTest":
            "یہ ترتیبات نوٹیفکیشن ٹیسٹ ہے۔"
    },

    ar: {
        "menu.dashboard": "لوحة التحكم",
        "menu.formic": "فورميك",
        "menu.newRegister": "تسجيل جديد",
        "menu.search": "بحث",
        "menu.reports": "التقارير",
        "menu.admin": "الإدارة",
        "menu.settings": "الإعدادات",
        "settings.title": "⚙️ إعدادات النظام",
        "settings.description":
            "إدارة إعدادات النظام العامة من صفحة مركزية واحدة.",
        "save": "💾 حفظ الإعدادات",
        "reset": "🔄 الإعدادات الأصلية",
        "back": "↩️ رجوع",
        "language": "اللغة",
        "calendar": "التقويم",
        "direction": "اتجاه النص",
        "dateFormat": "تنسيق التاريخ",
        "timeFormat": "تنسيق الوقت",
        "timeZone": "المنطقة الزمنية",
        "fontScale": "حجم الخط",
        "density": "التباعد",
        "fontFamily": "الخط",
        "theme": "مظهر النظام",
        "background": "الخلفية",
        "share": "📤 مشاركة الإعدادات",
        "copyLink": "🔗 رابط المشاركة",
        "saved": "تم حفظ الإعدادات بنجاح.",
        "resetDone": "تمت استعادة الإعدادات الأصلية.",
        "loadingSettings": "جارٍ تحميل الإعدادات...",
        "linkCopied": "تم نسخ الرابط.",
        "notificationTest":
            "هذا اختبار لإشعار الإعدادات."
    }
};


/* =========================================================
   State
========================================================= */

let currentSettings = {
    ...DEFAULT_SETTINGS
};

let settingsUnsubscribe = null;

let broadcastChannel = null;

let initialized = false;


/* =========================================================
   Helpers
========================================================= */

function hasLocalStorage() {

    try {

        return (
            typeof window !== "undefined" &&
            !!window.localStorage
        );

    } catch {

        return false;
    }
}


function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


function isValidHexColor(value) {

    return /^#[0-9A-Fa-f]{6}$/.test(
        String(value || "").trim()
    );
}


function bool(value, fallback) {

    return typeof value === "boolean"
        ? value
        : fallback;
}


function valid(map, value, fallback) {

    return map[value]
        ? value
        : fallback;
}


function cleanSettings(input = {}) {

    const source =
        isObject(input)
            ? input
            : {};

    let merged = {
        ...DEFAULT_SETTINGS,
        ...source
    };


    merged.systemName =
        String(
            merged.systemName ||
            SYSTEM_NAME
        ).trim();

    if (!merged.systemName) {
        merged.systemName =
            SYSTEM_NAME;
    }


    merged.language =
        valid(
            LANGUAGES,
            merged.language,
            DEFAULT_SETTINGS.language
        );


    merged.directionMode =
        valid(
            DIRECTIONS,
            merged.directionMode,
            DEFAULT_SETTINGS.directionMode
        );


    merged.calendar =
        valid(
            CALENDARS,
            merged.calendar,
            DEFAULT_SETTINGS.calendar
        );


    merged.dateFormat =
        valid(
            DATE_FORMATS,
            merged.dateFormat,
            DEFAULT_SETTINGS.dateFormat
        );


    merged.timeFormat =
        valid(
            TIME_FORMATS,
            merged.timeFormat,
            DEFAULT_SETTINGS.timeFormat
        );


    merged.timeZone =
        valid(
            TIME_ZONES,
            merged.timeZone,
            DEFAULT_SETTINGS.timeZone
        );


    merged.weekStart =
        ["saturday", "sunday", "monday"].includes(
            merged.weekStart
        )
            ? merged.weekStart
            : DEFAULT_SETTINGS.weekStart;


    merged.numberSystem =
        valid(
            NUMBER_SYSTEMS,
            merged.numberSystem,
            DEFAULT_SETTINGS.numberSystem
        );


    merged.theme =
        valid(
            THEMES,
            merged.theme,
            DEFAULT_SETTINGS.theme
        );


    merged.background =
        valid(
            BACKGROUNDS,
            merged.background,
            DEFAULT_SETTINGS.background
        );


    merged.fontScale =
        valid(
            FONT_SCALES,
            merged.fontScale,
            DEFAULT_SETTINGS.fontScale
        );


    merged.density =
        valid(
            DENSITIES,
            merged.density,
            DEFAULT_SETTINGS.density
        );


    merged.fontFamily =
        valid(
            FONT_FAMILIES,
            merged.fontFamily,
            DEFAULT_SETTINGS.fontFamily
        );


    merged.colorMode =
        valid(
            COLOR_MODES,
            merged.colorMode,
            DEFAULT_SETTINGS.colorMode
        );


    merged.colorPalette =
        valid(
            COLOR_PRESETS,
            merged.colorPalette,
            DEFAULT_SETTINGS.colorPalette
        );


    const colors = [
        "primaryColor",
        "secondaryColor",
        "accentColor",
        "infoColor"
    ];


    for (const key of colors) {

        merged[key] =
            isValidHexColor(
                merged[key]
            )
                ? merged[key]
                : DEFAULT_SETTINGS[key];
    }


    merged.radius =
        valid(
            RADIUS_MODES,
            merged.radius,
            DEFAULT_SETTINGS.radius
        );


    merged.shadows =
        valid(
            SHADOW_MODES,
            merged.shadows,
            DEFAULT_SETTINGS.shadows
        );


    merged.notificationPosition =
        valid(
            NOTIFICATION_POSITIONS,
            merged.notificationPosition,
            DEFAULT_SETTINGS.notificationPosition
        );


    merged.printOrientation =
        valid(
            PRINT_ORIENTATIONS,
            merged.printOrientation,
            DEFAULT_SETTINGS.printOrientation
        );


    merged.printMargin =
        valid(
            PRINT_MARGINS,
            merged.printMargin,
            DEFAULT_SETTINGS.printMargin
        );


    merged.glass =
        bool(
            merged.glass,
            DEFAULT_SETTINGS.glass
        );

    merged.animations =
        bool(
            merged.animations,
            DEFAULT_SETTINGS.animations
        );

    merged.reducedMotion =
        bool(
            merged.reducedMotion,
            DEFAULT_SETTINGS.reducedMotion
        );

    merged.highContrast =
        bool(
            merged.highContrast,
            DEFAULT_SETTINGS.highContrast
        );

    merged.stickyHeader =
        bool(
            merged.stickyHeader,
            DEFAULT_SETTINGS.stickyHeader
        );

    merged.showFooter =
        bool(
            merged.showFooter,
            DEFAULT_SETTINGS.showFooter
        );

    merged.sidebarLabels =
        bool(
            merged.sidebarLabels,
            DEFAULT_SETTINGS.sidebarLabels
        );

    merged.sidebarIcons =
        bool(
            merged.sidebarIcons,
            DEFAULT_SETTINGS.sidebarIcons
        );

    merged.sidebarHover =
        bool(
            merged.sidebarHover,
            DEFAULT_SETTINGS.sidebarHover
        );

    merged.headerGlass =
        bool(
            merged.headerGlass,
            DEFAULT_SETTINGS.headerGlass
        );

    merged.stickyTableHeader =
        bool(
            merged.stickyTableHeader,
            DEFAULT_SETTINGS.stickyTableHeader
        );

    merged.tableBorders =
        bool(
            merged.tableBorders,
            DEFAULT_SETTINGS.tableBorders
        );

    merged.tableStripes =
        bool(
            merged.tableStripes,
            DEFAULT_SETTINGS.tableStripes
        );

    merged.tableHover =
        bool(
            merged.tableHover,
            DEFAULT_SETTINGS.tableHover
        );

    merged.cacheEnabled =
        bool(
            merged.cacheEnabled,
            DEFAULT_SETTINGS.cacheEnabled
        );

    merged.realtimeUpdates =
        bool(
            merged.realtimeUpdates,
            DEFAULT_SETTINGS.realtimeUpdates
        );


    if (
        !merged.sidebarLabels &&
        !merged.sidebarIcons
    ) {
        merged.sidebarLabels = true;
    }


    if (
        merged.colorMode === "palette"
    ) {

        const palette =
            COLOR_PRESETS[
                merged.colorPalette
            ];

        if (palette) {

            merged.primaryColor =
                palette.colors[0];

            merged.secondaryColor =
                palette.colors[1];

            merged.accentColor =
                palette.colors[2];

            merged.infoColor =
                palette.colors[3];
        }
    }


    return merged;
}


function getSettingsRef() {

    return doc(
        db,
        SETTINGS_COLLECTION,
        SETTINGS_DOCUMENT
    );
}


/* =========================================================
   Cache
========================================================= */

function readCache() {

    if (!hasLocalStorage()) {
        return null;
    }

    try {

        const raw =
            localStorage.getItem(
                SETTINGS_CACHE_KEY
            );

        if (raw) {

            return cleanSettings(
                JSON.parse(raw)
            );
        }


        for (
            const key of OLD_CACHE_KEYS
        ) {

            const old =
                localStorage.getItem(key);

            if (old) {

                const migrated =
                    cleanSettings(
                        JSON.parse(old)
                    );

                writeCache(migrated);

                return migrated;
            }
        }

    } catch (error) {

        console.warn(
            "Settings Cache Read Error:",
            error
        );
    }

    return null;
}


function writeCache(settings) {

    if (
        !hasLocalStorage() ||
        !settings.cacheEnabled
    ) {
        return;
    }

    try {

        localStorage.setItem(
            SETTINGS_CACHE_KEY,
            JSON.stringify(
                cleanSettings(settings)
            )
        );

    } catch (error) {

        console.warn(
            "Settings Cache Write Error:",
            error
        );
    }
}


/* =========================================================
   CSS / UI Apply
========================================================= */

function resolveTheme(theme) {

    if (theme !== "auto") {
        return theme;
    }

    try {

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light";

    } catch {

        return "light";
    }
}


function getDirection(settings) {

    if (
        settings.directionMode === "rtl"
    ) {
        return "rtl";
    }

    if (
        settings.directionMode === "ltr"
    ) {
        return "ltr";
    }

    return (
        LANGUAGES[
            settings.language
        ]?.direction ||
        "rtl"
    );
}


function getFontValue(settings) {

    return (
        FONT_FAMILIES[
            settings.fontFamily
        ]?.value ||
        FONT_FAMILIES.naskh.value
    );
}


function setRootAttributes(settings) {

    const root =
        document.documentElement;

    const body =
        document.body;


    const theme =
        resolveTheme(
            settings.theme
        );


    root.lang =
        settings.language;

    root.dir =
        getDirection(settings);


    root.dataset.theme =
        theme;

    root.dataset.settingsTheme =
        settings.theme;

    root.dataset.language =
        settings.language;

    root.dataset.direction =
        getDirection(settings);

    root.dataset.fontScale =
        settings.fontScale;

    root.dataset.density =
        settings.density;

    root.dataset.fontFamily =
        settings.fontFamily;

    root.dataset.background =
        settings.background;

    root.dataset.highContrast =
        String(
            settings.highContrast
        );

    root.dataset.reducedMotion =
        String(
            settings.reducedMotion
        );

    root.dataset.animations =
        String(
            settings.animations
        );

    root.dataset.glass =
        String(
            settings.glass
        );

    root.dataset.sidebarLabels =
        String(
            settings.sidebarLabels
        );

    root.dataset.sidebarIcons =
        String(
            settings.sidebarIcons
        );

    root.dataset.sidebarHover =
        String(
            settings.sidebarHover
        );

    root.dataset.stickyHeader =
        String(
            settings.stickyHeader
        );

    root.dataset.showFooter =
        String(
            settings.showFooter
        );

    root.dataset.stickyTableHeader =
        String(
            settings.stickyTableHeader
        );

    root.dataset.tableBorders =
        String(
            settings.tableBorders
        );

    root.dataset.tableStripes =
        String(
            settings.tableStripes
        );

    root.dataset.tableHover =
        String(
            settings.tableHover
        );

    root.dataset.notificationPosition =
        settings.notificationPosition;

    root.dataset.printOrientation =
        settings.printOrientation;

    root.dataset.printMargin =
        settings.printMargin;


    if (body) {

        body.dataset.theme =
            theme;

        body.dataset.language =
            settings.language;

        body.dataset.direction =
            getDirection(settings);

        body.dataset.fontScale =
            settings.fontScale;

        body.dataset.density =
            settings.density;

        body.dataset.fontFamily =
            settings.fontFamily;
    }
}


function setCssVariables(settings) {

    const root =
        document.documentElement;


    const fontScale =
        FONT_SCALES[
            settings.fontScale
        ]?.value || 1;


    const radius =
        RADIUS_MODES[
            settings.radius
        ]?.value ||
        "14px";


    let shadowSm =
        "0 2px 8px rgba(0,0,0,.06)";

    let shadowMd =
        "0 10px 28px rgba(0,0,0,.10)";

    let shadowLg =
        "0 18px 42px rgba(0,0,0,.14)";


    if (
        settings.shadows === "none"
    ) {

        shadowSm =
            "none";

        shadowMd =
            "none";

        shadowLg =
            "none";
    }


    if (
        settings.shadows === "soft"
    ) {

        shadowSm =
            "0 2px 8px rgba(0,0,0,.05)";

        shadowMd =
            "0 8px 20px rgba(0,0,0,.08)";

        shadowLg =
            "0 14px 32px rgba(0,0,0,.10)";
    }


    if (
        settings.shadows === "strong"
    ) {

        shadowSm =
            "0 3px 12px rgba(0,0,0,.10)";

        shadowMd =
            "0 14px 34px rgba(0,0,0,.18)";

        shadowLg =
            "0 22px 52px rgba(0,0,0,.24)";
    }


    root.style.setProperty(
        "--primary-color",
        settings.primaryColor
    );

    root.style.setProperty(
        "--primary-dark",
        settings.secondaryColor
    );

    root.style.setProperty(
        "--accent-color",
        settings.accentColor
    );

    root.style.setProperty(
        "--info-color",
        settings.infoColor
    );

    root.style.setProperty(
        "--font-scale",
        String(fontScale)
    );

    root.style.setProperty(
        "--app-font-family",
        getFontValue(settings)
    );

    root.style.setProperty(
        "--radius-sm",
        `calc(${radius} * .72)`
    );

    root.style.setProperty(
        "--radius-md",
        radius
    );

    root.style.setProperty(
        "--radius-lg",
        `calc(${radius} * 1.28)`
    );

    root.style.setProperty(
        "--shadow-sm",
        shadowSm
    );

    root.style.setProperty(
        "--shadow-md",
        shadowMd
    );

    root.style.setProperty(
        "--shadow-lg",
        shadowLg
    );


    if (
        document.body
    ) {

        document.body.style.fontFamily =
            getFontValue(settings);
    }


    applyBackground(
        settings
    );


    applyPrintSettings(
        settings
    );
}


function applyBackground(settings) {

    const root =
        document.documentElement;


    let background =
        "linear-gradient(180deg,#FBFCFB 0%,var(--bg-color) 100%)";


    if (
        settings.background === "clean"
    ) {

        background =
            "var(--bg-color)";
    }


    if (
        settings.background === "soft"
    ) {

        background =
            "radial-gradient(circle at top right,rgba(11,107,54,.10),transparent 32%),linear-gradient(180deg,#FBFCFB 0%,var(--bg-color) 100%)";
    }


    if (
        settings.background === "flat"
    ) {

        background =
            "var(--bg-color)";
    }


    if (
        settings.background === "night"
    ) {

        background =
            "radial-gradient(circle at top right,rgba(31,127,73,.18),transparent 32%),linear-gradient(180deg,#09100E 0%,#0C1110 100%)";
    }


    root.style.setProperty(
        "--app-background",
        background
    );
}


function applyPrintSettings(settings) {

    document.documentElement.style.setProperty(
        "--print-orientation",
        settings.printOrientation
    );


    const marginMap = {

        narrow: "8mm",

        normal: "12mm",

        wide: "20mm"
    };


    document.documentElement.style.setProperty(
        "--print-margin",
        marginMap[
            settings.printMargin
        ] || "12mm"
    );
}


/* =========================================================
   System Name
========================================================= */

function applySystemName(settings) {

    document
        .querySelectorAll(
            "[data-system-name]"
        )
        .forEach((element) => {

            element.textContent =
                settings.systemName;
        });


    document.title =
        settings.systemName;
}


/* =========================================================
   Translation
========================================================= */

export function getTranslation(
    key,
    language = currentSettings.language
) {

    const globalValue =
        getGlobalTranslation(
            key,
            language
        );

    if (globalValue !== null) {
        return globalValue;
    }

    const pack =
        TRANSLATIONS[
            language
        ] ||
        TRANSLATIONS.ps;

    return (
        pack[key] ??
        TRANSLATIONS.ps[key] ??
        key
    );
}


export function applyTranslations(
    settings = currentSettings
) {



    const language =
        settings.language in TRANSLATIONS
            ? settings.language
            : "ps";

    applyGlobalLanguage(language);


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach((element) => {

            const key =
                element.dataset.i18n;

            const value =
                getTranslation(
                    key,
                    language
                );


            if (
                element.matches(
                    "input,textarea"
                )
            ) {

                element.placeholder =
                    value;

            } else {

                element.textContent =
                    value;
            }
        });


    document
        .querySelectorAll(
            "[data-i18n-title]"
        )
        .forEach((element) => {

            element.title =
                getTranslation(
                    element.dataset.i18nTitle,
                    language
                );
        });


    document
        .querySelectorAll(
            "[data-i18n-aria-label]"
        )
        .forEach((element) => {

            element.setAttribute(
                "aria-label",
                getTranslation(
                    element.dataset.i18nAriaLabel,
                    language
                )
            );
        });
}


/* =========================================================
   Main Apply
========================================================= */

export function applySettings(
    settings = currentSettings,
    options = {}
) {

    const safe =
        cleanSettings(
            settings
        );


    currentSettings =
        safe;


    setRootAttributes(
        safe
    );


    setCssVariables(
        safe
    );


    applySystemName(
        safe
    );


    applyTranslations(
        safe
    );


    window.dispatchEvent(
        new CustomEvent(
            "krha-settings-applied",
            {
                detail: {
                    settings: {
                        ...safe
                    },

                    options
                }
            }
        )
    );


    return safe;
}


/* =========================================================
   Firestore Load
========================================================= */

export async function loadSettings() {

    const cached =
        readCache();


    if (cached) {

        currentSettings =
            cleanSettings(
                cached
            );

        applySettings(
            currentSettings,
            {
                source: "cache"
            }
        );
    } else {

        currentSettings =
            cleanSettings(
                DEFAULT_SETTINGS
            );

        applySettings(
            currentSettings,
            {
                source: "default"
            }
        );
    }


    try {

        const snapshot =
            await getDoc(
                getSettingsRef()
            );


        if (
            snapshot.exists()
        ) {

            currentSettings =
                cleanSettings(
                    snapshot.data()
                );

            applySettings(
                currentSettings,
                {
                    source: "firestore"
                }
            );


            writeCache(
                currentSettings
            );
        }


    } catch (error) {

        console.warn(
            "Load Firestore Settings Error:",
            error
        );
    }


    return {
        ...currentSettings
    };
}


/* =========================================================
   Realtime
========================================================= */

function stopRealtimeListener() {

    if (
        typeof settingsUnsubscribe ===
        "function"
    ) {

        settingsUnsubscribe();
    }

    settingsUnsubscribe = null;
}


function startRealtimeListener() {

    stopRealtimeListener();


    if (
        !currentSettings.realtimeUpdates
    ) {
        return;
    }


    try {

        settingsUnsubscribe =
            onSnapshot(
                getSettingsRef(),
                (snapshot) => {

                    if (
                        !snapshot.exists()
                    ) {
                        return;
                    }


                    const incoming =
                        cleanSettings(
                            snapshot.data()
                        );


                    currentSettings =
                        incoming;


                    writeCache(
                        incoming
                    );


                    applySettings(
                        incoming,
                        {
                            source:
                                "realtime"
                        }
                    );


                    broadcast(
                        incoming
                    );
                },

                (error) => {

                    console.warn(
                        "Realtime Settings Error:",
                        error
                    );
                }
            );

    } catch (error) {

        console.warn(
            "Realtime Settings Setup Error:",
            error
        );
    }
}


/* =========================================================
   BroadcastChannel
========================================================= */

function startBroadcastChannel() {

    if (
        typeof BroadcastChannel ===
        "undefined"
    ) {
        return;
    }


    if (
        broadcastChannel
    ) {
        return;
    }


    try {

        broadcastChannel =
            new BroadcastChannel(
                "krha-commission-settings"
            );


        broadcastChannel.onmessage =
            (event) => {

                const incoming =
                    event.data?.settings;


                if (!incoming) {
                    return;
                }


                currentSettings =
                    cleanSettings(
                        incoming
                    );


                applySettings(
                    currentSettings,
                    {
                        source:
                            "broadcast"
                    }
                );
            };

    } catch (error) {

        console.warn(
            "BroadcastChannel Error:",
            error
        );
    }
}


function broadcast(settings) {

    if (
        !broadcastChannel
    ) {
        return;
    }


    try {

        broadcastChannel.postMessage({
            settings:
                cleanSettings(
                    settings
                )
        });

    } catch (error) {

        console.warn(
            "Settings Broadcast Error:",
            error
        );
    }
}


/* =========================================================
   Save
========================================================= */

export async function saveSettings(
    settings = {}
) {

    try {

        const next =
            cleanSettings({
                ...currentSettings,
                ...settings
            });


        currentSettings =
            next;


        applySettings(
            currentSettings,
            {
                source:
                    "save"
            }
        );


        writeCache(
            currentSettings
        );


        await setDoc(
            getSettingsRef(),
            {
                ...currentSettings,
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        startRealtimeListener();
        startBroadcastChannel();
        broadcast(
            currentSettings
        );


        return {

            success: true,

            settings: {
                ...currentSettings
            },

            message:
                "تنظیمات په بریالیتوب خوندي شول."
        };

    } catch (error) {

        console.error(
            "Save Settings Error:",
            error
        );


        return {

            success: false,

            settings: {
                ...currentSettings
            },

            message:
                error?.message ||
                "تنظیمات خوندي نه شول."
        };
    }
}


/* =========================================================
   Reset
========================================================= */

export async function resetSettings() {

    return saveSettings(
        DEFAULT_SETTINGS
    );
}


/* =========================================================
   Getters
========================================================= */

export function getSettings() {

    return {
        ...currentSettings
    };
}


export function getSetting(
    key
) {

    return currentSettings[
        key
    ];
}


/* =========================================================
   Individual Setters
========================================================= */

export function setLanguage(
    value
) {

    return saveSettings({
        language: value
    });
}


export function setCalendar(
    value
) {

    return saveSettings({
        calendar: value
    });
}


export function setTheme(
    value
) {

    return saveSettings({
        theme: value
    });
}


export function setPrimaryColor(
    value
) {

    return saveSettings({
        primaryColor:
            value
    });
}


export function setFontScale(
    value
) {

    return saveSettings({
        fontScale:
            value
    });
}


export function setDensity(
    value
) {

    return saveSettings({
        density:
            value
    });
}


export function setFontFamily(
    value
) {

    return saveSettings({
        fontFamily:
            value
    });
}


/* =========================================================
   Subscribe API
========================================================= */

export function subscribeSettings(
    callback
) {

    if (
        typeof callback !== "function"
    ) {

        return () => {};
    }


    const handler =
        (event) => {

            callback(
                {
                    ...event.detail.settings
                },

                event.detail.options || {}
            );
        };


    window.addEventListener(
        "krha-settings-applied",
        handler
    );


    callback(
        {
            ...currentSettings
        },

        {
            source:
                "initial"
        }
    );


    return () => {

        window.removeEventListener(
            "krha-settings-applied",
            handler
        );
    };
}


/* =========================================================
   Clear Cache
========================================================= */

export function clearSettingsCache() {

    if (
        !hasLocalStorage()
    ) {
        return false;
    }


    try {

        localStorage.removeItem(
            SETTINGS_CACHE_KEY
        );


        for (
            const key of OLD_CACHE_KEYS
        ) {

            localStorage.removeItem(
                key
            );
        }


        return true;

    } catch (error) {

        console.warn(
            "Clear Settings Cache Error:",
            error
        );

        return false;

    }
}


/* =========================================================
   Backup
========================================================= */

export function createSettingsBackup() {

    return {

        application:
            "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",

        version:
            3,

        exportedAt:
            new Date().toISOString(),

        settings:
            {
                ...currentSettings
            }
    };
}


export function importSettingsBackup(
    backup
) {

    if (
        !isObject(backup)
    ) {
        return null;
    }


    const source =
        isObject(
            backup.settings
        )
            ? backup.settings
            : backup;


    return cleanSettings(
        source
    );
}


/* =========================================================
   Share URL
========================================================= */

export function getShareUrl(
    settings = currentSettings
) {

    const safe =
        cleanSettings(
            settings
        );


    const encoded =
        btoa(
            unescape(
                encodeURIComponent(
                    JSON.stringify(
                        safe
                    )
                )
            )
        );


    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(
        "settings",
        encoded
    );


    return url.toString();
}


export function readSettingsFromUrl() {

    try {

        const url =
            new URL(
                window.location.href
            );


        const value =
            url.searchParams.get(
                "settings"
            );


        if (!value) {
            return null;
        }


        const decoded =
            decodeURIComponent(
                escape(
                    atob(value)
                )
            );


        return cleanSettings(
            JSON.parse(
                decoded
            )
        );

    } catch (error) {

        console.warn(
            "Read Settings URL Error:",
            error
        );

        return null;
    }
}


/* =========================================================
   Notification API
========================================================= */

export function notify(
    message,
    type = "info"
) {

    const containerId =
        "krhaSettingsToastContainer";

    let container =
        document.getElementById(
            containerId
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            containerId;

        container.className =
            "settings-toast-container";

        document.body.appendChild(
            container
        );
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "settings-toast settings-toast-" +
        type;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "is-hide"
            );

            setTimeout(
                () => toast.remove(),
                280
            );

        },
        3500
    );
}


/* =========================================================
   Initialize
========================================================= */

export async function initializeSettings() {

    const cached =
        readCache();


    if (cached) {

        currentSettings =
            cleanSettings(
                cached
            );

        applySettings(
            currentSettings,
            {
                source:
                    "cache"
            }
        );
    } else {

        applySettings(
            DEFAULT_SETTINGS,
            {
                source:
                    "default"
            }
        );
    }


    const settings =
        await loadSettings();


    applySettings(
        settings,
        {
            source:
                "initialize"
        }
    );


    startBroadcastChannel();
    startRealtimeListener();


    initialized = true;


    return {
        ...currentSettings
    };
}


/* =========================================================
   Auto Cache Apply
========================================================= */

if (
    typeof document !==
    "undefined"
) {

    const cached =
        readCache();


    if (cached) {

        currentSettings =
            cleanSettings(
                cached
            );
    }


    applySettings(
        currentSettings,
        {
            source:
                "startup-cache"
        }
    );


    if (
        typeof window !==
        "undefined"
    ) {

        try {

            window
                .addEventListener(
                    "storage",
                    (event) => {

                        if (
                            event.key !==
                            SETTINGS_CACHE_KEY ||
                            !event.newValue
                        ) {
                            return;
                        }


                        try {

                            const incoming =
                                cleanSettings(
                                    JSON.parse(
                                        event.newValue
                                    )
                                );


                            currentSettings =
                                incoming;


                            applySettings(
                                incoming,
                                {
                                    source:
                                        "storage"
                                }
                            );

                        } catch (error) {

                            console.warn(
                                "Storage Settings Parse Error:",
                                error
                            );
                        }
                    }
                );

        } catch (error) {

            console.warn(
                "Storage Listener Setup Error:",
                error
            );
        }
    }
}


/* =========================================================
   Public Global API
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.KrhaCommissionSettings = {

        getSettings,

        getSetting,

        saveSettings,

        resetSettings,

        applySettings,

        initializeSettings,

        subscribeSettings,

        translate:
            getTranslation,

        setLanguage,

        setCalendar,

        setTheme,

        setPrimaryColor,

        setFontScale,

        setDensity,

        setFontFamily,

        createSettingsBackup,

        importSettingsBackup,

        getShareUrl,

        readSettingsFromUrl,

        clearSettingsCache,

        notify
    };
}


/* =========================================================
   Default Export
========================================================= */

export default {

    SYSTEM_NAME,

    DEFAULT_SETTINGS,

    LANGUAGES,

    CALENDARS,

    THEMES,

    DIRECTIONS,

    DATE_FORMATS,

    TIME_FORMATS,

    TIME_ZONES,

    NUMBER_SYSTEMS,

    BACKGROUNDS,

    FONT_SCALES,

    DENSITIES,

    FONT_FAMILIES,

    RADIUS_MODES,

    SHADOW_MODES,

    COLOR_MODES,

    COLOR_PRESETS,

    NOTIFICATION_POSITIONS,

    PRINT_ORIENTATIONS,

    PRINT_MARGINS,

    TRANSLATIONS,

    loadSettings,

    saveSettings,

    getSettings,

    getSetting,

    applySettings,

    resetSettings,

    initializeSettings,

    subscribeSettings,

    setLanguage,

    setCalendar,

    setTheme,

    setPrimaryColor,

    setFontScale,

    setDensity,

    setFontFamily,

    createSettingsBackup,

    importSettingsBackup,

    getShareUrl,

    readSettingsFromUrl,

    clearSettingsCache,

    notify,

    applyTranslations,

    getTranslation
};