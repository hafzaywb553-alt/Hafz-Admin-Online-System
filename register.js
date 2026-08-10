// ==========================================
// دافغانستان اسلامي امارت دکره کمیسیون دفورمو دثبت او مدیریت ډیټابیس
// register.js
// Registration Engine
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    validateRegistration
} from "./validation.js";

import {
    getProvinces
} from "./locations.js";

import {
    listenAuth,
    logoutUser
} from "./auth.js";

import {
    initializeSettings
} from "./settings.js";


// ==========================================
// System Name
// ==========================================

const SYSTEM_NAME =
    "دافغانستان اسلامي امارت دکره کمیسیون دفورمو دثبت او مدیریت ډیټابیس";


// ==========================================
// Firestore Collections
// ==========================================

const RECORDS_COLLECTION = "records";
const UNIQUE_NUMBERS_COLLECTION = "uniqueNumbers";


// ==========================================
// Tazkira Constants
// ==========================================

const TAZKIRA_TYPES = {
    ELECTRONIC: "electronic",
    PAPER: "paper"
};


// یوازې برقي تذکره دقیقاً:
// 0000-0000-00000
const ELECTRONIC_TAZKIRA_PATTERN =
    /^[0-9]{4}-[0-9]{4}-[0-9]{5}$/;


// کاغذي تذکره:
// یوازې عددونه، هېڅ maxlength نشته
const NUMERIC_ONLY_PATTERN =
    /^[0-9]+$/;


// ==========================================
// Elements
// ==========================================

const form =
    document.getElementById("registrationForm");

const formMessage =
    document.getElementById("formMessage");

const saveBtn =
    document.getElementById("saveBtn");

const resetBtn =
    document.getElementById("resetBtn");

const backBtn =
    document.getElementById("backBtn");

