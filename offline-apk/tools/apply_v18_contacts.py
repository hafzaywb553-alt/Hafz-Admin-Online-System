from pathlib import Path
import hashlib
import sys

EXPECTED_V17 = "2bd7a986ed2ae86e04ab9d05dc14653d92dbd9045c9f6992b7bf29fa408695a2"
EXPECTED_V18 = "a698e9f156e5826108b3a11653e70c594172d1d10f8498e029c9bfb21f5a08ed"

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, got {count}")
    return text.replace(old, new, 1)

path = Path(sys.argv[1])
html = path.read_text(encoding="utf-8")
sha = hashlib.sha256(html.encode("utf-8")).hexdigest()
if sha != EXPECTED_V17:
    raise SystemExit(f"Input is not exact V17 HTML: {sha}")

html = replace_once(
    html,
    '<div class="actions"><button type="button" class="btn primary" id="shareContact">شریکول</button><button type="button" class="btn ok" id="sendContact">نورو ته لېږل</button><button type="button" class="btn ghost" id="copyContact">کاپي کول</button></div>',
    '<div class="actions"><button type="button" class="btn primary" id="shareContact">شریکول</button><button type="button" class="btn ok" id="sendContact">نورو ته لېږل</button><button type="button" class="btn ghost" id="shareApp" data-t="shareApp">اصلي اپ شریکول</button><button type="button" class="btn ghost" id="downloadCommission" data-t="downloadCommission">د کره کمیسیون د فورمو اپ ډاونلوډ</button></div>',
    "Contacts buttons",
)
old_func = "async function copyContact(){const txt=contactText();try{if(window.NativeApp&&NativeApp.copyText){NativeApp.copyText(txt);return}if(navigator.clipboard){await navigator.clipboard.writeText(txt);alert('د اړیکو معلومات کاپي شول.');return}alert(txt)}catch{alert(txt)}}\nasync function shareContact(){const txt=contactText();try{if(window.NativeApp&&NativeApp.shareText){NativeApp.shareText(txt);return}if(navigator.share){await navigator.share({title:'زموږ سره اړیکه',text:txt});return}await copyContact()}catch{}}"
new_func = "function shareOriginalApp(){try{if(window.NativeApp&&NativeApp.shareCurrentApk){NativeApp.shareCurrentApk();return}window.location.href='hafz://share/app'}catch(e){alert('د اصلي اپ شریکول ممکن نه شول.')}}\nfunction downloadCommissionApp(){try{if(window.NativeApp&&NativeApp.downloadCommissionApk){NativeApp.downloadCommissionApk();return}window.location.href='hafz://download/commission'}catch(e){alert('د کره کمیسیون اپ ډاونلوډ پیل نه شو.')}}\nasync function shareContact(){const txt=contactText();try{if(window.NativeApp&&NativeApp.shareText){NativeApp.shareText(txt);return}if(navigator.share){await navigator.share({title:'زموږ سره اړیکه',text:txt});return}if(navigator.clipboard){await navigator.clipboard.writeText(txt);alert('د اړیکو معلومات کاپي شول.');return}alert(txt)}catch{}}"
html = replace_once(html, old_func, new_func, "Contacts JavaScript")
html = replace_once(
    html,
    "$('shareContact').onclick=shareContact;$('sendContact').onclick=shareContact;$('copyContact').onclick=copyContact;",
    "$('shareContact').onclick=shareContact;$('sendContact').onclick=shareContact;$('shareApp').onclick=shareOriginalApp;$('downloadCommission').onclick=downloadCommissionApp;",
    "Contacts event bindings",
)
anchor = '};\n\n// Additive translations for the date converter and the expanded Help guide.'
translations = """};

// Contact-page actions: share this installed APK and download the companion commission app.
Object.assign(TXT.ps,{shareApp:'اصلي اپ شریکول',downloadCommission:'د کره کمیسیون د فورمو اپ ډاونلوډ'});
Object.assign(TXT.fa,{shareApp:'اشتراک‌گذاری نسخه اصلی برنامه',downloadCommission:'دانلود اپ ثبت و مدیریت فورم‌های کره کمیسیون'});
Object.assign(TXT.ar,{shareApp:'مشاركة ملف التطبيق الأصلي',downloadCommission:'تنزيل تطبيق تسجيل وإدارة نماذج لجنة كره'});
Object.assign(TXT.ur,{shareApp:'اصل ایپ شیئر کریں',downloadCommission:'کرہ کمیشن فارم رجسٹریشن اور مینجمنٹ ایپ ڈاؤن لوڈ کریں'});
Object.assign(TXT.en,{shareApp:'Share original app',downloadCommission:'Download Karah Commission Forms App'});

// Additive translations for the date converter and the expanded Help guide."""
html = replace_once(html, anchor, translations, "Contacts translations")
if 'id="copyContact"' in html or "$('copyContact')" in html or 'function copyContact()' in html:
    raise SystemExit("Old copy-contact button/function remains")
if html.count('id="shareApp"') != 1 or html.count('id="downloadCommission"') != 1:
    raise SystemExit("New Contacts buttons missing or duplicated")
sha = hashlib.sha256(html.encode("utf-8")).hexdigest()
if sha != EXPECTED_V18:
    raise SystemExit(f"V18 HTML differs from verified local target: {sha}")
path.write_text(html, encoding="utf-8")
print(f"V18 Contacts patch verified: {len(html.encode('utf-8'))} bytes; SHA-256 {sha}")
