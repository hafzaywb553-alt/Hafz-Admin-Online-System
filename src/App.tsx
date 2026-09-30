import { useEffect, useMemo, useState } from 'react';
import { auth, api } from '@appdeploy/client';
import { PresenceBar } from './presence';
import { DeviceGate, DeviceSecurityCard, hasDeviceLock, registerDeviceLock } from './device-lock';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  FileBarChart2,
  FileText,
  Globe2,
  Home,
  MessageCircle,
  Phone,
  PlayCircle,
  Palette,
  Landmark,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  Users,
  WalletCards,
  X,
} from 'lucide-react';

type Lang = 'ps' | 'fa' | 'ar' | 'ur' | 'en';
type Section =
  | 'home'
  | 'personnel'
  | 'payroll'
  | 'salaryInfo'
  | 'salaryRules'
  | 'transactions'
  | 'accounts'
  | 'ledger'
  | 'compliance'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'help'
  | 'contact';

type Person = {
  id: string;
  name: string;
  employeeNo: string;
  rank: string;
  position: string;
  baseSalary: number;
  recurringAllowance: number;
  extraordinaryAllowance: number;
  fees: number;
  ownerEmail?: string;
};

type Tx = {
  id: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
  referenceNo?: string;
  ownerEmail?: string;
};
type Payroll = {
  id: string;
  personId: string;
  institution?: string;
  month: string;
  baseSalary: number;
  recurringAllowance: number;
  extraordinaryAllowance: number;
  fees: number;
  taxAmount?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  taxableIncome?: number;
  gross: number;
  net: number;
  createdAt: string;
  ownerEmail?: string;
};

type LedgerEntry = {
  id: string;
  sourceId: string;
  date: string;
  reference: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
};

type UiSettings = {
  accent: string;
  background: string;
  panel: string;
  font: string;
  fontSize: number;
  bold: boolean;
  radius: number;
  density: 'compact' | 'normal' | 'spacious';
  showDateBar: boolean;
  showPrayerTimes: boolean;
  showGregorian: boolean;
  showSolar: boolean;
  showHijri: boolean;
  prayerTimes: Record<string, string>;
};

const UI_COLOR_PRESETS = [
  { name: 'زمردي', accent: '#19a463', background: '#07100c', panel: '#0c1813' },
  { name: 'اسماني', accent: '#2f8cff', background: '#07111c', panel: '#0d1b29' },
  { name: 'بنفشي', accent: '#9a63ff', background: '#0e0b18', panel: '#181128' },
  { name: 'طلایي', accent: '#d6a63c', background: '#151108', panel: '#211a0b' },
  { name: 'فیروزي', accent: '#17b6b0', background: '#061515', panel: '#0c2221' },
  { name: 'سور یاقوت', accent: '#e45a6a', background: '#16090d', panel: '#241017' },
  { name: 'نارنجي', accent: '#ef8b3d', background: '#160d07', panel: '#24160d' },
  { name: 'آبي ژور', accent: '#4d78ff', background: '#080e1b', panel: '#10192c' },
];

const DEFAULT_UI_SETTINGS: UiSettings = {
  accent: '#19a463',
  background: '#07100c',
  panel: '#0c1813',
  font: 'Noto Naskh Arabic',
  fontSize: 16,
  bold: false,
  radius: 18,
  density: 'normal',
  showDateBar: true,
  showPrayerTimes: true,
  showGregorian: true,
  showSolar: true,
  showHijri: true,
  prayerTimes: {
    Fajr: '04:30',
    Sunrise: '05:55',
    Dhuhr: '12:05',
    Asr: '15:30',
    Maghrib: '18:05',
    Isha: '19:25',
  },
};

const CONTACT_INFO = {
  name: 'حافظ محیب الله ایوب',
  province: 'ارزګان',
  district: 'چوره',
  village: 'خواجه خدیر',
  phone: '0705965475',
  whatsapp: 'https://wa.me/93705965475?text=' + encodeURIComponent('سلام حافظ محیب الله ایوب صاحب، زه غواړم د اداري/مالي سیسټم په اړه معلومات او مرسته واخلم.'),
  youtube: 'https://youtube.com/channel/UCgilh9KTiPaLGCsDELLNcjw?si=_5S2nAM10pOKoe4J',
  facebook: 'https://www.facebook.com/share/19eC9AWWRF/',
};

const T: Record<Lang, Record<string, string>> = {
  ps: {
    app: 'د ۲۰۵ البدر قول اردو د ۵۰۲ پیاده لواء مالي مدیریت',
    login: 'خوندي ننوتل',
    email: 'خپل ایمیل له لارې ننوتل',
    home: 'عمومي پاڼه',
    personnel: 'کارکوونکي',
    payroll: 'معاشونه',
    salaryRules: 'د معاش او امتیازونو لایحه',
    transactions: 'عایدات او مصارف',
    accounts: 'حسابونه',
    ledger: 'عمومي دفتر',
    compliance: 'قوانین او مقررات',
    reports: 'راپورونه',
    audit: 'د حساب پلټنه',
    settings: 'تنظیمات',
    help: 'لارښود',
    contact: 'زموږ سره اړیکه',
    signout: 'وتل',
    welcome: 'د مالي مدیریت مرکزي سیستم',
    subtitle: 'د معاشونو، حسابونو، مصارفو، امتیازاتو او راپورونو آنلاین مدیریت',
    add: 'نوی ثبت',
    save: 'ثبتول',
    cancel: 'لغوه',
    search: 'لټون',
    name: 'نوم',
    employeeNo: 'د کارکوونکي شمېره',
    rank: 'رتبه',
    position: 'بست/دنده',
    base: 'اساسي معاش',
    recurring: 'ثابت امتیاز',
    extraordinary: 'فوق العاده فیس/امتیاز',
    fees: 'کسرات/فیسونه',
    gross: 'ټول معاش',
    net: 'خالص معاش',
    month: 'میاشت',
    description: 'تشریح',
    amount: 'مقدار',
    income: 'عاید',
    expense: 'مصرف',
    category: 'ډول',
    date: 'نېټه',
    noData: 'تر اوسه ثبت نشته',
    totalPeople: 'ټول کارکوونکي',
    totalPayroll: 'د معاشونو مجموعه',
    totalIncome: 'ټول عاید',
    totalExpense: 'ټول مصارف',
    language: 'ژبه',
    theme: 'بڼه',
    dark: 'تیاره',
    light: 'روښانه',
    auditNote: 'هر مهم بدلون د کاروونکي ایمیل او وخت سره ثبتېږي.',
    helpText:
      'د سیستم هره برخه د واضح فورمو او د تایید له مرحلو سره جوړه شوې. د معاش محاسبه یوازې د ثبت شوو ارقامو پر بنسټ ترسره کېږي.',
    creator: 'جوړونکی او مرسته کوونکی',
    alerts: 'ستونزې او خبرتیاوې',
    enable: 'خبرتیاوې فعالول',
    notifications: 'خبرتیاوې',
    welcomeUser: 'ښه راغلاست',
    access: 'ستاسې ایمیل د ننوتلو لپاره کارول کېږي.',
  },
  fa: {
    app: 'مدیریت مالی قول اردو',
    login: 'ورود امن',
    email: 'ورود با ایمیل',
    home: 'خانه',
    personnel: 'کارمندان',
    payroll: 'معاش‌ها',
    salaryRules: 'لایحه معاش و امتیازات',
    transactions: 'عواید و مصارف',
    accounts: 'حساب‌ها',
    ledger: 'دفتر کل',
    compliance: 'قوانین و مقررات',
    reports: 'گزارش‌ها',
    audit: 'ثبت حسابرسی',
    settings: 'تنظیمات',
    help: 'راهنما',
    contact: 'ارتباط با ما',
    signout: 'خروج',
    welcome: 'سیستم مرکزی مدیریت مالی',
    subtitle: 'مدیریت معاش، حساب، مصارف، امتیازات و گزارش‌ها',
    add: 'ثبت جدید',
    save: 'ذخیره',
    cancel: 'لغو',
    search: 'جستجو',
    name: 'نام',
    employeeNo: 'شماره کارمند',
    rank: 'رتبه',
    position: 'بست/وظیفه',
    base: 'معاش اساسی',
    recurring: 'امتیاز ثابت',
    extraordinary: 'امتیاز فوق‌العاده',
    fees: 'کسرات/فیس',
    gross: 'مجموع معاش',
    net: 'معاش خالص',
    month: 'ماه',
    description: 'شرح',
    amount: 'مقدار',
    income: 'عاید',
    expense: 'مصرف',
    category: 'نوع',
    date: 'تاریخ',
    noData: 'هنوز ثبت نشده',
    totalPeople: 'مجموع کارمندان',
    totalPayroll: 'مجموع معاش',
    totalIncome: 'مجموع عاید',
    totalExpense: 'مجموع مصارف',
    language: 'زبان',
    theme: 'ظاهر',
    dark: 'تاریک',
    light: 'روشن',
    auditNote: 'تغییرات مهم با ایمیل کاربر و زمان ثبت می‌شود.',
    helpText: 'هر بخش با فورم‌های واضح و مراحل تأیید ساخته شده است.',
    creator: 'سازنده و همکار',
    alerts: 'هشدارها',
    enable: 'فعال‌سازی هشدارها',
    notifications: 'اعلان‌ها',
    welcomeUser: 'خوش آمدید',
    access: 'ایمیل شما برای ورود استفاده می‌شود.',
  },
  ar: {
    app: 'نظام الإدارة المالية',
    login: 'تسجيل دخول آمن',
    email: 'الدخول بالبريد',
    home: 'الرئيسية',
    personnel: 'الموظفون',
    payroll: 'الرواتب',
    salaryRules: 'لوائح الرواتب والبدلات',
    transactions: 'الإيرادات والمصروفات',
    accounts: 'الحسابات',
    ledger: 'دفتر الأستاذ',
    compliance: 'القوانين واللوائح',
    reports: 'التقارير',
    audit: 'التدقيق',
    settings: 'الإعدادات',
    help: 'المساعدة',
    contact: 'اتصل بنا',
    signout: 'خروج',
    welcome: 'نظام الإدارة المالية المركزي',
    subtitle: 'إدارة الرواتب والحسابات والمصروفات والبدلات والتقارير',
    add: 'إضافة',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    name: 'الاسم',
    employeeNo: 'رقم الموظف',
    rank: 'الرتبة',
    position: 'الوظيفة',
    base: 'الراتب الأساسي',
    recurring: 'بدل ثابت',
    extraordinary: 'بدل استثنائي',
    fees: 'خصومات/رسوم',
    gross: 'الإجمالي',
    net: 'الصافي',
    month: 'الشهر',
    description: 'الوصف',
    amount: 'المبلغ',
    income: 'إيراد',
    expense: 'مصروف',
    category: 'الفئة',
    date: 'التاريخ',
    noData: 'لا توجد سجلات',
    totalPeople: 'إجمالي الموظفين',
    totalPayroll: 'إجمالي الرواتب',
    totalIncome: 'إجمالي الإيرادات',
    totalExpense: 'إجمالي المصروفات',
    language: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    auditNote: 'يتم تسجيل التغييرات المهمة مع بريد المستخدم والوقت.',
    helpText: 'كل قسم يحتوي على نماذج واضحة وخطوات تحقق.',
    creator: 'المنشئ والمساعد',
    alerts: 'التنبيهات',
    enable: 'تفعيل التنبيهات',
    notifications: 'الإشعارات',
    welcomeUser: 'مرحباً',
    access: 'يستخدم بريدك لتسجيل الدخول.',
  },
  ur: {
    app: 'مالی انتظامی نظام',
    login: 'محفوظ لاگ ان',
    email: 'ای میل سے لاگ ان',
    home: 'ہوم',
    personnel: 'ملازمین',
    payroll: 'تنخواہیں',
    salaryRules: 'تنخواہ و الاؤنسز کے قواعد',
    transactions: 'آمدنی و اخراجات',
    accounts: 'اکاؤنٹس',
    ledger: 'جنرل لیجر',
    compliance: 'قوانین و ضوابط',
    reports: 'رپورٹس',
    audit: 'آڈٹ',
    settings: 'ترتیبات',
    help: 'مدد',
    contact: 'ہم سے رابطہ',
    signout: 'لاگ آؤٹ',
    welcome: 'مرکزی مالی انتظامی نظام',
    subtitle: 'تنخواہ، اکاؤنٹس، اخراجات، الاؤنسز اور رپورٹس',
    add: 'نیا اندراج',
    save: 'محفوظ',
    cancel: 'منسوخ',
    search: 'تلاش',
    name: 'نام',
    employeeNo: 'ملازم نمبر',
    rank: 'عہدہ',
    position: 'ملازمت',
    base: 'بنیادی تنخواہ',
    recurring: 'مستقل الاؤنس',
    extraordinary: 'خصوصی الاؤنس',
    fees: 'کٹوتی/فیس',
    gross: 'کل',
    net: 'خالص',
    month: 'مہینہ',
    description: 'تفصیل',
    amount: 'رقم',
    income: 'آمدنی',
    expense: 'خرچ',
    category: 'قسم',
    date: 'تاریخ',
    noData: 'کوئی ریکارڈ نہیں',
    totalPeople: 'کل ملازمین',
    totalPayroll: 'کل تنخواہیں',
    totalIncome: 'کل آمدنی',
    totalExpense: 'کل اخراجات',
    language: 'زبان',
    theme: 'تھیم',
    dark: 'ڈارک',
    light: 'روشن',
    auditNote: 'اہم تبدیلیاں صارف کے ای میل اور وقت کے ساتھ محفوظ ہوتی ہیں۔',
    helpText: 'ہر سیکشن واضح فارم اور تصدیقی مراحل کے ساتھ بنایا گیا ہے۔',
    creator: 'تخلیق کار اور معاون',
    alerts: 'تنبیہات',
    enable: 'تنبیہات فعال کریں',
    notifications: 'اطلاعات',
    welcomeUser: 'خوش آمدید',
    access: 'آپ کا ای میل لاگ ان کے لیے استعمال ہوتا ہے۔',
  },
  en: {
    app: '205 Al-Badr 502 Infantry Brigade Finance Management',
    login: 'Secure Sign-in',
    email: 'Sign in with your email',
    home: 'Home',
    personnel: 'Personnel',
    payroll: 'Payroll',
    salaryRules: 'Salary & Allowance Rules',
    transactions: 'Income & Expenses',
    accounts: 'Accounts',
    ledger: 'General Ledger',
    compliance: 'Rules & Compliance',
    reports: 'Reports',
    audit: 'Audit Log',
    settings: 'Settings',
    help: 'Help',
    contact: 'Contact & Support',
    signout: 'Sign out',
    welcome: 'Central Finance Management System',
    subtitle:
      'Online management of payroll, accounts, expenses, allowances and reports',
    add: 'New Record',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    name: 'Name',
    employeeNo: 'Employee No.',
    rank: 'Rank',
    position: 'Position',
    base: 'Base Salary',
    recurring: 'Recurring Allowance',
    extraordinary: 'Extraordinary Allowance/Fee',
    fees: 'Deductions / Fees',
    gross: 'Gross',
    net: 'Net',
    month: 'Month',
    description: 'Description',
    amount: 'Amount',
    income: 'Income',
    expense: 'Expense',
    category: 'Category',
    date: 'Date',
    noData: 'No records yet',
    totalPeople: 'Personnel',
    totalPayroll: 'Payroll Total',
    totalIncome: 'Income Total',
    totalExpense: 'Expense Total',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    auditNote: 'Important changes are recorded with the user email and time.',
    helpText:
      'Every section uses clear forms and validation. Payroll is calculated only from stored numeric rules.',
    creator: 'Creator & Support',
    alerts: 'Alerts',
    enable: 'Enable alerts',
    notifications: 'Notifications',
    welcomeUser: 'Welcome',
    access: 'Your email is used for sign-in.',
  },
};

