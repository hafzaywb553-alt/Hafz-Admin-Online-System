// ==========================================
// Hafz Admin Online System
// locations.js
// Location Engine
// ==========================================

export const PROVINCES = [
    "بدخشان",
    "بادغیس",
    "بغلان",
    "بلخ",
    "بامیان",
    "دایکندي",
    "فراه",
    "فاریاب",
    "غزني",
    "غور",
    "هلمند",
    "هرات",
    "جوزجان",
    "کابل",
    "کندهار",
    "کاپیسا",
    "خوست",
    "کنړ",
    "کندز",
    "لغمان",
    "لوګر",
    "میدان وردګ",
    "ننګرهار",
    "نیمروز",
    "نورستان",
    "پکتیا",
    "پکتیکا",
    "پنجشیر",
    "پروان",
    "سمنګان",
    "سرپل",
    "تخار",
    "ارزګان",
    "زابل"
];


// ==========================================
// Get all provinces
// ==========================================

export function getProvinces() {
    return [...PROVINCES];
}


// ==========================================
// Validate province
// ==========================================

export function isValidProvince(province) {

    if (!province) {
        return false;
    }

    return PROVINCES.includes(
        String(province).trim()
    );
}


// ==========================================
// Validate district
// ولسوالۍ په لاس لیکل کېږي
// ==========================================

export function validateDistrict(district) {

    if (district === null || district === undefined) {
        return {
            valid: false,
            message: "د ولسوالۍ نوم اجباري دی."
        };
    }

    const value = String(district).trim();

    if (!value) {
        return {
            valid: false,
            message: "د ولسوالۍ نوم اجباري دی."
        };
    }

    if (value.length > 150) {
        return {
            valid: false,
            message: "د ولسوالۍ نوم ډېر اوږد دی."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


// ==========================================
// Validate village
// کلی په لاس لیکل کېږي
// ==========================================

export function validateVillage(village) {

    if (village === null || village === undefined) {
        return {
            valid: false,
            message: "د کلي نوم اجباري دی."
        };
    }

    const value = String(village).trim();

    if (!value) {
        return {
            valid: false,
            message: "د کلي نوم اجباري دی."
        };
    }

    if (value.length > 150) {
        return {
            valid: false,
            message: "د کلي نوم ډېر اوږد دی."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


// ==========================================
// Validate complete location
// ==========================================

export function validateLocationData({
    province,
    district,
    village
}) {

    const errors = [];


    // ولایت
    if (!isValidProvince(province)) {
        errors.push("سم ولایت انتخاب کړئ.");
    }


    // ولسوالۍ
    const districtResult =
        validateDistrict(district);

    if (!districtResult.valid) {
        errors.push(districtResult.message);
    }


    // کلی
    const villageResult =
        validateVillage(village);

    if (!villageResult.valid) {
        errors.push(villageResult.message);
    }


    return {
        valid: errors.length === 0,
        errors
    };
}


// ==========================================
// Create location
// ==========================================

export function createLocation(
    province,
    district,
    village
) {

    const validation =
        validateLocationData({
            province,
            district,
            village
        });


    if (!validation.valid) {

        return {
            success: false,
            errors: validation.errors
        };

    }


    return {

        success: true,

        location: {

            province:
                String(province).trim(),

            district:
                String(district).trim(),

            village:
                String(village).trim()

        }

    };
}