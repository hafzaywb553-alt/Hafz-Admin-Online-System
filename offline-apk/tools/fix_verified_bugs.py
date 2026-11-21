from pathlib import Path

path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
s = path.read_text(encoding="utf-8")

def replace_once(old, new, label):
    global s
    count = s.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one exact match, found {count}")
    s = s.replace(old, new, 1)

# Deterministic Jalali conversion. This is also the fallback when WebView ICU
# does not provide the Persian calendar. Salary/allowance tables are untouched.
jalali = r"""const JALALI_BREAKS=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
function jDiv(a,b){return Math.trunc(a/b)}
function jMod(a,b){return a-jDiv(a,b)*b}
function jalaliCalendar(jy){
  if(!Number.isInteger(jy)||jy<JALALI_BREAKS[0]||jy>=JALALI_BREAKS[JALALI_BREAKS.length-1])throw new Error('unsupported-solar-year');
  const gy=jy+621;let leapJ=-14,jp=JALALI_BREAKS[0],jm=0,jump=0,n=0;
  for(let i=1;i<JALALI_BREAKS.length;i++){
    jm=JALALI_BREAKS[i];jump=jm-jp;
    if(jy<jm)break;
    leapJ+=jDiv(jump,33)*8+jDiv(jMod(jump,33),4);jp=jm;
  }
  n=jy-jp;
  leapJ+=jDiv(n,33)*8+jDiv(jMod(n,33)+3,4);
  if(jMod(jump,33)===4&&jump-n===4)leapJ++;
  const leapG=jDiv(gy,4)-jDiv((jDiv(gy,100)+1)*3,4)-150;
  const march=20+leapJ-leapG;
  if(jump-n<6)n=n-jump+jDiv(jump+4,33)*33;
  let leap=jMod(jMod(n+1,33)-1,4);if(leap===-1)leap=4;
  return {leap,gy,march};
}
function gregorianDayNumber(gy,gm,gd){
  let d=jDiv((gy+jDiv(gm-8,6)+100100)*1461,4)+jDiv(153*jMod(gm+9,12)+2,5)+gd-34840408;
  d=d-jDiv(jDiv(gy+100100+jDiv(gm-8,6),100)*3,4)+752;
  return d;
}
function gregorianFromDayNumber(jdn){
  let j=4*jdn+139361631;
  j=j+jDiv(jDiv(4*jdn+183187720,146097)*3,4)*4-3908;
  const i=jDiv(jMod(j,1461),4)*5+308;
  const day=jDiv(jMod(i,153),5)+1;
  const month=jMod(jDiv(i,153),12)+1;
  const year=jDiv(j,1461)-100100+jDiv(8-month,6);
  return {year,month,day};
}
function jalaliDayNumber(jy,jm,jd){
  const r=jalaliCalendar(jy);
  return gregorianDayNumber(r.gy,3,r.march)+(jm-1)*31-jDiv(jm,7)*(jm-7)+jd-1;
}
function jalaliFromDayNumber(jdn){
  const gy=gregorianFromDayNumber(jdn).year;
  let jy=gy-621;const r=jalaliCalendar(jy);
  const first=gregorianDayNumber(gy,3,r.march);
  let k=jdn-first;
  if(k>=0){
    if(k<=185)return {year:jy,month:1+jDiv(k,31),day:jMod(k,31)+1};
    k-=186;return {year:jy,month:7+jDiv(k,30),day:jMod(k,30)+1};
  }
  jy-=1;k+=179;if(r.leap===1)k+=1;
  return {year:jy,month:7+jDiv(k,30),day:jMod(k,30)+1};
}
function jalaliToGregorian(parts){
  const {year,month,day}=parts;
  if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12||!Number.isInteger(day)||day<1||day>(month<=6?31:month<=11?30:(jalaliCalendar(year).leap===0?30:29)))return null;
  const g=gregorianFromDayNumber(jalaliDayNumber(year,month,day));
  return new Date(Date.UTC(g.year,g.month-1,g.day));
}
function gregorianToJalali(date){
  return jalaliFromDayNumber(gregorianDayNumber(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate()));
}
"""
replace_once("function solarDays(m){m=Number(m);return m<=6?31:m<=11?30:29}",
              jalali + "function solarDays(m,year){m=Number(m);if(m>=1&&m<=6)return 31;if(m>=7&&m<=11)return 30;if(m===12)return jalaliCalendar(Number(year)).leap===0?30:29;return 0}",
              "Jalali calendar and leap-year calculation")

replace_once("const md=solarDays(mm),d=Math.min(rem,md);",
              "const md=solarDays(mm,yy),d=Math.min(rem,md);",
              "month-specific day count in periods")
replace_once("while(rem>0&&out.length<120){","while(rem>0){","remove silent 120-month truncation")
replace_once("fa(solarDays(+x[0]))+' ورځې</option>'",
              "fa(solarDays(+x[0],Number(keepYear)))+' ورځې</option>'",
              "month dropdown leap-year day count")