function roundMoney(n: number) {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
function money(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    roundMoney(n)
  );
}
function num(v: string) {
  const value = Number(String(v || '').replace(/,/g, ''));
  return Number.isFinite(value) ? roundMoney(value) : 0;
}

const MOF_LOGO_URL = './mof-app-icon.svg';
function MofLogo({ size = 48 }: { size?: number }) {
  return (
    <span className="mof-logo" style={{ width: size, height: size }} aria-label="د افغانستان د مالیې وزارت لوګو">
      <img
        src={MOF_LOGO_URL}
        alt="د افغانستان د مالیې وزارت لوګو"
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <ShieldCheck size={Math.max(22, Math.round(size * 0.62))} />
    </span>
  );
}

const ADMIN_EMAILS = ['hafzaywb553@gmail.com'];
function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}
function isAdminEmail(value: unknown) {
  return ADMIN_EMAILS.includes(normalizeEmail(value));
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineUnlocked, setOfflineUnlocked] = useState(false);
  const [lastUserEmail, setLastUserEmail] = useState(() => localStorage.getItem('finance_last_user_email') || '');
  const [systemClosed, setSystemClosed] = useState(() => localStorage.getItem('finance_system_closed') === '1');
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('finance_lang') as Lang) || 'ps');
  const [theme, setTheme] = useState<'dark' | 'light'>((localStorage.getItem('finance_theme') as any) || 'dark');
  const [section, setSection] = useState<Section>('home');
  const [sidebar, setSidebar] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [uiSettings, setUiSettings] = useState<UiSettings>(() => {
    try {
      return { ...DEFAULT_UI_SETTINGS, ...(JSON.parse(localStorage.getItem('finance_ui_settings') || '{}')) };
    } catch {
      return DEFAULT_UI_SETTINGS;
    }
  });
  const t = T[lang];
  const isAdmin = isAdminEmail(user?.email || pendingUser?.email || '');

  useEffect(() => {
    let active = true;
    auth.getUser()
      .then(async current => {
        if (!active) return;
        if (systemClosed) {
          await auth.signOut().catch(() => {});
          setUser(null);
          setPendingUser(null);
          setDeviceLocked(false);
          return;
        }
        if (!current) {
          setUser(null);
          setPendingUser(null);
          setDeviceLocked(false);
          return;
        }
        const emailKey = String(current.email || '').trim().toLowerCase();
        if (emailKey) {
          localStorage.setItem('finance_last_user_email', emailKey);
          setLastUserEmail(emailKey);
        }
        const forceDeviceGate = localStorage.getItem('finance_exit_device_gate') === emailKey;
        const needsDevice = forceDeviceGate || isAdminEmail(current.email || '') || hasDeviceLock(current.email || '');
        setPendingUser(current);
        setDeviceLocked(needsDevice);
        setUser(needsDevice ? null : current);
        api.post('/api/profile', {}).catch(() => {});
      })
      .catch(() => {
        if (active) {
          const savedEmail = localStorage.getItem('finance_last_user_email') || '';
          setLastUserEmail(savedEmail);
          setUser(null);
          setPendingUser(!navigator.onLine && savedEmail ? { email: savedEmail } : null);
          setDeviceLocked(!navigator.onLine && !!savedEmail);
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, [systemClosed]);

  useEffect(() => {
    const online = () => { setIsOnline(true); setOfflineUnlocked(false); };
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    const handler = (event: any) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', uiSettings.accent);
    root.style.setProperty('--page-bg-custom', uiSettings.background);
    root.style.setProperty('--panel-bg-custom', uiSettings.panel);
    root.style.setProperty('--font-family-custom', uiSettings.font);
    root.style.setProperty('--font-size-custom', uiSettings.fontSize + 'px');
    root.style.setProperty('--radius-custom', uiSettings.radius + 'px');
    root.dataset.fontWeight = uiSettings.bold ? 'bold' : 'normal';
    root.dataset.density = uiSettings.density;
    localStorage.setItem('finance_ui_settings', JSON.stringify(uiSettings));
  }, [uiSettings]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.body.dataset.theme = theme;
    localStorage.setItem('finance_lang', lang);
    localStorage.setItem('finance_theme', theme);
  }, [lang, theme]);
  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(''), 1800);
      return () => clearTimeout(id);
    }
  }, [toast]);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, pr, tr, lg] = await Promise.all([
        api.get('/api/personnel'),
        api.get('/api/payroll'),
        api.get('/api/transactions'),
        api.get('/api/ledger'),
      ]);
      const loadedPeople = p.data.items || [];
      const loadedPayroll = (pr.data.items || []).map((record: Payroll) => {
        const base = roundMoney(record.baseSalary || 0);
        const recurring = roundMoney(record.recurringAllowance || 0);
        const extraordinary = roundMoney(record.extraordinaryAllowance || 0);
        const otherDeductions = roundMoney(record.otherDeductions || 0);
        const gross = roundMoney(base + recurring + extraordinary);
        const taxAmount = salaryTaxByInstitution(base, record.institution || DEFENSE_TAX_PROFILE_LABEL);
        const totalDeductions = roundMoney(taxAmount + otherDeductions);
        return { ...record, taxableIncome: base, taxAmount, totalDeductions, fees: totalDeductions, gross, net: roundMoney(gross - totalDeductions) };
      });
      setPeople(loadedPeople);
      setPayroll(loadedPayroll);
      setTx(tr.data.items || []);
      setLedger(lg.data.items || []);
    } catch (e: any) {
      setToast(e?.message || 'د معلوماتو د لوستلو ستونزه رامنځته شوه.');
    } finally {
      setLoading(false);
    }
  }

  function handleAuthenticatedUser(nextUser: any) {
    const emailKey = String(nextUser?.email || '').trim().toLowerCase();
    if (emailKey) {
      localStorage.setItem('finance_last_user_email', emailKey);
      setLastUserEmail(emailKey);
    }
    setPendingUser(nextUser);
    const needsDevice = isAdminEmail(nextUser?.email || '') || hasDeviceLock(nextUser?.email || '');
    setDeviceLocked(needsDevice);
    setUser(needsDevice ? null : nextUser);
    api.post('/api/profile', {}).catch(() => {});
  }

  async function signIn() {
    try {
      const result = await auth.signIn({ scope: 'openid email profile offline_access' });
      handleAuthenticatedUser(result.user);
    } catch (e: any) {
      const code = e?.code;
      setToast(
        code === 'popup_blocked'
          ? 'د ایمیل ننوتلو کړکۍ بنده ده؛ د براوزر Pop-up اجازه ورکړئ.'
          : code === 'popup_closed'
            ? 'د ننوتلو کړکۍ له بشپړېدو مخکې بنده شوه.'
            : code === 'auth_error'
              ? 'د ایمیل تصدیق ناکام شو؛ بیا هڅه وکړئ.'
              : `د ننوتلو ستونزه: ${code || 'نامعلومه تېروتنه'}`
      );
    }
  }

  async function installApp() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
    } finally {
      setInstallEvent(null);
    }
  }

  async function signOut() {
    try {
      await auth.signOut();
    } finally {
      setUser(null);
      setPendingUser(null);
      setDeviceLocked(false);
      setSection('home');
      setSidebar(false);
      setPeople([]);
      setPayroll([]);
      setTx([]);
      setLedger([]);
    }
  }

  async function exitSystemToHome() {
    const emailKey = normalizeEmail(user?.email || pendingUser?.email || lastUserEmail);
    const confirmed = window.confirm(
      'ایا یوازې له سیسټم څخه ووځئ او د موبایل اصلي Home پاڼې ته لاړ شئ؟\n\nستاسې فعلي ایمیل به sign-out نه شي. د بېرته راتګ پر وخت به د همدې حساب Fingerprint/PIN تصدیق کارول کېږي او بیا به ایمیل Login ته اړتیا نه وي.'
    );
    if (!confirmed || !emailKey) return;

    try {
      if (!hasDeviceLock(emailKey)) {
        await registerDeviceLock(emailKey);
      }
    } catch (e: any) {
      setToast(e?.message || 'د موبایل Fingerprint/PIN فعالول ونه شو؛ له سیستم وتل ونه ترسره شول.');
      return;
    }

    localStorage.setItem('finance_exit_device_gate', emailKey);
    setPendingUser(user || pendingUser || { email: emailKey });
    setDeviceLocked(true);
    setUser(null);
    setSidebar(false);
    setToast('سیستم بند نه شو؛ حساب مو خوندي پاتې شو او د بېرته راتګ لپاره Fingerprint/PIN قفل فعال شو.');

    try {
      window.close();
    } catch {
      // Some browser/PWA containers block window.close().
    }
    window.setTimeout(() => {
      try {
        window.location.href = 'intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.HOME;end';
      } catch {
        // Some browser/PWA containers block Android Home intents; the local device gate remains active.
      }
    }, 120);
  }

  async function switchAccount() {
    const confirmed = window.confirm(
      'ایا غواړئ له اوسني حساب څخه ووځئ او بل ایمیل/حساب ته لاړ شئ؟\n\nستاسې معلومات به خوندي پاتې شي.'
    );
    if (!confirmed) return;
    try {
      await auth.signOut();
    } finally {
      setUser(null);
      setPendingUser(null);
      setDeviceLocked(false);
      setSection('home');
      setSidebar(false);
      setPeople([]);
      setPayroll([]);
      setTx([]);
      setLedger([]);
    }
    localStorage.removeItem('finance_system_closed');
    setSystemClosed(false);
  }

  async function refreshSystemData() {
    await loadAll();
    setToast('معلومات تازه شول.');
  }

  if (systemClosed) {
    return (
      <SystemClosedScreen
        onReopen={() => {
          localStorage.removeItem('finance_system_closed');
          setSystemClosed(false);
        }}
        onSignIn={signIn}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="boot-screen">
        <MofLogo size={74} />
        <h2>د مالي مدیریت سیستم</h2>
        <p>د خوندي ننوتلو حالت چمتو کېږي...</p>
      </div>
    );
  }

  if (!user && pendingUser && deviceLocked) {
    return (
      <DeviceGate
        email={pendingUser.email || ''}
        isAdmin={isAdminEmail(pendingUser.email || '')}
        onUnlocked={() => {
          setDeviceLocked(false);
          localStorage.removeItem('finance_exit_device_gate');
          setUser(pendingUser);
        }}
        onSignOut={signOut}
      />
    );
  }

  if (!user && !isOnline) {
    if (pendingUser?.email && deviceLocked && !offlineUnlocked) {
      return (
        <DeviceGate
          email={pendingUser.email}
          isAdmin={isAdminEmail(pendingUser.email)}
          onUnlocked={() => {
            setDeviceLocked(false);
            setOfflineUnlocked(true);
          }}
          onSignOut={() => setOfflineUnlocked(false)}
        />
      );
    }
    return <OfflineSalaryHome />;
  }

  if (!user)
    return (
      <Login
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
        onSignIn={signIn}
      />
    );

  const totals = {
    payroll: payroll.reduce((s, x) => s + x.net, 0),
    income: tx
      .filter(x => x.type === 'income')
      .reduce((s, x) => s + x.amount, 0),
    expense: tx
      .filter(x => x.type === 'expense')
      .reduce((s, x) => s + x.amount, 0),
  };

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (sidebar ? 'open' : 'closed')}>
        <div className="brand">
          <div className="brand-logo">
            <MofLogo size={44} />
          </div>
          <div>
            <b>مالي مدیریت</b>
            <small>۲۰۵ البدر • ۵۰۲ پیاده لواء</small>
          </div>
        </div>
        <nav>
          {[
            ['home', Home, t.home],
            ['personnel', Users, t.personnel],
            ['payroll', Calculator, t.payroll],
            ['salaryInfo', WalletCards, 'معاشاتو معلومات'],
            ['salaryRules', ClipboardList, t.salaryRules],
            ['transactions', ReceiptText, t.transactions],
            ['accounts', Landmark, t.accounts],
            ['ledger', FileText, t.ledger],
            ['compliance', BookOpen, t.compliance],
            ['reports', BarChart3, t.reports],
            ['audit', ClipboardList, t.audit],
            ['settings', Settings, t.settings],
            ['help', CircleHelp, t.help],
            ['contact', Phone, t.contact],
          ].map(([id, I, label]: any) => (
            <button
              key={id}
              className={'nav-item nav-' + id + (section === id ? ' active' : '')}
              onClick={() => {
                setSection(id);
                if (window.innerWidth <= 900) setSidebar(false);
              }}
            >
              <I size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun size={18} />
            <span>{theme === 'dark' ? t.light : t.dark}</span>
          </button>
          <button className="refresh-system-btn" onClick={refreshSystemData}>
            <Search size={18} />
            <span>معلومات تازه کول</span>
          </button>
          <button className="account-switch-btn" onClick={switchAccount}>
            <Users size={18} />
            <span>بل ایمیل / حساب ته تلل</span>
          </button>
          <button className="danger exit-system-btn" onClick={exitSystemToHome}>
            <LogOut size={18} />
            <span>له سیسټم وتل</span>
          </button>
          <div className="sidebar-bottom-note">د حساب بدلول ایمیل له اوسني ننوتلو څخه وباسي؛ «له سیسټم وتل» ایمیل نه باسي.</div>
        </div>
      </aside>
      {sidebar && <button aria-label="بندول" className="shell-scrim" onClick={() => setSidebar(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebar(!sidebar)}>
            <Menu />
          </button>
          <MofLogo size={34} />
          <div className="crumb">{t.app}</div>
          <div className="top-actions">
            {installEvent && (
              <button className="install-btn" onClick={installApp}>
                <Plus size={16} /> نصب
              </button>
            )}
            <select
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
            >
              <option value="ps">پښتو</option>
              <option value="fa">دری</option>
              <option value="ar">العربية</option>
              <option value="ur">اردو</option>
              <option value="en">English</option>
            </select>
            <span className="user-chip">{user.email}</span>
          </div>
        </header>

        <section className="content">
          <div className="page-head">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> آنلاین مالي سیستم {isAdmin && <b className="admin-chip">SUPER ADMIN</b>}
              </div>
              <h1>{sectionTitle(section, t)}</h1>
              <p>{t.subtitle}</p>
            </div>
            <div className="mobile-actions">
              <button className="icon-btn" onClick={loadAll}>
                <Search size={18} />
              </button>
            </div>
          </div>
          <PresenceBar user={user} />
          {isAdmin && <div className="admin-banner"><ShieldCheck size={18} /><span>تاسې د مدیر په حساب کې یاست؛ د ټولو حسابونو ثبتونه درته ښکاري او د Edit/Delete صلاحیت لرئ.</span></div>}
          {loading && <div className="loading">معلومات لوډېږي...</div>}
          {!loading && section === 'home' && (
            <HomePage t={t} people={people} totals={totals} onGo={setSection} />
          )}
          {!loading && section === 'personnel' && (
            <Personnel
              t={t}
              people={people}
              refresh={loadAll}
              toast={setToast}
              userEmail={user.email}
              isAdmin={isAdmin}
            />
          )}
          {!loading && section === 'salaryInfo' && <SalaryInfoPage />}
          {!loading && section === 'salaryRules' && <SalaryRulesPage />}
          {!loading && section === 'payroll' && (
            <PayrollPage
              t={t}
              people={people}
              payroll={payroll}
              refresh={loadAll}
              toast={setToast}
              userEmail={user.email}
              isAdmin={isAdmin}
            />
          )}
          {!loading && section === 'transactions' && (
            <Transactions t={t} tx={tx} refresh={loadAll} toast={setToast} userEmail={user.email} isAdmin={isAdmin} />
          )}
          {!loading && section === 'accounts' && (
            <Accounts t={t} people={people} payroll={payroll} tx={tx} ledger={ledger} />
          )}
          {!loading && section === 'ledger' && <LedgerPage t={t} ledger={ledger} />}
          {!loading && section === 'compliance' && <CompliancePage t={t} />}
          {!loading && section === 'reports' && (
            <Reports t={t} people={people} payroll={payroll} tx={tx} ledger={ledger} />
          )}
          {!loading && section === 'audit' && <Audit t={t} />}
          {!loading && section === 'settings' && (
            <SettingsPage
              t={t}
              lang={lang}
              setLang={setLang}
              theme={theme}
              setTheme={setTheme}
              settings={uiSettings}
              setSettings={setUiSettings}
              userEmail={user.email}
              isAdmin={isAdmin}
              onContact={() => setSection('contact')}
              onRefresh={refreshSystemData}
            />
          )}
          {!loading && section === 'help' && <Help t={t} />}
          {!loading && section === 'contact' && <ContactPage />}
        </section>
        {toast && (
          <div className="toast" role="status">
            <AlertTriangle size={18} />
            {toast}
          </div>
        )}
        <footer className="app-footer">
          <div>
            <b>د مالي مدیریت سیستم</b>
            <span>© ۲۰۲۶ • معلومات په آنلاین Database کې خوندي دي.</span>
          </div>
          <span className="footer-status">د حساب بدلول او له سیسټم وتل یوازې د sidebar د وروستي کنټرولونو له لارې دي.</span>
        </footer>
      </main>
    </div>
  );
}

function sectionTitle(s: Section, t: any) {
  return (
    {
      home: t.home,
      personnel: t.personnel,
      payroll: t.payroll,
      salaryRules: t.salaryRules,
      transactions: t.transactions,
      accounts: t.accounts,
      ledger: t.ledger,
      compliance: t.compliance,
      reports: t.reports,
      audit: t.audit,
      settings: t.settings,
      help: t.help,
      contact: t.contact,
    } as any
  )[s];
}

function SystemClosedScreen({ onReopen, onSignIn }: any) {
  return (
    <div className="system-closed-screen">
      <div className="system-closed-card">
        <MofLogo size={82} />
        <h1>سیستم بند دی</h1>
        <p>سیستم په دې موبایل/براوزر کې بند شوی دی.</p>
        <small>ستاسو کسان، معاشونه، عایدات او مصارف نه دي حذف شوي؛ په آنلاین Database کې خوندي پاتې دي.</small>
        <button className="primary big" onClick={onReopen}>سیستم بېرته پرانیستل</button>
        <button className="ghost big" onClick={onSignIn}>د حساب سره ننوتل</button>
      </div>
    </div>
  );
}

function Login({ lang, setLang, theme, setTheme, t, onSignIn }: any) {
  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">
          <MofLogo size={58} />
        </div>
        <div className="eyebrow">
          <span className="live-dot" /> آنلاین • خوندي • RTL
        </div>
        <h1>{t.login}</h1>
        <h2>{t.app}</h2>
        <p>{t.access}</p>
        <button className="primary big" onClick={onSignIn}>
          <span>✉</span>
          {t.email}
        </button>
        <div className="login-tools">
          <select value={lang} onChange={e => setLang(e.target.value)}>
            <option value="ps">پښتو</option>
            <option value="fa">دری</option>
            <option value="ar">العربية</option>
            <option value="ur">اردو</option>
            <option value="en">English</option>
          </select>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
        <small>{t.auditNote}</small>
      </div>
    </div>
  );
}

function HomePage({ t, people, totals, onGo }: any) {
  const cards = [
    ['totalPeople', Users, people.length],
    ['totalPayroll', WalletCards, totals.payroll],
    ['totalIncome', BarChart3, totals.income],
    ['totalExpense', ReceiptText, totals.expense],
  ];
  return (
    <>
      <div className="hero">
        <div>
          <span className="hero-badge">مالي کنټرول</span>
          <h2>{t.welcome}</h2>
          <p>{t.subtitle}</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onGo('personnel')}>
              <Plus size={17} />
              {t.add}
            </button>
            <button className="ghost" onClick={() => onGo('reports')}>
              <FileBarChart2 size={17} />
              {t.reports}
            </button>
          </div>
        </div>
        <div className="hero-mark">
          <MofLogo size={92} />
        </div>
      </div>
      <div className="stats">
        {cards.map(([k, I, v]: any) => (
          <div className="stat" key={k}>
            <div className="stat-icon">
              <I size={20} />
            </div>
            <div>
              <span>{t[k]}</span>
              <b>{typeof v === 'number' ? money(v) : v}</b>
            </div>
          </div>
        ))}
      </div>
      <div className="quick-grid">
        {[
          ['personnel', Users, t.personnel],
          ['payroll', Calculator, t.payroll],
          ['salaryInfo', WalletCards, 'معاشاتو معلومات'],
          ['transactions', ReceiptText, t.transactions],
          ['reports', FileText, t.reports],
        ].map(([id, I, label]: any) => (
          <button key={id} className="quick" onClick={() => onGo(id)}>
            <I />
            <span>{label}</span>
            <ChevronLeft />
          </button>
        ))}
      </div>
    </>
  );
}

function OfflineSalaryHome() {
  return (
    <div className="offline-shell">
      <div className="offline-card">
        <WalletCards size={44} />
        <div className="eyebrow">OFFLINE • د معاشاتو معلومات</div>
        <h1>د معاشاتو معلومات</h1>
        <p>انټرنېټ نشته. د معاش محاسبه لا هم په همدې موبایل کې کار کوي.</p>
        <SalaryInfoPage />
      </div>
    </div>
  );
}

function SalaryInfoPage() {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('finance_salary_info_draft') || '{}'); } catch { return {}; }
  })();
  const [sector, setSector] = useState(saved.sector || 'security');
  const [institution, setInstitution] = useState(saved.institution || 'د ملي دفاع وزارت');
  const [name, setName] = useState(saved.name || '');
  const [employeeNo, setEmployeeNo] = useState(saved.employeeNo || '');
  const [rank, setRank] = useState(saved.rank || PUBLISHED_MILITARY_SALARIES_1405_TABLE[0]?.[0] || '');
  const [civilianRank, setCivilianRank] = useState(saved.civilianRank || CIVILIAN_VISIBLE_1405_TABLE[0]?.grade || '');
  const [serviceYears, setServiceYears] = useState(saved.serviceYears || '');
  const [educationLevel, setEducationLevel] = useState(saved.educationLevel || '');
  const [educationAllowance, setEducationAllowance] = useState(saved.educationAllowance || '0');
  const [feedingAllowance, setFeedingAllowance] = useState(saved.feedingAllowance || '0');
  const [otherAllowance, setOtherAllowance] = useState(saved.otherAllowance || '0');
  const [month, setMonth] = useState(saved.month || new Date().toISOString().slice(0, 7));
  const [absenceDays, setAbsenceDays] = useState(saved.absenceDays || '0');
  const [periodMonths, setPeriodMonths] = useState(saved.periodMonths || '1');
  const [dailyBasis, setDailyBasis] = useState(saved.dailyBasis || '30');
  const selectedMilitary = PUBLISHED_MILITARY_SALARIES_1405_TABLE.find(x => x[0] === rank) || PUBLISHED_MILITARY_SALARIES_1405_TABLE[0];
  const selectedCivilian = CIVILIAN_VISIBLE_1405_TABLE.find(x => x.grade === civilianRank) || CIVILIAN_VISIBLE_1405_TABLE[0];
  const standardNetSalary = sector === 'security' ? (selectedMilitary?.[1] || 0) : (selectedCivilian?.amount || 0);
  const years = num(serviceYears);
  const serviceAllowance = serviceTenureAllowance(years);
  const educationAmount = num(educationAllowance);
  const feeding = num(feedingAllowance);
  const other = num(otherAllowance);
  const gross = roundMoney(standardNetSalary + serviceAllowance + educationAmount + feeding + other);
  const basisDays = Math.min(31, Math.max(1, Math.floor(num(dailyBasis) || 30)));
  const absent = Math.min(basisDays, Math.max(0, Math.floor(num(absenceDays) || 0)));
  const absenceDeduction = roundMoney((gross / basisDays) * absent);
  const payableGross = roundMoney(Math.max(0, gross - absenceDeduction));
  const taxableSalary = standardNetSalary;
  const totalAllowances = roundMoney(serviceAllowance + educationAmount + feeding + other);
  const tax = salaryTaxByInstitution(taxableSalary, institution);
  const payableTax = salaryTaxByInstitution(Math.max(0, standardNetSalary - roundMoney((standardNetSalary / basisDays) * absent)), institution);
  const net = roundMoney(standardNetSalary - tax + totalAllowances);
  const payableNet = roundMoney(payableGross - payableTax);
  const months = Math.min(24, Math.max(1, Math.floor(num(periodMonths) || 1)));
  const periodGross = roundMoney(gross * months);
  const periodTax = roundMoney(tax * months);
  const periodNet = roundMoney(net * months);
  const periodPayableGross = roundMoney(payableGross * months);
  const periodPayableTax = roundMoney(payableTax * months);
  const periodPayableNet = roundMoney(payableNet * months);
  const periodAbsenceDeduction = roundMoney(absenceDeduction * months);
  const draft = { sector, institution, name, employeeNo, rank, civilianRank, serviceYears, educationLevel, educationAllowance, feedingAllowance, otherAllowance, month, absenceDays, periodMonths, dailyBasis };

  useEffect(() => {
    localStorage.setItem('finance_salary_info_draft', JSON.stringify(draft));
  }, [sector, institution, name, employeeNo, rank, civilianRank, serviceYears, educationLevel, educationAllowance, feedingAllowance, otherAllowance, month, absenceDays, periodMonths, dailyBasis]);

  return (
    <Panel title="معاشاتو معلومات">
      <div className="salary-info-hero">
        <div><div className="eyebrow"><span className="live-dot" /> آفلاین محاسبوي برخه</div><h2>د کارکوونکي د معاش بشپړه محاسبه</h2><p>نوم، بست، خدمت، تحصیل، اعاشه، غیرحاضري او نور منظور شوي ارقام داخل کړئ.</p></div>
        <WalletCards size={52} />
      </div>
      <div className="salary-info-grid">
        <label>نوم<input className="big-field" value={name} onChange={e => setName(e.target.value)} placeholder="لکه: احمد" /></label>
        <label>کارکوونکي نمبر<input className="big-field" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} /></label>
        <label>سکتور<select className="big-field" value={sector} onChange={e => setSector(e.target.value)}><option value="security">نظامي / امنیتي</option><option value="civilian">ملکي</option></select></label>
        <label>وزارت / اداره<select className="big-field" value={institution} onChange={e => setInstitution(e.target.value)}><option>د ملي دفاع وزارت</option><option>د کورنیو چارو وزارت</option><option>د استخباراتو لوی ریاست</option><option>نور نظامي تشکیلات لرونکی امارتي واحد</option><option>ملکي وزارت / امارتي اداره</option></select></label>
        {sector === 'security' ? <label>بست / رتبه<select className="big-field" value={rank} onChange={e => setRank(e.target.value)}>{PUBLISHED_MILITARY_SALARIES_1405_TABLE.map(x => <option key={x[0]} value={x[0]}>{x[0]} — خالص {money(x[1])}</option>)}</select></label> : <label>ملکي بست<select className="big-field" value={civilianRank} onChange={e => setCivilianRank(e.target.value)}>{CIVILIAN_VISIBLE_1405_TABLE.map(x => <option key={x.grade} value={x.grade}>{x.grade} — {x.step} — خالص {money(x.amount)}</option>)}</select></label>}
        <label>د خدمت موده (کلونه)<input className="big-field" type="number" min="0" value={serviceYears} onChange={e => setServiceYears(e.target.value)} /></label>
        <label>تحصیلي سند<select className="big-field" value={educationLevel} onChange={e => setEducationLevel(e.target.value)}><option value="">نه دی ټاکل شوی</option><option>لیسانس</option><option>ماستر</option><option>دوکتور</option><option>بل منظور سند</option></select></label>
        <label>د تحصیلي امتیاز منظور شوی رقم<input className="big-field" type="number" min="0" value={educationAllowance} onChange={e => setEducationAllowance(e.target.value)} placeholder="د حکم/سند رقم" /></label>
        <label>اعاشه / خوردګي<input className="big-field" type="number" min="0" value={feedingAllowance} onChange={e => setFeedingAllowance(e.target.value)} placeholder="لکه: 4050" /></label>
        <label>نور منظور امتیاز<input className="big-field" type="number" min="0" value={otherAllowance} onChange={e => setOtherAllowance(e.target.value)} /></label>
        <label>میاشت<input className="big-field" type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
        <label>د غیرحاضرۍ د ورځې محاسبوي اساس<input className="big-field" type="number" min="1" max="31" value={dailyBasis} onChange={e => setDailyBasis(e.target.value)} /><small>دا د ریاضي محاسبې اساس دی؛ د ادارې منظور رسمي divisor که بل وي، همدلته بدل کړئ.</small></label>
        <label>غیرحاضري ورځې<input className="big-field" type="number" min="0" max={basisDays} value={absenceDays} onChange={e => setAbsenceDays(e.target.value)} /></label>
        <label>څو میاشتې؟<input className="big-field" type="number" min="1" max="24" value={periodMonths} onChange={e => setPeriodMonths(e.target.value)} /></label>
      </div>
      <div className="salary-info-steps">
        <div className="salary-info-card salary-base"><span>خالص معیاري معاش</span><b>{money(standardNetSalary)}</b><small>ستاسې ورکړل شوی دقیق نورم</small></div>
        <div className="salary-info-card salary-service"><span>د خدمت امتیاز</span><b>{money(serviceAllowance)}</b><small>{serviceAllowance ? 'د خدمت مودې جدول' : 'تر ۳ کلونو کم'}</small></div>
        <div className="salary-info-card salary-edu"><span>تحصیلي امتیاز</span><b>{money(educationAmount)}</b><small>{educationLevel || 'رقم نه دی ثبت شوی'}</small></div>
        <div className="salary-info-card salary-food"><span>اعاشه / خوردګي</span><b>{money(feeding)}</b></div>
      </div>
      <div className="salary-results-grid">
        <div className="salary-result-card full"><span>مکمل میاشتنی معاش مخکې له مالیې</span><b>{money(gross)} افغانۍ</b></div>
        <div className="salary-result-card tax"><span>میاشتنۍ مالیه</span><b>{money(tax)} افغانۍ</b></div>
        <div className="salary-result-card net"><span>له مالیې وروسته معاش</span><b>{money(net)} افغانۍ</b></div>
        <div className="salary-result-card absence"><span>د {absent} ورځو غیرحاضرۍ کسر</span><b>{money(absenceDeduction)} افغانۍ</b></div>
        <div className="salary-result-card payable"><span>له غیرحاضرۍ وروسته ناخالص مستحق معاش</span><b>{money(payableGross)} افغانۍ</b></div>
        <div className="salary-result-card payable"><span>له غیرحاضرۍ وروسته مالیه</span><b>{money(payableTax)} افغانۍ</b></div>
        <div className="salary-result-card net"><span>له غیرحاضرۍ وروسته خالص مستحق معاش</span><b>{money(payableNet)} افغانۍ</b></div>
      </div>
      <div className="period-card">
        <h3>د څو میاشتو اتومات مجموعه</h3>
        <div className="salary-results-grid period">
          <div className="salary-result-card full"><span>د {months} میاشتو مکمل معاش</span><b>{money(periodGross)} افغانۍ</b></div>
          <div className="salary-result-card tax"><span>د {months} میاشتو ټول مالیه</span><b>{money(periodTax)} افغانۍ</b></div>
          <div className="salary-result-card net"><span>د {months} میاشتو خالص معاش</span><b>{money(periodNet)} افغانۍ</b></div>
        </div>
      </div>
      <div className="salary-summary-card">
        <div className="salary-summary-head">
          <div>
            <div className="eyebrow">د معاش ټولې پایلې</div>
            <h3>اتومات او واضح د محاسبې جدول</h3>
            <p>ټول امتیازات، له مالیې مخکې معاش، مالیه، له مالیې وروسته معاش، غیرحاضري او د {months} میاشتو مجموعه په یوه جدول کې.</p>
          </div>
          <Calculator size={30} />
        </div>
        <div className="table-wrap salary-summary-wrap">
          <table className="salary-summary-table">
            <thead>
              <tr>
                <th>د حساب برخه</th>
                <th>میاشتنی رقم</th>
                <th>د {months} میاشتو رقم</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>خالص معیاري معاش — ستاسې نورم</td><td>{money(standardNetSalary)}</td><td>{money(standardNetSalary * months)}</td></tr>
              <tr><td>د خدمت امتیاز</td><td>{money(serviceAllowance)}</td><td>{money(serviceAllowance * months)}</td></tr>
              <tr><td>تحصیلي امتیاز</td><td>{money(educationAmount)}</td><td>{money(educationAmount * months)}</td></tr>
              <tr><td>اعاشه / خوردګي</td><td>{money(feeding)}</td><td>{money(feeding * months)}</td></tr>
              <tr><td>نور منظور امتیاز</td><td>{money(other)}</td><td>{money(other * months)}</td></tr>
              <tr className="summary-total"><td>ټول امتیازات</td><td>{money(totalAllowances)}</td><td>{money(totalAllowances * months)}</td></tr>
              <tr className="summary-gross"><td>ټول معاش — له مالیې مخکې</td><td>{money(gross)}</td><td>{money(periodGross)}</td></tr>
              <tr className="summary-tax"><td>ټوله مالیه</td><td>{money(tax)}</td><td>{money(periodTax)}</td></tr>
              <tr className="summary-net"><td>له مالیې وروسته ټول معاش</td><td>{money(net)}</td><td>{money(periodNet)}</td></tr>
              <tr className="summary-absence"><td>د {absent} ورځو غیرحاضرۍ کسر</td><td>{money(absenceDeduction)}</td><td>{money(periodAbsenceDeduction)}</td></tr>
              <tr><td>له غیرحاضرۍ وروسته ناخالص مستحق معاش</td><td>{money(payableGross)}</td><td>{money(periodPayableGross)}</td></tr>
              <tr className="summary-tax"><td>له غیرحاضرۍ وروسته مالیه</td><td>{money(payableTax)}</td><td>{money(periodPayableTax)}</td></tr>
              <tr className="summary-net"><td>له غیرحاضرۍ وروسته خالص مستحق معاش</td><td>{money(payableNet)}</td><td>{money(periodPayableNet)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="salary-summary-foot">یادونه: د غیرحاضرۍ کسر د پورته ټاکل شوي محاسبوي اساس ({basisDays} ورځې) له مخې حساب شوی؛ دا شمېره د ادارې منظور divisor سره بدلېدای شي.</div>
      </div>
      <div className="notice warn salary-info-note"><ShieldCheck size={18} /><span>د ملي دفاع وزارت پروفایل: تر ۱۰,۰۰۰ معاف؛ ۱۰,۰۰۱ تر ۱۰۰,۰۰۰ لس سلنه؛ له ۱۰۰,۰۰۰ پورته پنځلس سلنه. دا ځانګړی پروفایل د کاروونکي ورکړی نورم دی، نه د عامه رسمي سند ادعا. د تحصیلي او نورو امتیازونو رقم یوازې د منظور سند له مخې داخل کړئ.</span></div>
      <div className="notice ok salary-info-offline"><CheckCircle2 size={18} /><span>د دې برخې محاسبه او draft د انټرنېټ پرته په همدې موبایل کې کار کوي او ساتل کېږي.</span></div>
    </Panel>
  );
}

