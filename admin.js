// ==========================================
// د افغانستان اسلامی امارت دکره کمیسیون دفورمو دثبت او مدیریت ډیټابیس
// admin.js
// Admin Management Engine + Records/Settings Control
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
// Allowed Roles
// ==========================================

export const ADMIN_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    USER: "user"
};


// ==========================================
// Default Field Config
// ==========================================

const DEFAULT_FIELD_CONFIG = {
    formNumber: { label: "د فورمي نمبر", required: true, hidden: false, deletable: false, order: 1 },
    category: { label: "کټګوري", required: true, hidden: false, deletable: false, order: 2 },

    tazkiraType: { label: "د تذکرې ډول", required: true, hidden: false, deletable: false, order: 3 },
    tazkira: { label: "د برقي تذکرې نمبر", required: false, hidden: false, deletable: false, order: 4 },
    paperTazkiraVolume: { label: "جلد", required: false, hidden: true, deletable: false, order: 5 },
    paperTazkiraPage: { label: "صفحه", required: false, hidden: true, deletable: false, order: 6 },
    paperTazkiraNumber: { label: "ګڼه", required: false, hidden: true, deletable: false, order: 7 },

    firstName: { label: "نوم", required: true, hidden: false, deletable: false, order: 8 },
    lastName: { label: "تخلص", required: false, hidden: false, deletable: false, order: 9 },
    fatherName: { label: "د پلار نوم", required: true, hidden: false, deletable: false, order: 10 },
    grandfatherName: { label: "د نیکه نوم", required: true, hidden: false, deletable: false, order: 11 },
    birthDate: { label: "د زېږون نېټه", required: false, hidden: false, deletable: false, order: 12 },
    age: { label: "عمر", required: true, hidden: false, deletable: false, order: 13 },
    phone: { label: "د تلیفون شمېره", required: false, hidden: false, deletable: false, order: 14 },

    originalProvince: { label: "اصلي ولایت", required: true, hidden: false, deletable: false, order: 15 },
    originalDistrict: { label: "اصلي ولسوالۍ", required: true, hidden: false, deletable: false, order: 16 },
    originalVillage: { label: "اصلي کلی", required: true, hidden: false, deletable: false, order: 17 },

    currentProvince: { label: "فعلي ولایت", required: true, hidden: false, deletable: false, order: 18 },
    currentDistrict: { label: "فعلي ولسوالۍ", required: true, hidden: false, deletable: false, order: 19 },
    currentVillage: { label: "فعلي کلی", required: true, hidden: false, deletable: false, order: 20 },

    currentJob: { label: "اوسنی دنده", required: false, hidden: false, deletable: false, order: 21 },
    groupLeader: { label: "اړوند دلګی مشر", required: true, hidden: false, deletable: false, order: 22 },
    jihadiHistory: { label: "جهادي سابقه", required: false, hidden: false, deletable: false, order: 23 },
    pdfCreationDate: { label: "د PDF نېټه", required: true, hidden: false, deletable: false, order: 24 }
};


// ==========================================
// Helpers
// ==========================================

function normalizeText(value) {
    return String(value || "").trim();
}

function normalizeRole(role) {
    return normalizeText(role).toLowerCase();
}

function isValidRole(role) {
    return Object.values(ADMIN_ROLES).includes(normalizeRole(role));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function sortByName(a, b) {
    const aName = normalizeText(a.name || a.email || a.id).toLowerCase();
    const bName = normalizeText(b.name || b.email || b.id).toLowerCase();
    return aName.localeCompare(bName);
}

function sortRecordsNewest(a, b) {
    const aTime = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
}

function roleLabel(role) {
    const value = normalizeRole(role);
    if (value === "superadmin") return "ستر ادمین";
    if (value === "admin") return "ادمین";
    return "کاروونکی";
}

function roleBadgeClass(role) {
    const value = normalizeRole(role);
    if (value === "superadmin") return "badge-danger";
    if (value === "admin") return "badge-warning";
    return "badge-info";
}

function statusBadgeClass(active) {
    return active ? "badge-success" : "badge-danger";
}

function cleanRecordValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim();
}

function getPersonName(record) {
    const p = record?.person || {};
    return [
        cleanRecordValue(p.firstName),
        cleanRecordValue(p.lastName)
    ].filter(Boolean).join(" ") || "—";
}

function getRecordTazkira(record) {
    const type = cleanRecordValue(record?.tazkiraType || record?.person?.tazkiraType || record?.tazkiraDetails?.type);
    if (type === "paper") {
        const paper = record?.tazkiraDetails?.paper || {};
        return [
            `جلد ${cleanRecordValue(paper.volume) || "—"}`,
            `صفحه ${cleanRecordValue(paper.page) || "—"}`,
            `ګڼه ${cleanRecordValue(paper.number) || "—"}`
        ].join(" / ");
    }
    return cleanRecordValue(record?.tazkiraDisplay || record?.person?.tazkira || record?.tazkiraSearchKey) || "—";
}

function getRecordVisibilityLabel(record) {
    const visibility = record?.visibility || {};
    const hidden = visibility.hiddenFromAdmins === true;
    return hidden ? "پټ" : "ښکاره";
}

function isRecordLocked(record) {
    return record?.editable === false;
}

function getDefaultSystemSettings() {
    return {
        globalPrivacy: {
            hideFromAdmins: false,
            hideFromStaff: false,
            hideFromUsers: false
        },
        fieldConfig: structuredClone(DEFAULT_FIELD_CONFIG)
    };
}

