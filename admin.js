// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت سیسټم
// admin.js
// اصلي آنلاین Admin + Records + Fields Engine
// ==========================================

import { db, auth } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    writeAudit,
    AUDIT_ACTIONS
} from "./audit.js";

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

const ADMINS_COLLECTION = "admins";
const RECORDS_COLLECTION = "records";
const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "system";


// ==========================================
// Roles
// ==========================================

export const ADMIN_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    USER: "user"
};


// ==========================================
// Field Sections
// ==========================================

const FIELD_SECTIONS = {

    person: "د فورم معلومات",

    originalLocation: "اصلي ځای",

    currentLocation: "فعلي ځای",

    work: "د کار او اړوند معلومات",

    pdf: "د PDF معلومات"

};


// ==========================================
// Tazkira Protected Fields
// دا فیلډونه باید د person برخه کې پاتې شي
// خو د person برخې دننه یې موقعیت بدلېدای شي.
// ==========================================

const TAZKIRA_PROTECTED_FIELDS = [

    "tazkiraType",
    "tazkira",
    "paperTazkiraNumber",
    "paperTazkiraVolume",
    "paperTazkiraPage",
    "paperTazkiraGana"

];


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
// State
// ==========================================

let currentSessionAdmin = null;

let superAdminAllowed = false;

let adminAllowed = false;

let currentSystemSettings = {
    schemaVersion: 4,

    globalPrivacy: {
        hideFromAdmins: false,
        hideFromStaff: false,
        hideFromUsers: false
    },

    deletedFields: [],

    fieldConfig:
        structuredClone(
            DEFAULT_FIELD_CONFIG
        )
};

let currentAdmins = [];

let currentRecords = [];


// ==========================================
// DOM
// ==========================================

const adminMessage =
    document.getElementById(
        "adminMessage"
    );

const totalAdminsEl =
    document.getElementById(
        "totalAdmins"
    );

const activeAdminsEl =
    document.getElementById(
        "activeAdmins"
    );

const superAdminsEl =
    document.getElementById(
        "superAdmins"
    );

const adminsCountEl =
    document.getElementById(
        "adminsCount"
    );

const totalRecordsEl =
    document.getElementById(
        "totalRecords"
    );

const editableRecordsEl =
    document.getElementById(
        "editableRecords"
    );

const lockedRecordsEl =
    document.getElementById(
        "lockedRecords"
    );

const hiddenRecordsEl =
    document.getElementById(
        "hiddenRecords"
    );

const currentUid =
    document.getElementById(
        "currentUid"
    );

const currentEmail =
    document.getElementById(
        "currentEmail"
    );

const currentName =
    document.getElementById(
        "currentName"
    );

const currentRole =
    document.getElementById(
        "currentRole"
    );

const currentStatus =
    document.getElementById(
        "currentStatus"
    );

const permissionNote =
    document.getElementById(
        "permissionNote"
    );

const createAdminForm =
    document.getElementById(
        "createAdminForm"
    );

const adminUid =
    document.getElementById(
        "adminUid"
    );

const adminEmail =
    document.getElementById(
        "adminEmail"
    );

const adminName =
    document.getElementById(
        "adminName"
    );

const adminRole =
    document.getElementById(
        "adminRole"
    );

const createAdminBtn =
    document.getElementById(
        "createAdminBtn"
    );

const clearAdminFormBtn =
    document.getElementById(
        "clearAdminFormBtn"
    );

const adminsTableBody =
    document.getElementById(
        "adminsTableBody"
    );

const adminsBadge =
    document.getElementById(
        "adminsBadge"
    );

const recordsTableBody =
    document.getElementById(
        "recordsTableBody"
    );

const recordsBadge =
    document.getElementById(
        "recordsBadge"
    );

const recordFilter =
    document.getElementById(
        "recordFilter"
    );

const recordsTableWrap =
    document.getElementById(
        "recordsTableWrap"
    );

const recordsLockBox =
    document.getElementById(
        "recordsLockBox"
    );

const privacyBadge =
    document.getElementById(
        "privacyBadge"
    );

const hideFromAdmins =
    document.getElementById(
        "hideFromAdmins"
    );

const hideFromStaff =
    document.getElementById(
        "hideFromStaff"
    );

const hideFromUsers =
    document.getElementById(
        "hideFromUsers"
    );

const savePrivacyBtn =
    document.getElementById(
        "savePrivacyBtn"
    );

const fieldsBadge =
    document.getElementById(
        "fieldsBadge"
    );

const fieldsTable =
    document.getElementById(
        "fieldsTable"
    );

const addFieldBtn =
    document.getElementById(
        "addFieldBtn"
    );

const saveFieldsBtn =
    document.getElementById(
        "saveFieldsBtn"
    );

