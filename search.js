// ==========================================
// Hafz Admin Online System
// search.js
// Search Engine
// ==========================================

import { db, auth } from "./firebase.js";

import {
    collection,
    query,
    where,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    writeAudit,
    AUDIT_ACTIONS
} from "./audit.js";

import {
    validateSearchFormNumber,
    validateTazkira
} from "./validation.js";

import {
    listenAuth,
    logoutUser
} from "./auth.js";

import {
    initializeSettings
} from "./settings.js";


// ==========================================
// Firestore Collection
// ==========================================

const RECORDS_COLLECTION = "records";


// ==========================================
// Tazkira Constants
// ==========================================

const TAZKIRA_TYPES = {
    ELECTRONIC: "electronic",
    PAPER: "paper"
};


// ==========================================
// Elements
// ==========================================

const searchForm = document.getElementById("searchForm");
const formNumberInput = document.getElementById("formNumber");
const tazkiraInput = document.getElementById("tazkira");
const paperSearchVolumeInput = document.getElementById("paperSearchVolume");
const paperSearchPageInput = document.getElementById("paperSearchPage");
const paperSearchNumberInput = document.getElementById("paperSearchNumber");

const searchElectronicGroup = document.getElementById("searchElectronicGroup");
const searchPaperVolumeGroup = document.getElementById("searchPaperVolumeGroup");
const searchPaperPageGroup = document.getElementById("searchPaperPageGroup");
const searchPaperNumberGroup = document.getElementById("searchPaperNumberGroup");

const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const backBtn = document.getElementById("backBtn");
const searchMessage = document.getElementById("searchMessage");
const searchResult = document.getElementById("searchResult");
const resultBadge = document.getElementById("resultBadge");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");
const searchTazkiraTypeElectronic = document.getElementById("searchTazkiraTypeElectronic");
const searchTazkiraTypePaper = document.getElementById("searchTazkiraTypePaper");


// ==========================================
// Helpers
// ==========================================