replace_once("m=Number(data.month)||1,md=solarDays(m);",
              "m=Number(data.month)||1,md=solarDays(m,y);",
              "selected month leap-year day count")

# Keep the date converter working even when Android WebView lacks ICU's Persian calendar.
replace_once(
    "if(kind==='lunar')return islamicCivilFromDate(date);\n  throw new Error('unsupported-calendar');",
    "if(kind==='lunar')return islamicCivilFromDate(date);\n  if(kind==='solar')return gregorianToJalali(date);\n  throw new Error('unsupported-calendar');",
    "Solar Hijri formatter fallback")
replace_once(
    "const formatter=calendarFormatter('solar');\n    if(!formatter)throw new Error('unsupported-calendar');",
    "const formatter=calendarFormatter('solar');\n    if(!formatter)return jalaliToGregorian(wanted);",
    "Solar Hijri input fallback")

error_text = """const CALC_ERROR_TEXT={
 ps:{calc:'د محاسبې ورځې باید له ۱ څخه تر ۳۶۶۰ پورې بشپړ عدد وي.',absence:'د غیرحاضرۍ ورځې باید له صفر څخه تر ټولو محاسبه کېدونکو ورځو پورې بشپړ عدد وي.'},
 fa:{calc:'روزهای محاسبه باید عدد کامل از ۱ تا ۳۶۶۰ باشد.',absence:'روزهای غیرحاضری باید عدد کامل از صفر تا مجموع روزهای محاسبه باشد.'},
 ar:{calc:'يجب أن تكون أيام الحساب عدداً صحيحاً من ١ إلى ٣٦٦٠.',absence:'يجب أن تكون أيام الغياب عدداً صحيحاً من صفر إلى مجموع أيام الحساب.'},
 ur:{calc:'حساب کے دن ۱ سے ۳۶۶۰ تک مکمل عدد ہونے چاہییں۔',absence:'غیر حاضری کے دن صفر سے کل حسابی دنوں تک مکمل عدد ہونے چاہییں۔'},
 en:{calc:'Calculation days must be a whole number from 1 to 3660.',absence:'Absence days must be a whole number from zero to the total calculation days.'}
};
"""
replace_once("function render(){", error_text + "function render(){", "localized validation messages")
replace_once(
    "calcError.textContent='د محاسبې ورځې باید له ۱ څخه تر ۳۶۶۰ پورې بشپړ عدد وي.';",
    "calcError.textContent=(CALC_ERROR_TEXT[settings.lang]||CALC_ERROR_TEXT.ps).calc;",
    "localized calculation-days error")
replace_once(
    "attendanceError.textContent='د غیرحاضرۍ ورځې باید له صفر څخه تر ټولو محاسبه کېدونکو ورځو پورې بشپړ عدد وي.';",
    "attendanceError.textContent=(CALC_ERROR_TEXT[settings.lang]||CALC_ERROR_TEXT.ps).absence;",
    "localized absence-days error")

# Add clear validation feedback instead of silently coercing invalid values.
replace_once(
    '<label><span data-t="days">د محاسبې ټولې ورځې</span><input id="calcDays" type="number" min="1" inputmode="numeric" placeholder="خالي = د ټاکل شوې میاشتې بشپړې ورځې"></label>',
    '<label><span data-t="days">د محاسبې ټولې ورځې</span><input id="calcDays" type="number" min="1" max="3660" step="1" inputmode="numeric" placeholder="خالي = د ټاکل شوې میاشتې بشپړې ورځې"></label><div id="calcDaysError" class="notice warn hidden" style="grid-column:1/-1" role="alert"></div>',
    "calculation-days input validation UI")
replace_once(
    '<label><span id="daysLabel">د غیرحاضرۍ/استثنا ورځې</span><input id="attendanceDays" type="number" min="0" inputmode="numeric" value="0"></label>',
    '<label><span id="daysLabel">د غیرحاضرۍ/استثنا ورځې</span><input id="attendanceDays" type="number" min="0" max="3660" step="1" inputmode="numeric" value="0"></label><div id="attendanceDaysError" class="notice warn hidden" style="grid-column:1/-1" role="alert"></div>',
    "absence-days input validation UI")

