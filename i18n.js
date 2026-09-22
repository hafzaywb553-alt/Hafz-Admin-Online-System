
export const LANGUAGES = {
  ps: { name: "پښتو", dir: "rtl" },
  fa: { name: "دري", dir: "rtl" },
  en: { name: "English", dir: "ltr" },
  ur: { name: "اردو", dir: "rtl" },
  ar: { name: "العربية", dir: "rtl" }
};

const CORE = {
  ps: { dashboard:"کورپاڼه", register:"نوی ثبت", search:"لټون", reports:"راپورونه", admin:"اداره", settings:"تنظیمات", online:"آنلاین", welcome:"ښه راغلاست، {name}", sending:"لیږل کېږي...", noUsers:"اوس مهال آنلاین کاروونکی نشته.", noComments:"تر اوسه کومه تبصره نشته.", help:"مرسته", refresh:"تازه کول", logout:"وتل" },
  fa: { dashboard:"داشبورد", register:"ثبت جدید", search:"جستجو", reports:"گزارش‌ها", admin:"اداره", settings:"تنظیمات", online:"آنلاین", welcome:"خوش آمدید، {name}", sending:"در حال ارسال...", noUsers:"در حال حاضر کاربر آنلاین وجود ندارد.", noComments:"هنوز هیچ نظری وجود ندارد.", help:"راهنما", refresh:"تازه‌سازی", logout:"خروج" },
  en: { dashboard:"Dashboard", register:"New Registration", search:"Search", reports:"Reports", admin:"Administration", settings:"Settings", online:"Online", welcome:"Welcome, {name}", sending:"Sending...", noUsers:"No users are currently online.", noComments:"No comments yet.", help:"Help", refresh:"Refresh", logout:"Logout" },
  ur: { dashboard:"ڈیش بورڈ", register:"نیا اندراج", search:"تلاش", reports:"رپورٹس", admin:"انتظامیہ", settings:"ترتیبات", online:"آن لائن", welcome:"خوش آمدید، {name}", sending:"بھیجا جا رہا ہے...", noUsers:"اس وقت کوئی صارف آن لائن نہیں ہے۔", noComments:"ابھی تک کوئی تبصرہ نہیں ہے۔", help:"مدد", refresh:"تازہ کریں", logout:"لاگ آؤٹ" },
  ar: { dashboard:"الصفحة الرئيسية", register:"تسجيل جديد", search:"بحث", reports:"التقارير", admin:"الإدارة", settings:"الإعدادات", online:"متصل", welcome:"مرحبًا، {name}", sending:"جارٍ الإرسال...", noUsers:"لا يوجد مستخدمون متصلون حاليًا.", noComments:"لا توجد تعليقات بعد.", help:"مساعدة", refresh:"تحديث", logout:"خروج" }
};

