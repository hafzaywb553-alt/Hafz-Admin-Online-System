// ==========================================
// Hafz Admin Online System
// auth.js
// Authentication Engine
// ==========================================

import { auth, db } from "./firebase.js";

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
// Firestore Collection
// ==========================================

const ADMINS_COLLECTION = "admins";


// ==========================================
// Allowed Roles
// ==========================================

const ALLOWED_ROLES = [
    "superadmin",
    "admin",
    "user"
];


// ==========================================
// Safe Redirect
// ==========================================

function redirectToLogin() {
    if (typeof window !== "undefined" && window.location) {
        window.location.replace("./login.html");
    }
}


// ==========================================
// Normalize Helpers
// ==========================================

function normalizeText(value) {
    return String(value || "").trim();
}

function normalizeRole(role) {
    return normalizeText(role).toLowerCase();
}

function isValidRole(role) {
    return ALLOWED_ROLES.includes(normalizeRole(role));
}


// ==========================================
// Get Admin Profile By UID
// ==========================================
//
// مهم:
// دا function اوس مستقیم doc read کوي:
// admins/{user.uid}
//
/* If a legacy document still exists at:
   admins/superadmin
   and it contains uid == current user.uid,
   we also try it as fallback.
*/
// ==========================================

export async function getAdminProfile(user) {
    try {
        if (!user || !user.uid) {
            return null;
        }

        const currentUid = normalizeText(user.uid);

        // --------------------------------------
        // 1) Direct UID-based document
        // --------------------------------------
        const uidDocRef = doc(
            db,
            ADMINS_COLLECTION,
            currentUid
        );

        let snapshot = await getDoc(uidDocRef);

        // --------------------------------------
        // 2) Legacy fallback: admins/superadmin
        // --------------------------------------
        if (!snapshot.exists()) {
            const legacyRef = doc(
                db,
                ADMINS_COLLECTION,
                "superadmin"
            );
            snapshot = await getDoc(legacyRef);
        }

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data() || {};

        const storedUid = normalizeText(data.uid);
        const storedEmail = normalizeText(data.email).toLowerCase();
        const currentEmail = normalizeText(user.email).toLowerCase();

        // --------------------------------------
        // UID Verification
        // --------------------------------------
        if (storedUid && storedUid !== currentUid) {
            return null;
        }

        // --------------------------------------
        // Optional email sanity check
        // --------------------------------------
        if (storedEmail && currentEmail && storedEmail !== currentEmail) {
            return null;
        }

        // --------------------------------------
        // Active Status
        // --------------------------------------
        if (data.active !== true) {
            return null;
        }

        // --------------------------------------
        // Role Verification
        // --------------------------------------
        const role = normalizeRole(data.role);

        if (!isValidRole(role)) {
            return null;
        }

        return {
            id: snapshot.id,
            uid: storedUid || currentUid,
            email: storedEmail || currentEmail || "",
            name: normalizeText(data.name || ""),
            role,
            active: true,
            ...data
        };
    } catch (error) {
        console.error("Get Admin Profile Error:", error);
        return null;
    }
}


// ==========================================
// Login
// ==========================================

export async function loginUser(email, password) {
    try {
        email = String(email || "").trim();
        password = String(password || "");

        // --------------------------------------
        // Email Validation
        // --------------------------------------
        if (!email) {
            return {
                success: false,
                message: "ایمیل ولیکئ."
            };
        }

        // --------------------------------------
        // Password Validation
        // --------------------------------------
        if (!password) {
            return {
                success: false,
                message: "پاسورډ ولیکئ."
            };
        }

        // --------------------------------------
        // Firebase Authentication Login
        // --------------------------------------
        const result = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = result.user;

        // --------------------------------------
        // Find Firestore Admin Profile
        // --------------------------------------
        const profile = await getAdminProfile(user);

        // --------------------------------------
        // Profile Not Found
        // --------------------------------------
        if (!profile) {
            await signOut(auth);
            return {
                success: false,
                message: "ستاسو حساب د Hafz Admin Online System په Admin لست کې نشته."
            };
        }

        // --------------------------------------
        // Active Check
        // --------------------------------------
        if (profile.active !== true) {
            await signOut(auth);
            return {
                success: false,
                message: "ستاسو حساب غیر فعال شوی دی."
            };
        }

        // --------------------------------------
        // Role Verification
        // --------------------------------------
        if (!ALLOWED_ROLES.includes(profile.role)) {
            await signOut(auth);
            return {
                success: false,
                message: "ستاسو د حساب صلاحیت ناسم دی."
            };
        }

        return {
            success: true,
            user,
            profile
        };
    } catch (error) {
        console.error("Login Error:", error);

        let message = "Login ترسره نه شو.";

        switch (error.code) {
            case "auth/invalid-email":
                message = "ایمیل ناسم دی.";
                break;

            case "auth/user-not-found":
                message = "دا ایمیل ثبت شوی نه دی.";
                break;

            case "auth/wrong-password":
                message = "پاسورډ ناسم دی.";
                break;

            case "auth/invalid-credential":
                message = "ایمیل یا پاسورډ ناسم دی.";
                break;

            case "auth/too-many-requests":
                message = "ډېرې ناکامې هڅې شوې دي. لږ وروسته بیا هڅه وکړئ.";
                break;

            case "auth/user-disabled":
                message = "دا حساب غیر فعال شوی دی.";
                break;

            case "auth/network-request-failed":
                message = "د انټرنېټ اړیکه ستونزه لري.";
                break;

            case "auth/operation-not-allowed":
                message = "د ایمیل او پاسورډ Login په Firebase کې فعال نه دی.";
                break;

            default:
                message = error.message || message;
        }

        return {
            success: false,
            message
        };
    }
}


