from pathlib import Path

html_path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
s = html_path.read_text(encoding="utf-8")
if 'id="leaveCalculator"' in s or "function updateLeaveCalculator()" in s:
    raise SystemExit("Leave calculator is already present; refusing to apply it twice.")

css_anchor = "\n.contact-card{position:relative}"
css_insert = r"""
/* Leave-duration calculator: all styles are scoped to this new block. */
.leave-box{margin-top:15px}
.leave-box h3{margin:0 0 5px;color:var(--num)}
.leave-fields{grid-template-columns:repeat(3,minmax(0,1fr))}
.leave-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px}
.leave-stat,.leave-end-result{min-width:0;border:1px solid var(--border);border-radius:12px;background:rgba(0,0,0,.10);padding:11px}
.leave-stat span,.leave-end-result>span{display:block;color:var(--muted);font-size:.86rem}
.leave-stat b{display:block;color:var(--num);font-size:1.15rem;margin-top:5px}
.leave-end-result{margin-top:9px;border-top:3px solid var(--ok)}
.leave-end-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}
.leave-end-date{display:flex;flex-direction:column;gap:4px;min-width:0}
.leave-end-date small,.leave-date-cell small{color:var(--muted);font-size:.76rem}
.leave-end-date b{color:var(--num);direction:ltr;unicode-bidi:embed;white-space:nowrap;font-size:.94rem}
.leave-inclusive-note{margin-top:9px;color:var(--muted);font-size:.82rem;line-height:1.7}
.leave-schedule-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:15px}
.leave-schedule-head h4{margin:0}
.leave-friday-legend{color:#ff8792;font-size:.8rem;font-weight:900}
.leave-schedule{display:grid;gap:6px;margin-top:9px}
.leave-day-row{display:grid;grid-template-columns:52px repeat(3,minmax(0,1fr));gap:7px;align-items:center;border:1px solid var(--border);border-radius:10px;padding:8px;background:rgba(0,0,0,.08)}
.leave-day-row.friday{background:rgba(214,90,104,.13);border-color:rgba(255,104,120,.62)}
.leave-day-side{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.leave-day-side b{color:var(--num);font-size:.92rem}
.leave-day-side span{color:var(--muted);font-size:.73rem;font-weight:800;white-space:nowrap}
.leave-day-row.friday .leave-day-side span{color:#ff8792}
.leave-date-cell{display:flex;flex-direction:column;gap:3px;min-width:0;overflow:hidden}
.leave-date-cell b{direction:ltr;unicode-bidi:embed;white-space:nowrap;font-size:.82rem;font-weight:900}
.leave-day-row.friday .leave-date-cell b{color:#ff9aa3}
@media(max-width:520px){
 .leave-fields{grid-template-columns:1fr}
 .leave-end-grid{grid-template-columns:1fr}
 .leave-day-row{grid-template-columns:43px repeat(3,minmax(0,1fr));gap:4px;padding:7px 5px}
 .leave-day-side span{font-size:.66rem}
 .leave-date-cell small{font-size:.64rem}
 .leave-date-cell b{font-size:.68rem;letter-spacing:-.2px}
}
"""
if css_anchor not in s:
    raise SystemExit("V18 CSS insertion anchor was not found.")
s = s.replace(css_anchor, "\n" + css_insert + css_anchor, 1)

