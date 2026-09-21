// ==========================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت ډیټابیس
// reports.js
//
// اصلي Reports Engine
// + پرمختللی لټون
// + فلټرونه
// + Pagination
// + CSV / JSON
// + Copy
// + Print
// + Details
// + څو ژبې
// + Settings همغږي
// ==========================================


import { db } from "./firebase.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    listenAuth,
    logoutUser
} from "./auth.js";


import {
    initializeSettings,
    getSettings
} from "./settings.js";



// ==========================================
// Firestore Collection
// ==========================================

const RECORDS_COLLECTION = "records";



// ==========================================
// System Name
// ==========================================

const SYSTEM_NAME =
    "د افغانستان اسلامي امارت د کره کمیسیون د فورمو د ثبت او مدیریت ډیټابیس";



// ==========================================
// Translations
// ==========================================

const I18N = {

    ps: {

        reportsTitle:
            "📙 راپورونه",

        reportsDescription:
            "د ثبت، فورم ډول، ولایت او وروستیو معلوماتو لنډ او بشپړ راپورونه.",

        mainMenu:
            "اصلي مینو",

        dashboard:
            "کورپاڼه",

        formic:
            "فورمیک",

        newRegister:
            "نوی ثبت",

        search:
            "لټون",

        reports:
            "راپورونه",

        admin:
            "اډمــینانوبرخه",

        settings:
            "تنظیمات",

        refresh:
            "ریفریش",

        logout:
            "وتل",

        allRecords:
            "💑 ټول ثبت شوي کسان",

        todayRecords:
            "💏 د نن ثبتونه",

        fraudRecords:
            "❌ جعلي فورمې",

        activeRecords:
            "✅ فعال ثبتونه",

        workbench:
            "🧰 د راپورونو کاري مېز",

        workbenchDesc:
            "د ثبتونو پلټنه، فلټر، ترتیب، پاڼې، چاپ او صادرول له همدې برخې ترسره کړئ.",

        searchLabel:
            "لټون",

        searchPlaceholder:
            "د فورمې شمېره، نوم، د پلار نوم، تذکره، موبایل، ولایت...",

        category:
            "فورم ډول",

        province:
            "ولایت",

        status:
            "حالت",

        fraudState:
            "جعلي حالت",

        fromDate:
            "له نېټې",

        toDate:
            "تر نېټې",

        sort:
            "ترتیب",

        allCategories:
            "ټولې کټګورۍ",

        allProvinces:
            "ټول ولایتونه",

        allStatuses:
            "ټول حالتونه",

        allFraud:
            "د جعلي حالت ټول",

        normalOnly:
            "یوازې عادي",

        fraudOnly:
            "یوازې جعلي",

        sortNewest:
            "نوې تر زړې",

        sortOldest:
            "زړې تر نوې",

        sortName:
            "د نوم له مخې",

        sortForm:
            "د فورمې شمېره",

        page10:
            "۱۰ کرښې",

        page25:
            "۲۵ کرښې",

        page50:
            "۵۰ کرښې",

        page100:
            "۱۰۰ کرښې",

        clearFilters:
            "🧹 فلټرونه پاکول",

        refreshReport:
            "🔄 راپور تازه کول",

        exportCsv:
            "📊 CSV صادرول",

        exportJson:
            "🧾 JSON صادرول",

        copy:
            "📋 راپور کاپي کول",

        print:
            "🖨️ چاپ",

        help:
            "❓ مرسته",

        resultSummary:
            "ښودل شوي",

        totalFiltered:
            "له ټولټال",

        rows:
            "ثبتونه",

        formNumber:
            "فورم نمبر",

        name:
            "نوم",

        fatherName:
            "د پلار نوم",

        action:
            "عمل",

        date:
            "نېټه",

        view:
            "👁️ لیدل",

        noFiltered:
            "د ټاکل شوو فلټرونو له مخې هېڅ ثبت پیدا نه شو.",

        page:
            "پاڼه",

        of:
            "له",

        previous:
            "← مخکینۍ",

        next:
            "وروستۍ →",

        ready:
            "چمتو",

        loading:
            "لوډېږي...",

        error:
            "تېروتنه",

        recent:
            "وروستي",

        records:
            "راپور",

        categoryReport:
            "📊 د فورم ډولونو راپور",

        categoryDesc:
            "د هر ډول فورم شمېره",

        provinceReport:
            "🗺️ د ولایتونو راپور",

        provinceDesc:
            "د اصلي ځای ولایتونه",

        recentTitle:
            "🕒 وروستي ثبتونه",

        recentDesc:
            "وروستي 10 ثبت شوي کسان",

        loadingData:
            "د معلوماتو د لوډ کېدو په تمه...",

        noData:
            "هیڅ ثبت نه شته.",

        noCategory:
            "د فورم ډولونو راپور نشته.",

        noProvince:
            "د ولایتونو راپور نشته.",

        close:
            "بندول",

        detailsTitle:
            "د ثبت بشپړ معلومات",

        copied:
            "راپور کاپي شو.",

        copyFailed:
            "راپور کاپي نه شو.",

        exportDone:
            "فایل په بریالیتوب صادر شو.",

        helpTitle:
            "د راپورونو مرسته",

        helpBody:
            "لټون د فورمې شمېرې، نوم، د پلار نوم، تذکرې، موبایل، ولایت او نورو ثبت شوو معلوماتو پر بنسټ ترسره کېږي. فلټرونه یوځای کار کوي. CSV او JSON د اوسني فلټر شوي راپور له مخې فایل جوړوي. د لیدلو تڼۍ د یو ثبت بشپړ معلومات ښکاره کوي.",

        loadError:
            "د راپورونو د لوډ کېدو پر مهال ستونزه رامنځته شوه.",

        noPermission:
            "د Firestore اجازه رد شوه. د records ټولګې Rules وګورئ.",

        detailsError:
            "د ثبت د معلوماتو ښودلو پر مهال ستونزه رامنځته شوه.",

        formType:
            "فورم ډول",

        normal:
            "عادي",

        yes:
            "هو",

        no:
            "نه",

        statusActive:
            "فعال",

        statusInactive:
            "غیر فعال",

        statusPending:
            "د انتظار",

        statusFraud:
            "جعلي",

        fieldForm:
            "د فورمې شمېره",

        fieldName:
            "بشپړ نوم",

        fieldFather:
            "د پلار نوم",

        fieldCategory:
            "فورم ډول",

        fieldProvince:
            "اصلي ولایت",

        fieldCurrentProvince:
            "اوسنی ولایت",

        fieldJob:
            "اوسنۍ دنده",

        fieldTazkira:
            "تذکره",

        fieldPhone:
            "موبایل",

        fieldStatus:
            "حالت",

        fieldFraud:
            "جعلي فورمه",

        fieldCreatedAt:
            "د ثبت نېټه",

        empty:
            "—"

    },


    fa: {

        reportsTitle:"📙 گزارش‌ها",

        reportsDescription:
            "گزارش‌های خلاصه و کامل از ثبت‌ها، نوع فورم، ولایت و آخرین معلومات.",

        mainMenu:"منوی اصلی",

        dashboard:"صفحه اصلی",

        formic:"فورمیک",

        newRegister:"ثبت جدید",

        search:"جستجو",

        reports:"گزارش‌ها",

        admin:"بخش مدیریت",

        settings:"تنظیمات",

        refresh:"تازه‌سازی",

        logout:"خروج",

        allRecords:"💑 تمام افراد ثبت‌شده",

        todayRecords:"💏 ثبت‌های امروز",

        fraudRecords:"❌ فورم‌های جعلی",

        activeRecords:"✅ ثبت‌های فعال",

        workbench:"🧰 میز کاری گزارش‌ها",

        workbenchDesc:
            "جستجو، فیلتر، مرتب‌سازی، صفحه‌بندی، چاپ و صدور ثبت‌ها از همین بخش.",

        searchLabel:"جستجو",

        searchPlaceholder:
            "شماره فورم، نام، نام پدر، تذکره، موبایل، ولایت...",

        category:"نوع فورم",

        province:"ولایت",

        status:"وضعیت",

        fraudState:"حالت جعلی",

        fromDate:"از تاریخ",

        toDate:"تا تاریخ",

        sort:"مرتب‌سازی",

        allCategories:"همه دسته‌ها",

        allProvinces:"همه ولایت‌ها",

        allStatuses:"همه وضعیت‌ها",

        allFraud:"همه حالت‌های جعلی",

        normalOnly:"فقط عادی",

        fraudOnly:"فقط جعلی",

        sortNewest:"جدید به قدیم",

        sortOldest:"قدیم به جدید",

        sortName:"بر اساس نام",

        sortForm:"شماره فورم",

        page10:"۱۰ ردیف",

        page25:"۲۵ ردیف",

        page50:"۵۰ ردیف",

        page100:"۱۰۰ ردیف",

        clearFilters:"🧹 پاک‌کردن فیلترها",

        refreshReport:"🔄 تازه‌کردن گزارش",

        exportCsv:"📊 صدور CSV",

        exportJson:"🧾 صدور JSON",

        copy:"📋 کپی گزارش",

        print:"🖨️ چاپ",

        help:"❓ راهنما",

        resultSummary:"نمایش داده‌شده",

        totalFiltered:"از مجموع",

        rows:"ثبت",

        formNumber:"شماره فورم",

        name:"نام",

        fatherName:"نام پدر",

        action:"عمل",

        date:"تاریخ",

        view:"👁️ دیدن",

        noFiltered:"بر اساس فیلترهای انتخاب‌شده هیچ ثبتی پیدا نشد.",

        page:"صفحه",

        of:"از",

        previous:"← قبلی",

        next:"بعدی →",

        ready:"آماده",

        loading:"در حال بارگذاری...",

        error:"خطا",

        recent:"آخرین",

        records:"گزارش",

        categoryReport:"📊 گزارش انواع فورم",

        categoryDesc:"تعداد هر نوع فورم",

        provinceReport:"🗺️ گزارش ولایت‌ها",

        provinceDesc:"ولایت محل اصلی",

        recentTitle:"🕒 آخرین ثبت‌ها",

        recentDesc:"۱۰ فرد ثبت‌شده آخر",

        loadingData:"در انتظار بارگذاری معلومات...",

        noData:"هیچ ثبتی وجود ندارد.",

        noCategory:"گزارش نوع فورم وجود ندارد.",

        noProvince:"گزارش ولایت وجود ندارد.",

        close:"بستن",

        detailsTitle:"معلومات کامل ثبت",

        copied:"گزارش کپی شد.",

        copyFailed:"گزارش کپی نشد.",

        exportDone:"فایل با موفقیت صادر شد.",

        helpTitle:"راهنمای گزارش‌ها",

        helpBody:
            "جستجو بر اساس شماره فورم، نام، نام پدر، تذکره، موبایل، ولایت و سایر معلومات ثبت‌شده انجام می‌شود. فلترها همزمان کار می‌کنند و CSV و JSON بر اساس گزارش فیلترشده فعلی فایل می‌سازند.",

        loadError:"در هنگام بارگذاری گزارش‌ها مشکل ایجاد شد.",

        noPermission:
            "اجازه Firestore رد شد. Rules مجموعه records را بررسی کنید.",

        detailsError:
            "در نمایش معلومات ثبت مشکل ایجاد شد.",

        formType:"نوع فورم",

        normal:"عادی",

        yes:"بلی",

        no:"خیر",

        statusActive:"فعال",

        statusInactive:"غیرفعال",

        statusPending:"در انتظار",

        statusFraud:"جعلی",

        fieldForm:"شماره فورم",

        fieldName:"نام کامل",

        fieldFather:"نام پدر",

        fieldCategory:"نوع فورم",

        fieldProvince:"ولایت اصلی",

        fieldCurrentProvince:"ولایت فعلی",

        fieldJob:"وظیفه فعلی",

        fieldTazkira:"تذکره",

        fieldPhone:"موبایل",

        fieldStatus:"وضعیت",

        fieldFraud:"فورم جعلی",

        fieldCreatedAt:"تاریخ ثبت",

        empty:"—"

    },


    en: {

        reportsTitle:"📙 Reports",

        reportsDescription:
            "Summary and detailed reports for registrations, form types, provinces and recent records.",

        mainMenu:"Main Menu",

        dashboard:"Dashboard",

        formic:"Forms",

        newRegister:"New Registration",

        search:"Search",

        reports:"Reports",

        admin:"Administration",

        settings:"Settings",

        refresh:"Refresh",

        logout:"Logout",

        allRecords:"💑 All registered persons",

        todayRecords:"💏 Today's registrations",

        fraudRecords:"❌ Fraudulent forms",

        activeRecords:"✅ Active records",

        workbench:"🧰 Report Workbench",

        workbenchDesc:
            "Search, filter, sort, paginate, print and export records from one place.",

        searchLabel:"Search",

        searchPlaceholder:
            "Form number, name, father name, ID, phone, province...",

        category:"Form type",

        province:"Province",

        status:"Status",

        fraudState:"Fraud state",

        fromDate:"From date",

        toDate:"To date",

        sort:"Sort",

        allCategories:"All categories",

        allProvinces:"All provinces",

        allStatuses:"All statuses",

        allFraud:"All fraud states",

        normalOnly:"Normal only",

        fraudOnly:"Fraud only",

        sortNewest:"Newest first",

        sortOldest:"Oldest first",

        sortName:"By name",

        sortForm:"By form number",

        page10:"10 rows",

        page25:"25 rows",

        page50:"50 rows",

        page100:"100 rows",

        clearFilters:"🧹 Clear filters",

        refreshReport:"🔄 Refresh report",

        exportCsv:"📊 Export CSV",

        exportJson:"🧾 Export JSON",

        copy:"📋 Copy report",

        print:"🖨️ Print",

        help:"❓ Help",

        resultSummary:"Showing",

        totalFiltered:"of total",

        rows:"records",

        formNumber:"Form number",

        name:"Name",

        fatherName:"Father name",

        action:"Action",

        date:"Date",

        view:"👁️ View",

        noFiltered:"No records match the selected filters.",

        page:"Page",

        of:"of",

        previous:"← Previous",

        next:"Next →",

        ready:"Ready",

        loading:"Loading...",

        error:"Error",

        recent:"Recent",

        records:"reports",

        categoryReport:"📊 Form type report",

        categoryDesc:"Count by form type",

        provinceReport:"🗺️ Province report",

        provinceDesc:"Original-location provinces",

        recentTitle:"🕒 Recent registrations",

        recentDesc:"Latest 10 registered persons",

        loadingData:"Waiting for data to load...",

        noData:"No registrations found.",

        noCategory:"No form-type report.",

        noProvince:"No province report.",

        close:"Close",

        detailsTitle:"Record details",

        copied:"Report copied.",

        copyFailed:"Report could not be copied.",

        exportDone:"File exported successfully.",

        helpTitle:"Reports Help",

        helpBody:
            "Search works across form number, name, father name, ID, phone, province and other stored information. Filters work together. CSV and JSON export the current filtered report.",

        loadError:"There was a problem loading reports.",

        noPermission:
            "Firestore permission was denied. Check the Rules for the records collection.",

        detailsError:
            "There was a problem showing record details.",

        formType:"Form type",

        normal:"Normal",

        yes:"Yes",

        no:"No",

        statusActive:"Active",

        statusInactive:"Inactive",

        statusPending:"Pending",

        statusFraud:"Fraudulent",

        fieldForm:"Form number",

        fieldName:"Full name",

        fieldFather:"Father name",

        fieldCategory:"Form type",

        fieldProvince:"Original province",

        fieldCurrentProvince:"Current province",

        fieldJob:"Current job",

        fieldTazkira:"ID",

        fieldPhone:"Phone",

        fieldStatus:"Status",

        fieldFraud:"Fraudulent form",

        fieldCreatedAt:"Created date",

        empty:"—"

    },


    ur: {

        reportsTitle:"📙 رپورٹس",

        reportsDescription:
            "اندراجات، فارم کی قسم، صوبہ اور حالیہ ریکارڈز کی مختصر اور مکمل رپورٹس۔",

        mainMenu:"مرکزی مینو",

        dashboard:"ہوم",

        formic:"فارمک",

        newRegister:"نیا اندراج",

        search:"تلاش",

        reports:"رپورٹس",

        admin:"انتظامیہ",

        settings:"ترتیبات",

        refresh:"ریفریش",

        logout:"لاگ آؤٹ",

        allRecords:"💑 تمام رجسٹرڈ افراد",

        todayRecords:"💏 آج کے اندراجات",

        fraudRecords:"❌ جعلی فارم",

        activeRecords:"✅ فعال ریکارڈز",

        workbench:"🧰 رپورٹ ورک بینچ",

        workbenchDesc:
            "ایک ہی جگہ سے تلاش، فلٹر، ترتیب، صفحات، پرنٹ اور ایکسپورٹ کریں۔",

        searchLabel:"تلاش",

        searchPlaceholder:
            "فارم نمبر، نام، والد کا نام، شناختی کارڈ، موبائل، صوبہ...",

        category:"فارم کی قسم",

        province:"صوبہ",

        status:"حالت",

        fraudState:"جعلی حالت",

        fromDate:"تاریخ سے",

        toDate:"تاریخ تک",

        sort:"ترتیب",

        allCategories:"تمام زمرے",

        allProvinces:"تمام صوبے",

        allStatuses:"تمام حالتیں",

        allFraud:"تمام جعلی حالتیں",

        normalOnly:"صرف عام",

        fraudOnly:"صرف جعلی",

        sortNewest:"نئی پہلے",

        sortOldest:"پرانی پہلے",

        sortName:"نام کے مطابق",

        sortForm:"فارم نمبر کے مطابق",

        page10:"۱۰ قطاریں",

        page25:"۲۵ قطاریں",

        page50:"۵۰ قطاریں",

        page100:"۱۰۰ قطاریں",

        clearFilters:"🧹 فلٹر صاف کریں",

        refreshReport:"🔄 رپورٹ ریفریش",

        exportCsv:"📊 CSV برآمد",

        exportJson:"🧾 JSON برآمد",

        copy:"📋 رپورٹ کاپی",

        print:"🖨️ پرنٹ",

        help:"❓ مدد",

        resultSummary:"دکھائے گئے",

        totalFiltered:"کل میں سے",

        rows:"ریکارڈز",

        formNumber:"فارم نمبر",

        name:"نام",

        fatherName:"والد کا نام",

        action:"عمل",

        date:"تاریخ",

        view:"👁️ دیکھیں",

        noFiltered:"منتخب فلٹرز کے مطابق کوئی ریکارڈ نہیں ملا۔",

        page:"صفحہ",

        of:"میں سے",

        previous:"← پچھلا",

        next:"اگلا →",

        ready:"تیار",

        loading:"لوڈ ہو رہا ہے...",

        error:"خرابی",

        recent:"حالیہ",

        records:"رپورٹس",

        categoryReport:"📊 فارم اقسام کی رپورٹ",

        categoryDesc:"ہر فارم کی تعداد",

        provinceReport:"🗺️ صوبوں کی رپورٹ",

        provinceDesc:"اصل مقام کے صوبے",

        recentTitle:"🕒 حالیہ اندراجات",

        recentDesc:"آخری ۱۰ رجسٹرڈ افراد",

        loadingData:"معلومات لوڈ ہونے کا انتظار...",

        noData:"کوئی اندراج نہیں۔",

        noCategory:"فارم اقسام کی رپورٹ نہیں۔",

        noProvince:"صوبوں کی رپورٹ نہیں۔",

        close:"بند کریں",

        detailsTitle:"ریکارڈ کی مکمل معلومات",

        copied:"رپورٹ کاپی ہوگئی۔",

        copyFailed:"رپورٹ کاپی نہ ہوسکی۔",

        exportDone:"فائل کامیابی سے برآمد ہوگئی۔",

        helpTitle:"رپورٹس کی مدد",

        helpBody:
            "تلاش فارم نمبر، نام، والد کا نام، شناختی کارڈ، موبائل، صوبہ اور دیگر محفوظ معلومات میں ہوتی ہے۔ فلٹر ایک ساتھ کام کرتے ہیں۔ CSV اور JSON موجودہ فلٹر شدہ رپورٹ کو برآمد کرتے ہیں۔",

        loadError:"رپورٹس لوڈ کرتے وقت مسئلہ پیش آیا۔",

        noPermission:
            "Firestore اجازت رد ہوگئی۔ records کلیکشن کے Rules چیک کریں۔",

        detailsError:
            "ریکارڈ کی معلومات دکھاتے وقت مسئلہ پیش آیا۔",

        formType:"فارم کی قسم",

        normal:"عام",

        yes:"ہاں",

        no:"نہیں",

        statusActive:"فعال",

        statusInactive:"غیر فعال",

        statusPending:"زیر التوا",

        statusFraud:"جعلی",

        fieldForm:"فارم نمبر",

        fieldName:"مکمل نام",

        fieldFather:"والد کا نام",

        fieldCategory:"فارم کی قسم",

        fieldProvince:"اصل صوبہ",

        fieldCurrentProvince:"موجودہ صوبہ",

        fieldJob:"موجودہ کام",

        fieldTazkira:"شناختی کارڈ",

        fieldPhone:"موبائل",

        fieldStatus:"حالت",

        fieldFraud:"جعلی فارم",

        fieldCreatedAt:"اندراج کی تاریخ",

        empty:"—"

    },


    ar: {

        reportsTitle:"📙 التقارير",

        reportsDescription:
            "تقارير مختصرة ومفصلة للتسجيلات وأنواع النماذج والولايات وآخر السجلات.",

        mainMenu:"القائمة الرئيسية",

        dashboard:"الرئيسية",

        formic:"فورميك",

        newRegister:"تسجيل جديد",

        search:"بحث",

        reports:"التقارير",

        admin:"الإدارة",

        settings:"الإعدادات",

        refresh:"تحديث",

        logout:"خروج",

        allRecords:"💑 جميع الأشخاص المسجلين",

        todayRecords:"💏 تسجيلات اليوم",

        fraudRecords:"❌ النماذج المزورة",

        activeRecords:"✅ السجلات الفعالة",

        workbench:"🧰 مساحة عمل التقارير",

        workbenchDesc:
            "البحث والتصفية والترتيب والصفحات والطباعة والتصدير من مكان واحد.",

        searchLabel:"بحث",

        searchPlaceholder:
            "رقم النموذج، الاسم، اسم الأب، الهوية، الهاتف، الولاية...",

        category:"نوع النموذج",

        province:"الولاية",

        status:"الحالة",

        fraudState:"حالة التزوير",

        fromDate:"من التاريخ",

        toDate:"إلى التاريخ",

        sort:"الترتيب",

        allCategories:"كل الفئات",

        allProvinces:"كل الولايات",

        allStatuses:"كل الحالات",

        allFraud:"كل حالات التزوير",

        normalOnly:"العادية فقط",

        fraudOnly:"المزورة فقط",

        sortNewest:"الأحدث أولاً",

        sortOldest:"الأقدم أولاً",

        sortName:"حسب الاسم",

        sortForm:"حسب رقم النموذج",

        page10:"10 صفوف",

        page25:"25 صفاً",

        page50:"50 صفاً",

        page100:"100 صف",

        clearFilters:"🧹 مسح المرشحات",

        refreshReport:"🔄 تحديث التقرير",

        exportCsv:"📊 تصدير CSV",

        exportJson:"🧾 تصدير JSON",

        copy:"📋 نسخ التقرير",

        print:"🖨️ طباعة",

        help:"❓ مساعدة",

        resultSummary:"المعروض",

        totalFiltered:"من الإجمالي",

        rows:"سجلات",

        formNumber:"رقم النموذج",

        name:"الاسم",

        fatherName:"اسم الأب",

        action:"إجراء",

        date:"التاريخ",

        view:"👁️ عرض",

        noFiltered:"لا توجد سجلات وفق المرشحات المحددة.",

        page:"الصفحة",

        of:"من",

        previous:"← السابقة",

        next:"التالية →",

        ready:"جاهز",

        loading:"جارٍ التحميل...",

        error:"خطأ",

        recent:"الأخيرة",

        records:"تقرير",

        categoryReport:"📊 تقرير أنواع النماذج",

        categoryDesc:"عدد كل نوع من النماذج",

        provinceReport:"🗺️ تقرير الولايات",

        provinceDesc:"ولايات الموقع الأصلي",

        recentTitle:"🕒 آخر التسجيلات",

        recentDesc:"آخر 10 أشخاص مسجلين",

        loadingData:"بانتظار تحميل البيانات...",

        noData:"لا توجد تسجيلات.",

        noCategory:"لا يوجد تقرير لأنواع النماذج.",

        noProvince:"لا يوجد تقرير للولايات.",

        close:"إغلاق",

        detailsTitle:"تفاصيل السجل",

        copied:"تم نسخ التقرير.",

        copyFailed:"تعذر نسخ التقرير.",

        exportDone:"تم تصدير الملف بنجاح.",

        helpTitle:"مساعدة التقارير",

        helpBody:
            "يعمل البحث على رقم النموذج والاسم واسم الأب والهوية والهاتف والولاية وغيرها من المعلومات المحفوظة. تعمل المرشحات معًا، ويصدر CSV وJSON التقرير المصفى الحالي.",

        loadError:"حدثت مشكلة أثناء تحميل التقارير.",

        noPermission:
            "تم رفض إذن Firestore. تحقق من Rules لمجموعة records.",

        detailsError:
            "حدثت مشكلة أثناء عرض تفاصيل السجل.",

        formType:"نوع النموذج",

        normal:"عادي",

        yes:"نعم",

        no:"لا",

        statusActive:"فعال",

        statusInactive:"غير فعال",

        statusPending:"قيد الانتظار",

        statusFraud:"مزور",

        fieldForm:"رقم النموذج",

        fieldName:"الاسم الكامل",

        fieldFather:"اسم الأب",

        fieldCategory:"نوع النموذج",

        fieldProvince:"الولاية الأصلية",

        fieldCurrentProvince:"الولاية الحالية",

        fieldJob:"العمل الحالي",

        fieldTazkira:"الهوية",

        fieldPhone:"الهاتف",

        fieldStatus:"الحالة",

        fieldFraud:"نموذج مزور",

        fieldCreatedAt:"تاريخ التسجيل",

        empty:"—"

    }

};