function cleanText(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showMessage(message, type = "success") {
    searchMessage.textContent = message;
    searchMessage.className = "alert alert-" + type;
    searchMessage.style.display = "block";
}

function hideMessage() {
    searchMessage.textContent = "";
    searchMessage.style.display = "none";
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    clearBtn.disabled = isLoading;
    searchBtn.textContent = isLoading ? "⏳ لټون کېږي..." : "🔍 لټون";
}

function renderEmpty(message = "هیڅ پایله ونه موندل شوه.") {
    searchResult.innerHTML = `
        <div class="search-empty">
            ${escapeHtml(message)}
        </div>
    `;
    resultBadge.className = "badge badge-warning";
    resultBadge.textContent = "پایله نشته";
}

function formatText(value) {
    const text = String(value ?? "").trim();
    return text ? escapeHtml(text) : "—";
}

function normalizeDigits(value) {
    return cleanText(value).replace(/[^0-9]/g, "");
}

function formatElectronicTazkira(value) {
    let digits = normalizeDigits(value);

    if (digits.length > 13) {
        digits = digits.slice(0, 13);
    }

    if (digits.length > 8) {
        return digits.slice(0, 4) + "-" + digits.slice(4, 8) + "-" + digits.slice(8);
    }

    if (digits.length > 4) {
        return digits.slice(0, 4) + "-" + digits.slice(4);
    }

    return digits;
}

function buildPaperSearchKey(volume, page, number) {
    const v = normalizeDigits(volume);
    const p = normalizeDigits(page);
    const n = normalizeDigits(number);

    if (!v || !p || !n) {
        return "";
    }

    return `${v}-${p}-${n}`;
}

function getSelectedSearchTazkiraType() {
    return searchTazkiraTypePaper.checked
        ? TAZKIRA_TYPES.PAPER
        : TAZKIRA_TYPES.ELECTRONIC;
}

function setSearchMode(mode) {
    const isPaper = mode === TAZKIRA_TYPES.PAPER;
    const isElectronic = !isPaper;

    searchTazkiraTypeElectronic.checked = isElectronic;
    searchTazkiraTypePaper.checked = isPaper;

    searchElectronicGroup.style.display = isElectronic ? "block" : "none";
    searchPaperVolumeGroup.style.display = isPaper ? "block" : "none";
    searchPaperPageGroup.style.display = isPaper ? "block" : "none";
    searchPaperNumberGroup.style.display = isPaper ? "block" : "none";

    if (isElectronic) {
        paperSearchVolumeInput.value = "";
        paperSearchPageInput.value = "";
        paperSearchNumberInput.value = "";
    } else {
        tazkiraInput.value = "";
    }
}

function clearAllErrors() {
    document.querySelectorAll(".form-error").forEach(el => {
        el.textContent = "";
    });

    document.querySelectorAll(".form-control").forEach(el => {
        el.classList.remove("error");
    });
}

function setFieldError(fieldId, message) {
    const errorBox = document.getElementById(`${fieldId}Error`);
    const field = document.getElementById(fieldId);

    if (errorBox) {
        errorBox.textContent = message || "";
    }

    if (field && message) {
        field.classList.add("error");
    }
}

function getPersonInfo(record) {
    if (!record) {
        return null;
    }

    return {
        firstName: record.person?.firstName || "",
        lastName: record.person?.lastName || "",
        fatherName: record.person?.fatherName || "",
        grandfatherName: record.person?.grandfatherName || "",
        birthDate: record.person?.birthDate || "",
        age: record.person?.age ?? "",
        tazkira: record.person?.tazkira || "",
        tazkiraType: record.person?.tazkiraType || record.tazkiraType || "",
        phone: record.person?.phone || ""
    };
}

function getLocationInfo(record) {
    if (!record) {
        return null;
    }

    return {
        original: record.originalLocation || {
            province: "",
            district: "",
            village: ""
        },
        current: record.currentLocation || {
            province: "",
            district: "",
            village: ""
        }
    };
}

function getTazkiraInfo(record) {
    if (!record) {
        return null;
    }

    return {
        type: record.tazkiraType || record.person?.tazkiraType || record.tazkiraDetails?.type || "",
        searchKey: record.tazkiraSearchKey || "",
        display: record.tazkiraDisplay || record.person?.tazkira || "",
        electronicNumber: record.tazkiraDetails?.electronicNumber || "",
        paper: {
            volume: record.tazkiraDetails?.paper?.volume || "",
            page: record.tazkiraDetails?.paper?.page || "",
            number: record.tazkiraDetails?.paper?.number || ""
        }
    };
}


// ==========================================
// Firestore Search Helpers
// ==========================================

async function searchByField(fieldPath, value) {
    const clean = cleanText(value);

    if (!clean) {
        return null;
    }

    const recordsRef = collection(db, RECORDS_COLLECTION);
    const q = query(
        recordsRef,
        where(fieldPath, "==", clean),
        limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const document = snapshot.docs[0];
    return {
        id: document.id,
        ...document.data()
    };
}

async function searchByFormNumber(formNumber) {
    return searchByField("formNumber", formNumber);
}

async function searchByTazkiraValue(value) {
    const clean = cleanText(value);

    if (!clean) {
        return null;
    }

    const possibleFields = [
        "tazkiraSearchKey",
        "person.tazkira",
        "tazkiraDisplay",
        "tazkiraDetails.electronicNumber"
    ];

    for (const fieldPath of possibleFields) {
        const record = await searchByField(fieldPath, clean);
        if (record) {
            return record;
        }
    }

    return null;
}


// ==========================================
// Search Registration
// ==========================================

export async function searchRegistration({
    formNumber = "",
    tazkiraType = TAZKIRA_TYPES.ELECTRONIC,
    tazkira = "",
    paperTazkiraVolume = "",
    paperTazkiraPage = "",
    paperTazkiraNumber = ""
} = {}) {
    try {
        if (!auth.currentUser) {
            return {
                success: false,
                message: "د لټون لپاره لومړی Login وکړئ."
            };
        }

        const cleanFormNumber = cleanText(formNumber);
        const cleanTazkiraType = cleanText(tazkiraType) || TAZKIRA_TYPES.ELECTRONIC;
        const cleanTazkira = cleanText(tazkira);
        const paperKey = buildPaperSearchKey(
            paperTazkiraVolume,
            paperTazkiraPage,
            paperTazkiraNumber
        );

        if (!cleanFormNumber && !cleanTazkira && !paperKey) {
            return {
                success: false,
                message: "د فورمي نمبر یا د تذکرې معلومات ولیکئ."
            };
        }

        if (cleanFormNumber) {
            const validation = validateSearchFormNumber(cleanFormNumber);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }
        }

        let record = null;

        if (cleanFormNumber) {
            record = await searchByFormNumber(cleanFormNumber);
        }

        if (!record) {
            if (cleanTazkiraType === TAZKIRA_TYPES.PAPER) {
                if (!paperKey) {
                    return {
                        success: false,
                        message: "د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ټول ولیکئ."
                    };
                }

                const allDigits = [
                    paperTazkiraVolume,
                    paperTazkiraPage,
                    paperTazkiraNumber
                ].map(normalizeDigits);

                if (allDigits.some(v => !v)) {
                    return {
                        success: false,
                        message: "د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ټول اجباري دي."
                    };
                }

                record = await searchByTazkiraValue(paperKey);
            } else {
                const electronicValue = formatElectronicTazkira(cleanTazkira);

                if (electronicValue) {
                    const validation = validateTazkira(electronicValue);
                    if (validation && validation.valid === false) {
                        return {
                            success: false,
                            message: validation.message || "د تذکرې نمبر ناسم دی."
                        };
                    }
                }

                record = await searchByTazkiraValue(
                    cleanTazkira || electronicValue
                );
            }
        }

        if (!record) {
            await writeAudit(
                AUDIT_ACTIONS.SEARCH,
                `لټون: ${cleanFormNumber || cleanTazkira || paperKey}`
            );

            return {
                success: false,
                found: false,
                message: "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."
            };
        }

        await writeAudit(
            AUDIT_ACTIONS.SEARCH,
            `فورمه پیدا شوه: ${record.formNumber || ""}`
        );

        return {
            success: true,
            found: true,
            message: "فورمه پیدا شوه.",
            record
        };
    } catch (error) {
        console.error("Search Error:", error);

        return {
            success: false,
            found: false,
            message: error.message || "د لټون پر مهال ستونزه رامنځته شوه."
        };
    }
}


// ==========================================
// Search by Form Number Only
// ==========================================

export async function searchByForm(formNumber) {
    return searchRegistration({
        formNumber
    });
}


// ==========================================
// Search by Tazkira Only
// ==========================================

export async function searchByTazkiraNumber(tazkira) {
    return searchRegistration({
        tazkira
    });
}


// ==========================================
// Render Helpers
// ==========================================

function renderTazkiraSection(record) {
    const info = getTazkiraInfo(record);
    if (!info) {
        return `
            <tr><th>د تذکرې ډول</th><td>—</td></tr>
        `;
    }

    if (info.type === TAZKIRA_TYPES.PAPER) {
        return `
            <tr><th>د تذکرې ډول</th><td>کاغذي تذکره</td></tr>
            <tr><th>جلد</th><td>${formatText(info.paper.volume)}</td></tr>
            <tr><th>صفحه</th><td>${formatText(info.paper.page)}</td></tr>
            <tr><th>ګڼه</th><td>${formatText(info.paper.number)}</td></tr>
        `;
    }

    return `
        <tr><th>د تذکرې ډول</th><td>برقي تذکره</td></tr>
        <tr><th>د تذکرې نمبر</th><td>${formatText(info.display)}</td></tr>
    `;
}

function renderRecord(result) {
    const record = result?.record;

    if (!record) {
        renderEmpty("هیڅ ثبت شوی معلومات ونه موندل شو.");
        return;
    }

    const person = getPersonInfo(record) || {};
    const location = getLocationInfo(record) || {};
    const tazkira = getTazkiraInfo(record) || {};
    const fraudulent = record.fraudulent === true;
    const canEdit = record.editable !== false;

    resultBadge.className = fraudulent ? "badge badge-danger" : "badge badge-success";
    resultBadge.textContent = fraudulent ? "جعلي" : "اصلي";

    searchResult.innerHTML = `
        <div style="display:grid;gap:14px;">

            <div class="card" style="padding:16px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <div>
                        <div class="badge ${fraudulent ? "badge-danger" : "badge-success"}" style="margin-bottom:10px;">
                            ${fraudulent ? "دا فورمه جعلي ده" : "اصلي فورمه"}
                        </div>

                        <h3 style="font-size:22px;font-weight:800;margin-bottom:6px;">
                            ${formatText(record.formNumber)}
                        </h3>

                        <p style="color:var(--muted-color);font-size:13px;">
                            د فورم ډول: ${formatText(record.category)}
                        </p>
                    </div>

                    <div style="text-align:left;">
                        <div style="color:var(--muted-color);font-size:12px;">داخلي نمبر</div>
                        <strong>${formatText(record.internalId)}</strong>
                    </div>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
                    <a class="btn btn-primary" href="./register.html?recordId=${encodeURIComponent(record.id)}">
                        ✏️ Edit
                    </a>
                    <button type="button" class="btn btn-secondary" id="copyRecordIdBtn">
                        📋 د ثبت ID کاپي
                    </button>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">🪪 د تذکرې معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            ${renderTazkiraSection(record)}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">👤 د شخص معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            <tr><th>نوم</th><td>${formatText(person.firstName)}</td></tr>
                            <tr><th>تخلص</th><td>${formatText(person.lastName)}</td></tr>
                            <tr><th>د پلار نوم</th><td>${formatText(person.fatherName)}</td></tr>
                            <tr><th>د نیکه نوم</th><td>${formatText(person.grandfatherName)}</td></tr>
                            <tr><th>د زېږون نېټه</th><td>${formatText(person.birthDate)}</td></tr>
                            <tr><th>عمر</th><td>${formatText(person.age)}</td></tr>
                            <tr><th>د اړیکې شمېره</th><td>${formatText(person.phone)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">📍 د اصلي ځای معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            <tr><th>ولایت</th><td>${formatText(location.original?.province)}</td></tr>
                            <tr><th>ولسوالي</th><td>${formatText(location.original?.district)}</td></tr>
                            <tr><th>کلی</th><td>${formatText(location.original?.village)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">📍 د فعلي ځای معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            <tr><th>ولایت</th><td>${formatText(location.current?.province)}</td></tr>
                            <tr><th>ولسوالي</th><td>${formatText(location.current?.district)}</td></tr>
                            <tr><th>کلی</th><td>${formatText(location.current?.village)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">💼 نور معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            <tr><th>اوسنی دنده</th><td>${formatText(record.currentJob)}</td></tr>
                            <tr><th>د ګروپ مشر</th><td>${formatText(record.groupLeader)}</td></tr>
                            <tr><th>جهادي سابقه</th><td>${formatText(record.jihadiHistory)}</td></tr>
                            <tr><th>د PDF نېټه</th><td>${formatText(record.pdfCreationDate)}</td></tr>
                            <tr><th>حالت</th><td>${formatText(record.status)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card">
                <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">🕒 د جوړېدو معلومات</h3>
                <div class="table-container">
                    <table>
                        <tbody>
                            <tr><th>جوړونکی</th><td>${formatText(record.createdBy?.email)}</td></tr>
                            <tr><th>Record ID</th><td>${formatText(record.id)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    `;

    const copyBtn = document.getElementById("copyRecordIdBtn");
    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(String(record.id || ""));
                showMessage("د ثبت ID کاپي شو.", "success");
            } catch {
                showMessage("د ID کاپي کول ممکن نه شول.", "warning");
            }
        });
    }

    if (fraudulent) {
        showMessage("دا فورمه جعلي ده.", "danger");
    } else {
        showMessage("فورمه پیدا شوه.", "success");
    }

    if (!canEdit) {
        showMessage("دا ثبت د edit لپاره بند شوی دی.", "warning");
    }
}


