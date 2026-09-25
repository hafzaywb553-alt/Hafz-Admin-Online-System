// =========================================================
// د افغانستان اسلامي امارت د کره کمیسیون
// د فورمو د ثبت او مدیریت ډیټابیس
// مسلک او زده کړې - Online Professional & Education Module
// =========================================================

import {
    auth,
    db
} from "../firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    initializeSettings,
    getSettings
} from "../settings.js";

import {
    logoutUser
} from "../auth.js";

import {
    writeAudit,
    AUDIT_ACTIONS
} from "../audit.js";


// =========================================================
// ثابت معلومات
// =========================================================

const RECORDS_COLLECTION = "records";
const ADMINS_COLLECTION = "admins";
const PROFESSIONAL_EDUCATION_KEY = "professionalEducation";


// =========================================================
// ژبې
// =========================================================

const I18N = {

    ps: {

        pageTitle:
            "🎓 مسلک او زده کړې",

        pageDescription:
            "د ثبت شوو کسانو مسلکونه، عصري او دیني زده کړې، مسلکي او نور سندونه په منظم او آنلاین ډول ثبت، سمبال او راپور کړئ.",

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

        professionalEducation:
            "مسلک او زده کړې",

        admin:
            "اډمــینانوبرخه",

        settings:
            "تنظیمات",

        refresh:
            "ریفریش",

        logout:
            "وتل",

        statsPersons:
            "👥 ټول ثبت شوي کسان",

        statsProfessions:
            "🛠️ ټول مسلکونه",

        statsEducation:
            "📚 ټولې زده کړې",

        statsCertificates:
            "📜 ټول سندونه",

        personSearchTitle:
            "🔎 د ثبت شوي کس موندل",

        personSearchHint:
            "د فورم نمبر، تذکرې نمبر، نوم، د پلار نوم، ټیلیفون یا عمومي لټون له لارې کس پیدا کړئ.",

        searchBy:
            "د لټون بنسټ",

        searchAll:
            "ټول معلومات",

        formNumber:
            "فورم نمبر",

        tazkira:
            "تذکره",

        name:
            "نوم",

        fatherName:
            "د پلار نوم",

        grandfatherName:
            "د نیکه نوم",

        birthDate:
            "د زېږېدو نېټه",

        category:
            "کټګوري",

        phone:
            "ټیلیفون",

        searchValue:
            "د لټون معلومات",

        searchPlaceholder:
            "مثلاً د فورم نمبر یا نوم",

        clear:
            "پاکول",

        noResults:
            "هیڅ مناسب کس ونه موندل شو.",

        enterSearch:
            "د کس د موندلو لپاره د لټون معلومات ولیکئ.",

        results:
            "پایلې",

        select:
            "ټاکل",

        personProfile:
            "د شخص بشپړ شهرت",

        originalPlace:
            "اصلي ځای",

        currentPlace:
            "اوسنی ځای",

        currentJob:
            "اوسنی دنده",

        recordState:
            "د ثبت حالت",

        open:
            "خلاص",

        locked:
            "قفل",

        role:
            "صلاحیت",

        readonly:
            "یوازې د کتلو اجازه",

        professions:
            "🛠️ مسلکونه",

        modernEducation:
            "📚 عصري زده کړې",

        religiousEducation:
            "🕌 دیني زده کړې",

        certificates:
            "📜 سندونه",

        report:
            "📊 راپور",

        professionsHint:
            "د ټاکل شوي کس ټول مسلکونه او کاري مهارتونه ثبت کړئ.",

        modernEducationHint:
            "ښوونځی، پوهنتون، مسلکي زده کړه، کورسونه او نورې عصري زده کړې ثبت کړئ.",

        religiousEducationHint:
            "حفظ، تجوید، مدرسه، عالمیه، تخصص او نورې دیني زده کړې ثبت کړئ.",

        certificatesHint:
            "عصري، مسلکي، روزنیز او نور سندونه د سند نمبر او ادارې سره ثبت کړئ.",

        addNew:
            "نوی ثبت",

        edit:
            "سمون",

        delete:
            "ړنګول",

        noEntries:
            "تر اوسه کوم معلومات نه دي ثبت شوي.",

        reportHint:
            "ټول ثبت شوي مسلکونه، زده کړې او سندونه د شخص له بشپړ شهرت سره وګورئ.",

        reportType:
            "د راپور ډول",

        allTypes:
            "ټول",

        reportSearchLabel:
            "د راپور لټون",

        reportSearchPlaceholder:
            "د نوم، مسلک، ادارې، رشته یا سند نمبر له مخې",

        printReport:
            "چاپ",

        exportReport:
            "CSV راپور",

        recordType:
            "ډول",

        titleOrField:
            "مسلک / رشته / سند",

        levelOrType:
            "کچه / ډول",

        institution:
            "اداره / پوهنتون / مدرسه",

        location:
            "ځای",

        years:
            "کالونه",

        certificateNumber:
            "سند نمبر",

        reportCount:
            "د راپور پایلې",

        modalAdd:
            "نوی معلومات ثبت کړئ",

        modalEdit:
            "ثبت شوي معلومات سم کړئ",

        professionName:
            "د مسلک نوم",

        specialty:
            "تخصص / رشته",

        skillLevel:
            "د مهارت کچه",

        organization:
            "اړوند اداره / کارځای",

        startYear:
            "د پیل کال",

        experienceYears:
            "د تجربې کلونه",

        educationLevel:
            "د زده کړې کچه",

        educationField:
            "رشته / څانګه",

        institutionName:
            "اداره / پوهنتون / مدرسه",

        endYear:
            "د پای کال",

        educationStatus:
            "حالت",

        certificateTitle:
            "د سند نوم",

        certificateType:
            "د سند ډول",

        issuer:
            "صادره کوونکې اداره",

        certificateNo:
            "سند نمبر",

        issueDate:
            "د صادرېدو نېټه",

        expireDate:
            "د پای نېټه",

        note:
            "یادښت",

        save:
            "خوندي کول",

        cancel:
            "لغوه",

        selectPersonFirst:
            "لومړی یو ثبت شوی کس وټاکئ.",

        onlyAdminCanEdit:
            "یوازې اډمین او ستر اډمین د معلوماتو د ثبت او بدلون اجازه لري.",

        lockedRecordNoEdit:
            "دا Record قفل دی؛ عادي اډمین یې نه شي بدلولی. ستر اډمین کولای شي بدلون وکړي.",

        userReadonly:
            "ستاسو حساب یوازې د معلوماتو د کتلو اجازه لري.",

        saveSuccess:
            "معلومات په بریالیتوب سره خوندي شول.",

        deleteSuccess:
            "معلومات په بریالیتوب سره ړنګ شول.",

        saveError:
            "د معلوماتو د خوندي کولو پر مهال ستونزه رامنځته شوه.",

        loadError:
            "د آنلاین معلوماتو د لوستلو پر مهال ستونزه رامنځته شوه.",

        deleteConfirm:
            "ایا دا معلومات په رښتیا ړنګول غواړئ؟",

        required:
            "دا خانه اړینه ده.",

        reportEmpty:
            "د راپور لپاره کوم ثبت شوي معلومات ونه موندل شول.",

        dataLive:
            "🟢 آنلاین همغږي فعاله ده",

        roleSuperAdmin:
            "ستر اډمین",

        roleAdmin:
            "اډمین",

        roleUser:
            "کاروونکی",

        professionType:
            "مسلک",

        modernType:
            "عصري زده کړه",

        religiousType:
            "دیني زده کړه",

        certificateTypeRow:
            "سند",

        unknown:
            "—"

    },


    fa: {

        pageTitle:
            "🎓 مسلک و آموزش",

        pageDescription:
            "ثبت و مدیریت مسلک‌ها، تحصیلات عصری و دینی و اسناد اشخاص ثبت‌شده به شکل منظم و آنلاین.",

        mainMenu:
            "منوی اصلی",

        dashboard:
            "صفحه اصلی",

        formic:
            "فورمیک",

        newRegister:
            "ثبت جدید",

        search:
            "جستجو",

        reports:
            "گزارش‌ها",

        professionalEducation:
            "مسلک و آموزش",

        admin:
            "بخش ادمین",

        settings:
            "تنظیمات",

        refresh:
            "تازه‌سازی",

        logout:
            "خروج",

        statsPersons:
            "👥 تمام اشخاص ثبت‌شده",

        statsProfessions:
            "🛠️ تمام مسلک‌ها",

        statsEducation:
            "📚 تمام تحصیلات",

        statsCertificates:
            "📜 تمام اسناد",

        personSearchTitle:
            "🔎 یافتن شخص ثبت‌شده",

        personSearchHint:
            "شخص را بر اساس شماره فورم، شماره تذکره، نام، نام پدر، تلفن یا جستجوی عمومی پیدا کنید.",

        searchBy:
            "مبنای جستجو",

        searchAll:
            "تمام معلومات",

        formNumber:
            "شماره فورم",

        tazkira:
            "تذکره",

        name:
            "نام",

        fatherName:
            "نام پدر",

        grandfatherName:
            "نام پدرکلان",

        birthDate:
            "تاریخ تولد",

        category:
            "دسته‌بندی",

        phone:
            "تلفن",

        searchValue:
            "معلومات جستجو",

        searchPlaceholder:
            "مثلاً شماره فورم یا نام",

        clear:
            "پاک‌سازی",

        noResults:
            "شخص مناسب پیدا نشد.",

        enterSearch:
            "برای یافتن شخص، معلومات جستجو را وارد کنید.",

        results:
            "نتایج",

        select:
            "انتخاب",

        personProfile:
            "شهرت کامل شخص",

        originalPlace:
            "محل اصلی",

        currentPlace:
            "محل فعلی",

        currentJob:
            "وظیفه فعلی",

        recordState:
            "حالت ثبت",

        open:
            "باز",

        locked:
            "قفل",

        role:
            "صلاحیت",

        readonly:
            "فقط اجازه مشاهده",

        professions:
            "🛠️ مسلک‌ها",

        modernEducation:
            "📚 تحصیلات عصری",

        religiousEducation:
            "🕌 تحصیلات دینی",

        certificates:
            "📜 اسناد",

        report:
            "📊 گزارش",

        professionsHint:
            "تمام مسلک‌ها و مهارت‌های کاری شخص انتخاب‌شده را ثبت کنید.",

        modernEducationHint:
            "مکتب، پوهنتون، آموزش حرفه‌ای، کورس و دیگر تحصیلات عصری را ثبت کنید.",

        religiousEducationHint:
            "حفظ، تجوید، مدرسه، عالمیه، تخصص و دیگر تحصیلات دینی را ثبت کنید.",

        certificatesHint:
            "اسناد عصری، حرفه‌ای، آموزشی و دیگر اسناد را با شماره سند و اداره ثبت کنید.",

        addNew:
            "ثبت جدید",

        edit:
            "ویرایش",

        delete:
            "حذف",

        noEntries:
            "تا هنوز معلوماتی ثبت نشده است.",

        reportHint:
            "تمام مسلک‌ها، تحصیلات و اسناد را همراه با شهرت کامل شخص مشاهده کنید.",

        reportType:
            "نوع گزارش",

        allTypes:
            "همه",

        reportSearchLabel:
            "جستجوی گزارش",

        reportSearchPlaceholder:
            "بر اساس نام، مسلک، اداره، رشته یا شماره سند",

        printReport:
            "چاپ",

        exportReport:
            "گزارش CSV",

        recordType:
            "نوع",

        titleOrField:
            "مسلک / رشته / سند",

        levelOrType:
            "سطح / نوع",

        institution:
            "اداره / پوهنتون / مدرسه",

        location:
            "محل",

        years:
            "سال‌ها",

        certificateNumber:
            "شماره سند",

        reportCount:
            "نتایج گزارش",

        modalAdd:
            "معلومات جدید را ثبت کنید",

        modalEdit:
            "معلومات ثبت‌شده را ویرایش کنید",

        professionName:
            "نام مسلک",

        specialty:
            "تخصص / رشته",

        skillLevel:
            "سطح مهارت",

        organization:
            "اداره / محل کار",

        startYear:
            "سال آغاز",

        experienceYears:
            "سال‌های تجربه",

        educationLevel:
            "سطح تحصیل",

        educationField:
            "رشته / بخش",

        institutionName:
            "اداره / پوهنتون / مدرسه",

        endYear:
            "سال پایان",

        educationStatus:
            "حالت",

        certificateTitle:
            "نام سند",

        certificateType:
            "نوع سند",

        issuer:
            "اداره صادرکننده",

        certificateNo:
            "شماره سند",

        issueDate:
            "تاریخ صدور",

        expireDate:
            "تاریخ پایان",

        note:
            "یادداشت",

        save:
            "ذخیره",

        cancel:
            "لغوه",

        selectPersonFirst:
            "ابتدا یک شخص ثبت‌شده را انتخاب کنید.",

        onlyAdminCanEdit:
            "فقط ادمین و ستر ادمین اجازه ثبت و تغییر معلومات را دارند.",

        lockedRecordNoEdit:
            "این Record قفل است؛ ادمین عادی نمی‌تواند آن را تغییر دهد. ستر ادمین می‌تواند.",

        userReadonly:
            "حساب شما فقط اجازه مشاهده معلومات را دارد.",

        saveSuccess:
            "معلومات با موفقیت ذخیره شد.",

        deleteSuccess:
            "معلومات با موفقیت حذف شد.",

        saveError:
            "در زمان ذخیره معلومات مشکل ایجاد شد.",

        loadError:
            "در زمان خواندن معلومات آنلاین مشکل ایجاد شد.",

        deleteConfirm:
            "آیا واقعاً می‌خواهید این معلومات حذف شود؟",

        required:
            "این خانه ضروری است.",

        reportEmpty:
            "معلوماتی برای گزارش پیدا نشد.",

        dataLive:
            "🟢 همگام‌سازی آنلاین فعال است",

        roleSuperAdmin:
            "ستر ادمین",

        roleAdmin:
            "ادمین",

        roleUser:
            "کاربر",

        professionType:
            "مسلک",

        modernType:
            "تحصیل عصری",

        religiousType:
            "تحصیل دینی",

        certificateTypeRow:
            "سند",

        unknown:
            "—"

    },


    ur: {

        pageTitle:
            "🎓 پیشہ اور تعلیم",

        pageDescription:
            "رجسٹر شدہ افراد کے پیشے، جدید و دینی تعلیم اور اسناد منظم اور آن لائن انداز میں درج کریں۔",

        mainMenu:
            "مرکزی مینو",

        dashboard:
            "ہوم",

        formic:
            "فارمیک",

        newRegister:
            "نیا اندراج",

        search:
            "تلاش",

        reports:
            "رپورٹس",

        professionalEducation:
            "پیشہ اور تعلیم",

        admin:
            "ایڈمن حصہ",

        settings:
            "ترتیبات",

        refresh:
            "ریفریش",

        logout:
            "خروج",

        statsPersons:
            "👥 تمام رجسٹر شدہ افراد",

        statsProfessions:
            "🛠️ تمام پیشے",

        statsEducation:
            "📚 تمام تعلیم",

        statsCertificates:
            "📜 تمام اسناد",

        personSearchTitle:
            "🔎 رجسٹر شدہ شخص تلاش کریں",

        personSearchHint:
            "فارم نمبر، شناختی نمبر، نام، والد کا نام، فون یا عمومی تلاش سے شخص تلاش کریں۔",

        searchBy:
            "تلاش کی بنیاد",

        searchAll:
            "تمام معلومات",

        formNumber:
            "فارم نمبر",

        tazkira:
            "شناختی نمبر",

        name:
            "نام",

        fatherName:
            "والد کا نام",

        grandfatherName:
            "دادا کا نام",

        birthDate:
            "تاریخ پیدائش",

        category:
            "زمرہ",

        phone:
            "فون",

        searchValue:
            "تلاش کی معلومات",

        searchPlaceholder:
            "مثلاً فارم نمبر یا نام",

        clear:
            "صاف کریں",

        noResults:
            "مناسب شخص نہیں ملا۔",

        enterSearch:
            "شخص تلاش کرنے کے لیے معلومات لکھیں۔",

        results:
            "نتائج",

        select:
            "منتخب",

        personProfile:
            "شخص کی مکمل معلومات",

        originalPlace:
            "اصل مقام",

        currentPlace:
            "موجودہ مقام",

        currentJob:
            "موجودہ کام",

        recordState:
            "رجسٹری حالت",

        open:
            "کھلا",

        locked:
            "مقفل",

        role:
            "اختیار",

        readonly:
            "صرف دیکھنے کی اجازت",

        professions:
            "🛠️ پیشے",

        modernEducation:
            "📚 جدید تعلیم",

        religiousEducation:
            "🕌 دینی تعلیم",

        certificates:
            "📜 اسناد",

        report:
            "📊 رپورٹ",

        professionsHint:
            "منتخب شخص کے تمام پیشے اور کام کے ہنر درج کریں۔",

        modernEducationHint:
            "اسکول، یونیورسٹی، پیشہ ورانہ تعلیم اور دیگر جدید تعلیم درج کریں۔",

        religiousEducationHint:
            "حفظ، تجوید، مدرسہ اور دیگر دینی تعلیم درج کریں۔",

        certificatesHint:
            "جدید، پیشہ ورانہ اور دیگر اسناد نمبر اور ادارے کے ساتھ درج کریں۔",

        addNew:
            "نیا اندراج",

        edit:
            "ترمیم",

        delete:
            "حذف",

        noEntries:
            "ابھی تک کوئی معلومات درج نہیں ہوئی۔",

        reportHint:
            "تمام پیشے، تعلیم اور اسناد مکمل شخصی معلومات کے ساتھ دیکھیں۔",

        reportType:
            "رپورٹ کی قسم",

        allTypes:
            "سب",

        reportSearchLabel:
            "رپورٹ تلاش",

        reportSearchPlaceholder:
            "نام، پیشہ، ادارہ، شعبہ یا سند نمبر",

        printReport:
            "پرنٹ",

        exportReport:
            "CSV رپورٹ",

        recordType:
            "قسم",

        titleOrField:
            "پیشہ / شعبہ / سند",

        levelOrType:
            "سطح / قسم",

        institution:
            "ادارہ / یونیورسٹی / مدرسہ",

        location:
            "مقام",

        years:
            "سال",

        certificateNumber:
            "سند نمبر",

        reportCount:
            "رپورٹ نتائج",

        modalAdd:
            "نئی معلومات درج کریں",

        modalEdit:
            "درج شدہ معلومات میں ترمیم",

        professionName:
            "پیشہ کا نام",

        specialty:
            "تخصص / شعبہ",

        skillLevel:
            "مہارت کی سطح",

        organization:
            "ادارہ / کام کی جگہ",

        startYear:
            "آغاز کا سال",

        experienceYears:
            "تجربہ کے سال",

        educationLevel:            "تعلیم کی سطح",

        educationField:
            "شعبہ / مضمون",

        institutionName:
            "ادارہ / یونیورسٹی / مدرسہ",

        endYear:
            "اختتام کا سال",

        educationStatus:
            "حالت",

        certificateTitle:
            "سند کا نام",

        certificateType:
            "سند کی قسم",

        issuer:
            "جاری کرنے والا ادارہ",

        certificateNo:
            "سند نمبر",

        issueDate:
            "جاری ہونے کی تاریخ",

        expireDate:
            "اختتام کی تاریخ",

        note:
            "نوٹ",

        save:
            "محفوظ کریں",

        cancel:
            "منسوخ",

        selectPersonFirst:
            "پہلے ایک رجسٹر شدہ شخص منتخب کریں۔",

        onlyAdminCanEdit:
            "صرف ایڈمن اور ستر ایڈمن معلومات درج یا تبدیل کر سکتے ہیں۔",

        lockedRecordNoEdit:
            "یہ ریکارڈ مقفل ہے؛ عام ایڈمن اسے تبدیل نہیں کر سکتا۔",

        userReadonly:
            "آپ کے اکاؤنٹ کو صرف دیکھنے کی اجازت ہے۔",

        saveSuccess:
            "معلومات کامیابی سے محفوظ ہوگئیں۔",

        deleteSuccess:
            "معلومات کامیابی سے حذف ہوگئیں۔",

        saveError:
            "معلومات محفوظ کرتے وقت مسئلہ پیش آیا۔",

        loadError:
            "آن لائن معلومات پڑھتے وقت مسئلہ پیش آیا۔",

        deleteConfirm:
            "کیا آپ واقعی یہ معلومات حذف کرنا چاہتے ہیں؟",

        required:
            "یہ خانہ ضروری ہے۔",

        reportEmpty:
            "رپورٹ کے لیے کوئی معلومات نہیں ملیں۔",

        dataLive:
            "🟢 آن لائن ہم آہنگی فعال ہے",

        roleSuperAdmin:
            "ستر ایڈمن",

        roleAdmin:
            "ایڈمن",

        roleUser:
            "صارف",

        professionType:
            "پیشہ",

        modernType:
            "جدید تعلیم",

        religiousType:
            "دینی تعلیم",

        certificateTypeRow:
            "سند",

        unknown:
            "—"

    },


    ar: {

        pageTitle:
            "🎓 المهن والتعليم",

        pageDescription:
            "تسجيل وإدارة المهن والتعليم العصري والديني والشهادات للأشخاص المسجلين بطريقة منظمة وعبر الإنترنت.",

        mainMenu:
            "القائمة الرئيسية",

        dashboard:
            "الرئيسية",

        formic:
            "فورميك",

        newRegister:
            "تسجيل جديد",

        search:
            "بحث",

        reports:
            "التقارير",

        professionalEducation:
            "المهن والتعليم",

        admin:
            "قسم الإدارة",

        settings:
            "الإعدادات",

        refresh:
            "تحديث",

        logout:
            "خروج",

        statsPersons:
            "👥 جميع الأشخاص المسجلين",

        statsProfessions:
            "🛠️ جميع المهن",

        statsEducation:
            "📚 جميع التعليم",

        statsCertificates:
            "📜 جميع الشهادات",

        personSearchTitle:
            "🔎 العثور على شخص مسجل",

        personSearchHint:
            "العثور على الشخص بواسطة رقم الاستمارة أو الهوية أو الاسم أو اسم الأب أو الهاتف أو البحث العام.",

        searchBy:
            "أساس البحث",

        searchAll:
            "كل المعلومات",

        formNumber:
            "رقم الاستمارة",

        tazkira:
            "رقم الهوية",

        name:
            "الاسم",

        fatherName:
            "اسم الأب",

        grandfatherName:
            "اسم الجد",

        birthDate:
            "تاريخ الميلاد",

        category:
            "التصنيف",

        phone:
            "الهاتف",

        searchValue:
            "بيانات البحث",

        searchPlaceholder:
            "مثلاً رقم الاستمارة أو الاسم",

        clear:
            "مسح",

        noResults:
            "لم يتم العثور على شخص مناسب.",

        enterSearch:
            "أدخل بيانات البحث للعثور على الشخص.",

        results:
            "النتائج",

        select:
            "اختيار",

        personProfile:
            "بيانات الشخص الكاملة",

        originalPlace:
            "المكان الأصلي",

        currentPlace:
            "المكان الحالي",

        currentJob:
            "العمل الحالي",

        recordState:
            "حالة السجل",

        open:
            "مفتوح",

        locked:
            "مقفل",

        role:
            "الصلاحية",

        readonly:
            "صلاحية العرض فقط",

        professions:
            "🛠️ المهن",

        modernEducation:
            "📚 التعليم العصري",

        religiousEducation:
            "🕌 التعليم الديني",

        certificates:
            "📜 الشهادات",

        report:
            "📊 التقرير",

        professionsHint:
            "تسجيل جميع المهن والمهارات العملية للشخص المحدد.",

        modernEducationHint:
            "تسجيل المدرسة والجامعة والتعليم المهني والدورات وغيرها.",

        religiousEducationHint:
            "تسجيل الحفظ والتجويد والمدرسة والعالمية والتخصص وغيرها.",

        certificatesHint:
            "تسجيل الشهادات الحديثة والمهنية والتدريبية وغيرها مع الرقم والجهة.",

        addNew:
            "تسجيل جديد",

        edit:
            "تعديل",

        delete:
            "حذف",

        noEntries:
            "لم يتم تسجيل أي معلومات بعد.",

        reportHint:
            "عرض جميع المهن والتعليم والشهادات مع بيانات الشخص الكاملة.",

        reportType:
            "نوع التقرير",

        allTypes:
            "الكل",

        reportSearchLabel:
            "بحث التقرير",

        reportSearchPlaceholder:
            "حسب الاسم أو المهنة أو الجهة أو التخصص أو رقم الشهادة",

        printReport:
            "طباعة",

        exportReport:
            "تقرير CSV",

        recordType:
            "النوع",

        titleOrField:
            "المهنة / التخصص / الشهادة",

        levelOrType:
            "المستوى / النوع",

        institution:
            "الجهة / الجامعة / المدرسة",

        location:
            "المكان",

        years:
            "السنوات",

        certificateNumber:
            "رقم الشهادة",

        reportCount:
            "نتائج التقرير",

        modalAdd:
            "تسجيل معلومات جديدة",

        modalEdit:
            "تعديل المعلومات المسجلة",

        professionName:
            "اسم المهنة",

        specialty:
            "التخصص",

        skillLevel:
            "مستوى المهارة",

        organization:
            "الجهة / مكان العمل",

        startYear:
            "سنة البداية",

        experienceYears:
            "سنوات الخبرة",

        educationLevel:
            "المستوى التعليمي",

        educationField:
            "التخصص / القسم",

        institutionName:
            "الجهة / الجامعة / المدرسة",

        endYear:
            "سنة النهاية",

        educationStatus:
            "الحالة",

        certificateTitle:
            "اسم الشهادة",

        certificateType:
            "نوع الشهادة",

        issuer:
            "الجهة المصدرة",

        certificateNo:
            "رقم الشهادة",

        issueDate:
            "تاريخ الإصدار",

        expireDate:
            "تاريخ الانتهاء",

        note:
            "ملاحظة",

        save:
            "حفظ",

        cancel:
            "إلغاء",

        selectPersonFirst:
            "اختر أولاً شخصاً مسجلاً.",

        onlyAdminCanEdit:
            "فقط الإدارة ومدير النظام يمكنهما إضافة أو تعديل المعلومات.",

        lockedRecordNoEdit:
            "هذا السجل مقفل؛ لا يمكن للإدارة العادية تعديله.",

        userReadonly:
            "حسابك لديه صلاحية العرض فقط.",

        saveSuccess:
            "تم حفظ المعلومات بنجاح.",

        deleteSuccess:
            "تم حذف المعلومات بنجاح.",

        saveError:
            "حدثت مشكلة أثناء حفظ المعلومات.",

        loadError:
            "حدثت مشكلة أثناء قراءة المعلومات عبر الإنترنت.",

        deleteConfirm:
            "هل تريد حقاً حذف هذه المعلومات؟",

        required:
            "هذه الخانة مطلوبة.",

        reportEmpty:
            "لم يتم العثور على معلومات للتقرير.",

        dataLive:
            "🟢 المزامنة عبر الإنترنت مفعلة",

        roleSuperAdmin:
            "مدير النظام",

        roleAdmin:
            "إدارة",

        roleUser:
            "مستخدم",

        professionType:
            "مهنة",

        modernType:
            "تعليم عصري",

        religiousType:
            "تعليم ديني",

        certificateTypeRow:
            "شهادة",

        unknown:
            "—"

    },


    en: {

        pageTitle:
            "🎓 Professions & Education",

        pageDescription:
            "Register and manage professions, modern and religious education, and certificates for registered people in an organized online module.",

        mainMenu:
            "Main Menu",

        dashboard:
            "Dashboard",

        formic:
            "Formic",

        newRegister:
            "New Registration",

        search:
            "Search",

        reports:
            "Reports",

        professionalEducation:
            "Professions & Education",

        admin:
            "Admin",

        settings:
            "Settings",

        refresh:
            "Refresh",

        logout:
            "Logout",

        statsPersons:
            "👥 Registered People",

        statsProfessions:
            "🛠️ Professions",

        statsEducation:
            "📚 Education Records",

        statsCertificates:
            "📜 Certificates",

        personSearchTitle:
            "🔎 Find Registered Person",

        personSearchHint:
            "Find a person by form number, ID number, name, father's name, phone, or general search.",

        searchBy:
            "Search By",

        searchAll:
            "All Information",

        formNumber:
            "Form Number",

        tazkira:
            "ID Number",

        name:
            "Name",

        fatherName:
            "Father's Name",

        grandfatherName:
            "Grandfather",

        birthDate:
            "Birth Date",

        category:
            "Category",

        phone:
            "Phone",

        searchValue:
            "Search Information",

        searchPlaceholder:
            "For example form number or name",

        clear:
            "Clear",

        noResults:
            "No matching person found.",

        enterSearch:
            "Enter search information to find a person.",

        results:
            "Results",

        select:
            "Select",

        personProfile:
            "Full Person Profile",

        originalPlace:
            "Original Place",

        currentPlace:
            "Current Place",

        currentJob:
            "Current Job",

        recordState:
            "Record State",

        open:
            "Open",

        locked:
            "Locked",

        role:
            "Role",

        readonly:
            "View Only",

        professions:
            "🛠️ Professions",

        modernEducation:
            "📚 Modern Education",

        religiousEducation:
            "🕌 Religious Education",

        certificates:
            "📜 Certificates",

        report:
            "📊 Report",

        professionsHint:
            "Register all professions and work skills for the selected person.",

        modernEducationHint:
            "Register school, university, vocational training, courses, and other modern education.",

        religiousEducationHint:
            "Register memorization, tajweed, madrasa, Alimiyya, specialization, and other religious education.",

        certificatesHint:
            "Register modern, professional, training, and other certificates with number and issuer.",

        addNew:
            "Add New",

        edit:
            "Edit",

        delete:
            "Delete",

        noEntries:
            "No information has been registered yet.",

        reportHint:
            "View all professions, education, and certificates together with the full person profile.",

        reportType:
            "Report Type",

        allTypes:
            "All",

        reportSearchLabel:
            "Report Search",

        reportSearchPlaceholder:
            "By name, profession, institution, field, or certificate number",

        printReport:
            "Print",

        exportReport:
            "CSV Report",

        recordType:
            "Type",

        titleOrField:
            "Profession / Field / Certificate",

        levelOrType:
            "Level / Type",

        institution:
            "Institution / University / Madrasa",

        location:
            "Location",

        years:
            "Years",

        certificateNumber:
            "Certificate Number",

        reportCount:
            "Report Results",

        modalAdd:
            "Register New Information",

        modalEdit:
            "Edit Registered Information",

        professionName:
            "Profession Name",

        specialty:
            "Specialty / Field",

        skillLevel:
            "Skill Level",

        organization:
            "Organization / Workplace",

        startYear:
            "Start Year",

        experienceYears:
            "Years of Experience",

        educationLevel:
            "Education Level",

        educationField:
            "Field / Department",

        institutionName:
            "Institution / University / Madrasa",

        endYear:
            "End Year",

        educationStatus:
            "Status",

        certificateTitle:
            "Certificate Name",

        certificateType:
            "Certificate Type",

        issuer:
            "Issuing Institution",

        certificateNo:
            "Certificate Number",

        issueDate:
            "Issue Date",

        expireDate:
            "Expiry Date",

        note:
            "Note",

        save:
            "Save",

        cancel:
            "Cancel",

        selectPersonFirst:
            "Select a registered person first.",

        onlyAdminCanEdit:
            "Only Admin and Super Admin can add or change information.",

        lockedRecordNoEdit:
            "This record is locked; a regular Admin cannot change it.",

        userReadonly:
            "Your account has view-only permission.",

        saveSuccess:
            "Information saved successfully.",

        deleteSuccess:
            "Information deleted successfully.",

        saveError:
            "There was a problem saving the information.",

        loadError:
            "There was a problem reading the online information.",

        deleteConfirm:
            "Do you really want to delete this information?",

        required:
            "This field is required.",

        reportEmpty:
            "No information was found for the report.",

        dataLive:
            "🟢 Live online synchronization is active",

        roleSuperAdmin:
            "Super Admin",

        roleAdmin:
            "Admin",

        roleUser:
            "User",

        professionType:
            "Profession",

        modernType:
            "Modern Education",

        religiousType:
            "Religious Education",

        certificateTypeRow:
            "Certificate",

        unknown:
            "—"

    }

};


