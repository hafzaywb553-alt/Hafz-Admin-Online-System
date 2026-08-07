/* ==========================================
د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
settings.js
System Settings Engine
========================================== */

import { db } from "./firebase.js";

import {
doc,
getDoc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ==========================================
// Firestore Settings Document
// ==========================================

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOCUMENT = "system";
const SETTINGS_CACHE_KEY = "hafz_admin_online_system_settings_v1";

// ==========================================
// Default Settings
// ==========================================

export const DEFAULT_SETTINGS = {
systemName: "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
language: "ps",
calendar: "solar",
theme: "light",
primaryColor: "#0B6B36",
fontScale: "medium",
density: "comfortable"
};

// ==========================================
// Supported Languages
// ==========================================

export const LANGUAGES = {
ps: { name: "پښتو", direction: "rtl" },
fa: { name: "دري", direction: "rtl" },
en: { name: "English", direction: "ltr" },
ur: { name: "اردو", direction: "rtl" },
ar: { name: "العربية", direction: "rtl" }
};

// ==========================================
// Supported Calendars
// ==========================================

export const CALENDARS = {
solar: { name: "هجري شمسي" },
lunar: { name: "هجري قمري" },
gregorian: { name: "میلادي" }
};

// ==========================================
// Supported Themes
// ==========================================

export const THEMES = {
light: { name: "روښانه" },
dark: { name: "تیاره" }
};

// ==========================================
// Font Scales
// ==========================================

export const FONT_SCALES = {
small: { name: "کوچنی", value: 0.94 },
medium: { name: "منځنی", value: 1.0 },
large: { name: "لوی", value: 1.08 },
extraLarge: { name: "ډېر لوی", value: 1.15 }
};

// ==========================================
// Density Modes
// ==========================================

export const DENSITIES = {
compact: { name: "کم فاصله" },
comfortable: { name: "نورمال" },
spacious: { name: "زیات فاصله" }
};

// ==========================================
// Common Translations
// ==========================================

export const TRANSLATIONS = {
ps: {
"app.name": "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
"common.home": "کور",
"common.back": "شاته",
"common.refresh": "بیا راژوندي",
"common.logout": "وتل",
"common.save": "خوندي کول",
"common.cancel": "لغوه",
"common.search": "لټون",
"common.loading": "لوډ کېږي...",
"common.noData": "هیڅ معلومات نشته",
"common.settings": "تنظیمات",
"common.language": "ژبه",
"common.theme": "موډ",
"common.fontSize": "د لیک اندازه",
"menu.dashboard": "ډشبورډ",
"menu.newRegister": "نوې ثبت",
"menu.search": "لټون",
"menu.reports": "راپورونه",
"menu.admin": "ادمین",
"menu.settings": "تنظیمات",
"theme.light": "روښانه",
"theme.dark": "تیاره",
"calendar.solar": "هجري شمسي",
"calendar.lunar": "هجري قمري",
"calendar.gregorian": "میلادي",
"density.compact": "کم فاصله",
"density.comfortable": "نورمال",
"density.spacious": "زیات فاصله"
},
fa: {
"app.name": "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
"common.home": "خانه",
"common.back": "بازگشت",
"common.refresh": "نوسازی",
"common.logout": "خروج",
"common.save": "ذخیره",
"common.cancel": "لغو",
"common.search": "جستجو",
"common.loading": "در حال بارگذاری...",
"common.noData": "هیچ داده‌ای موجود نیست",
"common.settings": "تنظیمات",
"common.language": "زبان",
"common.theme": "حالت",
"common.fontSize": "اندازه متن",
"menu.dashboard": "داشبورد",
"menu.newRegister": "ثبت جدید",
"menu.search": "جستجو",
"menu.reports": "گزارش‌ها",
"menu.admin": "ادمین",
"menu.settings": "تنظیمات",
"theme.light": "روشن",
"theme.dark": "تاریک",
"calendar.solar": "هجری شمسی",
"calendar.lunar": "هجری قمری",
"calendar.gregorian": "میلادی",
"density.compact": "فشرده",
"density.comfortable": "عادی",
"density.spacious": "باز"
},
en: {
"app.name": "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
"common.home": "Home",
"common.back": "Back",
"common.refresh": "Refresh",
"common.logout": "Logout",
"common.save": "Save",
"common.cancel": "Cancel",
"common.search": "Search",
"common.loading": "Loading...",
"common.noData": "No data available",
"common.settings": "Settings",
"common.language": "Language",
"common.theme": "Theme",
"common.fontSize": "Font size",
"menu.dashboard": "Dashboard",
"menu.newRegister": "New Register",
"menu.search": "Search",
"menu.reports": "Reports",
"menu.admin": "Admin",
"menu.settings": "Settings",
"theme.light": "Light",
"theme.dark": "Dark",
"calendar.solar": "Solar Hijri",
"calendar.lunar": "Lunar Hijri",
"calendar.gregorian": "Gregorian",
"density.compact": "Compact",
"density.comfortable": "Comfortable",
"density.spacious": "Spacious"
},
ur: {
"app.name": "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
"common.home": "ہوم",
"common.back": "واپس",
"common.refresh": "ریفریش",
"common.logout": "لاگ آؤٹ",
"common.save": "محفوظ کریں",
"common.cancel": "منسوخ",
"common.search": "تلاش",
"common.loading": "لوڈ ہو رہا ہے...",
"common.noData": "کوئی ڈیٹا موجود نہیں",
"common.settings": "سیٹنگز",
"common.language": "زبان",
"common.theme": "موڈ",
"common.fontSize": "فونٹ سائز",
"menu.dashboard": "ڈیش بورڈ",
"menu.newRegister": "نئی رجسٹریشن",
"menu.search": "تلاش",
"menu.reports": "رپورٹس",
"menu.admin": "ایڈمن",
"menu.settings": "سیٹنگز",
"theme.light": "روشن",
"theme.dark": "تاریک",
"calendar.solar": "ہجری شمسی",
"calendar.lunar": "ہجری قمری",
"calendar.gregorian": "گریگورین",
"density.compact": "کم جگہ",
"density.comfortable": "نارمل",
"density.spacious": "زیادہ جگہ"
},
ar: {
"app.name": "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس",
"common.home": "الرئيسية",
"common.back": "رجوع",
"common.refresh": "تحديث",
"common.logout": "تسجيل الخروج",
"common.save": "حفظ",
"common.cancel": "إلغاء",
"common.search": "بحث",
"common.loading": "جارٍ التحميل...",
"common.noData": "لا توجد بيانات",
"common.settings": "الإعدادات",
"common.language": "اللغة",
"common.theme": "الوضع",
"common.fontSize": "حجم الخط",
"menu.dashboard": "لوحة التحكم",
"menu.newRegister": "تسجيل جديد",
"menu.search": "بحث",
"menu.reports": "تقارير",
"menu.admin": "المسؤول",
"menu.settings": "الإعدادات",
"theme.light": "فاتح",
"theme.dark": "داكن",
"calendar.solar": "هجري شمسي",
"calendar.lunar": "هجري قمري",
"calendar.gregorian": "ميلادي",
"density.compact": "مضغوط",
"density.comfortable": "عادي",
"density.spacious": "واسع"
}
};

// ==========================================
// Current Settings
// ==========================================

let currentSettings = {
...DEFAULT_SETTINGS
};

// ==========================================
// Cache Helpers
// ==========================================

function canUseLocalStorage() {
try {
return typeof window !== "undefined" && !!window.localStorage;
} catch {
return false;
}
}

function cleanSettings(settings = {}) {
const merged = {
...DEFAULT_SETTINGS,
...settings
};

return {
    ...merged,
    systemName: String(merged.systemName || DEFAULT_SETTINGS.systemName).trim() || DEFAULT_SETTINGS.systemName,
    language: LANGUAGES[merged.language] ? merged.language : DEFAULT_SETTINGS.language,
    calendar: CALENDARS[merged.calendar] ? merged.calendar : DEFAULT_SETTINGS.calendar,
    theme: THEMES[merged.theme] ? merged.theme : DEFAULT_SETTINGS.theme,
    primaryColor: String(merged.primaryColor || DEFAULT_SETTINGS.primaryColor).trim() || DEFAULT_SETTINGS.primaryColor,
    fontScale: FONT_SCALES[merged.fontScale] ? merged.fontScale : DEFAULT_SETTINGS.fontScale,
    density: DENSITIES[merged.density] ? merged.density : DEFAULT_SETTINGS.density
};

}

function readCachedSettings() {
try {
if (!canUseLocalStorage()) {
return null;
}

    const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) {
        return null;
    }

    const parsed = JSON.parse(raw);
    return cleanSettings(parsed);
} catch (error) {
    console.warn("Read Settings Cache Error:", error);
    return null;
}

}

