// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون د تصفیوي فورمو د ثبت او مدیریت ډیټابیس
// search.js
// Search Engine - MULTI RESULT VERSION
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
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const fatherNameInput = document.getElementById("fatherName");
const grandfatherNameInput = document.getElementById("grandfatherName");

const englishNameInput = document.getElementById("englishName");
const englishLastNameInput = document.getElementById("englishLastName");
const englishFatherNameInput = document.getElementById("englishFatherName");
const englishGrandfatherNameInput = document.getElementById("englishGrandfatherName");

const tazkiraInput = document.getElementById("tazkira");
const tazkiraLabel = document.querySelector('label[for="tazkira"]');
const tazkiraHelp = document.querySelector("#searchElectronicGroup .form-help");

const paperSearchVolumeInput = document.getElementById("paperSearchVolume");
const paperSearchPageInput = document.getElementById("paperSearchPage");
const paperSearchNumberInput = document.getElementById("paperSearchNumber");

const birthDateInput = document.getElementById("birthDate");
const ageInput = document.getElementById("age");
const phoneInput = document.getElementById("phone");

const originalProvinceInput = document.getElementById("originalProvince");
const originalDistrictInput = document.getElementById("originalDistrict");
const originalVillageInput = document.getElementById("originalVillage");

const currentProvinceInput = document.getElementById("currentProvince");
const currentDistrictInput = document.getElementById("currentDistrict");
const currentVillageInput = document.getElementById("currentVillage");

const currentJobInput = document.getElementById("currentJob");
const groupLeaderInput = document.getElementById("groupLeader");
const categoryInput = document.getElementById("category");
const jihadiHistoryInput = document.getElementById("jihadiHistory");
const pdfCreationDateInput = document.getElementById("pdfCreationDate");

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

const searchTazkiraTypeElectronic =
    document.getElementById("searchTazkiraTypeElectronic");

const searchTazkiraTypePaper =
    document.getElementById("searchTazkiraTypePaper");

const dashboardBtn = document.getElementById("dashboardBtn");
const dashboardMenuBtn = document.getElementById("dashboardMenuBtn");
const registerMenuBtn = document.getElementById("registerMenuBtn");
const searchMenuBtn = document.getElementById("searchMenuBtn");
const reportsMenuBtn = document.getElementById("reportsMenuBtn");
const adminMenuBtn = document.getElementById("adminMenuBtn");
const settingsMenuBtn = document.getElementById("settingsMenuBtn");


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
    if (!searchMessage) return;

    searchMessage.textContent = message;
    searchMessage.className = `alert alert-${type}`;
    searchMessage.style.display = "block";
}


function hideMessage() {
    if (!searchMessage) return;

    searchMessage.textContent = "";
    searchMessage.style.display = "none";
}


function setLoading(isLoading) {
    if (searchBtn) {
        searchBtn.disabled = isLoading;
        searchBtn.textContent = isLoading
            ? "⏳ لټون کېږي..."
            : "🔍 لټون";
    }

    if (clearBtn) {
        clearBtn.disabled = isLoading;
    }

    if (backBtn) {
        backBtn.disabled = isLoading;
    }
}


function renderEmpty(message = "هیڅ پایله ونه موندل شوه.") {
    if (!searchResult) return;

    searchResult.innerHTML = `
        <div class="search-empty">
            ${escapeHtml(message)}
        </div>
    `;

    if (resultBadge) {
        resultBadge.className = "badge badge-warning";
        resultBadge.textContent = "پایله نشته";
    }
}


function formatText(value) {
    const text = String(value ?? "").trim();

    return text
        ? escapeHtml(text)
        : "—";
}


function normalizeDigits(value) {
    return cleanText(value).replace(/[^0-9]/g, "");
}


function normalizeTextForMatch(value) {
    return cleanText(value)
        .replace(/\s+/g, " ")
        .toLowerCase();
}


function formatElectronicTazkira(value) {
    let digits = normalizeDigits(value);

    if (digits.length > 13) {
        digits = digits.slice(0, 13);
    }

    if (digits.length > 8) {
        return (
            digits.slice(0, 4) +
            "-" +
            digits.slice(4, 8) +
            "-" +
            digits.slice(8)
        );
    }

    if (digits.length > 4) {
        return (
            digits.slice(0, 4) +
            "-" +
            digits.slice(4)
        );
    }

    return digits;
}


function getSelectedSearchTazkiraType() {
    return searchTazkiraTypePaper &&
        searchTazkiraTypePaper.checked
        ? TAZKIRA_TYPES.PAPER
        : TAZKIRA_TYPES.ELECTRONIC;
}


