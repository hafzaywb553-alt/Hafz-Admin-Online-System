// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت سیسټم
// register.js
// اصلي آنلاین Register Engine
// ==========================================

import { db, auth } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    validateRegistration
} from "./validation.js";

import {
    getProvinces
} from "./locations.js";

import {
    listenAuth,
    logoutUser
} from "./auth.js";

import {
    initializeSettings
} from "./settings.js";


// ==========================================
// Collections
// ==========================================

const RECORDS_COLLECTION =
    "records";

const UNIQUE_NUMBERS_COLLECTION =
    "uniqueNumbers";

const ADMINS_COLLECTION =
    "admins";

const SETTINGS_COLLECTION =
    "settings";

const SETTINGS_DOC =
    "system";


// ==========================================
// Roles
// ==========================================

const ADMIN_ROLES = {

    SUPERADMIN:
        "superadmin",

    ADMIN:
        "admin",

    USER:
        "user"

};


// ==========================================
// Tazkira
// ==========================================

const TAZKIRA_TYPES = {

    ELECTRONIC:
        "electronic",

    PAPER:
        "paper"

};

const ELECTRONIC_TAZKIRA_PATTERN =
    /^[0-9]{4}-[0-9]{4}-[0-9]{5}$/;

const NUMERIC_ONLY_PATTERN =
    /^[0-9]+$/;


// ==========================================
// Default Field Configuration
// ==========================================

const DEFAULT_FIELD_CONFIG = {

    formNumber: {
        label: "د فورمي نمبر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 1
    },

    firstName: {
        label: "نوم",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 2
    },

    lastName: {
        label: "تخلص",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 3
    },

    fatherName: {
        label: "د پلار نوم",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 4
    },

    grandfatherName: {
        label: "د نیکه نوم",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 5
    },

    englishName: {
        label: "انګلیسي نوم",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 6
    },

    englishLastName: {
        label: "انګلیسي تخلص",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 7
    },

    englishFatherName: {
        label: "د پلار انګلیسي نوم",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 8
    },

    englishGrandfatherName: {
        label: "د نیکه انګلیسي نوم",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 9
    },

    tazkiraType: {
        label: "د تذکرې ډول",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 10
    },

    tazkira: {
        label: "د برقي تذکرې نمبر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 11
    },

    paperTazkiraNumber: {
        label: "د کاغذي تذکرې ګڼه",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 12
    },

    paperTazkiraVolume: {
        label: "د جلد نمبر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 13
    },

    paperTazkiraPage: {
        label: "د صفحې نمبر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 14
    },

    paperTazkiraGana: {
        label: "د ګڼې نمبر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 15
    },

    birthDate: {
        label: "د زېږون نېټه",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 16
    },

    age: {
        label: "عمر",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 17
    },

    phone: {
        label: "د تلیفون شمېره",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "person",
        order: 18
    },

    originalProvince: {
        label: "اصلي ولایت",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "originalLocation",
        order: 1
    },

    originalDistrict: {
        label: "اصلي ولسوالۍ",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "originalLocation",
        order: 2
    },

    originalVillage: {
        label: "اصلي کلی",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "originalLocation",
        order: 3
    },

    currentProvince: {
        label: "فعلي ولایت",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "currentLocation",
        order: 1
    },

    currentDistrict: {
        label: "فعلي ولسوالۍ",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "currentLocation",
        order: 2
    },

    currentVillage: {
        label: "فعلي کلی",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "currentLocation",
        order: 3
    },

    category: {
        label: "کټګوري",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "work",
        order: 1
    },

    currentJob: {
        label: "اوسنی دنده",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "work",
        order: 2
    },

    groupLeader: {
        label: "اړوند دلګی مشر نوم او تخلص",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "work",
        order: 3
    },

    jihadiHistory: {
        label: "جهادي سابقه",
        required: false,
        hidden: false,
        locked: false,
        deletable: false,
        section: "work",
        order: 4
    },

    pdfCreationDate: {
        label: "د PDF د جوړېدو نېټه",
        required: true,
        hidden: false,
        locked: false,
        deletable: false,
        section: "pdf",
        order: 1
    }

};


// ==========================================
// DOM
// ==========================================