function writeCachedSettings(settings) {
try {
if (!canUseLocalStorage()) {
return;
}

    window.localStorage.setItem(
        SETTINGS_CACHE_KEY,
        JSON.stringify(cleanSettings(settings))
    );
} catch (error) {
    console.warn("Write Settings Cache Error:", error);
}

}

function getSettingsReference() {
return doc(db, SETTINGS_COLLECTION, SETTINGS_DOCUMENT);
}

function getTranslation(language, key) {
const langPack = TRANSLATIONS[language] || TRANSLATIONS.ps;
return langPack[key] ?? TRANSLATIONS.ps[key] ?? key;
}

function setHtmlAttributes(settings) {
const language = LANGUAGES[settings.language] || LANGUAGES.ps;

document.documentElement.lang = settings.language;
document.documentElement.dir = language.direction;
document.documentElement.dataset.theme = settings.theme;
document.documentElement.dataset.language = settings.language;
document.documentElement.dataset.fontScale = settings.fontScale;
document.documentElement.dataset.density = settings.density;

}

function setBodyAttributes(settings) {
if (!document.body) {
return;
}

document.body.dataset.theme = settings.theme;
document.body.dataset.language = settings.language;
document.body.dataset.fontScale = settings.fontScale;
document.body.dataset.density = settings.density;

}

