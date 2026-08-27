// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت ډیټابیس
// firebase.js
// Firebase Configuration
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    initializeFirestore,
    persistentLocalCache
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";


// ==========================================
// Firebase Configuration
// ==========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDI-AvCYCYb9tN8zQq3RFMjOnQXYWUN5UQ",

    authDomain:
        "hafz-admin-online-system.firebaseapp.com",

    projectId:
        "hafz-admin-online-system",

    storageBucket:
        "hafz-admin-online-system.firebasestorage.app",

    messagingSenderId:
        "941143292545",

    appId:
        "1:941143292545:web:66bdbfe5879d6803b9eb80"

};


// ==========================================
// Initialize Firebase
// ==========================================

const app =
    initializeApp(
        firebaseConfig
    );


// ==========================================
// Firebase Authentication
// ==========================================

const auth =
    getAuth(
        app
    );


// ==========================================
// Firebase Firestore
//
// Persistent Local Cache
//
// د سیستم لپاره مهم:
//
// 1. د Firestore محلي Cache فعالوي.
// 2. د انټرنېټ لنډمهاله پرېکېدو پر مهال
//    موجود معلومات Cache کې ساتي.
// 3. Pending Writes د Firebase
//    synchronization ته زمینه برابروي.
// 4. کله چې انټرنېټ بېرته وصل شي،
//    Firestore Sync ترسره کوي.
//
// مهم:
// دا د Security Rules بدیل نه دی.
// اصلي امنیت د firestore.rules
// له لارې تضمینېږي.
// ==========================================

const db =
    initializeFirestore(
        app,
        {
            localCache:
                persistentLocalCache()
        }
    );


// ==========================================
// Firebase Storage
// ==========================================

const storage =
    getStorage(
        app
    );


// ==========================================
// Exports
// ==========================================

export {

    app,

    auth,

    db,

    storage

};