html_anchor = """    <div class="notice" data-t="dateNote">قمري نتیجه د ام القری تقویم له مخې ده؛ د ځايي سپوږمۍ لیدلو له مخې یوه ورځ توپیر ممکن دی.</div>
  </div>
</section>"""
html_insert = """    <div class="notice" data-t="dateNote">قمري نتیجه د ام القری تقویم له مخې ده؛ د ځايي سپوږمۍ لیدلو له مخې یوه ورځ توپیر ممکن دی.</div>

    <div class="calendar-example leave-box" id="leaveCalculator">
      <h3 data-leave-t="leaveTitle">د رخصتۍ د مودې محاسبه</h3>
      <div class="small" data-leave-t="leaveIntro">د پیل تقویم وټاکئ، د رخصتۍ د پیل نېټه او د ورځو شمېر ولیکئ. پایله په اتومات ډول ښکاري.</div>
      <div class="calendar-fields leave-fields">
        <label><span data-leave-t="leaveCalendarLabel">د پیل د نېټې تقویم</span>
          <select id="leaveCalendarSource">
            <option value="solar" data-leave-t="sourceSolar">هجري شمسي (لمریز)</option>
            <option value="lunar" data-leave-t="sourceLunar">هجري قمري (ام القری)</option>
            <option value="gregorian" data-leave-t="sourceGregorian">میلادي (عیسوي)</option>
          </select>
        </label>
        <label><span data-leave-t="leaveStartLabel">د رخصتۍ د پیل نېټه (کال/میاشت/ورځ)</span>
          <input id="leaveStartDate" type="text" value="" inputmode="numeric" dir="ltr" autocomplete="off" placeholder="1405/03/09">
        </label>
        <label><span data-leave-t="leaveDaysLabel">د رخصتۍ ورځې</span>
          <input id="leaveDays" type="number" min="1" max="3660" step="1" inputmode="numeric" placeholder="17">
        </label>
      </div>
      <div id="leaveError" class="notice warn hidden" role="status" aria-live="polite"></div>
      <div id="leaveResults" class="hidden" aria-live="polite">
        <div class="leave-stats">
          <div class="leave-stat"><span data-leave-t="leaveTotalLabel">د رخصتۍ ټولې ورځې</span><b id="leaveTotalDays">—</b></div>
          <div class="leave-stat"><span data-leave-t="leaveFridayCountLabel">د جمعو شمېر</span><b id="leaveFridayCount">—</b></div>
        </div>
        <div class="leave-end-result">
          <span data-leave-t="leaveEndLabel">د رخصتۍ وروستۍ ورځ</span>
          <div class="leave-end-grid">
            <div class="leave-end-date"><small data-leave-t="sourceSolar">هجري شمسي (لمریز)</small><b id="leaveEndSolar">—</b></div>
            <div class="leave-end-date"><small data-leave-t="sourceLunar">هجري قمري (ام القری)</small><b id="leaveEndLunar">—</b></div>
            <div class="leave-end-date"><small data-leave-t="sourceGregorian">میلادي (عیسوي)</small><b id="leaveEndGregorian">—</b></div>
          </div>
        </div>
        <div class="leave-inclusive-note" data-leave-t="leaveInclusiveNote">د پیل ورځ د رخصتۍ د ورځو په شمېر کې شامله ده.</div>
        <div class="leave-schedule-head">
          <h4 data-leave-t="leaveScheduleTitle">د رخصتۍ د هرې ورځې جدول</h4>
          <span class="leave-friday-legend" data-leave-t="leaveFridayLegend">جمعه — په ځانګړي رنګ</span>
        </div>
        <div id="leaveSchedule" class="leave-schedule"></div>
      </div>
    </div>
  </div>
</section>"""
if html_anchor not in s:
    raise SystemExit("V18 date-conversion section insertion anchor was not found.")
s = s.replace(html_anchor, html_insert, 1)