function setSearchMode(mode) {
    const isPaper = mode === TAZKIRA_TYPES.PAPER;
    const isElectronic = !isPaper;

    if (searchTazkiraTypeElectronic) {
        searchTazkiraTypeElectronic.checked = isElectronic;
    }

    if (searchTazkiraTypePaper) {
        searchTazkiraTypePaper.checked = isPaper;
    }

    // د کاغذي حالت لپاره هم د تذکرې نمبر ښکاره پاتې کېږي
    if (searchElectronicGroup) {
        searchElectronicGroup.style.display = "block";
    }

    if (searchPaperVolumeGroup) {
        searchPaperVolumeGroup.style.display =
            isPaper ? "block" : "none";
    }

    if (searchPaperPageGroup) {
        searchPaperPageGroup.style.display =
            isPaper ? "block" : "none";
    }

    if (searchPaperNumberGroup) {
        searchPaperNumberGroup.style.display =
            isPaper ? "block" : "none";
    }

    if (tazkiraLabel) {
        tazkiraLabel.innerHTML = isPaper
            ? "د کاغذي تذکرې نمبر"
            : "د تذکرې نمبر";
    }

    if (tazkiraHelp) {
        tazkiraHelp.style.display = "none";
    }

    if (tazkiraInput) {
        tazkiraInput.placeholder = isPaper
            ? "د کاغذي تذکرې نمبر ولیکئ"
            : "0000-0000-00000";
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


function valueFromRecord(record, paths) {
    if (!record) return "";

    for (const path of paths) {
        const parts = String(path).split(".");
        let current = record;

        for (const part of parts) {
            if (
                current &&
                Object.prototype.hasOwnProperty.call(current, part)
            ) {
                current = current[part];
            } else {
                current = undefined;
                break;
            }
        }

        if (
            current !== undefined &&
            current !== null &&
            String(current).trim() !== ""
        ) {
            return String(current).trim();
        }
    }

    return "";
}


function getPersonInfo(record) {
    if (!record) return null;

    return {
        firstName: valueFromRecord(record, [
            "firstName",
            "person.firstName"
        ]),

        lastName: valueFromRecord(record, [
            "lastName",
            "person.lastName"
        ]),

        fatherName: valueFromRecord(record, [
            "fatherName",
            "person.fatherName"
        ]),

        grandfatherName: valueFromRecord(record, [
            "grandfatherName",
            "person.grandfatherName"
        ]),

        birthDate: valueFromRecord(record, [
            "birthDate",
            "person.birthDate"
        ]),

        age: valueFromRecord(record, [
            "age",
            "person.age"
        ]),

        tazkira: valueFromRecord(record, [
            "tazkira",
            "person.tazkira",
            "tazkiraDisplay",
            "tazkiraDetails.electronicNumber",
            "paperTazkiraNumber",
            "tazkiraDetails.paper.number"
        ]),

        tazkiraType: valueFromRecord(record, [
            "tazkiraType",
            "person.tazkiraType",
            "tazkiraDetails.type"
        ]),

        phone: valueFromRecord(record, [
            "phone",
            "person.phone"
        ]),

        englishName: valueFromRecord(record, [
            "englishName",
            "person.englishName"
        ]),

        englishLastName: valueFromRecord(record, [
            "englishLastName",
            "person.englishLastName"
        ]),

        englishFatherName: valueFromRecord(record, [
            "englishFatherName",
            "person.englishFatherName"
        ]),

        englishGrandfatherName: valueFromRecord(record, [
            "englishGrandfatherName",
            "person.englishGrandfatherName"
        ])
    };
}


function getLocationInfo(record) {
    if (!record) return null;

    return {
        original: {
            province: valueFromRecord(record, [
                "originalProvince",
                "originalLocation.province"
            ]),

            district: valueFromRecord(record, [
                "originalDistrict",
                "originalLocation.district"
            ]),

            village: valueFromRecord(record, [
                "originalVillage",
                "originalLocation.village"
            ])
        },

        current: {
            province: valueFromRecord(record, [
                "currentProvince",
                "currentLocation.province"
            ]),

            district: valueFromRecord(record, [
                "currentDistrict",
                "currentLocation.district"
            ]),

            village: valueFromRecord(record, [
                "currentVillage",
                "currentLocation.village"
            ])
        }
    };
}


function getTazkiraInfo(record) {
    if (!record) return null;

    return {
        type: valueFromRecord(record, [
            "tazkiraType",
            "person.tazkiraType",
            "tazkiraDetails.type"
        ]),

        searchKey: valueFromRecord(record, [
            "tazkiraSearchKey"
        ]),

        display: valueFromRecord(record, [
            "tazkiraDisplay",
            "tazkira",
            "person.tazkira"
        ]),

        electronicNumber: valueFromRecord(record, [
            "tazkiraDetails.electronicNumber",
            "tazkira"
        ]),

        paper: {
            volume: valueFromRecord(record, [
                "paperTazkiraVolume",
                "tazkiraDetails.paper.volume"
            ]),

            page: valueFromRecord(record, [
                "paperTazkiraPage",
                "tazkiraDetails.paper.page"
            ]),

            number: valueFromRecord(record, [
                "paperTazkiraNumber",
                "tazkiraDetails.paper.number"
            ])
        }
    };
}


function normalizeRecordValue(value) {
    const text = cleanText(value);

    if (!text) {
        return "";
    }

    return normalizeTextForMatch(text);
}


// ==========================================
// Firestore Search Helpers
// ==========================================

async function searchByField(fieldPath, value) {
    const clean = cleanText(value);

    if (!clean) {
        return [];
    }

    const recordsRef = collection(
        db,
        RECORDS_COLLECTION
    );

    const q = query(
        recordsRef,
        where(fieldPath, "==", clean),
        limit(50)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
    }));
}


// ==========================================
// Match Record
// ==========================================