// =========================================================
// State
// =========================================================

const state = {

    settings:
        null,

    language:
        "ps",

    user:
        null,

    admin:
        null,

    role:
        "user",

    records:
        [],

    selectedRecordId:
        "",

    searchType:
        "all",

    searchText:
        "",

    activeTab:
        "professions",

    editing:
        null,

    unsubscribe:
        null,

    initialized:
        false

};


// =========================================================
// DOM
// =========================================================

const $ =
    id =>
        document.getElementById(
            id
        );


// =========================================================
// Translation
// =========================================================

function t(key) {

    const lang =
        I18N[state.language]
            ? state.language
            : "ps";

    return (
        I18N[lang]?.[key] ??
        I18N.ps?.[key] ??
        key
    );

}


function applyLanguage() {

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const key =
                element.getAttribute(
                    "data-i18n"
                );

            element.textContent =
                t(key);

        });


    document
        .querySelectorAll(
            "[data-i18n-placeholder]"
        )
        .forEach(element => {

            element.placeholder =
                t(
                    element.getAttribute(
                        "data-i18n-placeholder"
                    )
                );

        });


    document.title =
        t("pageTitle").replace(
            /^🎓\s*/,
            ""
        );


    renderSelectedPerson();

    renderCurrentLists();

    renderReport();

    renderSearchResults();

}