const resetFieldsBtn =
    document.getElementById(
        "resetFieldsBtn"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// ==========================================
// Helpers
// ==========================================

function normalizeText(value) {

    return String(
        value ?? ""
    ).trim();

}

function normalizeRole(value) {

    return normalizeText(
        value
    ).toLowerCase();

}

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function clone(value) {

    return structuredClone(
        value
    );

}

function isValidRole(role) {

    return Object.values(
        ADMIN_ROLES
    ).includes(
        normalizeRole(role)
    );

}

function roleLabel(role) {

    const value =
        normalizeRole(
            role
        );

    if (
        value ===
        ADMIN_ROLES.SUPERADMIN
    ) {
        return "ستر اډمین";
    }

    if (
        value ===
        ADMIN_ROLES.ADMIN
    ) {
        return "اډمین";
    }

    return "کاروونکی";

}

function roleBadgeClass(role) {

    const value =
        normalizeRole(
            role
        );

    if (
        value ===
        ADMIN_ROLES.SUPERADMIN
    ) {
        return "badge-danger";
    }

    if (
        value ===
        ADMIN_ROLES.ADMIN
    ) {
        return "badge-warning";
    }

    return "badge-info";

}


// ==========================================
// Settings
// ==========================================

function getDefaultSettings() {

    return {

        schemaVersion: 4,

        globalPrivacy: {

            hideFromAdmins: false,
            hideFromStaff: false,
            hideFromUsers: false

        },

        deletedFields: [],

        fieldConfig:
            clone(
                DEFAULT_FIELD_CONFIG
            )

    };

}


// ==========================================
// Normalize Field Config
// ==========================================

function normalizeFieldConfig(
    raw = {},
    deletedFields = []
) {

    const result = {};

    const incoming =
        raw &&
        typeof raw === "object"
            ? raw
            : {};

    const deleted =
        new Set(
            Array.isArray(
                deletedFields
            )
                ? deletedFields
                : []
        );

    /*
     * اصلي فیلډونه تل موجود وي.
     * د پخواني Firestore position/order دواړه
     * ملاتړ کېږي.
     */
    for (
        const key
        of Object.keys(
            DEFAULT_FIELD_CONFIG
        )
    ) {

        const incomingField =
            incoming[key] || {};

        result[key] = {

            ...DEFAULT_FIELD_CONFIG[key],

            ...incomingField,

            order:
                Number(
                    incomingField.order ??
                    incomingField.position ??
                    DEFAULT_FIELD_CONFIG[key]
                        .order
                )

        };

    }

    /*
     * Custom Fields
     */
    for (
        const key
        of Object.keys(
            incoming
        )
    ) {

        if (
            result[key]
        ) {
            continue;
        }

        if (
            deleted.has(key)
        ) {
            continue;
        }

        const data =
            incoming[key] || {};

        result[key] = {

            label:
                normalizeText(
                    data.label ||
                    key
                ),

            required:
                Boolean(
                    data.required
                ),

            hidden:
                Boolean(
                    data.hidden
                ),

            locked:
                Boolean(
                    data.locked
                ),

            deletable:
                true,

            section:
                FIELD_SECTIONS[
                    data.section
                ]
                    ? data.section
                    : "work",

            order:
                Number(
                    data.order ??
                    data.position ??
                    999
                )

        };

    }

    return result;

}


// ==========================================
// Normalize Position Numbers
// هره برخه خپل مستقل ترتیب لري.
// ==========================================

function normalizeSectionOrders(
    config
) {

    const groups = {};

    for (
        const [key, field]
        of Object.entries(
            config
        )
    ) {

        const section =
            FIELD_SECTIONS[field.section]
                ? field.section
                : "person";

        field.section =
            section;

        if (
            !groups[section]
        ) {

            groups[section] = [];

        }

        groups[section].push({

            key,

            field

        });

    }

    for (
        const section
        of Object.keys(
            groups
        )
    ) {

        groups[section].sort(
            (a, b) => {

                const aOrder =
                    Number(
                        a.field.order || 999
                    );

                const bOrder =
                    Number(
                        b.field.order || 999
                    );

                if (
                    aOrder !==
                    bOrder
                ) {

                    return (
                        aOrder -
                        bOrder
                    );

                }

                return a.key.localeCompare(
                    b.key
                );

            }
        );

        groups[section].forEach(
            (item, index) => {

                item.field.order =
                    index + 1;

                /*
                 * position هم خوندي کوو،
                 * څو دواړه نومونه backward-compatible وي.
                 */
                item.field.position =
                    index + 1;

            }
        );

    }

    return config;

}


// ==========================================
// Normalize Settings
// ==========================================

function normalizeSettings(
    data = {}
) {

    const deletedFields =
        Array.isArray(
            data.deletedFields
        )
            ? [
                ...new Set(
                    data.deletedFields
                        .map(
                            key =>
                                normalizeText(
                                    key
                                )
                        )
                        .filter(Boolean)
                )
            ]
            : [];

    const fieldConfig =
        normalizeFieldConfig(
            data.fieldConfig || {},
            deletedFields
        );

    normalizeSectionOrders(
        fieldConfig
    );

    return {

        schemaVersion: 4,

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

        deletedFields,

        fieldConfig

    };

}


// ==========================================
// Authentication
// ==========================================

export async function getCurrentAdmin() {

    try {

        const user =
            auth.currentUser;

        if (!user) {
            return null;
        }

        const ref =
            doc(
                db,
                ADMINS_COLLECTION,
                user.uid
            );

        const snapshot =
            await getDoc(ref);

        if (
            !snapshot.exists()
        ) {
            return null;
        }

        const data =
            snapshot.data() || {};

        if (
            data.active === false
        ) {
            return null;
        }

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

            ...data,

            uid:
                normalizeText(
                    data.uid ||
                    user.uid
                ),

            email:
                normalizeText(
                    data.email ||
                    user.email
                ),

            role

        };

    } catch (error) {

        console.error(
            "Get Current Admin Error:",
            error
        );

        return null;

    }

}

export async function isSuperAdmin() {

    const admin =
        await getCurrentAdmin();

    return Boolean(
        admin &&
        admin.role ===
            ADMIN_ROLES.SUPERADMIN
    );

}

export async function isAdmin() {

    const admin =
        await getCurrentAdmin();

    return Boolean(
        admin &&
        (
            admin.role ===
                ADMIN_ROLES.SUPERADMIN ||

            admin.role ===
                ADMIN_ROLES.ADMIN
        )
    );

}


// ==========================================
// Settings API
// ==========================================

export async function getSystemSettings() {

    try {

        const ref =
            doc(
                db,
                SETTINGS_COLLECTION,
                SETTINGS_DOC
            );

        const snapshot =
            await getDoc(ref);

        if (
            !snapshot.exists()
        ) {

            return getDefaultSettings();

        }

        return normalizeSettings(
            snapshot.data() || {}
        );

    } catch (error) {

        console.error(
            "Get System Settings Error:",
            error
        );

        return getDefaultSettings();

    }

}

export async function saveSystemSettings(
    settings = {}
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین تنظیمات بدلولی شي."

        };

    }

    try {

        const normalized =
            normalizeSettings(
                settings
            );

        await setDoc(

            doc(
                db,
                SETTINGS_COLLECTION,
                SETTINGS_DOC
            ),

            {

                schemaVersion:
                    4,

                globalPrivacy:
                    normalized.globalPrivacy,

                deletedFields:
                    normalized.deletedFields,

                fieldConfig:
                    normalized.fieldConfig,

                updatedAt:
                    serverTimestamp()

            },

            {
                merge: true
            }

        );

        try {

            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                "د سیستم آنلاین تنظیمات بدل شول"
            );

        } catch (auditError) {

            console.error(
                "Audit Error:",
                auditError
            );

        }

        return {

            success: true,

            message:
                "بدلونونه په Firestore کې آنلاین خوندي شول.",

            settings:
                normalized

        };

    } catch (error) {

        console.error(
            "Save System Settings Error:",
            error
        );

        return {

            success: false,

            message:
                error.message ||
                "تنظیمات خوندي نه شول."

        };

    }

}


// ==========================================
// Admin Management
// ==========================================

async function getAdmins() {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            admins: [],

            message:
                "یوازې ستر اډمین د اډمینانو لست لیدلی شي."

        };

    }

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    ADMINS_COLLECTION
                )
            );

        const admins =
            snapshot.docs
                .map(
                    item => ({
                        id:
                            item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        normalizeText(
                            a.name ||
                            a.email ||
                            a.id
                        )
                        .localeCompare(
                            normalizeText(
                                b.name ||
                                b.email ||
                                b.id
                            )
                        )
                );

        return {

            success: true,

            admins

        };

    } catch (error) {

        return {

            success: false,

            admins: [],

            message:
                error.message ||
                "د اډمینانو لست ترلاسه نه شو."

        };

    }

}

async function createAdminProfile(
    {
        uid,
        email,
        role,
        name
    }
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین نوی اډمین جوړولی شي."

        };

    }

    uid =
        normalizeText(uid);

    email =
        normalizeText(email)
            .toLowerCase();

    role =
        normalizeRole(role);

    name =
        normalizeText(name);

    if (!uid) {

        return {
            success: false,
            message:
                "د حساب پېژندشمېره اجباري ده."
        };

    }

    if (!email) {

        return {
            success: false,
            message:
                "ایمیل اجباري دی."
        };

    }

    if (
        !isValidRole(
            role
        )
    ) {

        return {
            success: false,
            message:
                "صلاحیت ناسم دی."
        };

    }

    const ref =
        doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

    const snapshot =
        await getDoc(ref);

    if (
        snapshot.exists()
    ) {

        return {
            success: false,
            message:
                "دا کاروونکی لا دمخه ثبت شوی دی."
        };

    }

    await setDoc(
        ref,
        {
            uid,
            email,
            name,
            role,
            active: true,
            createdAt:
                serverTimestamp(),
            updatedAt:
                serverTimestamp()
        }
    );

    return {

        success: true,

        message:
            "اډمین پروفایل په بریالیتوب آنلاین جوړ شو."

    };

}