function normalizeSystemSettings(data = {}) {
    const base = getDefaultSystemSettings();

    const incomingFieldConfig = data.fieldConfig && typeof data.fieldConfig === "object"
        ? data.fieldConfig
        : {};

    const mergedFieldConfig = {};

    for (const key of Object.keys(base.fieldConfig)) {
        mergedFieldConfig[key] = {
            ...base.fieldConfig[key],
            ...(incomingFieldConfig[key] || {})
        };
    }

    for (const key of Object.keys(incomingFieldConfig)) {
        if (!mergedFieldConfig[key]) {
            mergedFieldConfig[key] = {
                label: normalizeText(incomingFieldConfig[key].label || key),
                required: Boolean(incomingFieldConfig[key].required),
                hidden: Boolean(incomingFieldConfig[key].hidden),
                deletable: true,
                order: Number(incomingFieldConfig[key].order || 999)
            };
        }
    }

    return {
        globalPrivacy: {
            hideFromAdmins: Boolean(data.globalPrivacy?.hideFromAdmins),
            hideFromStaff: Boolean(data.globalPrivacy?.hideFromStaff),
            hideFromUsers: Boolean(data.globalPrivacy?.hideFromUsers)
        },
        fieldConfig: mergedFieldConfig
    };
}


// ==========================================
// UI State
// ==========================================

let currentSessionAdmin = null;
let superAdminAllowed = false;
let currentSystemSettings = getDefaultSystemSettings();
let currentAdmins = [];
let currentRecords = [];


// ==========================================
// DOM
// ==========================================

const adminMessage = document.getElementById("adminMessage");

const totalAdminsEl = document.getElementById("totalAdmins");
const activeAdminsEl = document.getElementById("activeAdmins");
const superAdminsEl = document.getElementById("superAdmins");
const adminsCountEl = document.getElementById("adminsCount");

const totalRecordsEl = document.getElementById("totalRecords");
const editableRecordsEl = document.getElementById("editableRecords");
const lockedRecordsEl = document.getElementById("lockedRecords");
const hiddenRecordsEl = document.getElementById("hiddenRecords");

const currentUid = document.getElementById("currentUid");
const currentEmail = document.getElementById("currentEmail");
const currentName = document.getElementById("currentName");
const currentRole = document.getElementById("currentRole");
const currentStatus = document.getElementById("currentStatus");

const createAdminForm = document.getElementById("createAdminForm");
const adminUid = document.getElementById("adminUid");
const adminEmail = document.getElementById("adminEmail");
const adminName = document.getElementById("adminName");
const adminRole = document.getElementById("adminRole");
const createAdminBtn = document.getElementById("createAdminBtn");
const clearAdminFormBtn = document.getElementById("clearAdminFormBtn");

const adminsTableBody = document.getElementById("adminsTableBody");
const adminsBadge = document.getElementById("adminsBadge");
const permissionNote = document.getElementById("permissionNote");

const recordsTableBody = document.getElementById("recordsTableBody");
const recordsBadge = document.getElementById("recordsBadge");
const recordFilter = document.getElementById("recordFilter");
const recordsTableWrap = document.getElementById("recordsTableWrap");
const recordsLockBox = document.getElementById("recordsLockBox");

const privacyBadge = document.getElementById("privacyBadge");
const hideFromAdmins = document.getElementById("hideFromAdmins");
const hideFromStaff = document.getElementById("hideFromStaff");
const hideFromUsers = document.getElementById("hideFromUsers");
const savePrivacyBtn = document.getElementById("savePrivacyBtn");

const fieldsBadge = document.getElementById("fieldsBadge");
const fieldsTable = document.getElementById("fieldsTable");
const addFieldBtn = document.getElementById("addFieldBtn");
const saveFieldsBtn = document.getElementById("saveFieldsBtn");
const resetFieldsBtn = document.getElementById("resetFieldsBtn");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");


// ==========================================
// Admin Profile Functions
// ==========================================

export async function getCurrentAdmin() {
    try {
        const user = auth.currentUser;

        if (!user) {
            return null;
        }

        const adminRef = doc(db, ADMINS_COLLECTION, user.uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data() || {};
        const storedUid = normalizeText(data.uid);
        const currentUidValue = normalizeText(user.uid);

        if (storedUid && storedUid !== currentUidValue) {
            return null;
        }

        if (data.active === false) {
            return null;
        }

        const role = normalizeRole(data.role);

        if (!role) {
            return null;
        }

        return {
            id: snapshot.id,
            ...data,
            role
        };
    } catch (error) {
        console.error("Get Current Admin Error:", error);
        return null;
    }
}

export async function hasRole(allowedRoles = []) {
    const admin = await getCurrentAdmin();

    if (!admin) {
        return false;
    }

    const role = normalizeRole(admin.role);
    return allowedRoles.includes(role);
}

export async function isSuperAdmin() {
    return hasRole([ADMIN_ROLES.SUPERADMIN]);
}

export async function isAdmin() {
    return hasRole([ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.ADMIN]);
}

export async function isUser() {
    return hasRole([ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.ADMIN, ADMIN_ROLES.USER]);
}

export async function getAdmins() {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                admins: [],
                message: "یوازې Super Admin د کاروونکو لست لیدلی شي."
            };
        }

        const snapshot = await getDocs(collection(db, ADMINS_COLLECTION));
        const admins = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        admins.sort(sortByName);

        return {
            success: true,
            admins
        };
    } catch (error) {
        console.error("Get Admins Error:", error);

        return {
            success: false,
            admins: [],
            message: error.message || "د کاروونکو لست ترلاسه نه شو."
        };
    }
}

export async function getAdminByUid(uid) {
    try {
        uid = normalizeText(uid);

        if (!uid) {
            return null;
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };
    } catch (error) {
        console.error("Get Admin By UID Error:", error);
        return null;
    }
}

