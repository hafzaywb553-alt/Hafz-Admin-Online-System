#!/usr/bin/env python3
"""Apply V23 calculation and reliability repairs without changing salary/allowance tables."""
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "offline-apk/app/src/main/assets/index.html")
html = path.read_text(encoding="utf-8")

def rep(old, new, label):
    global html
    count = html.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    html = html.replace(old, new, 1)

# Add bounded inputs and visible validation/storage messages.
rep(
    '<label><span data-t="days">د محاسبې ټولې ورځې</span><input id="calcDays" type="number" min="1" inputmode="numeric" placeholder="خالي = د ټاکل شوې میاشتې بشپړې ورځې"></label>',
    '<label><span data-t="days">د محاسبې ټولې ورځې</span><input id="calcDays" type="number" min="1" max="3660" step="1" inputmode="numeric" placeholder="خالي = د ټاکل شوې میاشتې بشپړې ورځې"></label><div id="calcError" class="notice warn hidden" role="alert" aria-live="assertive" style="grid-column:1/-1"></div>',
    "calculation days field")
rep(
    '<label><span id="daysLabel">د غیرحاضرۍ/استثنا ورځې</span><input id="attendanceDays" type="number" min="0" inputmode="numeric" value="0"></label>',
    '<label><span id="daysLabel">د غیرحاضرۍ/استثنا ورځې</span><input id="attendanceDays" type="number" min="0" max="3660" step="1" inputmode="numeric" value="0"></label>',
    "absence days field")
rep(
    '<div id="periodNote" class="notice"></div>',
    '<div id="periodNote" class="notice"></div><div id="storageWarning" class="notice warn hidden" role="alert" aria-live="assertive"></div>',
    "storage warning area")

# Localized Solar months and leap-year logic; fallback uses the 33-year Solar-Hijri cycle.
rep(
    "const MONTHS=[['01','حمل'],['02','ثور'],['03','جوزا'],['04','سرطان'],['05','اسد'],['06','سنبله'],['07','میزان'],['08','عقرب'],['09','قوس'],['10','جدی'],['11','دلو'],['12','حوت']];",
    """const MONTHS=[['01','حمل'],['02','ثور'],['03','جوزا'],['04','سرطان'],['05','اسد'],['06','سنبله'],['07','میزان'],['08','عقرب'],['09','قوس'],['10','جدی'],['11','دلو'],['12','حوت']];
const MONTH_NAMES={ps:['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],fa:['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'],ar:['الحمل','الثور','الجوزاء','السرطان','الأسد','السنبلة','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'],ur:['حمل','ثور','جوزا','سرطان','اسد','سنبلہ','میزان','عقرب','قوس','جدی','دلو','حوت'],en:['Hamal','Sawr','Jawza','Saratan','Asad','Sunbula','Mizan','Aqrab','Qaws','Jadi','Dalw','Hoot']};
const DAY_UNITS={ps:'ورځې',fa:'روز',ar:'أيام',ur:'دن',en:'days'};
const SOLAR_LEAP_CACHE=Object.create(null);
function solarMonthName(month,lang){const names=MONTH_NAMES[lang]||MONTH_NAMES.ps;return names[Number(month)-1]||MONTHS[Number(month)-1]?.[1]||'';}
function isSolarLeapYear(year){
 const y=Math.trunc(Number(year)||1405);
 if(Object.prototype.hasOwnProperty.call(SOLAR_LEAP_CACHE,y))return SOLAR_LEAP_CACHE[y];
 try{
  const start=gregorianFromCalendar(y+'/01/01','solar');
  const next=gregorianFromCalendar((y+1)+'/01/01','solar');
  if(start&&next){const length=Math.round((next.getTime()-start.getTime())/MS_PER_DAY);if(length===365||length===366){SOLAR_LEAP_CACHE[y]=length===366;return SOLAR_LEAP_CACHE[y]}}
 }catch(e){}
 const offset=((y-1403)%33+33)%33;
 SOLAR_LEAP_CACHE[y]=[0,5,9,13,17,22,26,30].includes(offset);
 return SOLAR_LEAP_CACHE[y];
}""",
    "localized Solar month and leap-year helpers")

