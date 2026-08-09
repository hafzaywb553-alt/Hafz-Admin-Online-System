// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت ډیټابیس
//
// register.js
// Registration Engine
// Firebase / Firestore Online Version
// ==========================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
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

const ELECTRONIC_TAZKIRA_PATTERN =
    /^[0-9]{4}-[0-9]{4}-[0-9]{5}$/;

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


const formNumber =
    document.getElementById("formNumber");

const category =
    document.getElementById("category");


/*
 * مهم:
 * د څلورو اصلي نومونو IDs هماغه پخواني IDs دي،
 * ترڅو له validation.js، search.js او موجودو
 * Firestore معلوماتو سره همغږي پاتې شي.
 */

const firstName =
    document.getElementById("firstName");

const lastName =
    document.getElementById("lastName");

const fatherName =
    document.getElementById("fatherName");

const grandfatherName =
    document.getElementById("grandfatherName");


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


const tazkiraTypeElectronic =
    document.getElementById("tazkiraTypeElectronic");

const tazkiraTypePaper =
    document.getElementById("tazkiraTypePaper");


const electronicTazkiraGroup =
    document.getElementById("electronicTazkiraGroup");

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


const recordIdInput =
    document.getElementById("recordId");

const editModeInput =
    document.getElementById("editMode");


// ==========================================
// State
// ==========================================

let loadingRecord = false;


// ==========================================
// Safety Check
// ==========================================

const requiredElements = [
    form,
    formMessage,
    saveBtn,
    resetBtn,
    backBtn,
    dashboardBtn,
    refreshBtn,
    logoutBtn,
    formNumber,
    category,
    firstName,
    lastName,
    fatherName,
    grandfatherName,
    birthDate,
    age,
    phone,
    currentJob,
    groupLeader,
    jihadiHistory,
    jihadiRequired,
    pdfCreationDate,
    originalProvince,
    originalDistrict,
    originalVillage,
    currentProvince,
    currentDistrict,
    currentVillage,
    tazkiraTypeElectronic,
    tazkiraTypePaper,
    electronicTazkiraGroup,
    paperJildGroup,
    paperSafhaGroup,
    paperGanaGroup,
    tazkira,
    paperTazkiraVolume,
    paperTazkiraPage,
    paperTazkiraNumber,
    recordIdInput,
    editModeInput
];

if (requiredElements.some(element => !element)) {
    console.error(
        "Register Page Error: د register.html اړین عناصر پیدا نه شول."
    );
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


function showMessage(
    message,
    type = "success"
) {

    formMessage.textContent =
        cleanText(message);

    formMessage.className =
        "alert alert-" + type;

    formMessage.style.display =
        "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function hideMessage() {

    formMessage.style.display =
        "none";

    formMessage.textContent =
        "";

    formMessage.className =
        "alert";
}


function clearErrors() {

    document
        .querySelectorAll(".form-error")
        .forEach(element => {

            element.textContent = "";

        });


    document
        .querySelectorAll(".form-control")
        .forEach(element => {

            element.classList.remove(
                "error"
            );

        });

}


function setFieldError(
    fieldId,
    message
) {

    const errorBox =
        document.getElementById(
            `${fieldId}Error`
        );

    const field =
        document.getElementById(
            fieldId
        );


    if (errorBox) {

        errorBox.textContent =
            message || "";

    }


    if (field && message) {

        field.classList.add(
            "error"
        );

    }

}


// ==========================================
// Province Loading
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


    if (!Array.isArray(provinces)) {

        console.error(
            "locations.js باید getProvinces() کې Array ورکړي."
        );

        return;

    }


    originalProvince
        .querySelectorAll(
            "option:not(:first-child)"
        )
        .forEach(option =>
            option.remove()
        );


    currentProvince
        .querySelectorAll(
            "option:not(:first-child)"
        )
        .forEach(option =>
            option.remove()
        );


    provinces.forEach(province => {

        const value =
            cleanText(province);

        if (!value) {
            return;
        }


        const option1 =
            document.createElement(
                "option"
            );

        option1.value =
            value;

        option1.textContent =
            value;


        const option2 =
            document.createElement(
                "option"
            );

        option2.value =
            value;

        option2.textContent =
            value;


        originalProvince
            .appendChild(option1);

        currentProvince
            .appendChild(option2);

    });

}


