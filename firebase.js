// ==========================================
// Hafz Admin Online System
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
    apiKey: "AIzaSyDI-AvCYCYb9tN8zQq3RFMjOnQXYWUN5UQ",
    authDomain: "hafz-admin-online-system.firebaseapp.com",
    projectId: "hafz-admin-online-system",
    storageBucket: "hafz-admin-online-system.firebasestorage.app",
    messagingSenderId: "941143292545",
    appId: "1:941143292545:web:66bdbfe5879d6803b9eb80"
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
// د Formic لپاره مهم:
// - د آنلاین لنډمهاله ستونزې پر مهال
//   محلي cache کاروي.
// - د pending بدلونونو د ساتلو زمینه برابروي.
// - د شبکې بېرته راتلو سره
//   Firestore synchronization ته زمینه برابروي.
//
// د نورو سیستمونو جوړښت نه بدلوي.
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