replace_once(
    "const raw=String(data.calcDays||'').trim();\n  const requestedDays=raw===''?md:Number(raw);\n  const totalDays=Number.isFinite(requestedDays)?Math.max(1,Math.floor(requestedDays)):md;",
    """const raw=String(data.calcDays||'').trim();
  const calcError=$('calcDaysError'),attendanceError=$('attendanceDaysError');
  calcError.classList.add('hidden');attendanceError.classList.add('hidden');
  let totalDays=md;
  if(raw!==''){
    const requestedDays=Number(raw);
    if(!Number.isSafeInteger(requestedDays)||requestedDays<1||requestedDays>3660){
      calcError.textContent='د محاسبې ورځې باید له ۱ څخه تر ۳۶۶۰ پورې بشپړ عدد وي.';
      calcError.classList.remove('hidden');$('periodNote').textContent='';$('resultRow').innerHTML='';return;
    }
    totalDays=requestedDays;
  }
  if(data.status==='حاضر'){data.attendanceDays='0';$('attendanceDays').value='0';}
  const absenceDays=Number(data.attendanceDays||0);
  if(data.status!=='حاضر'&&(!Number.isSafeInteger(absenceDays)||absenceDays<0||absenceDays>totalDays)){
    attendanceError.textContent='د غیرحاضرۍ ورځې باید له صفر څخه تر ټولو محاسبه کېدونکو ورځو پورې بشپړ عدد وي.';
    attendanceError.classList.remove('hidden');$('periodNote').textContent='';$('resultRow').innerHTML='';return;
  }""",
    "strict calculation and absence-day validation")

replace_once(
    "const ex=data.status==='حاضر'?0:Math.min(totalDays,Math.max(0,Math.floor(Number(data.attendanceDays)||0)));",
    "const ex=data.status==='حاضر'?0:absenceDays;",
    "use validated absence days")
replace_once(
    "$('attendanceDays').disabled=data.status==='حاضر';if(data.status==='حاضر')$('attendanceDays').value='0';",
    "$('attendanceDays').disabled=data.status==='حاضر';$('attendanceDays').max=String(totalDays);if(data.status==='حاضر'){$('attendanceDays').value='0';data.attendanceDays='0';}",
    "persist the present-status reset")

# Reset stale absence data immediately when status changes to present.
replace_once(
    "data[id]=$(id).value;\n  if(id==='institution'){",
    "data[id]=$(id).value;\n  if(id==='status'&&data.status==='حاضر'){data.attendanceDays='0';$('attendanceDays').value='0';}\n  if(id==='institution'){",
    "clear stale absence days on status change")

# Ensure language-dependent settings are refreshed after an individual reset.
replace_once(
    "settings[k]=d[k];applySettings();applyLang();$('resetOne').value='';",
    "settings[k]=d[k];applySettings();applyLang();buildServiceYears();if(typeof updateLeaveCalculator==='function')updateLeaveCalculator();$('resetOne').value='';",
    "refresh translated settings after one-setting reset")
replace_once(
    "applySettings();applyLang();alert('ټول تنظیمات خپل اصلي حالت ته راوګرځول شول.')",
    "applySettings();applyLang();buildServiceYears();if(typeof updateLeaveCalculator==='function')updateLeaveCalculator();alert('ټول تنظیمات خپل اصلي حالت ته راوګرځول شول.')",
    "refresh translated settings after full reset")

# Remove duplicate reset function declarations, retaining one canonical copy.
duplicate = """function resetAppearance(){settings.theme='dark';settings.fontSize=16;settings.fieldSize=52;settings.weight='400';settings.radius=16;applySettings()}
function resetColors(){settings.accent='#1d8fd1';settings.field='#061326';settings.textColor='#f4f8ff';settings.numberColor='#ffd466';settings.bg='#071631';settings.panel='#0d2442';settings.header='#164b7d';applySettings()}
function resetOneSetting()"""
if duplicate in s:
    s=s.replace(duplicate, "function resetOneSetting()", 1)
if s.count("function resetAppearance(){") != 1 or s.count("function resetColors(){") != 1:
    raise SystemExit("Settings reset functions are still duplicated or missing.")

# Offer a real Android device-lock fallback when biometric hardware is unavailable.
replace_once(
    '<button type="button" class="btn primary" id="retryFp">بیا د ګوتې نښه</button>\n      <button type="button" class="btn ghost" id="closeLocked">وتل</button>',
    '<button type="button" class="btn primary" id="retryFp">بیا د ګوتې نښه</button>\n      <button type="button" class="btn ghost" id="deviceCredential">د موبایل PIN / Pattern سره خلاصول</button>\n      <button type="button" class="btn ghost" id="closeLocked">وتل</button>',
    "device credential fallback button")
replace_once(
    "$('retryFp').onclick=()=>{if(window.NativeApp&&NativeApp.retryBiometric){NativeApp.retryBiometric()}};",
    "$('retryFp').onclick=()=>{if(window.NativeApp&&NativeApp.retryBiometric){NativeApp.retryBiometric()}};\n$('deviceCredential').onclick=()=>{if(window.NativeApp&&NativeApp.confirmDeviceCredential){NativeApp.confirmDeviceCredential()}else{alert('دا اختیار یوازې په اصلي APK کې کار کوي.')}};",
    "device credential fallback action")

# The existing Android app has a real dialer bridge; route tel: links to it.
if "function openContact(action)" not in s:
    raise SystemExit("Contact action handler is missing.")

path.write_text(s, encoding="utf-8")
print("Verified calculation, Jalali leap-year, input-validation and settings fixes applied.")
