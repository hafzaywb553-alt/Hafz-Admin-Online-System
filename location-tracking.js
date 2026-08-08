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
// Browser خپله د Location اجازه غواړي.
// د کاروونکي له خوا Allow/Block پرېکړه
// په Browser کې ترسره کېږي.
// ==========================================

export function requestLocationPermission() {
    return new Promise((resolve) => {
        const user = getAuthenticatedUser();

        if (!user) {
            resolve({
                success: false,
                permission: "not-authenticated",
                message: "لومړی سیستم ته Login وکړئ."
            });
            return;
        }

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
                    const result = await saveUserLocation(user, position);

                    if (!result.success) {
                        resolve({
                            success: false,
                            permission: "denied",
                            message: result.message
                        });
                        return;
                    }

                    resolve({
                        success: true,
                        permission: "granted",
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
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
    if (locationWatcherId !== null) {
        navigator.geolocation.clearWatch(locationWatcherId);
        locationWatcherId = null;
    }
}


// ==========================================
// Initialize Location System
// ==========================================

export function initializeLocationTracking() {
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

        // Browser permission باید کاروونکی خپله Allow کړي.
        const result = await requestLocationPermission();

        if (result.success) {
            startLocationTracking();
        }
    });

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
    return requestLocationPermission();
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