async function updateAdminRole(
    uid,
    role
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین د صلاحیت بدلولو اجازه لري."

        };

    }

    uid =
        normalizeText(uid);

    role =
        normalizeRole(role);

    if (
        !isValidRole(
            role
        )
    ) {

        return {

            success: false,

            message:
                "صلاحیت ناسم دی."

        };

    }

    if (
        uid ===
        auth.currentUser?.uid &&
        role !==
        ADMIN_ROLES.SUPERADMIN
    ) {

        return {

            success: false,

            message:
                "خپل ستر اډمین صلاحیت نه شئ کمولی."

        };

    }

    await updateDoc(

        doc(
            db,
            ADMINS_COLLECTION,
            uid
        ),

        {

            role,

            updatedAt:
                serverTimestamp()

        }

    );

    return {

        success: true,

        message:
            "د کاروونکي صلاحیت آنلاین بدل شو."

    };

}

async function setAdminStatus(
    uid,
    active
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین د کاروونکي حالت بدلولی شي."

        };

    }

    if (
        uid ===
        auth.currentUser?.uid &&
        !active
    ) {

        return {

            success: false,

            message:
                "خپل ستر اډمین حساب غیر فعالولی نه شئ."

        };

    }

    await updateDoc(

        doc(
            db,
            ADMINS_COLLECTION,
            uid
        ),

        {

            active:
                Boolean(
                    active
                ),

            updatedAt:
                serverTimestamp()

        }

    );

    return {

        success: true,

        message:
            active
                ? "کاروونکی فعال شو."
                : "کاروونکی غیر فعال شو."

    };

}

async function deleteAdminProfile(
    uid
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین کاروونکی حذف کولی شي."

        };

    }

    if (
        uid ===
        auth.currentUser?.uid
    ) {

        return {

            success: false,

            message:
                "خپل ستر اډمین حساب نه شئ حذف کولی."

        };

    }

    await deleteDoc(

        doc(
            db,
            ADMINS_COLLECTION,
            uid
        )

    );

    return {

        success: true,

        message:
            "د اډمین پروفایل حذف شو."

    };

}


// ==========================================
// Records
// ==========================================

async function getRecords() {

    try {

        if (
            superAdminAllowed
        ) {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        RECORDS_COLLECTION
                    )
                );

            return {

                success: true,

                records:
                    snapshot.docs.map(
                        item => ({
                            id:
                                item.id,
                            ...item.data()
                        })
                    )

            };

        }

        if (
            currentSystemSettings
                .globalPrivacy
                ?.hideFromAdmins
        ) {

            return {

                success: true,

                records: []

            };

        }

        const q =
            query(

                collection(
                    db,
                    RECORDS_COLLECTION
                ),

                where(
                    "visibility.hiddenFromAdmins",
                    "==",
                    false
                )

            );

        const snapshot =
            await getDocs(
                q
            );

        return {

            success: true,

            records:
                snapshot.docs.map(
                    item => ({
                        id:
                            item.id,
                        ...item.data()
                    })
                )

        };

    } catch (error) {

        console.error(
            "Get Records Error:",
            error
        );

        return {

            success: false,

            records: [],

            message:
                error.message ||
                "د ریکارډونو لست ترلاسه نه شو."

        };

    }

}

async function updateRecordEditable(
    recordId,
    editable
) {

    if (
        !adminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې اډمینان د ریکارډ قفل او خلاصول کولی شي."

        };

    }

    const ref =
        doc(
            db,
            RECORDS_COLLECTION,
            normalizeText(
                recordId
            )
        );

    const snapshot =
        await getDoc(ref);

    if (
        !snapshot.exists()
    ) {

        return {

            success: false,

            message:
                "ریکارډ پیدا نه شو."

        };

    }

    await updateDoc(

        ref,

        {

            editable:
                Boolean(
                    editable
                ),

            updatedAt:
                serverTimestamp()

        }

    );

    return {

        success: true,

        message:
            editable
                ? "ریکارډ خلاص شو."
                : "ریکارډ قفل شو."

    };

}

async function updateRecordVisibility(
    recordId,
    hidden
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین د ریکارډ پټ/ښکاره حالت بدلولی شي."

        };

    }

    const ref =
        doc(
            db,
            RECORDS_COLLECTION,
            normalizeText(
                recordId
            )
        );

    const snapshot =
        await getDoc(ref);

    if (
        !snapshot.exists()
    ) {

        return {

            success: false,

            message:
                "ریکارډ پیدا نه شو."

        };

    }

    const data =
        snapshot.data() || {};

    await updateDoc(

        ref,

        {

            visibility: {

                ...(data.visibility || {}),

                hiddenFromAdmins:
                    Boolean(
                        hidden
                    )

            },

            updatedAt:
                serverTimestamp()

        }

    );

    return {

        success: true,

        message:
            hidden
                ? "ریکارډ پټ شو."
                : "ریکارډ ښکاره شو."

    };

}

async function deleteRecord(
    recordId
) {

    if (
        !superAdminAllowed
    ) {

        return {

            success: false,

            message:
                "یوازې ستر اډمین ریکارډ حذف کولی شي."

        };

    }

    const ref =
        doc(
            db,
            RECORDS_COLLECTION,
            normalizeText(
                recordId
            )
        );

    const snapshot =
        await getDoc(ref);

    if (
        !snapshot.exists()
    ) {

        return {

            success: false,

            message:
                "ریکارډ پیدا نه شو."

        };

    }

    await deleteDoc(
        ref
    );

    return {

        success: true,

        message:
            "ریکارډ په بشپړ ډول حذف شو."

    };

}


// ==========================================
// Record Helpers
// ==========================================

function getPersonName(
    record
) {

    const person =
        record.person || {};

    return [

        normalizeText(
            person.firstName ||
            record.firstName
        ),

        normalizeText(
            person.lastName ||
            record.lastName
        )

    ]
        .filter(Boolean)
        .join(" ") || "—";

}

function getRecordTazkira(
    record
) {

    const type =
        normalizeText(
            record.tazkiraType
        );

    if (
        type === "paper"
    ) {

        return [

            `ګڼه: ${
                normalizeText(
                    record.paperTazkiraNumber
                ) || "—"
            }`,

            `جلد: ${
                normalizeText(
                    record.paperTazkiraVolume
                ) || "—"
            }`,

            `صفحه: ${
                normalizeText(
                    record.paperTazkiraPage
                ) || "—"
            }`,

            `د ګڼې نمبر: ${
                normalizeText(
                    record.paperTazkiraGana
                ) || "—"
            }`

        ].join(" / ");

    }

    return (

        normalizeText(
            record.electronicTazkiraNumber ||
            record.tazkira
        ) || "—"

    );

}

function filterRecords(
    records,
    searchText
) {

    const q =
        normalizeText(
            searchText
        )
            .toLowerCase();

    if (!q) {
        return records;
    }

    return records.filter(
        record => {

            const person =
                record.person || {};

            const values = [

                record.formNumber,

                record.category,

                record.firstName,

                record.lastName,

                person.firstName,

                person.lastName,

                person.fatherName,

                person.grandfatherName,

                record.tazkira,

                record.electronicTazkiraNumber,

                record.paperTazkiraNumber,

                record.paperTazkiraVolume,

                record.paperTazkiraPage,

                record.paperTazkiraGana

            ];

            return values
                .map(
                    value =>
                        normalizeText(
                            value
                        )
                            .toLowerCase()
                )
                .join(" | ")
                .includes(
                    q
                );

        }
    );

}

