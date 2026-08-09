// ==========================================
// Hafz Admin Online System
// validation.js
// Central Validation Engine
// ==========================================

/**
 * د تشو ارزښتونو معلومول
 */
export function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    );
}


/**
 * د اجباري خانې اعتبار
 */
export function validateRequired(value, fieldName = "دا خانه") {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: `${fieldName} اجباري ده.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * یوازې د ارقامو اعتبار
 */
export function validateNumbersOnly(value, fieldName = "دا خانه") {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: `${fieldName} خالي ده.`
        };
    }

    if (!/^[0-9]+$/.test(String(value).trim())) {
        return {
            valid: false,
            message: `${fieldName} کې یوازې ارقام اجازه لري.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * عمر
 * یوازې ارقام او د 1 څخه تر 150 پورې
 */
export function validateAge(value) {
    const numberResult = validateNumbersOnly(value, "عمر");

    if (!numberResult.valid) {
        return numberResult;
    }

    const age = Number(String(value).trim());

    if (!Number.isInteger(age)) {
        return {
            valid: false,
            message: "عمر باید بشپړ عدد وي."
        };
    }

    if (age < 1 || age > 150) {
        return {
            valid: false,
            message: "عمر باید له 1 څخه تر 150 کلونو پورې وي."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * د کره کمیسیون د فورمي نمبر
 * اجباري دی.
 */
export function validateFormNumber(value) {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: "د کره کمیسیون د فورمي نمبر داخلول اجباري دي."
        };
    }

    const formNumber = String(value).trim();

    if (formNumber.length < 1 || formNumber.length > 100) {
        return {
            valid: false,
            message: "د فورمي نمبر اوږدوالی ناسم دی."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * تذکره نمبر
 *
 * غیر اجباري دی.
 *
 * که داخل شي، باید دقیقاً داسې وي:
 * 0000-0000-00000
 */
export function validateTazkira(value) {
    if (isEmpty(value)) {
        return {
            valid: true,
            message: ""
        };
    }

    const tazkira = String(value).trim();

    const pattern = /^[0-9]{4}-[0-9]{4}-[0-9]{5}$/;

    if (!pattern.test(tazkira)) {
        return {
            valid: false,
            message: "د تذکرې نمبر بڼه باید داسې وي: 0000-0000-00000"
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * نوم
 * اجباري
 */
export function validateName(value, fieldName = "نوم") {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: `${fieldName} اجباري ده.`
        };
    }

    const text = String(value).trim();

    if (text.length < 2) {
        return {
            valid: false,
            message: `${fieldName} لږ تر لږه دوه توري ولري.`
        };
    }

    if (text.length > 100) {
        return {
            valid: false,
            message: `${fieldName} ډېر اوږد دی.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * اختیاري متن
 */
export function validateOptionalText(value, fieldName = "دا خانه") {
    if (isEmpty(value)) {
        return {
            valid: true,
            message: ""
        };
    }

    const text = String(value).trim();

    if (text.length > 200) {
        return {
            valid: false,
            message: `${fieldName} ډېر اوږد دی.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * جهادي سابقه
 *
 * د مجاهد کټګورۍ لپاره:
 * - اجباري
 * - حروف او ارقام دواړه اجازه لري
 *
 * د نورو کټګوریو لپاره باید خالي وي.
 */
export function validateJihadiHistory(category, history) {
    const selectedCategory = String(category || "").trim();
    const value = String(history || "").trim();

    if (selectedCategory === "مجاهد") {
        if (!value) {
            return {
                valid: false,
                message: "د مجاهد لپاره جهادي سابقه اجباري ده."
            };
        }

        if (value.length > 1000) {
            return {
                valid: false,
                message: "جهادي سابقه ډېره اوږده ده."
            };
        }

        return {
            valid: true,
            message: ""
        };
    }

    if (value !== "") {
        return {
            valid: false,
            message: "جهادي سابقه یوازې د مجاهد کټګورۍ لپاره اجازه لري."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * د کټګورۍ اعتبار
 */
export function validateCategory(value) {
    const allowedCategories = [
        "مجاهد",
        "همکار",
        "د شهید د کورنۍ غړی",
        "بعدالفتح"
    ];

    if (isEmpty(value)) {
        return {
            valid: false,
            message: "کټګوري انتخابول اجباري دي."
        };
    }

    if (!allowedCategories.includes(String(value).trim())) {
        return {
            valid: false,
            message: "د کټګورۍ انتخاب ناسم دی."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * اړوند دلګی مشر
 * اجباري
 */
export function validateGroupLeader(value) {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: "د اړوند دلګی مشر نوم او تخلص اجباري دی."
        };
    }

    const text = String(value).trim();

    if (text.length < 2) {
        return {
            valid: false,
            message: "د اړوند دلګی مشر نوم او تخلص بشپړ ولیکئ."
        };
    }

    if (text.length > 150) {
        return {
            valid: false,
            message: "د اړوند دلګی مشر معلومات ډېر اوږد دي."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * د ولایت / ولسوالۍ / کلي د ځای اعتبار
 */
export function validateLocation(location, locationName = "ځای") {
    if (!location || typeof location !== "object") {
        return {
            valid: false,
            message: `${locationName} معلومات نشته.`
        };
    }

    const province = String(location.province || "").trim();
    const district = String(location.district || "").trim();
    const village = String(location.village || "").trim();

    if (!province) {
        return {
            valid: false,
            message: `${locationName} کې ولایت اجباري دی.`
        };
    }

    if (!district) {
        return {
            valid: false,
            message: `${locationName} کې ولسوالۍ اجباري ده.`
        };
    }

    if (!village) {
        return {
            valid: false,
            message: `${locationName} کې کلی اجباري دی.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * ==========================================
 * د عکس اعتبار
 * ==========================================
 *
 * د هر عکس اعظمي اندازه:
 * 1MB
 *
 * 1MB = 1,048,576 bytes
 */
export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;


/**
 * د اجازه لرونکو عکسونو MIME Types
 */
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/**
 * د عکس فایل اعتبار
 */
export function validateImageFile(
    file,
    fieldName = "عکس"
) {
    if (!file) {
        return {
            valid: true,
            message: ""
        };
    }

    if (!(file instanceof File)) {
        return {
            valid: false,
            message: `${fieldName} ناسم فایل دی.`
        };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            message: `${fieldName} باید JPG، PNG یا WEBP وي.`
        };
    }

    if (file.size <= 0) {
        return {
            valid: false,
            message: `${fieldName} خالي یا خراب فایل دی.`
        };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return {
            valid: false,
            message: `${fieldName} باید تر 1MB زیات نه وي.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/**
 * د ټول ثبت فورم مرکزي اعتبار
 */
export function validateRegistration(data = {}) {
    const errors = [];


    // فورمي نمبر
    const formNumber = validateFormNumber(data.formNumber);

    if (!formNumber.valid) {
        errors.push(formNumber.message);
    }


    // تذکره
    const tazkira = validateTazkira(data.tazkira);

    if (!tazkira.valid) {
        errors.push(tazkira.message);
    }


    // نوم
    const firstName = validateName(
        data.firstName,
        "نوم"
    );

    if (!firstName.valid) {
        errors.push(firstName.message);
    }


    // تخلص اختیاري
    const lastName = validateOptionalText(
        data.lastName,
        "تخلص"
    );

    if (!lastName.valid) {
        errors.push(lastName.message);
    }


    // د پلار نوم
    const fatherName = validateName(
        data.fatherName,
        "د پلار نوم"
    );

    if (!fatherName.valid) {
        errors.push(fatherName.message);
    }


    // د نیکه نوم
    const grandfatherName = validateName(
        data.grandfatherName,
        "د نیکه نوم"
    );

    if (!grandfatherName.valid) {
        errors.push(grandfatherName.message);
    }


    // عمر
    const age = validateAge(data.age);

    if (!age.valid) {
        errors.push(age.message);
    }


    // اصلي ځای
    const originalLocation = validateLocation(
        data.originalLocation,
        "اصلي ځای"
    );

    if (!originalLocation.valid) {
        errors.push(originalLocation.message);
    }


    // فعلي ځای
    const currentLocation = validateLocation(
        data.currentLocation,
        "فعلي ځای"
    );

    if (!currentLocation.valid) {
        errors.push(currentLocation.message);
    }


    // اوسنی دنده اختیاري
    const job = validateOptionalText(
        data.currentJob,
        "اوسنی دنده"
    );

    if (!job.valid) {
        errors.push(job.message);
    }


    // کټګوري
    const category = validateCategory(
        data.category
    );

    if (!category.valid) {
        errors.push(category.message);
    }


    // جهادي سابقه
    const jihadiHistory = validateJihadiHistory(
        data.category,
        data.jihadiHistory
    );

    if (!jihadiHistory.valid) {
        errors.push(jihadiHistory.message);
    }


    // اړوند دلګی مشر
    const groupLeader = validateGroupLeader(
        data.groupLeader
    );

    if (!groupLeader.valid) {
        errors.push(groupLeader.message);
    }


    // عکس
    if (data.imageFile) {
        const image = validateImageFile(
            data.imageFile,
            "عکس"
        );

        if (!image.valid) {
            errors.push(image.message);
        }
    }


    // که څو عکسونه موجود وي
    if (Array.isArray(data.imageFiles)) {
        data.imageFiles.forEach((file, index) => {
            const image = validateImageFile(
                file,
                `د ${index + 1}م عکس`
            );

            if (!image.valid) {
                errors.push(image.message);
            }
        });
    }


    return {
        valid: errors.length === 0,
        errors
    };
}


/**
 * د فورم نمبر د لټون اعتبار
 */
export function validateSearchFormNumber(value) {
    if (isEmpty(value)) {
        return {
            valid: false,
            message: "د کره کمیسیون د فورمي نمبر ولیکئ."
        };
    }

    const formNumber = String(value).trim();

    if (formNumber.length > 100) {
        return {
            valid: false,
            message: "د فورمي نمبر اوږدوالی ناسم دی."
        };
    }

    return {
        valid: true,
        message: ""
    };
}