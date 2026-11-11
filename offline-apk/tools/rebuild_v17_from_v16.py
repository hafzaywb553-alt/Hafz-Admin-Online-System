#!/usr/bin/env python3
"""Rebuild the exact V17 HTML asset from the publicly hosted V16 APK."""
from pathlib import Path
import hashlib
import re
import zipfile

EXPECTED_V16_APK_SHA256 = "13d7b60f123b42b1dc32b7f48c5f2b5bf6e71db627d9951d2c29d9d997fb2c43"
EXPECTED_V17_HTML_SHA256 = "2bd7a986ed2ae86e04ab9d05dc14653d92dbd9045c9f6992b7bf29fa408695a2"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"V16→V17 patch anchor {label!r}: expected exactly one match, got {n}")
    return text.replace(old, new, 1)


def replace_field(text: str, field: str, old: str, new: str, label: str) -> str:
    old_token = f"{field}:'{old}'"
    new_token = f"{field}:'{new}'"
    return replace_once(text, old_token, new_token, label)


def rebuild(apk_path: Path, output_path: Path) -> None:
    apk_hash = hashlib.sha256(apk_path.read_bytes()).hexdigest()
    if apk_hash != EXPECTED_V16_APK_SHA256:
        raise SystemExit(f"Unexpected V16 APK SHA-256: {apk_hash}")
    with zipfile.ZipFile(apk_path) as zf:
        html = zf.read("assets/index.html").decode("utf-8")

    html = replace_once(html, ".tax-rule-notice{margin:0 0 14px}", "", "tax notice CSS")
    html = replace_once(
        html,
        '  <div class="notice tax-rule-notice"><b data-t="taxRuleTitle">د مالیې نورم:</b> <span id="taxRuleText" data-t="taxRule">لومړی د معاش، اعاشې او ټولو امتیازاتو مجموعه حسابېږي؛ له مجموعې ۱۰٬۰۰۰ افغانۍ معافې دي؛ تر ۱۰۰٬۰۰۰ پورې د ۱۰٬۰۰۰ څخه پورته برخې ۱۰٪، او له ۱۰۰٬۰۰۰ څخه د پورته برخې ۱۵٪ مالیه ده.</span></div>',
        "",
        "salary tax notice",
    )
    html = replace_once(
        html,
        '<div class="actions"><a class="btn primary" href="hafz://share/contact">شریکول</a><a class="btn ok" href="hafz://share/contact">نورو ته لېږل</a><a class="btn ghost" href="hafz://copy/contact">کاپي کول</a></div>',
        '<div class="actions"><button type="button" class="btn primary" id="shareContact">شریکول</button><button type="button" class="btn ok" id="sendContact">نورو ته لېږل</button><button type="button" class="btn ghost" id="copyContact">کاپي کول</button></div>',
        "contact action controls",
    )
    color_labels = [
        ('accentColor', 'اصلي رنګ', 'accent', '#1d8fd1'),
        ('fieldColor', 'د خانو/فیلډ رنګ', 'field', '#061326'),
        ('textColor', 'د لیکنو رنګ', 'textColor', '#f4f8ff'),
        ('numberColor', 'د شمیرو رنګ', 'numberColor', '#ffd466'),
        ('backgroundColor', 'د شالید رنګ', 'bgColor', '#071631'),
        ('panelColor', 'د کارت/پینل رنګ', 'panelColor', '#0d2442'),
        ('headerColor', 'د جدول سرلیک رنګ', 'headerColor', '#164b7d'),
    ]
    for key, label, control, value in color_labels:
        old = f'<label data-t="{key}">{label}<input id="{control}" type="color" value="{value}"></label>'
        new = f'<label><span data-t="{key}">{label}</span><input id="{control}" type="color" value="{value}"></label>'
        html = replace_once(html, old, new, f"settings color label {key}")

    for ident, text, kind in [
        ("resetAppearance", "یوازې د بڼې تنظیمات بېرته اصلي کول", "ghost"),
        ("resetColors", "یوازې رنګونه اصلي کول", "ghost"),
        ("resetAll", "ټول تنظیمات اصلي حالت ته راوستل", "danger"),
    ]:
        old = f'<a class="btn {kind}" href="hafz://settings/{ident[0].lower()+ident[1:]}" id="{ident}" data-t="{ident}">{text}</a>'
        new = f'<button class="btn {kind}" type="button" id="{ident}" data-t="{ident}">{text}</button>'
        html = replace_once(html, old, new, f"settings button {ident}")
    html = replace_once(
        html,
        '<a class="btn danger" href="hafz://settings/clearData" id="clearData" data-t="clearData">ټول محلي معلومات پاکول</a>',
        '<button class="btn danger" type="button" id="clearData" data-t="clearData">ټول محلي معلومات پاکول</button>',
        "clear local data button",
    )

    field_changes = [
        ("taxHelpHeading", "د مالیې مرسته:", "د مالیې د محاسبې نورم او وضاحت:"),
        ("taxHelpHeading", "کمک مالیات:", "اصول و روش محاسبه مالیات:"),
        ("taxHelpHeading", "مساعدة الضريبة:", "قاعدة الضريبة وطريقة احتسابها:"),
        ("taxHelpHeading", "ٹیکس مدد:", "ٹیکس کا اصول اور وضاحت:"),
        ("taxHelpHeading", "Tax help:", "Tax calculation rule and explanation:"),
        ("taxHelpHeading", "۲ ـ د مالیې د محاسبې طریقه", "۲ ـ د مالیې د محاسبې نورم او وضاحت"),
        ("taxHelpHeading", "۲ ـ روش محاسبه مالیات", "۲ ـ اصول و روش محاسبه مالیات"),
        ("taxHelpHeading", "٢ ـ طريقة حساب الضريبة", "٢ ـ قاعدة الضريبة وطريقة احتسابها"),
        ("taxHelpHeading", "۲ ـ ٹیکس کا حساب", "۲ ـ ٹیکس کا اصول اور وضاحت"),
        ("taxHelpHeading", "2 — How tax is calculated", "2 — Tax rule and explanation"),
        ("dateNote", "قمري نتیجه د ام القری تقویم له مخې ده؛ د ځايي سپوږمۍ لیدلو له مخې یوه ورځ توپیر ممکن دی.", "قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي."),
        ("dateNote", "نتیجه قمری بر اساس تقویم ام\u200cالقری است؛ با رؤیت محلی هلال ممکن است یک روز تفاوت داشته باشد.", "نتیجه قمری بر اساس تقویم ام\u200cالقری است؛ اگر WebView این تقویم را نشناسد، محاسبه آفلاین جایگزین می\u200cشود و ممکن است یک یا دو روز تفاوت داشته باشد."),
        ("dateNote", "النتيجة القمرية وفق تقويم أم القرى؛ وقد تختلف يوماً حسب رؤية الهلال المحلية.", "النتيجة القمرية وفق تقويم أم القرى عند توفره؛ وإذا لم يدعمه WebView على الهاتف، يُستخدم حساب هجري تقريبي غير متصل وقد يختلف يوماً أو يومين عن رؤية الهلال المحلية."),
        ("dateNote", "The lunar result uses the Umm al-Qura calendar; local moon sighting may differ by one day.", "The lunar result uses Umm al-Qura when available. If the phone WebView lacks it, an offline arithmetic Hijri fallback is used and may differ by one or two days."),
    ]
    for field, old, new in field_changes:
        html = replace_field(html, field, old, new, f"{field} wording")

    old_settings = "let settings=Object.assign({lang:'ps',theme:'dark',fontSize:16,fieldSize:52,weight:'400',radius:16,accent:'#1d8fd1',field:'#061326',textColor:'#f4f8ff',numberColor:'#ffd466',bg:'#071631',panel:'#0d2442',header:'#164b7d'},load(SET));"
    new_settings = """const SET_DEFAULTS={lang:'ps',theme:'dark',fontSize:16,fieldSize:52,weight:'400',radius:16,accent:'#1d8fd1',field:'#061326',textColor:'#f4f8ff',numberColor:'#ffd466',bg:'#071631',panel:'#0d2442',header:'#164b7d'};
let settings=Object.assign({},SET_DEFAULTS,load(SET));
(function normalizeSettings(){
  if(!['ps','fa','ar','ur','en'].includes(settings.lang))settings.lang=SET_DEFAULTS.lang;
  if(!['dark','light'].includes(settings.theme))settings.theme=SET_DEFAULTS.theme;
  settings.fontSize=Math.max(12,Math.min(22,Number(settings.fontSize)||16));
  settings.fieldSize=Math.max(44,Math.min(70,Number(settings.fieldSize)||52));
  settings.radius=Math.max(0,Math.min(28,Number(settings.radius)||0));
  settings.weight=settings.weight==='700'?'700':'400';
  ['accent','field','textColor','numberColor','bg','panel','header'].forEach(k=>{if(!/^#[0-9a-fA-F]{6}$/.test(String(settings[k]||'')))settings[k]=SET_DEFAULTS[k]});
})();"""
    html = replace_once(html, old_settings, new_settings, "settings normalization")

    start = html.index("const CALENDAR_NAMES={solar:'persian',lunar:'islamic-umalqura',gregorian:'gregory'};")
    end = html.index("function calendarDateText(date,kind){", start)
    new_calendar = """const CALENDAR_NAMES={solar:'persian',lunar:'islamic-umalqura',gregorian:'gregory'};
const CALENDAR_FORMATTERS={};
function calendarFormatter(kind){
  if(Object.prototype.hasOwnProperty.call(CALENDAR_FORMATTERS,kind))return CALENDAR_FORMATTERS[kind];
  const calendar=CALENDAR_NAMES[kind];
  if(!calendar)return null;
  try{
    const formatter=new Intl.DateTimeFormat('en-US-u-ca-'+calendar+'-nu-latn',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
    if(formatter.resolvedOptions().calendar!==calendar){CALENDAR_FORMATTERS[kind]=null;return null}
    CALENDAR_FORMATTERS[kind]=formatter;
    return formatter;
  }catch(e){CALENDAR_FORMATTERS[kind]=null;return null}
}
function partsFromFormatter(date,formatter){
  const parts=formatter.formatToParts(date);
  return {year:Number(parts.find(p=>p.type==='year').value),month:Number(parts.find(p=>p.type==='month').value),day:Number(parts.find(p=>p.type==='day').value)};
}
// Arithmetic Islamic civil calendar fallback. It is deterministic and works without ICU
// calendar data; it can differ from local moon sighting/Umm al-Qura by a day or two.
const ISLAMIC_EPOCH_JD=1948439.5, UNIX_EPOCH_JD=2440587.5, MS_PER_DAY=86400000;
function islamicCivilToJD(year,month,day){
  return day+Math.ceil(29.5*(month-1))+(year-1)*354+Math.floor((3+11*year)/30)+ISLAMIC_EPOCH_JD-1;
}
function islamicCivilFromDate(date){
  const jd=date.getTime()/MS_PER_DAY+UNIX_EPOCH_JD;
  const year=Math.floor((30*(jd-ISLAMIC_EPOCH_JD)+10646)/10631);
  const month=Math.min(12,Math.ceil((jd-(29+islamicCivilToJD(year,1,1)))/29.5)+1);
  const day=Math.floor(jd-islamicCivilToJD(year,month,1)+1+1e-7);
  return {year,month,day};
}
function islamicCivilToDate(parts){
  const {year,month,day}=parts;
  if(!Number.isInteger(year)||year<1||year>3000||!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>30)return null;
  const date=new Date(Math.round((islamicCivilToJD(year,month,day)-UNIX_EPOCH_JD)*MS_PER_DAY));
  const back=islamicCivilFromDate(date);
  return back.year===year&&back.month===month&&back.day===day?date:null;
}
function calendarParts(date,kind){
  const formatter=calendarFormatter(kind);
  if(formatter)return partsFromFormatter(date,formatter);
  if(kind==='lunar')return islamicCivilFromDate(date);
  throw new Error('unsupported-calendar');
}
function parseCalendarInput(value){
  const normalized=normalizeCalendarDigits(value).trim().replace(/[.\\-]/g,'/');
  const m=normalized.match(/^(\\d{3,4})\\/(\\d{1,2})\\/(\\d{1,2})$/);
  let result;
  if(m)result={year:Number(m[1]),month:Number(m[2]),day:Number(m[3])};
  else{
    const dmy=normalized.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{3,4})$/);
    if(!dmy)return null;
    result={year:Number(dmy[3]),month:Number(dmy[2]),day:Number(dmy[1])};
  }
  if(result.year<1||result.month<1||result.month>12||result.day<1||result.day>31)return null;
  return result;
}
function gregorianFromCalendar(value,kind){
  const wanted=parseCalendarInput(value);
  if(!wanted)return null;
  if(kind==='gregorian'){
    const d=new Date(Date.UTC(wanted.year,wanted.month-1,wanted.day));
    if(d.getUTCFullYear()!==wanted.year||d.getUTCMonth()+1!==wanted.month||d.getUTCDate()!==wanted.day)return null;
    return d;
  }
  if(kind==='lunar'){
    const formatter=calendarFormatter('lunar');
    if(formatter){
      const approx=Math.floor(wanted.year*0.970224+621);
      const start=Date.UTC(approx-1,0,1);
      for(let offset=0;offset<1100;offset++){
        const candidate=new Date(start+offset*MS_PER_DAY);
        const actual=partsFromFormatter(candidate,formatter);
        if(actual.year===wanted.year&&actual.month===wanted.month&&actual.day===wanted.day)return candidate;
      }
    }
    return islamicCivilToDate(wanted);
  }
  if(kind==='solar'){
    const formatter=calendarFormatter('solar');
    if(!formatter)throw new Error('unsupported-calendar');
    const approx=wanted.year+621,start=Date.UTC(approx-1,0,1);
    for(let offset=0;offset<1100;offset++){
      const candidate=new Date(start+offset*MS_PER_DAY);
      const actual=partsFromFormatter(candidate,formatter);
      if(actual.year===wanted.year&&actual.month===wanted.month&&actual.day===wanted.day)return candidate;
    }
  }
  return null;
}
"""
    html = html[:start] + new_calendar + html[end:]

    actual = hashlib.sha256(html.encode("utf-8")).hexdigest()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    if actual != EXPECTED_V17_HTML_SHA256:
        raise SystemExit(f"Rebuilt HTML is not exact V17. SHA-256={actual}; expected={EXPECTED_V17_HTML_SHA256}")
    print(f"Rebuilt exact V17 HTML: {len(html.encode('utf-8'))} bytes; SHA-256 {actual}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        raise SystemExit("Usage: rebuild_v17_from_v16.py V16.apk output.html")
    rebuild(Path(sys.argv[1]), Path(sys.argv[2]))