export async function getAdminByEmail(email) {
    try {
        email = normalizeText(email).toLowerCase();

        if (!email) {
            return null;
        }

        const adminsRef = collection(db, ADMINS_COLLECTION);
        const q = query(adminsRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const docSnap = snapshot.docs[0];

        return {
            id: docSnap.id,
            ...docSnap.data()
        };
    } catch (error) {
        console.error("Get Admin By Email Error:", error);
        return null;
    }
}

export async function createAdminProfile({ uid, email, role = ADMIN_ROLES.USER, name = "" } = {}) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې Super Admin کاروونکی ثبتولی شي."
            };
        }

        uid = normalizeText(uid);
        email = normalizeText(email).toLowerCase();
        name = normalizeText(name);
        role = normalizeRole(role);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        if (!email) {
            return {
                success: false,
                message: "ایمیل موجود نه دی."
            };
        }

        if (!isValidRole(role)) {
            return {
                success: false,
                message: "Role ناسم دی."
            };
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const existing = await getDoc(adminRef);

        if (existing.exists()) {
            return {
                success: false,
                message: "دا کاروونکی لا دمخه ثبت شوی دی."
            };
        }

        await setDoc(adminRef, {
            uid,
            email,
            name,
            role,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        try {
            await writeAudit(AUDIT_ACTIONS.USER_CREATED, `کاروونکی ثبت شو: ${email}`);
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "کاروونکی په بریالیتوب ثبت شو."
        };
    } catch (error) {
        console.error("Create Admin Error:", error);

        return {
            success: false,
            message: error.message || "کاروونکی ثبت نه شو."
        };
    }
}

export async function updateAdminProfile(uid, updates = {}) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې Super Admin د کاروونکي معلومات بدلولی شي."
            };
        }

        uid = normalizeText(uid);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "کاروونکی پیدا نه شو."
            };
        }

        const safeUpdates = {};

        if (Object.prototype.hasOwnProperty.call(updates, "name")) {
            safeUpdates.name = normalizeText(updates.name);
        }

        if (Object.prototype.hasOwnProperty.call(updates, "email")) {
            const email = normalizeText(updates.email).toLowerCase();
            if (!email) {
                return {
                    success: false,
                    message: "ایمیل موجود نه دی."
                };
            }
            safeUpdates.email = email;
        }

        if (Object.prototype.hasOwnProperty.call(updates, "role")) {
            const role = normalizeRole(updates.role);
            if (!isValidRole(role)) {
                return {
                    success: false,
                    message: "Role ناسم دی."
                };
            }
            safeUpdates.role = role;
        }

        if (Object.prototype.hasOwnProperty.call(updates, "active")) {
            safeUpdates.active = Boolean(updates.active);
        }

        safeUpdates.updatedAt = serverTimestamp();

        await updateDoc(adminRef, safeUpdates);

        try {
            await writeAudit(AUDIT_ACTIONS.ADMIN_UPDATE, `کاروونکی Update شو: ${uid}`);
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "د کاروونکي معلومات په بریالیتوب بدل شول."
        };
    } catch (error) {
        console.error("Update Admin Profile Error:", error);

        return {
            success: false,
            message: error.message || "کاروونکی Update نه شو."
        };
    }
}

export async function updateAdminRole(uid, role) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفراډمین حافظ ایوب د Role بدلولو اجازه لری ځکه دادحافظ ایوب قانون دی."
            };
        }

        uid = normalizeText(uid);
        role = normalizeRole(role);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        if (!isValidRole(role)) {
            return {
                success: false,
                message: "Role ناسم دی."
            };
        }

        if (uid === auth.currentUser?.uid && role !== ADMIN_ROLES.SUPERADMIN) {
            return {
                success: false,
                message: "خپل سوفراډمین صلاحیت مه کموی."
            };
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "کاروونکی پیدا نه شو."
            };
        }

        await updateDoc(adminRef, {
            role,
            updatedAt: serverTimestamp()
        });

        try {
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                `د کاروونکي Role بدل شو: ${uid} → ${role}`
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "د کاروونکي Role په بریالیتوب بدل شو."
        };
    } catch (error) {
        console.error("Update Admin Role Error:", error);

        return {
            success: false,
            message: error.message || "Role بدل نه شو."
        };
    }
}

export async function setAdminStatus(uid, active) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفراډمین حافظ ایوب د کاروونکي حالت بدلولی شی نور هیڅوک داصلاحیت نلری."
            };
        }

        uid = normalizeText(uid);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        if (uid === auth.currentUser?.uid && active === false) {
            return {
                success: false,
                message: "خپل سوفراډمین حافظ ایوب حساب غیر فعالولی نه شی نور هیڅوک داصلاحیت نلری."
            };
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "کاروونکی پیدا نه شو."
            };
        }

        await updateDoc(adminRef, {
            active: Boolean(active),
            updatedAt: serverTimestamp()
        });

        try {
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                `د کاروونکي حالت بدل شو: ${uid} → ${Boolean(active)}`
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: active ? "کاروونکی فعال شو." : "کاروونکی غیر فعال شو."
        };
    } catch (error) {
        console.error("Set Admin Status Error:", error);

        return {
            success: false,
            message: error.message || "د کاروونکي حالت بدل نه شو."
        };
    }
}

export async function deleteAdminProfile(uid) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفراډمین حافظ ایوب کاروونکی حذف کولی شی نور هیڅوک داصلاحیت نلری."
            };
        }

        uid = normalizeText(uid);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        if (uid === auth.currentUser?.uid) {
            return {
                success: false,
                message: "خپل سوفراډمین 💪 حساب نه شئ حذف کولی."
            };
        }

        const adminRef = doc(db, ADMINS_COLLECTION, uid);
        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "کاروونکی پیدا نه شو."
            };
        }

        await deleteDoc(adminRef);

        try {
            await writeAudit(AUDIT_ACTIONS.DELETE, `د Admin Profile حذف شو: ${uid}`);
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "د کاروونکي Admin Profile حذف شو."
        };
    } catch (error) {
        console.error("Delete Admin Error:", error);

        return {
            success: false,
            message: error.message || "کاروونکی حذف نه شو."
        };
    }
}