// ==========================================
// اصلي څلور کټګورۍ
// ==========================================

const BASE_CATEGORIES = [

    "مجاهد",

    "همکار",

    "د شهید د کورنۍ غړی",

    "بعدالفتح"

];



const CATEGORY_LABELS = {

    ps: {

        "مجاهد":
            "مجاهد",

        "همکار":
            "همکار",

        "د شهید د کورنۍ غړی":
            "د شهید د کورنۍ غړی",

        "بعدالفتح":
            "بعدالفتح"

    },

    fa: {

        "مجاهد":
            "مجاهد",

        "همکار":
            "همکار",

        "د شهید د کورنۍ غړی":
            "عضو خانواده شهید",

        "بعدالفتح":
            "بعدالفتح"

    },

    en: {

        "مجاهد":
            "Mujahid",

        "همکار":
            "Associate",

        "د شهید د کورنۍ غړی":
            "Martyr's family member",

        "بعدالفتح":
            "After-conquest"

    },

    ur: {

        "مجاهد":
            "مجاہد",

        "همکار":
            "معاون",

        "د شهید د کورنۍ غړی":
            "شہید کے خاندان کا فرد",

        "بعدالفتح":
            "بعد الفتح"

    },

    ar: {

        "مجاهد":
            "مجاهد",

        "همکار":
            "مساعد",

        "د شهید د کورنۍ غړی":
            "فرد من أسرة الشهيد",

        "بعدالفتح":
            "بعد الفتح"

    }

};