// ==========================================
// Jihadi History
// ==========================================

function updateJihadiHistory() {

    const isMujahid =
        category.value === "مجاهد";


    jihadiHistory.required =
        isMujahid;


    jihadiRequired.style.display =
        isMujahid
            ? "inline"
            : "none";


    if (!isMujahid) {

        jihadiHistory.value =
            "";

    }

}


// ==========================================
// Tazkira Mode
//
// IMPORTANT:
// Electronic and Paper Tazkira
// old structure is preserved.
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


    electronicTazkiraGroup.style.display =
        isElectronic
            ? "block"
            : "none";


    paperJildGroup.style.display =
        isPaper
            ? "block"
            : "none";


    paperSafhaGroup.style.display =
        isPaper
            ? "block"
            : "none";


    paperGanaGroup.style.display =
        isPaper
            ? "block"
            : "none";


    tazkira.required =
        isElectronic;


    paperTazkiraVolume.required =
        isPaper;

    paperTazkiraPage.required =
        isPaper;

    paperTazkiraNumber.required =
        isPaper;


    if (isElectronic) {

        paperTazkiraVolume.value =
            "";

        paperTazkiraPage.value =
            "";

        paperTazkiraNumber.value =
            "";

    } else {

        tazkira.value =
            "";

    }

}


function getSelectedTazkiraType() {

    return tazkiraTypePaper.checked
        ? TAZKIRA_TYPES.PAPER
        : TAZKIRA_TYPES.ELECTRONIC;

}


// ==========================================
// Electronic Tazkira Formatting
// ==========================================