// ==========================================
// System Settings Functions
// ==========================================

export async function getSystemSettings() {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        const snapshot = await getDoc(settingsRef);

        if (!snapshot.exists()) {
            return getDefaultSystemSettings();
        }

        return normalizeSystemSettings(snapshot.data() || {});
    } catch (error) {
        console.error("Get System Settings Error:", error);
        return getDefaultSystemSettings();
    }
}

export async function saveSystemSettings(settings = {}) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفراډمین حافظ ایوب تنظیمات بدلولی شی نور کسان صلاحیت نلری."
            };
        }

        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
        const normalized = normalizeSystemSettings(settings);

        await setDoc(settingsRef, {
            ...normalized,
            updatedAt: serverTimestamp()
        }, { merge: true });

        try {
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                "System settings updated"
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "سیسټمي تنظیمات خوندي شول.",
            settings: normalized
        };
    } catch (error) {
        console.error("Save System Settings Error:", error);
        return {
            success: false,
            message: error.message || "تنظیمات خوندي نه شول."
        };
    }
}

export async function updateRecordEditable(recordId, editable) {
    try {
        if (!(await isAdmin())) {
            return {
                success: false,
                message: "یوازې اډمینان دا عملیات ترسره کولی شی ساده کارکونکی صلاحیت نلری."
            };
        }

        const ref = doc(db, RECORDS_COLLECTION, normalizeText(recordId));
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "ریکارډ پیدا نه شو."
            };
        }

        const data = snapshot.data() || {};

        await updateDoc(ref, {
            editable: Boolean(editable),
            updatedAt: serverTimestamp()
        });

        try {
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                `ریکارډ editable بدل شو: ${data.formNumber || recordId} → ${Boolean(editable)}`
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: editable ? "ریکارډ editable شو." : "ریکارډ locked شو."
        };
    } catch (error) {
        console.error("Update Record Editable Error:", error);
        return {
            success: false,
            message: error.message || "ریکارډ بدل نه شو."
        };
    }
}

export async function updateRecordVisibility(recordId, hiddenFromAdmins) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفر اډمین حافظ visibility بدلولی شی نور هیڅوک داصلاحیت نلری."
            };
        }

        const ref = doc(db, RECORDS_COLLECTION, normalizeText(recordId));
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "ریکارډ پیدا نه شو."
            };
        }

        const existing = snapshot.data() || {};
        const nextVisibility = {
            ...(existing.visibility || {}),
            hiddenFromAdmins: Boolean(hiddenFromAdmins)
        };

        await updateDoc(ref, {
            visibility: nextVisibility,
            updatedAt: serverTimestamp()
        });

        try {
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                `ریکارډ visibility بدل شو: ${existing.formNumber || recordId} → ${Boolean(hiddenFromAdmins)}`
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: hiddenFromAdmins ? "ریکارډ پټ شو." : "ریکارډ ښکاره شو."
        };
    } catch (error) {
        console.error("Update Record Visibility Error:", error);
        return {
            success: false,
            message: error.message || "ریکارډ visibility بدل نه شو."
        };
    }
}

export async function deleteRecord(recordId) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې سوفراډمین حافظ ایوب ریکارډ حذف کولی شی نور هیځوک داصلاحیت نلری."
            };
        }

        const ref = doc(db, RECORDS_COLLECTION, normalizeText(recordId));
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "ریکارډ پیدا نه شو."
            };
        }

        const data = snapshot.data() || {};

        await deleteDoc(ref);

        try {
            await writeAudit(
                AUDIT_ACTIONS.DELETE,
                `ریکارډ حذف شو: ${data.formNumber || recordId}`
            );
        } catch (auditError) {
            console.error("Audit Error:", auditError);
        }

        return {
            success: true,
            message: "ریکارډ حذف شو."
        };
    } catch (error) {
        console.error("Delete Record Error:", error);
        return {
            success: false,
            message: error.message || "ریکارډ حذف نه شو."
        };
    }
}

export async function getRecords() {
    try {
        const snapshot = await getDocs(collection(db, RECORDS_COLLECTION));
        const records = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        records.sort(sortRecordsNewest);

        return {
            success: true,
            records
        };
    } catch (error) {
        console.error("Get Records Error:", error);
        return {
            success: false,
            records: [],
            message: error.message || "د ریکارډونو لست ترلاسه نه شو."
        };
    }
}


// ==========================================
// Field Config Helpers
// ==========================================