// =========================================================
// Text / data helpers
// =========================================================

function cleanText(value) {

    return String(
        value ?? ""
    )
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
        )
        .trim();

}


function normalizeDigits(value) {

    return cleanText(
        value
    )
        .replace(
            /[۰-۹]/g,
            d =>
                String(
                    "۰۱۲۳۴۵۶۷۸۹"
                        .indexOf(d)
                )
        )
        .replace(
            /[٠-٩]/g,
            d =>
                String(
                    "٠١٢٣٤٥٦٧٨٩"
                        .indexOf(d)
                )
        );

}


function normalizeSearch(value) {

    return normalizeDigits(
        value
    )
        .toLocaleLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function escapeHtml(value) {

    return String(
        value ?? ""    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function safeValue(value) {

    const text =
        cleanText(value);

    return text ||
        t("unknown");

}


function firstNonEmpty(...values) {

    for (
        const value
        of values
    ) {

        const text =
            cleanText(value);

        if (text) {

            return text;

        }

    }

    return "";

}


function normalizeArray(value) {

    return Array.isArray(
        value
    )
        ? value
        : [];

}


function normalizeProfessionalEducation(
    value
) {

    const raw =
        value &&
        typeof value ===
            "object"
        ? value
        : {};

    return {

        ...raw,

        schemaVersion:
            Number(
                raw.schemaVersion ??
                1
            ),

        professions:
            normalizeArray(
                raw.professions
            ),

        modernEducation:
            normalizeArray(
                raw.modernEducation
            ),

        religiousEducation:
            normalizeArray(
                raw.religiousEducation
            ),

        certificates:
            normalizeArray(
                raw.certificates
            )

    };

}


function getNestedPerson(record) {

    return (
        record?.person &&
        typeof record.person ===
            "object"
    )
        ? record.person
        : {};

}


function getFormNumber(record) {

    return firstNonEmpty(
        record?.formNumber,
        getNestedPerson(
            record
        )?.formNumber
    );

}


function getFirstName(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.firstName,
        person.firstName
    );

}


function getLastName(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.lastName,
        person.lastName
    );

}


function getFatherName(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.fatherName,
        person.fatherName
    );

}