function setCssVariables(settings) {
const fontScale = FONT_SCALES[settings.fontScale]?.value ?? 1.0;

document.documentElement.style.setProperty("--primary-color", settings.primaryColor);
document.documentElement.style.setProperty("--font-scale", String(fontScale));
document.documentElement.style.setProperty("--ui-density", settings.density);

if (document.body) {
    document.body.style.setProperty("--font-scale", String(fontScale));
    document.body.style.setProperty("--ui-density", settings.density);
}

}

function applySystemName(settings) {
const systemNameElements = document.querySelectorAll("[data-system-name]");
systemNameElements.forEach((element) => {
element.textContent = settings.systemName;
});
}

export function applyTranslations(settings = currentSettings) {
const language = settings.language in TRANSLATIONS ? settings.language : "ps";

const textNodes = document.querySelectorAll("[data-i18n]");
textNodes.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;

    const value = getTranslation(language, key);

    if (element.matches("input, textarea, select")) {
        element.setAttribute("placeholder", value);
    } else {
        element.textContent = value;
    }
});

const placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
placeholderNodes.forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (!key) return;
    element.setAttribute("placeholder", getTranslation(language, key));
});

const titleNodes = document.querySelectorAll("[data-i18n-title]");
titleNodes.forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    if (!key) return;
    element.setAttribute("title", getTranslation(language, key));
});

const ariaLabelNodes = document.querySelectorAll("[data-i18n-aria-label]");
ariaLabelNodes.forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");
    if (!key) return;
    element.setAttribute("aria-label", getTranslation(language, key));
});

}

// ==========================================
// Apply Settings
// ==========================================

export function applySettings(settings = currentSettings) {
const safeSettings = cleanSettings(settings);

currentSettings = safeSettings;
writeCachedSettings(safeSettings);

setHtmlAttributes(safeSettings);
setBodyAttributes(safeSettings);
setCssVariables(safeSettings);
applySystemName(safeSettings);
applyTranslations(safeSettings);

return safeSettings;

}

// ==========================================
// Load Settings
// ==========================================

export async function loadSettings() {
try {
const cached = readCachedSettings();

    if (cached) {
        currentSettings = cleanSettings(cached);
        applySettings(currentSettings);
    } else {
        currentSettings = cleanSettings(currentSettings);
        applySettings(currentSettings);
    }

    const settingsRef = getSettingsReference();
    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
        return currentSettings;
    }

    currentSettings = cleanSettings(snapshot.data());
    applySettings(currentSettings);

    return currentSettings;
} catch (error) {
    console.error("Load Settings Error:", error);

    const cached = readCachedSettings();
    if (cached) {
        currentSettings = cleanSettings(cached);
    } else {
        currentSettings = {
            ...DEFAULT_SETTINGS
        };
    }

    applySettings(currentSettings);
    return currentSettings;
}

}

// ==========================================
// Save Settings
// ==========================================

