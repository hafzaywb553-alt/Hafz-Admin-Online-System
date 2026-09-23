// ==========================================
// Hafz Admin Online System
// pdf.js
// PDF / Print Engine
// ==========================================


// ==========================================
// Safe Text
// ==========================================

function safeText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}


// ==========================================
// Escape HTML
// ==========================================

function escapeHtml(value) {

    return safeText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// Get Person Data
// ==========================================

function getPerson(record) {

    return record?.person || {};
}


// ==========================================
// Get Location
// ==========================================

function locationText(location) {

    if (!location) {
        return "";
    }

    const province =
        safeText(location.province);

    const district =
        safeText(location.district);

    const village =
        safeText(location.village);


    return [
        province,
        district,
        village
    ]
        .filter(Boolean)
        .join(" - ");
}


// ==========================================
// Create PDF HTML
// ==========================================

export function createPDFContent(record) {

    if (!record) {

        throw new Error(
            "د PDF لپاره معلومات موجود نه دي."
        );
    }


    const person =
        getPerson(record);


    const originalLocation =
        locationText(
            record.originalLocation
        );


    const currentLocation =
        locationText(
            record.currentLocation
        );


    const fraudText =
        record.fraudulent === true
            ? "دا فورمه جعلي ده"
            : "اصلي فورمه";


    const fraudClass =
        record.fraudulent === true
            ? "fraud"
            : "valid";


    return `
<!DOCTYPE html>

<html lang="ps" dir="rtl">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>
د فورم معلومات - ${escapeHtml(record.formNumber)}
</title>

<style>

@page {
    size: A4;
    margin: 15mm;
}

* {
    box-sizing: border-box;
}

body {

    margin: 0;

    padding: 0;

    direction: rtl;

    font-family:
        "Noto Naskh Arabic",
        Tahoma,
        Arial,
        sans-serif;

    color: #111;

    background: white;

    line-height: 1.8;
}

.page {

    width: 100%;

    max-width: 190mm;

    margin: 0 auto;

}

.header {

    text-align: center;

    border-bottom:
        2px solid #222;

    padding-bottom: 12px;

    margin-bottom: 18px;
}

.system-name {

    font-size: 22px;

    font-weight: 800;

    margin-bottom: 5px;
}

.document-title {

    font-size: 18px;

    font-weight: 700;
}

.form-number {

    margin-top: 8px;

    font-size: 16px;

    font-weight: 700;
}

.status {

    margin: 15px 0;

    padding: 10px;

    text-align: center;

    border: 2px solid #222;

    font-weight: 800;
}

.status.valid {

    background: #f4f4f4;
}

.status.fraud {

    background: #eee;

    border: 2px solid #000;

    font-size: 18px;
}

.section {

    margin-top: 18px;

    page-break-inside: avoid;
}

.section-title {

    background: #eee;

    border: 1px solid #999;

    padding: 7px 10px;

    font-weight: 800;

    font-size: 16px;

    margin-bottom: 8px;
}

.info-table {

    width: 100%;

    border-collapse: collapse;

    margin-bottom: 10px;
}

.info-table td {

    border: 1px solid #999;

    padding: 7px 9px;

    vertical-align: top;
}

.label {

    width: 28%;

    font-weight: 700;

    background: #f7f7f7;
}

.footer {

    margin-top: 25px;

    padding-top: 10px;

    border-top: 1px solid #999;

    text-align: center;

    font-size: 12px;
}

</style>

</head>


<body>

<div class="page">


    <div class="header">

        <div class="system-name">
            د کره کمیسیون د فورمو د ثبت سیسټم
        </div>

        <div class="document-title">
            د تصفیوي فورمي معلومات
        </div>

        <div class="form-number">
            د فورمي نمبر:
            ${escapeHtml(record.formNumber)}
        </div>

    </div>


    <div class="status ${fraudClass}">
        ${escapeHtml(fraudText)}
    </div>


    <div class="section">

        <div class="section-title">
            د شخص معلومات
        </div>

        <table class="info-table">

            <tr>
                <td class="label">
                    د فورم ډول
                </td>

                <td>
                    ${escapeHtml(record.category)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    نوم
                </td>

                <td>
                    ${escapeHtml(person.firstName)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    تخلص
                </td>

                <td>
                    ${escapeHtml(person.lastName)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    د پلار نوم
                </td>

                <td>
                    ${escapeHtml(person.fatherName)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    د نیکه نوم
                </td>

                <td>
                    ${escapeHtml(person.grandfatherName)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    د زېږون نېټه
                </td>

                <td>
                    ${escapeHtml(person.birthDate)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    عمر
                </td>

                <td>
                    ${escapeHtml(person.age)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    د تذکرې نمبر
                </td>

                <td>
                    ${escapeHtml(person.tazkira)}
                </td>
            </tr>

            <tr>
                <td class="label">
                    د اړیکې شمېره
                </td>

                <td>
                    ${escapeHtml(person.phone)}
                </td>
            </tr>

        </table>

    </div>


    <div class="section">

        <div class="section-title">
            د اصلي ځای معلومات
        </div>

        <table class="info-table">

            <tr>

                <td class="label">
                    ولایت
                </td>

                <td>
                    ${escapeHtml(
                        record.originalLocation?.province
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    ولسوالۍ
                </td>

                <td>
                    ${escapeHtml(
                        record.originalLocation?.district
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    کلی
                </td>

                <td>
                    ${escapeHtml(
                        record.originalLocation?.village
                    )}
                </td>

            </tr>

        </table>

    </div>


    <div class="section">

        <div class="section-title">
            د فعلي ځای معلومات
        </div>

        <table class="info-table">

            <tr>

                <td class="label">
                    ولایت
                </td>

                <td>
                    ${escapeHtml(
                        record.currentLocation?.province
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    ولسوالۍ
                </td>

                <td>
                    ${escapeHtml(
                        record.currentLocation?.district
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    کلی
                </td>

                <td>
                    ${escapeHtml(
                        record.currentLocation?.village
                    )}
                </td>

            </tr>

        </table>

    </div>


    <div class="section">

        <div class="section-title">
            نور معلومات
        </div>

        <table class="info-table">

            <tr>

                <td class="label">
                    اوسنی دنده
                </td>

                <td>
                    ${escapeHtml(
                        record.currentJob
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    د ګروپ مشر نوم
                </td>

                <td>
                    ${escapeHtml(
                        record.groupLeader
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    جهادي سابقه
                </td>

                <td>
                    ${escapeHtml(
                        record.jihadiHistory
                    )}
                </td>

            </tr>

            <tr>

                <td class="label">
                    د PDF د جوړېدو نېټه
                </td>

                <td>
                    ${escapeHtml(
                        record.pdfCreationDate
                    )}
                </td>

            </tr>

        </table>

    </div>


    <div class="footer">

        <div>
            د کره کمیسیون د فورمو د ثبت سیسټم
        </div>

        <div>
            داخلي نمبر:
            ${escapeHtml(record.internalId)}
        </div>

    </div>


</div>

</body>

</html>
`;
}


// ==========================================
// Print / Save as PDF
// ==========================================

export function printRecordAsPDF(record) {

    try {

        const html =
            createPDFContent(record);


        const printWindow =
            window.open(
                "",
                "_blank",
                "width=900,height=700"
            );


        if (!printWindow) {

            return {

                success: false,

                message:
                    "د چاپ کړکۍ خلاصه نه شوه. د براوزر Popup اجازه فعاله کړئ."

            };
        }


        printWindow.document.open();

        printWindow.document.write(
            html
        );

        printWindow.document.close();


        printWindow.onload = () => {

            setTimeout(
                () => {

                    printWindow.focus();

                    printWindow.print();

                },
                500
            );

        };


        return {

            success: true,

            message:
                "د PDF چاپ کړکۍ خلاصه شوه."

        };


    } catch (error) {

        console.error(
            "PDF Error:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "PDF جوړ نه شو."

        };
    }
}


// ==========================================
// Alias
// ==========================================

export const generatePDF =
    printRecordAsPDF;


// ==========================================
// Export PDF Data
// ==========================================

export function getPDFRecordSummary(record) {

    if (!record) {
        return null;
    }


    return {

        formNumber:
            safeText(
                record.formNumber
            ),

        category:
            safeText(
                record.category
            ),

        name:
            safeText(
                record.person?.firstName
            ),

        fatherName:
            safeText(
                record.person?.fatherName
            ),

        tazkira:
            safeText(
                record.person?.tazkira
            ),

        originalLocation:
            locationText(
                record.originalLocation
            ),

        currentLocation:
            locationText(
                record.currentLocation
            ),

        fraudulent:
            record.fraudulent === true

    };
}