function renderRecords(
    records
) {

    currentRecords =
        Array.isArray(
            records
        )
            ? [
                ...records
            ].sort(
                (a, b) =>
                    (
                        b.createdAt?.toMillis
                            ? b.createdAt.toMillis()
                            : 0
                    ) -
                    (
                        a.createdAt?.toMillis
                            ? a.createdAt.toMillis()
                            : 0
                    )
            )
            : [];

    totalRecordsEl.textContent =
        currentRecords.length;

    editableRecordsEl.textContent =
        currentRecords.filter(
            record =>
                record.editable !== false
        ).length;

    lockedRecordsEl.textContent =
        currentRecords.filter(
            record =>
                record.editable === false
        ).length;

    hiddenRecordsEl.textContent =
        currentRecords.filter(
            record =>
                record.visibility
                    ?.hiddenFromAdmins === true
        ).length;

    const filtered =
        filterRecords(
            currentRecords,
            recordFilter.value
        );

    recordsBadge.textContent =
        `${filtered.length} ریکارډ`;

    if (
        !filtered.length
    ) {

        recordsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center"
                >
                    هېڅ ریکارډ پیدا نه شو.
                </td>

            </tr>

        `;

        return;

    }

    recordsTableBody.innerHTML =
        filtered.map(
            record => {

                const editable =
                    record.editable !== false;

                const hidden =
                    record.visibility
                        ?.hiddenFromAdmins === true;

                const canEdit =
                    superAdminAllowed ||
                    (
                        adminAllowed &&
                        editable &&
                        !hidden
                    );

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                record.formNumber || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getPersonName(
                                    record
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                getRecordTazkira(
                                    record
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.category || "—"
                            )}
                        </td>

                        <td>

                            <span
                                class="badge ${
                                    editable
                                        ? "badge-success"
                                        : "badge-danger"
                                }"
                            >
                                ${
                                    editable
                                        ? "✅ سمون وړ"
                                        : "🔒 قفل"
                                }
                            </span>

                        </td>

                        <td>

                            <span
                                class="badge ${
                                    hidden
                                        ? "badge-warning"
                                        : "badge-info"
                                }"
                            >
                                ${
                                    hidden
                                        ? "🙈 پټ"
                                        : "👁️ ښکاره"
                                }
                            </span>

                        </td>

                        <td>

                            <div
                                class="admin-table-actions"
                            >

                                <a
                                    class="btn btn-primary"
                                    href="${
                                        canEdit
                                            ? `./register.html?recordId=${encodeURIComponent(record.id)}`
                                            : "#"
                                    }"
                                >
                                    ✏️ سمول
                                </a>

                                <button
                                    type="button"
                                    class="btn ${
                                        editable
                                            ? "btn-secondary"
                                            : "btn-success"
                                    }"
                                    data-action="toggle-editable"
                                    data-id="${escapeHtml(record.id)}"
                                    ${
                                        adminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    ${
                                        editable
                                            ? "🔒 قفل"
                                            : "🔓 خلاصول"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-warning"
                                    data-action="toggle-visibility"
                                    data-id="${escapeHtml(record.id)}"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    ${
                                        hidden
                                            ? "👁️ ښکاره"
                                            : "🙈 پټول"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger"
                                    data-action="delete-record"
                                    data-id="${escapeHtml(record.id)}"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    🗑️ حذف
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


// ==========================================
// Field Helpers
// ==========================================

function getSectionEntries(
    section
) {

    return Object.entries(
        currentSystemSettings
            .fieldConfig
    )
        .filter(
            ([, field]) =>
                (
                    field.section ||
                    "person"
                ) === section
        )
        .sort(
            (a, b) => {

                const aOrder =
                    Number(
                        a[1].order || 999
                    );

                const bOrder =
                    Number(
                        b[1].order || 999
                    );

                if (
                    aOrder !==
                    bOrder
                ) {

                    return (
                        aOrder -
                        bOrder
                    );

                }

                return a[0].localeCompare(
                    b[0]
                );

            }
        );

}


// ==========================================
// Section Options
// ==========================================

function fieldSectionOptions(
    selected
) {

    return Object.entries(
        FIELD_SECTIONS
    )
        .map(
            ([key, label]) => `

                <option
                    value="${escapeHtml(key)}"
                    ${
                        key === selected
                            ? "selected"
                            : ""
                    }
                >
                    ${escapeHtml(label)}
                </option>

            `
        )
        .join("");

}


// ==========================================
// Field Position Move
// ==========================================

function moveFieldToPosition(
    key,
    requestedPosition
) {

    if (
        !superAdminAllowed
    ) {

        return;

    }

    const config =
        currentSystemSettings
            .fieldConfig;

    const field =
        config[key];

    if (!field) {
        return;
    }

    const section =
        FIELD_SECTIONS[
            field.section
        ]
            ? field.section
            : "person";

    const entries =
        getSectionEntries(
            section
        );

    const currentIndex =
        entries.findIndex(
            ([entryKey]) =>
                entryKey === key
        );

    if (
        currentIndex < 0
    ) {

        return;

    }

    let newPosition =
        Number(
            requestedPosition
        );

    if (
        !Number.isFinite(
            newPosition
        )
    ) {

        newPosition =
            currentIndex + 1;

    }

    newPosition =
        Math.max(
            1,
            Math.min(
                entries.length,
                Math.round(
                    newPosition
                )
            )
        );

    const orderedKeys =
        entries.map(
            ([entryKey]) =>
                entryKey
        );

    orderedKeys.splice(
        currentIndex,
        1
    );

    orderedKeys.splice(
        newPosition - 1,
        0,
        key
    );

    orderedKeys.forEach(
        (
            entryKey,
            index
        ) => {

            config[
                entryKey
            ].order =
                index + 1;

            config[
                entryKey
            ].position =
                index + 1;

        }
    );

}


// ==========================================
// Move Up / Down
// ==========================================

function moveField(
    key,
    direction
) {

    if (
        !superAdminAllowed
    ) {
        return;
    }

    const field =
        currentSystemSettings
            .fieldConfig[key];

    if (!field) {
        return;
    }

    const section =
        field.section ||
        "person";

    const entries =
        getSectionEntries(
            section
        );

    const index =
        entries.findIndex(
            ([entryKey]) =>
                entryKey === key
        );

    if (
        index < 0
    ) {
        return;
    }

    const targetIndex =
        direction === "up"
            ? index - 1
            : index + 1;

    if (
        targetIndex < 0 ||
        targetIndex >=
            entries.length
    ) {

        return;
    }

    const targetKey =
        entries[
            targetIndex
        ][0];

    const currentOrder =
        Number(
            field.order || 999
        );

    field.order =
        Number(
            currentSystemSettings
                .fieldConfig[
                    targetKey
                ]
                .order ||
                999
        );

    currentSystemSettings
        .fieldConfig[
            targetKey
        ]
        .order =
            currentOrder;

    normalizeSectionOrders(
        currentSystemSettings
            .fieldConfig
    );

}


// ==========================================
// Move Field Between Sections
// ==========================================

function moveFieldToSection(
    key,
    newSection
) {

    if (
        !superAdminAllowed
    ) {
        return;
    }

    const config =
        currentSystemSettings
            .fieldConfig;

    const field =
        config[key];

    if (!field) {
        return;
    }

    if (
        TAZKIRA_PROTECTED_FIELDS.includes(
            key
        ) &&
        newSection !== "person"
    ) {

        showMessage(
            "د تذکرې اړوند فیلډ باید د «د فورم معلومات» په برخه کې پاتې شي؛ خو د همدې برخې دننه یې ځای بدلولی شئ.",
            "warning"
        );

        renderFieldConfigTable();

        return;

    }

    if (
        !FIELD_SECTIONS[
            newSection
        ]
    ) {

        return;

    }

    const targetEntries =
        getSectionEntries(
            newSection
        );

    field.section =
        newSection;

    field.order =
        targetEntries.length + 1;

    field.position =
        targetEntries.length + 1;

    normalizeSectionOrders(
        config
    );

}


// ==========================================
// Render Field Config Table
// ==========================================

function renderFieldConfigTable() {

    const config =
        currentSystemSettings
            .fieldConfig;

    let html =
        "";

    for (
        const [
            section,
            sectionLabel
        ]
        of Object.entries(
            FIELD_SECTIONS
        )
    ) {

        const entries =
            getSectionEntries(
                section
            );

        if (
            !entries.length
        ) {

            continue;

        }

        html += `

            <div
                style="
                    margin-bottom:18px;
                "
            >

                <h3
                    style="
                        font-size:15px;
                        font-weight:800;
                        margin-bottom:8px;
                    "
                >
                    📁 ${escapeHtml(
                        sectionLabel
                    )}
                </h3>

                <div class="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    🔢 موقعیت
                                </th>

                                <th>
                                    📝 فیلډ
                                </th>

                                <th>
                                    📍 برخه
                                </th>

                                <th>
                                    ✅ اجباري
                                </th>

                                <th>
                                    👁️ ښکاره
                                </th>

                                <th>
                                    🔒 قفل
                                </th>

                                <th>
                                    ↕️ چټک حرکت
                                </th>

                                <th>
                                    🗑️ حذف
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${entries.map(
                                (
                                    [
                                        key,
                                        field
                                    ],
                                    index
                                ) => {

                                    const position =
                                        Number(
                                            field.order ||
                                            index + 1
                                        );

                                    const hasUp =
                                        index >
                                        0;

                                    const hasDown =
                                        index <
                                        entries.length -
                                        1;

                                    return `

                                        <tr
                                            data-field-key="${escapeHtml(
                                                key
                                            )}"
                                        >

                                            <td>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="${entries.length}"
                                                    step="1"
                                                    value="${position}"
                                                    class="form-control"
                                                    data-action="position"
                                                    ${
                                                        superAdminAllowed
                                                            ? ""
                                                            : "disabled"
                                                    }
                                                    style="
                                                        width:76px;
                                                        min-width:76px;
                                                        text-align:center;
                                                        font-weight:800;
                                                    "
                                                    title="د دې فیلډ موقعیت"
                                                >

                                            </td>


                                            <td>

                                                <input
                                                    type="text"
                                                    class="form-control"
                                                    data-action="label"
                                                    value="${escapeHtml(
                                                        field.label ||
                                                        key
                                                    )}"
                                                    ${
                                                        superAdminAllowed
                                                            ? ""
                                                            : "disabled"
                                                    }
                                                >

                                                <small
                                                    style="
                                                        color:var(--muted-color);
                                                    "
                                                >
                                                    ${escapeHtml(
                                                        key
                                                    )}
                                                </small>

                                            </td>


                                            <td>

                                                <select
                                                    class="form-control"
                                                    data-action="section"
                                                    ${
                                                        superAdminAllowed
                                                            ? ""
                                                            : "disabled"
                                                    }
                                                >

                                                    ${fieldSectionOptions(
                                                        field.section ||
                                                        section
                                                    )}

                                                </select>

                                            </td>


                                            <td>

                                                <label
                                                    style="
                                                        display:inline-flex;
                                                        gap:5px;
                                                        align-items:center;
                                                    "
                                                >

                                                    <input
                                                        type="checkbox"
                                                        data-action="required"
                                                        ${
                                                            field.required
                                                                ? "checked"
                                                                : ""
                                                        }
                                                        ${
                                                            superAdminAllowed
                                                                ? ""
                                                                : "disabled"
                                                        }
                                                    >

                                                    <span>
                                                        ${
                                                            field.required
                                                                ? "هو"
                                                                : "نه"
                                                        }
                                                    </span>

                                                </label>

                                            </td>


                                            <td>

                                                <label
                                                    style="
                                                        display:inline-flex;
                                                        gap:5px;
                                                        align-items:center;
                                                    "
                                                >

                                                    <input
                                                        type="checkbox"
                                                        data-action="visible"
                                                        ${
                                                            !field.hidden
                                                                ? "checked"
                                                                : ""
                                                        }
                                                        ${
                                                            superAdminAllowed
                                                                ? ""
                                                                : "disabled"
                                                        }
                                                    >

                                                    <span>
                                                        ${
                                                            field.hidden
                                                                ? "پټ"
                                                                : "ښکاره"
                                                        }
                                                    </span>

                                                </label>

                                            </td>


                                            <td>

                                                <label
                                                    style="
                                                        display:inline-flex;
                                                        gap:5px;
                                                        align-items:center;
                                                    "
                                                >

                                                    <input
                                                        type="checkbox"
                                                        data-action="locked"
                                                        ${
                                                            field.locked
                                                                ? "checked"
                                                                : ""
                                                        }
                                                        ${
                                                            superAdminAllowed
                                                                ? ""
                                                                : "disabled"
                                                        }
                                                    >

                                                    <span>
                                                        ${
                                                            field.locked
                                                                ? "قفل"
                                                                : "خلاص"
                                                        }
                                                    </span>

                                                </label>

                                            </td>


                                            <td>

                                                <div
                                                    class="admin-table-actions"
                                                >

                                                    <button
                                                        type="button"
                                                        class="btn btn-secondary"
                                                        data-action="up"
                                                        data-key="${escapeHtml(
                                                            key
                                                        )}"
                                                        ${
                                                            superAdminAllowed &&
                                                            hasUp
                                                                ? ""
                                                                : "disabled"
                                                        }
                                                    >
                                                        ⬆️
                                                    </button>

                                                    <button
                                                        type="button"
                                                        class="btn btn-secondary"
                                                        data-action="down"
                                                        data-key="${escapeHtml(
                                                            key
                                                        )}"
                                                        ${
                                                            superAdminAllowed &&
                                                            hasDown
                                                                ? ""
                                                                : "disabled"
                                                        }
                                                    >
                                                        ⬇️
                                                    </button>

                                                </div>

                                            </td>


                                            <td>

                                                ${
                                                    field.deletable === false

                                                        ? `
                                                            <span
                                                                class="badge badge-info"
                                                            >
                                                                🔐 اصلي
                                                            </span>
                                                          `

                                                        : `
                                                            <button
                                                                type="button"
                                                                class="btn btn-danger"
                                                                data-action="delete"
                                                                data-key="${escapeHtml(
                                                                    key
                                                                )}"
                                                                ${
                                                                    superAdminAllowed
                                                                        ? ""
                                                                        : "disabled"
                                                                }
                                                            >
                                                                🗑️ حذف
                                                            </button>
                                                          `
                                                }

                                            </td>

                                        </tr>

                                    `;

                                }
                            ).join("")}

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }

    fieldsTable.innerHTML =
        html ||

        `
            <div class="records-lock">
                🧩 هېڅ فیلډ موجود نه دی.
            </div>
        `;

}


