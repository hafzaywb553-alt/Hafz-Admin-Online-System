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


// ==========================================
// Firestore Collection
// ==========================================

const RECORDS_COLLECTION = "records";


// ==========================================
// Clean Value
// ==========================================

function cleanValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


// ==========================================
// Search by Form Number
// ==========================================

async function searchByFormNumber(formNumber) {

    const value = cleanValue(formNumber);

    if (!value) {
        return null;
    }

    const recordsRef =
        collection(
            db,
            RECORDS_COLLECTION
        );

    const q = query(
        recordsRef,
        where(
            "formNumber",
            "==",
            value
        ),
        limit(1)
    );

    const snapshot =
        await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const document =
        snapshot.docs[0];

    return {
        id: document.id,
        ...document.data()
    };
}


// ==========================================
// Search by Tazkira
// ==========================================

async function searchByTazkira(tazkira) {

    const value = cleanValue(tazkira);

    if (!value) {
        return null;
    }

    const recordsRef =
        collection(
            db,
            RECORDS_COLLECTION
        );

    const q = query(
        recordsRef,
        where(
            "person.tazkira",
            "==",
            value
        ),
        limit(1)
    );

    const snapshot =
        await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const document =
        snapshot.docs[0];

    return {
        id: document.id,
        ...document.data()
    };
}


// ==========================================
// Search Registration
// ==========================================

export async function searchRegistration({
    formNumber = "",
    tazkira = ""
} = {}) {

    try {

        if (!auth.currentUser) {

            return {
                success: false,
                message:
                    "د لټون لپاره لومړی Login وکړئ."
            };
        }


        const cleanFormNumber =
            cleanValue(formNumber);

        const cleanTazkira =
            cleanValue(tazkira);


        // --------------------------------------
        // باید لږ تر لږه یوه برخه موجوده وي
        // --------------------------------------

        if (
            !cleanFormNumber &&
            !cleanTazkira
        ) {

            return {
                success: false,
                message:
                    "د فورمي نمبر یا تذکرې نمبر ولیکئ."
            };
        }


        // --------------------------------------
        // د فورمي نمبر اعتبار
        // --------------------------------------

        if (cleanFormNumber) {

            const validation =
                validateSearchFormNumber(
                    cleanFormNumber
                );

            if (!validation.valid) {

                return {
                    success: false,
                    message:
                        validation.message
                };
            }
        }


        // --------------------------------------
        // د تذکرې اعتبار
        // --------------------------------------

        if (cleanTazkira) {

            const validation =
                validateTazkira(
                    cleanTazkira
                );

            if (!validation.valid) {

                return {
                    success: false,
                    message:
                        validation.message
                };
            }
        }


        // --------------------------------------
        // Search by Form Number
        // --------------------------------------

        let record = null;

        if (cleanFormNumber) {

            record =
                await searchByFormNumber(
                    cleanFormNumber
                );
        }


        // --------------------------------------
        // If not found, search by Tazkira
        // --------------------------------------

        if (
            !record &&
            cleanTazkira
        ) {

            record =
                await searchByTazkira(
                    cleanTazkira
                );
        }


        // --------------------------------------
        // Not found
        // --------------------------------------

        if (!record) {

            await writeAudit(
                AUDIT_ACTIONS.SEARCH,
                `لټون: ${cleanFormNumber || cleanTazkira}`
            );

            return {

                success: false,

                found: false,

                message:
                    "د ورکړل شوو معلوماتو له مخې فورمه پیدا نه شوه."

            };
        }


        // --------------------------------------
        // Fraud status
        // --------------------------------------

        const fraudulent =
            record.fraudulent === true;


        // --------------------------------------
        // Audit
        // --------------------------------------

        await writeAudit(
            AUDIT_ACTIONS.SEARCH,
            `فورمه پیدا شوه: ${record.formNumber || ""}`
        );


        // --------------------------------------
        // Result
        // --------------------------------------

        return {

            success: true,

            found: true,

            fraudulent,

            message:
                fraudulent
                    ? "دا فورمه جعلي ده."
                    : "فورمه پیدا شوه.",

            record

        };


    } catch (error) {

        console.error(
            "Search Error:",
            error
        );


        return {

            success: false,

            found: false,

            message:
                error.message ||
                "د لټون پر مهال ستونزه رامنځته شوه."

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
// Get Record Person Information
// ==========================================

export function getPersonInfo(record) {

    if (!record) {
        return null;
    }

    return {

        firstName:
            record.person?.firstName || "",

        lastName:
            record.person?.lastName || "",

        fatherName:
            record.person?.fatherName || "",

        grandfatherName:
            record.person?.grandfatherName || "",

        birthDate:
            record.person?.birthDate || "",

        age:
            record.person?.age ?? "",

        tazkira:
            record.person?.tazkira || "",

        phone:
            record.person?.phone || ""

    };
}


// ==========================================
// Get Location Information
// ==========================================

export function getLocationInfo(record) {

    if (!record) {
        return null;
    }

    return {

        original:
            record.originalLocation || {
                province: "",
                district: "",
                village: ""
            },

        current:
            record.currentLocation || {
                province: "",
                district: "",
                village: ""
            }

    };
}