function getGrandfatherName(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.grandfatherName,
        person.grandfatherName
    );

}


function getTazkira(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.tazkira,
        person.tazkira,
        record?.electronicTazkiraNumber
    );

}


function getPhone(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.phone,
        person.phone
    );

}


function getBirthDate(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.birthDate,
        person.birthDate
    );

}


function getCurrentJob(record) {

    const person =
        getNestedPerson(
            record
        );

    return firstNonEmpty(
        record?.currentJob,
        person.currentJob
    );

}


function getCategory(record) {

    return firstNonEmpty(
        record?.category,
        record?.person?.category
    );

}


function getLocationPart(
    record,
    type,
    key
) {

    const root =
        type === "original"
            ? record?.originalLocation
            : record?.currentLocation;

    const fallbackPrefix =
        type === "original"
            ? "original"
            : "current";

    return firstNonEmpty(
        root?.[key],
        record?.[
            `${fallbackPrefix}${key
                .charAt(0)
                .toUpperCase()}${key.slice(1)}`
        ]
    );

}


function getFullLocation(
    record,
    type
) {

    const province =
        getLocationPart(
            record,
            type,
            "province"
        );

    const district =
        getLocationPart(
            record,
            type,
            "district"
        );

    const village =
        getLocationPart(
            record,
            type,
            "village"
        );

    return [
        province,
        district,
        village
    ]
        .filter(Boolean)
        .join(
            " • "
        );

}


function getPersonName(record) {

    const parts = [

        getFirstName(
            record
        ),

        getLastName(
            record
        )

    ]
        .filter(Boolean);


    return (
        parts.join(
            " "
        ) ||
        t("unknown")
    );

}


function formatDate(value) {

    if (!value) {

        return t(
            "unknown"
        );

    }

    let date =
        null;


    if (
        typeof value?.toDate ===
        "function"
    ) {

        date =
            value.toDate();

    } else if (
        value instanceof
        Date
    ) {

        date =
            value;

    } else if (
        typeof value ===
        "number"
    ) {

        date =
            new Date(
                value
            );

    } else if (
        typeof value ===
        "string"
    ) {

        const parsed =
            new Date(
                value
            );

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            date =
                parsed;

        }

    }


    if (!date) {

        return safeValue(
            value
        );

    }


    try {

        const settings =
            state.settings ||
            {};

        return new Intl.DateTimeFormat(

            state.language === "en"

                ? "en-US"

                : state.language === "fa"

                    ? "fa-AF"

                    : state.language === "ur"

                        ? "ur-PK"

                        : state.language === "ar"

                            ? "ar-AF"

                            : "ps-AF",

            {

                dateStyle:
                    settings.dateFormat ===
                        "short"

                        ? "short"

                        : settings.dateFormat ===
                            "long"

                            ? "long"

                            : "medium",

                timeZone:
                    settings.timeZone ||
                    "Asia/Kabul"

            }

        ).format(
            date
        );

    } catch {

        return date.toLocaleDateString();

    }

}


function roleLabel(role) {

    if (
        role ===
        "superadmin"
    ) {

        return t(
            "roleSuperAdmin"
        );

    }

    if (
        role ===
        "admin"
    ) {

        return t(
            "roleAdmin"
        );

    }

    return t(
        "roleUser"
    );

}


function canEditSelectedRecord() {

    const record =
        getSelectedRecord();

    if (!record) {

        return false;

    }


    if (
        state.role ===
        "superadmin"
    ) {

        return true;

    }


    if (
        state.role !==
        "admin"
    ) {

        return false;

    }


    return (
        record.editable !==
        false
    );

}


function getSelectedRecord() {

    return state.records.find(
        record =>
            record.id ===
            state.selectedRecordId
    ) || null;

}


function getSelectedData() {

    const record =
        getSelectedRecord();

    return record

        ? normalizeProfessionalEducation(
            record[
                PROFESSIONAL_EDUCATION_KEY
            ]
        )

        : normalizeProfessionalEducation();

}


function showMessage(
    message,
    type = "success"
) {

    const box =
        $("pageMessage");

    if (!box) {
        return;
    }

    box.textContent =
        message;

    box.className =
        `alert alert-${type}`;

    box.style.display =
        "block";


    window.clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        window.setTimeout(
            () => {

                box.style.display =
                    "none";

            },
            4200
        );

}


// =========================================================
// Settings / Language
// =========================================================

async function initializeSystemSettings() {

    try {

        state.settings =
            await initializeSettings();

    } catch (error) {

        console.error(
            "Professional Education Settings Error:",
            error
        );

        state.settings =
            getSettings() ||
            {};

    }


    state.language =
        state.settings?.language ||
        document.documentElement.lang ||
        "ps";


    if (
        !I18N[
            state.language
        ]
    ) {

        state.language =
            "ps";

    }


    applyLanguage();

}


window.addEventListener(
    "krha-settings-applied",
    event => {

        const incoming =
            event.detail?.settings ||
            {};


        state.settings = {

            ...(
                state.settings ||
                {}
            ),

            ...incoming

        };


        state.language =
            incoming.language ||
            state.language ||
            "ps";


        if (
            !I18N[
                state.language
            ]
        ) {

            state.language =
                "ps";

        }


        applyLanguage();

    }
);


// =========================================================
// Navigation
// =========================================================

function go(url) {

    window.location.href =
        url;

}


function bindNavigation() {

    const links = {

        dashboardMenuBtn:
            "/dashboard.html",

        formicMenuBtn:
            "/formic.html",

        registerMenuBtn:
            "/register.html",

        searchMenuBtn:
            "/search.html",

        reportsMenuBtn:
            "/reports.html",

        professionalEducationMenuBtn:
            "/profession-education/profession-education.html",

        adminMenuBtn:
            "/admin.html",

        settingsMenuBtn:
            "/settings.html"

    };


    Object.entries(
        links
    ).forEach(
        ([id, url]) => {

            $(
                id
            )?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    go(
                        url
                    );

                }
            );

        }
    );


    $("refreshBtn")
        ?.addEventListener(
            "click",
            () =>
                window.location.reload()
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            async () => {

                const button =
                    $("logoutBtn");

                if (button) {

                    button.disabled =
                        true;

                }


                try {

                    const result =
                        await logoutUser();

                    if (
                        result?.success
                    ) {

                        go(
                            "../index.html"
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
                        "Logout Error:",
                        error
                    );


                    showMessage(
                        t("logout"),
                        "danger"
                    );

                } finally {

                    if (button) {

                        button.disabled =
                            false;

                    }

                }

            }
        );

}


// =========================================================
// Auth / permissions
// =========================================================

async function loadCurrentAdmin(
    user
) {

    if (!user) {

        return null;

    }


    try {

        const ref =
            doc(
                db,
                ADMINS_COLLECTION,
                user.uid
            );


        const snapshot =
            await getDoc(
                ref
            );


        if (
            !snapshot.exists()
        ) {

            return null;

        }


        const data =
            snapshot.data() ||
            {};


        if (
            data.active ===
            false
        ) {

            return null;

        }


        const role =
            cleanText(
                data.role
            )
                .toLowerCase();


        if (
            ![
                "superadmin",
                "admin",
                "user"
            ].includes(
                role
            )
        ) {

            return null;

        }


        return {

            ...data,

            uid:
                cleanText(
                    data.uid ||
                    user.uid
                ),

            email:
                cleanText(
                    data.email ||
                    user.email
                ),

            name:
                firstNonEmpty(

                    data.name,

                    data.displayName,

                    user.displayName,

                    user.email

                ),

            role

        };

    } catch (
        error
    ) {

        console.error(
            "Load Current Admin Error:",
            error
        );

        return null;
    }

}


async function ensureAuthenticated(
    user
) {

    state.user =
        user;


    if (!user) {

        go(
            "../index.html"
        );

        return false;

    }


    state.admin =
        await loadCurrentAdmin(
            user
        );


    if (!state.admin) {

        showMessage(
            "ستاسو اډمین حساب معتبر یا فعال نه دی.",
            "danger"
        );


        window.setTimeout(
            () =>
                go(
                    "../index.html"
                ),
            1400
        );


        return false;

    }


    state.role =
        state.admin.role ||
        "user";


    state.initialized =
        true;


    updatePermissionButtons();


    return true;

}


function updatePermissionButtons() {

    const canEdit =
        Boolean(
            getSelectedRecord() &&
            canEditSelectedRecord()
        );


    document
        .querySelectorAll(
            "[data-open-editor]"
        )
        .forEach(
            button => {

                button.disabled =
                    !canEdit;

            }
        );


    document
        .querySelectorAll(
            "[data-action='edit-item'], [data-action='delete-item']"
        )
        .forEach(
            button => {

                button.disabled =
                    !canEdit;

            }
        );

}


// =========================================================
// Realtime records
// =========================================================

function stopRecordsListener() {

    if (
        typeof state.unsubscribe ===
        "function"
    ) {

        state.unsubscribe();

    }

    state.unsubscribe =
        null;

}


function startRecordsListener() {

    stopRecordsListener();


    const recordsRef =
        collection(
            db,
            RECORDS_COLLECTION
        );


    state.unsubscribe =
        onSnapshot(

            recordsRef,

            snapshot => {

                state.records =
                    snapshot.docs.map(
                        currentDoc => ({

                            id:
                                currentDoc.id,

                            ...currentDoc.data()

                        })
                    );


                if (
                    state.selectedRecordId &&
                    !state.records.some(
                        record =>
                            record.id ===
                            state.selectedRecordId
                    )
                ) {

                    state.selectedRecordId =
                        "";

                }


                renderAll();

            },

            error => {

                console.error(
                    "Records Realtime Error:",
                    error
                );


                showMessage(
                    error?.message ||
                    t("loadError"),
                    "danger"
                );

            }

        );

}


// =========================================================
// Search
// =========================================================

