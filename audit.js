// ==========================================
// Hafz Admin Online System
// audit.js
// System Activity Log
// ==========================================

import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// Audit Collection
// ==========================================

const AUDIT_COLLECTION = "audit";


// ==========================================
// Write Audit Log
// ==========================================

export async function writeAudit(
  action,
  details = ""
) {
  
  try {
    
    const user = auth.currentUser;
    
    
    // که کاروونکی Login نه وي
    if (!user) {
      console.warn(
        "Audit: کاروونکی Login نه دی."
      );
      
      return {
        success: false,
        message: "کاروونکی Login نه دی."
      };
    }
    
    
    // د Audit معلومات
    const auditData = {
      
      action: String(action || "").trim(),
      
      details: String(details || "").trim(),
      
      uid: user.uid,
      
      email: user.email || "",
      
      time: serverTimestamp()
      
    };
    
    
    // Firestore ته ثبتول
    const auditRef = await addDoc(
      collection(db, AUDIT_COLLECTION),
      auditData
    );
    
    
    console.info(
      "Audit ثبت شو:",
      auditRef.id
    );
    
    
    return {
      
      success: true,
      
      id: auditRef.id
      
    };
    
    
  } catch (error) {
    
    console.error(
      "Audit Error:",
      error
    );
    
    
    return {
      
      success: false,
      
      message: error.message || "Audit ثبت نه شو."
      
    };
    
  }
  
}


// ==========================================
// Common Audit Actions
// ==========================================

export const AUDIT_ACTIONS = {
  
  LOGIN: "LOGIN",
  
  LOGOUT: "LOGOUT",
  
  REGISTER: "REGISTER",
  
  UPDATE: "UPDATE",
  
  DELETE: "DELETE",
  
  SEARCH: "SEARCH",
  
  SETTINGS_UPDATE: "SETTINGS_UPDATE",
  
  ADMIN_UPDATE: "ADMIN_UPDATE",
  
  USER_CREATED: "USER_CREATED",
  
  USER_UPDATED: "USER_UPDATED"
  
};