const dashboardBtn =
    document.getElementById("dashboardBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// ==========================================
// Original Personal Fields
// ==========================================

const formNumber =
    document.getElementById("formNumber");

const category =
    document.getElementById("category");

const firstName =
    document.getElementById("firstName");

const lastName =
    document.getElementById("lastName");

const fatherName =
    document.getElementById("fatherName");

const grandfatherName =
    document.getElementById("grandfatherName");


// ==========================================
// New English Fields
// ==========================================

const englishName =
    document.getElementById("englishName");

const englishLastName =
    document.getElementById("englishLastName");

const englishFatherName =
    document.getElementById("englishFatherName");

const englishGrandfatherName =
    document.getElementById("englishGrandfatherName");


// ==========================================
// Other Original Fields
// ==========================================

const birthDate =
    document.getElementById("birthDate");

const age =
    document.getElementById("age");

const phone =
    document.getElementById("phone");

const currentJob =
    document.getElementById("currentJob");

const groupLeader =
    document.getElementById("groupLeader");

const jihadiHistory =
    document.getElementById("jihadiHistory");

const jihadiRequired =
    document.getElementById("jihadiRequired");

const pdfCreationDate =
    document.getElementById("pdfCreationDate");


// ==========================================
// Locations
// ==========================================

const originalProvince =
    document.getElementById("originalProvince");

const originalDistrict =
    document.getElementById("originalDistrict");

const originalVillage =
    document.getElementById("originalVillage");

const currentProvince =
    document.getElementById("currentProvince");

const currentDistrict =
    document.getElementById("currentDistrict");

const currentVillage =
    document.getElementById("currentVillage");


// ==========================================
// Tazkira Fields
// ==========================================

const tazkiraTypeElectronic =
    document.getElementById("tazkiraTypeElectronic");

const tazkiraTypePaper =
    document.getElementById("tazkiraTypePaper");

const electronicTazkiraGroup =
    document.getElementById("electronicTazkiraGroup");

const paperNumberGroup =
    document.getElementById("paperTazkiraNumberGroup");

const paperJildGroup =
    document.getElementById("paperJildGroup");

const paperSafhaGroup =
    document.getElementById("paperSafhaGroup");

const paperGanaGroup =
    document.getElementById("paperGanaGroup");

const tazkira =
    document.getElementById("tazkira");

const paperTazkiraVolume =
    document.getElementById("paperTazkiraVolume");

const paperTazkiraPage =
    document.getElementById("paperTazkiraPage");

const paperTazkiraNumber =
    document.getElementById("paperTazkiraNumber");

const electronicTazkiraRequired =
    document.getElementById("electronicTazkiraRequired");

const paperTazkiraNumberRequired =
    document.getElementById("paperTazkiraNumberRequired");

const paperTazkiraVolumeRequired =
    document.getElementById("paperTazkiraVolumeRequired");

const paperTazkiraPageRequired =
    document.getElementById("paperTazkiraPageRequired");

const paperTazkiraGanaRequired =
    document.getElementById("paperTazkiraGanaRequired");


// ==========================================
// Edit State
// ==========================================

const recordIdInput =
    document.getElementById("recordId");

const editModeInput =
    document.getElementById("editMode");


// ==========================================
// State
// ==========================================

let loadingRecord = false;

let activeAdmin = {
    name: "نامعلوم اډمین",
    email: "",
    uid: ""
};


// ==========================================
// System title update
// ==========================================

function applySystemName() {
    document.title = SYSTEM_NAME;

    const titleEl = document.querySelector("[data-system-name]");
    if (titleEl) {
        titleEl.textContent = SYSTEM_NAME;
    }

    const footerEl = document.querySelector(".footer");
    if (footerEl) {
        footerEl.textContent = SYSTEM_NAME;
    }
}


// ==========================================
// Helpers
// ==========================================

function cleanText(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}

function normalizeUniqueNumber(value) {
    return cleanText(value).replace(/[^0-9]/g, "");
}

function uniqueDocId(type, value) {
    return `${type}_${normalizeUniqueNumber(value)}`;
}

function getCurrentAdminName() {
    return cleanText(activeAdmin.name) || "نامعلوم اډمین";
}

function getCurrentAdminEmail() {
    return cleanText(activeAdmin.email);
}

function getUniqueNumberItemsFromData(data) {
    const items = [
        {
            type: "formNumber",
            value: data.formNumber,
            fieldId: "formNumber"
        }
    ];

    if (data.tazkiraType === TAZKIRA_TYPES.ELECTRONIC) {
        items.push({
            type: "electronicTazkiraNumber",
            value: data.electronicTazkiraNumber,
            fieldId: "tazkira"
        });
    }

    if (data.tazkiraType === TAZKIRA_TYPES.PAPER) {
        items.push({
            type: "paperTazkiraNumber",
            value: data.paperTazkiraNumber,
            fieldId: "paperTazkiraNumber"
        });
    }

    return items.filter(item => normalizeUniqueNumber(item.value));
}

function getUniqueNumberItemsFromRecord(record) {
    const source = record || {};
    const person = source.person || {};
    const tType = cleanText(
        source.tazkiraType ||
        person.tazkiraType ||
        source.tazkiraDetails?.type
    );

    const items = [
        {
            type: "formNumber",
            value: source.formNumber,
            fieldId: "formNumber"
        }
    ];

    if (tType === TAZKIRA_TYPES.ELECTRONIC) {
        items.push({
            type: "electronicTazkiraNumber",
            value:
                source.electronicTazkiraNumber ||
                source.tazkira ||
                source.tazkiraDetails?.electronicNumber ||
                person.tazkira,
            fieldId: "tazkira"
        });
    }

    if (tType === TAZKIRA_TYPES.PAPER) {
        items.push({
            type: "paperTazkiraNumber",
            value:
                source.paperTazkiraNumber ||
                source.tazkiraDetails?.paper?.number,
            fieldId: "paperTazkiraNumber"
        });
    }

    return items.filter(item => normalizeUniqueNumber(item.value));
}

function buildDuplicateMessage(type, ownerName) {
    const adminName = cleanText(ownerName) || "نامعلوم اډمین";

    if (type === "formNumber") {
        return `دا فورمی نمبر مخکی ${adminName} ثبت کړی دی.`;
    }

    if (type === "electronicTazkiraNumber") {
        return `دا برقی تذکیری نمبر مخکی ${adminName} ثبت کړی دی.`;
    }

    if (type === "paperTazkiraNumber") {
        return `دا کاغذی تذکیری نمبر مخکی ${adminName} ثبت کړی دی.`;
    }

    return `دا نمبر مخکی ${adminName} ثبت کړی دی.`;
}

async function getOwnerNameForUniqueNumber(
    tx,
    uniqueData,
    uniqueType
) {
    const recordId = cleanText(uniqueData.recordId);

    const directName =
        cleanText(uniqueData.createdByName) ||
        cleanText(uniqueData.adminName) ||
        cleanText(uniqueData.ownerName);

    if (directName) {
        return directName;
    }

    if (!recordId) {
        return "نامعلوم اډمین";
    }

    const ownerRecordRef = doc(
        db,
        RECORDS_COLLECTION,
        recordId
    );

    const ownerSnapshot = await tx.get(ownerRecordRef);

    if (!ownerSnapshot.exists()) {
        return "نامعلوم اډمین";
    }

    const ownerData = ownerSnapshot.data() || {};

    const ownerName =
        cleanText(ownerData.createdByName) ||
        cleanText(ownerData.updatedByName) ||
        cleanText(ownerData.person?.createdByName) ||
        cleanText(ownerData.person?.updatedByName) ||
        cleanText(ownerData.createdBy) ||
        cleanText(ownerData.updatedBy) ||
        "نامعلوم اډمین";

    return ownerName;
}

async function isUniqueNumberReserved(
    type,
    value,
    currentRecordId = ""
) {
    const number = normalizeUniqueNumber(value);

    if (!number) {
        return false;
    }

    const uniqueRef = doc(
        db,
        UNIQUE_NUMBERS_COLLECTION,
        uniqueDocId(type, number)
    );

    const snapshot = await getDoc(uniqueRef);

    if (!snapshot.exists()) {
        return false;
    }

    const data = snapshot.data() || {};
    return cleanText(data.recordId) !== cleanText(currentRecordId);
}

async function assertUniqueNumbersInTransaction(
    tx,
    recordId,
    data
) {
    const items = getUniqueNumberItemsFromData(data);

    for (const item of items) {
        const number = normalizeUniqueNumber(item.value);

        if (!number) {
            continue;
        }

        const uniqueRef = doc(
            db,
            UNIQUE_NUMBERS_COLLECTION,
            uniqueDocId(item.type, number)
        );

        const snapshot = await tx.get(uniqueRef);

        if (snapshot.exists()) {
            const existing = snapshot.data() || {};
            const ownerId = cleanText(existing.recordId);

            if (ownerId && ownerId !== cleanText(recordId)) {
                const ownerName = await getOwnerNameForUniqueNumber(
                    tx,
                    existing,
                    item.type
                );

                const error = new Error(
                    buildDuplicateMessage(item.type, ownerName)
                );

                error.code = "duplicate_number";
                error.fieldId = item.fieldId;
                throw error;
            }
        }
    }
}

function writeUniqueNumbers(tx, recordId, data) {
    const items = getUniqueNumberItemsFromData(data);

    for (const item of items) {
        const number = normalizeUniqueNumber(item.value);

        if (!number) {
            continue;
        }

        const uniqueRef = doc(
            db,
            UNIQUE_NUMBERS_COLLECTION,
            uniqueDocId(item.type, number)
        );

        tx.set(
            uniqueRef,
            {
                type: item.type,
                number,
                recordId: cleanText(recordId),
                createdByName: getCurrentAdminName(),
                createdByEmail: getCurrentAdminEmail(),
                source: RECORDS_COLLECTION,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );
    }
}


// ==========================================
// Message
// ==========================================

function showMessage(
    message,
    type = "success"
) {
    formMessage.textContent = message;
    formMessage.className =
        "alert alert-" + type;
    formMessage.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function hideMessage() {
    formMessage.style.display = "none";
    formMessage.textContent = "";
    formMessage.className = "alert";
}


// ==========================================
// Errors
// ==========================================

function clearErrors() {
    document
        .querySelectorAll(".form-error")
        .forEach(el => {
            el.textContent = "";
        });

    document
        .querySelectorAll(".form-control")
        .forEach(el => {
            el.classList.remove("error");
        });
}

function setFieldError(
    fieldId,
    message
) {
    const errorBox =
        document.getElementById(`${fieldId}Error`);

    const field =
        document.getElementById(fieldId);

    if (errorBox) {
        errorBox.textContent = message || "";
    }

    if (field && message) {
        field.classList.add("error");
    }
}


// ==========================================
// Provinces
// ==========================================

function loadProvinces() {
    if (
        !originalProvince ||
        !currentProvince
    ) {
        return;
    }

    const provinces =
        getProvinces();

    provinces.forEach(province => {
        const option1 =
            document.createElement("option");
        option1.value = province;
        option1.textContent = province;

        const option2 =
            document.createElement("option");
        option2.value = province;
        option2.textContent = province;

        originalProvince.appendChild(option1);
        currentProvince.appendChild(option2);
    });
}


// ==========================================
// Jihadi History
// ==========================================

function updateJihadiHistory() {
    const isMujahid =
        category.value === "مجاهد";

    jihadiHistory.required = isMujahid;
    jihadiRequired.style.display =
        isMujahid ? "" : "none";

    if (!isMujahid) {
        jihadiHistory.value = "";
    }
}


// ==========================================
// Tazkira Mode
// ==========================================

function setTazkiraMode(mode) {
    const isPaper =
        mode === TAZKIRA_TYPES.PAPER;

    const isElectronic =
        !isPaper;

    tazkiraTypeElectronic.checked =
        isElectronic;

    tazkiraTypePaper.checked =
        isPaper;

    if (electronicTazkiraGroup) {
        electronicTazkiraGroup.style.display =
            isPaper ? "none" : "";
    }

    if (paperNumberGroup) {
        paperNumberGroup.style.display =
            isPaper ? "" : "none";
    }

    if (paperJildGroup) {
        paperJildGroup.style.display =
            isPaper ? "" : "none";
    }

    if (paperSafhaGroup) {
        paperSafhaGroup.style.display =
            isPaper ? "" : "none";
    }

    if (paperGanaGroup) {
        paperGanaGroup.style.display =
            isPaper ? "" : "none";
    }

    tazkira.required = isElectronic;

    if (electronicTazkiraRequired) {
        electronicTazkiraRequired.style.display =
            isElectronic ? "" : "none";
    }

    paperTazkiraNumber.required = isPaper;
    paperTazkiraVolume.required = isPaper;
    paperTazkiraPage.required = isPaper;
    paperTazkiraGana.required = isPaper;

    if (paperTazkiraNumberRequired) {
        paperTazkiraNumberRequired.style.display =
            isPaper ? "" : "none";
    }

    if (paperTazkiraVolumeRequired) {
        paperTazkiraVolumeRequired.style.display =
            isPaper ? "" : "none";
    }

    if (paperTazkiraPageRequired) {
        paperTazkiraPageRequired.style.display =
            isPaper ? "" : "none";
    }

    if (paperTazkiraGanaRequired) {
        paperTazkiraGanaRequired.style.display =
            isPaper ? "" : "none";
    }

    if (!isPaper) {
        paperTazkiraNumber.required = false;
        paperTazkiraVolume.required = false;
        paperTazkiraPage.required = false;
        paperTazkiraGana.required = false;
    }

    if (isElectronic) {
        paperTazkiraNumber.value = "";
        paperTazkiraVolume.value = "";
        paperTazkiraPage.value = "";
        paperTazkiraGana.value = "";
    } else {
        tazkira.value = "";
    }
}

function getSelectedTazkiraType() {
    return tazkiraTypePaper.checked
        ? TAZKIRA_TYPES.PAPER
        : TAZKIRA_TYPES.ELECTRONIC;
}


// ==========================================
// Electronic Tazkira Formatting
// یوازې دقیق 13 عددونه + 2 کرښې
// ==========================================

function formatElectronicTazkiraInput(input) {
    let value =
        cleanText(input).replace(/[^0-9]/g, "");

    if (value.length > 13) {
        value = value.substring(0, 13);
    }

    if (value.length > 8) {
        value =
            value.substring(0, 4) +
            "-" +
            value.substring(4, 8) +
            "-" +
            value.substring(8);
    } else if (value.length > 4) {
        value =
            value.substring(0, 4) +
            "-" +
            value.substring(4);
    }

    return value;
}


// ==========================================
// Paper Tazkira Formatting
// یوازې عددونه
// هېڅ د عددونو محدودیت نشته
// ==========================================

function formatPaperNumberInput(input) {
    return cleanText(input).replace(/[^0-9]/g, "");
}

function setupPaperNumericField(field) {
    if (!field) {
        return;
    }

    field.addEventListener("input", () => {
        field.value =
            formatPaperNumberInput(field.value);
    });
}


// ==========================================
// Form Number Formatting
// یوازې 0-9 ارقام
// ==========================================

function formatFormNumberInput(input) {
    return cleanText(input).replace(/[^0-9]/g, "");
}

if (formNumber) {
    formNumber.addEventListener("input", () => {
        formNumber.value =
            formatFormNumberInput(formNumber.value);
    });
}


// ==========================================
// Collect Form Data
// ==========================================

function collectFormData() {
    const tazkiraType =
        getSelectedTazkiraType();

    const data = {
        formNumber: cleanText(formNumber.value),
        category: cleanText(category.value),
        firstName: cleanText(firstName.value),
        lastName: cleanText(lastName.value),
        fatherName: cleanText(fatherName.value),
        grandfatherName: cleanText(grandfatherName.value),

        englishName: cleanText(englishName.value),
        englishLastName: cleanText(englishLastName.value),
        englishFatherName: cleanText(englishFatherName.value),
        englishGrandfatherName: cleanText(englishGrandfatherName.value),

        birthDate: cleanText(birthDate.value),
        age: cleanText(age.value),
        phone: cleanText(phone.value),

        tazkiraType,

        tazkira:
            tazkiraType === TAZKIRA_TYPES.ELECTRONIC
                ? cleanText(tazkira.value)
                : "",

        electronicTazkiraNumber:
            tazkiraType === TAZKIRA_TYPES.ELECTRONIC
                ? cleanText(tazkira.value)
                : "",

        paperTazkiraVolume:
            tazkiraType === TAZKIRA_TYPES.PAPER
                ? cleanText(paperTazkiraVolume.value)
                : "",

        paperTazkiraPage:
            tazkiraType === TAZKIRA_TYPES.PAPER
                ? cleanText(paperTazkiraPage.value)
                : "",

        paperTazkiraNumber:
            tazkiraType === TAZKIRA_TYPES.PAPER
                ? cleanText(paperTazkiraNumber.value)
                : "",

        originalLocation: {
            province: cleanText(originalProvince.value),
            district: cleanText(originalDistrict.value),
            village: cleanText(originalVillage.value)
        },

        currentLocation: {
            province: cleanText(currentProvince.value),
            district: cleanText(currentDistrict.value),
            village: cleanText(currentVillage.value)
        },

        currentJob: cleanText(currentJob.value),
        groupLeader: cleanText(groupLeader.value),
        jihadiHistory: cleanText(jihadiHistory.value),
        pdfCreationDate: cleanText(pdfCreationDate.value),

        fieldState: {},
        visibilityState: {}
    };

    return data;
}


// ==========================================
// Validation Error Extraction
// ==========================================

function extractValidationErrors(result) {
    if (!result) {
        return ["د فورم معلومات سم نه دي."];
    }

    if (
        Array.isArray(result.errors) &&
        result.errors.length > 0
    ) {
        return result.errors;
    }

    if (result.message) {
        return [result.message];
    }

    return ["د فورم معلومات سم نه دي."];
}


// ==========================================
// Map Validation Errors
// ==========================================

function mapValidationToFields(errors = []) {
    const text = errors.join(" ");

    if (text.includes("فورمي نمبر")) {
        setFieldError("formNumber", text);
    }

    if (text.includes("نوم")) {
        setFieldError("firstName", text);
    }

    if (text.includes("تخلص")) {
        setFieldError("lastName", text);
    }

    if (text.includes("پلار")) {
        setFieldError("fatherName", text);
    }

    if (text.includes("نیکه")) {
        setFieldError("grandfatherName", text);
    }

    if (text.includes("عمر")) {
        setFieldError("age", text);
    }

    if (text.includes("تذکرې")) {
        setFieldError("tazkira", text);
    }

    if (text.includes("جلد")) {
        setFieldError("paperTazkiraVolume", text);
    }

    if (text.includes("صفحه")) {
        setFieldError("paperTazkiraPage", text);
    }

    if (text.includes("ګڼه")) {
        setFieldError("paperTazkiraNumber", text);
    }

    if (text.includes("PDF")) {
        setFieldError("pdfCreationDate", text);
    }

    if (text.includes("اصلي ځای")) {
        setFieldError("originalDistrict", text);
    }

    if (text.includes("فعلي ځای")) {
        setFieldError("currentDistrict", text);
    }

    if (text.includes("دلګی")) {
        setFieldError("groupLeader", text);
    }
}


// ==========================================
// Populate Form For Edit
// ==========================================

function populateFormFromRecord(record) {
    if (!record) {
        return;
    }

    formNumber.value =
        formatFormNumberInput(
            cleanText(record.formNumber)
        );

    category.value = cleanText(record.category);

    const person = record.person || {};

    firstName.value =
        cleanText(
            person.firstName ??
            record.firstName
        );

    lastName.value =
        cleanText(
            person.lastName ??
            record.lastName
        );

    fatherName.value =
        cleanText(
            person.fatherName ??
            record.fatherName
        );

    grandfatherName.value =
        cleanText(
            person.grandfatherName ??
            record.grandfatherName
        );

    englishName.value =
        cleanText(
            record.englishName ??
            person.englishName
        );

    englishLastName.value =
        cleanText(
            record.englishLastName ??
            person.englishLastName
        );

    englishFatherName.value =
        cleanText(
            record.englishFatherName ??
            person.englishFatherName
        );

    englishGrandfatherName.value =
        cleanText(
            record.englishGrandfatherName ??
            person.englishGrandfatherName
        );

    birthDate.value =
        cleanText(
            person.birthDate ??
            record.birthDate
        );

    age.value =
        cleanText(
            person.age ??
            record.age
        );

    phone.value =
        cleanText(
            person.phone ??
            record.phone
        );

    const original = record.originalLocation || {};

    originalProvince.value =
        cleanText(original.province);

    originalDistrict.value =
        cleanText(original.district);

    originalVillage.value =
        cleanText(original.village);

    const current = record.currentLocation || {};

    currentProvince.value =
        cleanText(current.province);

    currentDistrict.value =
        cleanText(current.district);

    currentVillage.value =
        cleanText(current.village);

    currentJob.value =
        cleanText(record.currentJob);

    groupLeader.value =
        cleanText(record.groupLeader);

    jihadiHistory.value =
        cleanText(record.jihadiHistory);

    pdfCreationDate.value =
        cleanText(record.pdfCreationDate);

    const tType =
        cleanText(
            record.tazkiraType ||
            person.tazkiraType ||
            record.tazkiraDetails?.type
        );

    if (tType === TAZKIRA_TYPES.PAPER) {
        setTazkiraMode(TAZKIRA_TYPES.PAPER);

        paperTazkiraVolume.value =
            cleanText(
                record.tazkiraDetails?.paper?.volume ??
                record.paperTazkiraVolume
            );

        paperTazkiraPage.value =
            cleanText(
                record.tazkiraDetails?.paper?.page ??
                record.paperTazkiraPage
            );

        paperTazkiraNumber.value =
            cleanText(
                record.tazkiraDetails?.paper?.number ??
                record.paperTazkiraNumber
            );
    } else {
        setTazkiraMode(TAZKIRA_TYPES.ELECTRONIC);

        const electronicNumber =
            cleanText(
                record.tazkiraSearchKey ||
                record.tazkiraDisplay ||
                person.tazkira ||
                record.tazkiraDetails?.electronicNumber ||
                record.electronicTazkiraNumber ||
                record.tazkira
            );

        tazkira.value =
            formatElectronicTazkiraInput(
                electronicNumber
            );
    }

    updateJihadiHistory();
}


// ==========================================
// Load Record For Edit
// ==========================================

async function loadRecordForEdit(recordId) {
    const id = cleanText(recordId);

    if (!id) {
        return;
    }

    loadingRecord = true;

    try {
        const recordRef = doc(
            db,
            RECORDS_COLLECTION,
            id
        );

        const snapshot = await getDoc(recordRef);

        if (!snapshot.exists()) {
            showMessage(
                "د edit لپاره ثبت شوی معلومات پیدا نه شو.",
                "danger"
            );
            return;
        }

        const record = snapshot.data() || {};

        populateFormFromRecord(record);

        recordIdInput.value = id;
        editModeInput.value = "1";

        saveBtn.textContent =
            "💾 بدلونونه خوندي کړئ";

        showMessage(
            "د edit حالت فعال شو.",
            "success"
        );
    } catch (error) {
        console.error("Load Record Error:", error);

        showMessage(
            "د ثبت شوي معلوماتو د لوستلو پر مهال ستونزه رامنځته شوه.",
            "danger"
        );
    } finally {
        loadingRecord = false;
    }
}


// ==========================================
// Duplicate Form Number Check
// ==========================================

async function formNumberExists(
    value,
    excludeId = ""
) {
    return await isUniqueNumberReserved(
        "formNumber",
        value,
        excludeId
    );
}


// ==========================================
// Firestore Document Builder
// ==========================================

function buildFirestoreData(
    data,
    existing = {}
) {
    const previousPerson =
        existing.person || {};

    const person = {
        ...previousPerson,

        firstName: data.firstName,
        lastName: data.lastName,
        fatherName: data.fatherName,
        grandfatherName: data.grandfatherName,
        birthDate: data.birthDate,
        age: data.age,
        phone: data.phone,

        englishName: data.englishName,
        englishLastName: data.englishLastName,
        englishFatherName: data.englishFatherName,
        englishGrandfatherName: data.englishGrandfatherName,

        tazkiraType: data.tazkiraType,
        tazkira: data.tazkira
    };

    const firestoreData = {
        formNumber: data.formNumber,
        category: data.category,

        firstName: data.firstName,
        lastName: data.lastName,
        fatherName: data.fatherName,
        grandfatherName: data.grandfatherName,

        englishName: data.englishName,
        englishLastName: data.englishLastName,
        englishFatherName: data.englishFatherName,
        englishGrandfatherName: data.englishGrandfatherName,

        person,

        birthDate: data.birthDate,
        age: data.age,
        phone: data.phone,

        tazkiraType: data.tazkiraType,
        tazkira: data.tazkira,
        electronicTazkiraNumber: data.electronicTazkiraNumber,
        paperTazkiraVolume: data.paperTazkiraVolume,
        paperTazkiraPage: data.paperTazkiraPage,
        paperTazkiraNumber: data.paperTazkiraNumber,

        originalLocation: data.originalLocation,
        currentLocation: data.currentLocation,

        currentJob: data.currentJob,
        groupLeader: data.groupLeader,
        jihadiHistory: data.jihadiHistory,
        pdfCreationDate: data.pdfCreationDate,

        fieldState: data.fieldState || {},
        visibilityState: data.visibilityState || {}
    };

    return firestoreData;
}


// ==========================================
// Register Person
// ==========================================

async function registerPerson(data) {
    try {
        const recordRef =
            doc(collection(db, RECORDS_COLLECTION));

        const firestoreData =
            buildFirestoreData(data);

        firestoreData.createdAt =
            serverTimestamp();

        firestoreData.updatedAt =
            serverTimestamp();

        firestoreData.createdBy =
            "authenticated-user";

        firestoreData.createdByName =
            getCurrentAdminName();

        firestoreData.createdByEmail =
            getCurrentAdminEmail();

        firestoreData.updatedBy =
            "authenticated-user";

        firestoreData.updatedByName =
            getCurrentAdminName();

        firestoreData.updatedByEmail =
            getCurrentAdminEmail();

        await runTransaction(db, async tx => {
            await assertUniqueNumbersInTransaction(
                tx,
                recordRef.id,
                data
            );

            tx.set(recordRef, firestoreData);
            writeUniqueNumbers(tx, recordRef.id, data);
        });

        return {
            success: true,
            id: recordRef.id,
            message: "فورمه په بریالیتوب آنلاین ثبت شوه."
        };
    } catch (error) {
        console.error("Register Person Error:", error);

        if (error?.code === "duplicate_number") {
            return {
                success: false,
                errors: [error.message]
            };
        }

        return {
            success: false,
            message: "فورمه Firestore ته ثبت نه شوه. د انټرنېټ او Firebase اتصال وګورئ."
        };
    }
}


// ==========================================
// Update Registration
// ==========================================

async function updateRegistration(
    recordId,
    data
) {
    const id = cleanText(recordId);

    if (!id) {
        return {
            success: false,
            message: "د ثبت د بدلون ID پیدا نه شو."
        };
    }

    try {
        const recordRef = doc(
            db,
            RECORDS_COLLECTION,
            id
        );

        await runTransaction(db, async tx => {
            const snapshot = await tx.get(recordRef);

            if (!snapshot.exists()) {
                throw new Error("د بدلون لپاره ثبت شوی فورم پیدا نه شو.");
            }

            const existing = snapshot.data() || {};

            const oldItems =
                getUniqueNumberItemsFromRecord(existing);

            for (const item of oldItems) {
                const number = normalizeUniqueNumber(item.value);

                if (!number) {
                    continue;
                }

                const uniqueRef = doc(
                    db,
                    UNIQUE_NUMBERS_COLLECTION,
                    uniqueDocId(item.type, number)
                );

                const uniqueSnap = await tx.get(uniqueRef);

                if (uniqueSnap.exists()) {
                    const uniqueData = uniqueSnap.data() || {};

                    if (cleanText(uniqueData.recordId) === id) {
                        tx.delete(uniqueRef);
                    }
                }
            }

            await assertUniqueNumbersInTransaction(
                tx,
                id,
                data
            );

            const firestoreData =
                buildFirestoreData(data, existing);

            firestoreData.updatedAt =
                serverTimestamp();

            firestoreData.updatedBy =
                "authenticated-user";

            firestoreData.updatedByName =
                getCurrentAdminName();

            firestoreData.updatedByEmail =
                getCurrentAdminEmail();

            firestoreData.createdByName =
                cleanText(existing.createdByName) ||
                getCurrentAdminName();

            firestoreData.createdByEmail =
                cleanText(existing.createdByEmail) ||
                getCurrentAdminEmail();

            firestoreData.createdBy =
                cleanText(existing.createdBy) ||
                "authenticated-user";

            tx.update(recordRef, firestoreData);
            writeUniqueNumbers(tx, id, data);
        });

        return {
            success: true,
            id,
            message: "بدلونونه په بریالیتوب آنلاین خوندي شول."
        };
    } catch (error) {
        console.error("Update Registration Error:", error);

        if (error?.code === "duplicate_number") {
            return {
                success: false,
                errors: [error.message]
            };
        }

        return {
            success: false,
            message:
                error?.message ||
                "د معلوماتو د تازه کولو پر مهال Firestore ستونزه رامنځته شوه."
        };
    }
}


// ==========================================
// Delete Registration
// ==========================================

export async function deleteRegistration(recordId) {
    const id = cleanText(recordId);

    if (!id) {
        return {
            success: false,
            message: "د حذف لپاره ID پیدا نه شو."
        };
    }

    try {
        const recordRef = doc(
            db,
            RECORDS_COLLECTION,
            id
        );

        await runTransaction(db, async tx => {
            const snapshot = await tx.get(recordRef);

            if (!snapshot.exists()) {
                throw new Error("د حذف لپاره ثبت شوی فورم پیدا نه شو.");
            }

            const recordData = snapshot.data() || {};

            const oldItems =
                getUniqueNumberItemsFromRecord(recordData);

            for (const item of oldItems) {
                const number = normalizeUniqueNumber(item.value);

                if (!number) {
                    continue;
                }

                const uniqueRef = doc(
                    db,
                    UNIQUE_NUMBERS_COLLECTION,
                    uniqueDocId(item.type, number)
                );

                const uniqueSnap = await tx.get(uniqueRef);

                if (uniqueSnap.exists()) {
                    const uniqueData = uniqueSnap.data() || {};

                    if (cleanText(uniqueData.recordId) === id) {
                        tx.delete(uniqueRef);
                    }
                }
            }

            tx.delete(recordRef);
        });

        return {
            success: true,
            id,
            message: "ثبت شوی معلومات په بریالیتوب حذف شول."
        };
    } catch (error) {
        console.error("Delete Registration Error:", error);

        return {
            success: false,
            message:
                error?.message ||
                "د حذف پر مهال ستونزه رامنځته شوه."
        };
    }
}


// ==========================================
// Birth Date Formatting
// ==========================================

birthDate.addEventListener("input", () => {
    let value =
        birthDate.value.replace(/[^0-9]/g, "");

    if (value.length > 8) {
        value = value.substring(0, 8);
    }

    if (value.length > 6) {
        value =
            value.substring(0, 4) +
            "/" +
            value.substring(4, 6) +
            "/" +
            value.substring(6);
    } else if (value.length > 4) {
        value =
            value.substring(0, 4) +
            "/" +
            value.substring(4);
    }

    birthDate.value = value;
});


// ==========================================
// Electronic Tazkira Formatting
// ==========================================

tazkira.addEventListener("input", () => {
    tazkira.value =
        formatElectronicTazkiraInput(
            tazkira.value
        );
});


// ==========================================
// Paper Tazkira
// یوازې عددونه
// هېڅ عدد محدودیت نشته
// ==========================================

setupPaperNumericField(paperTazkiraVolume);
setupPaperNumericField(paperTazkiraPage);
setupPaperNumericField(paperTazkiraNumber);


// ==========================================
// Tazkira Type Controls
// ==========================================

tazkiraTypeElectronic.addEventListener(
    "change",
    () => {
        if (tazkiraTypeElectronic.checked) {
            setTazkiraMode(TAZKIRA_TYPES.ELECTRONIC);
        }
    }
);

tazkiraTypePaper.addEventListener(
    "change",
    () => {
        if (tazkiraTypePaper.checked) {
            setTazkiraMode(TAZKIRA_TYPES.PAPER);
        }
    }
);


// ==========================================
// Category Controls
// ==========================================

category.addEventListener("change", updateJihadiHistory);


// ==========================================
// Submit Registration
// ==========================================

form.addEventListener("submit", async event => {
    event.preventDefault();

    hideMessage();
    clearErrors();

    if (loadingRecord) {
        showMessage(
            "مهرباني وکړئ لږ انتظار وکړئ، معلومات لوډېږي.",
            "warning"
        );
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "⏳ ثبتېږي...";

    try {
        const data = collectFormData();

        if (!/^[0-9]+$/.test(data.formNumber)) {
            const message =
                "د کره کمیسیون د فورمي نمبر باید یوازې ارقام ولري.";

            setFieldError("formNumber", message);
            showMessage(message, "danger");
            return;
        }

        if (
            await isUniqueNumberReserved(
                "formNumber",
                data.formNumber,
                recordIdInput.value
            )
        ) {
            const message =
                "دا فورمی نمبر مخکې ثبت شوی دی.";

            setFieldError("formNumber", message);
            showMessage(message, "danger");
            return;
        }

        if (
            data.tazkiraType === TAZKIRA_TYPES.ELECTRONIC
        ) {
            if (
                await isUniqueNumberReserved(
                    "electronicTazkiraNumber",
                    data.electronicTazkiraNumber,
                    recordIdInput.value
                )
            ) {
                const message =
                    "دا برقی تذکیری نمبر مخکې ثبت شوی دی.";

                setFieldError("tazkira", message);
                showMessage(message, "danger");
                return;
            }
        }

        if (
            data.tazkiraType === TAZKIRA_TYPES.PAPER
        ) {
            if (
                await isUniqueNumberReserved(
                    "paperTazkiraNumber",
                    data.paperTazkiraNumber,
                    recordIdInput.value
                )
            ) {
                const message =
                    "دا کاغذی تذکیری نمبر مخکې ثبت شوی دی.";

                setFieldError("paperTazkiraNumber", message);
                showMessage(message, "danger");
                return;
            }
        }

        const validation =
            validateRegistration(data);

        if (!validation.valid) {
            const errors =
                extractValidationErrors(validation);

            mapValidationToFields(errors);

            showMessage(errors.join(" "), "danger");
            return;
        }

        if (
            data.tazkiraType === TAZKIRA_TYPES.ELECTRONIC
        ) {
            if (
                !ELECTRONIC_TAZKIRA_PATTERN.test(
                    data.electronicTazkiraNumber
                )
            ) {
                const message =
                    "د برقي تذکرې بڼه باید 0000-0000-00000 وي.";

                setFieldError("tazkira", message);
                showMessage(message, "danger");
                return;
            }
        }

        if (
            data.tazkiraType === TAZKIRA_TYPES.PAPER
        ) {
            const v = cleanText(data.paperTazkiraVolume);
            const p = cleanText(data.paperTazkiraPage);
            const n = cleanText(data.paperTazkiraNumber);

            if (!v || !p || !n) {
                showMessage(
                    "د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ټول اجباري دي.",
                    "danger"
                );
                return;
            }

            if (
                !NUMERIC_ONLY_PATTERN.test(v) ||
                !NUMERIC_ONLY_PATTERN.test(p) ||
                !NUMERIC_ONLY_PATTERN.test(n)
            ) {
                showMessage(
                    "د کاغذي تذکرې جلد، صفحه او ګڼه باید یوازې عددونه ولري.",
                    "danger"
                );
                return;
            }
        }

        let result;

        if (
            editModeInput.value === "1" &&
            cleanText(recordIdInput.value)
        ) {
            result =
                await updateRegistration(
                    recordIdInput.value,
                    data
                );
        } else {
            result =
                await registerPerson(data);
        }

        if (!result.success) {
            const errors =
                Array.isArray(result.errors)
                    ? result.errors
                    : [];

            if (errors.length) {
                mapValidationToFields(errors);
                showMessage(errors.join(" "), "danger");
            } else {
                showMessage(
                    result.message || "فورمه ثبت نه شوه.",
                    "danger"
                );
            }

            return;
        }

        showMessage(
            result.message || "فورمه په بریالیتوب ثبت شوه.",
            "success"
        );

        form.reset();

        recordIdInput.value = "";
        editModeInput.value = "0";

        saveBtn.textContent = "💾 فورمه ثبت کړئ";

        setTazkiraMode(TAZKIRA_TYPES.ELECTRONIC);
        updateJihadiHistory();

        setTimeout(() => {
            setTodayPdfDate();
        }, 0);
    } catch (error) {
        console.error("Register Page Error:", error);

        showMessage(
            "د فورم د ثبت پر مهال ستونزه رامنځته شوه.",
            "danger"
        );
    } finally {
        saveBtn.disabled = false;

        if (editModeInput.value === "1") {
            saveBtn.textContent = "💾 بدلونونه خوندي کړئ";
        } else {
            saveBtn.textContent = "💾 فورمه ثبت کړئ";
        }
    }
});


// ==========================================
// Reset
// ==========================================

resetBtn.addEventListener("click", () => {
    clearErrors();
    hideMessage();

    setTimeout(() => {
        updateJihadiHistory();
        setTazkiraMode(TAZKIRA_TYPES.ELECTRONIC);
        setTodayPdfDate();
    }, 0);
});


// ==========================================
// Navigation
// ==========================================

dashboardBtn.addEventListener("click", () => {
    window.location.href = "./dashboard.html";
});

document
    .getElementById("dashboardMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./dashboard.html";
    });

document
    .getElementById("registerMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./register.html";
    });

document
    .getElementById("searchMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./search.html";
    });

document
    .getElementById("reportsMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./reports.html";
    });