// ==========================================
// ولایتونه
// ==========================================

const PROVINCES = {

    "کابل":
        "Kabul",

    "کاپیسا":
        "Kapisa",

    "پروان":
        "Parwan",

    "پنجشېر":
        "Panjshir",

    "میدان وردګ":
        "Maidan Wardak",

    "لوګر":
        "Logar",

    "غزني":
        "Ghazni",

    "پکتیا":
        "Paktia",

    "پکتیکا":
        "Paktika",

    "خوست":
        "Khost",

    "ننګرهار":
        "Nangarhar",

    "لغمان":
        "Laghman",

    "کونړ":
        "Kunar",

    "نورستان":
        "Nuristan",

    "بدخشان":
        "Badakhshan",

    "تخار":
        "Takhar",

    "کندز":
        "Kunduz",

    "بغلان":
        "Baghlan",

    "سمنګان":
        "Samangan",

    "بلخ":
        "Balkh",

    "جوزجان":
        "Jowzjan",

    "سرپل":
        "Sar-e Pol",

    "فاریاب":
        "Faryab",

    "دایکندي":
        "Daykundi",

    "بامیان":
        "Bamyan",

    "غور":
        "Ghor",

    "هرات":
        "Herat",

    "فراه":
        "Farah",

    "نیمروز":
        "Nimroz",

    "هلمند":
        "Helmand",

    "کندهار":
        "Kandahar",

    "زابل":
        "Zabul",

    "ارزګان":
        "Uruzgan",

    "بادغیس":
        "Badghis"

};



