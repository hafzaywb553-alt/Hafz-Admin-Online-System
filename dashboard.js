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

import {
    initializeLocationTracking,
    isLocationTrackingActive,
    getCurrentLocation
} from "./location-tracking.js";


// ==========================================
// Location Tracking Bootstrap
// ==========================================

let dashboardLocationTrackingInitialized = false;

export function initializeDashboardLocationTracking() {
    if (dashboardLocationTrackingInitialized) {
        return {
            success: true,
            message: "Location tracking already initialized."
        };
    }

    dashboardLocationTrackingInitialized = true;

    try {
        initializeLocationTracking();

        return {
            success: true,
            message: "Location tracking initialized."
        };
    } catch (error) {
        console.error("Initialize Dashboard Location Tracking Error:", error);

        dashboardLocationTrackingInitialized = false;

        return {
            success: false,
            message: error.message || "Location tracking initialize نه شو."
        };
    }
}

export function getDashboardLocationState() {
    return {
        initialized: dashboardLocationTrackingInitialized,
        active: isLocationTrackingActive()
    };
}

export async function requestCurrentLocation() {
    return getCurrentLocation();
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

        const recordsRef =
            collection(db, "records");

        const snapshot =
            await getCountFromServer(recordsRef);

        return {
            success: true,
            count: snapshot.data().count
        };

    } catch (error) {

        console.error(
            "Records Count Error:",
            error
        );

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
//

export async function getOnlineUsersCount() {

    try {

        const presenceRef =
            collection(db, "presence");

        const onlineQuery = query(
            presenceRef,
            where("online", "==", true)
        );

        const snapshot =
            await getCountFromServer(
                onlineQuery
            );

        return {
            success: true,
            count: snapshot.data().count
        };

    } catch (error) {

        console.error(
            "Online Users Count Error:",
            error
        );

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

    const records =
        await getRecordsCount();

    const online =
        await getOnlineUsersCount();

    return {

        records: records.success ?
            records.count :
            0,

        onlineUsers: online.success ?
            online.count :
            0,

        locationTrackingActive:
            isLocationTrackingActive()

    };
}


// ==========================================
// Auto Initialize Location Tracking
// ==========================================
//
// دا یوازې د dashboard.js لپاره دی.
// که dashboard.html دا module load کړي,
// location tracking به همغږی پیل شي.
// ==========================================

if (
    typeof window !== "undefined" &&
    typeof document !== "undefined"
) {
    initializeDashboardLocationTracking();
}