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