# Input validation, storage errors, and per-month tax; tax() brackets themselves are untouched.
rep(
    "function solarDays(m){m=Number(m);return m<=6?31:m<=11?30:29}",
    """function solarDays(m,year){m=Number(m);if(m<1||m>12)return 0;if(m<=6)return 31;if(m<=11)return 30;return isSolarLeapYear(year)?30:29}
function resolveCalculationDays(raw,monthDays){const value=normalizeCalendarDigits(String(raw??'').trim());if(value==='')return {ok:true,days:monthDays};const days=Number(value);return Number.isSafeInteger(days)&&days>=1&&days<=3660?{ok:true,days}:{ok:false,days:0}}
function resolveAbsenceDays(raw,totalDays){const value=normalizeCalendarDigits(String(raw??'0').trim()||'0');const days=Number(value);return Number.isSafeInteger(days)&&days>=0&&days<=totalDays?{ok:true,days}:{ok:false,days:0}}
function showCalculationError(kind){const el=$('calcError');if(!el)return;const text={ps:{days:'د محاسبې ورځې باید له ۱ تر ۳۶۶۰ پورې بشپړ عدد وي.',absence:'د غیرحاضرۍ ورځې باید بشپړ عدد او د ټولې مودې له ورځو زیاتې نه وي.'},fa:{days:'روزهای محاسبه باید عدد کامل از ۱ تا ۳۶۶۰ باشد.',absence:'روزهای غیرحاضری باید عدد کامل و کمتر یا برابر کل روزها باشد.'},ar:{days:'يجب أن تكون أيام الحساب عدداً صحيحاً من ١ إلى ٣٦٦٠.',absence:'يجب أن تكون أيام الغياب عدداً صحيحاً وألا تتجاوز المدة.'},ur:{days:'حساب کے دن ۱ سے ۳۶۶۰ تک مکمل عدد ہوں۔',absence:'غیرحاضری کے دن مکمل عدد ہوں اور کل مدت سے زیادہ نہ ہوں۔'},en:{days:'Calculation days must be a whole number from 1 to 3,660.',absence:'Absence days must be whole and cannot exceed the calculation period.'}};el.textContent=(text[settings.lang]||text.ps)[kind];el.classList.remove('hidden')}
function clearCalculationError(){const el=$('calcError');if(el){el.textContent='';el.classList.add('hidden')}}
function showStorageWarning(){const el=$('storageWarning');if(!el)return;const text={ps:'معلومات په دې موبایل کې خوندي نه شوې؛ د حافظې ځای وګورئ.',fa:'اطلاعات در موبایل ذخیره نشد؛ فضای حافظه را بررسی کنید.',ar:'تعذر حفظ البيانات على الهاتف؛ تحقق من مساحة التخزين.',ur:'معلومات موبائل میں محفوظ نہیں ہوئیں؛ جگہ چیک کریں۔',en:'Data could not be saved on this phone. Check available storage.'};el.textContent=text[settings.lang]||text.ps;el.classList.remove('hidden')}""",
    "validated days helpers and visible storage warning")
rep(
    "function tax(amount){const x=Math.max(0,round(amount));if(x<=10000)return 0;if(x<=100000)return round((x-10000)*0.10);return round(9000+(x-100000)*0.15)}",
    "function tax(amount){const x=Math.max(0,round(amount));if(x<=10000)return 0;if(x<=100000)return round((x-10000)*0.10);return round(9000+(x-100000)*0.15)}\nfunction sumMonthlyTax(monthlyGrossValues){if(!Array.isArray(monthlyGrossValues))return 0;return round(monthlyGrossValues.reduce((total,amount)=>total+tax(amount),0))}",
    "preserve current tax bands and add monthly aggregation")

