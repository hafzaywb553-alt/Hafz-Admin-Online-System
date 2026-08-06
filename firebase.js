// ==========================================
// Hafz Admin Online System
// firebase.js
// Firebase Configuration
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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

const app = initializeApp(firebaseConfig);


// ==========================================
// Firebase Services
// ==========================================

const auth = getAuth(app);

const db = getFirestore(app);


// ==========================================
// Exports
// ==========================================

export {
  app,
  auth,
  db
};