function matchesRecordValue(
    record,
    paths,
    inputValue,
    numeric = false
) {
    const clean = cleanText(inputValue);

    if (!clean) {
        return false;
    }

    const expected = numeric
        ? normalizeDigits(clean)
        : normalizeRecordValue(clean);

    if (!expected) {
        return false;
    }

    for (const path of paths) {
        const actualRaw = valueFromRecord(
            record,
            [path]
        );

        if (!actualRaw) {
            continue;
        }

        const actual = numeric
            ? normalizeDigits(actualRaw)
            : normalizeRecordValue(actualRaw);

        if (actual && actual === expected) {
            return true;
        }
    }

    return false;
}


function filterRecordByClauses(
    record,
    clauses
) {
    for (const clause of clauses) {
        if (!clause.value) {
            continue;
        }

        const ok = matchesRecordValue(
            record,
            clause.paths,
            clause.value,
            clause.numeric
        );

        if (!ok) {
            return false;
        }
    }

    return true;
}


// ==========================================
// Search All Records
// ==========================================
//
// مهم:
// جلد / صفحه / ګڼه دلته هېڅ search effect نه لري.
// یواځې اصلي Search Criteria کارول کېږي.
//
// ==========================================

async function searchRecordByCriteria(criteria) {
    const clauses = criteria.filter(
        item => cleanText(item.value)
    );

    if (clauses.length === 0) {
        return {
            found: false,
            records: [],
            record: null,
            message: "لطفاً د لټون لپاره لږ تر لږه یوه خانه ډکه کړئ."
        };
    }

    let candidates = null;

    for (const clause of clauses) {
        const groupResults = [];

        for (const path of clause.paths) {
            try {
                const resultList = await searchByField(
                    path,
                    clause.numeric
                        ? normalizeDigits(clause.value)
                        : cleanText(clause.value)
                );

                groupResults.push(...resultList);
            } catch (error) {
                console.warn(
                    `Search field failed: ${path}`,
                    error
                );
            }
        }

        const unique = [];
        const seen = new Set();

        for (const item of groupResults) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
            }
        }

        if (candidates === null) {
            candidates = unique;
        } else {
            const currentIds = new Set(
                unique.map(item => item.id)
            );

            candidates = candidates.filter(
                item => currentIds.has(item.id)
            );
        }

        if (!candidates || candidates.length === 0) {
            return {
                found: false,
                records: [],
                record: null,
                message: "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."
            };
        }
    }

    // وروستی دقیق matching
    const matchedRecords = candidates.filter(
        record => filterRecordByClauses(
            record,
            clauses
        )
    );

    return {
        found: matchedRecords.length > 0,
        records: matchedRecords,
        record: matchedRecords[0] || null,
        message: matchedRecords.length > 0
            ? `${matchedRecords.length} پایلې پیدا شوې.`
            : "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."
    };
}


// ==========================================
// Search Registration
// ==========================================

