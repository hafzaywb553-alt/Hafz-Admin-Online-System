const DATE_LUNAR_HELP_TEXT = {
  ps: {
    button: "د قمري تقویم یادونه",
    title: "د قمري تقویم یادونه",
    note: "قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي."
  },
  fa: {
    button: "یادداشت تقویم قمری",
    title: "یادداشت تقویم قمری",
    note: "نتیجهٔ قمری بر اساس تقویم ام‌القری است؛ اگر WebView موبایل این تقویم را نشناسد، از جایگزین محاسباتی آفلاین استفاده می‌شود که ممکن است با رؤیت محلی هلال یک یا دو روز تفاوت داشته باشد."
  },
  ar: {
    button: "ملاحظة التقويم القمري",
    title: "ملاحظة التقويم القمري",
    note: "النتيجة القمرية وفق تقويم أم القرى؛ وإذا لم يتعرّف WebView في الهاتف على هذا التقويم، يُستخدم بديل حسابي دون اتصال قد يختلف يوماً أو يومين وفق رؤية الهلال محلياً."
  },
  ur: {
    button: "قمری کیلنڈر کا نوٹ",
    title: "قمری کیلنڈر کا نوٹ",
    note: "قمری نتیجہ ام القریٰ کیلنڈر کے مطابق ہے؛ اگر موبائل کا WebView اس کیلنڈر کو نہ پہچانے تو آف لائن حسابی متبادل استعمال ہوتا ہے، جس میں مقامی رویتِ ہلال کے لحاظ سے ایک یا دو دن کا فرق ہوسکتا ہے۔"
  },
  en: {
    button: "Lunar calendar note",
    title: "Lunar calendar note",
    note: "The Lunar result follows the Umm al-Qura calendar. If the mobile WebView does not recognize this calendar, an offline arithmetic fallback is used; it may differ by one or two days from local moon sighting."
  }
};

(function initializeDateLunarHelp() {
  const wrap = document.getElementById("dateConversionHelpWrap");
  const button = document.getElementById("dateConversionHelpToggle");
  const panel = document.getElementById("dateConversionHelpPanel");
  const languageSelect = document.getElementById("lang");
  if (!wrap || !button || !panel) return;

  const title = document.getElementById("dateConversionHelpTitle");
  const note = document.getElementById("dateConversionHelpLunarNote");

  function applyLanguage() {
    const language = languageSelect && languageSelect.value
      ? languageSelect.value
      : "ps";
    const text = DATE_LUNAR_HELP_TEXT[language] || DATE_LUNAR_HELP_TEXT.ps;
    if (title) title.textContent = text.title;
    if (note) note.textContent = text.note;
    button.setAttribute("aria-label", text.button);
    button.title = text.button;
    panel.setAttribute("aria-label", text.title);
  }

  function closeHelp() {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
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

  document.addEventListener("click", function (event) {
    if (!wrap.contains(event.target)) closeHelp();
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeHelp();
  });

  if (languageSelect) languageSelect.addEventListener("change", applyLanguage);
  closeHelp();
  applyLanguage();
})();