// ==========================================
// Add Custom Field
// ==========================================

function addCustomField() {

    if (
        !superAdminAllowed
    ) {

        showMessage(
            "یوازې ستر اډمین نوی فیلډ جوړولی شي.",
            "danger"
        );

        return;

    }

    const label =
        window.prompt(
            "د نوي فیلډ نوم ولیکئ:"
        );

    if (
        !normalizeText(
            label
        )
    ) {

        return;

    }

    const selectedSection =
        window.prompt(
            "برخه وټاکئ:\n1 = د فورم معلومات\n2 = اصلي ځای\n3 = فعلي ځای\n4 = د کار او اړوند معلومات\n5 = د PDF معلومات",
            "4"
        );

    const sectionMap = {

        "1": "person",

        "2": "originalLocation",

        "3": "currentLocation",

        "4": "work",

        "5": "pdf"

    };

    const section =
        sectionMap[
            normalizeText(
                selectedSection
            )
        ] || "work";

    const key =
        `custom_${Date.now()}_${Math.floor(
            Math.random() *
            10000
        )}`;

    const sectionEntries =
        getSectionEntries(
            section
        );

    const positionInput =
        window.prompt(
            `د «${normalizeText(label)}» موقعیت ولیکئ. له 1 تر ${sectionEntries.length + 1} پورې.`,
            String(
                sectionEntries.length + 1
            )
        );

    let position =
        Number(
            positionInput
        );

    if (
        !Number.isFinite(
            position
        )
    ) {

        position =
            sectionEntries.length +
            1;

    }

    position =
        Math.max(
            1,
            Math.min(
                sectionEntries.length + 1,
                Math.round(
                    position
                )
            )
        );

    currentSystemSettings
        .fieldConfig[key] = {

            label:
                normalizeText(
                    label
                ),

            required:
                false,

            hidden:
                false,

            locked:
                false,

            deletable:
                true,

            section,

            order:
                sectionEntries.length +
                1,

            position:
                sectionEntries.length +
                1

        };

    /*
     * لومړی فیلډ آخر ته اضافه کوو.
     * بیا یې غوښتل شوي position ته راوړو.
     */
    moveFieldToPosition(
        key,
        position
    );

    currentSystemSettings.deletedFields =
        currentSystemSettings.deletedFields
            .filter(
                item =>
                    item !== key
            );

    normalizeSectionOrders(
        currentSystemSettings
            .fieldConfig
    );

    renderFieldConfigTable();

    fieldsBadge.className =
        "badge badge-warning";

    fieldsBadge.textContent =
        "⚠️ خوندي کول اړین دي";

    showMessage(
        `فیلډ جوړ شو او د «${sectionLabelText(section)}» په ${position} نمبر کې کېښودل شو. اوس «فیلډونه خوندي کول» ووهئ.`,
        "success"
    );

}