# Do not silently truncate after 120 months; reject values outside the stated 10-year input range.
rep(
    """function periods(y,m,total){
  const out=[];let yy=+y,mm=+m,rem=Math.max(1,Math.floor(total));
  while(rem>0&&out.length<120){
    const md=solarDays(mm),d=Math.min(rem,md);
    out.push({year:yy,month:mm,name:MONTHS[mm-1][1],monthDays:md,startDay:1,days:d});
    rem-=d;mm++;if(mm>12){mm=1;yy++}
  }
  return out;
}""",
    """function periods(y,m,total,lang){
  const count=Number(total);if(!Number.isSafeInteger(count)||count<1||count>3660)throw new Error('invalid-calculation-days');
  const out=[];let yy=Number(y),mm=Number(m),rem=count;
  while(rem>0&&out.length<128){
    const md=solarDays(mm,yy),d=Math.min(rem,md);
    out.push({year:yy,month:mm,name:solarMonthName(mm,lang||settings.lang),monthDays:md,startDay:1,days:d});
    rem-=d;mm++;if(mm>12){mm=1;yy++}
  }
  if(rem>0)throw new Error('period-overflow');
  return out;
}""",
    "remove 120-month silent truncation")

# Refresh month names/day count when language or year changes.
rep(
    "$('month').innerHTML=MONTHS.map(x=>'<option value=\"'+x[0]+'\">'+x[1]+' — '+fa(x[0])+' — '+fa(solarDays(+x[0]))+' ورځې</option>').join('');",
    "$('month').innerHTML=MONTHS.map(x=>'<option value=\"'+x[0]+'\">'+esc(solarMonthName(+x[0],settings.lang))+' — '+fa(x[0])+' — '+fa(solarDays(+x[0],Number(keepYear)||1405))+' '+esc(DAY_UNITS[settings.lang]||DAY_UNITS.ps)+'</option>').join('');",
    "localized month selector")
rep(
    "function handleDataChange(id){\n  data[id]=$(id).value;\n",
    "function handleDataChange(id){\n  data[id]=$(id).value;\n  if(id==='status'&&data.status==='حاضر'){data.attendanceDays='0';$('attendanceDays').value='0'}\n",
    "clear stale absence days on present status")
rep(
    "  applyLeaveLang();\n  if($('calcDays')&&L.daysPlaceholder)$('calcDays').placeholder=L.daysPlaceholder;",
    "  applyLeaveLang();\n  fillSelects();\n  if($('calcDays')&&L.daysPlaceholder)$('calcDays').placeholder=L.daysPlaceholder;",
    "refresh localized month names on language change")

# Reject invalid calculations rather than coercing negatives/decimals or silently clamping.
rep(
    "  const y=Number(data.year)||1405,m=Number(data.month)||1,md=solarDays(m);\n  data.startDay='1';\n  const raw=String(data.calcDays||'').trim();\n  const requestedDays=raw===''?md:Number(raw);\n  const totalDays=Number.isFinite(requestedDays)?Math.max(1,Math.floor(requestedDays)):md;",
    "  const y=Number(data.year)||1405,m=Number(data.month)||1,md=solarDays(m,y);\n  data.startDay='1';\n  const raw=String(data.calcDays||'').trim();\n  const resolvedDays=resolveCalculationDays(raw,md);\n  if(!resolvedDays.ok){showCalculationError('days');$('resultRow').innerHTML='';$('periodNote').textContent='';return}\n  const totalDays=resolvedDays.days;\n  if(data.status==='حاضر'){const changed=data.attendanceDays!=='0';data.attendanceDays='0';$('attendanceDays').value='0';if(changed)save()}\n  const absenceResult=resolveAbsenceDays(data.attendanceDays,totalDays);\n  if(!absenceResult.ok){showCalculationError('absence');$('resultRow').innerHTML='';$('periodNote').textContent='';return}\n  const absenceDays=absenceResult.days;\n  clearCalculationError();",
    "strict salary calculation validation")