const PROVINCE_FA = {

    "کابل":"کابل",
    "کاپیسا":"کاپیسا",
    "پروان":"پروان",
    "پنجشېر":"پنجشیر",
    "میدان وردګ":"میدان وردک",
    "لوګر":"لوگر",
    "غزني":"غزنی",
    "پکتیا":"پکتیا",
    "پکتیکا":"پکتیکا",
    "خوست":"خوست",
    "ننګرهار":"ننگرهار",
    "لغمان":"لغمان",
    "کونړ":"کنر",
    "نورستان":"نورستان",
    "بدخشان":"بدخشان",
    "تخار":"تخار",
    "کندز":"کندز",
    "بغلان":"بغلان",
    "سمنګان":"سمنگان",
    "بلخ":"بلخ",
    "جوزجان":"جوزجان",
    "سرپل":"سرپل",
    "فاریاب":"فاریاب",
    "دایکندي":"دایکندی",
    "بامیان":"بامیان",
    "غور":"غور",
    "هرات":"هرات",
    "فراه":"فراه",
    "نیمروز":"نیمروز",
    "هلمند":"هلمند",
    "کندهار":"قندهار",
    "زابل":"زابل",
    "ارزګان":"ارزگان",
    "بادغیس":"بادغیس"

};



const PROVINCE_UR = {

    "کابل":"کابل",
    "کاپیسا":"کاپیسا",
    "پروان":"پروان",
    "پنجشېر":"پنجشیر",
    "میدان وردګ":"میدان وردک",
    "لوګر":"لوگر",
    "غزني":"غزنی",
    "پکتیا":"پکتیا",
    "پکتیکا":"پکتیکا",
    "خوست":"خوست",
    "ننګرهار":"ننگرہار",
    "لغمان":"لغمان",
    "کونړ":"کنڑ",
    "نورستان":"نورستان",
    "بدخشان":"بدخشان",
    "تخار":"تخار",
    "کندز":"کندوز",
    "بغلان":"بغلان",
    "سمنګان":"سمنگان",
    "بلخ":"بلخ",
    "جوزجان":"جوزجان",
    "سرپل":"سرپل",
    "فاریاب":"فاریاب",
    "دایکندي":"دائیکندی",
    "بامیان":"بامیان",
    "غور":"غور",
    "هرات":"ہرات",
    "فراه":"فراہ",
    "نیمروز":"نیمروز",
    "هلمند":"ہلمند",
    "کندهار":"قندھار",
    "زابل":"زابل",
    "ارزګان":"ارزگان",
    "بادغیس":"بادغیس"

};



const PROVINCE_AR = {

    "کابل":"كابول",
    "کاپیسا":"كابيسا",
    "پروان":"بروان",
    "پنجشېر":"بنجشير",
    "میدان وردګ":"ميدان وردك",
    "لوګر":"لوغر",
    "غزني":"غزني",
    "پکتیا":"بكتيا",
    "پکتیکا":"بكتيكا",
    "خوست":"خوست",
    "ننګرهار":"ننغرهار",
    "لغمان":"لغمان",
    "کونړ":"كونر",
    "نورستان":"نورستان",
    "بدخشان":"بدخشان",
    "تخار":"تخار",
    "کندز":"قندوز",
    "بغلان":"بغلان",
    "سمنګان":"سمنغان",
    "بلخ":"بلخ",
    "جوزجان":"جوزجان",
    "سرپل":"سرپل",
    "فاریاب":"فارياب",
    "دایکندي":"دايكندي",
    "بامیان":"باميان",
    "غور":"غور",
    "هرات":"هرات",
    "فراه":"فراه",
    "نیمروز":"نيمروز",
    "هلمند":"هلمند",
    "کندهار":"قندهار",
    "زابل":"زابل",
    "ارزګان":"أوروزغان",
    "بادغیس":"بادغيس"

};



// ==========================================
// State
// ==========================================

const state = {

    allRecords: [],

    filteredRecords: [],

    currentPage: 1,

    pageSize: 10,

    settings: null,

    language: "ps",

    bound: false

};



// ==========================================
// Helper
// ==========================================

const $ = id =>
    document.getElementById(id);



// ==========================================
// Escape
// ==========================================

function escapeHtml(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}



// ==========================================
// Safe text
// ==========================================

function safeText(value) {

    const text =
        String(value ?? "").trim();

    return text || "—";

}



// ==========================================
// Normalize
// ==========================================

function normalize(value) {

    return String(value ?? "")

        .replaceAll("\u200c", "")

        .replaceAll("\u200e", "")

        .replaceAll("\u200f", "")

        .trim()

        .toLowerCase();

}



// ==========================================
// Translation
// ==========================================

function t(key) {

    return (
        I18N[state.language]?.[key] ||
        I18N.ps[key] ||
        key
    );

}



// ==========================================
// Locale
// ==========================================

function getLocale() {

    return {

        ps: "ps-AF",

        fa: "fa-AF",

        en: "en-US",

        ur: "ur-PK",

        ar: "ar-SA"

    }[state.language] || "ps-AF";

}



// ==========================================
// Number
// ==========================================

function localNumber(value) {

    try {

        return Number(value)
            .toLocaleString(
                getLocale()
            );

    } catch {

        return String(value);

    }

}



// ==========================================
// Category Label
// ==========================================

function categoryLabel(value) {

    const raw =
        safeText(value);


    const key =
        BASE_CATEGORIES.find(
            item =>
                normalize(item) ===
                normalize(raw)
        );


    if (!key) {

        return raw;

    }


    return (
        CATEGORY_LABELS[
            state.language
        ]?.[key] ||
        key
    );

}



// ==========================================
// Province Label
// ==========================================

function provinceLabel(value) {

    const raw =
        safeText(value);


    const key =
        Object.keys(PROVINCES)
            .find(
                item =>
                    normalize(item) ===
                    normalize(raw)
            );


    if (!key) {

        return raw;

    }


    if (
        state.language ===
        "en"
    ) {

        return PROVINCES[key];

    }


    if (
        state.language ===
        "fa"
    ) {

        return (
            PROVINCE_FA[key] ||
            key
        );

    }


    if (
        state.language ===
        "ur"
    ) {

        return (
            PROVINCE_UR[key] ||
            key
        );

    }


    if (
        state.language ===
        "ar"
    ) {

        return (
            PROVINCE_AR[key] ||
            key
        );

    }


    return key;

}



// ==========================================
// Timestamp -> Date
// ==========================================

function toDate(value) {

    if (!value) {

        return null;

    }


    if (
        value instanceof Date
    ) {

        return Number.isNaN(
            value.getTime()
        )
            ? null
            : value;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        try {

            const d =
                value.toDate();

            return Number.isNaN(
                d.getTime()
            )
                ? null
                : d;

        } catch {

            return null;

        }

    }


    const d =
        new Date(value);


    return Number.isNaN(
        d.getTime()
    )
        ? null
        : d;

}



// ==========================================
// Created Date
// ==========================================

function getCreatedDate(record) {

    return (
        toDate(
            record?.createdAt
        ) ||
        toDate(
            record?.updatedAt
        )
    );

}



// ==========================================
// Date Key
// ==========================================

function getDateKey(date) {

    if (!date) {

        return "";

    }


    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    state.settings?.timeZone ||
                    "Asia/Kabul",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        ).format(date);

    } catch {

        return date
            .toLocaleDateString(
                "en-CA"
            );

    }

}



// ==========================================
// Format Date
// ==========================================

function formatRecordDate(value) {

    const date =
        toDate(value);


    if (!date) {

        return t("empty");

    }


    let calendar =
        "persian";


    if (
        state.settings?.calendar ===
        "lunar"
    ) {

        calendar =
            "islamic";

    }


    if (
        state.settings?.calendar ===
        "gregorian"
    ) {

        calendar =
            "gregory";

    }


    try {

        return new Intl.DateTimeFormat(

            `${getLocale()}-u-ca-${calendar}`,

            {

                timeZone:
                    state.settings?.timeZone ||
                    "Asia/Kabul",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"

            }

        ).format(date);

    } catch {

        return date
            .toLocaleDateString(
                getLocale()
            );

    }

}



// ==========================================
// Form Number
// ==========================================

function getFormNumber(record) {

    return safeText(

        record?.formNumber ??

        record?.person?.formNumber

    );

}



// ==========================================
// First Name
// ==========================================

function getFirstName(record) {

    return String(

        record?.firstName ??

        record?.person?.firstName ??

        ""

    ).trim();

}



// ==========================================
// Last Name
// ==========================================

function getLastName(record) {

    return String(

        record?.lastName ??

        record?.person?.lastName ??

        ""

    ).trim();

}