// ==========================================
// Section Label
// ==========================================

function sectionLabelText(
    section
) {

    return (
        FIELD_SECTIONS[
            section
        ] ||
        section
    );

}


// ==========================================
// Delete Custom Field
// ==========================================

async function deleteCustomField(
    key
) {

    if (
        !superAdminAllowed
    ) {

        showMessage(
            "یوازې ستر اډمین فیلډ حذف کولی شي.",
            "danger"
        );

        return;

    }

    const config =
        currentSystemSettings
            .fieldConfig;

    const field =
        config[key];

    if (!field) {
        return;
    }

    if (
        field.deletable === false
    ) {

        showMessage(
            "اصلي فیلډ حذف کېدای نه شي.",
            "warning"
        );

        return;

    }

    if (
        !window.confirm(
            `ایا غواړئ «${field.label || key}» فیلډ په بشپړ ډول حذف کړئ؟`
        )
    ) {

        return;

    }

    delete config[key];

    if (
        !currentSystemSettings
            .deletedFields
            .includes(
                key
            )
    ) {

        currentSystemSettings
            .deletedFields
            .push(
                key
            );

    }

    normalizeSectionOrders(
        config
    );

    const result =
        await saveSystemSettings(
            currentSystemSettings
        );

    if (
        !result.success
    ) {

        showMessage(
            result.message,
            "danger"
        );

        return;

    }

    currentSystemSettings =
        result.settings;

    renderFieldConfigTable();

    fieldsBadge.className =
        "badge badge-success";

    fieldsBadge.textContent =
        "✅ فیلډ حذف شو";

    showMessage(
        "فیلډ په آنلاین ډول حذف شو او د Refresh وروسته هم بېرته نه راځي.",
        "success"
    );

}


// ==========================================
// Save Fields
// ==========================================

async function saveFieldsSettings() {

    if (
        !superAdminAllowed
    ) {

        showMessage(
            "یوازې ستر اډمین د فیلډونو تنظیمات بدلولی شي.",
            "danger"
        );

        return;

    }

    saveFieldsBtn.disabled =
        true;

    const originalText =
        saveFieldsBtn.textContent;

    saveFieldsBtn.textContent =
        "⏳ خوندي کېږي...";

    try {

        normalizeSectionOrders(
            currentSystemSettings
                .fieldConfig
        );

        const result =
            await saveSystemSettings(
                currentSystemSettings
            );

        if (
            !result.success
        ) {

            showMessage(
                result.message,
                "danger"
            );

            return;

        }

        currentSystemSettings =
            result.settings;

        renderFieldConfigTable();

        fieldsBadge.className =
            "badge badge-success";

        fieldsBadge.textContent =
            "✅ آنلاین خوندي شول";

        showMessage(
            "د فیلډونو ټول بدلونونه په Firestore کې آنلاین خوندي شول.",
            "success"
        );

    } catch (error) {

        console.error(
            "Save Fields Error:",
            error
        );

        showMessage(
            "د فیلډونو د خوندي کولو پر مهال ستونزه رامنځته شوه.",
            "danger"
        );

    } finally {

        saveFieldsBtn.disabled =
            false;

        saveFieldsBtn.textContent =
            originalText;

    }

}


// ==========================================
// Privacy
// ==========================================

async function savePrivacySettings() {

    if (
        !superAdminAllowed
    ) {

        showMessage(
            "یوازې ستر اډمین د محرمیت تنظیمات بدلولی شي.",
            "danger"
        );

        return;

    }

    const result =
        await saveSystemSettings({

            ...currentSystemSettings,

            globalPrivacy: {

                hideFromAdmins:
                    hideFromAdmins.checked,

                hideFromStaff:
                    hideFromStaff.checked,

                hideFromUsers:
                    hideFromUsers.checked

            }

        });

    if (
        !result.success
    ) {

        showMessage(
            result.message,
            "danger"
        );

        return;

    }

    currentSystemSettings =
        result.settings;

    privacyBadge.className =
        "badge badge-success";

    privacyBadge.textContent =
        "✅ آنلاین خوندي شول";

    showMessage(
        "د محرمیت تنظیمات آنلاین خوندي شول.",
        "success"
    );

}


// ==========================================
// My Info
// ==========================================

function updateMyInfo(
    admin
) {

    currentSessionAdmin =
        admin;

    currentUid.textContent =
        admin?.uid ||
        "—";

    currentEmail.textContent =
        admin?.email ||
        "—";

    currentName.textContent =
        admin?.name ||
        "—";

    currentRole.textContent =
        roleLabel(
            admin?.role
        );

    currentStatus.innerHTML =

        admin?.active === false

            ? `
                <span
                    class="badge badge-danger"
                >
                    🔴 غیر فعال
                </span>
              `

            : `
                <span
                    class="badge badge-success"
                >
                    🟢 فعال
                </span>
              `;

    permissionNote.textContent =

        superAdminAllowed

            ? "تاسو ستر اډمین یاست؛ د اډمینانو، ریکارډونو، محرمیت او فیلډونو بشپړ آنلاین مدیریت لرئ."

            : "ستاسو حساب فعال دی، خو بشپړ مدیریتي صلاحیت یوازې ستر اډمین لري.";

}