const TEXT = {
  "اصلي مینو":["منوی اصلی","Main Menu","مین مینو","القائمة الرئيسية"],
  "اصلي مېنو":["منوی اصلی","Main Menu","مین مینو","القائمة الرئيسية"],
  "کورپاڼه":["صفحه اصلی","Dashboard","ڈیش بورڈ","الصفحة الرئيسية"],
  "کـــورپــاڼــه":["صفحه اصلی","Dashboard","ڈیش بورڈ","الصفحة الرئيسية"],
  "نوی ثبت":["ثبت جدید","New Registration","نیا اندراج","تسجيل جديد"],
  "لټون":["جستجو","Search","تلاش","بحث"],
  "راپورونه":["گزارش‌ها","Reports","رپورٹس","التقارير"],
  "اډمــینانوبرخه":["بخش مدیریت","Administration","انتظامیہ","الإدارة"],
  "داډمــنانـوبـرخـه":["بخش مدیریت","Administration","انتظامیہ","الإدارة"],
  "تنظیمات":["تنظیمات","Settings","ترتیبات","الإعدادات"],
  "ژبه":["زبان","Language","زبان","اللغة"],
  "تقویم":["تقویم","Calendar","تقویم","التقويم"],
  "د لیک لوری":["جهت متن","Text Direction","متن کی سمت","اتجاه النص"],
  "د نېټې بڼه":["فرمت تاریخ","Date Format","تاریخ کی شکل","تنسيق التاريخ"],
  "د وخت بڼه":["فرمت زمان","Time Format","وقت کی شکل","تنسيق الوقت"],
  "وخت سیمه":["منطقه زمانی","Time Zone","ٹائم زون","المنطقة الزمنية"],
  "د لیک اندازه":["اندازه متن","Font Size","فونٹ سائز","حجم الخط"],
  "د فاصلې حالت":["فاصله","Spacing","فاصلہ","التباعد"],
  "فونټ":["فونت","Font","فونٹ","الخط"],
  "د سیستم بڼه":["ظاهر سیستم","System Theme","سسٹم انداز","مظهر النظام"],
  "د شالید بڼه":["پس‌زمینه","Background","پس منظر","الخلفية"],
  "💾 تنظیمات خوندي کول":["💾 ذخیره تنظیمات","💾 Save Settings","💾 ترتیبات محفوظ کریں","💾 حفظ الإعدادات"],
  "🔄 ټول اصلي حالت ته راوستل":["🔄 بازگردانی تنظیمات اصلی","🔄 Restore Defaults","🔄 اصل ترتیبات بحال کریں","🔄 استعادة الإعدادات الأصلية"],
  "↩️ شاته تګ":["↩️ بازگشت","↩️ Back","↩️ واپس","↩️ رجوع"],
  "پرمختللی خوندي سیستم":["سیستم پیشرفته و امن","Advanced Secure System","اعلیٰ محفوظ نظام","نظام أمني متقدم"],
  "ډیجیټل دفاع":["دفاع دیجیتال","Digital Defense","ڈیجیٹل دفاع","الدفاع الرقمي"],
  "د تصدیق حالت":["وضعیت تأیید","Verification Status","تصدیق کی حالت","حالة التحقق"],
  "خوندي لاسرسی فعال دی":["دسترسی امن فعال است","Secure access is active","محفوظ رسائی فعال ہے","الوصول الآمن نشط"],
  "امنیتي څارنه":["نظارت امنیتی","Security Monitoring","سیکیورٹی نگرانی","المراقبة الأمنية"],
  "د معلوماتو ساتنه":["محافظت از معلومات","Data Protection","معلومات کا تحفظ","حماية البيانات"],
  "کوډ شوې اړیکه":["ارتباط رمزگذاری‌شده","Encrypted Connection","خفیہ کردہ رابطہ","اتصال مشفر"],
  "خوندي تصدیق":["تأیید امن","Secure Verification","محفوظ تصدیق","تحقق آمن"],
  "آنلاین سیستم":["سیستم آنلاین","Online System","آن لائن نظام","النظام عبر الإنترنت"],
  "خوندي ډیټابیس":["پایگاه داده امن","Secure Database","محفوظ ڈیٹا بیس","قاعدة بيانات آمنة"],
  "روښانه حالت":["حالت روشن","Light Mode","روشن انداز","الوضع الفاتح"],
  "خوندي ډیجیټل دروازه":["دروازه دیجیتال امن","Secure Digital Gateway","محفوظ ڈیجیٹل گیٹ وے","البوابة الرقمية الآمنة"],
  "ننوتل":["ورود","Sign In","لاگ اِن","تسجيل الدخول"],
  "ایمیل":["ایمیل","Email","ای میل","البريد الإلكتروني"],
  "پاسورډ":["رمز عبور","Password","پاس ورڈ","كلمة المرور"],
  "🔐 خوندي ننوتل":["🔐 ورود امن","🔐 Secure Sign In","🔐 محفوظ لاگ اِن","🔐 تسجيل دخول آمن"],
  "🔑 پاسورډ مو هېر کړی؟":["🔑 رمز عبور را فراموش کرده‌اید؟","🔑 Forgot your password?","🔑 پاس ورڈ بھول گئے؟","🔑 نسيت كلمة المرور؟"],
  "📱 د واټس‌اپ له لارې مرسته":["📱 کمک از طریق واتساپ","📱 WhatsApp Help","📱 واٹس ایپ کے ذریعے مدد","📱 المساعدة عبر واتساب"],
  "مجاز کاروونکی":["کاربر مجاز","Authorized User","مجاز صارف","مستخدم مصرح به"],
  "نوم":["نام","Name","نام","الاسم"],
  "تخلص":["تخلص","Last Name","خاندانی نام","اسم العائلة"],
  "د پلار نوم":["نام پدر","Father Name","والد کا نام","اسم الأب"],
  "د نیکه نوم":["نام پدربزرگ","Grandfather Name","دادا کا نام","اسم الجد"],
  "د تذکرې ډول":["نوع تذکره","ID Type","شناختی کارڈ کی قسم","نوع الهوية"],
  "برقي تذکیره":["تذکره برقی","Electronic ID","الیکٹرانک شناختی کارڈ","هوية إلكترونية"],
  "کاغذي تذکیره":["تذکره کاغذی","Paper ID","کاغذی شناختی کارڈ","هوية ورقية"],
  "د تذکرې نمبر":["شماره تذکره","ID Number","شناختی کارڈ نمبر","رقم الهوية"],
  "د زېږون نېټه":["تاریخ تولد","Date of Birth","تاریخ پیدائش","تاريخ الميلاد"],
  "د تلیفون شمېره":["شماره تلفن","Phone Number","فون نمبر","رقم الهاتف"],
  "ولایت":["ولایت","Province","صوبہ","الولاية"],
  "ولایت انتخاب کړئ":["ولایت را انتخاب کنید","Select Province","صوبہ منتخب کریں","اختر الولاية"],
  "ولسوالۍ":["ولسوالی","District","ضلع","المديرية"],
  "کلی":["قریه","Village","گاؤں","القرية"],
  "اوسنی دنده":["وظیفه فعلی","Current Job","موجودہ کام","الوظيفة الحالية"],
  "کټګوري":["دسته‌بندی","Category","زمرہ","الفئة"],
  "کټګوري انتخاب کړئ":["دسته را انتخاب کنید","Select Category","زمرہ منتخب کریں","اختر الفئة"],
  "فعال":["فعال","Active","فعال","نشط"],
  "غیر فعال":["غیرفعال","Inactive","غیر فعال","غير نشط"],
  "مجاهد":["مجاهد","Mujahid","مجاہد","مجاهد"],
  "همکار":["همکار","Partner","معاون","متعاون"],
  "جهادي سابقه":["سابقه جهادی","Jihadi Experience","جہادی سابقہ","الخبرة الجهادية"],
  "📄 د PDF معلومات":["📄 معلومات PDF","📄 PDF Information","📄 PDF معلومات","📄 معلومات PDF"],
  "د PDF د جوړېدو نېټه":["تاریخ ایجاد PDF","PDF Creation Date","PDF بنانے کی تاریخ","تاريخ إنشاء PDF"],
  "🧩 اضافي معلومات":["🧩 معلومات اضافی","🧩 Additional Information","🧩 اضافی معلومات","🧩 معلومات إضافية"],
  "💾 فورمه ثبت کړئ":["💾 ثبت فورم","💾 Save Form","💾 فارم محفوظ کریں","💾 حفظ النموذج"],
  "🧹 پاکول":["🧹 پاک‌کردن","🧹 Clear","🧹 صاف کریں","🧹 مسح"],
  "⬅️ شاته":["⬅️ بازگشت","⬅️ Back","⬅️ واپس","⬅️ رجوع"],
  "سیستم ته ښه راغلاست":["به سیستم خوش آمدید","Welcome to the system","نظام میں خوش آمدید","مرحبًا بك في النظام"],
  "مرکزي مدیریت":["مدیریت مرکزی","Central Management","مرکزی انتظام","الإدارة المركزية"],
  "نوې فورمه ثبت کړه":["ثبت فورم جدید","Register New Form","نیا فارم درج کریں","سجل نموذجًا جديدًا"],
  "فورمه ولټوه":["جستجوی فورم","Search Form","فارم تلاش کریں","ابحث عن نموذج"],
  "لمونځ":["نماز","Prayer","نماز","الصلاة"],
  "ټول ثبت شوي کسان":["تمام افراد ثبت‌شده","All Registered People","تمام رجسٹرڈ افراد","جميع الأشخاص المسجلين"],
  "اوس آنلاین کسان":["افراد آنلاین فعلی","People Online Now","اب آن لائن افراد","المستخدمون المتصلون الآن"],
  "زما ایمیل":["ایمیل من","My Email","میرا ای میل","بريدي الإلكتروني"],
  "زما حالت":["وضعیت من","My Status","میری حالت","حالتي"],
  "اوسنی وخت":["وقت فعلی","Current Time","موجودہ وقت","الوقت الحالي"],
  "کیسې":["داستان‌ها","Stories","کہانیاں","القصص"],
  "ټول تعامل":["تعاملات","Interactions","تعاملات","التفاعلات"],
  "🌤️ د هوا اوسنی حالت":["🌤️ وضعیت فعلی هوا","🌤️ Current Weather","🌤️ موجودہ موسم","🌤️ حالة الطقس الحالية"],
  "تودوخه":["دما","Temperature","درجہ حرارت","درجة الحرارة"],
  "رطوبت":["رطوبت","Humidity","نمی","الرطوبة"],
  "باد":["باد","Wind","ہوا","الرياح"],
  "د لمانځه او اذان مرکز":["مرکز نماز و اذان","Prayer and Adhan Center","نماز اور اذان مرکز","مركز الصلاة والأذان"],
  "د نن ذکر":["ذکر امروز","Today's Zikr","آج کا ذکر","ذكر اليوم"],
  "ډاډ ورکوونکې جمله":["جمله اطمینان‌بخش","Encouraging Message","حوصلہ افزا جملہ","عبارة مطمئنة"],
  "ښکلی لنډ شعر":["شعر کوتاه زیبا","Short Poem","خوبصورت مختصر نظم","قصيدة قصيرة جميلة"],
  "مینه او تعامل":["محبت و تعامل","Engagement","محبت اور تعامل","المحبة والتفاعل"],
  "سیستم فعال دی":["سیستم فعال است","System is active","نظام فعال ہے","النظام نشط"],
  "ولیږه":["ارسال","Send","بھیجیں","إرسال"],
  "ℹ️ د سیستم معلومات":["ℹ️ معلومات سیستم","ℹ️ System Information","ℹ️ سسٹم کی معلومات","ℹ️ معلومات النظام"],
  "مستقیم WhatsApp اړیکه":["تماس مستقیم واتساپ","Direct WhatsApp Contact","براہِ راست واٹس ایپ رابطہ","اتصال مباشر عبر واتساب"],
  "WhatsApp ته اړیکه":["تماس با واتساپ","Contact WhatsApp","واٹس ایپ سے رابطہ","التواصل عبر واتساب"],
  "➕ نوی شیت":["➕ شیت جدید","➕ New Sheet","➕ نئی شیٹ","➕ ورقة جديدة"],
  "➕ نوی ستون":["➕ ستون جدید","➕ New Column","➕ نیا کالم","➕ عمود جديد"],
  "➕ نوې کرښه":["➕ ردیف جدید","➕ New Row","➕ نئی قطار","➕ صف جديد"],
  "💾 خوندي کول":["💾 ذخیره","💾 Save","💾 محفوظ کریں","💾 حفظ"],
  "فورمیک چمتو دی":["فورمیک آماده است","Formic is ready","فارمک تیار ہے","فورميك جاهز"],
  "لیک":["فونت","Font","فونٹ","الخط"],
  "رنګ":["رنگ","Color","رنگ","اللون"],
  "سمون":["تراز","Alignment","سیدھ","المحاذاة"],
  "ښي":["راست","Right","دائیں","يمين"],
  "منځ":["وسط","Center","درمیان","وسط"],
  "چپ":["چپ","Left","بائیں","يسار"],
  "پورته":["بالا","Top","اوپر","أعلى"],
  "لاندې":["پایین","Bottom","نیچے","أسفل"],
  "سرحد":["حاشیه","Border","بارڈر","الحدود"],
  "شمېرې":["اعداد","Numbers","اعداد","الأرقام"],
  "🗑️ اوسنی شیت حذف کړه":["🗑️ حذف شیت فعلی","🗑️ Delete Current Sheet","🗑️ موجودہ شیٹ حذف کریں","🗑️ حذف الورقة الحالية"],
  "یادونه:":["یادداشت:","Note:","نوٹ:","ملاحظة:"],
  "🔍 د فورم لټون":["🔍 جستجوی فورم","🔍 Form Search","🔍 فارم تلاش","🔍 بحث النموذج"],
  "د فورمي نمبر":["شماره فورم","Form Number","فارم نمبر","رقم النموذج"],
  "د سرچ لپاره اختیاري ده.":["برای جستجو اختیاری است.","Optional for search.","تلاش کے لیے اختیاری ہے۔","اختياري للبحث."],
  "📄 د لټون پایله":["📄 نتیجه جستجو","📄 Search Result","📄 تلاش کا نتیجہ","📄 نتيجة البحث"],
  "🚫 د لاسرسي اجازه نشته":["🚫 اجازه دسترسی وجود ندارد","🚫 Access denied","🚫 رسائی کی اجازت نہیں","🚫 لا توجد صلاحية وصول"],
  "👮 د ادمین مدیریت":["👮 مدیریت ادمین","👮 Admin Management","👮 ایڈمن مینجمنٹ","👮 إدارة المشرفين"],
  "👥 ټول اډمینان":["👥 همه ادمین‌ها","👥 All Admins","👥 تمام ایڈمن","👥 جميع المشرفين"],
  "🟢 فعال اډمینان":["🟢 ادمین‌های فعال","🟢 Active Admins","🟢 فعال ایڈمن","🟢 المشرفون النشطون"],
  "🛡️ ستر اډمینان":["🛡️ سوپر ادمین‌ها","🛡️ Super Admins","🛡️ سپر ایڈمن","🛡️ المشرفون الرئيسيون"],
  "👤 زما معلومات":["👤 معلومات من","👤 My Information","👤 میری معلومات","👤 معلوماتي"],
  "➕ نوی اډمین پروفایل":["➕ پروفایل ادمین جدید","➕ New Admin Profile","➕ نیا ایڈمن پروفائل","➕ ملف مشرف جديد"],
  "➕ جوړول":["➕ ایجاد","➕ Create","➕ بنائیں","➕ إنشاء"],
  "⚙️ عملیات":["⚙️ عملیات","⚙️ Actions","⚙️ کارروائیاں","⚙️ العمليات"],
  "معلومات لوډېږي...":["در حال بارگذاری اطلاعات...","Loading information...","معلومات لوڈ ہو رہی ہیں...","جارٍ تحميل المعلومات..."],
  "📚 د ثبت شوو کسانو مدیریت":["📚 مدیریت افراد ثبت‌شده","📚 Registered People Management","📚 رجسٹرڈ افراد کا انتظام","📚 إدارة الأشخاص المسجلين"],
  "🔒 ریکارډونه پټ دي.":["🔒 سوابق پنهان هستند.","🔒 Records are hidden.","🔒 ریکارڈز چھپے ہوئے ہیں۔","🔒 السجلات مخفية."],
  "💾 معلومات ساتل":["💾 حفظ معلومات","💾 Save Information","💾 معلومات محفوظ کریں","💾 حفظ المعلومات"],
  "لغوه":["لغو","Cancel","منسوخ","إلغاء"],
  "👥 ټول کاروونکي":["👥 همه کاربران","👥 All Users","👥 تمام صارفین","👥 جميع المستخدمين"],
  "🔄 تازه کول":["🔄 تازه‌سازی","🔄 Refresh","🔄 تازہ کریں","🔄 تحديث"],
  "تر اوسه کوم کاروونکی ونه موندل شو.":["تا کنون کاربری یافت نشد.","No user found yet.","ابھی تک کوئی صارف نہیں ملا۔","لم يتم العثور على أي مستخدم بعد."],
  "Role":["نقش","Role","کردار","الدور"],
  "User":["کاربر","User","صارف","مستخدم"],
  "Admin":["ادمین","Admin","ایڈمن","مشرف"],
  "Super Admin":["سوپر ادمین","Super Admin","سپر ایڈمن","مشرف رئيسي"],
  "AM":["قبل از ظهر","AM","قبل دوپہر","ص"],
  "PM":["بعد از ظهر","PM","بعد دوپہر","م"],
  "هیڅ پایله ونه موندل شوه.":["هیچ نتیجه‌ای یافت نشد.","No results found.","کوئی نتیجہ نہیں ملا۔","لم يتم العثور على نتائج."],
  "⏳ ثبتېږي...":["⏳ در حال ثبت...","⏳ Saving...","⏳ درج کیا جا رہا ہے...","⏳ جارٍ التسجيل..."],
  "فورمه په بریالیتوب آنلاین ثبت شوه.":["فورم با موفقیت آنلاین ثبت شد.","Form registered online successfully.","فارم کامیابی سے آن لائن درج ہوگیا۔","تم تسجيل النموذج بنجاح عبر الإنترنت."],
  "✅ آنلاین خوندي شول":["✅ به‌صورت آنلاین ذخیره شد","✅ Saved online","✅ آن لائن محفوظ ہوگیا","✅ تم الحفظ عبر الإنترنت"],
  "یوازې ستر اډمین تنظیمات بدلولی شي.":["فقط سوپر ادمین می‌تواند تنظیمات را تغییر دهد.","Only the Super Admin can change settings.","صرف سپر ایڈمن ترتیبات تبدیل کرسکتا ہے۔","يمكن للمشرف الرئيسي فقط تغيير الإعدادات."]
};