const form =
    document.getElementById(
        "registrationForm"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const saveBtn =
    document.getElementById(
        "saveBtn"
    );

const resetBtn =
    document.getElementById(
        "resetBtn"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const dashboardBtn =
    document.getElementById(
        "dashboardBtn"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const recordIdInput =
    document.getElementById(
        "recordId"
    );

const editModeInput =
    document.getElementById(
        "editMode"
    );


// ==========================================
// Main Fields
// ==========================================

const formNumber =
    document.getElementById(
        "formNumber"
    );

const category =
    document.getElementById(
        "category"
    );

const firstName =
    document.getElementById(
        "firstName"
    );

const lastName =
    document.getElementById(
        "lastName"
    );

const fatherName =
    document.getElementById(
        "fatherName"
    );

const grandfatherName =
    document.getElementById(
        "grandfatherName"
    );

const englishName =
    document.getElementById(
        "englishName"
    );

const englishLastName =
    document.getElementById(
        "englishLastName"
    );

const englishFatherName =
    document.getElementById(
        "englishFatherName"
    );

const englishGrandfatherName =
    document.getElementById(
        "englishGrandfatherName"
    );

const birthDate =
    document.getElementById(
        "birthDate"
    );

const age =
    document.getElementById(
        "age"
    );

const phone =
    document.getElementById(
        "phone"
    );

const currentJob =
    document.getElementById(
        "currentJob"
    );

const groupLeader =
    document.getElementById(
        "groupLeader"
    );

const jihadiHistory =
    document.getElementById(
        "jihadiHistory"
    );

const jihadiRequired =
    document.getElementById(
        "jihadiRequired"
    );

const pdfCreationDate =
    document.getElementById(
        "pdfCreationDate"
    );


// ==========================================
// Locations
// ==========================================

const originalProvince =
    document.getElementById(
        "originalProvince"
    );

const originalDistrict =
    document.getElementById(
        "originalDistrict"
    );

const originalVillage =
    document.getElementById(
        "originalVillage"
    );

const currentProvince =
    document.getElementById(
        "currentProvince"
    );

const currentDistrict =
    document.getElementById(
        "currentDistrict"
    );

const currentVillage =
    document.getElementById(
        "currentVillage"
    );


// ==========================================
// Tazkira Fields
// ==========================================

const tazkiraTypeElectronic =
    document.getElementById(
        "tazkiraTypeElectronic"
    );

const tazkiraTypePaper =
    document.getElementById(
        "tazkiraTypePaper"
    );

const electronicTazkiraGroup =
    document.getElementById(
        "electronicTazkiraGroup"
    );

const paperNumberGroup =
    document.getElementById(
        "paperTazkiraNumberGroup"
    );

const paperJildGroup =
    document.getElementById(
        "paperJildGroup"
    );

const paperSafhaGroup =
    document.getElementById(
        "paperSafhaGroup"
    );

const paperGanaGroup =
    document.getElementById(
        "paperGanaGroup"
    );

const tazkira =
    document.getElementById(
        "tazkira"
    );

const paperTazkiraNumber =
    document.getElementById(
        "paperTazkiraNumber"
    );

const paperTazkiraVolume =
    document.getElementById(
        "paperTazkiraVolume"
    );

const paperTazkiraPage =
    document.getElementById(
        "paperTazkiraPage"
    );

const paperTazkiraGana =
    document.getElementById(
        "paperTazkiraGana"
    );

const electronicTazkiraRequired =
    document.getElementById(
        "electronicTazkiraRequired"
    );

const paperTazkiraNumberRequired =
    document.getElementById(
        "paperTazkiraNumberRequired"
    );

const paperTazkiraVolumeRequired =
    document.getElementById(
        "paperTazkiraVolumeRequired"
    );

const paperTazkiraPageRequired =
    document.getElementById(
        "paperTazkiraPageRequired"
    );

const paperTazkiraGanaRequired =
    document.getElementById(
        "paperTazkiraGanaRequired"
    );


// ==========================================
// State
// ==========================================

let onlineFieldConfig =
    structuredClone(
        DEFAULT_FIELD_CONFIG
    );

let deletedFields = [];

let customFieldElements =
    new Map();

let loadingRecord = false;

let currentAdmin = {
    uid: "",
    name: "",
    email: "",
    role: ADMIN_ROLES.USER
};


// ==========================================
// Helpers
// ==========================================

function cleanText(value) {

    return String(
        value ?? ""
    ).trim();

}


function escapeSelector(value) {

    try {

        return CSS.escape(
            String(value)
        );

    } catch {

        return String(value)
            .replace(
                /["\\]/g,
                "\\$&"
            );

    }

}


/*
 * مهم:
 * فیلډ باید لومړی د data-field-key
 * له لارې پیدا شي.
 *
 * ځکه tazkiraType یو radio-group دی
 * او input یې id = tazkiraTypeElectronic /
 * tazkiraTypePaper دی.
 */
function getFieldGroup(key) {

    const selector =
        `.form-group[data-field-key="${escapeSelector(key)}"]`;

    const group =
        document.querySelector(
            selector
        );

    if (group) {
        return group;
    }

    /*
     * Backup:
     * که data-field-key نه وي،
     * د عادي element id له لارې یې پیدا کړه.
     */
    const field =
        document.getElementById(
            key
        );

    if (!field) {
        return null;
    }

    return field.closest(
        ".form-group"
    );

}


/*
 * د Register اصلي Field Hostونه
 * مستقیم د HTML data-field-host څخه اخلو.
 *
 * د Section متن، sections[0] او ورته
 * اټکلي لارې نه کاروو.
 */
function getSectionHost(section) {

    const host =
        document.querySelector(
            `[data-field-host="${escapeSelector(section)}"]`
        );

    return host || null;

}


/*
 * د Section دننه Fields د order له مخې.
 */
function getSectionEntries(section) {

    return Object.entries(
        onlineFieldConfig
    )
    .filter(
        ([, config]) =>
            (
                config.section ||
                "person"
            ) === section
    )
    .sort(
        (a, b) =>
            Number(
                a[1]?.order ?? 999
            ) -
            Number(
                b[1]?.order ?? 999
            )
    );

}


// ==========================================
// Settings Normalization
// ==========================================

function normalizeFieldConfig(
    raw = {},
    deleted = []
) {

    const result = {};

    const deletedSet =
        new Set(
            Array.isArray(
                deleted
            )
                ? deleted
                : []
        );


    /*
     * اصلي Fieldونه تل موجود وي.
     */
    for (
        const key
        of Object.keys(
            DEFAULT_FIELD_CONFIG
        )
    ) {

        result[key] = {

            ...DEFAULT_FIELD_CONFIG[key],

            ...(raw?.[key] || {})

        };

    }


    /*
     * Custom Fieldونه:
     * که deletedFields کې وي،
     * بیا یې مه راوړه.
     */
    for (
        const key
        of Object.keys(
            raw || {}
        )
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                DEFAULT_FIELD_CONFIG,
                key
            )
        ) {
            continue;
        }

        if (
            deletedSet.has(key)
        ) {
            continue;
        }

        const field =
            raw[key] || {};

        result[key] = {

            label:
                cleanText(
                    field.label ||
                    key
                ),

            required:
                Boolean(
                    field.required
                ),

            hidden:
                Boolean(
                    field.hidden
                ),

            locked:
                Boolean(
                    field.locked
                ),

            deletable:
                true,

            section:
                field.section ||
                "work",

            order:
                Number(
                    field.order ??
                    999
                )

        };

    }

    return result;

}


function normalizeSectionOrders(
    config
) {

    const sections = {};

    Object.entries(
        config || {}
    ).forEach(
        (
            [
                key,
                field
            ]
        ) => {

            const section =
                field?.section ||
                "person";

            if (
                !sections[section]
            ) {

                sections[section] =
                    [];

            }

            sections[section].push(
                {
                    key,
                    field
                }
            );

        }
    );


    Object.values(
        sections
    ).forEach(
        entries => {

            entries.sort(
                (a, b) =>
                    Number(
                        a.field?.order ??
                        999
                    ) -
                    Number(
                        b.field?.order ??
                        999
                    )
            );

            entries.forEach(
                (
                    entry,
                    index
                ) => {

                    config[
                        entry.key
                    ].order =
                        index + 1;

                }
            );

        }
    );

    return config;

}


function normalizeSettings(
    data = {}
) {

    const deleted =
        Array.isArray(
            data.deletedFields
        )
            ? [
                ...new Set(
                    data.deletedFields
                        .map(
                            item =>
                                cleanText(
                                    item
                                )
                        )
                        .filter(Boolean)
                )
            ]
            : [];

    const config =
        normalizeFieldConfig(
            data.fieldConfig || {},
            deleted
        );

    normalizeSectionOrders(
        config
    );

    return {

        schemaVersion:
            3,

        globalPrivacy: {

            hideFromAdmins:
                Boolean(
                    data.globalPrivacy
                        ?.hideFromAdmins
                ),

            hideFromStaff:
                Boolean(
                    data.globalPrivacy
                        ?.hideFromStaff
                ),

            hideFromUsers:
                Boolean(
                    data.globalPrivacy
                        ?.hideFromUsers
                )

        },

        deletedFields:
            deleted,

        fieldConfig:
            config

    };

}


// ==========================================
// Required Mark
// ==========================================

function syncRequiredMark(
    key,
    required
) {

    const group =
        getFieldGroup(
            key
        );

    if (!group) {
        return;
    }

    const label =
        group.querySelector(
            ".form-label"
        );

    if (!label) {
        return;
    }


    /*
     * زاړه JS-generated marks ټول پاک کړه.
     */
    label
        .querySelectorAll(
            ".online-required-mark"
        )
        .forEach(
            element =>
                element.remove()
        );


    /*
     * د HTML اصلي * نښې.
     */
    const originalMarks =
        Array.from(
            label.querySelectorAll(
                ".required"
            )
        );


    /*
     * که څو اصلي * موجودې وي،
     * یوازې لومړۍ پرېږدو.
     */
    originalMarks
        .slice(1)
        .forEach(
            element =>
                element.remove()
        );


    const mark =
        originalMarks[0];


    if (mark) {

        mark.style.display =
            required
                ? ""
                : "none";

        return;

    }


    /*
     * که Custom/static Field اصلي *
     * ونه لري، یوازې یوه نښه جوړه کړه.
     */
    if (
        required
    ) {

        const newMark =
            document.createElement(
                "span"
            );

        newMark.className =
            "required online-required-mark";

        newMark.textContent =
            " *";

        label.appendChild(
            newMark
        );

    }

}


// ==========================================
// Runtime Custom Fields
// ==========================================

function clearOldRuntimeFields() {

    document
        .querySelectorAll(
            "[data-custom-runtime-field='true']"
        )
        .forEach(
            element =>
                element.remove()
        );

    customFieldElements.clear();

}


function createRuntimeCustomField(
    key,
    config
) {

    const group =
        document.createElement(
            "div"
        );

    group.className =
        "form-group";

    group.dataset.customRuntimeField =
        "true";

    group.dataset.fieldKey =
        key;


    if (
        config.full
    ) {

        group.classList.add(
            "full"
        );

    }


    if (
        config.locked
    ) {

        group.classList.add(
            "dynamic-field-locked"
        );

    }


    const label =
        document.createElement(
            "label"
        );

    label.className =
        "form-label";

    label.setAttribute(
        "for",
        `custom_${key}`
    );

    label.textContent =
        cleanText(
            config.label ||
            key
        );


    if (
        config.required
    ) {

        const mark =
            document.createElement(
                "span"
            );

        mark.className =
            "required";

        mark.textContent =
            " *";

        label.appendChild(
            mark
        );

    }


    const input =
        document.createElement(
            "input"
        );

    input.type =
        "text";

    input.id =
        `custom_${key}`;

    input.name =
        `custom_${key}`;

    input.className =
        "form-control";

    input.autocomplete =
        "off";

    input.required =
        Boolean(
            config.required
        );

    input.disabled =
        Boolean(
            config.locked
        );


    group.appendChild(
        label
    );

    group.appendChild(
        input
    );


    customFieldElements.set(
        key,
        input
    );


    return group;

}


// ==========================================
// Render Custom Fields
// ==========================================

function renderCustomFields() {

    clearOldRuntimeFields();


    const customEntries =
        Object.entries(
            onlineFieldConfig
        )
        .filter(
            (
                [
                    key,
                    field
                ]
            ) => {

                return (
                    field?.deletable === true &&
                    !deletedFields.includes(
                        key
                    )
                );

            }
        )
        .sort(
            (a, b) => {

                const sectionA =
                    a[1]?.section ||
                    "work";

                const sectionB =
                    b[1]?.section ||
                    "work";

                /*
                 * Custom Field باید د ټاکل شوې
                 * Section دننه پاتې شي.
                 *
                 * د Section نوم پر اساس
                 * ترتیب نه جوړوو.
                 * اصلي موقعیت یې order ټاکي.
                 */

                if (
                    sectionA !==
                    sectionB
                ) {

                    return (
                        sectionA ===
                        sectionB
                            ? 0
                            : 0
                    );

                }

                return (
                    Number(
                        a[1]?.order ??
                        999
                    ) -
                    Number(
                        b[1]?.order ??
                        999
                    )
                );

            }
        );


    /*
     * Custom fields د خپل section مطابق
     * مستقیم Host ته اضافه کېږي.
     */
    customEntries.forEach(
        (
            [
                key,
                config
            ]
        ) => {

            if (
                config.hidden
            ) {
                return;
            }


            const section =
                config.section ||
                "work";


            const host =
                getSectionHost(
                    section
                );

            if (!host) {
                return;
            }


            const field =
                createRuntimeCustomField(
                    key,
                    config
                );


            /*
             * اول append.
             * وروسته reorderAllConfiguredFields()
             * هغه په اصلي ترتیب کې ږدي.
             */
            host.appendChild(
                field
            );

        }
    );

}


// ==========================================
// Reorder ALL Fields
// اصلي + Custom
// ==========================================

function reorderAllConfiguredFields() {

    const sections = [
        "person",
        "originalLocation",
        "currentLocation",
        "work",
        "pdf",
        "custom"
    ];


    /*
     * custom په جلا Host کې یوازې هغه وخت
     * کارېږي چې Admin ورته custom section
     * ټاکلی وي.
     */
    sections.forEach(
        section => {

            const host =
                getSectionHost(
                    section
                );

            if (!host) {
                return;
            }


            const entries =
                getSectionEntries(
                    section
                );


            entries.forEach(
                (
                    [
                        key,
                        config
                    ]
                ) => {

                    let group =
                        getFieldGroup(
                            key
                        );


                    /*
                     * Custom field static DOM کې
                     * نه وي؛ runtime map ته لاړ شه.
                     */
                    if (
                        !group &&
                        config?.deletable === true
                    ) {

                        const customInput =
                            customFieldElements.get(
                                key
                            );

                        if (
                            customInput
                        ) {

                            group =
                                customInput.closest(
                                    ".form-group"
                                );

                        }

                    }


                    if (!group) {
                        return;
                    }


                    if (
                        group.parentElement !==
                        host
                    ) {
                        return;
                    }


                    host.appendChild(
                        group
                    );

                }
            );

        }
    );

}


// ==========================================
// Apply Online Field Config
// ==========================================

function applyOnlineFieldConfig() {

    /*
     * اول Custom runtime fields پاک کړه.
     */
    clearOldRuntimeFields();


    /*
     * اصلي/static fields.
     */
    Object.entries(
        onlineFieldConfig
    ).forEach(
        (
            [
                key,
                config
            ]
        ) => {

            if (
                config?.deletable === true
            ) {
                return;
            }


            const group =
                getFieldGroup(
                    key
                );

            if (!group) {
                return;
            }


            const field =
                document.getElementById(
                    key
                );


            /*
             * د tazkiraType لپاره
             * input مستقیم id نه لري؛
             * نو special field handling.
             */
            if (
                key ===
                "tazkiraType"
            ) {

                group.style.display =
                    config.hidden === true
                        ? "none"
                        : "";

                const radios =
                    group.querySelectorAll(
                        'input[name="tazkiraType"]'
                    );

                radios.forEach(
                    radio => {

                        radio.disabled =
                            Boolean(
                                config.locked
                            );

                    }
                );


                syncRequiredMark(
                    key,
                    Boolean(
                        config.required
                    )
                );


                return;

            }


            if (
                config.hidden === true
            ) {

                group.classList.add(
                    "online-hidden-field"
                );

            } else {

                group.classList.remove(
                    "online-hidden-field"
                );

            }


            if (field) {

                field.disabled =
                    Boolean(
                        config.locked
                    );


                if (
                    field.type !==
                        "radio" &&
                    field.type !==
                        "checkbox"
                ) {

                    field.required =
                        Boolean(
                            config.required
                        );

                }

            }


            syncRequiredMark(
                key,
                Boolean(
                    config.required
                )
            );

        }
    );


    /*
     * Custom Fields له Firestore config.
     */
    renderCustomFields();


    /*
     * ځانګړي logic.
     */
    updateTazkiraFields();

    updateJihadiHistory();


    /*
     * تر ټولو مهم:
     * دلته اصلي + Custom Fieldونه
     * د Firestore order مطابق ځای پر ځای کېږي.
     */
    reorderAllConfiguredFields();

}


// ==========================================
// Settings Loader
// ==========================================

async function loadOnlineFieldConfig() {

    try {

        const settingsRef =
            doc(
                db,
                SETTINGS_COLLECTION,
                SETTINGS_DOC
            );

        const snapshot =
            await getDoc(
                settingsRef
            );


        if (
            !snapshot.exists()
        ) {

            deletedFields =
                [];

            onlineFieldConfig =
                structuredClone(
                    DEFAULT_FIELD_CONFIG
                );

            normalizeSectionOrders(
                onlineFieldConfig
            );

            applyOnlineFieldConfig();

            return;

        }


        const data =
            snapshot.data() ||
            {};


        deletedFields =
            Array.isArray(
                data.deletedFields
            )
                ? [
                    ...new Set(
                        data.deletedFields
                            .map(
                                item =>
                                    cleanText(
                                        item
                                    )
                            )
                            .filter(
                                Boolean
                            )
                    )
                ]
                : [];


        onlineFieldConfig =
            normalizeFieldConfig(
                data.fieldConfig || {},
                deletedFields
            );


        /*
         * مهم:
         * د Firestore order ته لاس نه وهو.
         * یوازې که دوه فیلډونه یو شان یا خالي
         * order ولري، normalization یې سموي.
         */
        normalizeSectionOrders(
            onlineFieldConfig
        );


        applyOnlineFieldConfig();

    } catch (error) {

        console.error(
            "Load Online Field Config Error:",
            error
        );

        showMessage(
            "د آنلاین فیلډونو د تنظیماتو لوډ ناکام شو.",
            "danger"
        );

    }

}


// ==========================================
// Tazkira Logic
// ==========================================

function updateTazkiraFields() {

    const isPaper =
        Boolean(
            tazkiraTypePaper?.checked
        );

    const isElectronic =
        !isPaper;


    if (
        electronicTazkiraGroup
    ) {

        electronicTazkiraGroup.style.display =
            isPaper
                ? "none"
                : "";

    }


    if (
        paperNumberGroup
    ) {

        paperNumberGroup.style.display =
            isPaper
                ? ""
                : "none";

    }


    if (
        paperJildGroup
    ) {

        paperJildGroup.style.display =
            isPaper
                ? ""
                : "none";

    }


    if (
        paperSafhaGroup
    ) {

        paperSafhaGroup.style.display =
            isPaper
                ? ""
                : "none";

    }


    if (
        paperGanaGroup
    ) {

        paperGanaGroup.style.display =
            isPaper
                ? ""
                : "none";

    }


    const electronicConfig =
        onlineFieldConfig.tazkira ||
        DEFAULT_FIELD_CONFIG.tazkira;

    const paperNumberConfig =
        onlineFieldConfig.paperTazkiraNumber ||
        DEFAULT_FIELD_CONFIG.paperTazkiraNumber;

    const paperVolumeConfig =
        onlineFieldConfig.paperTazkiraVolume ||
        DEFAULT_FIELD_CONFIG.paperTazkiraVolume;

    const paperPageConfig =
        onlineFieldConfig.paperTazkiraPage ||
        DEFAULT_FIELD_CONFIG.paperTazkiraPage;

    const paperGanaConfig =
        onlineFieldConfig.paperTazkiraGana ||
        DEFAULT_FIELD_CONFIG.paperTazkiraGana;


    /*
     * برقي تذکره
     */

    if (tazkira) {

        tazkira.disabled =
            isElectronic &&
            Boolean(
                electronicConfig.locked
            );

        tazkira.required =
            isElectronic &&
            Boolean(
                electronicConfig.required
            );

    }


    if (
        electronicTazkiraRequired
    ) {

        electronicTazkiraRequired.style.display =
            isElectronic &&
            electronicConfig.required
                ? ""
                : "none";

    }


    /*
     * کاغذي تذکره
     */

    if (
        paperTazkiraNumber
    ) {

        paperTazkiraNumber.disabled =
            isPaper &&
            Boolean(
                paperNumberConfig.locked
            );

        paperTazkiraNumber.required =
            isPaper &&
            Boolean(
                paperNumberConfig.required
            );

    }


    if (
        paperTazkiraVolume
    ) {

        paperTazkiraVolume.disabled =
            isPaper &&
            Boolean(
                paperVolumeConfig.locked
            );

        paperTazkiraVolume.required =
            isPaper &&
            Boolean(
                paperVolumeConfig.required
            );

    }


    if (
        paperTazkiraPage
    ) {

        paperTazkiraPage.disabled =
            isPaper &&
            Boolean(
                paperPageConfig.locked
            );

        paperTazkiraPage.required =
            isPaper &&
            Boolean(
                paperPageConfig.required
            );

    }


    if (
        paperTazkiraGana
    ) {

        paperTazkiraGana.disabled =
            isPaper &&
            Boolean(
                paperGanaConfig.locked
            );

        paperTazkiraGana.required =
            isPaper &&
            Boolean(
                paperGanaConfig.required
            );

    }


    if (
        paperTazkiraNumberRequired
    ) {

        paperTazkiraNumberRequired.style.display =
            isPaper &&
            paperNumberConfig.required
                ? ""
                : "none";

    }


    if (
        paperTazkiraVolumeRequired
    ) {

        paperTazkiraVolumeRequired.style.display =
            isPaper &&
            paperVolumeConfig.required
                ? ""
                : "none";

    }


    if (
        paperTazkiraPageRequired
    ) {

        paperTazkiraPageRequired.style.display =
            isPaper &&
            paperPageConfig.required
                ? ""
                : "none";

    }


    if (
        paperTazkiraGanaRequired
    ) {

        paperTazkiraGanaRequired.style.display =
            isPaper &&
            paperGanaConfig.required
                ? ""
                : "none";

    }


    /*
     * د انتخاب پر اساس د بل ډول required
     * تل false.
     */

    if (
        isElectronic
    ) {

        if (paperTazkiraNumber) {
            paperTazkiraNumber.required =
                false;
        }

        if (paperTazkiraVolume) {
            paperTazkiraVolume.required =
                false;
        }

        if (paperTazkiraPage) {
            paperTazkiraPage.required =
                false;
        }

        if (paperTazkiraGana) {
            paperTazkiraGana.required =
                false;
        }

    } else {

        if (tazkira) {
            tazkira.required =
                false;
        }

    }

}


// ==========================================
// Tazkira Mode
// ==========================================

function setTazkiraMode(
    mode
) {

    const isPaper =
        mode ===
        TAZKIRA_TYPES.PAPER;


    if (
        tazkiraTypePaper
    ) {

        tazkiraTypePaper.checked =
            isPaper;

    }


    if (
        tazkiraTypeElectronic
    ) {

        tazkiraTypeElectronic.checked =
            !isPaper;

    }


    updateTazkiraFields();

}


function getSelectedTazkiraType() {

    return tazkiraTypePaper?.checked
        ? TAZKIRA_TYPES.PAPER
        : TAZKIRA_TYPES.ELECTRONIC;

}


// ==========================================
// Jihadi History
// ==========================================

function updateJihadiHistory() {

    const isMujahid =
        category?.value ===
        "مجاهد";

    const config =
        onlineFieldConfig
            .jihadiHistory ||
        DEFAULT_FIELD_CONFIG
            .jihadiHistory;


    if (
        isMujahid
    ) {

        if (
            config.locked
        ) {

            jihadiHistory.disabled =
                true;

            jihadiHistory.required =
                false;

            if (
                jihadiRequired
            ) {

                jihadiRequired.style.display =
                    "none";

            }

        } else {

            jihadiHistory.disabled =
                false;

            jihadiHistory.required =
                true;

            if (
                jihadiRequired
            ) {

                jihadiRequired.style.display =
                    "";

            }

        }

    } else {

        jihadiHistory.value =
            "";

        jihadiHistory.disabled =
            true;

        jihadiHistory.required =
            false;

        if (
            jihadiRequired
        ) {

            jihadiRequired.style.display =
                "none";

        }

    }

}


// ==========================================
// Provinces
// ==========================================

function loadProvinces() {

    if (
        !originalProvince ||
        !currentProvince
    ) {
        return;
    }


    /*
     * د څو ځله append مخنیوی.
     */
    if (
        originalProvince.options.length >
        1
    ) {
        return;
    }


    const provinces =
        getProvinces();


    provinces.forEach(
        province => {

            const option1 =
                document.createElement(
                    "option"
                );

            option1.value =
                province;

            option1.textContent =
                province;


            const option2 =
                document.createElement(
                    "option"
                );

            option2.value =
                province;

            option2.textContent =
                province;


            originalProvince.appendChild(
                option1
            );

            currentProvince.appendChild(
                option2
            );

        }
    );

}


// ==========================================
// Formatting
// ==========================================

function formatFormNumber(
    value
) {

    return cleanText(
        value
    ).replace(
        /[^0-9]/g,
        ""
    );

}


function formatElectronicTazkira(
    value
) {

    let numeric =
        cleanText(
            value
        )
        .replace(
            /[^0-9]/g,
            ""
        )
        .substring(
            0,
            13
        );


    if (
        numeric.length > 8
    ) {

        return (

            numeric.substring(
                0,
                4
            ) +

            "-" +

            numeric.substring(
                4,
                8
            ) +

            "-" +

            numeric.substring(
                8
            )

        );

    }


    if (
        numeric.length > 4
    ) {

        return (

            numeric.substring(
                0,
                4
            ) +

            "-" +

            numeric.substring(
                4
            )

        );

    }


    return numeric;

}


function formatPaperNumber(
    value
) {

    return cleanText(
        value
    ).replace(
        /[^0-9]/g,
        ""
    );

}


// ==========================================
// Unique Numbers
// ==========================================

function normalizeUniqueNumber(
    value
) {

    return cleanText(
        value
    ).replace(
        /[^0-9]/g,
        ""
    );

}


function uniqueDocId(
    type,
    value
) {

    return (

        `${type}_` +
        normalizeUniqueNumber(
            value
        )

    );

}


function getUniqueItemsFromData(
    data
) {

    const result = [

        {
            type:
                "formNumber",

            value:
                data.formNumber
        }

    ];


    if (
        data.tazkiraType ===
        TAZKIRA_TYPES.ELECTRONIC
    ) {

        result.push({

            type:
                "electronicTazkiraNumber",

            value:
                data.electronicTazkiraNumber

        });

    }


    if (
        data.tazkiraType ===
        TAZKIRA_TYPES.PAPER
    ) {

        result.push({

            type:
                "paperTazkiraNumber",

            value:
                data.paperTazkiraNumber

        });

    }


    return result.filter(
        item =>
            normalizeUniqueNumber(
                item.value
            )
    );

}


async function isUniqueNumberReserved(
    type,
    value,
    currentRecordId = ""
) {

    const number =
        normalizeUniqueNumber(
            value
        );

    if (!number) {
        return false;
    }


    const ref =
        doc(
            db,
            UNIQUE_NUMBERS_COLLECTION,
            uniqueDocId(
                type,
                number
            )
        );


    const snapshot =
        await getDoc(
            ref
        );


    if (
        !snapshot.exists()
    ) {
        return false;
    }


    return (

        cleanText(
            snapshot.data()
                ?.recordId
        ) !==

        cleanText(
            currentRecordId
        )

    );

}


// ==========================================
// Custom Values
// ==========================================

function collectCustomFields() {

    const result = {};

    customFieldElements.forEach(
        (
            input,
            key
        ) => {

            result[key] =
                cleanText(
                    input.value
                );

        }
    );

    return result;

}


function populateCustomFields(
    values = {}
) {

    customFieldElements.forEach(
        (
            input,
            key
        ) => {

            input.value =
                cleanText(
                    values[key]
                );

        }
    );

}


// ==========================================
// Form Data
// ==========================================

function collectFormData() {

    const type =
        getSelectedTazkiraType();


    return {

        formNumber:
            cleanText(
                formNumber.value
            ),

        category:
            cleanText(
                category.value
            ),

        firstName:
            cleanText(
                firstName.value
            ),

        lastName:
            cleanText(
                lastName.value
            ),

        fatherName:
            cleanText(
                fatherName.value
            ),

        grandfatherName:
            cleanText(
                grandfatherName.value
            ),

        englishName:
            cleanText(
                englishName.value
            ),

        englishLastName:
            cleanText(
                englishLastName.value
            ),

        englishFatherName:
            cleanText(
                englishFatherName.value
            ),

        englishGrandfatherName:
            cleanText(
                englishGrandfatherName.value
            ),

        birthDate:
            cleanText(
                birthDate.value
            ),

        age:
            cleanText(
                age.value
            ),

        phone:
            cleanText(
                phone.value
            ),

        tazkiraType:
            type,

        tazkira:
            type ===
            TAZKIRA_TYPES.ELECTRONIC

                ? cleanText(
                    tazkira.value
                )

                : "",

        electronicTazkiraNumber:
            type ===
            TAZKIRA_TYPES.ELECTRONIC

                ? cleanText(
                    tazkira.value
                )

                : "",

        paperTazkiraNumber:
            type ===
            TAZKIRA_TYPES.PAPER

                ? cleanText(
                    paperTazkiraNumber.value
                )

                : "",

        paperTazkiraVolume:
            type ===
            TAZKIRA_TYPES.PAPER

                ? cleanText(
                    paperTazkiraVolume.value
                )

                : "",

        paperTazkiraPage:
            type ===
            TAZKIRA_TYPES.PAPER

                ? cleanText(
                    paperTazkiraPage.value
                )

                : "",

        paperTazkiraGana:
            type ===
            TAZKIRA_TYPES.PAPER

                ? cleanText(
                    paperTazkiraGana.value
                )

                : "",

        originalLocation: {

            province:
                cleanText(
                    originalProvince.value
                ),

            district:
                cleanText(
                    originalDistrict.value
                ),

            village:
                cleanText(
                    originalVillage.value
                )

        },

        currentLocation: {

            province:
                cleanText(
                    currentProvince.value
                ),

            district:
                cleanText(
                    currentDistrict.value
                ),

            village:
                cleanText(
                    currentVillage.value
                )

        },

        currentJob:
            cleanText(
                currentJob.value
            ),

        groupLeader:
            cleanText(
                groupLeader.value
            ),

        jihadiHistory:
            cleanText(
                jihadiHistory.value
            ),

        pdfCreationDate:
            cleanText(
                pdfCreationDate.value
            ),

        customFields:
            collectCustomFields(),

        fieldState:
            structuredClone(
                onlineFieldConfig
            )

    };

}


// ==========================================
// Firestore Data
// ==========================================

function buildFirestoreData(
    data,
    existing = {}
) {

    const oldPerson =
        existing.person ||
        {};


    return {

        ...existing,

        formNumber:
            data.formNumber,

        category:
            data.category,

        firstName:
            data.firstName,

        lastName:
            data.lastName,

        fatherName:
            data.fatherName,

        grandfatherName:
            data.grandfatherName,

        englishName:
            data.englishName,

        englishLastName:
            data.englishLastName,

        englishFatherName:
            data.englishFatherName,

        englishGrandfatherName:
            data.englishGrandfatherName,


        person: {

            ...oldPerson,

            firstName:
                data.firstName,

            lastName:
                data.lastName,

            fatherName:
                data.fatherName,

            grandfatherName:
                data.grandfatherName,

            englishName:
                data.englishName,

            englishLastName:
                data.englishLastName,

            englishFatherName:
                data.englishFatherName,

            englishGrandfatherName:
                data.englishGrandfatherName,

            birthDate:
                data.birthDate,

            age:
                data.age,

            phone:
                data.phone,

            tazkiraType:
                data.tazkiraType,

            tazkira:
                data.tazkira

        },

        birthDate:
            data.birthDate,

        age:
            data.age,

        phone:
            data.phone,

        tazkiraType:
            data.tazkiraType,

        tazkira:
            data.tazkira,

        electronicTazkiraNumber:
            data.electronicTazkiraNumber,

        paperTazkiraNumber:
            data.paperTazkiraNumber,

        paperTazkiraVolume:
            data.paperTazkiraVolume,

        paperTazkiraPage:
            data.paperTazkiraPage,

        paperTazkiraGana:
            data.paperTazkiraGana,

        originalLocation:
            data.originalLocation,

        currentLocation:
            data.currentLocation,

        currentJob:
            data.currentJob,

        groupLeader:
            data.groupLeader,

        jihadiHistory:
            data.jihadiHistory,

        pdfCreationDate:
            data.pdfCreationDate,

        customFields:
            data.customFields || {},

        fieldState:
            data.fieldState || {},

        editable:
            existing.editable !== undefined
                ? existing.editable
                : true,

        visibility:
            existing.visibility || {
                hiddenFromAdmins:
                    false
            }

    };

}


// ==========================================
// Register Person
// ==========================================

async function registerPerson(
    data
) {

    try {

        const recordRef =
            doc(
                collection(
                    db,
                    RECORDS_COLLECTION
                )
            );


        const firestoreData =
            buildFirestoreData(
                data
            );


        firestoreData.createdAt =
            serverTimestamp();

        firestoreData.updatedAt =
            serverTimestamp();

        firestoreData.createdBy =
            currentAdmin.uid;

        firestoreData.createdByName =
            currentAdmin.name;

        firestoreData.createdByEmail =
            currentAdmin.email;

        firestoreData.updatedBy =
            currentAdmin.uid;

        firestoreData.updatedByName =
            currentAdmin.name;

        firestoreData.updatedByEmail =
            currentAdmin.email;


        await runTransaction(
            db,
            async tx => {

                /*
                 * Unique Numbers
                 */
                for (
                    const item
                    of getUniqueItemsFromData(
                        data
                    )
                ) {

                    const number =
                        normalizeUniqueNumber(
                            item.value
                        );

                    const uniqueRef =
                        doc(
                            db,
                            UNIQUE_NUMBERS_COLLECTION,
                            uniqueDocId(
                                item.type,
                                number
                            )
                        );


                    const uniqueSnapshot =
                        await tx.get(
                            uniqueRef
                        );


                    if (
                        uniqueSnapshot.exists()
                    ) {

                        throw new Error(
                            "دا نمبر مخکې ثبت شوی دی."
                        );

                    }

                }


                tx.set(
                    recordRef,
                    firestoreData
                );


                for (
                    const item
                    of getUniqueItemsFromData(
                        data
                    )
                ) {

                    const number =
                        normalizeUniqueNumber(
                            item.value
                        );


                    tx.set(

                        doc(
                            db,
                            UNIQUE_NUMBERS_COLLECTION,
                            uniqueDocId(
                                item.type,
                                number
                            )
                        ),

                        {

                            type:
                                item.type,

                            number,

                            recordId:
                                recordRef.id,

                            createdByName:
                                currentAdmin.name,

                            createdByEmail:
                                currentAdmin.email,

                            createdAt:
                                serverTimestamp(),

                            updatedAt:
                                serverTimestamp()

                        }

                    );

                }

            }
        );


        return {

            success:
                true,

            message:
                "فورمه په بریالیتوب آنلاین ثبت شوه.",

            id:
                recordRef.id

        };

    } catch (error) {

        console.error(
            "Register Error:",
            error
        );


        return {

            success:
                false,

            message:
                error.message ||
                "فورمه ثبت نه شوه."

        };

    }

}


// ==========================================
// Update Registration
// ==========================================

async function updateRegistration(
    recordId,
    data
) {

    const id =
        cleanText(
            recordId
        );


    if (!id) {

        return {

            success:
                false,

            message:
                "د ریکارډ ID پیدا نه شو."

        };

    }


    try {

        const recordRef =
            doc(
                db,
                RECORDS_COLLECTION,
                id
            );


        await runTransaction(
            db,
            async tx => {

                const snapshot =
                    await tx.get(
                        recordRef
                    );


                if (
                    !snapshot.exists()
                ) {

                    throw new Error(
                        "ریکارډ پیدا نه شو."
                    );

                }


                const existing =
                    snapshot.data() ||
                    {};


                /*
                 * Locked Record
                 */
                if (
                    existing.editable ===
                        false &&

                    currentAdmin.role !==
                        ADMIN_ROLES.SUPERADMIN
                ) {

                    throw new Error(
                        "دا ریکارډ قفل دی؛ یوازې ستر اډمین یې بدلولی شي."
                    );

                }


                /*
                 * Hidden Record
                 */
                if (
                    existing.visibility
                        ?.hiddenFromAdmins ===
                        true &&

                    currentAdmin.role !==
                        ADMIN_ROLES.SUPERADMIN
                ) {

                    throw new Error(
                        "دا ریکارډ پټ دی؛ یوازې ستر اډمین ورته لاسرسی لري."
                    );

                }


                /*
                 * Old Unique Numbers
                 */
                const oldItems = [];


                oldItems.push({

                    type:
                        "formNumber",

                    value:
                        existing.formNumber

                });


                if (
                    existing.tazkiraType ===
                    TAZKIRA_TYPES.ELECTRONIC
                ) {

                    oldItems.push({

                        type:
                            "electronicTazkiraNumber",

                        value:
                            existing.electronicTazkiraNumber ||
                            existing.tazkira

                    });

                }


                if (
                    existing.tazkiraType ===
                    TAZKIRA_TYPES.PAPER
                ) {

                    oldItems.push({

                        type:
                            "paperTazkiraNumber",

                        value:
                            existing.paperTazkiraNumber

                    });

                }


                for (
                    const item
                    of oldItems
                ) {

                    const number =
                        normalizeUniqueNumber(
                            item.value
                        );


                    if (!number) {
                        continue;
                    }


                    tx.delete(

                        doc(
                            db,
                            UNIQUE_NUMBERS_COLLECTION,
                            uniqueDocId(
                                item.type,
                                number
                            )
                        )

                    );

                }


                /*
                 * New Unique Numbers
                 */
                for (
                    const item
                    of getUniqueItemsFromData(
                        data
                    )
                ) {

                    const number =
                        normalizeUniqueNumber(
                            item.value
                        );


                    const uniqueRef =
                        doc(
                            db,
                            UNIQUE_NUMBERS_COLLECTION,
                            uniqueDocId(
                                item.type,
                                number
                            )
                        );


                    const uniqueSnapshot =
                        await tx.get(
                            uniqueRef
                        );


                    if (
                        uniqueSnapshot.exists()
                    ) {

                        const uniqueData =
                            uniqueSnapshot.data() ||
                            {};


                        if (
                            cleanText(
                                uniqueData.recordId
                            ) !==
                            id
                        ) {

                            throw new Error(
                                "دا نمبر له وړاندې ثبت شوی دی."
                            );

                        }

                    }

                }


                const firestoreData =
                    buildFirestoreData(
                        data,
                        existing
                    );


                firestoreData.updatedAt =
                    serverTimestamp();

                firestoreData.updatedBy =
                    currentAdmin.uid;

                firestoreData.updatedByName =
                    currentAdmin.name;

                firestoreData.updatedByEmail =
                    currentAdmin.email;


                tx.update(
                    recordRef,
                    firestoreData
                );


                for (
                    const item
                    of getUniqueItemsFromData(
                        data
                    )
                ) {

                    const number =
                        normalizeUniqueNumber(
                            item.value
                        );


                    tx.set(

                        doc(
                            db,
                            UNIQUE_NUMBERS_COLLECTION,
                            uniqueDocId(
                                item.type,
                                number
                            )
                        ),

                        {

                            type:
                                item.type,

                            number,

                            recordId:
                                id,

                            createdByName:
                                existing.createdByName ||
                                currentAdmin.name,

                            createdByEmail:
                                existing.createdByEmail ||
                                currentAdmin.email,

                            updatedAt:
                                serverTimestamp()

                        },

                        {
                            merge:
                                true
                        }

                    );

                }

            }
        );


        return {

            success:
                true,

            message:
                "بدلونونه په بریالیتوب آنلاین خوندي شول."

        };

    } catch (error) {

        console.error(
            "Update Registration Error:",
            error
        );


        return {

            success:
                false,

            message:
                error.message ||
                "د ریکارډ د تازه کولو پر مهال ستونزه رامنځته شوه."

        };

    }

}


// ==========================================
// Load Record For Edit
// ==========================================

async function loadRecordForEdit(
    recordId
) {

    const id =
        cleanText(
            recordId
        );


    if (!id) {
        return;
    }


    loadingRecord =
        true;


    try {

        const ref =
            doc(
                db,
                RECORDS_COLLECTION,
                id
            );


        const snapshot =
            await getDoc(
                ref
            );


        if (
            !snapshot.exists()
        ) {

            throw new Error(
                "دا ریکارډ پیدا نه شو."
            );

        }


        const record =
            snapshot.data() ||
            {};


        if (
            record.visibility
                ?.hiddenFromAdmins ===
                true &&

            currentAdmin.role !==
                ADMIN_ROLES.SUPERADMIN
        ) {

            throw new Error(
                "دا ریکارډ پټ دی؛ یوازې ستر اډمین ورته لاسرسی لري."
            );

        }


        if (
            record.editable ===
                false &&

            currentAdmin.role !==
                ADMIN_ROLES.SUPERADMIN
        ) {

            throw new Error(
                "دا ریکارډ قفل دی؛ یوازې ستر اډمین یې بدلولی شي."
            );

        }


        populateForm(
            record
        );


        recordIdInput.value =
            id;

        editModeInput.value =
            "1";


        saveBtn.textContent =
            "💾 بدلونونه خوندي کړئ";

    } catch (error) {

        console.error(
            "Load Record Error:",
            error
        );


        showMessage(
            error.message ||
            "د ریکارډ د لوستلو پر مهال ستونزه رامنځته شوه.",
            "danger"
        );

    } finally {

        loadingRecord =
            false;

    }

}


// ==========================================
// Populate Form
// ==========================================

function populateForm(
    record
) {

    if (!record) {
        return;
    }


    formNumber.value =
        formatFormNumber(
            record.formNumber
        );


    category.value =
        cleanText(
            record.category
        );


    const person =
        record.person ||
        {};


    firstName.value =
        cleanText(
            person.firstName ||
            record.firstName
        );

    lastName.value =
        cleanText(
            person.lastName ||
            record.lastName
        );

    fatherName.value =
        cleanText(
            person.fatherName ||
            record.fatherName
        );

    grandfatherName.value =
        cleanText(
            person.grandfatherName ||
            record.grandfatherName
        );


    englishName.value =
        cleanText(
            person.englishName ||
            record.englishName
        );

    englishLastName.value =
        cleanText(
            person.englishLastName ||
            record.englishLastName
        );

    englishFatherName.value =
        cleanText(
            person.englishFatherName ||
            record.englishFatherName
        );

    englishGrandfatherName.value =
        cleanText(
            person.englishGrandfatherName ||
            record.englishGrandfatherName
        );


    birthDate.value =
        cleanText(
            person.birthDate ||
            record.birthDate
        );

    age.value =
        cleanText(
            person.age ||
            record.age
        );

    phone.value =
        cleanText(
            person.phone ||
            record.phone
        );


    originalProvince.value =
        cleanText(
            record.originalLocation
                ?.province
        );

    originalDistrict.value =
        cleanText(
            record.originalLocation
                ?.district
        );

    originalVillage.value =
        cleanText(
            record.originalLocation
                ?.village
        );


    currentProvince.value =
        cleanText(
            record.currentLocation
                ?.province
        );

    currentDistrict.value =
        cleanText(
            record.currentLocation
                ?.district
        );

    currentVillage.value =
        cleanText(
            record.currentLocation
                ?.village
        );


    currentJob.value =
        cleanText(
            record.currentJob
        );

    groupLeader.value =
        cleanText(
            record.groupLeader
        );

    jihadiHistory.value =
        cleanText(
            record.jihadiHistory
        );

    pdfCreationDate.value =
        cleanText(
            record.pdfCreationDate
        );


    const tType =
        cleanText(
            record.tazkiraType
        );


    if (
        tType ===
        TAZKIRA_TYPES.PAPER
    ) {

        setTazkiraMode(
            TAZKIRA_TYPES.PAPER
        );


        paperTazkiraNumber.value =
            cleanText(
                record.paperTazkiraNumber
            );

        paperTazkiraVolume.value =
            cleanText(
                record.paperTazkiraVolume
            );

        paperTazkiraPage.value =
            cleanText(
                record.paperTazkiraPage
            );

        paperTazkiraGana.value =
            cleanText(
                record.paperTazkiraGana
            );

    } else {

        setTazkiraMode(
            TAZKIRA_TYPES.ELECTRONIC
        );


        tazkira.value =
            formatElectronicTazkira(
                record.electronicTazkiraNumber ||
                record.tazkira ||
                person.tazkira
            );

    }


    /*
     * Field Config بیا apply کوو،
     * خو د Firestore order له مخې.
     */
    applyOnlineFieldConfig();


    populateCustomFields(
        record.customFields ||
        {}
    );

}


// ==========================================
// Validation / Messages
// ==========================================

function showMessage(
    message,
    type = "success"
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `alert alert-${type}`;

    formMessage.style.display =
        "block";


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


// ==========================================
// Submit
// ==========================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        formMessage.style.display =
            "none";


        if (
            loadingRecord
        ) {

            showMessage(
                "معلومات لا لوډېږي؛ مهرباني وکړئ.",
                "warning"
            );

            return;

        }


        saveBtn.disabled =
            true;


        const originalText =
            saveBtn.textContent;


        saveBtn.textContent =
            "⏳ ثبتېږي...";


        try {

            const data =
                collectFormData();


            /*
             * Form Number
             */
            if (
                !/^[0-9]+$/.test(
                    data.formNumber
                )
            ) {

                throw new Error(
                    "د فورمي نمبر باید یوازې ارقام ولري."
                );

            }


            if (
                await isUniqueNumberReserved(
                    "formNumber",
                    data.formNumber,
                    recordIdInput.value
                )
            ) {

                throw new Error(
                    "دا فورمي نمبر مخکې ثبت شوی دی."
                );

            }


            /*
             * Electronic Tazkira
             */
            if (
                data.tazkiraType ===
                TAZKIRA_TYPES.ELECTRONIC
            ) {

                if (
                    !ELECTRONIC_TAZKIRA_PATTERN.test(
                        data.electronicTazkiraNumber
                    )
                ) {

                    throw new Error(
                        "د برقي تذکرې بڼه باید 0000-0000-00000 وي."
                    );

                }


                if (
                    await isUniqueNumberReserved(
                        "electronicTazkiraNumber",
                        data.electronicTazkiraNumber,
                        recordIdInput.value
                    )
                ) {

                    throw new Error(
                        "دا برقي تذکرې نمبر مخکې ثبت شوی دی."
                    );

                }

            }


            /*
             * Paper Tazkira
             */
            if (
                data.tazkiraType ===
                TAZKIRA_TYPES.PAPER
            ) {

                const paperValues = [

                    data.paperTazkiraNumber,

                    data.paperTazkiraVolume,

                    data.paperTazkiraPage,

                    data.paperTazkiraGana

                ];


                if (
                    paperValues.some(
                        value =>
                            !cleanText(
                                value
                            )
                    )
                ) {

                    throw new Error(
                        "د کاغذي تذکرې ګڼه، جلد، صفحه او د ګڼې نمبر ټول لازم دي."
                    );

                }


                if (
                    paperValues.some(
                        value =>
                            !NUMERIC_ONLY_PATTERN.test(
                                value
                            )
                    )
                ) {

                    throw new Error(
                        "د کاغذي تذکرې ټولې شمېرې باید یوازې عددونه ولري."
                    );

                }


                if (
                    await isUniqueNumberReserved(
                        "paperTazkiraNumber",
                        data.paperTazkiraNumber,
                        recordIdInput.value
                    )
                ) {

                    throw new Error(
                        "دا کاغذي تذکرې ګڼه مخکې ثبت شوې ده."
                    );

                }

            }


            /*
             * Jihadi History
             */
            if (
                data.category ===
                "مجاهد"
            ) {

                const config =
                    onlineFieldConfig
                        .jihadiHistory ||
                    DEFAULT_FIELD_CONFIG
                        .jihadiHistory;


                if (
                    !config.locked &&
                    !cleanText(
                        data.jihadiHistory
                    )
                ) {

                    throw new Error(
                        "د «مجاهد» کټګورۍ لپاره جهادي سابقه لازمه ده."
                    );

                }

            }


            /*
             * Custom Required
             */
            for (
                const [
                    key,
                    config
                ]
                of Object.entries(
                    onlineFieldConfig
                )
            ) {

                if (
                    config.deletable !==
                    true
                ) {
                    continue;
                }


                if (
                    config.hidden ||
                    config.locked
                ) {
                    continue;
                }


                if (
                    !config.required
                ) {
                    continue;
                }


                if (
                    !cleanText(
                        data.customFields
                            ?. [key]
                    )
                ) {

                    throw new Error(
                        `د «${config.label || key}» ډکول اجباري دي.`
                    );

                }

            }


            /*
             * Existing Validation
             */
            const validation =
                validateRegistration(
                    data
                );


            if (
                !validation.valid
            ) {

                throw new Error(

                    Array.isArray(
                        validation.errors
                    )

                        ? validation.errors.join(
                            " "
                        )

                        : (
                            validation.message ||
                            "د فورم معلومات سم نه دي."
                        )

                );

            }


            let result;


            if (
                editModeInput.value ===
                    "1" &&

                recordIdInput.value
            ) {

                result =
                    await updateRegistration(
                        recordIdInput.value,
                        data
                    );

            } else {

                result =
                    await registerPerson(
                        data
                    );

            }


            if (
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "فورمه ثبت نه شوه."
                );

            }


            showMessage(
                result.message,
                "success"
            );


            form.reset();


            recordIdInput.value =
                "";

            editModeInput.value =
                "0";


            setTazkiraMode(
                TAZKIRA_TYPES.ELECTRONIC
            );


            updateJihadiHistory();


            /*
             * Settings بیا apply،
             * ترڅو ترتیب هماغه پاتې شي.
             */
            applyOnlineFieldConfig();


            setTodayPdfDate();

        } catch (error) {

            console.error(
                "Register Submit Error:",
                error
            );


            showMessage(
                error.message ||
                "د فورم د ثبت پر مهال ستونزه رامنځته شوه.",
                "danger"
            );

        } finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                editModeInput.value ===
                    "1"

                    ? "💾 بدلونونه خوندي کړئ"

                    : originalText;

        }

    }
);