function Personnel({ t, people, refresh, toast, userEmail, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const emptyForm = { name: '', employeeNo: '', rank: '', position: '', baseSalary: '', recurringAllowance: '', extraordinaryAllowance: '', fees: '' };
  const [form, setForm] = useState<any>(emptyForm);
  const list = people.filter((p: Person) => [p.name, p.employeeNo, p.rank, p.position, p.ownerEmail].join(' ').toLowerCase().includes(q.toLowerCase()));

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  }

  function openEdit(person: Person) {
    setEditId(person.id);
    setForm({
      name: person.name,
      employeeNo: person.employeeNo,
      rank: person.rank,
      position: person.position,
      baseSalary: String(person.baseSalary ?? 0),
      recurringAllowance: String(person.recurringAllowance ?? 0),
      extraordinaryAllowance: String(person.extraordinaryAllowance ?? 0),
      fees: String(person.fees ?? 0),
    });
    setOpen(true);
  }

  async function save(e: any) {
    e.preventDefault();
    if (!form.name || !form.employeeNo || num(form.baseSalary) < 0) {
      toast('نوم، شمېره او معتبر اساسي معاش اړین دي.');
      return;
    }
    const payload = {
      name: form.name,
      employeeNo: form.employeeNo,
      rank: form.rank,
      position: form.position,
      baseSalary: num(form.baseSalary),
      recurringAllowance: num(form.recurringAllowance),
      extraordinaryAllowance: num(form.extraordinaryAllowance),
      fees: num(form.fees),
    };
    try {
      if (editId) await api.put(`/api/personnel/${editId}`, payload);
      else await api.post('/api/personnel', payload);
      setOpen(false);
      setEditId(null);
      setForm({ ...emptyForm });
      await refresh();
      toast(editId ? 'د کارکوونکي معلومات سم شول.' : 'کارکوونکی په بریالیتوب ثبت او خوندي شو.');
    } catch (e: any) {
      toast(e?.message || 'ثبت/سمون ونه شو؛ د معلوماتو او صلاحیت حالت وڅېړئ.');
    }
  }

  async function remove(person: Person) {
    const canManage = isAdmin || String(person.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
    if (!canManage) return;
    if (!window.confirm(`ایا «${person.name}» او د هغه اړوند معاشي ثبتونه په بشپړ ډول حذف شي؟`)) return;
    try {
      await api.delete(`/api/personnel/${person.id}`);
      await refresh();
      toast('کارکوونکی او اړوند معاشي ثبتونه حذف شول.');
    } catch (e: any) {
      toast(e?.message || 'حذف ونه شو.');
    }
  }

  return (
    <Panel title={t.personnel} action={<button className="primary" onClick={openCreate}><Plus size={17} />{t.add}</button>}>
      <div className="toolbar">
        <div className="search"><Search size={17} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} /></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.name}</th><th>{t.employeeNo}</th><th>{t.rank}</th><th>{t.position}</th><th>{t.base}</th><th>{t.recurring}</th><th>{t.extraordinary}</th>{isAdmin && <th>ایمیل مالک</th>}<th>کړنې</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p: Person) => {
              const canManage = isAdmin || String(p.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
              return (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.employeeNo}</td><td>{p.rank}</td><td>{p.position}</td><td>{money(p.baseSalary)}</td><td>{money(p.recurringAllowance)}</td><td>{money(p.extraordinaryAllowance)}</td>{isAdmin && <td>{p.ownerEmail || '—'}</td>}
                  <td>
                    {canManage ? <div className="table-actions"><button className="table-edit-btn" onClick={() => openEdit(p)} title="سمول"><Pencil size={15} /></button><button className="table-delete-btn" onClick={() => remove(p)} title="حذف"><Trash2 size={15} /></button></div> : <span>—</span>}
                  </td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={isAdmin ? 9 : 8} className="empty">{t.noData}</td></tr>}
          </tbody>
        </table>
      </div>
      {open && <Modal title={editId ? 'د کارکوونکي سمون' : t.add} close={() => setOpen(false)}>
        <form className="form-grid" onSubmit={save}>
          {[
            ['name', t.name, 'text'], ['employeeNo', t.employeeNo, 'text'], ['rank', t.rank, 'text'], ['position', t.position, 'text'],
            ['baseSalary', t.base, 'number'], ['recurringAllowance', t.recurring, 'number'], ['extraordinaryAllowance', t.extraordinary, 'number'], ['fees', t.fees, 'number'],
          ].map(([k, l, type]: any) => <label key={k}>{l}<input type={type} min={type === 'number' ? 0 : undefined} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required={['name', 'employeeNo', 'baseSalary'].includes(k)} /></label>)}
          <div className="modal-actions"><button type="button" className="ghost" onClick={() => setOpen(false)}>{t.cancel}</button><button className="primary">{editId ? 'سمول' : t.save}</button></div>
        </form>
      </Modal>}
    </Panel>
  );
}function PayrollPage({ t, people, payroll, refresh, toast, userEmail, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [personId, setPersonId] = useState('');
  const [month, setMonth] = useState('');
  const [x, setX] = useState({ extraordinary: '0', otherDeductions: '0' });
  const person = people.find((p: Person) => p.id === personId);
  const gross = roundMoney((person?.baseSalary || 0) + (person?.recurringAllowance || 0) + num(x.extraordinary));
  const [institution, setInstitution] = useState('د ملي دفاع وزارت');
  const taxAmount = salaryTaxByInstitution(gross, institution);
  const otherDeductions = num(x.otherDeductions);
  const totalDeductions = roundMoney(taxAmount + otherDeductions);
  const net = roundMoney(gross - totalDeductions);

  function openCreate() {
    setEditId(null); setPersonId(''); setMonth(''); setInstitution('د ملي دفاع وزارت'); setX({ extraordinary: '0', otherDeductions: '0' }); setOpen(true);
  }
  function openEdit(record: Payroll) {
    const oldTax = num(record.taxAmount);
    const oldTotal = num(record.totalDeductions ?? record.fees);
    const preservedOther = record.otherDeductions !== undefined ? num(record.otherDeductions) : Math.max(0, roundMoney(oldTotal - oldTax));
    setEditId(record.id); setPersonId(record.personId); setMonth(record.month); setInstitution(record.institution || 'د ملي دفاع وزارت'); setX({ extraordinary: String(record.extraordinaryAllowance ?? 0), otherDeductions: String(preservedOther) }); setOpen(true);
  }

  async function save(e: any) {
    e.preventDefault();
    if (!person || !month) { toast('کارکوونکی او میاشت وټاکئ.'); return; }
    if (net < 0) { toast('خالص معاش له صفر څخه کم کېدای نه شي.'); return; }
    const payload = { personId, month, institution, extraordinaryAllowance: num(x.extraordinary), otherDeductions, taxableIncome: gross };
    try {
      if (editId) await api.put(`/api/payroll/${editId}`, payload); else await api.post('/api/payroll', payload);
      setOpen(false); setEditId(null); await refresh(); toast(editId ? 'معاش سم شو.' : 'معاش ثبت او خوندي شو.');
    } catch (e: any) { toast(e?.message || 'معاش ثبت/سم نه شو.'); }
  }

  async function remove(record: Payroll) {
    const canManage = isAdmin || String(record.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
    if (!canManage) return;
    if (!window.confirm(`ایا د ${record.month} معاش ریکارډ حذف شي؟`)) return;
    try { await api.delete(`/api/payroll/${record.id}`); await refresh(); toast('معاش حذف شو.'); } catch (e: any) { toast(e?.message || 'معاش حذف نه شو.'); }
  }

  return (
    <Panel title={t.payroll} action={<button className="primary" onClick={openCreate}><Plus size={17} />{t.add}</button>}>
      <div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>وزارت/اداره</th><th>{t.month}</th><th>{t.base}</th><th>{t.recurring}</th><th>{t.extraordinary}</th><th>مالیه</th><th>نور کسرات</th><th>ټول کسرات</th><th>{t.gross}</th><th>{t.net}</th>{isAdmin && <th>ایمیل مالک</th>}<th>کړنې</th></tr></thead>
      <tbody>{payroll.map((p: Payroll) => {
        const canManage = isAdmin || String(p.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
        return <tr key={p.id}><td>{people.find((z: Person) => z.id === p.personId)?.name || p.personId}</td><td>{p.institution || 'د ملي دفاع وزارت'}</td><td>{p.month}</td><td>{money(p.baseSalary)}</td><td>{money(p.recurringAllowance)}</td><td>{money(p.extraordinaryAllowance)}</td><td>{money(p.taxAmount ?? salaryTaxByInstitution(p.taxableIncome ?? p.gross, p.institution || 'د ملي دفاع وزارت'))}</td><td>{money(p.otherDeductions ?? Math.max(0, (p.totalDeductions ?? p.fees) - (p.taxAmount ?? salaryTaxByInstitution(p.taxableIncome ?? p.gross, p.institution || 'د ملي دفاع وزارت'))))}</td><td>{money(p.totalDeductions ?? p.fees)}</td><td>{money(p.gross)}</td><td><b>{money(p.net)}</b></td>{isAdmin && <td>{p.ownerEmail || '—'}</td>}<td>{canManage ? <div className="table-actions"><button className="table-edit-btn" onClick={() => openEdit(p)}><Pencil size={15} /></button><button className="table-delete-btn" onClick={() => remove(p)}><Trash2 size={15} /></button></div> : <span>—</span>}</td></tr>;
      })}{!payroll.length && <tr><td colSpan={isAdmin ? 13 : 12} className="empty">{t.noData}</td></tr>}</tbody></table></div>
      {open && <Modal title={editId ? 'د معاش سمون' : t.add} close={() => setOpen(false)}><form className="form-grid" onSubmit={save}>
        <label>{t.name}<select className="big-field" value={personId} onChange={e => setPersonId(e.target.value)} required><option value="">—</option>{people.map((p: Person) => <option value={p.id} key={p.id}>{p.name} — {p.rank}</option>)}</select></label>
        <label>{t.month}<input className="big-field" type="month" value={month} onChange={e => setMonth(e.target.value)} required /></label>
        <label>وزارت/اداره د مالیې پروفایل
          <select className="big-field" value={institution} onChange={e => setInstitution(e.target.value)}>
            <option>د ملي دفاع وزارت</option>
            <option>د کورنیو چارو وزارت</option>
            <option>د استخباراتو لوی ریاست</option>
            <option>نور نظامي تشکیلات لرونکی امارتي واحد</option>
            <option>ملکي وزارت / امارتي اداره</option>
          </select>
        </label>
        <label>{t.extraordinary}<input className="big-field" type="number" min="0" value={x.extraordinary} onChange={e => setX({ ...x, extraordinary: e.target.value })} /></label>
        <label>نور کسرات <input className="big-field" type="number" min="0" value={x.otherDeductions} onChange={e => setX({ ...x, otherDeductions: e.target.value })} /></label>
        <div className="notice warn payroll-tax-profile"><BookOpen size={17} /><span>{institution === 'د ملي دفاع وزارت' ? 'د ملي دفاع وزارت پروفایل: ستاسې ورکړی داخلي نورم — تر ۱۰,۰۰۰ معاف، ۱۰,۰۰۱ تر ۱۰۰,۰۰۰ = ۱۰٪، له ۱۰۰,۰۰۰ پورته = ۱۵٪.' : 'د دې وزارت/ادارې لپاره د مالیې وزارت/عوایدو ریاست د عامه معاشي لارښود عمومي موضوعي مالیه کارول کېږي.'}</span></div>
        <div className="calc-box payroll-calc"><span>مشمول معاش</span><b>{money(gross)}</b><span>اتومات موضوعي مالیه</span><b>{money(taxAmount)}</b><span>نور کسرات</span><b>{money(otherDeductions)}</b><span>ټول کسرات</span><b>{money(totalDeductions)}</b><span>{t.net}</span><b>{money(net)}</b></div>
        <div className="modal-actions"><button type="button" className="ghost" onClick={() => setOpen(false)}>{t.cancel}</button><button className="primary">{editId ? 'سمول' : t.save}</button></div>
      </form></Modal>}
    </Panel>
  );
}function Transactions({ t, tx, refresh, toast, userEmail, isAdmin }: any) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyForm = { description: '', type: 'expense', amount: '', category: '', date: new Date().toISOString().slice(0, 10), note: '', referenceNo: '' };
  const [form, setForm] = useState<any>(emptyForm);

  function openCreate() { setEditId(null); setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) }); setOpen(true); }
  function openEdit(record: Tx) { setEditId(record.id); setForm({ description: record.description, type: record.type, amount: String(record.amount), category: record.category, date: record.date, note: record.note || '', referenceNo: record.referenceNo || '' }); setOpen(true); }

  async function save(e: any) {
    e.preventDefault();
    if (!form.description || num(form.amount) <= 0) { toast('تشریح او له صفر څخه لوی مقدار اړین دی.'); return; }
    try {
      const payload = { ...form, amount: num(form.amount), referenceNo: String(form.referenceNo || '').trim() };
      if (editId) await api.put(`/api/transactions/${editId}`, payload);
      else await api.post('/api/transactions', payload);
      setOpen(false); setEditId(null); await refresh(); toast(editId ? 'مالي ثبت سم شو.' : 'مالي ثبت په بریالیتوب خوندي شو.');
    } catch (e: any) { toast(e?.message || 'مالي ثبت ونه شو.'); }
  }

  async function remove(record: Tx) {
    const canManage = isAdmin || String(record.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
    if (!canManage) return;
    if (!window.confirm(`ایا «${record.description}» په بشپړ ډول حذف شي؟`)) return;
    try { await api.delete(`/api/transactions/${record.id}`); await refresh(); toast('مالي ثبت حذف شو.'); } catch (e: any) { toast(e?.message || 'مالي ثبت حذف نه شو.'); }
  }

  return (
    <Panel title={t.transactions} action={<button className="primary" onClick={openCreate}><Plus size={17} />{t.add}</button>}>
      <div className="table-wrap"><table><thead><tr><th>{t.date}</th><th>د سند/حوالې شمېره</th><th>{t.description}</th><th>{t.category}</th><th>{t.income}/{t.expense}</th><th>{t.amount}</th>{isAdmin && <th>ایمیل مالک</th>}<th>کړنې</th></tr></thead>
      <tbody>{tx.map((record: Tx) => { const canManage = isAdmin || String(record.ownerEmail || '').toLowerCase() === String(userEmail || '').toLowerCase(); return <tr key={record.id}><td>{record.date}</td><td>{record.referenceNo || '—'}</td><td>{record.description}</td><td>{record.category}</td><td><span className={'pill ' + record.type}>{record.type === 'income' ? t.income : t.expense}</span></td><td>{money(record.amount)}</td>{isAdmin && <td>{record.ownerEmail || '—'}</td>}<td>{canManage ? <div className="table-actions"><button className="table-edit-btn" onClick={() => openEdit(record)}><Pencil size={15} /></button><button className="table-delete-btn" onClick={() => remove(record)}><Trash2 size={15} /></button></div> : <span>—</span>}</td></tr>; })}{!tx.length && <tr><td colSpan={isAdmin ? 8 : 7} className="empty">{t.noData}</td></tr>}</tbody></table></div>
      {open && <Modal title={editId ? 'د مالي ثبت سمون' : t.add} close={() => setOpen(false)}><form className="form-grid" onSubmit={save}>
        <label>{t.description}<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></label>
        <label>{t.category}<input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
        <label>د سند/حوالې شمېره<input value={form.referenceNo} onChange={e => setForm({ ...form, referenceNo: e.target.value })} placeholder="لکه: ۱۴۰۵-۰۰۱" /></label>
        <label>{t.amount}<input type="number" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></label>
        <label>{t.date}<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
        <label>{t.income}/{t.expense}<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="expense">{t.expense}</option><option value="income">{t.income}</option></select></label>
        <label>{t.description}<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></label>
        <div className="modal-actions"><button type="button" className="ghost" onClick={() => setOpen(false)}>{t.cancel}</button><button className="primary">{editId ? 'سمول' : t.save}</button></div>
      </form></Modal>}
    </Panel>
  );
}function Accounts({ t, people, payroll, tx, ledger }: any) {
  const cash =
    tx.filter((x: Tx) => x.type === 'income').reduce((s: number, x: Tx) => s + x.amount, 0) -
    tx.filter((x: Tx) => x.type === 'expense').reduce((s: number, x: Tx) => s + x.amount, 0);
  const debit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.debit, 0));
  const credit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.credit, 0));
  const balanced = Math.abs(debit - credit) < 0.01;
  return (
    <Panel title={t.accounts}>
      <div className="account-grid">
        <div><span>ټول ثبت شوي کارکوونکي</span><b>{people.length}</b></div>
        <div><span>{t.totalPayroll}</span><b>{money(payroll.reduce((s: number, x: Payroll) => s + x.net, 0))}</b></div>
        <div><span>اوسنی خالص جریان</span><b>{money(cash)}</b></div>
        <div><span>ټول Debit</span><b>{money(debit)}</b></div>
        <div><span>ټول Credit</span><b>{money(credit)}</b></div>
        <div><span>د دفتر توازن</span><b>{balanced ? 'سم' : 'ستونزه'}</b></div>
      </div>
      <div className={'notice ' + (balanced ? 'ok' : 'warn')}>
        <CheckCircle2 size={19} />
        <span>{balanced ? 'د ثبت شوو double-entry محاسباتو مجموعي Debit او Credit سره برابر دي.' : 'د Debit او Credit په مجموعه کې توپیر شته؛ ثبت باید ودرول شي او وکتل شي.'}</span>
      </div>
    </Panel>
  );
}

