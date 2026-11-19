from pathlib import Path
import re

html_path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
html = html_path.read_text(encoding="utf-8")

if 'id="leaveCalculator"' not in html:
    raise SystemExit("The existing leave calculator was not found; refusing to patch another section.")

# Change only the leave-calculator wording, preserving the rest of the interface.
translations = {
    "ps": {
        "leaveIntro": "د رخصتۍ ټاکل شوې ورځې وليکئ؛ جمعې له شمېر څخه وځي او پای نېټه په همدې اساس محاسبه کېږي.",
        "leaveTotalLabel": "د رخصتۍ ټاکل شوې ورځې",
        "leaveFridayCountLabel": "د جمعو منفي شوې ورځې",
        "leaveInclusiveNote": "د پیل ورځ حسابېږي، خو که جمعه وي له شمېر څخه منفي کېږي.",
        "leaveFridayLegend": "جمعه — له رخصتۍ څخه منفي ده",
        "leaveCountedDay": "شمېرل شوې ورځ",
        "leaveSkippedFriday": "نه شمېرل کېږي",
    },
    "fa": {
        "leaveIntro": "تعداد روزهای موردنیاز رخصتی را وارد کنید؛ روزهای جمعه از شمار خارج می‌شوند و تاریخ پایان بر همین اساس محاسبه می‌گردد.",
        "leaveTotalLabel": "روزهای حساب‌شده رخصتی",
        "leaveFridayCountLabel": "جمعه‌های کسرشده",
        "leaveInclusiveNote": "روز آغاز حساب می‌شود، اما اگر جمعه باشد از شمار رخصتی کسر می‌گردد.",
        "leaveFridayLegend": "جمعه — از رخصتی کسر می‌شود",
        "leaveCountedDay": "روز حساب‌شده",
        "leaveSkippedFriday": "حساب نمی‌شود",
    },
    "ar": {
        "leaveIntro": "أدخل عدد أيام الإجازة المطلوبة؛ لا تُحتسب أيام الجمعة ويُحدد تاريخ الانتهاء وفقاً لذلك.",
        "leaveTotalLabel": "أيام الإجازة المحتسبة",
        "leaveFridayCountLabel": "أيام الجمعة المستبعدة",
        "leaveInclusiveNote": "يُحتسب يوم البداية، إلا إذا وافق يوم الجمعة فيُستثنى.",
        "leaveFridayLegend": "الجمعة — مستثناة من الإجازة",
        "leaveCountedDay": "يوم محسوب",
        "leaveSkippedFriday": "غير محتسب",
    },
    "ur": {
        "leaveIntro": "درکار رخصت کے دن درج کریں؛ جمعہ شمار نہیں ہوگا اور اختتامی تاریخ اسی حساب سے خودکار نکلے گی۔",
        "leaveTotalLabel": "شمار کیے گئے رخصت کے دن",
        "leaveFridayCountLabel": "منفی کیے گئے جمعے",
        "leaveInclusiveNote": "آغاز کا دن شمار ہوگا، لیکن اگر جمعہ ہو تو اسے شمار سے خارج کیا جائے گا۔",
        "leaveFridayLegend": "جمعہ — رخصت میں شمار نہیں ہوگا",
        "leaveCountedDay": "شمار شدہ دن",
        "leaveSkippedFriday": "شمار نہیں",
    },
    "en": {
        "leaveIntro": "Enter the required leave days. Fridays are excluded from the count, and the end date is extended automatically.",
        "leaveTotalLabel": "Required leave days counted",
        "leaveFridayCountLabel": "Fridays excluded",
        "leaveInclusiveNote": "The start date counts unless it falls on a Friday; Fridays are excluded.",
        "leaveFridayLegend": "Friday — excluded from leave",
        "leaveCountedDay": "Counted leave day",
        "leaveSkippedFriday": "Not counted",
    },
}

for language, values in translations.items():
    marker = f" {language}:{{"
    start = html.find(marker)
    if start < 0:
        raise SystemExit(f"Language block {language!r} was not found.")
    end = html.find("\n", start)
    if end < 0:
        raise SystemExit(f"Language block {language!r} is not a single line.")
    line = html[start:end]
    for key, value in values.items():
        pattern = re.compile(rf"({re.escape(key)}:')[^']*(')")
        line, count = pattern.subn(lambda m: m.group(1) + value + m.group(2), line, count=1)
        if count != 1:
            raise SystemExit(f"Could not update {key!r} in {language!r}.")
    # Add two translated status labels to the existing language object.
    friday_pattern = re.compile(r"(leaveFridayLegend:'[^']*',)")
    line, count = friday_pattern.subn(
        lambda m: m.group(1)
        + "leaveCountedDay:'" + values["leaveCountedDay"] + "',"
        + "leaveSkippedFriday:'" + values["leaveSkippedFriday"] + "',",
        line,
        count=1,
    )
    if count != 1:
        raise SystemExit(f"Could not add status labels for {language!r}.")
    html = html[:start] + line + html[end:]