// ==========================================
// Full Name
// ==========================================

function getPersonName(record) {

    const first =
        getFirstName(record);

    const last =
        getLastName(record);


    return (
        `${first} ${last}`.trim() ||
        "—"
    );

}



// ==========================================
// Father
// ==========================================

function getFatherName(record) {

    return safeText(

        record?.fatherName ??

        record?.person?.fatherName

    );

}



// ==========================================
// Category
// ==========================================

function getCategory(record) {

    return safeText(
        record?.category
    );

}



// ==========================================
// Original Province
// ==========================================

function getOriginalProvince(record) {

    return safeText(

        record?.originalProvince ??

        record?.originalLocation?.province ??

        record?.province

    );

}



// ==========================================
// Current Province
// ==========================================

function getCurrentProvince(record) {

    return safeText(

        record?.currentProvince ??

        record?.currentLocation?.province

    );

}



// ==========================================
// Job
// ==========================================

function getCurrentJob(record) {

    return safeText(

        record?.currentJob ??

        record?.person?.currentJob

    );

}



// ==========================================
// Tazkira
// ==========================================

function getTazkira(record) {

    return safeText(

        record?.tazkira ??

        record?.person?.tazkira

    );

}



// ==========================================
// Phone
// ==========================================

function getPhone(record) {

    return safeText(

        record?.phone ??

        record?.person?.phone

    );

}



// ==========================================
// Raw Status
// ==========================================

function getRawStatus(record) {

    const status =
        String(
            record?.status ??
            ""
        ).trim();


    return status;

}



// ==========================================
// Status
// ==========================================

function getStatus(record) {

    if (
        record?.fraudulent ===
        true
    ) {

        return t("statusFraud");

    }


    const raw =
        normalize(
            getRawStatus(record)
        );


    if (
        raw === "active" ||
        raw === "فعال"
    ) {

        return t("statusActive");

    }


    if (
        raw === "inactive" ||
        raw === "غیرفعال" ||
        raw === "غیر فعال"
    ) {

        return t("statusInactive");

    }


    if (
        raw === "pending" ||
        raw === "د انتظار"
    ) {

        return t("statusPending");

    }


    /*
       د general-form.js اوسنی schema
       status نه ثبتوي.
       نو عادي record فعال ګڼل کېږي.
    */

    return (
        getRawStatus(record) ||
        t("statusActive")
    );

}



// ==========================================
// Is Active
// ==========================================

function isActiveRecord(record) {

    const raw =
        normalize(
            getRawStatus(record)
        );


    if (
        raw === "active" ||
        raw === "فعال"
    ) {

        return true;

    }


    if (
        raw === "inactive" ||
        raw === "غیرفعال" ||
        raw === "غیر فعال"
    ) {

        return false;

    }


    if (
        raw === "pending" ||
        raw === "د انتظار"
    ) {

        return false;

    }


    /*
       که status موجود نه وي:
       غیرجعلي record فعال ګڼل کېږي.
    */

    return (
        record?.fraudulent !==
        true
    );

}



// ==========================================
// Search Text
// ==========================================

function getSearchText(record) {

    const values = [];


    const add =
        value => {

            if (
                value ===
                undefined ||
                value ===
                null
            ) {

                return;

            }


            if (
                typeof value ===
                "object"
            ) {

                try {

                    values.push(
                        JSON.stringify(
                            value
                        )
                    );

                } catch {

                    values.push(
                        String(value)
                    );

                }

                return;

            }


            values.push(
                String(value)
            );

        };


    Object.values(
        record || {}
    ).forEach(add);


    add(
        getPersonName(
            record
        )
    );

    add(
        getFatherName(
            record
        )
    );

    add(
        getOriginalProvince(
            record
        )
    );

    add(
        getCurrentProvince(
            record
        )
    );


    return values
        .join(" ")
        .toLowerCase();

}



// ==========================================
// Message
// ==========================================

function showMessage(
    message,
    type = "info"
) {

    const element =
        $("reportsMessage");


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `alert alert-${type}`;


    element.style.display =
        "block";


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            4000
        );

}



// ==========================================
// Hide Message
// ==========================================

function hideMessage() {

    const element =
        $("reportsMessage");


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.className =
        "alert";


    element.style.display =
        "none";

}



// ==========================================
// Firestore Load
// ==========================================

async function fetchRecords() {

    const snapshot =
        await getDocs(
            collection(
                db,
                RECORDS_COLLECTION
            )
        );


    return snapshot.docs.map(
        documentSnapshot => ({

            id:
                documentSnapshot.id,

            ...documentSnapshot.data()

        })
    );

}



// ==========================================
// Stats
// ==========================================

function renderStats() {

    const total =
        state.allRecords.length;


    const today =
        getDateKey(
            new Date()
        );


    let todayCount =
        0;

    let fraudCount =
        0;

    let activeCount =
        0;


    state.allRecords.forEach(
        record => {


            if (
                record?.fraudulent ===
                true
            ) {

                fraudCount += 1;

            }


            if (
                isActiveRecord(
                    record
                )
            ) {

                activeCount += 1;

            }


            const created =
                toDate(
                    record?.createdAt
                );


            if (
                created &&
                getDateKey(
                    created
                ) ===
                today
            ) {

                todayCount += 1;

            }

        }
    );


    const totalEl =
        $("totalRecords");


    const todayEl =
        $("todayRecords");


    const fraudEl =
        $("fraudRecords");


    const activeEl =
        $("activeRecords");


    if (totalEl) {

        totalEl.textContent =
            localNumber(
                total
            );

    }


    if (todayEl) {

        todayEl.textContent =
            localNumber(
                todayCount
            );

    }


    if (fraudEl) {

        fraudEl.textContent =
            localNumber(
                fraudCount
            );

    }


    if (activeEl) {

        activeEl.textContent =
            localNumber(
                activeCount
            );

    }

}



// ==========================================
// Count Table
// ==========================================