function LedgerPage({ t, ledger }: any) {
  const debit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.debit, 0));
  const credit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.credit, 0));
  const balanced = Math.abs(debit - credit) < 0.01;
  return (
    <Panel title={t.ledger}>
      <div className="ledger-summary">
        <div><span>Debit</span><b>{money(debit)}</b></div>
        <div><span>Credit</span><b>{money(credit)}</b></div>
        <div><span>توازن</span><b>{balanced ? 'برابر' : 'نا برابر'}</b></div>
      </div>
      <div className={'notice ' + (balanced ? 'ok' : 'warn')}>
        <ShieldCheck size={19} />
        <span>{balanced ? 'د دفتر توازن تایید شو.' : 'د حسابدارۍ د توازن خطا موجوده ده.'}</span>
      </div>
      <div className="table-wrap ledger-table">
        <table>
          <thead><tr><th>نېټه</th><th>حساب</th><th>مراجعه</th><th>Debit</th><th>Credit</th><th>تشریح</th></tr></thead>
          <tbody>
            {ledger.map((x: LedgerEntry) => (
              <tr key={x.id}><td>{x.date}</td><td>{x.account}</td><td>{x.reference}</td><td>{money(x.debit)}</td><td>{money(x.credit)}</td><td>{x.description}</td></tr>
            ))}
            {!ledger.length && <tr><td colSpan={6} className="empty">{t.noData}</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Reports({ t, people, payroll, tx, ledger }: any) {
  const [status, setStatus] = useState('');
  const income = roundMoney(tx.filter((x: Tx) => x.type === 'income').reduce((s: number, x: Tx) => s + x.amount, 0));
  const expense = roundMoney(tx.filter((x: Tx) => x.type === 'expense').reduce((s: number, x: Tx) => s + x.amount, 0));
  const debit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.debit, 0));
  const credit = roundMoney(ledger.reduce((s: number, x: LedgerEntry) => s + x.credit, 0));
  const now = new Date();
  const reportText = [
    'د مالي مدیریت سیستم',
    'د مالي وضعیت رسمي راپور',
    'بشپړېدلو نېټه: ۲۰۲۶/۰۹/۲۸',
    'جوړونکی: حافظ محیب الله ایوب',
    'کارکوونکي: ' + people.length,
    'معاشونه: ' + money(payroll.reduce((s: number, x: Payroll) => s + x.net, 0)),
    'عاید: ' + money(income),
    'مصارف: ' + money(expense),
    'Ledger Debit: ' + money(debit),
    'Ledger Credit: ' + money(credit),
  ].join('\n');
  const shareReport = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'د مالي مدیریت راپور', text: reportText, url: window.location.href });
      else await navigator.clipboard.writeText(reportText + '\n' + window.location.href);
      setStatus('راپور شریک یا کاپي شو.');
    } catch {
      setStatus('شریکول لغوه شول.');
    }
  };
  return (
    <Panel title={t.reports}>
      <div className="report-cover">
        <div className="report-cover-brand"><MofLogo size={92} /></div>
        <div>
          <div className="eyebrow">رسمي مالي راپور • نسخه ۲۰۲۶/۰۹/۲۸</div>
          <h2>د مالي مدیریت سیستم</h2>
          <p>د ۲۰۵ البدر قول اردو د ۵۰۲ پیاده لواء مالي مدیریت</p>
          <small>جوړونکی: حافظ محیب الله ایوب</small>
        </div>
      </div>
      <div className="report-actions">
        <button className="primary" onClick={() => window.print()}><FileText size={17} /> راپور چاپ / PDF</button>
        <button className="ghost" onClick={shareReport}><Globe2 size={17} /> راپور شریکول</button>
      </div>
      {status && <div className="notice ok">{status}</div>}
      <div className="report-meta"><span>د راپور وخت</span><b>{now.toLocaleString('ps-AF')}</b><span>د توازن حالت</span><b>{Math.abs(debit-credit) < 0.01 ? 'برابر' : 'نا برابر'}</b></div>
      <div className="report-list">
        {[
          ['کارکوونکي', people.length],
          ['معاشونه', money(payroll.reduce((s: number, x: Payroll) => s + x.net, 0))],
          ['عاید', money(income)],
          ['مصارف', money(expense)],
          ['Ledger Debit', money(debit)],
          ['Ledger Credit', money(credit)],
        ].map(([a,b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}
      </div>
    </Panel>
  );
}

const PUBLISHED_MILITARY_SALARIES_1405_TABLE: Array<[string, number]> = [
  ['ستر جنرال / ستر پاسوال', 36100],
  ['ډګر جنرال / لوی پاسوال', 33155],
  ['تورن جنرال / پاسوال', 27550],
  ['برید جنرال / مل پاسوال', 24035],
  ['ډګروال / سمونوال', 19665],
  ['ډګرمن / سمونمل', 17860],
  ['جګړن / سمونیار', 16150],
  ['تورن / څارمن', 14345],
  ['لومړی بریدمن / لومړی څارن', 12825],
  ['دوهم بریدمن / دوهم څارن', 11685],
  ['سرپرکمشر قدمدار / لومړی ساتنمن', 11210],
  ['معاون سرپرکمشر قدمدار / دوهم ساتنمن', 11115],
  ['سرپرکمشر / درېیم ساتنمن', 10640],
  ['معاون سرپرکمشر', 19070],
  ['پرکمشر', 9888],
  ['ساتونکی', 9111],
];

const CIVILIAN_VISIBLE_1405_TABLE: Array<{ grade: string; step: string; amount: number }> = [
  { grade: 'اوم بست', step: 'اول قدم', amount: 5540 },
  { grade: 'اتم بست', step: 'اول قدم', amount: 4960 },
];

const SERVICE_TENURE_ALLOWANCES = [
  { label: '۳ کاله او ډېر', amount: 200, years: 3 },
  { label: '۶ کاله او ډېر', amount: 500, years: 6 },
  { label: '۹ کاله او ډېر', amount: 800, years: 9 },
  { label: '۱۲ کاله او ډېر', amount: 1000, years: 12 },
  { label: '۱۵ کاله او ډېر', amount: 1400, years: 15 },
  { label: '۱۸ کاله او ډېر', amount: 1700, years: 18 },
] as const;

function serviceTenureAllowance(years: number) {
  const completedYears = Math.max(0, Number.isFinite(years) ? years : 0);
  return SERVICE_TENURE_ALLOWANCES.reduce((best, item) => completedYears >= item.years ? item.amount : best, 0);
}
const LICENSED_BANKS: Array<[string, string, string, string]> = [
  ['افغان ملي بانک', 'دولتي سوداګریز بانک', 'BMAFAFKA', 'https://www.bma.com.af'],
  ['پشتني بانک', 'دولتي سوداګریز بانک', 'PIBAAFKA', 'https://www.pashtanybank.com'],
  ['نوی کابل بانک', 'دولتي سوداګریز بانک', 'KABUAFKA', 'https://newkabulbank.af'],
  ['عزیزي بانک', 'خصوصي سوداګریز بانک', 'AZBAAFKA', 'https://www.azizibank.af'],
  ['افغانستان نړیوال بانک', 'خصوصي سوداګریز بانک', 'AFIBAFKA', 'https://aib.af'],
  ['د افغانستان اسلامي بانک', 'خصوصي سوداګریز بانک', '', 'https://www.ibafg.com'],
  ['میوند بانک', 'خصوصي سوداګریز بانک', '', 'https://www.maiwandbank.com'],
  ['افغان یونایټډ بانک', 'خصوصي سوداګریز بانک', 'AFGUAFKA', 'https://www.afghanunitedbank.com'],
  ['د کوچنیو پورونو لومړنی بانک', 'خصوصي سوداګریز بانک', 'FMFBAFKA', 'https://www.fmfb.com.af'],
  ['غضنفر بانک', 'خصوصي سوداګریز بانک', '', 'https://www.ghazanfarbank.com'],
  ['نشنل بانک پاکستان', 'د بهرني سوداګریز بانک نمایندګي', 'NBPAAFKA', 'https://www.nbp.com.pk'],
  ['الفلاح بانک', 'د بهرني سوداګریز بانک نمایندګي', 'ALFHAFKA', 'https://www.bankalfalah.com'],
];

const DEFENSE_TAX_PROFILE_LABEL = 'د ملي دفاع وزارت';

function generalSalaryWithholdingTaxMonthly(amount: number) {
  const taxable = Math.max(0, roundMoney(amount));
  if (taxable <= 5000) return 0;
  if (taxable <= 12500) return roundMoney((taxable - 5000) * 0.02);
  if (taxable <= 100000) return roundMoney(150 + (taxable - 12500) * 0.1);
  return roundMoney(8900 + (taxable - 100000) * 0.2);
}

function defenseSalaryTaxInternal(amount: number) {
  const taxable = Math.max(0, roundMoney(amount));
  if (taxable <= 10000) return 0;
  if (taxable <= 100000) return roundMoney(taxable * 0.1);
  return roundMoney(taxable * 0.15);
}

function salaryTaxByInstitution(amount: number, institution: string) {
  return institution === DEFENSE_TAX_PROFILE_LABEL
    ? defenseSalaryTaxInternal(amount)
    : generalSalaryWithholdingTaxMonthly(amount);
}

function SalaryRulesPage() {
  const [sector, setSector] = useState<'civilian' | 'security'>('security');
  const [institution, setInstitution] = useState('د ملي دفاع وزارت');
  const [militaryIndex, setMilitaryIndex] = useState(8);
  const [civilianIndex, setCivilianIndex] = useState(0);
  const [positionTitle, setPositionTitle] = useState('');
  const [formationPost, setFormationPost] = useState('');
  const [serviceYears, setServiceYears] = useState('');
  const [periodMonths, setPeriodMonths] = useState('1');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [education, setEducation] = useState('');
  const [extraSalary, setExtraSalary] = useState('');
  const [professional, setProfessional] = useState('');
  const [regional, setRegional] = useState('');
  const [documentAllowance, setDocumentAllowance] = useState('');
  const [hazard, setHazard] = useState('');
  const [special, setSpecial] = useState('');
  const [housing, setHousing] = useState('');
  const [travel, setTravel] = useState('');
  const [food, setFood] = useState('');

  const selectedMilitary = PUBLISHED_MILITARY_SALARIES_1405_TABLE[militaryIndex];
  const civilianRef = CIVILIAN_VISIBLE_1405_TABLE[civilianIndex];
  const standardNetSalary = sector === 'security' ? (selectedMilitary?.[1] || 0) : (civilianRef?.amount || 0);
  const baseSalary = standardNetSalary;
  const educationAmount = num(education);
  const serviceAmount = serviceTenureAllowance(num(serviceYears));
  const fixedAllowances = [
    educationAmount,
    serviceAmount,
    num(extraSalary),
    num(professional),
    num(regional),
    num(documentAllowance),
    num(hazard),
    num(special),
    num(housing),
    num(travel),
    num(food),
  ].reduce((sum, value) => sum + value, 0);
  const gross = roundMoney(baseSalary + fixedAllowances);
  const taxable = Math.max(0, standardNetSalary);
  const tax = salaryTaxByInstitution(taxable, institution);
  const net = roundMoney(gross - tax);
  const months = Math.min(24, Math.max(1, Math.floor(num(periodMonths) || 1)));
  const periodGross = roundMoney(gross * months);
  const periodTax = roundMoney(tax * months);
  const periodNet = roundMoney(net * months);

  const bankListed = bankName ? LICENSED_BANKS.some(x => x[0] === bankName) : false;
  const selectedBank = LICENSED_BANKS.find(x => x[0] === bankName);
  const normalizedAccount = accountNumber.replace(/\s+/g, '').trim();
  const accountEntered = normalizedAccount.length > 0;
  const holderEntered = accountHolderName.trim().length > 0;
  const verificationReady = bankListed && accountEntered && holderEntered;
  const maskedAccount = accountEntered
    ? normalizedAccount.length <= 4
      ? '•'.repeat(normalizedAccount.length)
      : '•'.repeat(normalizedAccount.length - 4) + normalizedAccount.slice(-4)
    : '—';
  const verificationMessage = !bankName
    ? 'لومړی بانک وټاکئ.'
    : !accountEntered
      ? 'بانک وټاکل شو؛ د حساب نمبر لا نه دی داخل شوی.'
      : !holderEntered
        ? 'د حساب نمبر داخل شو؛ د حساب خاوند نوم هم ولیکئ.'
        : 'بانک د د افغانستان بانک په جواز لرونکو بانکونو کې شته؛ خو د دې حساب حقیقي موجودیت او د مالک نوم لا د بانک له داخلي سیسټم څخه نه دي تایید شوي.';
  const verificationRequestText = verificationReady
    ? [
      'د بانکي حساب د رسمي تصدیق غوښتنه',
      'بانک: ' + bankName,
      'حساب نمبر: ' + normalizedAccount,
      'د حساب احتمالي خاوند نوم: ' + accountHolderName.trim(),
      'مهرباني وکړئ د بانک له رسمي سیسټم څخه د حساب موجودیت، ثبت شوي مالک نوم او د معاش حساب د منلو حالت تایید کړئ.',
      'هیڅ PIN، password یا OTP دې له دې اپ سره نه شریکېږي.'
    ].join('\n')
    : 'لومړی بانک، حساب نمبر او د حساب خاوند نوم بشپړ کړئ.';
  const copyVerificationRequest = async () => {
    try {
      await navigator.clipboard.writeText(verificationRequestText);
    } catch {}
  };

  return (
    <Panel title="د معاش، مالیې او بانکي حساب محاسبه">
      <div className="rules-hero">
        <div>
          <div className="eyebrow"><span className="live-dot" /> شخصي محاسبه • ۱۴۰۵ مالي کال</div>
          <h2>رتبه/بست، معاش، امتیازات، مالیه او بانکي حساب</h2>
          <p>د ۱۴۰۵ مالي کال لپاره د معاش د محاسبې دا برخه د موندل شوي معاشاتي نورم سند، د مالیې وزارت د معاش مالیې جدول او د د افغانستان بانک د جواز لرونکو بانکونو لست سره سرچینوي. هغه رقم چې د ۱۴۰۵ رسمي تفصیلي جدول په عامه اصلي فایل کې نه وي تثبیت شوی، اپ یې د ۱۴۰۵ رسمي رقم په توګه نه معرفي کوي.</p>
        </div>
        <MofLogo size={82} />
      </div>

      <div className="notice warn">
        <AlertTriangle size={19} />
        <span><b>دقت:</b> د نظامي معاشونو ۱۶ رقمونه دلته د ستاسې په ورکړل شوي جدول کې هماغه ډول ثبت شوي. د ملکي معاشونو په برخه کې یوازې هغه دوه ردیفونه ساتل شوي چې په ستاسې عکس کې ښکاري؛ پاتې رقمونه له ځانه نه دي اټکل شوي.</span>
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۱ ـ د ادارې او بست پېژندنه</h3><p>وزارت، اداره، رتبه/بست او دنده جلا ثبتېږي.</p></div></div>
        <div className="settings-grid">
          <label>سکتور
            <select value={sector} onChange={e => setSector(e.target.value as any)}>
              <option value="security">نظامي / امنیتي</option>
              <option value="civilian">ملکي وزارت / اداره</option>
            </select>
          </label>
          <label>اداره
            <select value={institution} onChange={e => setInstitution(e.target.value)}>
              <option>د ملي دفاع وزارت</option>
              <option>د کورنیو چارو وزارت</option>
              <option>د استخباراتو لوی ریاست</option>
              <option>نور نظامي تشکیلات لرونکی امارتي واحد</option>
              <option>ملکي وزارت / امارتي اداره</option>
            </select>
          </label>
          <label>دنده / وظیفه
            <input value={positionTitle} onChange={e => setPositionTitle(e.target.value)} placeholder="لکه: حسابدار، مالي مدیر، مسلکي دنده..." />
          </label>
          <label>تشکیلاتي بست / نمبر
            <input value={formationPost} onChange={e => setFormationPost(e.target.value)} placeholder="لکه: ۱، ۵، ۶، ۸، ۹ بست..." />
          </label>
          <label>د خدمت موده په کلونو
            <input type="number" min="0" value={serviceYears} onChange={e => setServiceYears(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۲ ـ د معاش اصلي جدول</h3><p>د نظامي برخه کې د ستاسې د ورکړل شوي جدول ټول ۱۶ رقمونه ښکاره کېږي؛ د ملکي برخه کې یوازې ثبت شوي او ښکاره شوي ردیفونه کارول کېږي.</p></div></div>
        {sector === 'security' ? (
          <>
            <div className="settings-grid">
              <label>نظامي رتبه / امنیتي عنوان
                <select value={militaryIndex} onChange={e => setMilitaryIndex(Number(e.target.value))}>
                  {PUBLISHED_MILITARY_SALARIES_1405_TABLE.map((x, i) => <option key={x[0]} value={i}>{x[0]}</option>)}
                </select>
              </label>
              <label>ټاکل شوی خالص معاش
                <input value={money(selectedMilitary?.[1] || 0)} readOnly />
              </label>
            </div>
            <div className="rank-grid">{PUBLISHED_MILITARY_SALARIES_1405_TABLE.map(x => <div key={x[0]}><b>{x[0]}</b><span>خالص معاش: {money(x[1])} افغانۍ</span></div>)}</div>
          </>
        ) : (
          <>
            <div className="settings-grid">
              <label>ملکي بست
                <select className="big-field" value={civilianIndex} onChange={e => setCivilianIndex(Number(e.target.value))}>
                  {CIVILIAN_VISIBLE_1405_TABLE.map((x, i) => <option key={x.grade} value={i}>{x.grade} — {x.step}</option>)}
                </select>
              </label>
              <label>قدم
                <input className="big-field" value={civilianRef?.step || '—'} readOnly />
              </label>
              <label>ټاکل شوی خالص معاش
                <input className="big-field" value={civilianRef ? money(standardNetSalary) : 'نه دی تثبیت شوی'} readOnly />
              </label>
            </div>
            <div className="salary-rule-table-wrap">
              <table className="salary-rule-table">
                <thead><tr><th>بست</th><th>قدم</th><th>میاشتنی معاش</th></tr></thead>
                <tbody>{CIVILIAN_VISIBLE_1405_TABLE.map(x => <tr key={x.grade}><td>{x.grade}</td><td>{x.step}</td><td>{money(x.amount)}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۳ ـ امتیازات</h3><p>تحصیلي او خدمت مودې ته ټاکل شوي ثابت رقمونه له جدول څخه دي؛ نور اختصاصي امتیازات یوازې د منظور سند له مخې داخل کړئ.</p></div></div>
        <div className="allowance-grid">
          <label>تحصیلي امتیاز — د منظور سند رقم
            <input className="big-field" type="number" min="0" value={education} onChange={e => setEducation(e.target.value)} placeholder="لکه: 500" />
          </label>
          <label>د خدمت مودې امتیاز
            <input value={money(serviceAmount)} readOnly />
          </label>
          <label>فوق العاده امتیاز <input type="number" min="0" value={extraSalary} onChange={e => setExtraSalary(e.target.value)} /></label>
          <label>مسلک امتیاز <input type="number" min="0" value={professional} onChange={e => setProfessional(e.target.value)} /></label>
          <label>منطقوي امتیاز <input type="number" min="0" value={regional} onChange={e => setRegional(e.target.value)} /></label>
          <label>د اسنادو امتیاز <input type="number" min="0" value={documentAllowance} onChange={e => setDocumentAllowance(e.target.value)} /></label>
          <label>خطر امتیاز <input type="number" min="0" value={hazard} onChange={e => setHazard(e.target.value)} /></label>
          <label>ځانګړی قطعه/دنده <input type="number" min="0" value={special} onChange={e => setSpecial(e.target.value)} /></label>
          <label>د کور کرایه <input type="number" min="0" value={housing} onChange={e => setHousing(e.target.value)} /></label>
          <label>سفر / ترانسپورټ <input type="number" min="0" value={travel} onChange={e => setTravel(e.target.value)} /></label>
          <label>اعاشه / سترخان <input type="number" min="0" value={food} onChange={e => setFood(e.target.value)} /></label>
        </div>
        <div className="notice warn">
          <BookOpen size={19} />
          <span>نور اختصاصي امتیازات یوازې د منظور شوي حکم/سند له مخې داخل کړئ. دا رقمونه دلته له ځانه ۱۴۰۵ قانوني امتیاز نه ګرځول کېږي.</span>
        </div>
        <div className="calc-box rules-calc">
          <span>خالص معیاري معاش</span><b>{money(standardNetSalary)}</b>
          <span>له مالیې مخکې د نورم معادل</span><b>{money(baseSalary)}</b>
          <span>ټول داخل شوي امتیازات</span><b>{money(fixedAllowances)}</b>
          <span>ټول ناخالص معاش</span><b>{money(gross)}</b>
        </div>
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۴ ـ د معاش مالیه</h3><p>موضوعي مالیه د مالیې تابع میاشتني معاش پر بنسټ اتومات محاسبه کېږي. د څو میاشتو محاسبه د هرې میاشتې جلا حسابونه جمع کوي.</p></div></div>
        <div className="calc-box rules-calc">
          <span>د مالیې تابع میاشتنی معاش</span><b>{money(taxable)}</b>
          <span>موضوعي مالیه — ۱ میاشت</span><b>{money(tax)}</b>
          <span>له مالیې وروسته خالص — ۱ میاشت</span><b>{money(net)}</b>
        </div>
        <div className="tax-period-box">
          <label>څو میاشتې محاسبه؟
            <input className="big-field" type="number" min="1" max="24" value={periodMonths} onChange={e => setPeriodMonths(e.target.value)} />
          </label>
          <div className="calc-box rules-calc">
            <span>د {months} میاشتو ناخالص معاش</span><b>{money(periodGross)}</b>
            <span>د {months} میاشتو ټول مالیه</span><b>{money(periodTax)}</b>
            <span>د {months} میاشتو خالص معاش</span><b>{money(periodNet)}</b>
          </div>
        </div>
        <div className="notice ok"><CheckCircle2 size={19} /><span>د څو میاشتو مجموعه د مساوي میاشتني معاش لپاره د هرې میاشتې جلا مالیې د مجموعې په توګه محاسبه کېږي.</span></div>
        {institution === DEFENSE_TAX_PROFILE_LABEL ? (
          <>
            <div className="notice warn"><AlertTriangle size={18} /><span>د ملي دفاع وزارت: دا د مالیې پروفایل ستاسې ورکړی داخلي نورم دی؛ د دې ځانګړي نورم اوسنی رسمي عامه سند ما ونه موند.</span></div>
            <div className="tax-brackets">
              <div><b>۰٪</b><span>تر ۱۰,۰۰۰</span></div>
              <div><b>۱۰٪</b><span>۱۰,۰۰۱ – ۱۰۰,۰۰۰</span></div>
              <div><b>۱۵٪</b><span>له ۱۰۰,۰۰۰ پورته</span></div>
            </div>
          </>
        ) : (
          <div className="tax-brackets">
            <div><b>۰٪</b><span>تر ۵,۰۰۰</span></div>
            <div><b>۲٪</b><span>۵,۰۰۱ – ۱۲,۵۰۰</span></div>
            <div><b>۱۰٪ + ۱۵۰</b><span>۱۲,۵۰۱ – ۱۰۰,۰۰۰</span></div>
            <div><b>۲۰٪ + ۸,۹۰۰</b><span>له ۱۰۰,۰۰۰ پورته</span></div>
          </div>
        )}
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۵ ـ بانکي حساب</h3><p>د بانک نوم د د افغانستان بانک د جواز لرونکو بانکونو له اوسني لست څخه؛ د حساب نمبر او مالکیت ریښتینی تایید د بانک رسمي خدمت ته اړتیا لري.</p></div></div>
        <div className="settings-grid">
          <label>بانک
            <select value={bankName} onChange={e => setBankName(e.target.value)}>
              <option value="">بانک وټاکئ</option>
              {LICENSED_BANKS.map(x => <option value={x[0]} key={x[0]}>{x[0]}</option>)}
            </select>
          </label>
          <label>اکونټ نمبر
            <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} inputMode="numeric" placeholder="د بانک حساب نمبر" />
          </label>
          <label>د حساب خاوند نوم            <input value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} placeholder="لکه: احمد خان" />
          </label>
        </div>
        <div className={'bank-verification ' + (bankListed ? 'known' : '')}>
          <ShieldCheck size={19} />
          <div>
            <b>{bankListed ? '۱ ـ د بانک جواز تایید شو' : '۱ ـ د بانک جواز ناتمام'}</b>
            <p>{verificationMessage}</p>
            {selectedBank?.[3] && <a className="bank-official-link" href={selectedBank[3]} target="_blank" rel="noreferrer">د بانک رسمي وېبپاڼه پرانیزئ</a>}
          </div>
        </div>

        <div className="verification-grid">
          <div className="verification-card verified">
            <b>د بانک جواز</b>
            <span>{bankListed ? 'د افغانستان بانک په رسمي لست کې شته' : 'بانک نه دی ټاکل شوی / جواز نه دی تایید شوی'}</span>
          </div>
          <div className={'verification-card ' + (accountEntered ? 'verified' : '')}>
            <b>د حساب نمبر</b>
            <span>{accountEntered ? 'ثبت شو: ' + maskedAccount : 'لا نه دی ثبت شوی'}</span>
          </div>
          <div className={'verification-card ' + (holderEntered ? 'verified' : '')}>
            <b>د حساب خاوند نوم</b>
            <span>{holderEntered ? 'داخل شوی؛ لا د بانک له داخلي سیستم څخه نه دی تایید شوی' : 'لا نه دی داخل شوی'}</span>
          </div>
          <div className="verification-card pending">
            <b>Live Bank Verification</b>
            <span>د افغان بانکونو لپاره عامه رسمي account-owner API/callback مې ونه موند؛ نو اپ دلته جعلي «تایید شوی» نتیجه نه جوړوي.</span>
          </div>
        </div>

        <div className="verification-actions">
          <button className="primary" type="button" onClick={copyVerificationRequest} disabled={!verificationReady}>د بانک د رسمي تصدیق غوښتنه کاپي کړئ</button>
          {selectedBank?.[3] && <a className="ghost bank-action-link" href={selectedBank[3]} target="_blank" rel="noreferrer">بانک ته رسمي لاره</a>}
        </div>

        <div className="notice">
          <BookOpen size={19} />
          <span><b>د تصدیق اعظمي خوندي لارې:</b> ۱) د د افغانستان بانک رسمي جواز؛ ۲) د بانک رسمي شعبه/تماس؛ ۳) د بانک رسمي statement یا مکتوب؛ ۴) د بانک رسمي API/verification callback. دا اپ د بانک password، PIN او OTP نه غواړي.</span>
        </div>

        <div className="rules-docs">
          {LICENSED_BANKS.map(x => <div key={x[0]}><b>{x[0]}</b><small>{x[1]}</small>{x[2] && <small>SWIFT: {x[2]}</small>}<a className="bank-official-link" href={x[3]} target="_blank" rel="noreferrer">رسمي وېبپاڼه</a></div>)}</div>
      </div>

      <div className="rules-section">
        <div className="rules-section-head"><div><h3>۶ ـ د اسنادو او سرچینو حالت</h3><p>د ۱۴۰۵ رسمي تفصیلي جدول چې رقمونه باید له اصلي سند څخه وارد شي، د سرچینې د کال/شمېرې په تثبیت پورې تړلی دی.</p></div></div>
        <div className="rules-docs">
          <div><FileText size={18} /><span>د معاشونو نهایي نورمونه د بودجې ریاست لپاره — د امنیتي/دفاعي معاشونو او امتیازاتو جدول.</span><small>ثانوي عامه کاپي؛ د ۱۴۰۵ کال رسمي اصلي نسخه نه ده تثبیت شوې.</small></div>
          <div><FileText size={18} /><span>د مالیې وزارت د معاش موضوعي مالیې جدول</span><small>۰٪، ۲٪، ۱۰٪، ۲۰٪</small></div>
          <div><FileText size={18} /><span>د افغانستان بانک د جواز لرونکو بانکونو لست</span><small>بانک د جواز حالت؛ د حساب مالکیت نه تاییدوي.</small></div>
        </div>
      </div>
    </Panel>
  );
}

function CompliancePage({ t }: any) {
  const docs = [
    ['پر عایداتو باندې د مالیاتو قانون', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د مالیاتو د چارو د ادارې قانون', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د عایداتو مالیې تعلیماتنامه', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د عامه مالي او مصارفو قانون', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د تدارکاتو قانون', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د ګمرکونو قانون', 'https://mof.gov.af/ps/قوانین-او-مقررات'],
    ['د مالیاتي محاسبینو طرزالعمل', 'https://mof.gov.af/ps/طرزالعملونه'],
    ['د VAT / مالیه پر ارزښت افزوده اسناد', 'https://mof.gov.af/ps/طرزالعملونه'],
    ['د مالیه ورکوونکي د تشخیص او TIN اړوند طرزالعملونه', 'https://mof.gov.af/ps/طرزالعملونه'],
    ['د مالیاتي اظهارنامې، refund او د تاوان انتقال طرزالعملونه', 'https://mof.gov.af/ps/طرزالعملونه'],
  ];
  return (
    <Panel title={t.compliance}>
      <div className="compliance-head"><MofLogo size={62} /><div><b>مقرراتي اساس - ۲۰۲۶/۰۹/۰۱</b><p>د ۱۴۰۵/۶/۱۰ د baseline نېټې لپاره رسمي اسناد ثبت شوي؛ د هر نوي تعدیل له خپرېدو سره version update اړین دی.</p></div></div>
      <div className="notice"><BookOpen size={19} /><span>د مالیې وزارت په رسمي پاڼه کې قوانین، مقررات، تعلیماتنامې او طرزالعملونه خپرېږي. دا register د سرچینو د تعقیب لپاره دی؛ د قانوني مشورې بدیل نه دی.</span></div>
      <div className="compliance-grid">
        {docs.map(([name, url]) => <a className="compliance-item" href={url} target="_blank" rel="noreferrer" key={name}><FileText size={20} /><span>{name}</span><small>رسمي سرچینه</small></a>)}
      </div>
    </Panel>
  );
}

function Audit({ t }: any) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/api/audit')
      .then(r => setItems(r.data.items || []))
      .catch(() => {});
  }, []);
  return (
    <Panel title={t.audit}>
      <div className="notice">
        <ClipboardList size={19} />
        <span>{t.auditNote}</span>
      </div>
      <div className="audit-list">
        {items.map(x => (
          <div key={x.id}>
            <b>{x.action}</b>
            <span>{x.email}</span>
            <small>{new Date(x.createdAt).toLocaleString()}</small>
          </div>
        ))}
        {!items.length && <div className="empty">{t.noData}</div>}
      </div>
    </Panel>
  );
}