// ==========================================
// Inputs
// ==========================================

formNumber.addEventListener(
    "input",
    () => {

        formNumber.value =
            formatFormNumber(
                formNumber.value
            );

    }
);


birthDate.addEventListener(
    "input",
    () => {

        let value =
            birthDate.value
                .replace(
                    /[^0-9]/g,
                    ""
                )
                .substring(
                    0,
                    8
                );


        if (
            value.length > 6
        ) {

            value =
                value.substring(
                    0,
                    4
                ) +
                "/" +
                value.substring(
                    4,
                    6
                ) +
                "/" +
                value.substring(
                    6
                );

        } else if (
            value.length > 4
        ) {

            value =
                value.substring(
                    0,
                    4
                ) +
                "/" +
                value.substring(
                    4
                );

        }


        birthDate.value =
            value;

    }
);


tazkira.addEventListener(
    "input",
    () => {

        tazkira.value =
            formatElectronicTazkira(
                tazkira.value
            );

    }
);


[
    paperTazkiraNumber,

    paperTazkiraVolume,

    paperTazkiraPage,

    paperTazkiraGana

]
.forEach(
    field => {

        field?.addEventListener(
            "input",
            () => {

                field.value =
                    formatPaperNumber(
                        field.value
                    );

            }
        );

    }
);