function renderFieldConfigTable(settings) {
    const fieldConfig = settings.fieldConfig || {};
    const keys = Object.keys(fieldConfig)
        .sort((a, b) => (fieldConfig[a].order || 999) - (fieldConfig[b].order || 999));

    if (!keys.length) {
        fieldsTable.innerHTML = `
            <div class="records-lock">
                د فیلډونو کوم تنظیم نشته.
            </div>
        `;
        return;
    }

    fieldsTable.innerHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Key</th>
                        <th>Label</th>
                        <th>Required</th>
                        <th>Hidden</th>
                        <th>حذف</th>
                    </tr>
                </thead>
                <tbody>
                    ${keys.map((key) => {
                        const field = fieldConfig[key] || {};
                        return `
                            <tr data-field-key="${escapeHtml(key)}">
                                <td>
                                    <strong>${escapeHtml(key)}</strong>
                                    <input type="hidden" class="field-order" value="${escapeHtml(field.order ?? 999)}">
                                </td>
                                <td>
                                    <input type="text" class="form-control field-label" value="${escapeHtml(field.label || key)}">
                                </td>
                                <td style="text-align:center;">
                                    <label class="switch-wrap">
                                        <input type="checkbox" class="field-required" ${field.required ? "checked" : ""}>
                                        <span>هو</span>
                                    </label>
                                </td>
                                <td style="text-align:center;">
                                    <label class="switch-wrap">
                                        <input type="checkbox" class="field-hidden" ${field.hidden ? "checked" : ""}>
                                        <span>هو</span>
                                    </label>
                                </td>
                                <td style="text-align:center;">
                                    ${
                                        field.deletable === false
                                            ? `<span class="badge badge-info field-badge">محفوظ</span>`
                                            : `<button type="button" class="btn btn-danger" data-action="delete-field">حذف</button>`
                                    }
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function collectFieldConfigFromTable() {
    const rows = Array.from(fieldsTable.querySelectorAll("tbody tr[data-field-key]"));
    const config = {};

    rows.forEach((row, index) => {
        const key = row.getAttribute("data-field-key");
        const label = row.querySelector(".field-label")?.value || key;
        const required = row.querySelector(".field-required")?.checked || false;
        const hidden = row.querySelector(".field-hidden")?.checked || false;

        config[key] = {
            label: normalizeText(label) || key,
            required,
            hidden,
            deletable: DEFAULT_FIELD_CONFIG[key]?.deletable !== false ? true : false,
            order: index + 1
        };
    });

    return config;
}

async function loadSystemSettings() {
    currentSystemSettings = await getSystemSettings();

    hideFromAdmins.checked = Boolean(currentSystemSettings.globalPrivacy?.hideFromAdmins);
    hideFromStaff.checked = Boolean(currentSystemSettings.globalPrivacy?.hideFromStaff);
    hideFromUsers.checked = Boolean(currentSystemSettings.globalPrivacy?.hideFromUsers);

    renderFieldConfigTable(currentSystemSettings);
}

function addCustomFieldPrompt() {
    const rawKey = window.prompt("د نوي فیلډ Key ولیکئ. مثال: addressLine1");
    if (!rawKey) {
        return;
    }

    const key = normalizeText(rawKey);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
        showMessage("Key ناسم دی. یوازې توري، عددونه او _ کارول کېدای شي.", "danger");
        return;
    }

    if (currentSystemSettings.fieldConfig[key]) {
        showMessage("دا فیلډ Key لا دمخه شته.", "warning");
        return;
    }

    const label = window.prompt("د دې فیلډ Label ولیکئ", key);
    if (!label) {
        return;
    }

    currentSystemSettings.fieldConfig[key] = {
        label: normalizeText(label),
        required: false,
        hidden: false,
        deletable: true,
        order: Object.keys(currentSystemSettings.fieldConfig).length + 1
    };

    renderFieldConfigTable(currentSystemSettings);
    showMessage("نوی فیلډ لنډمهاله اضافه شو. د خوندي کولو تڼۍ ووهه.", "success");
}

async function saveFieldsSettings() {
    if (!(await isSuperAdmin())) {
        showMessage("یوازې Super Admin فیلډونه بدلولی شي.", "danger");
        return;
    }

    const nextSettings = {
        ...currentSystemSettings,
        fieldConfig: collectFieldConfigFromTable()
    };

    const result = await saveSystemSettings(nextSettings);

    if (!result.success) {
        showMessage(result.message || "فیلډونه خوندي نه شول.", "danger");
        return;
    }

    currentSystemSettings = result.settings || nextSettings;
    showMessage(result.message || "فیلډونه خوندي شول.", "success");
    fieldsBadge.className = "badge badge-success";
    fieldsBadge.textContent = "خوندي شول";
}

async function savePrivacySettings() {
    if (!(await isSuperAdmin())) {
        showMessage("یوازې سوفراډمین 💪 privacy بدلولی شی نور هیڅوک داصلاحیت نلری.", "danger");
        return;
    }

    const nextSettings = {
        ...currentSystemSettings,
        globalPrivacy: {
            hideFromAdmins: hideFromAdmins.checked,
            hideFromStaff: hideFromStaff.checked,
            hideFromUsers: hideFromUsers.checked
        }
    };

    const result = await saveSystemSettings(nextSettings);

    if (!result.success) {
        showMessage(result.message || "Privacy خوندي نه شو.", "danger");
        return;
    }

    currentSystemSettings = result.settings || nextSettings;
    showMessage(result.message || "Privacy خوندي شو.", "success");
    privacyBadge.className = "badge badge-success";
    privacyBadge.textContent = "خوندي شو";
}

function deleteFieldFromTable(key) {
    const row = fieldsTable.querySelector(`tr[data-field-key="${CSS.escape(key)}"]`);
    if (row) {
        row.remove();
    }
}


// ==========================================
// Rendering
// ==========================================

function showMessage(message, type = "success") {
    adminMessage.textContent = message;
    adminMessage.className = "alert alert-" + type;
    adminMessage.style.display = "block";
}

function hideMessage() {
    adminMessage.textContent = "";
    adminMessage.style.display = "none";
}

function updateMyInfo(admin) {
    currentSessionAdmin = admin || null;

    currentUid.textContent = admin?.uid || admin?.id || "—";
    currentEmail.textContent = admin?.email || "—";
    currentName.textContent = admin?.name || "—";
    currentRole.textContent = roleLabel(admin?.role);
    currentStatus.innerHTML = admin?.active === false
        ? '<span class="badge badge-danger">غیر فعال</span>'
        : '<span class="badge badge-success">فعال</span>';

    permissionNote.textContent = superAdminAllowed
        ? "تاسو ستر ادمین یاست؛ د ادمین مدیریت، ریکارډ قفل/ښکاره کول، او فیلډ تنظیمات فعال دي."
        : "ستاسو حساب په ادمین لست کې شته، خو بشپړ مدیریت یوازې ستر ادمین 👮 ته ورکول کېږي.";
}

function renderEmpty(message) {
    adminsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">${escapeHtml(message)}</td>
        </tr>
    `;
}

function renderRecordsEmpty(message) {
    recordsTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center">${escapeHtml(message)}</td>
        </tr>
    `;
}

function renderAdmins(admins) {
    const list = Array.isArray(admins) ? admins : [];
    totalAdminsEl.textContent = list.length;
    activeAdminsEl.textContent = list.filter(a => a.active !== false).length;
    superAdminsEl.textContent = list.filter(a => normalizeRole(a.role) === "superadmin").length;
    adminsCountEl.textContent = list.filter(a => normalizeRole(a.role) === "admin").length;

    adminsBadge.className = "badge badge-info";
    adminsBadge.textContent = `${list.length} پروفایلونه`;

    if (!list.length) {
        renderEmpty("هیڅ ادمین پروفایل نه شته.");
        return;
    }

    adminsTableBody.innerHTML = list.map(admin => {
        const role = roleLabel(admin.role);
        const active = admin.active !== false;
        const canModify = superAdminAllowed;

        const rowRoleSelect = `
            <select class="form-control admin-role-select" data-action="role-select" data-uid="${escapeHtml(admin.uid || admin.id)}" ${canModify ? "" : "disabled"}>
                <option value="user" ${normalizeRole(admin.role) === "user" ? "selected" : ""}>کاروونکی</option>
                <option value="admin" ${normalizeRole(admin.role) === "admin" ? "selected" : ""}>ادمین</option>
                <option value="superadmin" ${normalizeRole(admin.role) === "superadmin" ? "selected" : ""}>ستر ادمین</option>
            </select>
        `;

        return `
            <tr>
                <td>${escapeHtml(admin.name || "—")}</td>
                <td>${escapeHtml(admin.email || "—")}</td>
                <td style="word-break:break-all;">${escapeHtml(admin.uid || admin.id || "—")}</td>
                <td><span class="badge ${roleBadgeClass(admin.role)}">${escapeHtml(role)}</span></td>
                <td><span class="badge ${statusBadgeClass(active)}">${active ? "فعال" : "غیر فعال"}</span></td>
                <td>
                    <div class="admin-table-actions">
                        ${rowRoleSelect}
                        <button type="button" class="btn btn-secondary" data-action="update-role" data-uid="${escapeHtml(admin.uid || admin.id)}" ${canModify ? "" : "disabled"}>بدلول</button>
                        <button type="button" class="btn btn-warning" data-action="toggle-active" data-uid="${escapeHtml(admin.uid || admin.id)}" data-active="${active ? "1" : "0"}" ${canModify ? "" : "disabled"}>
                            ${active ? "غیرفعالول" : "فعالول"}
                        </button>
                        <button type="button" class="btn btn-danger" data-action="delete-admin" data-uid="${escapeHtml(admin.uid || admin.id)}" ${canModify ? "" : "disabled"}>حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function filterRecords(list, queryText) {
    const q = normalizeText(queryText).toLowerCase();
    if (!q) return list;

    return list.filter(record => {
        const person = record.person || {};
        const haystack = [
            record.formNumber,
            record.category,
            person.firstName,
            person.lastName,
            person.fatherName,
            person.grandfatherName,
            record.tazkiraDisplay,
            record.tazkiraSearchKey
        ].map(v => normalizeText(v).toLowerCase()).join(" | ");

        return haystack.includes(q);
    });
}

function renderRecords(records) {
    currentRecords = Array.isArray(records) ? records : [];

    totalRecordsEl.textContent = currentRecords.length;
    editableRecordsEl.textContent = currentRecords.filter(r => r.editable !== false).length;
    lockedRecordsEl.textContent = currentRecords.filter(r => r.editable === false).length;
    hiddenRecordsEl.textContent = currentRecords.filter(r => r.visibility?.hiddenFromAdmins === true).length;

    if (!superAdminAllowed && currentSystemSettings.globalPrivacy?.hideFromAdmins) {
        recordsLockBox.style.display = "block";
        recordsTableWrap.style.display = "none";
        recordsBadge.className = "badge badge-warning";
        recordsBadge.textContent = "پټ";
        return;
    }

    recordsLockBox.style.display = "none";
    recordsTableWrap.style.display = "block";

    const filtered = filterRecords(currentRecords, recordFilter.value);

    recordsBadge.className = "badge badge-info";
    recordsBadge.textContent = `${filtered.length} ریکارډونه`;

    if (!filtered.length) {
        renderRecordsEmpty("هیڅ ریکارډ پیدا نه شو.");
        return;
    }

    recordsTableBody.innerHTML = filtered.map(record => {
        const personName = getPersonName(record);
        const tazkira = getRecordTazkira(record);
        const editable = record.editable !== false;
        const hidden = record.visibility?.hiddenFromAdmins === true;
        const canEdit = editable;
        const canModify = isAdmin();

        return `
            <tr>
                <td>${escapeHtml(record.formNumber || "—")}</td>
                <td>${escapeHtml(personName)}</td>
                <td>${escapeHtml(tazkira)}</td>
                <td>${escapeHtml(record.category || "—")}</td>
                <td>
                    <span class="badge ${editable ? "badge-success" : "badge-danger"}">
                        ${editable ? "هو" : "نه"}
                    </span>
                </td>
                <td>
                    <span class="badge ${hidden ? "badge-warning" : "badge-info"}">
                        ${hidden ? "پټ" : "ښکاره"}
                    </span>
                </td>
                <td>
                    <div class="admin-table-actions">
                        <a class="btn btn-primary" href="./register.html?recordId=${encodeURIComponent(record.id)}">✏️ Edit</a>
                        <button type="button" class="btn btn-secondary" data-action="toggle-editable" data-id="${escapeHtml(record.id)}" ${canModify ? "" : "disabled"}>
                            ${editable ? "🔒 Lock" : "🔓 Unlock"}
                        </button>
                        <button type="button" class="btn btn-warning" data-action="toggle-visibility" data-id="${escapeHtml(record.id)}" ${superAdminAllowed ? "" : "disabled"}>
                            ${hidden ? "👁️ Show" : "🙈 Hide"}
                        </button>
                        <button type="button" class="btn btn-danger" data-action="delete-record" data-id="${escapeHtml(record.id)}" ${superAdminAllowed ? "" : "disabled"}>🗑️ حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// ==========================================
// Loaders
// ==========================================

async function loadAdmins() {
    hideMessage();

    try {
        adminsBadge.textContent = "لوډېږي...";
        const me = await getCurrentAdmin();
        updateMyInfo(me);

        superAdminAllowed = await isSuperAdmin();

        if (!superAdminAllowed) {
            renderEmpty("یوازې ستر ادمین د اډمین 💪 لست اداره کولی شی نور هیڅوک داصلاحیت نلری.");
            adminsBadge.className = "badge badge-warning";
            adminsBadge.textContent = "یوازی ستالپاره محدودیت سته ";
        }

        const result = await getAdmins();
        if (!result.success) {
            renderEmpty(result.message || "د ادمین لست ترلاسه نه شو.");
            showMessage(result.message || "د ادمین لست ترلاسه نه شو.", "danger");
            return;
        }

        currentAdmins = result.admins || [];
        renderAdmins(currentAdmins);
    } catch (error) {
        console.error("Load Admins Error:", error);
        renderEmpty("د ادمین معلومات ترلاسه نه شول.");
        showMessage("د ادمین معلومات ترلاسه نه شول.", "danger");
    }
}

async function loadRecords() {
    try {
        recordsBadge.textContent = "لوډېږي...";

        const result = await getRecords();
        if (!result.success) {
            renderRecordsEmpty(result.message || "د ریکارډونو لست ترلاسه نه شو.");
            showMessage(result.message || "د ریکارډونو لست ترلاسه نه شو.", "danger");
            return;
        }

        currentRecords = result.records || [];
        renderRecords(currentRecords);
    } catch (error) {
        console.error("Load Records Error:", error);
        renderRecordsEmpty("د ریکارډونو معلومات ترلاسه نه شول.");
        showMessage("د ریکارډونو معلومات ترلاسه نه شول.", "danger");
    }
}


// ==========================================
// Events
// ==========================================

createAdminForm.addEventListener("submit", async event => {
    event.preventDefault();
    hideMessage();

    if (!superAdminAllowed) {
        showMessage("یوازې ستر اډمین 💪 نوی پروفایل جوړولی شی نور هیڅوک داصلاحیت نلری.", "danger");
        return;
    }

    const uid = adminUid.value.trim();
    const email = adminEmail.value.trim();
    const name = adminName.value.trim();
    const role = adminRole.value;

    if (!uid) {
        showMessage("UID اجباري دی.", "danger");
        adminUid.focus();
        return;
    }

    if (!email) {
        showMessage("ایمیل اجباري دی.", "danger");
        adminEmail.focus();
        return;
    }

    createAdminBtn.disabled = true;
    createAdminBtn.textContent = "⏳ جوړېږي...";

    try {
        const result = await createAdminProfile({ uid, email, role, name });

        if (!result.success) {
            showMessage(result.message || "پروفایل جوړ نه شو.", "danger");
            return;
        }

        showMessage(result.message || "ادمین پروفایل جوړ شو.", "success");
        createAdminForm.reset();
        adminRole.value = "user";
        await loadAdmins();
    } catch (error) {
        console.error("Create Admin Error:", error);
        showMessage("پروفایل جوړ نه شو.", "danger");
    } finally {
        createAdminBtn.disabled = false;
        createAdminBtn.textContent = "➕ پروفایل جوړول";
    }
});

clearAdminFormBtn.addEventListener("click", () => {
    hideMessage();
    createAdminForm.reset();
    adminRole.value = "user";
});

adminsTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    hideMessage();

    if (!superAdminAllowed) {
        showMessage("یوازې ستر اډمین 💪 دا عملیات ترسره کولی نور هیڅوک داصلاحیت نلری.", "danger");
        return;
    }

    const action = button.dataset.action;
    const uid = button.dataset.uid;
    const row = button.closest("tr");

    try {
        if (action === "update-role") {
            const select = row.querySelector('select[data-action="role-select"]');
            const role = select?.value || "user";
            button.disabled = true;
            button.textContent = "⏳";
            const result = await updateAdminRole(uid, role);
            if (!result.success) {
                showMessage(result.message || "صلاحیت بدل نه شو.", "danger");
                return;
            }
            showMessage(result.message || "صلاحیت بدل شو.", "success");
            await loadAdmins();
        }

        if (action === "toggle-active") {
            const active = button.dataset.active === "1";
            button.disabled = true;
            button.textContent = "⏳";
            const result = await setAdminStatus(uid, !active);
            if (!result.success) {
                showMessage(result.message || "حالت بدل نه شو.", "danger");
                return;
            }
            showMessage(result.message || "حالت بدل شو.", "success");
            await loadAdmins();
        }

        if (action === "delete-admin") {
            const confirmed = window.confirm("ایا غواړې دا ادمین پروفایل حذف کړې؟");
            if (!confirmed) return;

            button.disabled = true;
            button.textContent = "⏳";
            const result = await deleteAdminProfile(uid);
            if (!result.success) {
                showMessage(result.message || "پروفایل حذف نه شو.", "danger");
                return;
            }
            showMessage(result.message || "پروفایل حذف شو.", "success");
            await loadAdmins();
        }
    } catch (error) {
        console.error("Admin Action Error:", error);
        showMessage("عملیات ترسره نه شو.", "danger");
    } finally {
        button.disabled = false;
        if (action === "update-role") button.textContent = "بدلول";
        if (action === "toggle-active") button.textContent = button.dataset.active === "1" ? "غیرفعالول" : "فعالول";
        if (action === "delete-admin") button.textContent = "حذف";
    }
});

recordFilter.addEventListener("input", () => {
    renderRecords(currentRecords);
});

recordsTableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const recordId = button.dataset.id;

    if (action === "toggle-editable") {
        if (!(await isAdmin())) {
            showMessage("یوازې ادمین دا عملیات ترسره کولی شی ته داصلاحیت نلری.", "danger");
            return;
        }

        button.disabled = true;
        const current = currentRecords.find(r => r.id === recordId);
        const nextEditable = !(current?.editable !== false);

        const result = await updateRecordEditable(recordId, nextEditable);
        if (!result.success) {
            showMessage(result.message || "ریکارډ بدل نه شو.", "danger");
            button.disabled = false;
            return;
        }

        showMessage(result.message || "ریکارډ بدل شو.", "success");
        await loadRecords();
        return;
    }

    if (action === "toggle-visibility") {
        if (!superAdminAllowed) {
            showMessage("یوازې ستر ادمین visibility بدلولی ته داصلاحیت نلری.", "danger");
            return;
        }

        button.disabled = true;
        const current = currentRecords.find(r => r.id === recordId);
        const currentHidden = current?.visibility?.hiddenFromAdmins === true;
        const result = await updateRecordVisibility(recordId, !currentHidden);

        if (!result.success) {
            showMessage(result.message || "ریکارډ visibility بدل نه شو.", "danger");
            button.disabled = false;
            return;
        }

        showMessage(result.message || "ریکارډ visibility بدل شو.", "success");
        await loadRecords();
        return;
    }

    if (action === "delete-record") {
        if (!superAdminAllowed) {
            showMessage("یوازې ستر ادمین 💪ریکارډ حذف کولی شی ته داصلاحیت نلری.", "danger");
            return;
        }

        const confirmed = window.confirm("ایا غواړې دا ریکارډ په بشپړ ډول حذف کړې؟");
        if (!confirmed) return;

        button.disabled = true;
        const result = await deleteRecord(recordId);

        if (!result.success) {
            showMessage(result.message || "ریکارډ حذف نه شو.", "danger");
            button.disabled = false;
            return;
        }

        showMessage(result.message || "ریکارډ حذف شو.", "success");
        await loadRecords();
    }
});

savePrivacyBtn.addEventListener("click", async () => {
    await savePrivacySettings();
});

addFieldBtn.addEventListener("click", () => {
    addCustomFieldPrompt();
});

fieldsTable.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action='delete-field']");
    if (!button) return;

    const row = button.closest("tr");
    const key = row?.getAttribute("data-field-key");
    if (!key) return;

    if (DEFAULT_FIELD_CONFIG[key] && DEFAULT_FIELD_CONFIG[key].deletable === false) {
        showMessage("دا فیلډ حذف کېدای نه شي.", "warning");
        return;
    }

    const confirmed = window.confirm(`ایا غواړې "${key}" فیلډ حذف کړې؟`);
    if (!confirmed) return;

    deleteFieldFromTable(key);
    showMessage("فیلډ له جدول څخه لیرې شو. د خوندي کولو تڼۍ ووهه.", "success");
});

saveFieldsBtn.addEventListener("click", async () => {
    await saveFieldsSettings();
});

resetFieldsBtn.addEventListener("click", async () => {
    if (!(await isSuperAdmin())) {
        showMessage("یوازې Super Admin د فیلډونو اصل حالت راګرځولی شي.", "danger");
        return;
    }

    currentSystemSettings = getDefaultSystemSettings();
    renderFieldConfigTable(currentSystemSettings);
    hideFromAdmins.checked = false;
    hideFromStaff.checked = false;
    hideFromUsers.checked = false;
    showMessage("د فیلډونو اصل حالت راګرځول شو. د خوندي کولو تڼۍ ووهه.", "success");
});

refreshBtn.addEventListener("click", () => {
    window.location.reload();
});

logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    const result = await logoutUser();
    if (result.success) {
        window.location.href = "./index.html";
        return;
    }
    showMessage(result.message || "له سیستم څخه وتل ناکام شول.", "danger");
    logoutBtn.disabled = false;
});

document.getElementById("dashboardBtn").addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

document.getElementById("dashboardMenuBtn").addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

document.getElementById("registerMenuBtn").addEventListener("click", () => {
    window.location.href = "./register.html";
});

document.getElementById("searchMenuBtn").addEventListener("click", () => {
    window.location.href = "./search.html";
});

document.getElementById("reportsMenuBtn").addEventListener("click", () => {
    window.location.href = "./reports.html";
});

document.getElementById("adminMenuBtn").addEventListener("click", () => {
    window.location.href = "./admin.html";
});

document.getElementById("settingsMenuBtn").addEventListener("click", () => {
    window.location.href = "./settings.html";
});


// ==========================================
// Authentication + Initial Load
// ==========================================

listenAuth(async session => {
    if (!session) {
        window.location.href = "./index.html";
        return;
    }

    await initializeSettings();
    await loadSystemSettings();
    await loadAdmins();
    await loadRecords();
});
document.getElementById("formicMenuBtn")?.addEventListener("click", () => {
    window.location.href = "./formic.html";
});