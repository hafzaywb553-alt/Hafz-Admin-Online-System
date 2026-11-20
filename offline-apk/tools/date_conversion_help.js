const DATE_CONVERSION_HELP_TEXT = {
  ps: {
    button: "د نېټې د تبدیل مرسته",
    title: "د نېټې د تبدیل بېلګه",
    example: "1405/06/08 = 2026/08/30 = 1448/03/17",
    description: "دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.",
    lunarNote: "قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي."
  },
  fa: {
    button: "راهنمای تبدیل تاریخ",
    title: "نمونهٔ تبدیل تاریخ",
    example: "1405/06/08 = 2026/08/30 = 1448/03/17",
    description: "این‌ها تاریخ‌های میلادی و قمری برابر با تاریخ هجری شمسی ۱۴۰۵/۰۶/۰۸ هستند.",
    lunarNote: "نتیجهٔ قمری بر اساس تقویم ام‌القری است؛ اگر WebView موبایل این تقویم را نشناسد، از جایگزین محاسباتی آفلاین استفاده می‌شود که ممکن است با رؤیت محلی هلال یک یا دو روز تفاوت داشته باشد."
  },
  ar: {
    button: "مساعدة تحويل التاريخ",
    title: "مثال على تحويل التاريخ",
    example: "1405/06/08 = 2026/08/30 = 1448/03/17",
    description: "هذه هي التواريخ الميلادية والقمرية المقابلة للتاريخ الهجري الشمسي 1405/06/08.",
    lunarNote: "النتيجة القمرية وفق تقويم أم القرى؛ وإذا لم يتعرّف WebView في الهاتف على هذا التقويم، يُستخدم بديل حسابي دون اتصال قد يختلف يوماً أو يومين وفق رؤية الهلال محلياً."
  },
  ur: {
    button: "تاریخ کی تبدیلی میں مدد",
    title: "تاریخ کی تبدیلی کی مثال",
    example: "1405/06/08 = 2026/08/30 = 1448/03/17",
    description: "یہ ۱۴۰۵/۰۶/۰۸ شمسی تاریخ کے برابر عیسوی اور قمری تاریخیں ہیں۔",
    lunarNote: "قمری نتیجہ ام القریٰ کیلنڈر کے مطابق ہے؛ اگر موبائل کا WebView اس کیلنڈر کو نہ پہچانے تو آف لائن حسابی متبادل استعمال ہوتا ہے، جس میں مقامی رویتِ ہلال کے لحاظ سے ایک یا دو دن کا فرق ہوسکتا ہے۔"
  },
  en: {
    button: "Date conversion help",
    title: "Date conversion example",
    example: "1405/06/08 = 2026/08/30 = 1448/03/17",
    description: "These are the Gregorian and Lunar dates corresponding to the Solar Hijri date 1405/06/08.",
    lunarNote: "The Lunar result follows the Umm al-Qura calendar. If the mobile WebView does not recognize this calendar, an offline arithmetic fallback is used; it may differ by one or two days from local moon sighting."
  }
};

(function initializeDateConversionHelp() {
  const wrap = document.getElementById("dateConversionHelpWrap");
  const button = document.getElementById("dateConversionHelpToggle");
  const panel = document.getElementById("dateConversionHelpPanel");
  const languageSelect = document.getElementById("lang");
  if (!wrap || !button || !panel) return;

  const title = document.getElementById("dateConversionHelpTitle");
  const example = document.getElementById("dateConversionHelpExample");
  const description = document.getElementById("dateConversionHelpDescription");
  const lunarNote = document.getElementById("dateConversionHelpLunarNote");

  function applyLanguage() {
    const language = languageSelect && languageSelect.value
      ? languageSelect.value
      : "ps";
    const text = DATE_CONVERSION_HELP_TEXT[language] || DATE_CONVERSION_HELP_TEXT.ps;
    if (title) title.textContent = text.title;
    if (example) example.textContent = text.example;
    if (description) description.textContent = text.description;
    if (lunarNote) lunarNote.textContent = text.lunarNote;
    button.setAttribute("aria-label", text.button);
    button.title = text.button;
    panel.setAttribute("aria-label", text.title);
  }

  function closeHelp() {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function closeOnOutside(event) {
    if (!wrap.contains(event.target)) closeHelp();
  }

  button.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (panel.hidden) {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
    } else {
      closeHelp();
    }
  });

  // Capture phase ensures another help button or any outside control closes this help.
  document.addEventListener("click", closeOnOutside, true);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeHelp();
  });
  if (languageSelect) languageSelect.addEventListener("change", applyLanguage);

  closeHelp();
  applyLanguage();
})();