let currentLanguage = "ps";
let observerStarted = false;
let applying = false;

function normalize(value) {
  return String(value ?? "").replace(/ /g, " ").replace(/s+/g, " ").trim();
}

export function getGlobalTranslation(key, language = currentLanguage, replacements = {}) {
  const pack = CORE[LANGUAGES[language] ? language : "ps"] || CORE.ps;
  let value = pack[key] ?? CORE.ps[key] ?? null;
  if (value == null) return null;
  Object.entries(replacements || {}).forEach(([name, replacement]) => {
    value = value.replaceAll("{" + name + "}", String(replacement));
  });
  return value;
}

function translateText(source, language) {
  if (language === "ps") return source;
  const item = TEXT[normalize(source)];
  if (!item) return source;
  const index = { fa:0, en:1, ur:2, ar:3 }[language];
  return item[index] ?? source;
}

function shouldSkip(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (["SCRIPT","STYLE","NOSCRIPT","CODE","PRE","SVG","TEXTAREA"].includes(parent.tagName)) return true;
  if (parent.closest("[data-no-i18n]")) return true;
  return !normalize(node.nodeValue);
}

function applyNode(node) {
  if (shouldSkip(node)) return;
  if (node.__krhaOriginalText === undefined) node.__krhaOriginalText = node.nodeValue;
  const source = normalize(node.__krhaOriginalText);
  const value = translateText(source, currentLanguage);
  if (value !== source) {
    applying = true;
    node.nodeValue = value;
    applying = false;
  }
}

