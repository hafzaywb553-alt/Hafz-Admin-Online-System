// ==========================================
// Hafz Admin Online System
// app.js
// Shared Application Bootstrap
// ==========================================

import { auth } from "./firebase.js";
import { listenAuth, logoutUser } from "./auth.js";
import { initializeSettings, getSettings, applySettings } from "./settings.js";
import { setUserOnline, setUserOffline, startPresenceHeartbeat, stopPresenceHeartbeat } from "./presence.js";

let bootstrapStarted = false;

function safeRedirect(url) {
  if (typeof window !== "undefined" && window.location) {
    window.location.href = url;
  }
}

function wireCommonNavigation() {
  const map = [
    ["dashboardBtn", "./dashboard.html"],
    ["dashboardMenuBtn", "./dashboard.html"],
    ["registerMenuBtn", "./register.html"],
    ["searchMenuBtn", "./search.html"],
    ["reportsMenuBtn", "./reports.html"],
    ["adminMenuBtn", "./admin.html"],
    ["settingsMenuBtn", "./settings.html"]
  ];
  
  map.forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => safeRedirect(url));
  });
  
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => safeRedirect("./dashboard.html"));
  }
  
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => window.history.back());
  }
  
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => window.location.reload());
  }
  
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try {
        const result = await logoutUser();
        if (result.success) {
          stopPresenceHeartbeat();
          await setUserOffline(auth.currentUser).catch(() => {});
          safeRedirect("./login.html");
          return;
        }
        alert(result.message || "له سیستم څخه وتل ناکام شول.");
      } finally {
        logoutBtn.disabled = false;
      }
    });
  }
}

function applySystemShell(settings) {
  if (!settings) return;
  applySettings(settings);
  
  const titleNodes = document.querySelectorAll("[data-system-name]");
  titleNodes.forEach((el) => {
    el.textContent = settings.systemName || "Hafz Admin Online System";
  });
  
  document.title = settings.systemName || "Hafz Admin Online System";
}

function handleAuthSession(session) {
  const isLoginPage = window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("index.html");
  
  if (!session) {
    if (!isLoginPage) {
      safeRedirect("./login.html");
    }
    return;
  }
  
  if (isLoginPage) {
    safeRedirect("./dashboard.html");
    return;
  }
  
  setUserOnline(session.user).catch(() => {});
  startPresenceHeartbeat();
}

async function bootstrap() {
  if (bootstrapStarted) return;
  bootstrapStarted = true;
  
  try {
    const settings = await initializeSettings();
    applySystemShell(settings);
  } catch (error) {
    console.error("App bootstrap settings error:", error);
  }
  
  wireCommonNavigation();
  
  listenAuth((session) => {
    handleAuthSession(session);
  });
}

document.addEventListener("DOMContentLoaded", bootstrap);

window.addEventListener("beforeunload", () => {
  stopPresenceHeartbeat();
  if (auth.currentUser) {
    setUserOffline(auth.currentUser).catch(() => {});
  }
});