// ==========================================
// د افغانستان اسلامی امارت دکره کمیسیون دثبت او مدیریت ډیټابیس
// reports.js
// Reports Engine
// ==========================================

import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { listenAuth } from "./auth.js";
import { initializeSettings } from "./settings.js";

const RECORDS_COLLECTION = "records";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeText(value) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function formatDate(value) {
  if (!value) return "—";
  
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return date.toLocaleDateString("ps-AF", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }
  
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  
  return date.toLocaleDateString("ps-AF", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function getPersonName(record) {
  const first = record?.person?.firstName || "";
  const last = record?.person?.lastName || "";
  return `${first} ${last}`.trim() || "—";
}

function normalizeCategory(category) {
  return safeText(category);
}

function normalizeProvince(record) {
  return safeText(record?.originalLocation?.province);
}

function showMessage(el, message, type = "info") {
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type}`;
  el.style.display = "block";
}

function hideMessage(el) {
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

function renderCountRows(map, tbody, emptyText) {
  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);
  
  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-center">${escapeHtml(emptyText)}</td></tr>`;
    return;
  }
  
  tbody.innerHTML = entries.map(([key, count]) => `
        <tr>
            <td>${escapeHtml(key)}</td>
            <td><strong>${count}</strong></td>
        </tr>
    `).join("");
}

function renderRecentRows(records, tbody) {
  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">هیڅ ثبت نه شته.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = records.map(record => {
    const fraudulent = record.fraudulent === true;
    const status = fraudulent ? "جعلي" : safeText(record.status || "active");
    const statusClass = fraudulent ? "badge-danger" : "badge-success";
    
    return `
            <tr>
                <td>${escapeHtml(record.formNumber || "—")}</td>
                <td>${escapeHtml(getPersonName(record))}</td>
                <td>${escapeHtml(normalizeCategory(record.category))}</td>
                <td>${escapeHtml(normalizeProvince(record))}</td>
                <td><span class="badge ${statusClass}">${escapeHtml(status)}</span></td>
                <td>${escapeHtml(formatDate(record.createdAt))}</td>
            </tr>
        `;
  }).join("");
}

async function loadReports() {
  const reportsMessage = document.getElementById("reportsMessage");
  const totalRecordsEl = document.getElementById("totalRecords");
  const todayRecordsEl = document.getElementById("todayRecords");
  const fraudRecordsEl = document.getElementById("fraudRecords");
  const activeRecordsEl = document.getElementById("activeRecords");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const provinceTableBody = document.getElementById("provinceTableBody");
  const recentTableBody = document.getElementById("recentTableBody");
  const categoryBadge = document.getElementById("categoryBadge");
  const provinceBadge = document.getElementById("provinceBadge");
  const recentBadge = document.getElementById("recentBadge");
  
  if (!reportsMessage || !totalRecordsEl || !todayRecordsEl || !fraudRecordsEl || !activeRecordsEl) {
    return;
  }
  
  try {
    hideMessage(reportsMessage);
    if (categoryBadge) categoryBadge.textContent = "لوډېږي...";
    if (provinceBadge) provinceBadge.textContent = "لوډېږي...";
    if (recentBadge) recentBadge.textContent = "لوډېږي...";
    
    const snapshot = await getDocs(collection(db, RECORDS_COLLECTION));
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const totalRecords = records.length;
    let todayRecords = 0;
    let fraudRecords = 0;
    let activeRecords = 0;
    
    const categories = {
      "مجاهد": 0,
      "همکار": 0,
      "د شهید د کورنۍ غړی": 0,
      "بعدالفتح": 0
    };
    
    const provinces = {};
    
    const todayKey = new Date().toLocaleDateString("en-CA");
    
    const sortedRecords = records.slice().sort((a, b) => {
      const at = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bt = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    });
    
    sortedRecords.forEach(record => {
      if (record.fraudulent === true) fraudRecords += 1;
      if (String(record.status || "").toLowerCase() === "active") activeRecords += 1;
      
      const category = safeText(record.category);
      if (category) {
        categories[category] = (categories[category] || 0) + 1;
      }
      
      const province = safeText(record?.originalLocation?.province);
      if (province && province !== "—") {
        provinces[province] = (provinces[province] || 0) + 1;
      }
      
      if (record.createdAt && typeof record.createdAt.toDate === "function") {
        const recordKey = record.createdAt.toDate().toLocaleDateString("en-CA");
        if (recordKey === todayKey) todayRecords += 1;
      }
    });
    
    totalRecordsEl.textContent = String(totalRecords);
    todayRecordsEl.textContent = String(todayRecords);
    fraudRecordsEl.textContent = String(fraudRecords);
    activeRecordsEl.textContent = String(activeRecords);
    
    renderCountRows(categories, categoryTableBody, "د فورم ډولونو راپور نشته.");
    renderCountRows(provinces, provinceTableBody, "د ولایتونو راپور نشته.");
    renderRecentRows(sortedRecords.slice(0, 10), recentTableBody);
    
    if (categoryBadge) categoryBadge.textContent = `${Object.values(categories).reduce((a, b) => a + b, 0)} راپور`;
    if (provinceBadge) provinceBadge.textContent = `${Object.values(provinces).reduce((a, b) => a + b, 0)} راپور`;
    if (recentBadge) recentBadge.textContent = `${Math.min(sortedRecords.length, 10)} وروستي`;
  } catch (error) {
    console.error("Reports Load Error:", error);
    
    totalRecordsEl.textContent = "0";
    todayRecordsEl.textContent = "0";
    fraudRecordsEl.textContent = "0";
    activeRecordsEl.textContent = "0";
    
    if (categoryTableBody) categoryTableBody.innerHTML = `<tr><td colspan="2" class="text-center">راپورونه ترلاسه نه شول.</td></tr>`;
    if (provinceTableBody) provinceTableBody.innerHTML = `<tr><td colspan="2" class="text-center">راپورونه ترلاسه نه شول.</td></tr>`;
    if (recentTableBody) recentTableBody.innerHTML = `<tr><td colspan="6" class="text-center">راپورونه ترلاسه نه شول.</td></tr>`;
    
    if (categoryBadge) categoryBadge.textContent = "تېروتنه";
    if (provinceBadge) provinceBadge.textContent = "تېروتنه";
    if (recentBadge) recentBadge.textContent = "تېروتنه";
    
    showMessage(reportsMessage, "د راپورونو د لوډ کېدو پر مهال ستونزه رامنځته شوه.", "danger");
  }
}

async function bootstrapReports() {
  await initializeSettings();
  
  listenAuth(async (session) => {
    if (!session) {
      window.location.replace("./login.html");
      return;
    }
    
    await loadReports();
  });
  
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => window.location.reload());
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try {
        const { logoutUser } = await import("./auth.js");
        const result = await logoutUser();
        if (result.success) {
          window.location.replace("./login.html");
          return;
        }
        const reportsMessage = document.getElementById("reportsMessage");
        showMessage(reportsMessage, result.message || "له سیستم څخه وتل ناکام شول.", "danger");
      } finally {
        logoutBtn.disabled = false;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", bootstrapReports);