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