# Add visual status text without changing the existing color treatment of Friday rows.
css_anchor = ".leave-day-side span{color:var(--muted);font-size:.73rem;font-weight:800;white-space:nowrap}"
css_addition = css_anchor + "\n.leave-day-side small{display:block;font-size:.63rem;line-height:1.35;color:var(--ok);font-weight:800;text-align:center;white-space:nowrap}\n.leave-day-row.friday .leave-day-side small{color:#ff8792}"
if css_anchor not in html:
    raise SystemExit("Leave-table CSS anchor was not found.")
html = html.replace(css_anchor, css_addition, 1)

old_note = '<div class="leave-inclusive-note" data-leave-t="leaveInclusiveNote">د پیل ورځ د رخصتۍ د ورځو په شمېر کې شامله ده.</div>'
new_note = '<div class="leave-inclusive-note" data-leave-t="leaveInclusiveNote">د پیل ورځ حسابېږي، خو که جمعه وي له شمېر څخه منفي کېږي.</div>'
if old_note not in html:
    raise SystemExit("The leave-count explanation was not found.")
html = html.replace(old_note, new_note, 1)

# Replace only the leave-calculator function. The existing calendar-conversion functions stay intact.
function_start = html.find("function updateLeaveCalculator(){")
function_end = html.find("function runCalendarConversion(){", function_start)
if function_start < 0 or function_end < 0:
    raise SystemExit("The leave-calculator function boundary was not found.")

replacement = r"""function buildLeaveSchedule(startDate,requestedDays){
 const dayRows=[];
 let fridayCount=0,countedDays=0;
 // Count every non-Friday date as one leave day. Friday alone is excluded.
 for(let offset=0;countedDays<requestedDays&&offset<5000;offset++){
  const date=new Date(startDate.getTime()+offset*MS_PER_DAY);
  const weekday=date.getUTCDay();
  const excludedFriday=weekday===5;
  let leaveDayNumber=null;
  if(excludedFriday)fridayCount++;
  else{countedDays++;leaveDayNumber=countedDays}
  dayRows.push({
   date,weekday,excludedFriday,leaveDayNumber,
   solar:calendarDateText(date,'solar'),
   lunar:calendarDateText(date,'lunar'),
   gregorian:calendarDateText(date,'gregorian')
  });
 }
 if(countedDays!==requestedDays||!dayRows.length)throw new Error('Could not finish the requested leave-day count.');
 const lastDay=dayRows[dayRows.length-1];
 if(lastDay.excludedFriday)throw new Error('The final leave day cannot be an excluded Friday.');
 return {dayRows,fridayCount,countedDays,calendarDays:dayRows.length,lastDay};
}
function updateLeaveCalculator(){
 const L=LEAVE_TEXT[settings.lang]||LEAVE_TEXT.ps;
 const source=$('leaveCalendarSource').value;
 const startValue=$('leaveStartDate').value.trim();
 const daysValue=$('leaveDays').value.trim();
 const error=$('leaveError'),results=$('leaveResults'),schedule=$('leaveSchedule');
 error.classList.add('hidden');results.classList.add('hidden');schedule.innerHTML='';
 if(!startValue&&!daysValue)return;
 if(!startValue||!daysValue)return;
 const duration=Number(daysValue);
 if(!Number.isInteger(duration)||duration<1||duration>3660){error.textContent=L.leaveErrorDays;error.classList.remove('hidden');return}
 try{
  const startDate=gregorianFromCalendar(startValue.replace(/[\/\s]+$/,''),source);
  if(!startDate){error.textContent=L.leaveErrorDate;error.classList.remove('hidden');return}
  const calculation=buildLeaveSchedule(startDate,duration);
  const last=calculation.lastDay;
  $('leaveTotalDays').textContent=leaveDisplayDate(String(calculation.countedDays));
  $('leaveFridayCount').textContent=leaveDisplayDate(String(calculation.fridayCount));
  $('leaveEndSolar').textContent=leaveDisplayDate(last.solar);
  $('leaveEndLunar').textContent=leaveDisplayDate(last.lunar);
  $('leaveEndGregorian').textContent=last.gregorian;
  const weekdayNames=L.weekdays;
  schedule.innerHTML=calculation.dayRows.map((row,i)=>{
   const friday=row.excludedFriday;
   const dayNo=settings.lang==='en'?String(i+1):fa(i+1);
   const status=friday?L.leaveSkippedFriday:(L.leaveCountedDay+' '+leaveDisplayDate(String(row.leaveDayNumber)));
   return '<div class="leave-day-row'+(friday?' friday':'')+'">'+
    '<div class="leave-day-side"><b>'+esc(dayNo)+'</b><span>'+esc(weekdayNames[row.weekday])+'</span><small>'+esc(status)+'</small></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.solarShort)+'</small><b>'+esc(leaveDisplayDate(row.solar))+'</b></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.lunarShort)+'</small><b>'+esc(leaveDisplayDate(row.lunar))+'</b></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.gregorianShort)+'</small><b>'+esc(row.gregorian)+'</b></div></div>';
  }).join('');
  results.classList.remove('hidden');
 }catch(e){error.textContent=L.leaveErrorCalendar;error.classList.remove('hidden')}
}

"""
html = html[:function_start] + replacement + html[function_end:]

html_path.write_text(html, encoding="utf-8")
print("Friday-exclusion rule applied only to the existing leave calculator.")