function renderCountTable(
    map,
    tbody,
    emptyText,
    keepZero = false
) {

    if (!tbody) {

        return;

    }


    let entries =
        Object.entries(
            map
        );


    if (!keepZero) {

        entries =
            entries.filter(
                ([, count]) =>
                    count > 0
            );

    }


    entries.sort(
        (a, b) => {

            const countDifference =
                b[1] - a[1];


            if (
                countDifference !==
                0
            ) {

                return countDifference;

            }


            return a[0].localeCompare(
                b[0],
                getLocale()
            );

        }
    );


    if (
        !entries.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="2"
                    class="text-center"
                >
                    ${escapeHtml(
                        emptyText
                    )}
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        entries
            .map(
                ([label, count]) => `

                    <tr>

                        <td>
                            ${escapeHtml(
                                label
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    localNumber(
                                        count
                                    )
                                )}
                            </strong>
                        </td>

                    </tr>

                `
            )
            .join("");

}



// ==========================================
// Categories Report
// ==========================================

function renderCategoriesReport() {

    const map = {};


    /*
       ټولې اصلي ۴ کټګورۍ
       تل موجودې وي.
    */

    BASE_CATEGORIES.forEach(
        category => {

            map[
                categoryLabel(
                    category
                )
            ] = 0;

        }
    );


    /*
       نورې موجودې کټګورۍ
       هم ورزیاتېږي.
    */

    state.allRecords.forEach(
        record => {

            const raw =
                getCategory(
                    record
                );


            if (
                raw ===
                "—"
            ) {

                return;

            }


            const label =
                categoryLabel(
                    raw
                );


            map[label] =
                (
                    map[label] ||
                    0
                ) + 1;

        }
    );


    renderCountTable(

        map,

        $("categoryTableBody"),

        t("noCategory"),

        true

    );


    const count =
        state.allRecords.length;


    const badge =
        $("categoryBadge");


    if (badge) {

        badge.textContent =
            `${localNumber(count)} ${t("records")}`;

    }

}



// ==========================================
// Provinces Report
// ==========================================

function renderProvincesReport() {

    const map = {};


    state.allRecords.forEach(
        record => {

            const raw =
                getOriginalProvince(
                    record
                );


            if (
                raw ===
                "—"
            ) {

                return;

            }


            const label =
                provinceLabel(
                    raw
                );


            map[label] =
                (
                    map[label] ||
                    0
                ) + 1;

        }
    );


    renderCountTable(

        map,

        $("provinceTableBody"),

        t("noProvince"),

        false

    );


    const count =
        Object.values(
            map
        )
        .reduce(
            (a, b) =>
                a + b,
            0
        );


    const badge =
        $("provinceBadge");


    if (badge) {

        badge.textContent =
            `${localNumber(count)} ${t("records")}`;

    }

}



// ==========================================
// Recent Reports
// ==========================================

function renderRecentReport() {

    const tbody =
        $("recentTableBody");


    if (!tbody) {

        return;

    }


    const records =
        state.allRecords
            .slice()
            .sort(
                (a, b) =>
                    (
                        toDate(
                            b.createdAt
                        )?.getTime() || 0
                    ) -
                    (
                        toDate(
                            a.createdAt
                        )?.getTime() || 0
                    )
            )
            .slice(
                0,
                10
            );


    if (
        !records.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center"
                >
                    ${escapeHtml(
                        t("noData")
                    )}
                </td>

            </tr>

        `;

        $("recentBadge").textContent =
            `0 ${t("recent")}`;

        return;

    }


    tbody.innerHTML =
        records
            .map(
                record => `

                    <tr>

                        <td>
                            ${escapeHtml(
                                getFormNumber(
                                    record
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                getPersonName(
                                    record
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                categoryLabel(
                                    getCategory(
                                        record
                                    )
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                provinceLabel(
                                    getOriginalProvince(
                                        record
                                    )
                                )
                            )}
                        </td>


                        <td>

                            <span
                                class="badge ${
                                    record.fraudulent === true
                                        ? "badge-danger"
                                        : "badge-success"
                                }"
                            >
                                ${escapeHtml(
                                    getStatus(
                                        record
                                    )
                                )}
                            </span>

                        </td>


                        <td>
                            ${escapeHtml(
                                formatRecordDate(
                                    record.createdAt ||
                                    record.updatedAt
                                )
                            )}
                        </td>

                    </tr>

                `
            )
            .join("");


    const badge =
        $("recentBadge");


    if (badge) {

        badge.textContent =
            `${localNumber(
                records.length
            )} ${t("recent")}`;

    }

}



// ==========================================
// Filter Options
// ==========================================

function fillFilterOptions() {

    const categoryFilter =
        $("categoryFilter");


    const provinceFilter =
        $("provinceFilter");


    const statusFilter =
        $("statusFilter");


    if (
        categoryFilter
    ) {

        const current =
            categoryFilter.value;


        const values =
            [
                ...new Set(
                    state.allRecords
                        .map(
                            record =>
                                getCategory(
                                    record
                                )
                        )
                        .filter(
                            value =>
                                value !==
                                "—"
                        )
                )
            ];


        values.sort(
            (a, b) =>
                categoryLabel(a)
                    .localeCompare(
                        categoryLabel(b),
                        getLocale()
                    )
        );


        categoryFilter.innerHTML = `

            <option value="">
                ${escapeHtml(
                    t("allCategories")
                )}
            </option>

            ${values
                .map(
                    value => `

                        <option
                            value="${escapeHtml(
                                value
                            )}"
                        >
                            ${escapeHtml(
                                categoryLabel(
                                    value
                                )
                            )}
                        </option>

                    `
                )
                .join("")}

        `;


        if (
            values.includes(
                current
            )
        ) {

            categoryFilter.value =
                current;

        }

    }



    if (
        provinceFilter
    ) {

        const current =
            provinceFilter.value;


        const values =
            [
                ...new Set(
                    state.allRecords
                        .map(
                            record =>
                                getOriginalProvince(
                                    record
                                )
                        )
                        .filter(
                            value =>
                                value !==
                                "—"
                        )
                )
            ];


        values.sort(
            (a, b) =>
                provinceLabel(a)
                    .localeCompare(
                        provinceLabel(b),
                        getLocale()
                    )
        );


        provinceFilter.innerHTML = `

            <option value="">
                ${escapeHtml(
                    t("allProvinces")
                )}
            </option>

            ${values
                .map(
                    value => `

                        <option
                            value="${escapeHtml(
                                value
                            )}"
                        >
                            ${escapeHtml(
                                provinceLabel(
                                    value
                                )
                            )}
                        </option>

                    `
                )
                .join("")}

        `;


        if (
            values.includes(
                current
            )
        ) {

            provinceFilter.value =
                current;

        }

    }



    if (
        statusFilter
    ) {

        const current =
            statusFilter.value;


        const values =
            [
                ...new Set(
                    state.allRecords
                        .map(
                            record =>
                                getRawStatus(
                                    record
                                ) ||
                                "active"
                        )
                )
            ];


        values.sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    getLocale()
                )
        );


        statusFilter.innerHTML = `

            <option value="">
                ${escapeHtml(
                    t("allStatuses")
                )}
            </option>

            ${values
                .map(
                    value => `

                        <option
                            value="${escapeHtml(
                                value
                            )}"
                        >
                            ${escapeHtml(
                                getStatus({
                                    status:
                                        value
                                })
                            )}
                        </option>

                    `
                )
                .join("")}

        `;


        if (
            values.includes(
                current
            )
        ) {

            statusFilter.value =
                current;

        }

    }

}



// ==========================================
// Localized Controls
// ==========================================

function renderLocalizedControls() {

    const sortFilter =
        $("sortFilter");


    const fraudFilter =
        $("fraudFilter");


    const pageSize =
        $("pageSizeSelect");


    if (
        sortFilter
    ) {

        const current =
            sortFilter.value ||
            "newest";


        sortFilter.innerHTML = `

            <option value="newest">
                ${escapeHtml(
                    t("sortNewest")
                )}
            </option>

            <option value="oldest">
                ${escapeHtml(
                    t("sortOldest")
                )}
            </option>

            <option value="name">
                ${escapeHtml(
                    t("sortName")
                )}
            </option>

            <option value="form">
                ${escapeHtml(
                    t("sortForm")
                )}
            </option>

        `;


        sortFilter.value =
            current;

    }



    if (
        fraudFilter
    ) {

        const current =
            fraudFilter.value;


        fraudFilter.innerHTML = `

            <option value="">
                ${escapeHtml(
                    t("allFraud")
                )}
            </option>

            <option value="normal">
                ${escapeHtml(
                    t("normalOnly")
                )}
            </option>

            <option value="fraud">
                ${escapeHtml(
                    t("fraudOnly")
                )}
            </option>

        `;


        fraudFilter.value =
            current;

    }



    if (
        pageSize
    ) {

        const current =
            String(
                state.pageSize
            );


        pageSize.innerHTML = `

            <option value="10">
                ${escapeHtml(
                    t("page10")
                )}
            </option>

            <option value="25">
                ${escapeHtml(
                    t("page25")
                )}
            </option>

            <option value="50">
                ${escapeHtml(
                    t("page50")
                )}
            </option>

            <option value="100">
                ${escapeHtml(
                    t("page100")
                )}
            </option>

        `;


        pageSize.value =
            current;

    }

}



// ==========================================
// Apply Filters
// ==========================================

function applyFilters() {

    const search =
        (
            $("reportSearch")
                ?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const category =
        $("categoryFilter")
            ?.value ||
        "";


    const province =
        $("provinceFilter")
            ?.value ||
        "";


    const status =
        $("statusFilter")
            ?.value ||
        "";


    const fraud =
        $("fraudFilter")
            ?.value ||
        "";


    const from =
        $("dateFrom")
            ?.value ||
        "";


    const to =
        $("dateTo")
            ?.value ||
        "";


    const sort =
        $("sortFilter")
            ?.value ||
        "newest";


    let result =
        state.allRecords.filter(
            record => {

                if (
                    search &&
                    !getSearchText(
                        record
                    ).includes(
                        search
                    )
                ) {

                    return false;

                }


                if (
                    category &&
                    normalize(
                        getCategory(
                            record
                        )
                    ) !==
                    normalize(
                        category
                    )
                ) {

                    return false;

                }


                if (
                    province &&
                    normalize(
                        getOriginalProvince(
                            record
                        )
                    ) !==
                    normalize(
                        province
                    )
                ) {

                    return false;

                }


                if (
                    status &&
                    normalize(
                        getRawStatus(
                            record
                        ) ||
                        "active"
                    ) !==
                    normalize(
                        status
                    )
                ) {

                    return false;

                }


                if (
                    fraud ===
                    "fraud" &&
                    record.fraudulent !==
                    true
                ) {

                    return false;

                }


                if (
                    fraud ===
                    "normal" &&
                    record.fraudulent ===
                    true
                ) {

                    return false;

                }


                const date =
                    getCreatedDate(
                        record
                    );


                if (
                    from ||
                    to
                ) {

                    if (!date) {

                        return false;

                    }


                    const key =
                        getDateKey(
                            date
                        );


                    if (
                        from &&
                        key < from
                    ) {

                        return false;

                    }


                    if (
                        to &&
                        key > to
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    result.sort(
        (a, b) => {

            if (
                sort ===
                "oldest"
            ) {

                return (
                    (
                        getCreatedDate(
                            a
                        )?.getTime() || 0
                    ) -
                    (
                        getCreatedDate(
                            b
                        )?.getTime() || 0
                    )
                );

            }


            if (
                sort ===
                "name"
            ) {

                return getPersonName(
                    a
                ).localeCompare(
                    getPersonName(
                        b
                    ),
                    getLocale()
                );

            }


            if (
                sort ===
                "form"
            ) {

                return getFormNumber(
                    a
                ).localeCompare(
                    getFormNumber(
                        b
                    ),
                    undefined,
                    {
                        numeric:
                            true,

                        sensitivity:
                            "base"
                    }
                );

            }


            return (
                (
                    getCreatedDate(
                        b
                    )?.getTime() || 0
                ) -
                (
                    getCreatedDate(
                        a
                    )?.getTime() || 0
                )
            );

        }
    );


    state.filteredRecords =
        result;


    state.currentPage =
        1;


    renderFilteredTable();

}



// ==========================================
// Filtered Table
// ==========================================

function renderFilteredTable() {

    const tbody =
        $("filteredTableBody");


    if (!tbody) {

        return;

    }


    const total =
        state.filteredRecords.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                state.pageSize
            )
        );


    if (
        state.currentPage >
        totalPages
    ) {

        state.currentPage =
            totalPages;

    }


    const start =
        (
            state.currentPage -
            1
        ) *
        state.pageSize;


    const pageRecords =
        state.filteredRecords.slice(
            start,
            start +
            state.pageSize
        );


    if (
        !pageRecords.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center"
                >
                    ${escapeHtml(
                        t("noFiltered")
                    )}
                </td>

            </tr>

        `;

    } else {

        tbody.innerHTML =
            pageRecords
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    getFormNumber(
                                        record
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    getPersonName(
                                        record
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    getFatherName(
                                        record
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    categoryLabel(
                                        getCategory(
                                            record
                                        )
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    provinceLabel(
                                        getOriginalProvince(
                                            record
                                        )
                                    )
                                )}
                            </td>


                            <td>

                                <span
                                    class="badge ${
                                        record.fraudulent === true
                                            ? "badge-danger"
                                            : "badge-success"
                                    }"
                                >
                                    ${escapeHtml(
                                        getStatus(
                                            record
                                        )
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHtml(
                                    formatRecordDate(
                                        record.createdAt ||
                                        record.updatedAt
                                    )
                                )}
                            </td>


                            <td>

                                <button
                                    type="button"
                                    class="btn btn-secondary btn-small report-view-btn"
                                    data-id="${escapeHtml(
                                        record.id
                                    )}"
                                >
                                    ${escapeHtml(
                                        t("view")
                                    )}
                                </button>

                            </td>

                        </tr>

                    `
                )
                .join("");

    }


    const resultCount =
        $("resultCount");


    if (
        resultCount
    ) {

        resultCount.textContent =
            `${t("resultSummary")} ` +
            `${localNumber(
                pageRecords.length
            )} ` +
            `${t("totalFiltered")} ` +
            `${localNumber(
                total
            )} ` +
            `${t("rows")}`;

    }


    const totalFiltered =
        $("totalFiltered");


    if (
        totalFiltered
    ) {

        totalFiltered.textContent =
            localNumber(
                total
            );

    }


    const paginationInfo =
        $("paginationInfo");


    if (
        paginationInfo
    ) {

        paginationInfo.textContent =
            `${t("page")} ` +
            `${localNumber(
                state.currentPage
            )} ` +
            `${t("of")} ` +
            `${localNumber(
                totalPages
            )}`;

    }


    const previous =
        $("previousPageBtn");


    const next =
        $("nextPageBtn");


    if (previous) {

        previous.disabled =
            state.currentPage <=
            1;

    }


    if (next) {

        next.disabled =
            state.currentPage >=
            totalPages;

    }

}



// ==========================================
// Existing Reports
// ==========================================

function renderExistingReports() {

    renderCategoriesReport();

    renderProvincesReport();

    renderRecentReport();

}



// ==========================================
// Localized Static Text
// ==========================================

function applyLanguage() {

    const settings =
        state.settings ||
        getSettings() ||
        {};


    state.language =
        I18N[
            settings.language
        ]
            ? settings.language
            : "ps";


    document.documentElement.lang =
        state.language;


    if (
        settings.directionMode ===
        "ltr"
    ) {

        document.documentElement.dir =
            "ltr";

    } else if (
        settings.directionMode ===
        "rtl"
    ) {

        document.documentElement.dir =
            "rtl";

    } else {

        document.documentElement.dir =
            state.language ===
            "en"
                ? "ltr"
                : "rtl";

    }


    document.querySelectorAll(
        "[data-i18n]"
    )
    .forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n"
                );


            if (!key) {

                return;

            }


            element.textContent =
                t(key);

        }
    );


    document.querySelectorAll(
        "[data-i18n-title]"
    )
    .forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n-title"
                );


            element.setAttribute(
                "title",
                t(key)
            );

        }
    );


    document.querySelectorAll(
        "[data-i18n-aria]"
    )
    .forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n-aria"
                );


            element.setAttribute(
                "aria-label",
                t(key)
            );

        }
    );


    document.querySelectorAll(
        "[data-i18n-placeholder]"
    )
    .forEach(
        element => {

            const key =
                element.getAttribute(
                    "data-i18n-placeholder"
                );


            element.setAttribute(
                "placeholder",
                t(key)
            );

        }
    );


    document.querySelectorAll(
        "[data-system-name]"
    )
    .forEach(
        element => {

            element.textContent =
                settings.systemName ||
                SYSTEM_NAME;

        }
    );


    document.title =
        `${t("reportsTitle")
            .replace(
                /^📙\s*/,
                ""
            )} - ${
            settings.systemName ||
            SYSTEM_NAME
        }`;


    renderLocalizedControls();

    fillFilterOptions();

    renderStats();

    renderExistingReports();

    applyFilters();

}



// ==========================================
// Load
// ==========================================

async function loadReports() {

    try {

        hideMessage();


        if (
            $("categoryBadge")
        ) {

            $("categoryBadge").textContent =
                t("loading");

        }


        if (
            $("provinceBadge")
        ) {

            $("provinceBadge").textContent =
                t("loading");

        }


        if (
            $("recentBadge")
        ) {

            $("recentBadge").textContent =
                t("loading");

        }


        const records =
            await fetchRecords();


        state.allRecords =
            records;


        renderStats();

        fillFilterOptions();

        renderLocalizedControls();

        applyFilters();

        renderExistingReports();


    } catch (error) {

        console.error(
            "Reports Load Error:",
            error
        );


        state.allRecords =
            [];

        state.filteredRecords =
            [];


        renderStats();

        renderFilteredTable();


        const categoryBody =
            $("categoryTableBody");


        const provinceBody =
            $("provinceTableBody");


        const recentBody =
            $("recentTableBody");


        if (
            categoryBody
        ) {

            categoryBody.innerHTML = `

                <tr>

                    <td
                        colspan="2"
                        class="text-center"
                    >
                        ${escapeHtml(
                            t("noData")
                        )}
                    </td>

                </tr>

            `;

        }


        if (
            provinceBody
        ) {

            provinceBody.innerHTML = `

                <tr>

                    <td
                        colspan="2"
                        class="text-center"
                    >
                        ${escapeHtml(
                            t("noData")
                        )}
                    </td>

                </tr>

            `;

        }


        if (
            recentBody
        ) {

            recentBody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="text-center"
                    >
                        ${escapeHtml(
                            t("noData")
                        )}
                    </td>

                </tr>

            `;

        }


        if (
            $("categoryBadge")
        ) {

            $("categoryBadge").textContent =
                t("error");

        }


        if (
            $("provinceBadge")
        ) {

            $("provinceBadge").textContent =
                t("error");

        }


        if (
            $("recentBadge")
        ) {

            $("recentBadge").textContent =
                t("error");

        }


        showMessage(

            error?.code ===
            "permission-denied"

                ? t("noPermission")

                : t("loadError"),

            "danger"

        );

    }

}



// ==========================================
// Export CSV
// ==========================================

function buildExportRows() {

    return state.filteredRecords.map(
        record => [

            getFormNumber(
                record
            ),

            getPersonName(
                record
            ),

            getFatherName(
                record
            ),

            categoryLabel(
                getCategory(
                    record
                )
            ),

            provinceLabel(
                getOriginalProvince(
                    record
                )
            ),

            getStatus(
                record
            ),

            formatRecordDate(
                record.createdAt ||
                record.updatedAt
            )

        ]
    );

}



// ==========================================
// CSV Cell
// ==========================================

function csvCell(value) {

    return `"${String(
        value ?? ""
    ).replaceAll(
        '"',
        '""'
    )}"`;

}



// ==========================================
// Download
// ==========================================

function downloadFile(
    filename,
    content,
    type
) {

    const blob =
        new Blob(
            [content],
            {
                type:
                    type +
                    ";charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}



// ==========================================
// Export CSV
// ==========================================

function exportCSV() {

    const headers = [

        t("formNumber"),

        t("name"),

        t("fatherName"),

        t("category"),

        t("province"),

        t("status"),

        t("date")

    ];


    const rows = [

        headers,

        ...buildExportRows()

    ];


    const csvText =
        "\uFEFF" +
        rows
            .map(
                row =>
                    row
                        .map(csvCell)
                        .join(",")
            )
            .join("\r\n");


    downloadFile(

        `reports-${getDateKey(
            new Date()
        )}.csv`,

        csvText,

        "text/csv"

    );


    showMessage(
        t("exportDone"),
        "success"
    );

}



// ==========================================
// Export JSON
// ==========================================

function exportJSON() {

    const payload = {

        system:
            state.settings?.systemName ||
            SYSTEM_NAME,

        language:
            state.language,

        exportedAt:
            new Date().toISOString(),

        total:
            state.filteredRecords.length,

        records:
            state.filteredRecords

    };


    downloadFile(

        `reports-${getDateKey(
            new Date()
        )}.json`,

        JSON.stringify(
            payload,
            null,
            2
        ),

        "application/json"

    );


    showMessage(
        t("exportDone"),
        "success"
    );

}



// ==========================================
// Copy
// ==========================================

async function copyReport() {

    const rows =
        buildExportRows();


    const text = [

        [

            t("formNumber"),

            t("name"),

            t("fatherName"),

            t("category"),

            t("province"),

            t("status"),

            t("date")

        ].join("\t"),


        ...rows.map(
            row =>
                row.join("\t")
        )

    ].join("\n");


    try {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            throw new Error(
                "clipboard-unavailable"
            );

        }


        showMessage(
            t("copied"),
            "success"
        );


    } catch {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";


        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );


            showMessage(
                t("copied"),
                "success"
            );

        } catch {

            showMessage(
                t("copyFailed"),
                "danger"
            );

        }


        textarea.remove();

    }

}



// ==========================================
// Help
// ==========================================

function openHelp() {

    const modal =
        $("reportsHelpModal");


    if (!modal) {

        return;

    }


    $("reportsHelpTitle").textContent =
        t("helpTitle");


    $("reportsHelpBody").textContent =
        t("helpBody");


    modal.hidden =
        false;


    modal.classList.add(
        "show"
    );

}



// ==========================================
// Details
// ==========================================

function openDetails(id) {

    const record =
        state.allRecords.find(
            item =>
                item.id === id
        );


    if (!record) {

        showMessage(
            t("detailsError"),
            "danger"
        );

        return;

    }


    $("recordDetailsTitle").textContent =
        t("detailsTitle");


    const fields = [

        [
            "fieldForm",
            getFormNumber(record)
        ],

        [
            "fieldName",
            getPersonName(record)
        ],

        [
            "fieldFather",
            getFatherName(record)
        ],

        [
            "fieldCategory",
            categoryLabel(
                getCategory(record)
            )
        ],

        [
            "fieldProvince",
            provinceLabel(
                getOriginalProvince(record)
            )
        ],

        [
            "fieldCurrentProvince",
            provinceLabel(
                getCurrentProvince(record)
            )
        ],

        [
            "fieldJob",
            getCurrentJob(record)
        ],

        [
            "fieldTazkira",
            getTazkira(record)
        ],

        [
            "fieldPhone",
            getPhone(record)
        ],

        [
            "fieldStatus",
            getStatus(record)
        ],

        [
            "fieldFraud",
            record.fraudulent === true
                ? t("yes")
                : t("no")
        ],

        [
            "fieldCreatedAt",
            formatRecordDate(
                record.createdAt ||
                record.updatedAt
            )
        ]

    ];


    $("recordDetailsBody").innerHTML =
        fields
            .map(
                ([label, value]) => `

                    <div
                        style="
                            padding:12px;
                            border:1px solid var(--border-color);
                            border-radius:12px;
                            background:var(--surface-alt);
                        "
                    >

                        <div
                            style="
                                color:var(--muted-color);
                                font-size:12px;
                                margin-bottom:4px;
                                font-weight:700;
                            "
                        >
                            ${escapeHtml(
                                t(label)
                            )}
                        </div>


                        <div
                            style="
                                font-size:15px;
                                font-weight:800;
                                word-break:break-word;
                            "
                        >
                            ${escapeHtml(
                                safeText(
                                    value
                                )
                            )}
                        </div>

                    </div>

                `
            )
            .join("");


    const modal =
        $("recordDetailsModal");


    modal.hidden =
        false;


    modal.classList.add(
        "show"
    );

}



// ==========================================
// Close Modal
// ==========================================

function closeModal(id) {

    const modal =
        $(id);


    if (!modal) {

        return;

    }


    modal.hidden =
        true;


    modal.classList.remove(
        "show"
    );

}



// ==========================================
// Clear Filters
// ==========================================

function clearFilters() {

    [

        "reportSearch",

        "dateFrom",

        "dateTo"

    ]
    .forEach(
        id => {

            const element =
                $(id);


            if (element) {

                element.value =
                    "";

            }

        }
    );


    [

        "categoryFilter",

        "provinceFilter",

        "statusFilter",

        "fraudFilter"

    ]
    .forEach(
        id => {

            const element =
                $(id);


            if (element) {

                element.value =
                    "";

            }

        }
    );


    if (
        $("sortFilter")
    ) {

        $("sortFilter").value =
            "newest";

    }


    state.currentPage =
        1;


    applyFilters();

}



// ==========================================
// Pagination
// ==========================================

function goPreviousPage() {

    if (
        state.currentPage >
        1
    ) {

        state.currentPage -= 1;

        renderFilteredTable();

    }

}



function goNextPage() {

    const total =
        state.filteredRecords.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                state.pageSize
            )
        );


    if (
        state.currentPage <
        totalPages
    ) {

        state.currentPage += 1;

        renderFilteredTable();

    }

}