// ==========================================
// Tazkira Input Controls
// ==========================================

tazkiraInput.addEventListener("input", () => {
    tazkiraInput.value = formatElectronicTazkira(tazkiraInput.value);
});

paperSearchVolumeInput.addEventListener("input", () => {
    paperSearchVolumeInput.value = normalizeDigits(paperSearchVolumeInput.value);
});

paperSearchPageInput.addEventListener("input", () => {
    paperSearchPageInput.value = normalizeDigits(paperSearchPageInput.value);
});

paperSearchNumberInput.addEventListener("input", () => {
    paperSearchNumberInput.value = normalizeDigits(paperSearchNumberInput.value);
});

searchTazkiraTypeElectronic.addEventListener("change", () => {
    if (searchTazkiraTypeElectronic.checked) {
        setSearchMode(TAZKIRA_TYPES.ELECTRONIC);
    }
});

searchTazkiraTypePaper.addEventListener("change", () => {
    if (searchTazkiraTypePaper.checked) {
        setSearchMode(TAZKIRA_TYPES.PAPER);
    }
});


// ==========================================
// Search Submit
// ==========================================

searchForm.addEventListener("submit", async event => {
    event.preventDefault();
    hideMessage();
    clearAllErrors();

    const formNumber = cleanText(formNumberInput.value);
    const searchMode = getSelectedSearchTazkiraType();

    const electronicTazkira = cleanText(tazkiraInput.value);
    const paperVolume = cleanText(paperSearchVolumeInput.value);
    const paperPage = cleanText(paperSearchPageInput.value);
    const paperNumber = cleanText(paperSearchNumberInput.value);

    if (!formNumber && searchMode === TAZKIRA_TYPES.ELECTRONIC && !electronicTazkira) {
        renderEmpty("لطفاً د فورمي نمبر یا د تذکرې نمبر ولیکئ.");
        showMessage("لطفاً د فورمي نمبر یا د تذکرې نمبر ولیکئ.", "danger");
        return;
    }

    if (!formNumber && searchMode === TAZKIRA_TYPES.PAPER && (!paperVolume || !paperPage || !paperNumber)) {
        renderEmpty("لطفاً د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ولیکئ.");
        showMessage("لطفاً د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ولیکئ.", "danger");
        return;
    }

    try {
        setLoading(true);
        searchResult.innerHTML = `
            <div class="loading" style="display:flex;align-items:center;gap:10px;justify-content:center;padding:18px;">
                <div class="spinner"></div>
                <span>لټون کېږي...</span>
            </div>
        `;

        const result = await searchRegistration({
            formNumber,
            tazkiraType: searchMode,
            tazkira: electronicTazkira,
            paperTazkiraVolume: paperVolume,
            paperTazkiraPage: paperPage,
            paperTazkiraNumber: paperNumber
        });

        if (!result.success || !result.found) {
            renderEmpty(result.message || "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه.");
            showMessage(result.message || "فورمه پیدا نه شوه.", "warning");
            return;
        }

        renderRecord(result);
    } catch (error) {
        console.error("Search Page Error:", error);
        renderEmpty("د لټون پر مهال ستونزه رامنځته شوه.");
        showMessage("د لټون پر مهال ستونزه رامنځته شوه.", "danger");
    } finally {
        setLoading(false);
    }
});