function getSearchableValues(
    record
) {

    const person =
        getNestedPerson(
            record
        );


    return {

        formNumber:
            getFormNumber(
                record
            ),

        tazkira:
            getTazkira(
                record
            ),

        name:
            [

                getFirstName(
                    record
                ),

                getLastName(
                    record
                )

            ]
                .filter(Boolean)
                .join(
                    " "
                ),

        father:
            getFatherName(
                record
            ),

        phone:
            getPhone(
                record
            ),

        all:
            [

                getFormNumber(
                    record
                ),

                getTazkira(
                    record
                ),

                getFirstName(
                    record
                ),

                getLastName(
                    record
                ),

                getFatherName(
                    record
                ),

                getGrandfatherName(
                    record
                ),

                getPhone(
                    record
                ),

                getCategory(
                    record
                ),

                getCurrentJob(
                    record
                ),

                person.originalProvince,

                person.originalDistrict,

                person.originalVillage,

                person.currentProvince,

                person.currentDistrict,

                person.currentVillage

            ]
                .filter(Boolean)
                .join(
                    " "
                )

    };

}


function getMatchingRecords() {

    const search =
        normalizeSearch(
            state.searchText
        );


    if (!search) {

        return [];

    }


    return state.records

        .filter(
            record => {

                const values =
                    getSearchableValues(
                        record
                    );


                const target =
                    normalizeSearch(
                        values[
                            state.searchType
                        ] ||
                        values.all
                    );


                return target.includes(
                    search
                );

            }
        )

        .slice(
            0,
            60
        );

}


function renderSearchResults() {

    const box =
        $("searchResults");


    if (!box) {

        return;

    }


    const results =
        getMatchingRecords();


    if (!state.searchText) {

        box.innerHTML = `

            <div class="pe-empty">

                ${escapeHtml(
                    t("enterSearch")
                )}

            </div>

        `;

        return;

    }


    if (!results.length) {

        box.innerHTML = `

            <div class="pe-empty">

                ${escapeHtml(
                    t("noResults")
                )}

            </div>

        `;

        return;

    }


    box.innerHTML =
        results
            .map(
                record => `

                    <div
                        class="pe-result-item"
                    >

                        <div
                            class="pe-result-main"
                        >

                            <div
                                class="pe-result-name"
                            >
                                ${escapeHtml(
                                    getPersonName(
                                        record
                                    )
                                )}
                            </div>

                            <div
                                class="pe-result-meta"
                            >

                                ${escapeHtml(
                                    t("formNumber")
                                )}:

                                ${escapeHtml(
                                    safeValue(
                                        getFormNumber(
                                            record
                                        )
                                    )
                                )}

                                • ${escapeHtml(
                                    t("tazkira")
                                )}:

                                ${escapeHtml(
                                    safeValue(
                                        getTazkira(
                                            record
                                        )
                                    )
                                )}

                                • ${escapeHtml(
                                    t("fatherName")
                                )}:

                                ${escapeHtml(
                                    safeValue(
                                        getFatherName(
                                            record
                                        )
                                    )
                                )}

                            </div>

                        </div>


                        <button
                            type="button"
                            class="pe-btn pe-btn-primary"
                            data-select-record="${escapeHtml(record.id)}"
                        >
                            👤
                            ${escapeHtml(
                                t("select")
                            )}
                        </button>

                    </div>

                `
            )
            .join(
                ""
            );

}


function selectRecord(
    recordId
) {

    state.selectedRecordId =
        String(
            recordId ||
            ""
        );


    state.activeTab =
        "professions";


    renderAll();


    const section =
        $("selectedPersonSection");


    section?.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "start"

        }
    );

}


// =========================================================
// Person profile
// =========================================================

function renderSelectedPerson() {

    const section =
        $("selectedPersonSection");


    const box =
        $("selectedPersonProfile");


    const record =
        getSelectedRecord();


    if (!section || !box) {

        return;

    }


    if (!record) {

        section.classList.add(
            "pe-hidden"
        );

        box.innerHTML =
            "";

        updatePermissionButtons();

        return;

    }


    section.classList.remove(
        "pe-hidden"
    );


    const data =
        normalizeProfessionalEducation(
            record[
                PROFESSIONAL_EDUCATION_KEY
            ]
        );


    const educationCount =
        data.modernEducation.length +
        data.religiousEducation.length;


    const certificateCount =
        data.certificates.length;


    const locked =
        record.editable ===
        false;


    let permissionNote =
        "";


    if (
        state.role ===
        "user"
    ) {

        permissionNote =
            t(
                "userReadonly"
            );

    } else if (
        state.role ===
            "admin" &&
        locked
    ) {

        permissionNote =
            t(
                "lockedRecordNoEdit"
            );

    }


    box.innerHTML = `

        <div
            class="pe-profile-head"
        >

            <div>

                <h2
                    class="pe-profile-name"
                >

                    👤

                    ${escapeHtml(
                        getPersonName(
                            record
                        )
                    )}

                </h2>


                <div
                    class="pe-card-subtitle"
                >

                    ${escapeHtml(
                        t("personProfile")
                    )}

                </div>

            </div>


            <div
                style="
                    display:flex;
                    gap:7px;
                    flex-wrap:wrap;
                    align-items:center;
                "
            >

                <span
                    class="pe-role-badge"
                >

                    🛡️

                    ${escapeHtml(
                        roleLabel(
                            state.role
                        )
                    )}

                </span>


                <span
                    class="
                        pe-status-badge
                        ${
                            locked
                                ? "pe-status-locked"
                                : "pe-status-open"
                        }
                    "
                >

                    ${
                        locked
                            ? "🔒"
                            : "🟢"
                    }

                    ${escapeHtml(
                        locked
                            ? t("locked")
                            : t("open")
                    )}

                </span>


                <span
                    class="pe-count-badge"
                >

                    🛠️
                    ${data.professions.length}

                    &nbsp;

                    📚
                    ${educationCount}

                    &nbsp;

                    📜
                    ${certificateCount}

                </span>

            </div>

        </div>


        <div
            class="pe-profile-grid"
        >

            ${profileField(
                t("formNumber"),
                getFormNumber(
                    record
                )
            )}

            ${profileField(
                t("tazkira"),
                getTazkira(
                    record
                )
            )}

            ${profileField(
                t("fatherName"),
                getFatherName(
                    record
                )
            )}

            ${profileField(
                t("grandfatherName"),
                getGrandfatherName(
                    record
                )
            )}

            ${profileField(
                t("phone"),
                getPhone(
                    record
                )
            )}

            ${profileField(
                t("currentJob"),
                getCurrentJob(
                    record
                )
            )}

            ${profileField(
                t("originalPlace"),
                getFullLocation(
                    record,
                    "original"
                )
            )}

            ${profileField(
                t("currentPlace"),
                getFullLocation(
                    record,
                    "current"
                )
            )}

            ${profileField(
                t("category"),
                getCategory(
                    record
                )
            )}

            ${profileField(
                t("birthDate"),
                getBirthDate(
                    record
                )
            )}

        </div>


        ${
            permissionNote

                ? `

                    <div
                        class="pe-permission-note"
                    >

                        ⚠️

                        ${escapeHtml(
                            permissionNote
                        )}

                    </div>

                `

                : ""
        }


        <div
            style="
                display:flex;
                justify-content:flex-start;
                gap:8px;
                flex-wrap:wrap;
                margin-top:13px;
            "
        >

            <button
                type="button"
                class="pe-btn pe-btn-secondary"
                id="clearSelectedPersonBtn"
            >

                🔙

                ${escapeHtml(
                    t("clear")
                )}

            </button>


            <span
                style="
                    color:var(--muted-color);
                    font-size:12px;
                    font-weight:800;
                    align-self:center;
                "
            >

                ${escapeHtml(
                    t("dataLive")
                )}

            </span>

        </div>

    `;


    updatePermissionButtons();

}


function profileField(
    label,
    value
) {

    return `

        <div
            class="pe-profile-field"
        >

            <div
                class="pe-profile-field-label"
            >

                ${escapeHtml(
                    label
                )}

            </div>


            <div
                class="pe-profile-field-value"
            >

                ${escapeHtml(
                    safeValue(
                        value
                    )
                )}

            </div>

        </div>

    `;

}


// =========================================================
// Current lists
// =========================================================

function itemMeta(
    label,
    value
) {

    const text =
        cleanText(
            value
        );


    if (!text) {

        return "";

    }


    return `

        <div
            class="pe-item-meta"
        >

            <strong>
                ${escapeHtml(
                    label
                )}:
            </strong>

            ${escapeHtml(
                text
            )}

        </div>

    `;

}


function actionButtons(
    category,
    id
) {

    const canEdit =
        canEditSelectedRecord();

    if (!canEdit) {

        return "";

    }


    return `

        <div
            class="pe-item-actions"
        >

            <button
                type="button"
                class="pe-btn pe-btn-secondary"
                data-action="edit-item"
                data-category="${escapeHtml(category)}"
                data-id="${escapeHtml(id)}"
            >

                ✏️

                ${escapeHtml(
                    t("edit")
                )}

            </button>


            <button
                type="button"
                class="pe-btn pe-btn-danger"
                data-action="delete-item"
                data-category="${escapeHtml(category)}"
                data-id="${escapeHtml(id)}"
            >

                🗑️

                ${escapeHtml(
                    t("delete")
                )}

            </button>

        </div>

    `;

}


function renderProfessionItem(
    item
) {

    return `

        <article
            class="pe-item-card"
        >

            <div
                class="pe-item-head"
            >

                <div>

                    <h3
                        class="pe-item-title"
                    >

                        🛠️

                        ${escapeHtml(
                            safeValue(
                                item.title
                            )
                        )}

                    </h3>


                    <div
                        class="pe-item-meta"
                    >

                        ${escapeHtml(
                            safeValue(
                                item.specialty
                            )
                        )}

                    </div>

                </div>


                <span
                    class="pe-count-badge"
                >

                    ${escapeHtml(
                        safeValue(
                            item.skillLevel
                        )
                    )}

                </span>

            </div>


            <div
                class="pe-item-grid"
            >

                ${itemMeta(
                    t("organization"),
                    item.organization
                )}

                ${itemMeta(
                    t("location"),
                    item.location
                )}

                ${itemMeta(
                    t("startYear"),
                    item.startYear
                )}

                ${itemMeta(
                    t("experienceYears"),
                    item.experienceYears
                )}

                ${itemMeta(
                    t("note"),
                    item.note
                )}

                ${itemMeta(
                    t("issueDate"),
                    formatDate(
                        item.createdAt
                    )
                )}

            </div>


            ${actionButtons(
                "professions",
                item.id
            )}

        </article>

    `;

}


function renderEducationItem(
    item,
    category
) {

    const isReligious =
        category ===
        "religiousEducation";


    return `

        <article
            class="pe-item-card"
        >

            <div
                class="pe-item-head"
            >

                <div>

                    <h3
                        class="pe-item-title"
                    >

                        ${
                            isReligious
                                ? "🕌"
                                : "📚"
                        }

                        ${escapeHtml(
                            safeValue(
                                item.field
                            )
                        )}

                    </h3>


                    <div
                        class="pe-item-meta"
                    >

                        ${escapeHtml(
                            safeValue(
                                item.institution
                            )
                        )}

                    </div>

                </div>


                <span
                    class="pe-count-badge"
                >

                    ${escapeHtml(
                        safeValue(
                            item.level
                        )
                    )}

                </span>

            </div>


            <div
                class="pe-item-grid"
            >

                ${itemMeta(
                    t("location"),
                    item.location
                )}

                ${itemMeta(
                    t("startYear"),
                    item.startYear
                )}

                ${itemMeta(
                    t("endYear"),
                    item.endYear
                )}

                ${itemMeta(
                    t("educationStatus"),
                    item.status
                )}

                ${itemMeta(
                    t("note"),
                    item.note
                )}

                ${itemMeta(
                    t("issueDate"),
                    formatDate(
                        item.createdAt
                    )
                )}

            </div>


            ${actionButtons(
                category,
                item.id
            )}

        </article>

    `;

}