// ==========================================
// Tazkira Events
// ==========================================

tazkiraTypeElectronic?.addEventListener(
    "change",
    () =>
        setTazkiraMode(
            TAZKIRA_TYPES.ELECTRONIC
        )
);


tazkiraTypePaper?.addEventListener(
    "change",
    () =>
        setTazkiraMode(
            TAZKIRA_TYPES.PAPER
        )
);


category?.addEventListener(
    "change",
    updateJihadiHistory
);


// ==========================================
// Reset
// ==========================================

resetBtn.addEventListener(
    "click",
    () => {

        setTimeout(
            () => {

                setTazkiraMode(
                    TAZKIRA_TYPES.ELECTRONIC
                );

                updateJihadiHistory();

                applyOnlineFieldConfig();

                setTodayPdfDate();

            },
            0
        );

    }
);


// ==========================================
// Navigation
// ==========================================

document
    .getElementById(
        "dashboardBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./dashboard.html";

        }
    );


document
    .getElementById(
        "dashboardMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./dashboard.html";

        }
    );


document
    .getElementById(
        "formicMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./formic.html";

        }
    );


document
    .getElementById(
        "registerMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./register.html";

        }
    );


document
    .getElementById(
        "searchMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./search.html";

        }
    );


document
    .getElementById(
        "reportsMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./reports.html";

        }
    );