// ==========================================
// Clear
// ==========================================

clearBtn.addEventListener("click", () => {
    searchForm.reset();
    hideMessage();
    clearAllErrors();
    setSearchMode(TAZKIRA_TYPES.ELECTRONIC);

    searchResult.innerHTML = `
        <div class="search-empty">
            د لټون لپاره پورته فورمه وکاروه.
        </div>
    `;

    resultBadge.className = "badge badge-info";
    resultBadge.textContent = "چمتو";
});


// ==========================================
// Navigation
// ==========================================

backBtn.addEventListener("click", () => {
    window.history.back();
});

refreshBtn.addEventListener("click", () => {
    window.location.reload();
});

document.getElementById("dashboardBtn").addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

document.getElementById("dashboardMenuBtn").addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

document.getElementById("registerMenuBtn").addEventListener("click", () => {
    window.location.href = "./register.html";
});

document.getElementById("searchMenuBtn").addEventListener("click", () => {
    window.location.href = "./search.html";
});

document.getElementById("reportsMenuBtn").addEventListener("click", () => {
    window.location.href = "./reports.html";
});

document.getElementById("adminMenuBtn").addEventListener("click", () => {
    window.location.href = "./admin.html";
});

document.getElementById("settingsMenuBtn").addEventListener("click", () => {
    window.location.href = "./settings.html";
});

logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;

    const result = await logoutUser();

    if (result.success) {
        window.location.href = "./index.html";
        return;
    }

    showMessage(result.message || "له سیستم څخه وتل ناکام شول.", "danger");
    logoutBtn.disabled = false;
});


// ==========================================
// Authentication
// ==========================================

listenAuth(async session => {
    if (!session) {
        window.location.href = "./index.html";
        return;
    }

    await initializeSettings();
});


// ==========================================
// Initial Setup
// ==========================================

setSearchMode(TAZKIRA_TYPES.ELECTRONIC);
