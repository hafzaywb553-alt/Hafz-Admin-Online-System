// ==========================================
// Hafz Admin Online System
// register.js
// Registration Engine
// ==========================================

import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    validateRegistration
} from "./validation.js";

import {
    createLocation
} from "./locations.js";

import {
    writeAudit,
    AUDIT_ACTIONS
} from "./audit.js";


// ==========================================
// Firestore Collection
// ==========================================

const RECORDS_COLLECTION = "records";


// ==========================================
// Generate Internal ID
// ==========================================

function generateInternalId() {

    const time = Date.now();

    const random =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return `REC-${time}-${random}`;
}


// ==========================================
// Clean Text
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


// ==========================================
// Prepare Location
// ==========================================

function prepareLocation(
    province,
    district,
    village
) {

    return createLocation(
        cleanText(province),
        cleanText(district),
        cleanText(village)
    );
}


// ==========================================
// Create Registration Data
// ==========================================

export function prepareRegistrationData(data = {}) {

    const registration = {

        formNumber:
            cleanText(data.formNumber),

        category:
            cleanText(data.category),

        firstName:
            cleanText(data.firstName),

        lastName:
            cleanText(data.lastName),

        fatherName:
            cleanText(data.fatherName),

        grandfatherName:
            cleanText(data.grandfatherName),

        birthDate:
            cleanText(data.birthDate),

        age:
            cleanText(data.age),

        tazkira:
            cleanText(data.tazkira),

        phone:
            cleanText(data.phone),

        originalLocation: {

            province:
                cleanText(
                    data.originalLocation?.province
                ),

            district:
                cleanText(
                    data.originalLocation?.district
                ),

            village:
                cleanText(
                    data.originalLocation?.village
                )
        },

        currentLocation: {

            province:
                cleanText(
                    data.currentLocation?.province
                ),

            district:
                cleanText(
                    data.currentLocation?.district
                ),

            village:
                cleanText(
                    data.currentLocation?.village
                )
        },

        currentJob:
            cleanText(data.currentJob),

        groupLeader:
            cleanText(data.groupLeader),

        jihadiHistory:
            cleanText(data.jihadiHistory),

        pdfCreationDate:
            cleanText(data.pdfCreationDate)

    };

    return registration;
}


// ==========================================
// Validate Locations
// ==========================================

function validateLocations(data) {

    const errors = [];


    const original =
        prepareLocation(
            data.originalLocation.province,
            data.originalLocation.district,
            data.originalLocation.village
        );


    if (!original.success) {

        errors.push(
            ...original.errors.map(
                error =>
                    `د اصلي ځای: ${error}`
            )
        );
    }


    const current =
        prepareLocation(
            data.currentLocation.province,
            data.currentLocation.district,
            data.currentLocation.village
        );


    if (!current.success) {

        errors.push(
            ...current.errors.map(
                error =>
                    `د فعلي ځای: ${error}`
            )
        );
    }


    return {
        valid: errors.length === 0,
        errors
    };
}


// ==========================================
// Validate Registration
// ==========================================

export function validateRegistrationData(data) {

    const registration =
        prepareRegistrationData(data);


    const errors = [];


    // --------------------------------------
    // Main validation
    // --------------------------------------

    const result =
        validateRegistration(
            registration
        );


    if (!result.valid) {

        errors.push(
            ...result.errors
        );
    }


    // --------------------------------------
    // Location validation
    // --------------------------------------

    const locations =
        validateLocations(
            registration
        );


    if (!locations.valid) {

        errors.push(
            ...locations.errors
        );
    }


    // --------------------------------------
    // PDF creation date
    // --------------------------------------

    if (!registration.pdfCreationDate) {

        errors.push(
            "د PDF د جوړېدو نېټه اجباري ده."
        );
    }


    return {

        valid:
            errors.length === 0,

        errors:

            [...new Set(errors)]

    };
}


// ==========================================
// Register Person
// ==========================================

export async function registerPerson(data = {}) {

    try {

        // --------------------------------------
        // Authentication
        // --------------------------------------

        const user =
            auth.currentUser;


        if (!user) {

            return {

                success: false,

                message:
                    "د ثبت لپاره لومړی Login وکړئ."

            };
        }


        // --------------------------------------
        // Prepare data
        // --------------------------------------

        const registration =
            prepareRegistrationData(data);


        // --------------------------------------
        // Validate
        // --------------------------------------

        const validation =
            validateRegistrationData(
                registration
            );


        if (!validation.valid) {

            return {

                success: false,

                message:
                    "د فورم معلومات سم نه دي.",

                errors:
                    validation.errors

            };
        }


        // --------------------------------------
        // Prepare Firestore document
        // --------------------------------------

        const internalId =
            generateInternalId();


        const record = {

            internalId,

            formNumber:
                registration.formNumber,

            category:
                registration.category,


            person: {

                firstName:
                    registration.firstName,

                lastName:
                    registration.lastName,

                fatherName:
                    registration.fatherName,

                grandfatherName:
                    registration.grandfatherName,

                birthDate:
                    registration.birthDate,

                age:
                    Number(
                        registration.age
                    ),

                tazkira:
                    registration.tazkira,

                phone:
                    registration.phone

            },


            originalLocation:
                registration.originalLocation,


            currentLocation:
                registration.currentLocation,


            currentJob:
                registration.currentJob,


            groupLeader:
                registration.groupLeader,


            jihadiHistory:
                registration.jihadiHistory,


            pdfCreationDate:
                registration.pdfCreationDate,


            // ----------------------------------
            // Status
            // ----------------------------------

            status:
                "active",

            fraudulent:
                false,


            // ----------------------------------
            // Creator
            // ----------------------------------

            createdBy: {

                uid:
                    user.uid,

                email:
                    user.email || ""

            },


            // ----------------------------------
            // Timestamps
            // ----------------------------------

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        // --------------------------------------
        // Save to Firestore
        // --------------------------------------

        const recordRef =
            await addDoc(
                collection(
                    db,
                    RECORDS_COLLECTION
                ),
                record
            );


        // --------------------------------------
        // Audit
        // --------------------------------------

        await writeAudit(

            AUDIT_ACTIONS.REGISTER,

            `نوی ثبت: ${registration.formNumber}`

        );


        // --------------------------------------
        // Success
        // --------------------------------------

        return {

            success: true,

            id:
                recordRef.id,

            internalId,

            message:
                "فورمه په بریالیتوب ثبت شوه."

        };


    } catch (error) {

        console.error(
            "Registration Error:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "فورمه ثبت نه شوه."

        };
    }
}


// ==========================================
// Update Registration
// ==========================================
//
// دا برخه به وروسته یوازې د Admin لپاره
// د امنیتي اجازه‌لیکونو سره استعمالېږي.
//

export function getRegistrationCollectionName() {

    return RECORDS_COLLECTION;

}


// ==========================================
// Export
// ==========================================

export default {

    registerPerson,

    validateRegistrationData,

    prepareRegistrationData,

    getRegistrationCollectionName

};