function applyAttribute(element, attribute) {
  const marker = "data-krha-original-" + attribute;
  if (!element.hasAttribute(marker)) {
    element.setAttribute(marker, element.getAttribute(attribute) || "");
  }
  const source = element.getAttribute(marker) || "";
  const value = translateText(source, currentLanguage);
  if (value !== source) element.setAttribute(attribute, value);
}

function applyElement(element) {
  if (!(element instanceof Element)) return;
  ["placeholder","title","aria-label"].forEach(attribute => {
    if (element.hasAttribute(attribute)) applyAttribute(element, attribute);
  });
  if (element.matches("option")) {
    const marker = "data-krha-original-option";
    if (!element.hasAttribute(marker)) element.setAttribute(marker, normalize(element.textContent || ""));
    const source = element.getAttribute(marker) || "";
    const value = translateText(source, currentLanguage);
    if (value !== source) element.textContent = value;
  }
}

function walk(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(applyNode);
  root.querySelectorAll?.("input,textarea,button,select,option,[title],[aria-label]").forEach(applyElement);
}

function startObserver() {
  if (observerStarted || typeof MutationObserver === "undefined" || !document.body) return;
  observerStarted = true;
  const observer = new MutationObserver(mutations => {
    if (applying) return;
    mutations.forEach(mutation => {
      if (mutation.type === "characterData") applyNode(mutation.target);
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) applyNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) {
            applyElement(node);
            walk(node);
          }
        });
      }
    });
  });
  observer.observe(document.body, {subtree:true, childList:true, characterData:true});
}

export function applyGlobalLanguage(language = "ps") {
  currentLanguage = LANGUAGES[language] ? language : "ps";
  if (typeof document === "undefined") return currentLanguage;
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = LANGUAGES[currentLanguage].dir;
  document.body?.setAttribute("data-global-language", currentLanguage);
  walk(document.body);
  startObserver();
  window.dispatchEvent(new CustomEvent("krha-global-language-applied", {
    detail:{ language: currentLanguage, direction: LANGUAGES[currentLanguage].dir }
  }));
  return currentLanguage;
}

if (typeof window !== "undefined") {
  window.KrhaI18n = {
    t:(key,replacements,language) => getGlobalTranslation(key,language || currentLanguage,replacements || {}) || key,
    apply:applyGlobalLanguage,
    getLanguage:() => currentLanguage,
    languages:LANGUAGES
  };
}

export { LANGUAGES, CORE };