// ==========================================
// Events
// ==========================================

function bindEvents() {

    if (
        state.bound
    ) {

        return;

    }


    state.bound =
        true;


    // --------------------------------------
    // Header Refresh
    // --------------------------------------

    $("refreshBtn")
        ?.addEventListener(
            "click",
            () =>
                window.location.reload()
        );


    // --------------------------------------
    // Refresh Report
    // --------------------------------------

    $("refreshReportBtn")
        ?.addEventListener(
            "click",
            loadReports
        );


    // --------------------------------------
    // Logout
    // --------------------------------------

    $("logoutBtn")
        ?.addEventListener(
            "click",
            async () => {

                const button =
                    $("logoutBtn");


                button.disabled =
                    true;


                try {

                    const result =
                        await logoutUser();


                    if (
                        result?.success !==
                        false
                    ) {

                        window.location.replace(
                            "./login.html"
                        );

                        return;

                    }


                    showMessage(
                        result?.message ||
                        t("logout"),
                        "danger"
                    );


                } catch (
                    error
                ) {

                    console.error(
                        error
                    );


                    showMessage(
                        t("logout"),
                        "danger"
                    );

                } finally {

                    button.disabled =
                        false;

                }

            }
        );


    // --------------------------------------
    // Navigation
    // --------------------------------------

    const navigation = {

        dashboardMenuBtn:
            "./dashboard.html",

        formicMenuBtn:
            "./formic.html",

        registerMenuBtn:
            "./register.html",

        searchMenuBtn:
            "./search.html",

        reportsMenuBtn:
            "./reports.html",

        adminMenuBtn:
            "./admin.html",

        settingsMenuBtn:
            "./settings.html"

    };


    Object.entries(
        navigation
    )
    .forEach(
        ([id, url]) => {

            $(id)?.addEventListener(
                "click",
                () => {

                    window.location.href =
                        url;

                }
            );

        }
    );


    // --------------------------------------
    // Live Filters
    // --------------------------------------

    [

        "reportSearch",

        "categoryFilter",

        "provinceFilter",

        "statusFilter",

        "fraudFilter",

        "dateFrom",

        "dateTo",

        "sortFilter"

    ]
    .forEach(
        id => {

            const element =
                $(id);


            if (!element) {

                return;

            }


            element.addEventListener(
                "input",
                applyFilters
            );


            element.addEventListener(
                "change",
                applyFilters
            );

        }
    );


    // --------------------------------------
    // Page Size
    // --------------------------------------

    $("pageSizeSelect")
        ?.addEventListener(
            "change",
            event => {

                state.pageSize =
                    Number(
                        event.target.value
                    ) || 10;


                state.currentPage =
                    1;


                renderFilteredTable();

            }
        );


    // --------------------------------------
    // Pagination Buttons
    // --------------------------------------

    $("previousPageBtn")
        ?.addEventListener(
            "click",
            goPreviousPage
        );


    $("nextPageBtn")
        ?.addEventListener(
            "click",
            goNextPage
        );


    // --------------------------------------
    // Actions
    // --------------------------------------

    $("clearFiltersBtn")
        ?.addEventListener(
            "click",
            clearFilters
        );


    $("exportCsvBtn")
        ?.addEventListener(
            "click",
            exportCSV
        );


    $("exportJsonBtn")
        ?.addEventListener(
            "click",
            exportJSON
        );


    $("copyReportBtn")
        ?.addEventListener(
            "click",
            copyReport
        );


    $("printReportBtn")
        ?.addEventListener(
            "click",
            () =>
                window.print()
        );


    $("reportsHelpBtn")
        ?.addEventListener(
            "click",
            openHelp
        );


    // --------------------------------------
    // Detail View
    // --------------------------------------

    $("filteredTableBody")
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".report-view-btn"
                    );


                if (!button) {

                    return;

                }


                openDetails(
                    button.dataset.id
                );

            }
        );


    // --------------------------------------
    // Close Help
    // --------------------------------------

    $("reportsHelpClose")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "reportsHelpModal"
                )
        );


    // --------------------------------------
    // Close Details
    // --------------------------------------

    $("recordDetailsClose")
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "recordDetailsModal"
                )
        );


    // --------------------------------------
    // Click Overlay
    // --------------------------------------

    $("reportsHelpModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("reportsHelpModal")
                ) {

                    closeModal(
                        "reportsHelpModal"
                    );

                }

            }
        );


    $("recordDetailsModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("recordDetailsModal")
                ) {

                    closeModal(
                        "recordDetailsModal"
                    );

                }

            }
        );


    // --------------------------------------
    // Escape
    // --------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal(
                    "reportsHelpModal"
                );

                closeModal(
                    "recordDetailsModal"
                );

            }

        }
    );

}