// ==========================================
// Messages
// ==========================================

function showMessage(
    message,
    type = "success"
) {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        message;

    adminMessage.className =
        `alert alert-${type}`;

    adminMessage.style.display =
        "block";

}

function hideMessage() {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        "";

    adminMessage.style.display =
        "none";

}


// ==========================================
// Load Settings
// ==========================================

async function loadSystemSettings() {

    currentSystemSettings =
        await getSystemSettings();

    hideFromAdmins.checked =
        Boolean(
            currentSystemSettings
                .globalPrivacy
                ?.hideFromAdmins
        );

    hideFromStaff.checked =
        Boolean(
            currentSystemSettings
                .globalPrivacy
                ?.hideFromStaff
        );

    hideFromUsers.checked =
        Boolean(
            currentSystemSettings
                .globalPrivacy
                ?.hideFromUsers
        );

    renderFieldConfigTable();

}


// ==========================================
// Load Admins
// ==========================================

async function loadAdmins() {

    const me =
        await getCurrentAdmin();

    if (!me) {

        showMessage(
            "ستاسو اډمین حساب پیدا نه شو.",
            "danger"
        );

        return;

    }

    updateMyInfo(
        me
    );

    const result =
        await getAdmins();

    if (
        !result.success
    ) {

        adminsBadge.className =
            "badge badge-warning";

        adminsBadge.textContent =
            "محدود";

        adminsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center"
                >
                    ${escapeHtml(
                        result.message
                    )}
                </td>

            </tr>

        `;

        return;

    }

    currentAdmins =
        result.admins || [];

    totalAdminsEl.textContent =
        currentAdmins.length;

    activeAdminsEl.textContent =
        currentAdmins.filter(
            item =>
                item.active !== false
        ).length;

    superAdminsEl.textContent =
        currentAdmins.filter(
            item =>
                normalizeRole(
                    item.role
                ) ===
                ADMIN_ROLES.SUPERADMIN
        ).length;

    adminsCountEl.textContent =
        currentAdmins.filter(
            item =>
                normalizeRole(
                    item.role
                ) ===
                ADMIN_ROLES.ADMIN
        ).length;

    adminsBadge.textContent =
        `${currentAdmins.length} پروفایل`;

    adminsTableBody.innerHTML =
        currentAdmins.map(
            admin => {

                const uid =
                    admin.uid ||
                    admin.id;

                const role =
                    normalizeRole(
                        admin.role
                    );

                const active =
                    admin.active !== false;

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                admin.name ||
                                "—"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                admin.email ||
                                "—"
                            )}
                        </td>

                        <td
                            style="
                                direction:ltr;
                                word-break:break-all;
                            "
                        >
                            ${escapeHtml(
                                uid ||
                                "—"
                            )}
                        </td>

                        <td>

                            <span
                                class="badge ${
                                    roleBadgeClass(
                                        role
                                    )
                                }"
                            >
                                ${
                                    role ===
                                    ADMIN_ROLES.SUPERADMIN
                                        ? "🛡️ ستر اډمین"
                                        : role ===
                                          ADMIN_ROLES.ADMIN
                                            ? "👮 اډمین"
                                            : "👤 کاروونکی"
                                }
                            </span>

                        </td>

                        <td>

                            <span
                                class="badge ${
                                    active
                                        ? "badge-success"
                                        : "badge-danger"
                                }"
                            >
                                ${
                                    active
                                        ? "🟢 فعال"
                                        : "🔴 غیر فعال"
                                }
                            </span>

                        </td>

                        <td>

                            <div
                                class="admin-table-actions"
                            >

                                <select
                                    class="form-control"
                                    data-action="role"
                                    data-uid="${escapeHtml(uid)}"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >

                                    <option
                                        value="user"
                                        ${
                                            role === "user"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        👤 کاروونکی
                                    </option>

                                    <option
                                        value="admin"
                                        ${
                                            role === "admin"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        👮 اډمین
                                    </option>

                                    <option
                                        value="superadmin"
                                        ${
                                            role === "superadmin"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        🛡️ ستر اډمین
                                    </option>

                                </select>

                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    data-action="update-role"
                                    data-uid="${escapeHtml(uid)}"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    💾 بدلول
                                </button>

                                <button
                                    type="button"
                                    class="btn ${
                                        active
                                            ? "btn-warning"
                                            : "btn-success"
                                    }"
                                    data-action="status"
                                    data-uid="${escapeHtml(uid)}"
                                    data-active="${
                                        active
                                            ? "1"
                                            : "0"
                                    }"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    ${
                                        active
                                            ? "⛔ غیرفعالول"
                                            : "✅ فعالول"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger"
                                    data-action="delete-admin"
                                    data-uid="${escapeHtml(uid)}"
                                    ${
                                        superAdminAllowed
                                            ? ""
                                            : "disabled"
                                    }
                                >
                                    🗑️ حذف
                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


// ==========================================
// Load Records
// ==========================================

async function loadRecords() {

    recordsBadge.textContent =
        "⏳ لوډېږي...";

    const result =
        await getRecords();

    if (
        !result.success
    ) {

        recordsBadge.textContent =
            "خطا";

        recordsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center"
                >
                    ${escapeHtml(
                        result.message
                    )}
                </td>

            </tr>

        `;

        return;

    }

    renderRecords(
        result.records
    );

}


// ==========================================
// Admin Events
// ==========================================

createAdminForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const result =
            await createAdminProfile({

                uid:
                    adminUid.value,

                email:
                    adminEmail.value,

                name:
                    adminName.value,

                role:
                    adminRole.value

            });

        showMessage(
            result.message,
            result.success
                ? "success"
                : "danger"
        );

        if (
            result.success
        ) {

            createAdminForm.reset();

            adminRole.value =
                ADMIN_ROLES.USER;

            await loadAdmins();

        }

    }
);

clearAdminFormBtn.addEventListener(
    "click",
    () => {

        hideMessage();

        createAdminForm.reset();

        adminRole.value =
            ADMIN_ROLES.USER;

    }
);


// ==========================================
// Admin actions
// ==========================================

adminsTableBody.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const uid =
            button.dataset.uid;

        if (
            action ===
            "update-role"
        ) {

            const row =
                button.closest(
                    "tr"
                );

            const select =
                row.querySelector(
                    'select[data-action="role"]'
                );

            const result =
                await updateAdminRole(
                    uid,
                    select?.value ||
                    ADMIN_ROLES.USER
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadAdmins();

            }

        }

        if (
            action ===
            "status"
        ) {

            const active =
                button.dataset.active ===
                "1";

            const result =
                await setAdminStatus(
                    uid,
                    !active
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadAdmins();

            }

        }

        if (
            action ===
            "delete-admin"
        ) {

            if (
                !window.confirm(
                    "ایا غواړئ دا اډمین پروفایل په بشپړ ډول حذف کړئ؟"
                )
            ) {
                return;
            }

            const result =
                await deleteAdminProfile(
                    uid
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadAdmins();

            }

        }

    }
);


// ==========================================
// Record actions
// ==========================================