function SettingsPage({ t, lang, setLang, theme, setTheme, settings, setSettings, userEmail, isAdmin, onContact, onRefresh }: any) {
  const update = (patch: Partial<UiSettings>) => setSettings((old: UiSettings) => ({ ...old, ...patch }));
  const updatePrayer = (key: string, value: string) => setSettings((old: UiSettings) => ({ ...old, prayerTimes: { ...old.prayerTimes, [key]: value } }));
  const resetGroup = (group: 'appearance' | 'dates' | 'prayer') => {
    setSettings((old: UiSettings) => {
      if (group === 'appearance') {
        setTheme('dark');
        return { ...old, accent: DEFAULT_UI_SETTINGS.accent, background: DEFAULT_UI_SETTINGS.background, panel: DEFAULT_UI_SETTINGS.panel, font: DEFAULT_UI_SETTINGS.font, fontSize: DEFAULT_UI_SETTINGS.fontSize, bold: DEFAULT_UI_SETTINGS.bold, radius: DEFAULT_UI_SETTINGS.radius, density: DEFAULT_UI_SETTINGS.density };
      }
      if (group === 'dates') return { ...old, showDateBar: DEFAULT_UI_SETTINGS.showDateBar, showGregorian: true, showSolar: true, showHijri: true };
      return { ...old, showPrayerTimes: true, prayerTimes: { ...DEFAULT_UI_SETTINGS.prayerTimes } };
    });
  };
  const resetAll = () => {
    if (window.confirm('ایا د سیستم ټول ټاکل شوي تنظیمات اصلي حالت ته راوګرځوو؟')) {
      setLang('ps');
      setTheme('dark');
      setSettings({ ...DEFAULT_UI_SETTINGS, prayerTimes: { ...DEFAULT_UI_SETTINGS.prayerTimes } });
    }
  };
  const now = new Date();
  const fmt = (calendar: string, locale: string) => new Intl.DateTimeFormat(locale, { calendar, dateStyle: 'full' }).format(now);
  const dateRows = [
    settings.showGregorian && ['میلادي', fmt('gregory', 'ps-AF')],
    settings.showSolar && ['لمریز', fmt('persian', 'fa-AF')],
    settings.showHijri && ['هجري قمري', fmt('islamic', 'ar-AF')],
  ].filter(Boolean) as string[][];
  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerLabels: Record<string, string> = { Fajr: 'سهار لمونځ (فجر)', Sunrise: 'لمر ختل', Dhuhr: 'ماسپښین (ظهر)', Asr: 'مازدیګر (عصر)', Maghrib: 'ماښام (مغرب)', Isha: 'ماخوستن (عشاء)' };

  return (
    <Panel title={t.settings}>
      <DeviceSecurityCard email={userEmail} isAdmin={isAdmin} />
      <div className="settings-section">
        <div className="settings-section-head"><div><h3>عمومي او ژبه</h3><p>د ژبې، رڼا/تیاره بڼه او د کار چاپېریال.</p></div><button className="ghost" onClick={() => resetGroup('appearance')}>د بڼې اصلي حالت</button></div>
        <div className="settings-grid">
          <label>{t.language}<select value={lang} onChange={e => setLang(e.target.value)}><option value="ps">پښتو</option><option value="fa">دری</option><option value="ar">العربية</option><option value="ur">اردو</option><option value="en">English</option></select></label>
          <label>{t.theme}<select value={theme} onChange={e => setTheme(e.target.value)}><option value="dark">{t.dark}</option><option value="light">{t.light}</option></select></label>
          <label>فونټ<select value={settings.font} onChange={e => update({ font: e.target.value })}><option>Noto Naskh Arabic</option><option>Tahoma</option><option>Arial</option><option>system-ui</option><option>Georgia</option></select></label>
          <label>د لیکنې اندازه<input type="range" min="13" max="22" value={settings.fontSize} onChange={e => update({ fontSize: Number(e.target.value) })} /></label>
          <label>د لیکنې ضخامت<select value={settings.bold ? 'bold' : 'normal'} onChange={e => update({ bold: e.target.value === 'bold' })}><option value="normal">عادي</option><option value="bold">BOLD / غلیظ</option></select></label>
          <label>د کارتونو ګردوالی<input type="range" min="0" max="28" value={settings.radius} onChange={e => update({ radius: Number(e.target.value) })} /></label>
          <label>د کار ساحې تراکم<select value={settings.density} onChange={e => update({ density: e.target.value })}><option value="compact">کمپیکټ</option><option value="normal">عادي</option><option value="spacious">پراخه</option></select></label>
          <label>اصلي رنګ<input type="color" value={settings.accent} onChange={e => update({ accent: e.target.value })} /></label>
          <label>د شالید رنګ<input type="color" value={settings.background} onChange={e => update({ background: e.target.value })} /></label>
          <label>د پینل رنګ<input type="color" value={settings.panel} onChange={e => update({ panel: e.target.value })} /></label>
        </div>
        <div className="color-preset-section">
          <div className="color-preset-title"><Palette size={18} /><b>چمتو رنګونه</b><span>د سیستم بڼه په یوه کلیک بدله کړئ.</span></div>
          <div className="color-presets">
            {UI_COLOR_PRESETS.map(preset => (
              <button key={preset.name} type="button" className="color-preset" onClick={() => update({ accent: preset.accent, background: preset.background, panel: preset.panel })}>
                <span className="color-swatch" style={{ background: preset.accent }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-head"><div><h3>نېټه، وخت او درې تقویمونه</h3><p>میلادي، لمریز او هجري قمري تاریخونه.</p></div><button className="ghost" onClick={() => resetGroup('dates')}>د تاریخونو اصلي حالت</button></div>
        <div className="toggle-grid">
          <label><span>په سیستم کې د تاریخونو پټه/ښکاره</span><input type="checkbox" checked={settings.showDateBar} onChange={e => update({ showDateBar: e.target.checked })} /></label>
          <label><span>میلادي</span><input type="checkbox" checked={settings.showGregorian} onChange={e => update({ showGregorian: e.target.checked })} /></label>
          <label><span>لمریز</span><input type="checkbox" checked={settings.showSolar} onChange={e => update({ showSolar: e.target.checked })} /></label>
          <label><span>هجري قمري</span><input type="checkbox" checked={settings.showHijri} onChange={e => update({ showHijri: e.target.checked })} /></label>
        </div>
        <div className="date-preview">{dateRows.map(row => <div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span></div>)}</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-head"><div><h3>د لمانځه بشپړ وختونه</h3><p>وختونه د ادارې/محلي جدول له مخې دلته تنظیمولای شئ؛ دا فورمه محلي ثابت جدول ذخیره کوي.</p></div><button className="ghost" onClick={() => resetGroup('prayer')}>د لمانځه اصلي حالت</button></div>
        <label className="toggle-row"><span>د لمانځه وختونه ښودل</span><input type="checkbox" checked={settings.showPrayerTimes} onChange={e => update({ showPrayerTimes: e.target.checked })} /></label>
        <div className="prayer-grid">{prayers.map(key => <label key={key}>{prayerLabels[key]}<input type="time" value={settings.prayerTimes[key]} onChange={e => updatePrayer(key, e.target.value)} disabled={!settings.showPrayerTimes} /></label>)}</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-head"><div><h3>خبرتیاوې او سیستم چلند</h3><p>د برخو د فعال/غیر فعالولو لپاره عمومي کنټرولونه.</p></div></div>
        <div className="toggle-grid">
          <label><span>نیټه بار</span><input type="checkbox" checked={settings.showDateBar} onChange={e => update({ showDateBar: e.target.checked })} /></label>
          <label><span>د لمانځه وختونه</span><input type="checkbox" checked={settings.showPrayerTimes} onChange={e => update({ showPrayerTimes: e.target.checked })} /></label>
          <label><span>غلیظ لیک</span><input type="checkbox" checked={settings.bold} onChange={e => update({ bold: e.target.checked })} /></label>
        </div>
      </div>

      <div className="settings-section support-control-section">
        <div className="settings-section-head">
          <div>
            <h3>چټک سیستم خدمتونه</h3>
            <p>آنلاین معلومات تازه کړئ یا د جوړونکي د اړیکو پاڼې ته لاړ شئ.</p>
          </div>
          <div className="settings-section-actions">
            <button className="primary" onClick={onRefresh}><Search size={17} /> معلومات تازه کول</button>
            <button className="ghost" onClick={onContact}><Phone size={17} /> زموږ سره اړیکه</button>
          </div>
        </div>
      </div>
      <div className="settings-reset">
        <div><h3>ټول تنظیمات اصلي حالت ته</h3><p>د بڼې، ژبې/Theme، تاریخونو او لمانځه ټاکنې له اصلي حالت سره بېرته برابرول.</p></div>
        <button className="danger-btn" onClick={resetAll}><Trash2 size={17} /> ټول تنظیمات صفر کول</button>
      </div>
    </Panel>
  );
}

function ContactPage() {
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(''), 1800);
    return () => clearTimeout(id);
  }, [status]);
  const message = 'سلام حافظ محیب الله ایوب صاحب، زه غواړم د اداري/مالي سیستم په اړه معلومات او مرسته واخلم.';
  const shareInfo = async () => {
    const text = [
      'د مالي مدیریت سیستم - جوړونکی او اړیکې',
      'حافظ محیب الله ایوب',
      'ولایت: ارزګان | ولسوالۍ: چوره | قریه: خواجه خدیر',
      'اړیکه: 0705965475',
      'WhatsApp: https://wa.me/93705965475',
      'YouTube: https://youtube.com/channel/UCgilh9KTiPaLGCsDELLNcjw',
      'Facebook: https://www.facebook.com/share/19eC9AWWRF/',
    ].join('\n');
    try {
      if (navigator.share) await navigator.share({ title: 'حافظ محیب الله ایوب - اړیکې', text });
      else await navigator.clipboard.writeText(text);
      setStatus('د اړیکو معلومات شریک/کاپي شول.');
    } catch {
      setStatus('شریکول لغوه شول.');
    }
  };
  return (
    <Panel title="زموږ سره اړیکه">
      <div className="creator-profile">
        <MofLogo size={80} />
        <div><div className="eyebrow">زما په اړه • اصلي جوړونکی</div><h2>حافظ محیب الله ایوب</h2><p>د دې سیستم اصلي جوړونکی او د مالي چارو د اسانتیا لپاره د سیسټم د جوړولو مسئول.</p></div>
      </div>
      <div className="about-me-card">
        <div className="about-me-head"><Users size={22} /><div><h3>زما په اړه معلومات</h3><p>د جوړونکي، اړیکې او مستقیمو ټولنیزو لارو معلومات.</p></div></div>
        <div className="about-me-grid">
          <div><span>نوم</span><b>{CONTACT_INFO.name}</b></div>
          <div><span>دنده</span><b>د مالي مدیریت سیستم جوړونکی</b></div>
          <div><span>ولایت / ولسوالۍ</span><b>{CONTACT_INFO.province} / {CONTACT_INFO.district}</b></div>
          <div><span>قریه</span><b>{CONTACT_INFO.village}</b></div>
          <div><span>تلیفون</span><b>{CONTACT_INFO.phone}</b></div>
          <div><span>WhatsApp</span><b>د مستقیم پیغام لینک</b></div>
        </div>
      </div>
      <div className="contact-copy">
        <p><b>معرفي:</b> دا سیستم د مالي چارو د ثبت، منظم مدیریت، محاسبې، راپور ورکولو او اداري اسانتیا لپاره جوړ شوی. دا نسخه د ۲۰۲۶ کال د سپتمبر په ۲۸مه بشپړه شوې ده.</p>
        <p>هر شخص، اداره یا د کار ټیم کولی شي زموږ سره اړیکه ونیسي او د خپل اړوند اداري یا کاري اړتیا لپاره د ځانګړي او منظم سیستم د جوړولو غوښتنه وکړي. ستاسو نظر، وړاندیز او د ستونزې راپور زموږ لپاره مهم دی.</p>
        <p>که په سیستم کې هره ستونزه، نیمګړتیا یا د ښه والي وړاندیز وینئ، مهرباني وکړئ له موږ سره یې شریک کړئ. ستاسو همکاري د سیستم د لا ښه کېدو سبب کېږي.</p>
      </div>
      <div className="contact-grid">
        <a className="contact-card whatsapp" href={CONTACT_INFO.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={28} /><span>WhatsApp</span><b>مستقیم پیغام</b><small>واتس‌اپ خلاصوي او پیغام چمتو کوي</small></a>
        <a className="contact-card call" href={`tel:+93${CONTACT_INFO.phone.slice(1)}`}><Phone size={28} /><span>تلیفوني اړیکه</span><b>{CONTACT_INFO.phone}</b><small>مستقیم زنګ</small></a>
        <a className="contact-card youtube" href={CONTACT_INFO.youtube} target="_blank" rel="noreferrer"><PlayCircle size={28} /><span>YouTube</span><b>زما چینل پرانیزئ</b><small>مستقیم چینل</small></a>
        <a className="contact-card facebook" href={CONTACT_INFO.facebook} target="_blank" rel="noreferrer"><Globe2 size={28} /><span>Facebook</span><b>زما فیسبوک پاڼه پرانیزئ</b><small>مستقیم پاڼه</small></a>
      </div>
      <div className="contact-actions"><button className="primary" onClick={shareInfo}><Globe2 size={17} /> معلومات شریکول</button><button className="ghost" onClick={() => window.open(CONTACT_INFO.whatsapp, '_blank')}><ReceiptText size={17} /> WhatsApp پیغام</button></div>
      {status && <div className="notice ok">{status}</div>}
      <div className="contact-location"><b>د اړیکو معلومات</b><div>ولایت: {CONTACT_INFO.province}</div><div>ولسوالی: {CONTACT_INFO.district}</div><div>قریه: {CONTACT_INFO.village}</div><div>شمېره: {CONTACT_INFO.phone}</div></div>
    </Panel>
  );
}

function Help({ t }: any) {
  return (
    <Panel title={t.help}>
      <div className="help-grid">
        <div>
          <CircleHelp />
          <h3>د کارولو لارښود</h3>
          <p>{t.helpText}</p>
        </div>
        <div>
          <ShieldCheck />
          <h3>امنیت</h3>
          <p>
            هر کاروونکی د خپل ایمیل له لارې پېژندل کېږي؛ د مالي بدلونونو لپاره د
            مدیر صلاحیت باید په سرور کې تنظیم شي.
          </p>
        </div>
        <div>
          <AlertTriangle />
          <h3>{t.alerts}</h3>
          <p>
            د Push خبرتیاوو برخه د سیستم په تنظیماتو کې فعالېدای شي. د WhatsApp
            اتومات پیغام لپاره جلا رسمي WhatsApp API/Business حساب او Secret ته
            اړتیا ده.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Panel({ title, action, children }: any) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <span>Online Finance Module</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
function Modal({ title, close, children }: any) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default App;