// ==========================================
// Bootstrap
// ==========================================

async function bootstrapReports() {

    bindEvents();


    /*
       Settings ستونزه باید Reports ونه دروي.
    */

    try {

        state.settings =
            await initializeSettings();

    } catch (
        error
    ) {

        console.warn(
            "Reports Settings Initialize Error:",
            error
        );


        try {

            state.settings =
                getSettings();

        } catch {

            state.settings = {};

        }

    }


    if (
        !state.settings
    ) {

        try {

            state.settings =
                getSettings();

        } catch {

            state.settings = {};

        }

    }


    applyLanguage();


    // --------------------------------------
    // Settings Live Event
    // --------------------------------------

    window.addEventListener(
        "krha-settings-changed",
        event => {

            state.settings =
                event.detail?.settings ||
                getSettings() ||
                state.settings;


            applyLanguage();

        }
    );


    // --------------------------------------
    // Storage Change
    // --------------------------------------

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key &&
                event.key.includes(
                    "settings"
                )
            ) {

                try {

                    state.settings =
                        getSettings() ||
                        state.settings;


                    applyLanguage();

                } catch {

                    // Safe ignore

                }

            }

        }
    );


    // --------------------------------------
    // Authentication
    // --------------------------------------

    listenAuth(
        async session => {

            if (!session) {

                window.location.replace(
                    "./login.html"
                );

                return;

            }


            await loadReports();

        }
    );

}



// ==========================================
// Start
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    bootstrapReports,
    {
        once: true
    }
);