document
    .getElementById(
        "adminMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./admin.html";

        }
    );


document
    .getElementById(
        "settingsMenuBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "./settings.html";

        }
    );


backBtn.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


refreshBtn.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


// ==========================================
// Logout
// ==========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        logoutBtn.disabled =
            true;


        try {

            const result =
                await logoutUser();


            if (
                result.success
            ) {

                window.location.href =
                    "./index.html";

                return;

            }


            showMessage(
                result.message ||
                "له سیستم څخه وتل ناکام شول.",
                "danger"
            );

        } catch (error) {

            console.error(
                "Logout Error:",
                error
            );


            showMessage(
                "له سیستم څخه وتل ناکام شول.",
                "danger"
            );

        } finally {

            logoutBtn.disabled =
                false;

        }

    }
);


// ==========================================
// Today's PDF Date
// ==========================================

function setTodayPdfDate() {

    if (
        pdfCreationDate.value
    ) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        )
        .padStart(
            2,
            "0"
        );


    pdfCreationDate.value =
        `${year}-${month}-${day}`;

}


// ==========================================
// Authentication
// ==========================================

listenAuth(
    async session => {

        if (!session) {

            window.location.href =
                "./index.html";

            return;

        }


        try {

            await initializeSettings();


            const user =
                auth.currentUser ||
                session.user;


            if (
                !user?.uid
            ) {

                throw new Error(
                    "د کاروونکي حساب پیدا نه شو."
                );

            }


            const adminRef =
                doc(
                    db,
                    ADMINS_COLLECTION,
                    user.uid
                );


            const adminSnapshot =
                await getDoc(
                    adminRef
                );


            if (
                !adminSnapshot.exists()
            ) {

                throw new Error(
                    "ستاسو اډمین پروفایل پیدا نه شو."
                );

            }


            const admin =
                adminSnapshot.data() ||
                {};


            if (
                admin.active === false
            ) {

                throw new Error(
                    "ستاسو حساب غیر فعال دی."
                );

            }


            currentAdmin = {

                uid:
                    cleanText(
                        admin.uid ||
                        user.uid
                    ),

                name:
                    cleanText(
                        admin.name ||
                        user.displayName
                    ) ||
                    "نامعلوم اډمین",

                email:
                    cleanText(
                        admin.email ||
                        user.email
                    ),

                role:
                    cleanText(
                        admin.role
                    ).toLowerCase()

            };


            /*
             * لومړی آنلاین Settings لوډ.
             */
            await loadOnlineFieldConfig();


            /*
             * بیا Edit Record.
             */
            const params =
                new URLSearchParams(
                    window.location.search
                );


            const recordId =
                params.get(
                    "recordId"
                );


            if (
                recordId
            ) {

                await loadRecordForEdit(
                    recordId
                );

            }

        } catch (error) {

            console.error(
                "Register Authentication Error:",
                error
            );


            showMessage(
                error.message ||
                "د سیستم د آنلاین تنظیماتو د لوډ پر مهال ستونزه رامنځته شوه.",
                "danger"
            );

        }

    }
);


// ==========================================
// Initial Setup
// ==========================================

loadProvinces();

setTazkiraMode(
    TAZKIRA_TYPES.ELECTRONIC
);

updateJihadiHistory();

setTodayPdfDate();