recordsTableBody.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const action =
            button.dataset.action;

        const recordId =
            button.dataset.id;

        if (
            action ===
            "toggle-editable"
        ) {

            const record =
                currentRecords.find(
                    item =>
                        item.id ===
                        recordId
                );

            const next =
                !(
                    record?.editable !==
                    false
                );

            const result =
                await updateRecordEditable(
                    recordId,
                    next
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadRecords();

            }

        }

        if (
            action ===
            "toggle-visibility"
        ) {

            const record =
                currentRecords.find(
                    item =>
                        item.id ===
                        recordId
                );

            const hidden =
                record?.visibility
                    ?.hiddenFromAdmins ===
                true;

            const result =
                await updateRecordVisibility(
                    recordId,
                    !hidden
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadRecords();

            }

        }

        if (
            action ===
            "delete-record"
        ) {

            if (
                !window.confirm(
                    "ایا غواړئ دا ریکارډ په بشپړ ډول حذف کړئ؟"
                )
            ) {
                return;
            }

            const result =
                await deleteRecord(
                    recordId
                );

            showMessage(
                result.message,
                result.success
                    ? "success"
                    : "danger"
            );

            if (
                result.success
            ) {

                await loadRecords();

            }

        }

    }
);


// ==========================================
// Search
// ==========================================

recordFilter.addEventListener(
    "input",
    () => {

        renderRecords(
            currentRecords
        );

    }
);


// ==========================================
// Privacy
// ==========================================

savePrivacyBtn.addEventListener(
    "click",
    savePrivacySettings
);


// ==========================================
// Add Field
// ==========================================

addFieldBtn.addEventListener(
    "click",
    addCustomField
);


// ==========================================
// Field label
// ==========================================

fieldsTable.addEventListener(
    "input",
    event => {

        const input =
            event.target.closest(
                '[data-action="label"]'
            );

        if (!input) {
            return;
        }

        if (
            !superAdminAllowed
        ) {
            return;
        }

        const row =
            input.closest(
                "tr[data-field-key]"
            );

        const key =
            row?.dataset.fieldKey;

        if (!key) {
            return;
        }

        const field =
            currentSystemSettings
                .fieldConfig[key];

        if (!field) {
            return;
        }

        field.label =
            normalizeText(
                input.value
            ) || key;

        fieldsBadge.className =
            "badge badge-warning";

        fieldsBadge.textContent =
            "⚠️ خوندي کول اړین دي";

    }
);


// ==========================================
// Field controls
// ==========================================

fieldsTable.addEventListener(
    "change",
    event => {

        const control =
            event.target.closest(
                "[data-action]"
            );

        if (!control) {
            return;
        }

        if (
            !superAdminAllowed
        ) {
            return;
        }

        const row =
            control.closest(
                "tr[data-field-key]"
            );

        const key =
            row?.dataset.fieldKey;

        if (!key) {
            return;
        }

        const field =
            currentSystemSettings
                .fieldConfig[key];

        if (!field) {
            return;
        }

        const action =
            control.dataset.action;

        if (
            action ===
            "required"
        ) {

            field.required =
                control.checked;

        }

        if (
            action ===
            "visible"
        ) {

            field.hidden =
                !control.checked;

        }

        if (
            action ===
            "locked"
        ) {

            field.locked =
                control.checked;

        }

        if (
            action ===
            "section"
        ) {

            const oldSection =
                field.section ||
                "person";

            moveFieldToSection(
                key,
                control.value
            );

            if (
                field.section !==
                oldSection
            ) {
                /*
                 * برخه بدله شوې.
                 */
            }

        }

        if (
            action ===
            "position"
        ) {

            moveFieldToPosition(
                key,
                control.value
            );

        }

        normalizeSectionOrders(
            currentSystemSettings
                .fieldConfig
        );

        renderFieldConfigTable();

        fieldsBadge.className =
            "badge badge-warning";

        fieldsBadge.textContent =
            "⚠️ خوندي کول اړین دي";

    }
);


// ==========================================
// Field buttons
// ==========================================

fieldsTable.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        if (
            !superAdminAllowed
        ) {

            showMessage(
                "یوازې ستر اډمین د فیلډونو تنظیمات بدلولی شي.",
                "danger"
            );

            return;

        }

        const action =
            button.dataset.action;

        const key =
            button.dataset.key;

        if (
            action ===
            "up"
        ) {

            moveField(
                key,
                "up"
            );

            renderFieldConfigTable();

            fieldsBadge.className =
                "badge badge-warning";

            fieldsBadge.textContent =
                "⚠️ خوندي کول اړین دي";

            return;

        }

        if (
            action ===
            "down"
        ) {

            moveField(
                key,
                "down"
            );

            renderFieldConfigTable();

            fieldsBadge.className =
                "badge badge-warning";

            fieldsBadge.textContent =
                "⚠️ خوندي کول اړین دي";

            return;

        }

        if (
            action ===
            "delete"
        ) {

            await deleteCustomField(
                key
            );

        }

    }
);


// ==========================================
// Save fields
// ==========================================

saveFieldsBtn.addEventListener(
    "click",
    saveFieldsSettings
);


// ==========================================
// Reset
// ==========================================

resetFieldsBtn.addEventListener(
    "click",
    async () => {

        if (
            !superAdminAllowed
        ) {

            showMessage(
                "یوازې ستر اډمین اصلي حالت راګرځولی شي.",
                "danger"
            );

            return;

        }

        if (
            !window.confirm(
                "ایا غواړئ د فیلډونو ټول تنظیمات او Custom Fields اصلي حالت ته راوګرځوئ؟"
            )
        ) {

            return;

        }

        currentSystemSettings =
            getDefaultSettings();

        const result =
            await saveSystemSettings(
                currentSystemSettings
            );

        if (
            !result.success
        ) {

            showMessage(
                result.message,
                "danger"
            );

            return;

        }

        currentSystemSettings =
            result.settings;

        hideFromAdmins.checked =
            false;

        hideFromStaff.checked =
            false;

        hideFromUsers.checked =
            false;

        renderFieldConfigTable();

        fieldsBadge.className =
            "badge badge-success";

        fieldsBadge.textContent =
            "✅ اصلي حالت خوندي شو";

        showMessage(
            "د فیلډونو اصلي حالت په Firestore کې آنلاین خوندي شو.",
            "success"
        );

    }
);


// ==========================================
// Refresh
// ==========================================

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

        } finally {

            logoutBtn.disabled =
                false;

        }

    }
);


// ==========================================
// Navigation
// ==========================================

[
    ["dashboardBtn", "dashboard.html"],
    ["dashboardMenuBtn", "dashboard.html"],
    ["formicMenuBtn", "formic.html"],
    ["registerMenuBtn", "register.html"],
    ["searchMenuBtn", "search.html"],
    ["reportsMenuBtn", "reports.html"],
    ["adminMenuBtn", "admin.html"],
    ["settingsMenuBtn", "settings.html"]
].forEach(
    ([id, page]) => {

        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `./${page}`;

                }
            );

    }
);


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

            const me =
                await getCurrentAdmin();

            if (!me) {

                showMessage(
                    "ستاسو اډمین حساب معتبر یا فعال نه دی.",
                    "danger"
                );

                return;

            }

            currentSessionAdmin =
                me;

            superAdminAllowed =
                me.role ===
                ADMIN_ROLES.SUPERADMIN;

            adminAllowed =
                me.role ===
                    ADMIN_ROLES.SUPERADMIN ||
                me.role ===
                    ADMIN_ROLES.ADMIN;

            await loadSystemSettings();

            await loadAdmins();

            await loadRecords();

        } catch (error) {

            console.error(
                "Admin Initial Load Error:",
                error
            );

            showMessage(
                error.message ||
                "د آنلاین معلوماتو د لوډ پر مهال ستونزه رامنځته شوه.",
                "danger"
            );

        }

    }
);