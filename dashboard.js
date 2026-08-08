// ==========================================
// د افغانستان اسلامی امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
// dashboard.js
// Dashboard Engine
// ==========================================

import { auth, db } from "./firebase.js";

import {
    collection,
    getCountFromServer,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// State
// ==========================================

let dashboardInitialized = false;


// ==========================================
// Location API Stubs (Disabled)
// ==========================================
//
// Location غوښتنه په بشپړ ډول لرې شوې ده.
// دا stubs یوازې د backward compatibility لپاره دي
// څو که بل فایل یې import کوي، system error ورنه کړي.
// ==========================================

export function initializeDashboardLocationTracking() {
    return {
        success: true,
        enabled: false,
        message: "Location tracking disabled."
    };
}

export function getDashboardLocationState() {
    return {
        initialized: dashboardInitialized,
        active: false,
        enabled: false
    };
}

export async function requestCurrentLocation() {
    return {
        success: false,
        enabled: false,
        message: "Location tracking disabled."
    };
}


// ==========================================
// Get Current User
// ==========================================

export function getDashboardUser() {
    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    return user;
}


// ==========================================
// Get Current User Email
// ==========================================

export function getUserEmail() {
    const user = getDashboardUser();
    return user ? user.email : "";
}


// ==========================================
// Get Records Count
// ==========================================

export async function getRecordsCount() {
    try {
        const recordsRef = collection(db, "records");
        const snapshot = await getCountFromServer(recordsRef);

        return {
            success: true,
            count: snapshot.data().count
        };
    } catch (error) {
        console.error("Records Count Error:", error);

        return {
            success: false,
            count: 0,
            message: error.message
        };
    }
}


// ==========================================
// Get Online Users Count
// ==========================================
//
// د حقیقي آنلاین کسانو سیستم
// presence.js کې مدیریت کېږي.
// ==========================================

export async function getOnlineUsersCount() {
    try {
        const presenceRef = collection(db, "presence");

        const onlineQuery = query(
            presenceRef,
            where("online", "==", true)
        );

        const snapshot = await getCountFromServer(onlineQuery);

        return {
            success: true,
            count: snapshot.data().count
        };
    } catch (error) {
        console.error("Online Users Count Error:", error);

        return {
            success: false,
            count: 0,
            message: error.message
        };
    }
}


// ==========================================
// Dashboard Statistics
// ==========================================

export async function getDashboardStats() {
    const records = await getRecordsCount();
    const online = await getOnlineUsersCount();

    return {
        records: records.success ? records.count : 0,
        onlineUsers: online.success ? online.count : 0,
        locationTrackingActive: false
    };
}


// ==========================================
// Initialize Dashboard
// ==========================================
//
// د backward compatibility لپاره یوازې یو flag.
// ==========================================

export function initializeDashboard() {
    dashboardInitialized = true;
    return {
        success: true,
        message: "Dashboard initialized."
    };
}


// ==========================================
// Export Default
// ==========================================

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