export async function searchRegistration({
    formNumber = "",
    firstName = "",
    lastName = "",
    fatherName = "",
    grandfatherName = "",

    englishName = "",
    englishLastName = "",
    englishFatherName = "",
    englishGrandfatherName = "",

    tazkiraType = TAZKIRA_TYPES.ELECTRONIC,
    tazkira = "",

    paperTazkiraVolume = "",
    paperTazkiraPage = "",
    paperTazkiraNumber = "",

    birthDate = "",
    age = "",
    phone = "",

    originalProvince = "",
    originalDistrict = "",
    originalVillage = "",

    currentProvince = "",
    currentDistrict = "",
    currentVillage = "",

    currentJob = "",
    groupLeader = "",
    category = "",
    jihadiHistory = "",
    pdfCreationDate = ""

} = {}) {

    try {

        if (!auth.currentUser) {
            return {
                success: false,
                found: false,
                records: [],
                message: "د لټون لپاره لومړی Login وکړئ."
            };
        }


        // ======================================
        // Clean Values
        // ======================================

        const cleanFormNumber =
            cleanText(formNumber);

        const cleanFirstName =
            cleanText(firstName);

        const cleanLastName =
            cleanText(lastName);

        const cleanFatherName =
            cleanText(fatherName);

        const cleanGrandfatherName =
            cleanText(grandfatherName);


        const cleanEnglishName =
            cleanText(englishName);

        const cleanEnglishLastName =
            cleanText(englishLastName);

        const cleanEnglishFatherName =
            cleanText(englishFatherName);

        const cleanEnglishGrandfatherName =
            cleanText(englishGrandfatherName);


        const cleanTazkiraType =
            cleanText(tazkiraType) ||
            TAZKIRA_TYPES.ELECTRONIC;

        const cleanTazkira =
            cleanText(tazkira);


        // ======================================
        // Paper Tazkira
        // ======================================
        //
        // IMPORTANT:
        // دا درې واړه نور Search criteria نه دي.
        //
        // ======================================

        const cleanPaperVolume =
            cleanText(paperTazkiraVolume);

        const cleanPaperPage =
            cleanText(paperTazkiraPage);

        const cleanPaperNumber =
            cleanText(paperTazkiraNumber);


        const cleanBirthDate =
            cleanText(birthDate);

        const cleanAge =
            cleanText(age);

        const cleanPhone =
            cleanText(phone);


        const cleanOriginalProvince =
            cleanText(originalProvince);

        const cleanOriginalDistrict =
            cleanText(originalDistrict);

        const cleanOriginalVillage =
            cleanText(originalVillage);


        const cleanCurrentProvince =
            cleanText(currentProvince);

        const cleanCurrentDistrict =
            cleanText(currentDistrict);

        const cleanCurrentVillage =
            cleanText(currentVillage);


        const cleanCurrentJob =
            cleanText(currentJob);

        const cleanGroupLeader =
            cleanText(groupLeader);

        const cleanCategory =
            cleanText(category);

        const cleanJihadiHistory =
            cleanText(jihadiHistory);

        const cleanPdfCreationDate =
            cleanText(pdfCreationDate);


        // ======================================
        // Search Criteria
        // ======================================
        //
        // جلد / صفحه / ګڼه قصداً نه دي شامل.
        //
        // ======================================

        const criteria = [

            {
                value: cleanFormNumber,
                numeric: false,
                paths: ["formNumber"]
            },

            {
                value: cleanFirstName,
                numeric: false,
                paths: [
                    "firstName",
                    "person.firstName"
                ]
            },

            {
                value: cleanLastName,
                numeric: false,
                paths: [
                    "lastName",
                    "person.lastName"
                ]
            },

            {
                value: cleanFatherName,
                numeric: false,
                paths: [
                    "fatherName",
                    "person.fatherName"
                ]
            },

            {
                value: cleanGrandfatherName,
                numeric: false,
                paths: [
                    "grandfatherName",
                    "person.grandfatherName"
                ]
            },


            {
                value: cleanEnglishName,
                numeric: false,
                paths: [
                    "englishName",
                    "person.englishName"
                ]
            },

            {
                value: cleanEnglishLastName,
                numeric: false,
                paths: [
                    "englishLastName",
                    "person.englishLastName"
                ]
            },

            {
                value: cleanEnglishFatherName,
                numeric: false,
                paths: [
                    "englishFatherName",
                    "person.englishFatherName"
                ]
            },

            {
                value: cleanEnglishGrandfatherName,
                numeric: false,
                paths: [
                    "englishGrandfatherName",
                    "person.englishGrandfatherName"
                ]
            },


            // ==================================
            // Tazkira
            // ==================================

            {
                value: cleanTazkira,
                numeric: false,
                paths: [
                    "tazkiraSearchKey",
                    "tazkira",
                    "person.tazkira",
                    "tazkiraDisplay",
                    "tazkiraDetails.electronicNumber",
                    "paperTazkiraNumber",
                    "tazkiraDetails.paper.number"
                ]
            },


            // ==================================
            // NOTE:
            // Paper Volume / Page / Number
            // دلته قصداً Search criteria نه دي.
            // ==================================


            {
                value: cleanBirthDate,
                numeric: false,
                paths: [
                    "birthDate",
                    "person.birthDate"
                ]
            },

            {
                value: cleanAge,
                numeric: true,
                paths: [
                    "age",
                    "person.age"
                ]
            },

            {
                value: cleanPhone,
                numeric: false,
                paths: [
                    "phone",
                    "person.phone"
                ]
            },


            // ==================================
            // Original Location
            // ==================================

            {
                value: cleanOriginalProvince,
                numeric: false,
                paths: [
                    "originalProvince",
                    "originalLocation.province"
                ]
            },

            {
                value: cleanOriginalDistrict,
                numeric: false,
                paths: [
                    "originalDistrict",
                    "originalLocation.district"
                ]
            },

            {
                value: cleanOriginalVillage,
                numeric: false,
                paths: [
                    "originalVillage",
                    "originalLocation.village"
                ]
            },


            // ==================================
            // Current Location
            // ==================================

            {
                value: cleanCurrentProvince,
                numeric: false,
                paths: [
                    "currentProvince",
                    "currentLocation.province"
                ]
            },

            {
                value: cleanCurrentDistrict,
                numeric: false,
                paths: [
                    "currentDistrict",
                    "currentLocation.district"
                ]
            },

            {
                value: cleanCurrentVillage,
                numeric: false,
                paths: [
                    "currentVillage",
                    "currentLocation.village"
                ]
            },


            // ==================================
            // Other Information
            // ==================================

            {
                value: cleanCurrentJob,
                numeric: false,
                paths: [
                    "currentJob"
                ]
            },

            {
                value: cleanGroupLeader,
                numeric: false,
                paths: [
                    "groupLeader"
                ]
            },

            {
                value: cleanCategory,
                numeric: false,
                paths: [
                    "category"
                ]
            },

            {
                value: cleanJihadiHistory,
                numeric: false,
                paths: [
                    "jihadiHistory"
                ]
            },

            {
                value: cleanPdfCreationDate,
                numeric: false,
                paths: [
                    "pdfCreationDate"
                ]
            }

        ].filter(
            item => cleanText(item.value)
        );


        // ======================================
        // No Criteria
        // ======================================

        if (criteria.length === 0) {
            return {
                success: false,
                found: false,
                records: [],
                message: "لطفاً د لټون لپاره لږ تر لږه یوه خانه ډکه کړئ."
            };
        }


        // ======================================
        // Form Number Validation
        // ======================================

        if (cleanFormNumber) {

            const validation =
                validateSearchFormNumber(
                    cleanFormNumber
                );

            if (!validation.valid) {
                return {
                    success: false,
                    found: false,
                    records: [],
                    message: validation.message
                };
            }
        }


        // ======================================
        // Electronic Tazkira Validation
        // ======================================

        if (
            cleanTazkira &&
            cleanTazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
        ) {

            const normalizedElectronic =
                formatElectronicTazkira(
                    cleanTazkira
                );

            const validation =
                validateTazkira(
                    normalizedElectronic
                );

            if (
                validation &&
                validation.valid === false
            ) {

                return {
                    success: false,
                    found: false,
                    records: [],
                    message:
                        validation.message ||
                        "د تذکرې نمبر ناسم دی."
                };
            }
        }


        // ======================================
        // Search
        // ======================================

        const result =
            await searchRecordByCriteria(
                criteria
            );


        // ======================================
        // No Result
        // ======================================

        if (
            !result.found ||
            !result.records ||
            result.records.length === 0
        ) {

            await writeAudit(
                AUDIT_ACTIONS.SEARCH,
                `لټون ناکام: ${
                    criteria
                        .map(c => c.value)
                        .join(" | ")
                }`
            );

            return {
                success: false,
                found: false,
                records: [],
                message:
                    result.message ||
                    "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."
            };
        }


        // ======================================
        // Audit
        // ======================================

        await writeAudit(
            AUDIT_ACTIONS.SEARCH,
            `لټون کې ${
                result.records.length
            } پایلې پیدا شوې`
        );


        // ======================================
        // Return All Results
        // ======================================

        return {
            success: true,
            found: true,
            records: result.records,
            record: result.records[0] || null,
            count: result.records.length,
            message:
                `${result.records.length} پایلې پیدا شوې.`
        };

    } catch (error) {

        console.error(
            "Search Error:",
            error
        );

        return {
            success: false,
            found: false,
            records: [],
            message:
                error.message ||
                "د لټون پر مهال ستونزه رامنځته شوه."
        };
    }
}