function renderCertificateItem(
    item
) {

    return `

        <article
            class="pe-item-card"
        >

            <div
                class="pe-item-head"
            >

                <div>

                    <h3
                        class="pe-item-title"
                    >

                        📜

                        ${escapeHtml(
                            safeValue(
                                item.title
                            )
                        )}

                    </h3>


                    <div
                        class="pe-item-meta"
                    >

                        ${escapeHtml(
                            safeValue(
                                item.issuer
                            )
                        )}

                    </div>

                </div>


                <span
                    class="pe-count-badge"
                >

                    ${escapeHtml(
                        safeValue(
                            item.type
                        )
                    )}

                </span>

            </div>


            <div
                class="pe-item-grid"
            >

                ${itemMeta(
                    t("certificateNo"),
                    item.number
                )}

                ${itemMeta(
                    t("issueDate"),
                    item.issueDate
                )}

                ${itemMeta(
                    t("expireDate"),
                    item.expireDate
                )}

                ${itemMeta(
                    t("location"),
                    item.location
                )}

                ${itemMeta(
                    t("note"),
                    item.note
                )}

                ${itemMeta(
                    t("issueDate"),
                    formatDate(
                        item.createdAt
                    )
                )}

            </div>


            ${actionButtons(
                "certificates",
                item.id
            )}

        </article>

    `;

}


function renderList(
    elementId,
    category,
    renderer
) {

    const box =
        $(elementId);


    if (!box) {
        return;
    }


    const record =
        getSelectedRecord();


    if (!record) {

        box.innerHTML = `

            <div
                class="pe-empty"
            >

                👤

                ${escapeHtml(
                    t(
                        "selectPersonFirst"
                    )
                )}

            </div>

        `;

        return;

    }


    const data =
        normalizeProfessionalEducation(
            record[
                PROFESSIONAL_EDUCATION_KEY
            ]
        );


    const items =
        data[category] ||
        [];


    if (!items.length) {

        box.innerHTML = `

            <div
                class="pe-empty"
            >

                ${escapeHtml(
                    t(
                        "noEntries"
                    )
                )}

            </div>

        `;

        updatePermissionButtons();

        return;

    }


    box.innerHTML =
        items
            .map(
                renderer
            )
            .join(
                ""
            );


    updatePermissionButtons();

}


function renderCurrentLists() {

    renderList(
        "professionsList",
        "professions",
        renderProfessionItem
    );


    renderList(
        "modernEducationList",
        "modernEducation",
        item =>
            renderEducationItem(
                item,
                "modernEducation"
            )
    );


    renderList(
        "religiousEducationList",
        "religiousEducation",
        item =>
            renderEducationItem(
                item,
                "religiousEducation"
            )
    );


    renderList(
        "certificatesList",
        "certificates",
        renderCertificateItem
    );

}


// =========================================================
// Tabs
// =========================================================

function switchTab(
    tab
) {

    state.activeTab =
        tab;


    const mapping = {

        professions:
            "panelProfessions",

        modernEducation:
            "panelModernEducation",

        religiousEducation:
            "panelReligiousEducation",

        certificates:
            "panelCertificates",

        report:
            "panelReport"

    };


    document
        .querySelectorAll(
            ".pe-tab"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.tab ===
                        tab
                );

            }
        );


    Object.entries(
        mapping
    ).forEach(
        ([key, id]) => {

            const panel =
                $(id);


            if (!panel) {
                return;
            }


            panel.hidden =
                key !==
                tab;

        }
    );


    if (
        tab ===
        "report"
    ) {

        renderReport();

    }

}


// =========================================================
// Editor field definitions
// =========================================================

const EDITOR_FIELDS = {

    professions: [

        {
            key:
                "title",

            label:
                "professionName",

            type:
                "text",

            required:
                true,

            placeholder:
                "professionName"

        },

        {
            key:
                "specialty",

            label:
                "specialty",

            type:
                "text",

            required:
                false,

            placeholder:
                "specialty"

        },

        {
            key:
                "skillLevel",

            label:
                "skillLevel",

            type:
                "select",

            required:
                false,

            options: [

                "ابتدايي",
                "منځنۍ",
                "لوړه",
                "مسلکي"

            ]

        },

        {
            key:
                "organization",

            label:
                "organization",

            type:
                "text",

            required:
                false,

            placeholder:
                "organization"

        },

        {
            key:
                "location",

            label:
                "location",

            type:
                "text",

            required:
                false,

            placeholder:
                "location"

        },

        {
            key:
                "startYear",

            label:
                "startYear",

            type:
                "text",

            required:
                false,

            placeholder:
                "startYear"

        },

        {
            key:
                "experienceYears",

            label:
                "experienceYears",

            type:
                "text",

            required:
                false,

            placeholder:
                "experienceYears"

        },

        {
            key:
                "note",

            label:
                "note",

            type:
                "textarea",

            required:
                false,

            placeholder:
                "note",

            full:
                true

        }

    ],


    modernEducation: [

        {
            key:
                "level",

            label:
                "educationLevel",

            type:
                "select",

            required:
                true,

            options: [

                "ابتدایي",
                "منځنۍ",
                "لیسه",
                "دیپلوم",
                "لیسانس",
                "ماسټري",
                "دوکتورا",
                "تخنیکي روزنه",
                "کورس"

            ]

        },

        {
            key:
                "field",

            label:
                "educationField",

            type:
                "text",

            required:
                false,

            placeholder:
                "educationField"

        },

        {
            key:
                "institution",

            label:
                "institutionName",

            type:
                "text",

            required:
                true,

            placeholder:
                "institutionName"

        },

        {
            key:
                "location",

            label:
                "location",

            type:
                "text",

            required:
                false,

            placeholder:
                "location"

        },

        {
            key:
                "startYear",

            label:
                "startYear",

            type:
                "text",

            required:
                false,

            placeholder:
                "startYear"

        },

        {
            key:
                "endYear",

            label:
                "endYear",

            type:
                "text",

            required:
                false,

            placeholder:
                "endYear"

        },

        {
            key:
                "status",

            label:
                "educationStatus",

            type:
                "select",

            required:
                false,

            options: [

                "بشپړ شوی",
                "جاري",
                "درېدلی",
                "نا بشپړ"

            ]

        },

        {
            key:
                "note",

            label:
                "note",

            type:
                "textarea",

            required:
                false,

            placeholder:
                "note",

            full:
                true

        }

    ],


    religiousEducation: [

        {
            key:
                "level",

            label:
                "educationLevel",

            type:
                "select",

            required:
                true,

            options: [

                "حفظ قرآن",
                "تجوید",
                "قرائت",
                "ناظره",
                "ابتدایي مدرسه",
                "منځنۍ مدرسه",
                "عالمیه",
                "تخصص",
                "حدیث",
                "فقه"

            ]

        },

        {
            key:
                "field",

            label:
                "educationField",

            type:
                "text",

            required:
                false,

            placeholder:
                "educationField"
        },

        {
            key:
                "institution",

            label:
                "institutionName",

            type:
                "text",

            required:
                true,

            placeholder:
                "institutionName"

        },

        {
            key:
                "location",

            label:
                "location",

            type:
                "text",

            required:
                false,

            placeholder:
                "location"

        },

        {
            key:
                "startYear",

            label:
                "startYear",

            type:
                "text",

            required:
                false,

            placeholder:
                "startYear"

        },

        {
            key:
                "endYear",

            label:
                "endYear",

            type:
                "text",

            required:
                false,

            placeholder:
                "endYear"

        },

        {
            key:
                "status",

            label:
                "educationStatus",

            type:
                "select",

            required:
                false,

            options: [

                "بشپړ شوی",
                "جاري",
                "درېدلی",
                "نا بشپړ"

            ]

        },

        {
            key:
                "note",

            label:
                "note",

            type:
                "textarea",

            required:
                false,

            placeholder:
                "note",

            full:
                true

        }

    ],


    certificates: [

        {
            key:
                "title",

            label:
                "certificateTitle",

            type:
                "text",

            required:
                true,

            placeholder:
                "certificateTitle"

        },

        {
            key:
                "type",

            label:
                "certificateType",

            type:
                "text",

            required:
                false,

            placeholder:
                "certificateType"

        },

        {
            key:
                "issuer",

            label:
                "issuer",

            type:
                "text",

            required:
                true,

            placeholder:
                "issuer"

        },

        {
            key:
                "number",

            label:
                "certificateNo",

            type:
                "text",

            required:
                false,

            placeholder:
                "certificateNo"

        },

        {
            key:
                "issueDate",

            label:
                "issueDate",

            type:
                "date",

            required:
                false

        },

        {
            key:
                "expireDate",

            label:
                "expireDate",

            type:
                "date",

            required:
                false

        },

        {
            key:
                "location",

            label:
                "location",

            type:
                "text",

            required:
                false,

            placeholder:
                "location"

        },

        {
            key:
                "note",

            label:
                "note",

            type:
                "textarea",

            required:
                false,

            placeholder:
                "note",

            full:
                true

        }

    ]

};


// =========================================================
// Editor HTML
// =========================================================

