// ==========================================
// Hafz Admin Online System
// admin.js
// Admin Management Engine
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


// ==========================================
// Collections
// ==========================================

const ADMINS_COLLECTION = "admins";


// ==========================================
// Allowed Roles
// ==========================================

export const ADMIN_ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    USER: "user"
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


// ==========================================
// Get Current Admin
// ==========================================

export async function getCurrentAdmin() {
    try {
        const user = auth.currentUser;

        if (!user) {
            return null;
        }

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            user.uid
        );

        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data() || {};

        const storedUid = normalizeText(data.uid);
        const currentUid = normalizeText(user.uid);

        if (storedUid && storedUid !== currentUid) {
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


// ==========================================
// Check Role
// ==========================================

export async function hasRole(allowedRoles = []) {
    const admin = await getCurrentAdmin();

    if (!admin) {
        return false;
    }

    const role = normalizeRole(admin.role);

    return allowedRoles.includes(role);
}


// ==========================================
// Is Super Admin
// ==========================================

export async function isSuperAdmin() {
    return hasRole([ADMIN_ROLES.SUPERADMIN]);
}


// ==========================================
// Is Admin
// ==========================================

export async function isAdmin() {
    return hasRole([
        ADMIN_ROLES.SUPERADMIN,
        ADMIN_ROLES.ADMIN
    ]);
}


// ==========================================
// Is User
// ==========================================

export async function isUser() {
    return hasRole([
        ADMIN_ROLES.SUPERADMIN,
        ADMIN_ROLES.ADMIN,
        ADMIN_ROLES.USER
    ]);
}


// ==========================================
// Get All Admins
// ==========================================

export async function getAdmins() {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                admins: [],
                message: "یوازې Super Admin د کاروونکو لست لیدلی شي."
            };
        }

        const snapshot = await getDocs(
            collection(db, ADMINS_COLLECTION)
        );

        const admins = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
        }));

        admins.sort((a, b) => {
            const aName = normalizeText(a.name || a.email || a.id).toLowerCase();
            const bName = normalizeText(b.name || b.email || b.id).toLowerCase();
            return aName.localeCompare(bName);
        });

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


// ==========================================
// Get Admin By UID
// ==========================================

export async function getAdminByUid(uid) {
    try {
        uid = normalizeText(uid);

        if (!uid) {
            return null;
        }

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

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


// ==========================================
// Get Admin By Email
// ==========================================

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


// ==========================================
// Create Admin Profile
// ==========================================
//
// مهم:
// Firebase Authentication حساب باید
// لومړی په Firebase Console کې جوړ شي.
// بیا د هغه حساب UID دلته استعمالېږي.
//

export async function createAdminProfile({
    uid,
    email,
    role = ADMIN_ROLES.USER,
    name = ""
} = {}) {
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

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

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
            await writeAudit(
                AUDIT_ACTIONS.USER_CREATED,
                `کاروونکی ثبت شو: ${email}`
            );
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


// ==========================================
// Update Admin Profile
// ==========================================

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

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

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
            await writeAudit(
                AUDIT_ACTIONS.ADMIN_UPDATE,
                `کاروونکی Update شو: ${uid}`
            );
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


// ==========================================
// Update Admin Role
// ==========================================

export async function updateAdminRole(uid, role) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې Super Admin د Role بدلولو اجازه لري."
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

        if (
            uid === auth.currentUser?.uid &&
            role !== ADMIN_ROLES.SUPERADMIN
        ) {
            return {
                success: false,
                message: "خپل Super Admin صلاحیت مه کموی."
            };
        }

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

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


// ==========================================
// Activate / Deactivate Admin
// ==========================================

export async function setAdminStatus(uid, active) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې Super Admin د کاروونکي حالت بدلولی شي."
            };
        }

        uid = normalizeText(uid);

        if (!uid) {
            return {
                success: false,
                message: "UID موجود نه دی."
            };
        }

        if (
            uid === auth.currentUser?.uid &&
            active === false
        ) {
            return {
                success: false,
                message: "خپل Super Admin حساب غیر فعالولی نه شئ."
            };
        }

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

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


// ==========================================
// Delete Admin Profile
// ==========================================
//
// یوازې Firestore Profile حذفوي.
// Firebase Authentication حساب نه حذفوي.
//

export async function deleteAdminProfile(uid) {
    try {
        if (!(await isSuperAdmin())) {
            return {
                success: false,
                message: "یوازې Super Admin کاروونکی حذف کولی شي."
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
                message: "خپل Super Admin حساب نه شئ حذف کولی."
            };
        }

        const adminRef = doc(
            db,
            ADMINS_COLLECTION,
            uid
        );

        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {
            return {
                success: false,
                message: "کاروونکی پیدا نه شو."
            };
        }

        await deleteDoc(adminRef);

        try {
            await writeAudit(
                AUDIT_ACTIONS.DELETE,
                `د Admin Profile حذف شو: ${uid}`
            );
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