function formatElectronicTazkiraInput(
    input
) {

    let value =
        cleanText(input)
            .replace(
                /[^0-9]/g,
                ""
            );


    if (value.length > 13) {

        value =
            value.substring(
                0,
                13
            );

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
// Birth Date Formatting
// ==========================================

function formatBirthDateInput(
    input
) {

    let value =
        cleanText(input)
            .replace(
                /[^0-9]/g,
                ""
            );


    if (value.length > 8) {

        value =
            value.substring(
                0,
                8
            );

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


    return value;

}


// ==========================================
// Collect Form Data
// ==========================================

function collectFormData() {

    const tazkiraType =
        getSelectedTazkiraType();


    const person = {

        firstName:
            cleanText(
                firstName.value
            ),

        lastName:
            cleanText(
                lastName.value
            ),

        fatherName:
            cleanText(
                fatherName.value
            ),

        grandfatherName:
            cleanText(
                grandfatherName.value
            ),

        birthDate:
            cleanText(
                birthDate.value
            ),

        age:
            cleanText(
                age.value
            ),

        phone:
            cleanText(
                phone.value
            )

    };


    return {

        formNumber:
            cleanText(
                formNumber.value
            ),

        category:
            cleanText(
                category.value
            ),


        // ==================================
        // Four English-name fields
        // ==================================

        firstName:
            person.firstName,

        lastName:
            person.lastName,

        fatherName:
            person.fatherName,

        grandfatherName:
            person.grandfatherName,


        person,


        // ==================================
        // Other personal information
        // ==================================

        birthDate:
            person.birthDate,

        age:
            person.age,

        phone:
            person.phone,


        // ==================================
        // Tazkira
        // ==================================

        tazkiraType,

        tazkira:
            tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? cleanText(
                    tazkira.value
                )
                : "",


        electronicTazkiraNumber:
            tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? cleanText(
                    tazkira.value
                )
                : "",


        paperTazkiraVolume:
            tazkiraType ===
            TAZKIRA_TYPES.PAPER
                ? cleanText(
                    paperTazkiraVolume.value
                )
                : "",


        paperTazkiraPage:
            tazkiraType ===
            TAZKIRA_TYPES.PAPER
                ? cleanText(
                    paperTazkiraPage.value
                )
                : "",


        paperTazkiraNumber:
            tazkiraType ===
            TAZKIRA_TYPES.PAPER
                ? cleanText(
                    paperTazkiraNumber.value
                )
                : "",


        // ==================================
        // Original Location
        // ==================================

        originalLocation: {

            province:
                cleanText(
                    originalProvince.value
                ),

            district:
                cleanText(
                    originalDistrict.value
                ),

            village:
                cleanText(
                    originalVillage.value
                )

        },


        // ==================================
        // Current Location
        // ==================================

        currentLocation: {

            province:
                cleanText(
                    currentProvince.value
                ),

            district:
                cleanText(
                    currentDistrict.value
                ),

            village:
                cleanText(
                    currentVillage.value
                )

        },


        // ==================================
        // Work Information
        // ==================================

        currentJob:
            cleanText(
                currentJob.value
            ),

        groupLeader:
            cleanText(
                groupLeader.value
            ),

        jihadiHistory:
            cleanText(
                jihadiHistory.value
            ),


        // ==================================
        // PDF
        // ==================================

        pdfCreationDate:
            cleanText(
                pdfCreationDate.value
            ),


        // ==================================
        // State
        // ==================================

        fieldState: {},

        visibilityState: {}

    };

}


// ==========================================
// Validation Errors
// ==========================================

function extractValidationErrors(
    result
) {

    if (!result) {

        return [
            "د فورم معلومات سم نه دي."
        ];

    }


    if (
        Array.isArray(result.errors) &&
        result.errors.length > 0
    ) {

        return result.errors;

    }


    if (result.message) {

        return [
            result.message
        ];

    }


    return [
        "د فورم معلومات سم نه دي."
    ];

}


// ==========================================
// Map Validation Errors
// ==========================================

function mapValidationToFields(
    errors = []
) {

    errors.forEach(error => {

        const text =
            cleanText(error);


        if (
            text.includes("فورمي نمبر")
        ) {

            setFieldError(
                "formNumber",
                text
            );

        }


        if (
            text.includes("کټګوري")
        ) {

            setFieldError(
                "category",
                text
            );

        }


        if (
            text.includes("نوم")
        ) {

            setFieldError(
                "firstName",
                text
            );

        }


        if (
            text.includes("تخلص")
        ) {

            setFieldError(
                "lastName",
                text
            );

        }


        if (
            text.includes("پلار")
        ) {

            setFieldError(
                "fatherName",
                text
            );

        }


        if (
            text.includes("نیکه")
        ) {

            setFieldError(
                "grandfatherName",
                text
            );

        }


        if (
            text.includes("زېږون") ||
            text.includes("زېږېدو")
        ) {

            setFieldError(
                "birthDate",
                text
            );

        }


        if (
            text.includes("عمر")
        ) {

            setFieldError(
                "age",
                text
            );

        }


        if (
            text.includes("تذکرې") ||
            text.includes("تذکره")
        ) {

            if (
                getSelectedTazkiraType() ===
                TAZKIRA_TYPES.PAPER
            ) {

                setFieldError(
                    "paperTazkiraVolume",
                    text
                );

                setFieldError(
                    "paperTazkiraPage",
                    text
                );

                setFieldError(
                    "paperTazkiraNumber",
                    text
                );

            } else {

                setFieldError(
                    "tazkira",
                    text
                );

            }

        }


        if (
            text.includes("جلد")
        ) {

            setFieldError(
                "paperTazkiraVolume",
                text
            );

        }


        if (
            text.includes("صفحه")
        ) {

            setFieldError(
                "paperTazkiraPage",
                text
            );

        }


        if (
            text.includes("ګڼه")
        ) {

            setFieldError(
                "paperTazkiraNumber",
                text
            );

        }


        if (
            text.includes("PDF")
        ) {

            setFieldError(
                "pdfCreationDate",
                text
            );

        }


        if (
            text.includes("اصلي ځای")
        ) {

            setFieldError(
                "originalDistrict",
                text
            );

        }


        if (
            text.includes("فعلي ځای")
        ) {

            setFieldError(
                "currentDistrict",
                text
            );

        }


        if (
            text.includes("دلګی")
        ) {

            setFieldError(
                "groupLeader",
                text
            );

        }

    });

}


// ==========================================
// Duplicate Form Number Check
// ==========================================

async function isDuplicateFormNumber(
    value,
    currentRecordId = ""
) {

    const normalized =
        cleanText(value);


    if (!normalized) {
        return false;
    }


    const recordsRef =
        collection(
            db,
            RECORDS_COLLECTION
        );


    const duplicateQuery =
        query(
            recordsRef,
            where(
                "formNumber",
                "==",
                normalized
            )
        );


    const snapshot =
        await getDocs(
            duplicateQuery
        );


    if (snapshot.empty) {
        return false;
    }


    const currentId =
        cleanText(
            currentRecordId
        );


    return snapshot.docs.some(
        documentSnapshot =>
            documentSnapshot.id !==
            currentId
    );

}


// ==========================================
// Build Firestore Record
// ==========================================

function buildFirestoreRecord(
    data,
    existing = {}
) {

    const timestamp =
        serverTimestamp();


    return {

        formNumber:
            data.formNumber,

        category:
            data.category,


        // ==================================
        // Four English-name fields
        // ==================================

        firstName:
            data.firstName,

        lastName:
            data.lastName,

        fatherName:
            data.fatherName,

        grandfatherName:
            data.grandfatherName,


        // ==================================
        // Person Object
        // Kept synchronized for search/edit
        // ==================================

        person: {

            firstName:
                data.firstName,

            lastName:
                data.lastName,

            fatherName:
                data.fatherName,

            grandfatherName:
                data.grandfatherName,

            birthDate:
                data.birthDate,

            age:
                data.age,

            phone:
                data.phone,

            tazkiraType:
                data.tazkiraType,

            tazkira:
                data.tazkiraType ===
                TAZKIRA_TYPES.ELECTRONIC
                    ? data.electronicTazkiraNumber
                    : ""

        },


        // ==================================
        // Other Personal Information
        // ==================================

        birthDate:
            data.birthDate,

        age:
            data.age,

        phone:
            data.phone,


        // ==================================
        // Tazkira
        // ==================================

        tazkiraType:
            data.tazkiraType,


        tazkira:
            data.tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? data.electronicTazkiraNumber
                : "",


        electronicTazkiraNumber:
            data.tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? data.electronicTazkiraNumber
                : "",


        tazkiraDisplay:
            data.tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? data.electronicTazkiraNumber
                : `${data.paperTazkiraVolume}-${data.paperTazkiraPage}-${data.paperTazkiraNumber}`,


        tazkiraSearchKey:
            data.tazkiraType ===
            TAZKIRA_TYPES.ELECTRONIC
                ? data.electronicTazkiraNumber
                : [
                    data.paperTazkiraVolume,
                    data.paperTazkiraPage,
                    data.paperTazkiraNumber
                ].join("-"),


        tazkiraDetails: {

            type:
                data.tazkiraType,


            electronicNumber:
                data.tazkiraType ===
                TAZKIRA_TYPES.ELECTRONIC
                    ? data.electronicTazkiraNumber
                    : "",


            paper:
                data.tazkiraType ===
                TAZKIRA_TYPES.PAPER
                    ? {

                        volume:
                            data.paperTazkiraVolume,

                        page:
                            data.paperTazkiraPage,

                        number:
                            data.paperTazkiraNumber

                    }
                    : {

                        volume: "",
                        page: "",
                        number: ""

                    }

        },


        // ==================================
        // Locations
        // ==================================

        originalLocation:
            data.originalLocation,

        currentLocation:
            data.currentLocation,


        // ==================================
        // Work Information
        // ==================================

        currentJob:
            data.currentJob,

        groupLeader:
            data.groupLeader,

        jihadiHistory:
            data.jihadiHistory,


        // ==================================
        // PDF
        // ==================================

        pdfCreationDate:
            data.pdfCreationDate,


        // ==================================
        // States
        // ==================================

        fieldState:
            data.fieldState || {},

        visibilityState:
            data.visibilityState || {},


        // ==================================
        // Server Information
        // ==================================

        updatedAt:
            timestamp,


        createdAt:
            existing.createdAt ||
            timestamp

    };

}


// ==========================================
// Register New Person
// ==========================================

async function registerPerson(
    data
) {

    try {

        const duplicate =
            await isDuplicateFormNumber(
                data.formNumber
            );


        if (duplicate) {

            return {

                success: false,

                errors: [
                    "دغه فورمي نمبر مخکې ثبت شوی دی."
                ],

                message:
                    "دغه فورمي نمبر مخکې ثبت شوی دی."

            };

        }


        const recordsRef =
            collection(
                db,
                RECORDS_COLLECTION
            );


        const record =
            buildFirestoreRecord(
                data
            );


        const documentReference =
            await addDoc(
                recordsRef,
                record
            );


        return {

            success: true,

            id:
                documentReference.id,

            message:
                "فورمه په بریالیتوب آنلاین ثبت شوه."

        };

    } catch (error) {

        console.error(
            "Register Firestore Error:",
            error
        );


        return {

            success: false,

            errors: [],

            message:
                getFirestoreErrorMessage(
                    error
                )

        };

    }

}


// ==========================================
// Update Existing Registration
// ==========================================

async function updateRegistration(
    recordId,
    data
) {

    const id =
        cleanText(recordId);


    if (!id) {

        return {

            success: false,

            errors: [
                "د ثبت ID موجود نه دی."
            ],

            message:
                "د ثبت ID موجود نه دی."

        };

    }


    try {

        const recordReference =
            doc(
                db,
                RECORDS_COLLECTION,
                id
            );


        const currentSnapshot =
            await getDoc(
                recordReference
            );


        if (!currentSnapshot.exists()) {

            return {

                success: false,

                errors: [
                    "ثبت شوی معلومات پیدا نه شول."
                ],

                message:
                    "ثبت شوی معلومات پیدا نه شول."

            };

        }


        const duplicate =
            await isDuplicateFormNumber(
                data.formNumber,
                id
            );


        if (duplicate) {

            return {

                success: false,

                errors: [
                    "دغه فورمي نمبر د بل ثبت لپاره کارول شوی دی."
                ],

                message:
                    "دغه فورمي نمبر د بل ثبت لپاره کارول شوی دی."

            };

        }


        const existing =
            currentSnapshot.data() || {};


        const updatedRecord =
            buildFirestoreRecord(
                data,
                existing
            );


        await updateDoc(
            recordReference,
            updatedRecord
        );


        return {

            success: true,

            id,

            message:
                "معلومات په بریالیتوب آنلاین نوي شول."

        };

    } catch (error) {

        console.error(
            "Update Firestore Error:",
            error
        );


        return {

            success: false,

            errors: [],

            message:
                getFirestoreErrorMessage(
                    error
                )

        };

    }

}


// ==========================================
// Firestore Error Message
// ==========================================

function getFirestoreErrorMessage(
    error
) {

    if (!error) {

        return "د آنلاین ثبت پر مهال نامعلومه ستونزه رامنځته شوه.";

    }


    const code =
        cleanText(
            error.code
        );


    if (
        code ===
        "permission-denied"
    ) {

        return (
            "Firebase اجازه ورنه کړه. " +
            "د Firestore Security Rules او د کارونکي اجازه وګورئ."
        );

    }


    if (
        code ===
        "unavailable"
    ) {

        return (
            "Firebase موقتي آنلاین نه دی. " +
            "انټرنېټ وګورئ او بیا هڅه وکړئ."
        );

    }


    if (
        code ===
        "failed-precondition"
    ) {

        return (
            "د Firebase د Firestore تنظیماتو کې ستونزه ده."
        );

    }


    if (
        code ===
        "unauthenticated"
    ) {

        return (
            "ستاسې د ننوتلو حالت ختم شوی. " +
            "مهرباني وکړئ بیا Login وکړئ."
        );

    }


    return (
        "د Firebase/Firestore سره د اړیکې پر مهال ستونزه رامنځته شوه."
    );

}


// ==========================================
// Populate Form From Firestore Record
// ==========================================

function populateFormFromRecord(
    record
) {

    if (!record) {
        return;
    }


    formNumber.value =
        cleanText(
            record.formNumber
        );


    category.value =
        cleanText(
            record.category
        );


    const person =
        record.person || {};


    /*
     * First use the top-level fields.
     * If old records don't have them,
     * use person object.
     */

    firstName.value =
        cleanText(
            record.firstName ||
            person.firstName
        );


    lastName.value =
        cleanText(
            record.lastName ||
            person.lastName
        );


    fatherName.value =
        cleanText(
            record.fatherName ||
            person.fatherName
        );


    grandfatherName.value =
        cleanText(
            record.grandfatherName ||
            person.grandfatherName
        );


    birthDate.value =
        cleanText(
            record.birthDate ||
            person.birthDate
        );


    age.value =
        cleanText(
            record.age ||
            person.age
        );


    phone.value =
        cleanText(
            record.phone ||
            person.phone
        );


    // ==================================
    // Locations
    // ==================================

    const original =
        record.originalLocation ||
        {};


    originalProvince.value =
        cleanText(
            original.province
        );


    originalDistrict.value =
        cleanText(
            original.district
        );


    originalVillage.value =
        cleanText(
            original.village
        );


    const current =
        record.currentLocation ||
        {};


    currentProvince.value =
        cleanText(
            current.province
        );


    currentDistrict.value =
        cleanText(
            current.district
        );


    currentVillage.value =
        cleanText(
            current.village
        );


    // ==================================
    // Work
    // ==================================

    currentJob.value =
        cleanText(
            record.currentJob
        );


    groupLeader.value =
        cleanText(
            record.groupLeader
        );


    jihadiHistory.value =
        cleanText(
            record.jihadiHistory
        );


    pdfCreationDate.value =
        cleanText(
            record.pdfCreationDate
        );


    // ==================================
    // Tazkira
    // ==================================

    const tType =
        cleanText(
            record.tazkiraType ||
            person.tazkiraType ||
            record.tazkiraDetails?.type
        );


    if (
        tType ===
        TAZKIRA_TYPES.PAPER
    ) {

        setTazkiraMode(
            TAZKIRA_TYPES.PAPER
        );


        paperTazkiraVolume.value =
            cleanText(
                record.tazkiraDetails
                    ?.paper
                    ?.volume
            );


        paperTazkiraPage.value =
            cleanText(
                record.tazkiraDetails
                    ?.paper
                    ?.page
            );


        paperTazkiraNumber.value =
            cleanText(
                record.tazkiraDetails
                    ?.paper
                    ?.number
            );

    } else {

        setTazkiraMode(
            TAZKIRA_TYPES.ELECTRONIC
        );


        const electronicNumber =
            cleanText(

                record.tazkiraSearchKey ||

                record.tazkiraDisplay ||

                record.electronicTazkiraNumber ||

                record.tazkira ||

                person.tazkira ||

                record.tazkiraDetails
                    ?.electronicNumber

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

async function loadRecordForEdit(
    recordId
) {

    const id =
        cleanText(recordId);


    if (!id) {
        return;
    }


    loadingRecord =
        true;


    try {

        const recordReference =
            doc(
                db,
                RECORDS_COLLECTION,
                id
            );


        const snapshot =
            await getDoc(
                recordReference
            );


        if (!snapshot.exists()) {

            showMessage(
                "د edit لپاره ثبت شوی معلومات پیدا نه شو.",
                "danger"
            );

            return;

        }


        const record =
            snapshot.data() || {};


        populateFormFromRecord(
            record
        );


        recordIdInput.value =
            id;


        editModeInput.value =
            "1";


        saveBtn.textContent =
            "💾 بدلونونه خوندي کړئ";


        showMessage(
            "د edit حالت فعال شو.",
            "success"
        );

    } catch (error) {

        console.error(
            "Load Record Error:",
            error
        );


        showMessage(
            getFirestoreErrorMessage(
                error
            ),
            "danger"
        );

    } finally {

        loadingRecord =
            false;

    }

}


// ==========================================
// Input Events
// ==========================================

birthDate.addEventListener(
    "input",
    () => {

        birthDate.value =
            formatBirthDateInput(
                birthDate.value
            );

    }
);


tazkira.addEventListener(
    "input",
    () => {

        tazkira.value =
            formatElectronicTazkiraInput(
                tazkira.value
            );

    }
);


// ==========================================
// Tazkira Type Controls
// ==========================================

tazkiraTypeElectronic.addEventListener(
    "change",
    () => {

        if (
            tazkiraTypeElectronic.checked
        ) {

            setTazkiraMode(
                TAZKIRA_TYPES.ELECTRONIC
            );

        }

    }
);


tazkiraTypePaper.addEventListener(
    "change",
    () => {

        if (
            tazkiraTypePaper.checked
        ) {

            setTazkiraMode(
                TAZKIRA_TYPES.PAPER
            );

        }

    }
);


// ==========================================
// Category Controls
// ==========================================

category.addEventListener(
    "change",
    updateJihadiHistory
);


// ==========================================
// Submit Registration
// ==========================================

form.addEventListener(
    "submit",
    async event => {

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


        saveBtn.disabled =
            true;

        saveBtn.textContent =
            "⏳ ثبتېږي...";


        try {

            const data =
                collectFormData();


            // ==================================
            // Main Validation
            // ==================================

            const validation =
                validateRegistration(
                    data
                );


            if (
                !validation.valid
            ) {

                const errors =
                    extractValidationErrors(
                        validation
                    );


                mapValidationToFields(
                    errors
                );


                showMessage(
                    errors.join(" "),
                    "danger"
                );

                return;

            }


            // ==================================
            // Electronic Tazkira Validation
            // ==================================

            if (
                data.tazkiraType ===
                TAZKIRA_TYPES.ELECTRONIC
            ) {

                if (
                    !ELECTRONIC_TAZKIRA_PATTERN.test(
                        data.electronicTazkiraNumber
                    )
                ) {

                    const message =
                        "د برقي تذکرې بڼه باید 0000-0000-00000 وي.";


                    showMessage(
                        message,
                        "danger"
                    );


                    setFieldError(
                        "tazkira",
                        message
                    );


                    return;

                }

            }


            // ==================================
            // Paper Tazkira Validation
            // ==================================

            if (
                data.tazkiraType ===
                TAZKIRA_TYPES.PAPER
            ) {

                const volume =
                    cleanText(
                        data.paperTazkiraVolume
                    ).replace(
                        /[^0-9]/g,
                        ""
                    );


                const page =
                    cleanText(
                        data.paperTazkiraPage
                    ).replace(
                        /[^0-9]/g,
                        ""
                    );


                const number =
                    cleanText(
                        data.paperTazkiraNumber
                    ).replace(
                        /[^0-9]/g,
                        ""
                    );


                if (
                    !volume ||
                    !page ||
                    !number
                ) {

                    const message =
                        "د کاغذي تذکرې لپاره جلد، صفحه او ګڼه ټول اجباري دي.";


                    showMessage(
                        message,
                        "danger"
                    );


                    return;

                }


                if (
                    !NUMERIC_ONLY_PATTERN.test(
                        volume
                    ) ||
                    !NUMERIC_ONLY_PATTERN.test(
                        page
                    ) ||
                    !NUMERIC_ONLY_PATTERN.test(
                        number
                    )
                ) {

                    const message =
                        "د کاغذي تذکرې ټولې درې خانې باید یوازې عددونه ولري.";


                    showMessage(
                        message,
                        "danger"
                    );


                    return;

                }


                data.paperTazkiraVolume =
                    volume;

                data.paperTazkiraPage =
                    page;

                data.paperTazkiraNumber =
                    number;

            }


            // ==================================
            // Register / Update
            // ==================================

            let result;


            if (
                editModeInput.value ===
                    "1" &&
                cleanText(
                    recordIdInput.value
                )
            ) {

                result =
                    await updateRegistration(
                        recordIdInput.value,
                        data
                    );

            } else {

                result =
                    await registerPerson(
                        data
                    );

            }


            // ==================================
            // Result
            // ==================================

            if (!result.success) {

                const errors =
                    Array.isArray(
                        result.errors
                    )
                        ? result.errors
                        : [];


                if (
                    errors.length
                ) {

                    mapValidationToFields(
                        errors
                    );


                    showMessage(
                        errors.join(" "),
                        "danger"
                    );

                } else {

                    showMessage(
                        result.message ||
                        "فورمه ثبت نه شوه.",
                        "danger"
                    );

                }


                return;

            }


            // ==================================
            // Success
            // ==================================

            showMessage(
                result.message ||
                "فورمه په بریالیتوب ثبت شوه.",
                "success"
            );


            form.reset();


            recordIdInput.value =
                "";


            editModeInput.value =
                "0";


            saveBtn.textContent =
                "💾 فورمه ثبت کړئ";


            setTazkiraMode(
                TAZKIRA_TYPES.ELECTRONIC
            );


            updateJihadiHistory();


            setTodayPdfDate();

        } catch (error) {

            console.error(
                "Register Page Error:",
                error
            );


            showMessage(
                getFirestoreErrorMessage(
                    error
                ),
                "danger"
            );

        } finally {

            saveBtn.disabled =
                false;


            if (
                editModeInput.value ===
                "1"
            ) {

                saveBtn.textContent =
                    "💾 بدلونونه خوندي کړئ";

            } else {

                saveBtn.textContent =
                    "💾 فورمه ثبت کړئ";

            }

        }

    }
);


// ==========================================
// Reset
// ==========================================

resetBtn.addEventListener(
    "click",
    () => {

        clearErrors();

        hideMessage();


        setTimeout(
            () => {

                updateJihadiHistory();

                setTazkiraMode(
                    TAZKIRA_TYPES.ELECTRONIC
                );

                setTodayPdfDate();

            },
            0
        );

    }
);


// ==========================================
// Set Today PDF Date
// ==========================================

function setTodayPdfDate() {

    if (
        pdfCreationDate.value
    ) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    pdfCreationDate.value =
        `${year}-${month}-${day}`;

}


// ==========================================
// Navigation
// ==========================================

dashboardBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "./dashboard.html";

    }
);


const dashboardMenuBtn =
    document.getElementById(
        "dashboardMenuBtn"
    );


const registerMenuBtn =
    document.getElementById(
        "registerMenuBtn"
    );


const searchMenuBtn =
    document.getElementById(
        "searchMenuBtn"
    );


const reportsMenuBtn =
    document.getElementById(
        "reportsMenuBtn"
    );


const adminMenuBtn =
    document.getElementById(
        "adminMenuBtn"
    );


const settingsMenuBtn =
    document.getElementById(
        "settingsMenuBtn"
    );


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


backBtn.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


refreshBtn.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


// ==========================================
// Logout
// ==========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        const button =
            logoutBtn;


        button.disabled =
            true;


        try {

            const result =
                await logoutUser();


            if (
                result &&
                result.success
            ) {

                window.location.href =
                    "./index.html";

                return;

            }


            button.disabled =
                false;


            showMessage(
                result?.message ||
                "له سیستم څخه وتل ناکام شول.",
                "danger"
            );

        } catch (error) {

            console.error(
                "Logout Error:",
                error
            );


            button.disabled =
                false;


            showMessage(
                "له سیستم څخه د وتلو پر مهال ستونزه رامنځته شوه.",
                "danger"
            );

        }

    }
);


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


        try {

            await initializeSettings();


            const params =
                new URLSearchParams(
                    window.location.search
                );


            const recordId =
                params.get(
                    "recordId"
                );


            if (recordId) {

                await loadRecordForEdit(
                    recordId
                );

            }

        } catch (error) {

            console.error(
                "Register Authentication Setup Error:",
                error
            );


            showMessage(
                "د سیستم د تنظیماتو د لوډ پر مهال ستونزه رامنځته شوه.",
                "danger"
            );

        }

    }
);


// ==========================================
// Initial Setup
// ==========================================

loadProvinces();

updateJihadiHistory();

setTazkiraMode(
    TAZKIRA_TYPES.ELECTRONIC
);

setTodayPdfDate();


// ==========================================
// End of register.js
// ==========================================