function fieldHtml(
    def,
    value = ""
) {

    const fieldId =
        `editor_${def.key}`;


    const required =
        def.required
            ? "required"
            : "";


    const requiredMark =
        def.required
            ? " *"
            : "";


    const wrapperClass =
        def.full
            ? "pe-form-group full"
            : "pe-form-group";


    const label =
        t(
            def.label
        ) +
        requiredMark;


    if (
        def.type ===
        "textarea"
    ) {

        return `

            <div
                class="${wrapperClass}"
            >

                <label
                    class="pe-label"
                    for="${fieldId}"
                >
                    ${escapeHtml(
                        label
                    )}
                </label>


                <textarea
                    id="${fieldId}"
                    class="pe-textarea"
                    data-editor-field="${escapeHtml(def.key)}"
                    placeholder="${escapeHtml(
                        t(
                            def.placeholder ||
                            def.label
                        )
                    )}"
                    ${required}
                >${escapeHtml(
                    value
                )}</textarea>

            </div>

        `;

    }


    if (
        def.type ===
        "select"
    ) {

        const options =
            def.options
                .map(
                    option => `

                        <option
                            value="${escapeHtml(option)}"
                            ${
                                cleanText(value) ===
                                cleanText(option)
                                    ? "selected"
                                    : ""
                            }
                        >

                            ${escapeHtml(
                                option
                            )}

                        </option>

                    `
                )
                .join(
                    ""
                );


        return `

            <div
                class="${wrapperClass}"
            >

                <label
                    class="pe-label"
                    for="${fieldId}"
                >
                    ${escapeHtml(
                        label
                    )}
                </label>


                <select
                    id="${fieldId}"
                    class="pe-select"
                    data-editor-field="${escapeHtml(def.key)}"
                    ${required}
                >

                    <option value="">
                        —
                    </option>

                    ${options}

                </select>

            </div>

        `;

    }


    return `

        <div
            class="${wrapperClass}"
        >

            <label
                class="pe-label"
                for="${fieldId}"
            >
                ${escapeHtml(
                    label
                )}
            </label>


            <input
                id="${fieldId}"
                class="pe-input"
                type="${escapeHtml(def.type)}"
                data-editor-field="${escapeHtml(def.key)}"
                value="${escapeHtml(value)}"
                ${
                    def.placeholder
                        ? `placeholder="${escapeHtml(
                            t(
                                def.placeholder
                            )
                        )}"`
                        : ""
                }
                ${required}
                autocomplete="off"
            >

        </div>

    `;

}


function findEditingItem(
    category,
    id
) {

    const data =
        getSelectedData();


    return (

        data[
            category
        ] || []

    ).find(
        item =>
            item.id ===
            id
    ) || null;

}


function openEditor(
    category,
    id = ""
) {

    if (
        !getSelectedRecord()
    ) {

        showMessage(
            t(
                "selectPersonFirst"
            ),
            "warning"
        );

        return;

    }


    if (
        !canEditSelectedRecord()
    ) {

        showMessage(

            state.role ===
                "user"

                ? t(
                    "onlyAdminCanEdit"
                )

                : t(
                    "lockedRecordNoEdit"
                ),

            "warning"

        );

        return;

    }


    const defs =
        EDITOR_FIELDS[
            category
        ];


    if (!defs) {
        return;
    }


    const item =
        id
            ? findEditingItem(
                category,
                id
            )
            : null;


    state.editing = {

        category,

        id:
            cleanText(
                id
            )

    };


    const fields =
        $("editorFields");


    if (!fields) {
        return;
    }


    fields.innerHTML =
        defs
            .map(
                def =>
                    fieldHtml(
                        def,
                        item?.[
                            def.key
                        ] ??
                        ""
                    )
            )
            .join(
                ""
            );


    $("editorModalTitle")
        .textContent =
            id
                ? t(
                    "modalEdit"
                )
                : t(
                    "modalAdd"
                );


    const note =
        $("editorPermissionNote");


    if (note) {

        note.classList.add(
            "pe-hidden"
        );

        note.textContent =
            "";

    }


    const modal =
        $("editorModal");


    modal?.classList.add(
        "show"
    );


    modal?.setAttribute(
        "aria-hidden",
        "false"
    );


    window.setTimeout(
        () =>
            fields
                .querySelector(
                    "[data-editor-field]"
                )
                ?.focus(),

        50

    );

}


function closeEditor() {

    state.editing =
        null;


    const modal =
        $("editorModal");


    modal?.classList.remove(
        "show"
    );


    modal?.setAttribute(
        "aria-hidden",
        "true"
    );

}


function collectEditorValues() {

    const values =
        {};


    document
        .querySelectorAll(
            "[data-editor-field]"
        )
        .forEach(
            element => {

                values[
                    element.dataset.editorField
                ] =
                    cleanText(
                        element.value
                    );

            }
        );


    return values;

}


function validateEditor(
    category,
    values
) {

    const defs =
        EDITOR_FIELDS[
            category
        ] || [];


    for (
        const def
        of defs
    ) {

        if (
            def.required &&
            !cleanText(
                values[
                    def.key
                ]
            )
        ) {

            showMessage(
                `${t(
                    def.label
                )}: ${t(
                    "required"
                )}`,

                "warning"
            );


            document
                .querySelector(
                    `[data-editor-field="${CSS.escape(def.key)}"]`
                )
                ?.focus();


            return false;

        }

    }


    return true;

}


function makeId() {

    try {

        if (
            typeof crypto !==
                "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ) {

            return crypto.randomUUID();

        }

    } catch {}


    return `pe-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

}


// =========================================================
// Save / delete
// =========================================================

async function saveProfessionalEducation() {

    const record =
        getSelectedRecord();


    const editing =
        state.editing;


    if (
        !record ||
        !editing
    ) {

        return;

    }


    if (
        !canEditSelectedRecord()
    ) {

        showMessage(
            t(
                "onlyAdminCanEdit"
            ),
            "warning"
        );

        return;

    }


    const values =
        collectEditorValues();


    if (
        !validateEditor(
            editing.category,
            values
        )
    ) {

        return;

    }


    const currentData =
        normalizeProfessionalEducation(
            record[
                PROFESSIONAL_EDUCATION_KEY
            ]
        );


    const items =
        Array.isArray(
            currentData[
                editing.category
            ]
        )

            ? [
                ...currentData[
                    editing.category
                ]
            ]

            : [];


    let nextItem;


    if (
        editing.id
    ) {

        const index =
            items.findIndex(
                item =>
                    item.id ===
                    editing.id
            );


        if (
            index < 0
        ) {

            showMessage(
                t(
                    "saveError"
                ),
                "danger"
            );

            return;

        }


        nextItem = {

            ...items[
                index
            ],

            ...values,

            updatedAt:
                new Date()
                    .toISOString(),

            updatedBy:
                state.user?.uid ||
                "",

            updatedByName:
                state.admin?.name ||
                ""

        };


        items[
            index
        ] =
            nextItem;

    } else {

        nextItem = {

            id:
                makeId(),

            ...values,

            createdAt:
                Date.now(),

            createdBy:
                state.user?.uid ||
                "",

            createdByName:
                state.admin?.name ||
                "",

            updatedAt:
                new Date()
                    .toISOString()

        };


        items.unshift(
            nextItem
        );

    }


    const nextData = {

        ...currentData,

        schemaVersion:
            1,

        [editing.category]:
            items

    };


    const updatePayload = {

        [PROFESSIONAL_EDUCATION_KEY]:
            nextData,

        professionalEducationUpdatedAt:
            serverTimestamp(),

        professionalEducationUpdatedBy:
            state.user?.uid ||
            "",

        professionalEducationUpdatedByName:
            state.admin?.name ||
            "",

        professionalEducationUpdatedByEmail:
            state.admin?.email ||
            ""

    };


    const button =
        $("saveEditorBtn");


    if (button) {

        button.disabled =
            true;
    }


    try {

        await updateDoc(

            doc(
                db,
                RECORDS_COLLECTION,
                record.id
            ),

            updatePayload

        );


        const localIndex =
            state.records.findIndex(
                item =>
                    item.id ===
                    record.id
            );


        if (
            localIndex >=
            0
        ) {

            state.records[
                localIndex
            ] = {

                ...state.records[
                    localIndex
                ],

                [PROFESSIONAL_EDUCATION_KEY]:
                    nextData

            };

        }


        const action =
            editing.id

                ? "د مسلک او زده کړو معلومات بدل شول"

                : "د مسلک او زده کړو معلومات ثبت شول";


        await writeAudit(

            AUDIT_ACTIONS.UPDATE,

            `${action} — ${getPersonName(record)} — ${getFormNumber(record)} — ${editing.category}`

        ).catch(
            () => {}
        );


        closeEditor();

        renderAll();


        showMessage(
            t(
                "saveSuccess"
            ),
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Save Professional Education Error:",
            error
        );


        showMessage(
            error?.message ||
            t(
                "saveError"
            ),
            "danger"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


async function deleteProfessionalEducation(
    category,
    id
) {

    const record =
        getSelectedRecord();


    if (
        !record ||
        !id
    ) {

        return;

    }


    if (
        !canEditSelectedRecord()
    ) {

        showMessage(

            state.role ===
                "user"

                ? t(
                    "onlyAdminCanEdit"
                )

                : t(
                    "lockedRecordNoEdit"
                ),

            "warning"

        );

        return;

    }


    if (
        !window.confirm(
            t(
                "deleteConfirm"
            )
        )
    ) {

        return;

    }


    const currentData =
        normalizeProfessionalEducation(
            record[
                PROFESSIONAL_EDUCATION_KEY
            ]
        );


    const nextData = {

        ...currentData,

        [category]:
            (
                currentData[
                    category
                ] || []

            ).filter(

                item =>
                    item.id !==
                    id

            )

    };


    try {

        await updateDoc(

            doc(
                db,
                RECORDS_COLLECTION,
                record.id
            ),

            {

                [PROFESSIONAL_EDUCATION_KEY]:
                    nextData,

                professionalEducationUpdatedAt:
                    serverTimestamp(),

                professionalEducationUpdatedBy:
                    state.user?.uid ||
                    "",

                professionalEducationUpdatedByName:
                    state.admin?.name ||
                    "",

                professionalEducationUpdatedByEmail:
                    state.admin?.email ||
                    ""

            }

        );


        const localIndex =
            state.records.findIndex(
                item =>
                    item.id ===
                    record.id
            );


        if (
            localIndex >=
            0
        ) {

            state.records[
                localIndex
            ] = {

                ...state.records[
                    localIndex
                ],

                [PROFESSIONAL_EDUCATION_KEY]:
                    nextData

            };

        }


        await writeAudit(

            AUDIT_ACTIONS.DELETE,

            `د مسلک او زده کړو معلومات ړنګ شول — ${getPersonName(record)} — ${getFormNumber(record)} — ${category}`

        ).catch(
            () => {}
        );


        renderAll();


        showMessage(
            t(
                "deleteSuccess"
            ),
            "success"
        );

    } catch (
        error
    ) {

        console.error(
            "Delete Professional Education Error:",
            error
        );


        showMessage(
            error?.message ||
            t(
                "saveError"
            ),
            "danger"
        );

    }

}


// =========================================================
// Report
// =========================================================

function buildReportRows() {

    const rows =
        [];


    state.records.forEach(
        record => {

            const pe =
                normalizeProfessionalEducation(
                    record[
                        PROFESSIONAL_EDUCATION_KEY
                    ]
                );


            const personBase = {

                recordId:
                    record.id,

                formNumber:
                    getFormNumber(
                        record
                    ),

                name:
                    getPersonName(
                        record
                    ),

                father:
                    getFatherName(
                        record
                    ),

                tazkira:
                    getTazkira(
                        record
                    )

            };


            pe.professions.forEach(
                item => {

                    rows.push({

                        ...personBase,

                        category:
                            "professions",

                        categoryLabel:
                            t(
                                "professionType"
                            ),

                        title:
                            firstNonEmpty(

                                item.title,

                                item.specialty

                            ),

                        level:
                            firstNonEmpty(

                                item.skillLevel,

                                item.specialty

                            ),

                        institution:
                            item.organization,

                        location:
                            item.location,

                        years:
                            firstNonEmpty(

                                item.startYear,

                                item.experienceYears

                            ),

                        certificateNumber:
                            "",

                        raw:
                            item

                    });

                }
            );


            pe.modernEducation.forEach(
                item => {

                    rows.push({

                        ...personBase,

                        category:
                            "modernEducation",

                        categoryLabel:
                            t(
                                "modernType"
                            ),

                        title:
                            firstNonEmpty(

                                item.field,

                                item.level

                            ),

                        level:
                            item.level,

                        institution:
                            item.institution,

                        location:
                            item.location,

                        years:
                            [

                                item.startYear,

                                item.endYear

                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    " - "
                                ),

                        certificateNumber:
                            "",

                        raw:
                            item

                    });

                }
            );


            pe.religiousEducation.forEach(
                item => {

                    rows.push({

                        ...personBase,

                        category:
                            "religiousEducation",

                        categoryLabel:
                            t(
                                "religiousType"
                            ),

                        title:
                            firstNonEmpty(

                                item.field,

                                item.level

                            ),

                        level:
                            item.level,

                        institution:
                            item.institution,

                        location:
                            item.location,

                        years:
                            [

                                item.startYear,

                                item.endYear

                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    " - "
                                ),

                        certificateNumber:
                            "",

                        raw:
                            item

                    });

                }
            );


            pe.certificates.forEach(
                item => {

                    rows.push({

                        ...personBase,

                        category:
                            "certificates",

                        categoryLabel:
                            t(
                                "certificateTypeRow"
                            ),

                        title:
                            item.title,

                        level:
                            item.type,

                        institution:
                            item.issuer,

                        location:
                            item.location,

                        years:
                            [

                                item.issueDate,

                                item.expireDate

                            ]
                                .filter(
                                    Boolean
                                )
                                .join(
                                    " - "
                                ),

                        certificateNumber:
                            item.number,

                        raw:
                            item

                    });

                }
            );

        }
    );


    return rows;

}


function getFilteredReportRows() {

    const reportType =
        $("reportType")?.value ||
        "all";


    const search =
        normalizeSearch(
            $("reportSearch")?.value ||
            ""
        );


    return buildReportRows()
        .filter(
            row => {

                if (
                    reportType !==
                        "all" &&
                    row.category !==
                        reportType
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const haystack =
                    normalizeSearch(

                        [

                            row.formNumber,

                            row.name,

                            row.father,

                            row.tazkira,

                            row.categoryLabel,

                            row.title,

                            row.level,

                            row.institution,

                            row.location,

                            row.years,

                            row.certificateNumber

                        ]

                            .filter(
                                Boolean
                            )

                            .join(
                                " "
                            )

                    );


                return haystack.includes(
                    search
                );

            }
        );

}


function renderReport() {

    const body =
        $("reportTableBody");


    const summary =
        $("reportSummary");


    if (
        !body ||
        !summary
    ) {

        return;

    }


    const rows =
        getFilteredReportRows();


    summary.textContent =
        `${t(
            "reportCount"
        )}: ${rows.length}`;


    if (!rows.length) {

        body.innerHTML = `

            <tr>

                <td colspan="11">

                    <div
                        class="pe-empty"
                    >

                        ${escapeHtml(
                            t(
                                "reportEmpty"
                            )
                        )}

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML =
        rows
            .map(
                row => `

                    <tr>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.formNumber
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.name
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.father
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.tazkira
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.categoryLabel
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.title
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.level
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.institution
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.location
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.years
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                safeValue(
                                    row.certificateNumber
                                )
                            )}
                        </td>

                    </tr>

                `
            )
            .join(
                ""
            );

}


function exportReportCSV() {

    const rows =
        getFilteredReportRows();


    if (!rows.length) {

        showMessage(
            t(
                "reportEmpty"
            ),
            "warning"
        );

        return;

    }


    const headers = [

        t(
            "formNumber"
        ),

        t(
            "name"
        ),

        t(
            "fatherName"
        ),

        t(
            "tazkira"
        ),

        t(
            "recordType"
        ),

        t(
            "titleOrField"
        ),

        t(
            "levelOrType"
        ),

        t(
            "institution"
        ),

        t(
            "location"
        ),

        t(
            "years"
        ),

        t(
            "certificateNumber"
        )

    ];


    const lines = [

        headers,

        ...rows.map(
            row => [

                row.formNumber,

                row.name,

                row.father,

                row.tazkira,

                row.categoryLabel,

                row.title,

                row.level,

                row.institution,

                row.location,

                row.years,

                row.certificateNumber

            ]
        )

    ]
        .map(
            columns =>

                columns
                    .map(

                        value =>

                            `"${String(
                                value ??
                                ""
                            )
                                .replaceAll(
                                    '"',
                                    '""'
                                )}"`

                    )
                    .join(
                        ","
                    )

        );


    const csv =
        "\uFEFF" +
        lines.join(
            "\r\n"
        );


    const blob =
        new Blob(

            [csv],

            {
                type:
                    "text/csv;charset=utf-8;"
            }

        );


    const url =
        URL.createObjectURL(
            blob        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        "musalik-zdakrې-report.csv";


    document.body.appendChild(
        anchor
    );


    anchor.click();

    anchor.remove();


    URL.revokeObjectURL(
        url
    );

}