rep(
    "  const ex=data.status==='حاضر'?0:Math.min(totalDays,Math.max(0,Math.floor(Number(data.attendanceDays)||0)));\n  const ps=periods(y,m,totalDays);let remEx=ex;",
    "  const ex=data.status==='حاضر'?0:absenceDays;\n  const ps=periods(y,m,totalDays,settings.lang);let remEx=ex;",
    "validated absence count and leap-aware periods")
rep(
    "  totals.tax=tax(totals.gross);",
    "  totals.tax=sumMonthlyTax(detail.map(r=>r.gross));",
    "apply tax by month")

# Safe local storage shape and visible quota/security failures.
rep(
    "function load(k){try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}}",
    "function load(k){try{const value=JSON.parse(localStorage.getItem(k)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}}",
    "validate saved JSON type")
rep(
    "function save(){localStorage.setItem(STORE,JSON.stringify(data))}\nfunction saveSet(){localStorage.setItem(SET,JSON.stringify(settings))}",
    "function save(){try{localStorage.setItem(STORE,JSON.stringify(data));return true}catch(e){showStorageWarning();return false}}\nfunction saveSet(){try{localStorage.setItem(SET,JSON.stringify(settings));return true}catch(e){showStorageWarning();return false}}",
    "catch local storage failures")
rep(
    "document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>openContact(b.dataset.action)));",
    "document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',event=>{event.preventDefault();openContact(b.dataset.action)}));",
    "prevent default tel navigation after native action")

# Never substitute the different civil lunar arithmetic for the displayed Umm-al-Qura calendar.
rep(
    "  if(formatter)return partsFromFormatter(date,formatter);\n  if(kind==='lunar')return islamicCivilFromDate(date);\n  throw new Error('unsupported-calendar');",
    "  if(formatter)return partsFromFormatter(date,formatter);\n  throw new Error('unsupported-calendar');",
    "remove misleading lunar fallback")
rep(
    "    return islamicCivilToDate(wanted);\n  }\n  if(kind==='solar'){",
    "    throw new Error('unsupported-calendar');\n  }\n  if(kind==='solar'){",
    "reject lunar conversion when Umm al-Qura is unsupported")

# Remove only the duplicate second copy of the two reset helper declarations.
reset_pair = "function resetAppearance(){settings.theme='dark';settings.fontSize=16;settings.fieldSize=52;settings.weight='400';settings.radius=16;applySettings()}\nfunction resetColors(){settings.accent='#1d8fd1';settings.field='#061326';settings.textColor='#f4f8ff';settings.numberColor='#ffd466';settings.bg='#071631';settings.panel='#0d2442';settings.header='#164b7d';applySettings()}"
if html.count(reset_pair) == 2:
    first = html.find(reset_pair)
    second = html.find(reset_pair, first + len(reset_pair))
    html = html[:second] + html[second + len(reset_pair):]
elif html.count(reset_pair) != 1:
    raise SystemExit("Unexpected resetAppearance/resetColors declaration count")

rep(
    "$('clearData').onclick=()=>{if(confirm('ایا د معاشاتو ټول آفلاین معلومات او تنظیمات پاک شي؟')){localStorage.removeItem(STORE);localStorage.removeItem(SET);location.reload()}};",
    "$('clearData').onclick=()=>{if(confirm('ایا د معاشاتو ټول آفلاین معلومات او تنظیمات پاک شي؟')){try{localStorage.removeItem(STORE);localStorage.removeItem(SET);location.reload()}catch(e){showStorageWarning()}}};",
    "safe manual local data clearing")
rep(
    "window.clearAllNative=function(){localStorage.removeItem(STORE);localStorage.removeItem(SET);location.reload();};",
    "window.clearAllNative=function(){try{localStorage.removeItem(STORE);localStorage.removeItem(SET);location.reload()}catch(e){showStorageWarning()}};",
    "safe native local data clearing")

path.write_text(html, encoding="utf-8")
print(f"Applied Finance V23 core repairs to {path} ({len(html)} characters).")