// ==========================================
// Search by Form Number Only
// ==========================================

export async function searchByForm(
    formNumber
) {
    return searchRegistration({
        formNumber
    });
}


// ==========================================
// Search by Tazkira Only
// ==========================================

export async function searchByTazkiraNumber(
    tazkira
) {
    return searchRegistration({
        tazkira
    });
}


// ==========================================
// Render Tazkira Section
// ==========================================

function renderTazkiraSection(record) {

    const info =
        getTazkiraInfo(record);

    if (!info) {
        return `
            <tr>
                <th>د تذکرې ډول</th>
                <td>—</td>
            </tr>
        `;
    }


    if (
        info.type ===
        TAZKIRA_TYPES.PAPER
    ) {

        return `
            <tr>
                <th>د تذکرې ډول</th>
                <td>کاغذي تذکره</td>
            </tr>

            <tr>
                <th>د تذکرې نمبر</th>
                <td>
                    ${formatText(
                        info.display ||
                        info.paper.number
                    )}
                </td>
            </tr>

            <tr>
                <th>جلد</th>
                <td>
                    ${formatText(
                        info.paper.volume
                    )}
                </td>
            </tr>

            <tr>
                <th>صفحه</th>
                <td>
                    ${formatText(
                        info.paper.page
                    )}
                </td>
            </tr>

            <tr>
                <th>ګڼه</th>
                <td>
                    ${formatText(
                        info.paper.number
                    )}
                </td>
            </tr>
        `;
    }


    return `
        <tr>
            <th>د تذکرې ډول</th>
            <td>برقي تذکره</td>
        </tr>

        <tr>
            <th>د تذکرې نمبر</th>
            <td>
                ${formatText(
                    info.display ||
                    info.electronicNumber
                )}
            </td>
        </tr>
    `;
}


// ==========================================
// Render One Record
// ==========================================