function printReport() {

    const rows =
        getFilteredReportRows();


    if (!rows.length) {

        showMessage(
            t(
                "reportEmpty"
            ),
            "warning"
        );

        return;

    }


    const columns = [

        [
            "formNumber",
            "formNumber"
        ],

        [
            "name",
            "name"
        ],

        [
            "father",
            "fatherName"
        ],

        [
            "tazkira",
            "tazkira"
        ],

        [
            "categoryLabel",
            "recordType"
        ],

        [
            "title",
            "titleOrField"
        ],

        [
            "level",
            "levelOrType"
        ],

        [
            "institution",
            "institution"
        ],

        [
            "location",
            "location"
        ],

        [
            "years",
            "years"
        ],

        [
            "certificateNumber",
            "certificateNumber"
        ]

    ];


    const table =
        rows

            .map(
                row => `

                    <tr>

                        ${
                            columns
                                .map(
                                    ([key]) =>
                                        `<td>${escapeHtml(
                                            safeValue(
                                                row[
                                                    key
                                                ]
                                            )
                                        )}</td>`
                                )
                                .join(
                                    ""
                                )
                        }

                    </tr>

                `
            )

            .join(
                ""
            );


    const header =
        columns

            .map(
                ([, label]) =>

                    `<th>${escapeHtml(
                        t(
                            label
                        )
                    )}</th>`

            )

            .join(
                ""
            );


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );


    if (!printWindow) {

        showMessage(
            "د چاپ کړکۍ پرانیستل نشول.",
            "danger"
        );

        return;

    }


    printWindow.document.write(

        `

            <!DOCTYPE html>

            <html
                lang="${escapeHtml(
                    state.language
                )}"
                dir="${escapeHtml(
                    document.documentElement.dir ||
                    "rtl"
                )}"
            >

            <head>

                <meta
                    charset="UTF-8"
                >

                <title>
                    ${escapeHtml(
                        t(
                            "report"
                        )
                    )}
                </title>


                <style>

                    body {

                        font-family:
                            Arial,
                            Tahoma,
                            sans-serif;

                        padding:
                            20px;

                        color:
                            #111;

                    }


                    h1 {

                        margin:
                            0 0 10px;

                        font-size:
                            24px;

                    }


                    p {

                        margin:
                            0 0 18px;

                        color:
                            #444;

                    }


                    table {

                        width:
                            100%;

                        border-collapse:
                            collapse;

                        font-size:
                            12px;

                    }


                    th,
                    td {

                        border:
                            1px solid #aaa;

                        padding:
                            7px;

                        text-align:
                            right;

                        vertical-align:
                            top;

                    }


                    th {

                        background:
                            #eee;

                        font-weight:
                            700;

                    }


                    @page {

                        size:
                            A4 landscape;

                        margin:
                            10mm;

                    }

                </style>

            </head>


            <body>

                <h1>
                    ${escapeHtml(
                        t(
                            "pageTitle"
                        )
                    )}
                </h1>


                <p>
                    ${escapeHtml(
                        t(
                            "reportHint"
                        )
                    )}
                </p>


                <table>

                    <thead>

                        <tr>
                            ${header}
                        </tr>

                    </thead>


                    <tbody>
                        ${table}
                    </tbody>

                </table>

            </body>

            </html>

        `

    );


    printWindow.document.close();


    printWindow.focus();


    window.setTimeout(
        () => {

            printWindow.print();

        },
        250
    );

}


// =========================================================
// Events
// =========================================================

function bindEvents() {

    bindNavigation();


    $("personSearchType")
        ?.addEventListener(
            "change",
            event => {

                state.searchType =
                    event.target.value ||
                    "all";

                renderSearchResults();

            }
        );


    $("personSearchInput")
        ?.addEventListener(
            "input",
            event => {

                state.searchText =
                    event.target.value ||
                    "";

                renderSearchResults();

            }
        );


    $("personSearchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                state.searchText =
                    $("personSearchInput")?.value ||
                    "";


                renderSearchResults();


                const matches =
                    getMatchingRecords();


                if (
                    matches.length ===
                    1
                ) {

                    selectRecord(
                        matches[0].id
                    );

                }

            }
        );


    $("clearSearchBtn")
        ?.addEventListener(
            "click",
            () => {

                state.searchText =
                    "";

                state.selectedRecordId =
                    "";


                if (
                    $("personSearchInput")
                ) {

                    $("personSearchInput")
                        .value =
                            "";

                }


                renderAll();

            }
        );


    document
        .querySelectorAll(
            ".pe-tab"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        switchTab(
                            button.dataset.tab
                        )
                );

            }
        );


    document
        .querySelectorAll(
            "[data-open-editor]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        openEditor(
                            button.dataset.openEditor
                        )
                );

            }
        );


    $("editorForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                saveProfessionalEducation();

            }
        );


    $("closeEditorBtn")
        ?.addEventListener(
            "click",
            closeEditor
        );


    $("cancelEditorBtn")
        ?.addEventListener(
            "click",
            closeEditor
        );


    $("editorModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    $("editorModal")
                ) {

                    closeEditor();

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeEditor();

            }

        }
    );


    $("reportType")
        ?.addEventListener(
            "change",
            renderReport
        );


    $("reportSearch")
        ?.addEventListener(
            "input",
            renderReport
        );


    $("exportReportBtn")
        ?.addEventListener(
            "click",
            exportReportCSV
        );


    $("printReportBtn")
        ?.addEventListener(
            "click",
            printReport
        );


    document.addEventListener(
        "click",
        event => {

            const selectButton =
                event.target.closest(
                    "[data-select-record]"
                );


            if (
                selectButton
            ) {

                selectRecord(
                    selectButton.dataset.selectRecord
                );

                return;

            }


            const actionButton =
                event.target.closest(
                    "[data-action]"
                );


            if (
                !actionButton
            ) {

                return;

            }


            const action =
                actionButton.dataset.action;


            const category =
                actionButton.dataset.category;


            const id =
                actionButton.dataset.id;


            if (
                action ===
                "edit-item"
            ) {

                openEditor(
                    category,
                    id
                );

            }


            if (
                action ===
                "delete-item"
            ) {

                deleteProfessionalEducation(
                    category,
                    id
                );

            }

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#clearSelectedPersonBtn"
                )
            ) {

                state.selectedRecordId =
                    "";

                renderAll();

            }

        }
    );

}


// =========================================================
// Render
// =========================================================

function renderStats() {

    const totalPersons =
        state.records.length;


    let professions =
        0;

    let education =
        0;

    let certificates =
        0;


    state.records.forEach(
        record => {

            const data =
                normalizeProfessionalEducation(
                    record[
                        PROFESSIONAL_EDUCATION_KEY
                    ]
                );


            professions +=
                data.professions.length;


            education +=
                data.modernEducation.length +
                data.religiousEducation.length;


            certificates +=
                data.certificates.length;

        }
    );


    const numberLocale =
        state.language ===
            "en"
            ? "en-US"
            : "fa-AF";


    $("statPersons")
        .textContent =
            totalPersons.toLocaleString(
                numberLocale
            );


    $("statProfessions")
        .textContent =
            professions.toLocaleString(
                numberLocale
            );


    $("statEducation")
        .textContent =
            education.toLocaleString(
                numberLocale
            );


    $("statCertificates")
        .textContent =
            certificates.toLocaleString(
                numberLocale
            );

}


function renderTabsAndPanels() {

    switchTab(
        state.activeTab
    );

}


function renderAll() {

    renderStats();

    renderSearchResults();

    renderSelectedPerson();

    renderCurrentLists();

    renderReport();

    renderTabsAndPanels();

}


// =========================================================
// Boot
// =========================================================

await initializeSystemSettings();

bindEvents();


onAuthStateChanged(
    auth,
    async user => {

        const ok =
            await ensureAuthenticated(
                user
            );


        if (!ok) {
            return;
        }


        startRecordsListener();

        renderAll();

    }
);


window.addEventListener(
    "beforeunload",
    () => {

        stopRecordsListener();

    }
);