// ==========================================
// Logout
// ==========================================

export async function logoutUser() {
    try {
        await signOut(auth);

        redirectToLogin();

        return {
            success: true
        };
    } catch (error) {
        console.error("Logout Error:", error);

        return {
            success: false,
            message: error.message || "له سیستم څخه وتل ناکام شول."
        };
    }
}


// ==========================================
// Password Reset
// ==========================================

export async function resetPassword(email) {
    try {
        email = String(email || "").trim();

        if (!email) {
            return {
                success: false,
                message: "خپل ایمیل ولیکئ."
            };
        }

        await sendPasswordResetEmail(auth, email);

        return {
            success: true,
            message: "د پاسورډ د بدلولو لینک ستاسو ایمیل ته واستول شو."
        };
    } catch (error) {
        console.error("Password Reset Error:", error);

        let message = "د پاسورډ د بدلولو ایمیل ونه لېږل شو.";

        switch (error.code) {
            case "auth/invalid-email":
                message = "ایمیل ناسم دی.";
                break;

            case "auth/user-not-found":
                message = "دا ایمیل په Firebase Authentication کې نشته.";
                break;

            case "auth/network-request-failed":
                message = "د انټرنېټ اړیکه ستونزه لري.";
                break;

            default:
                message = error.message || message;
        }

        return {
            success: false,
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
//
// دا function د Firebase User او
// Firestore Admin Profile دواړه راولي.
//
// ==========================================

export async function getCurrentSession() {
    try {
        const user = auth.currentUser;

        if (!user) {
            return null;
        }

        const profile = await getAdminProfile(user);

        if (!profile) {
            await signOut(auth);
            return null;
        }

        return {
            user,
            profile
        };
    } catch (error) {
        console.error("Get Current Session Error:", error);
        return null;
    }
}


// ==========================================
// Authentication Listener
// ==========================================
//
// هره پاڼه کولی شي دا function
// د Login حالت معلومولو لپاره استعمال کړي.
//
// ==========================================

export function listenAuth(callback) {
    if (typeof callback !== "function") {
        throw new Error("listenAuth callback باید function وي.");
    }

    return onAuthStateChanged(auth, async (user) => {
        if (!user) {
            callback(null);
            return;
        }

        try {
            const profile = await getAdminProfile(user);

            if (!profile) {
                await signOut(auth);
                callback(null);
                return;
            }

            if (profile.active !== true) {
                await signOut(auth);
                callback(null);
                return;
            }

            callback({
                user,
                profile
            });
        } catch (error) {
            console.error("Auth Listener Error:", error);

            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error("Auth Listener SignOut Error:", signOutError);
            }

            callback(null);
        }
    });
}


// ==========================================
// Check Authentication
// ==========================================

export async function isAuthenticated() {
    const session = await getCurrentSession();
    return Boolean(session);
}


// ==========================================
// Check Specific Role
// ==========================================

export async function hasRole(allowedRoles = []) {
    const session = await getCurrentSession();

    if (!session) {
        return false;
    }

    const role = String(session.profile?.role || "")
        .trim()
        .toLowerCase();

    const normalizedAllowedRoles = allowedRoles
        .map(value => String(value).trim().toLowerCase());

    return normalizedAllowedRoles.includes(role);
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