function renderRecordCard(record) {

    const person =
        getPersonInfo(record) || {};

    const location =
        getLocationInfo(record) || {};

    const fraudulent =
        record.fraudulent === true;

    const canEdit =
        record.editable !== false;


    return `
        <div
            class="card search-result-card"
            style="padding:16px;margin-bottom:14px;"
        >

            <!-- Header -->

            <div
                style="
                    display:flex;
                    align-items:flex-start;
                    justify-content:space-between;
                    gap:12px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <div
                        class="badge ${
                            fraudulent
                                ? "badge-danger"
                                : "badge-success"
                        }"
                        style="margin-bottom:10px;"
                    >
                        ${
                            fraudulent
                                ? "دا فورمه جعلي ده"
                                : "اصلي فورمه"
                        }
                    </div>

                    <h3
                        style="
                            font-size:22px;
                            font-weight:800;
                            margin-bottom:6px;
                        "
                    >
                        ${formatText(
                            record.formNumber
                        )}
                    </h3>

                    <p
                        style="
                            color:var(--muted-color);
                            font-size:13px;
                        "
                    >
                        د فورم ډول:
                        ${formatText(
                            record.category
                        )}
                    </p>

                </div>


                <div style="text-align:left;">

                    <div
                        style="
                            color:var(--muted-color);
                            font-size:12px;
                        "
                    >
                        داخلي نمبر
                    </div>

                    <strong>
                        ${formatText(
                            record.internalId
                        )}
                    </strong>

                </div>

            </div>


            <!-- Buttons -->

            <div
                style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    margin-top:14px;
                "
            >

                ${
                    canEdit
                        ? `
                            <a
                                class="btn btn-primary"
                                href="./register.html?recordId=${encodeURIComponent(
                                    record.id
                                )}"
                            >
                                ✏️ Edit
                            </a>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="btn btn-secondary copy-record-id"
                    data-record-id="${escapeHtml(
                        record.id
                    )}"
                >
                    📋 د ثبت ID کاپي
                </button>

            </div>


            <!-- Tazkira -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    🪪 د تذکرې معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            ${renderTazkiraSection(
                                record
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- Person -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    👤 د شخص معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            <tr>
                                <th>نوم</th>
                                <td>
                                    ${formatText(
                                        person.firstName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>تخلص</th>
                                <td>
                                    ${formatText(
                                        person.lastName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د پلار نوم</th>
                                <td>
                                    ${formatText(
                                        person.fatherName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د نیکه نوم</th>
                                <td>
                                    ${formatText(
                                        person.grandfatherName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>English Name</th>
                                <td>
                                    ${formatText(
                                        person.englishName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>English Last Name</th>
                                <td>
                                    ${formatText(
                                        person.englishLastName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>English Father Name</th>
                                <td>
                                    ${formatText(
                                        person.englishFatherName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>English Grandfather Name</th>
                                <td>
                                    ${formatText(
                                        person.englishGrandfatherName
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د زېږون نېټه</th>
                                <td>
                                    ${formatText(
                                        person.birthDate
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>عمر</th>
                                <td>
                                    ${formatText(
                                        person.age
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د اړیکې شمېره</th>
                                <td>
                                    ${formatText(
                                        person.phone
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- Original Location -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    📍 د اصلي ځای معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            <tr>
                                <th>ولایت</th>
                                <td>
                                    ${formatText(
                                        location.original?.province
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>ولسوالي</th>
                                <td>
                                    ${formatText(
                                        location.original?.district
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>کلی</th>
                                <td>
                                    ${formatText(
                                        location.original?.village
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- Current Location -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    📍 د فعلي ځای معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            <tr>
                                <th>ولایت</th>
                                <td>
                                    ${formatText(
                                        location.current?.province
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>ولسوالي</th>
                                <td>
                                    ${formatText(
                                        location.current?.district
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>کلی</th>
                                <td>
                                    ${formatText(
                                        location.current?.village
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- Other Information -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    💼 نور معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            <tr>
                                <th>اوسنی دنده</th>
                                <td>
                                    ${formatText(
                                        record.currentJob
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د ګروپ مشر</th>
                                <td>
                                    ${formatText(
                                        record.groupLeader
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>کټګوري</th>
                                <td>
                                    ${formatText(
                                        record.category
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>جهادي سابقه</th>
                                <td>
                                    ${formatText(
                                        record.jihadiHistory
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>د PDF نېټه</th>
                                <td>
                                    ${formatText(
                                        record.pdfCreationDate
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>حالت</th>
                                <td>
                                    ${formatText(
                                        record.status
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- Creation Information -->

            <div
                class="card"
                style="margin-top:14px;"
            >

                <h3
                    style="
                        font-size:18px;
                        font-weight:800;
                        margin-bottom:12px;
                    "
                >
                    🕒 د جوړېدو معلومات
                </h3>

                <div class="table-container">

                    <table>

                        <tbody>

                            <tr>
                                <th>جوړونکی</th>
                                <td>
                                    ${formatText(
                                        record.createdBy?.email
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <th>Record ID</th>
                                <td>
                                    ${formatText(
                                        record.id
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    `;
}


// ==========================================
// Render Multiple Records
// ==========================================

function renderRecords(records) {

    if (
        !records ||
        !Array.isArray(records) ||
        records.length === 0
    ) {
        renderEmpty(
            "هیڅ ثبت شوی معلومات ونه موندل شو."
        );

        return;
    }


    if (resultBadge) {

        resultBadge.className =
            "badge badge-success";

        resultBadge.textContent =
            `${records.length} پایلې`;
    }


    searchResult.innerHTML = `

        <div
            class="search-results-header"
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                flex-wrap:wrap;
                gap:10px;
                margin-bottom:14px;
            "
        >

            <div>
                <strong>
                    د لټون پایلې
                </strong>
            </div>

            <div
                class="badge badge-info"
            >
                ټولې پایلې:
                ${records.length}
            </div>

        </div>

        <div class="search-results-list">

            ${records
                .map(record =>
                    renderRecordCard(record)
                )
                .join("")}

        </div>
    `;


    // ======================================
    // Copy Record IDs
    // ======================================

    document
        .querySelectorAll(".copy-record-id")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const recordId =
                        button.dataset.recordId ||
                        "";

                    try {

                        await navigator.clipboard
                            .writeText(recordId);

                        showMessage(
                            "د ثبت ID کاپي شو.",
                            "success"
                        );

                    } catch {

                        showMessage(
                            "د ID کاپي کول ممکن نه شول.",
                            "warning"
                        );
                    }
                }
            );
        });


    showMessage(
        `${records.length} پایلې پیدا شوې.`,
        "success"
    );
}


// ==========================================
// Backward Compatible Render Record
// ==========================================

function renderRecord(result) {

    if (
        result &&
        Array.isArray(result.records)
    ) {
        renderRecords(
            result.records
        );

        return;
    }

    const record =
        result?.record;

    if (!record) {

        renderEmpty(
            "هیڅ ثبت شوی معلومات ونه موندل شو."
        );

        return;
    }

    renderRecords([
        record
    ]);
}


// ==========================================
// Input Controls
// ==========================================

if (tazkiraInput) {

    tazkiraInput.addEventListener(
        "input",
        () => {

            if (
                getSelectedSearchTazkiraType() ===
                TAZKIRA_TYPES.ELECTRONIC
            ) {

                tazkiraInput.value =
                    formatElectronicTazkira(
                        tazkiraInput.value
                    );

            } else {

                tazkiraInput.value =
                    cleanText(
                        tazkiraInput.value
                    );
            }
        }
    );
}


if (paperSearchVolumeInput) {

    paperSearchVolumeInput.addEventListener(
        "input",
        () => {

            paperSearchVolumeInput.value =
                normalizeDigits(
                    paperSearchVolumeInput.value
                );
        }
    );
}


if (paperSearchPageInput) {

    paperSearchPageInput.addEventListener(
        "input",
        () => {

            paperSearchPageInput.value =
                normalizeDigits(
                    paperSearchPageInput.value
                );
        }
    );
}


if (paperSearchNumberInput) {

    paperSearchNumberInput.addEventListener(
        "input",
        () => {

            paperSearchNumberInput.value =
                normalizeDigits(
                    paperSearchNumberInput.value
                );
        }
    );
}


// ==========================================
// Tazkira Type Controls
// ==========================================

if (searchTazkiraTypeElectronic) {

    searchTazkiraTypeElectronic.addEventListener(
        "change",
        () => {

            if (
                searchTazkiraTypeElectronic.checked
            ) {

                setSearchMode(
                    TAZKIRA_TYPES.ELECTRONIC
                );
            }
        }
    );
}


if (searchTazkiraTypePaper) {

    searchTazkiraTypePaper.addEventListener(
        "change",
        () => {

            if (
                searchTazkiraTypePaper.checked
            ) {

                setSearchMode(
                    TAZKIRA_TYPES.PAPER
                );
            }
        }
    );
}


// ==========================================
// Search Submit
// ==========================================

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();
            clearAllErrors();


            // ==================================
            // Criteria
            // ==================================

            const criteria = [

                {
                    value: formNumberInput?.value,
                    numeric: false,
                    paths: ["formNumber"]
                },

                {
                    value: firstNameInput?.value,
                    numeric: false,
                    paths: [
                        "firstName",
                        "person.firstName"
                    ]
                },

                {
                    value: lastNameInput?.value,
                    numeric: false,
                    paths: [
                        "lastName",
                        "person.lastName"
                    ]
                },

                {
                    value: fatherNameInput?.value,
                    numeric: false,
                    paths: [
                        "fatherName",
                        "person.fatherName"
                    ]
                },

                {
                    value: grandfatherNameInput?.value,
                    numeric: false,
                    paths: [
                        "grandfatherName",
                        "person.grandfatherName"
                    ]
                },


                {
                    value: englishNameInput?.value,
                    numeric: false,
                    paths: [
                        "englishName",
                        "person.englishName"
                    ]
                },

                {
                    value: englishLastNameInput?.value,
                    numeric: false,
                    paths: [
                        "englishLastName",
                        "person.englishLastName"
                    ]
                },

                {
                    value: englishFatherNameInput?.value,
                    numeric: false,
                    paths: [
                        "englishFatherName",
                        "person.englishFatherName"
                    ]
                },

                {
                    value:
                        englishGrandfatherNameInput?.value,
                    numeric: false,
                    paths: [
                        "englishGrandfatherName",
                        "person.englishGrandfatherName"
                    ]
                },


                // ==============================
                // Tazkira
                // ==============================

                {
                    value: tazkiraInput?.value,
                    numeric: false,
                    paths: [
                        "tazkiraSearchKey",
                        "tazkira",
                        "person.tazkira",
                        "tazkiraDisplay",
                        "tazkiraDetails.electronicNumber",
                        "paperTazkiraNumber",
                        "tazkiraDetails.paper.number"
                    ]
                },


                // ==============================
                // IMPORTANT:
                // Paper Volume/Page/Number
                // دلته نشته
                // ==============================


                {
                    value: birthDateInput?.value,
                    numeric: false,
                    paths: [
                        "birthDate",
                        "person.birthDate"
                    ]
                },

                {
                    value: ageInput?.value,
                    numeric: true,
                    paths: [
                        "age",
                        "person.age"
                    ]
                },

                {
                    value: phoneInput?.value,
                    numeric: false,
                    paths: [
                        "phone",
                        "person.phone"
                    ]
                },


                // ==============================
                // Original Location
                // ==============================

                {
                    value:
                        originalProvinceInput?.value,
                    numeric: false,
                    paths: [
                        "originalProvince",
                        "originalLocation.province"
                    ]
                },

                {
                    value:
                        originalDistrictInput?.value,
                    numeric: false,
                    paths: [
                        "originalDistrict",
                        "originalLocation.district"
                    ]
                },

                {
                    value:
                        originalVillageInput?.value,
                    numeric: false,
                    paths: [
                        "originalVillage",
                        "originalLocation.village"
                    ]
                },


                // ==============================
                // Current Location
                // ==============================

                {
                    value:
                        currentProvinceInput?.value,
                    numeric: false,
                    paths: [
                        "currentProvince",
                        "currentLocation.province"
                    ]
                },

                {
                    value:
                        currentDistrictInput?.value,
                    numeric: false,
                    paths: [
                        "currentDistrict",
                        "currentLocation.district"
                    ]
                },

                {
                    value:
                        currentVillageInput?.value,
                    numeric: false,
                    paths: [
                        "currentVillage",
                        "currentLocation.village"
                    ]
                },


                // ==============================
                // Other
                // ==============================

                {
                    value:
                        currentJobInput?.value,
                    numeric: false,
                    paths: [
                        "currentJob"
                    ]
                },

                {
                    value:
                        groupLeaderInput?.value,
                    numeric: false,
                    paths: [
                        "groupLeader"
                    ]
                },

                {
                    value:
                        categoryInput?.value,
                    numeric: false,
                    paths: [
                        "category"
                    ]
                },

                {
                    value:
                        jihadiHistoryInput?.value,
                    numeric: false,
                    paths: [
                        "jihadiHistory"
                    ]
                },

                {
                    value:
                        pdfCreationDateInput?.value,
                    numeric: false,
                    paths: [
                        "pdfCreationDate"
                    ]
                }

            ].filter(
                item => cleanText(item.value)
            );


            // ==================================
            // Empty Search
            // ==================================

            if (criteria.length === 0) {

                renderEmpty(
                    "لطفاً لږ تر لږه یوه خانه ډکه کړئ."
                );

                showMessage(
                    "لطفاً د لټون لپاره لږ تر لږه یوه خانه ډکه کړئ.",
                    "warning"
                );

                return;
            }


            try {

                setLoading(true);


                if (searchResult) {

                    searchResult.innerHTML = `
                        <div
                            class="loading"
                            style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                justify-content:center;
                                padding:18px;
                            "
                        >

                            <div class="spinner"></div>

                            <span>
                                لټون کېږي...
                            </span>

                        </div>
                    `;
                }


                // ==================================
                // Search
                // ==================================

                const result =
                    await searchRecordByCriteria(
                        criteria
                    );


                // ==================================
                // No Result
                // ==================================

                if (
                    !result.found ||
                    !result.records ||
                    result.records.length === 0
                ) {

                    renderEmpty(
                        result.message ||
                        "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."
                    );

                    showMessage(
                        result.message ||
                        "فورمه پیدا نه شوه.",
                        "warning"
                    );

                    return;
                }


                // ==================================
                // Audit
                // ==================================

                await writeAudit(
                    AUDIT_ACTIONS.SEARCH,
                    `لټون کې ${
                        result.records.length
                    } پایلې پیدا شوې`
                );


                // ==================================
                // Render ALL Results
                // ==================================

                renderRecords(
                    result.records
                );


            } catch (error) {

                console.error(
                    "Search Page Error:",
                    error
                );

                renderEmpty(
                    "د لټون پر مهال ستونزه رامنځته شوه."
                );

                showMessage(
                    "د لټون پر مهال ستونزه رامنځته شوه.",
                    "danger"
                );

            } finally {

                setLoading(false);
            }
        }
    );
}


// ==========================================
// Clear
// ==========================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            if (searchForm) {
                searchForm.reset();
            }

            hideMessage();
            clearAllErrors();

            setSearchMode(
                TAZKIRA_TYPES.ELECTRONIC
            );


            if (searchResult) {

                searchResult.innerHTML = `
                    <div class="search-empty">
                        د لټون لپاره پورته فورمه وکاروه.
                    </div>
                `;
            }


            if (resultBadge) {

                resultBadge.className =
                    "badge badge-info";

                resultBadge.textContent =
                    "چمتو";
            }
        }
    );
}


// ==========================================
// Navigation
// ==========================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {
            window.history.back();
        }
    );
}


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        () => {
            window.location.reload();
        }
    );
}


if (dashboardBtn) {

    dashboardBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./dashboard.html";
        }
    );
}


if (dashboardMenuBtn) {

    dashboardMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./dashboard.html";
        }
    );
}


if (registerMenuBtn) {

    registerMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./register.html";
        }
    );
}


if (searchMenuBtn) {

    searchMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./search.html";
        }
    );
}


if (reportsMenuBtn) {

    reportsMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./reports.html";
        }
    );
}


if (adminMenuBtn) {

    adminMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./admin.html";
        }
    );
}


if (settingsMenuBtn) {

    settingsMenuBtn.addEventListener(
        "click",
        () => {
            window.location.href =
                "./settings.html";
        }
    );
}


// ==========================================
// Logout
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            logoutBtn.disabled = true;

            try {

                const result =
                    await logoutUser();

                if (result.success) {

                    window.location.href =
                        "./index.html";

                    return;
                }

                showMessage(
                    result.message ||
                    "له سیستم څخه وتل ناکام شول.",
                    "danger"
                );

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

                showMessage(
                    "له سیستم څخه وتل ناکام شول.",
                    "danger"
                );

            } finally {

                logoutBtn.disabled = false;
            }
        }
    );
}


// ==========================================
// Authentication
// ==========================================

listenAuth(
    async session => {

        if (!session) {

            window.location.href =
                "./index.html";

            return;
        }

        await initializeSettings();
    }
);


// ==========================================
// Initial Setup
// ==========================================

setSearchMode(
    TAZKIRA_TYPES.ELECTRONIC
);


if (tazkiraHelp) {
    tazkiraHelp.style.display = "none";
}


hideMessage();


renderEmpty(
    "د لټون لپاره پورته فورمه وکاروه."
);
document.getElementById("formicMenuBtn")?.addEventListener("click", () => {
    window.location.href = "./formic.html";
});