export async function saveSettings(settings = {}) {
try {
const newSettings = cleanSettings({
...currentSettings,
...settings
});

    if (!LANGUAGES[newSettings.language]) {
        throw new Error("د ژبې انتخاب ناسم دی.");
    }

    if (!CALENDARS[newSettings.calendar]) {
        throw new Error("د تقویم انتخاب ناسم دی.");
    }

    if (!THEMES[newSettings.theme]) {
        throw new Error("د Theme انتخاب ناسم دی.");
    }

    if (!FONT_SCALES[newSettings.fontScale]) {
        throw new Error("د لیک اندازې انتخاب ناسم دی.");
    }

    if (!DENSITIES[newSettings.density]) {
        throw new Error("د فاصلې انتخاب ناسم دی.");
    }

    currentSettings = newSettings;
    applySettings(currentSettings);

    await setDoc(
        getSettingsReference(),
        {
            ...newSettings,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );

    return {
        success: true,
        settings: currentSettings,
        message: "تنظیمات په بریالیتوب خوندي شوې."
    };
} catch (error) {
    console.error("Save Settings Error:", error);

    return {
        success: false,
        settings: currentSettings,
        message: error.message || "تنظیمات خوندي نه شوې."
    };
}

}

// ==========================================
// Get Current Settings
// ==========================================

export function getSettings() {
return {
...currentSettings
};
}

// ==========================================
// Get One Setting
// ==========================================

export function getSetting(key) {
return currentSettings[key];
}

// ==========================================
// Reset Settings
// ==========================================

export async function resetSettings() {
return saveSettings(DEFAULT_SETTINGS);
}

// ==========================================
// Set Language
// ==========================================

export async function setLanguage(language) {
if (!LANGUAGES[language]) {
return {
success: false,
message: "د ژبې انتخاب ناسم دی."
};
}

return saveSettings({ language });

}

// ==========================================
// Set Calendar
// ==========================================

export async function setCalendar(calendar) {
if (!CALENDARS[calendar]) {
return {
success: false,
message: "د تقویم انتخاب ناسم دی."
};
}

return saveSettings({ calendar });

}

// ==========================================
// Set Theme
// ==========================================

export async function setTheme(theme) {
if (!THEMES[theme]) {
return {
success: false,
message: "د Theme انتخاب ناسم دی."
};
}

return saveSettings({ theme });

}

// ==========================================
// Set Primary Color
// ==========================================

export async function setPrimaryColor(color) {
const value = String(color || "").trim();

if (!value) {
    return {
        success: false,
        message: "رنګ مشخص کړئ."
    };
}

return saveSettings({ primaryColor: value });

}

// ==========================================
// Set Font Scale
// ==========================================

export async function setFontScale(fontScale) {
if (!FONT_SCALES[fontScale]) {
return {
success: false,
message: "د لیک اندازې انتخاب ناسم دی."
};
}

return saveSettings({ fontScale });

}

// ==========================================
// Set Density
// ==========================================

export async function setDensity(density) {
if (!DENSITIES[density]) {
return {
success: false,
message: "د فاصلې انتخاب ناسم دی."
};
}

return saveSettings({ density });

}

// ==========================================
// Get Config Helpers
// ==========================================

export function getLanguageConfig(language = currentSettings.language) {
return LANGUAGES[language] || LANGUAGES.ps;
}

export function getCalendarConfig(calendar = currentSettings.calendar) {
return CALENDARS[calendar] || CALENDARS.solar;
}

export function getThemeConfig(theme = currentSettings.theme) {
return THEMES[theme] || THEMES.light;
}

export function getFontScaleConfig(fontScale = currentSettings.fontScale) {
return FONT_SCALES[fontScale] || FONT_SCALES.medium;
}

export function getDensityConfig(density = currentSettings.density) {
return DENSITIES[density] || DENSITIES.comfortable;
}

export function translate(key, language = currentSettings.language) {
return getTranslation(language, key);
}

// ==========================================
// Initialize Settings
// ==========================================

export async function initializeSettings() {
const settings = await loadSettings();
applySettings(settings);
return settings;
}

// ==========================================
// Export Default
// ==========================================

if (typeof document !== "undefined") {
const cached = readCachedSettings();
if (cached) {
currentSettings = cleanSettings(cached);
}
applySettings(currentSettings);
}

export default {
DEFAULT_SETTINGS,
LANGUAGES,
CALENDARS,
THEMES,
FONT_SCALES,
DENSITIES,
TRANSLATIONS,
loadSettings,
saveSettings,
getSettings,
getSetting,
applySettings,
resetSettings,
setLanguage,
setCalendar,
setTheme,
setPrimaryColor,
setFontScale,
setDensity,
getLanguageConfig,
getCalendarConfig,
getThemeConfig,
getFontScaleConfig,
getDensityConfig,
translate,
initializeSettings,
applyTranslations
};
