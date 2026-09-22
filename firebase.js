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
    initializeAuth,
    browserSessionPersistence
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
//
// مهم:
//
// پخوانی:
//     getAuth(app)
//
// نوی:
//     initializeAuth(
//         app,
//         {
//             persistence:
//                 browserSessionPersistence
//         }
//     )
//
// نتیجه:
//
// 1. Login به د همدې Browser/App Session
//    پورې ساتل کېږي.
//
// 2. د Browser/App Session له ختمېدو وروسته
//    Auth state باید بېرته موجود نه وي.
//
// 3. د داخلي System Navigation پر مهال
//    Login نه غواړي.
//
// 4. د APK/PWA په عادي session lifecycle کې
//    د app له بشپړ تړلو وروسته بیا Login
//    غوښتل کېږي.
//
// ==========================================

const auth =
    initializeAuth(
        app,
        {
            persistence:
                browserSessionPersistence
        }
    );


// ==========================================
// Firebase Firestore
//
// Persistent Local Cache
//
// مهم:
//
// Auth persistence او Firestore cache
// دوه جلا شیان دي.
//
// Firestore cache یوازې د Database
// offline/cache لپاره دی.
//
// دا د Login Session نه ساتي.
//
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