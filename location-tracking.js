// ==========================================
// د افغانستان اسلامی امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس
// location-tracking.js
// Secure User Location Tracking Engine
// ==========================================

import { auth, db } from "./firebase.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ==========================================
// System Name
// ==========================================

export const SYSTEM_NAME =
    "د افغانستان اسلامی امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس";


// ==========================================
// Configuration
// ==========================================

const LOCATION_COLLECTION = "user_locations";


// ==========================================
// State
// ==========================================

let locationWatcherId = null;
let authUnsubscribe = null;
let currentUser = null;
let isInitializing = false;


// ==========================================
// Browser Geolocation Support
// ==========================================

function isGeolocationSupported() {
    return (
        typeof navigator !== "undefined" &&
        "geolocation" in navigator
    );
}


// ==========================================
// Get Current User
// ==========================================

function getAuthenticatedUser() {
    return auth.currentUser || currentUser || null;
}


// ==========================================
// Save Location
// ==========================================

async function saveUserLocation(user, position) {
    if (!user || !position) {
        return {
            success: false,
            message: "کاروونکی یا Location موجود نه دی."
        };
    }

    const latitude = Number(position.coords.latitude);
    const longitude = Number(position.coords.longitude);
    const accuracy = Number(position.coords.accuracy);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return {
            success: false,
            message: "د Location معلومات ناسم دي."
        };
    }

    const locationRef = doc(db, LOCATION_COLLECTION, user.uid);

    await setDoc(
        locationRef,
        {
            uid: user.uid,
            email: user.email || "",
            latitude,
            longitude,
            accuracy: Number.isFinite(accuracy) ? accuracy : null,
            locationGranted: true,
            systemName: SYSTEM_NAME,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );

    return {
        success: true
    };
}


// ==========================================
// Request Location Permission
// ==========================================
//
// مهم:
// - که user موجود وي، Location به Firestore ته هم ثبت شي.
// - که user موجود نه وي، یوازې Permission prompt به ښکاره شي
//   (دا د login page لپاره اړین دی).
// ==========================================

export function requestLocationPermission(user = null) {
    return new Promise((resolve) => {
        const activeUser = user || getAuthenticatedUser();

        if (!isGeolocationSupported()) {
            resolve({
                success: false,
                permission: "unsupported",
                message: "ستاسو Browser د Location خدمت نه ملاتړ کوي."
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // که کاروونکی login وي، Location هم Firestore ته ثبت کړه
                    if (activeUser) {
                        const result = await saveUserLocation(activeUser, position);

                        if (!result.success) {
                            resolve({
                                success: false,
                                permission: "denied",
                                message: result.message
                            });
                            return;
                        }
                    }

                    resolve({
                        success: true,
                        permission: "granted",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        saved: Boolean(activeUser)
                    });
                } catch (error) {
                    console.error("Save Location Error:", error);

                    resolve({
                        success: false,
                        permission: "error",
                        message: error.message || "Location ثبت نه شو."
                    });
                }
            },
            (error) => {
                let message = "د Location اجازه ترلاسه نه شوه.";
                let permission = "unknown";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        permission = "denied";
                        message = "د Location اجازه رد شوه.";
                        break;

                    case error.POSITION_UNAVAILABLE:
                        permission = "unavailable";
                        message = "ستاسو Location اوس معلومېدلی نه شي.";
                        break;

                    case error.TIMEOUT:
                        permission = "timeout";
                        message = "د Location معلومولو وخت پای ته ورسېد.";
                        break;
                }

                resolve({
                    success: false,
                    permission,
                    message
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    });
}


// ==========================================
// Start Location Watch
// ==========================================

export function startLocationTracking() {
    const user = getAuthenticatedUser();

    if (!user) {
        return {
            success: false,
            message: "کاروونکی Login نه دی."
        };
    }

    if (!isGeolocationSupported()) {
        return {
            success: false,
            message: "Browser د Location ملاتړ نه کوي."
        };
    }

    stopLocationTracking();

    locationWatcherId = navigator.geolocation.watchPosition(
        async (position) => {
            try {
                await saveUserLocation(user, position);
            } catch (error) {
                console.error("Location Watch Save Error:", error);
            }
        },
        (error) => {
            console.error("Location Watch Error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000
        }
    );

    return {
        success: true
    };
}


// ==========================================
// Stop Location Watch
// ==========================================

export function stopLocationTracking() {
    if (locationWatcherId !== null && navigator?.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(locationWatcherId);
        locationWatcherId = null;
    }
}


// ==========================================
// Initialize Location System
// ==========================================
//
// دا function د login وروسته اتومات watch پیلوي
// او که کاروونکی مخکې login کړی وي، موقعیت ثبتوي.
// ==========================================

export function initializeLocationTracking() {
    if (isInitializing) {
        return authUnsubscribe;
    }

    isInitializing = true;

    if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
    }

    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        stopLocationTracking();
        currentUser = user || null;

        if (!user) {
            return;
        }

        try {
            // د login وروسته د current user لپاره location ثبت کړه
            const result = await requestLocationPermission(user);

            if (result.success) {
                startLocationTracking();
            }
        } catch (error) {
            console.error("Initialize Location Tracking Error:", error);
        }
    });

    isInitializing = false;
    return authUnsubscribe;
}


// ==========================================
// Get Location Tracking State
// ==========================================

export function isLocationTrackingActive() {
    return locationWatcherId !== null;
}


// ==========================================
// Get Current Location Once
// ==========================================

export function getCurrentLocation() {
    return requestLocationPermission(getAuthenticatedUser());
}


// ==========================================
// Cleanup
// ==========================================

export function destroyLocationTracking() {
    stopLocationTracking();

    if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
    }

    currentUser = null;
}


// ==========================================
// Default Export
// ==========================================

export default {
    SYSTEM_NAME,
    requestLocationPermission,
    startLocationTracking,
    stopLocationTracking,
    initializeLocationTracking,
    isLocationTrackingActive,
    getCurrentLocation,
    destroyLocationTracking
};