js_anchor = "function runCalendarConversion(){"
leave_js = r"""const LEAVE_TEXT={
 ps:{leaveTitle:'د رخصتۍ د مودې محاسبه',leaveIntro:'د پیل تقویم وټاکئ، د رخصتۍ د پیل نېټه او د ورځو شمېر ولیکئ. پایله په اتومات ډول ښکاري.',leaveCalendarLabel:'د پیل د نېټې تقویم',leaveStartLabel:'د رخصتۍ د پیل نېټه (کال/میاشت/ورځ)',leaveDaysLabel:'د رخصتۍ ورځې',leaveTotalLabel:'د رخصتۍ ټولې ورځې',leaveFridayCountLabel:'د جمعو شمېر',leaveEndLabel:'د رخصتۍ وروستۍ ورځ',leaveInclusiveNote:'د پیل ورځ د رخصتۍ د ورځو په شمېر کې شامله ده.',leaveScheduleTitle:'د رخصتۍ د هرې ورځې جدول',leaveFridayLegend:'جمعه — په ځانګړي رنګ',leaveDatePlaceholder:'لکه: 1405/03/09',leaveDaysPlaceholder:'لکه: 17',leaveErrorDate:'د پیل نېټه سمه نه ده. نېټه د کال/میاشت/ورځ په بڼه ولیکئ.',leaveErrorDays:'د رخصتۍ ورځې باید له ۱ څخه تر ۳۶۶۰ پورې بشپړ عدد وي.',leaveErrorCalendar:'دا نېټه په ټاکل شوي تقویم کې تبدیل نه شوه. د تقویم او نېټې معلومات وګورئ.',weekdays:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],solarShort:'لمریز',lunarShort:'قمري',gregorianShort:'میلادي'},
 fa:{leaveTitle:'محاسبه مدت رخصتی',leaveIntro:'تقویم تاریخ آغاز، تاریخ شروع رخصتی و تعداد روزها را وارد کنید. نتیجه به‌صورت خودکار نمایش داده می‌شود.',leaveCalendarLabel:'تقویم تاریخ آغاز',leaveStartLabel:'تاریخ شروع رخصتی (سال/ماه/روز)',leaveDaysLabel:'روزهای رخصتی',leaveTotalLabel:'مجموع روزهای رخصتی',leaveFridayCountLabel:'تعداد روزهای جمعه',leaveEndLabel:'آخرین روز رخصتی',leaveInclusiveNote:'روز آغاز نیز در شمار روزهای رخصتی حساب می‌شود.',leaveScheduleTitle:'جدول تمام روزهای رخصتی',leaveFridayLegend:'جمعه — با رنگ ویژه',leaveDatePlaceholder:'مثال: 1405/03/09',leaveDaysPlaceholder:'مثال: 17',leaveErrorDate:'تاریخ آغاز درست نیست. آن را به شکل سال/ماه/روز وارد کنید.',leaveErrorDays:'روزهای رخصتی باید عدد کامل از ۱ تا ۳۶۶۰ باشد.',leaveErrorCalendar:'این تاریخ در تقویم انتخاب‌شده تبدیل نشد. تقویم و تاریخ را بررسی کنید.',weekdays:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],solarShort:'شمسی',lunarShort:'قمری',gregorianShort:'میلادی'},
 ar:{leaveTitle:'حساب مدة الإجازة',leaveIntro:'اختر تقويم تاريخ البداية وأدخل تاريخ بدء الإجازة وعدد الأيام. تظهر النتيجة تلقائياً.',leaveCalendarLabel:'تقويم تاريخ البداية',leaveStartLabel:'تاريخ بدء الإجازة (السنة/الشهر/اليوم)',leaveDaysLabel:'أيام الإجازة',leaveTotalLabel:'إجمالي أيام الإجازة',leaveFridayCountLabel:'عدد أيام الجمعة',leaveEndLabel:'آخر يوم من الإجازة',leaveInclusiveNote:'يُحتسب يوم البداية ضمن أيام الإجازة.',leaveScheduleTitle:'جدول كل يوم من الإجازة',leaveFridayLegend:'الجمعة — بلون مميز',leaveDatePlaceholder:'مثال: 1405/03/09',leaveDaysPlaceholder:'مثال: 17',leaveErrorDate:'تاريخ البداية غير صحيح. أدخله بصيغة السنة/الشهر/اليوم.',leaveErrorDays:'يجب أن يكون عدد أيام الإجازة عدداً صحيحاً من ١ إلى ٣٦٦٠.',leaveErrorCalendar:'تعذر تحويل التاريخ في التقويم المحدد. تحقق من التقويم والتاريخ.',weekdays:['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],solarShort:'شمسي',lunarShort:'قمري',gregorianShort:'ميلادي'},
 ur:{leaveTitle:'رخصت کی مدت کا حساب',leaveIntro:'آغاز کی تاریخ کا کیلنڈر منتخب کریں، رخصت شروع ہونے کی تاریخ اور دنوں کی تعداد درج کریں۔ نتیجہ خودکار دکھائی دے گا۔',leaveCalendarLabel:'آغاز کی تاریخ کا کیلنڈر',leaveStartLabel:'رخصت شروع ہونے کی تاریخ (سال/مہینہ/دن)',leaveDaysLabel:'رخصت کے دن',leaveTotalLabel:'رخصت کے کل دن',leaveFridayCountLabel:'جمعہ کے دنوں کی تعداد',leaveEndLabel:'رخصت کا آخری دن',leaveInclusiveNote:'آغاز کا دن بھی رخصت کے دنوں میں شمار ہوگا۔',leaveScheduleTitle:'رخصت کے ہر دن کا جدول',leaveFridayLegend:'جمعہ — خاص رنگ میں',leaveDatePlaceholder:'مثلاً: 1405/03/09',leaveDaysPlaceholder:'مثلاً: 17',leaveErrorDate:'آغاز کی تاریخ درست نہیں۔ سال/مہینہ/دن کی ترتیب استعمال کریں۔',leaveErrorDays:'رخصت کے دن ۱ سے ۳۶۶۰ تک مکمل عدد ہونے چاہییں۔',leaveErrorCalendar:'منتخب کیلنڈر میں یہ تاریخ تبدیل نہیں ہوسکی۔ کیلنڈر اور تاریخ دوبارہ دیکھیں۔',weekdays:['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'],solarShort:'شمسی',lunarShort:'قمری',gregorianShort:'عیسوی'},
 en:{leaveTitle:'Leave Duration Calculator',leaveIntro:'Choose the calendar for the start date, enter the leave start date and number of days. The result updates automatically.',leaveCalendarLabel:'Start-date calendar',leaveStartLabel:'Leave start date (year/month/day)',leaveDaysLabel:'Leave days',leaveTotalLabel:'Total leave days',leaveFridayCountLabel:'Number of Fridays',leaveEndLabel:'Last day of leave',leaveInclusiveNote:'The start date is included in the leave-day count.',leaveScheduleTitle:'Daily leave schedule',leaveFridayLegend:'Friday — highlighted',leaveDatePlaceholder:'Example: 1405/03/09',leaveDaysPlaceholder:'Example: 17',leaveErrorDate:'The start date is invalid. Enter it as year/month/day.',leaveErrorDays:'Leave days must be a whole number from 1 to 3660.',leaveErrorCalendar:'The date could not be converted in the selected calendar. Check the calendar and date.',weekdays:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],solarShort:'Solar',lunarShort:'Lunar',gregorianShort:'Gregorian'}
};
function applyLeaveLang(){
 const L=TXT[settings.lang]||TXT.ps,T=LEAVE_TEXT[settings.lang]||LEAVE_TEXT.ps;
 document.querySelectorAll('[data-leave-t]').forEach(el=>{const k=el.getAttribute('data-leave-t');const value=T[k]||L[k];if(value)el.textContent=value});
 $('leaveStartDate').placeholder=T.leaveDatePlaceholder;
 $('leaveDays').placeholder=T.leaveDaysPlaceholder;
}
function leaveDisplayDate(value){return settings.lang==='en'?value:fa(value)}
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
  const dayRows=[];let fridayCount=0;
  for(let i=0;i<duration;i++){
   const date=new Date(startDate.getTime()+i*MS_PER_DAY);
   const weekday=date.getUTCDay();
   if(weekday===5)fridayCount++;
   dayRows.push({date,weekday,solar:calendarDateText(date,'solar'),lunar:calendarDateText(date,'lunar'),gregorian:calendarDateText(date,'gregorian')});
  }
  const last=dayRows[dayRows.length-1];
  $('leaveTotalDays').textContent=leaveDisplayDate(String(duration));
  $('leaveFridayCount').textContent=leaveDisplayDate(String(fridayCount));
  $('leaveEndSolar').textContent=leaveDisplayDate(last.solar);
  $('leaveEndLunar').textContent=leaveDisplayDate(last.lunar);
  $('leaveEndGregorian').textContent=last.gregorian;
  const weekdayNames=L.weekdays;
  schedule.innerHTML=dayRows.map((row,i)=>{
   const friday=row.weekday===5;
   const dayNo=settings.lang==='en'?String(i+1):fa(i+1);
   return '<div class="leave-day-row'+(friday?' friday':'')+'">'+
    '<div class="leave-day-side"><b>'+esc(dayNo)+'</b><span>'+esc(weekdayNames[row.weekday])+'</span></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.solarShort)+'</small><b>'+esc(leaveDisplayDate(row.solar))+'</b></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.lunarShort)+'</small><b>'+esc(leaveDisplayDate(row.lunar))+'</b></div>'+
    '<div class="leave-date-cell"><small>'+esc(L.gregorianShort)+'</small><b>'+esc(row.gregorian)+'</b></div></div>';
  }).join('');
  results.classList.remove('hidden');
 }catch(e){error.textContent=L.leaveErrorCalendar;error.classList.remove('hidden')}
}

"""
if js_anchor not in s:
    raise SystemExit("V18 calendar JavaScript insertion anchor was not found.")
s = s.replace(js_anchor, leave_js + js_anchor, 1)