document
    .getElementById("adminMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./admin.html";
    });

document
    .getElementById("settingsMenuBtn")
    .addEventListener("click", () => {
        window.location.href = "./settings.html";
    });

backBtn.addEventListener("click", () => {
    window.history.back();
});

refreshBtn.addEventListener("click", () => {
    window.location.reload();
});


// ==========================================
// Logout
// ==========================================

logoutBtn.addEventListener("click", async () => {
    const button = logoutBtn;
    button.disabled = true;

    try {
        const result = await logoutUser();

        if (result.success) {
            window.location.href = "./index.html";
            return;
        }

        button.disabled = false;

        showMessage(
            result.message || "له سیستم څخه وتل ناکام شول.",
            "danger"
        );
    } catch (error) {
        console.error("Logout Error:", error);

        button.disabled = false;

        showMessage(
            "له سیستم څخه وتل ناکام شول.",
            "danger"
        );
    }
});


// ==========================================
// Authentication
// ==========================================

listenAuth(async session => {
    if (!session) {
        window.location.href = "./index.html";
        return;
    }

    activeAdmin = {
        name:
            cleanText(
                session.displayName ||
                session.name ||
                session.user?.displayName ||
                session.user?.name ||
                session.user?.fullName
            ) || "نامعلوم اډمین",
        email:
            cleanText(
                session.email ||
                session.user?.email
            ),
        uid:
            cleanText(
                session.uid ||
                session.user?.uid
            )
    };

    try {
        await initializeSettings();

        const params =
            new URLSearchParams(window.location.search);

        const recordId = params.get("recordId");

        if (recordId) {
            await loadRecordForEdit(recordId);
        }
    } catch (error) {
        console.error("Authentication Setup Error:", error);

        showMessage(
            "د سیستم د تنظیماتو د لوډ پر مهال ستونزه رامنځته شوه.",
            "danger"
        );
    }
});


// ==========================================
// Today's PDF Date
// ==========================================

function setTodayPdfDate() {
    if (!pdfCreationDate) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const day =
        String(today.getDate()).padStart(2, "0");

    pdfCreationDate.value = `${year}-${month}-${day}`;
}


// ==========================================
// Initial Setup
// ==========================================

applySystemName();

loadProvinces();
updateJihadiHistory();
setTazkiraMode(TAZKIRA_TYPES.ELECTRONIC);

if (!pdfCreationDate.value) {
    setTodayPdfDate();
}
