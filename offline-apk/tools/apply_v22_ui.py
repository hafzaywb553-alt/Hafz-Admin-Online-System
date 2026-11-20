from pathlib import Path
import re

html_path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
runtime_path = Path(__file__).with_name("date_lunar_help.js")
html = html_path.read_text(encoding="utf-8")
runtime = runtime_path.read_text(encoding="utf-8").strip()

if 'id="leaveCalculator"' not in html:
    raise SystemExit("The tested leave calculator is missing; refusing to patch an unexpected page.")

# Remove the full visible conversion-example card: heading, three-date line and explanation.
example_pattern = re.compile(
    r'<div class="calendar-example"><b data-t="dateExampleTitle">.*?'
    r'<div class="small" data-t="dateExampleText">.*?</div></div>',
    re.DOTALL
)
html, removed_examples = example_pattern.subn("", html, count=1)
if removed_examples != 1:
    raise SystemExit("The original date-example card was not found exactly once; refusing to alter other content.")

# The example strings are no longer used by any visible UI; remove their translation entries too.
for key in ("dateExampleTitle", "dateExampleText"):
    html, removed_keys = re.subn(r",\s*" + key + r":'[^']*'", "", html)
    if removed_keys != 5:
        raise SystemExit(f"Expected five translations for {key}, found {removed_keys}; refusing to continue.")

# Retain the user's lunar-calendar caution as a normal click-to-open help, without the unwanted example.
old_notice = '<div class="notice" data-t="dateNote">قمري نتیجه د ام القری تقویم له مخې ده؛ د ځايي سپوږمۍ لیدلو له مخې یوه ورځ توپیر ممکن دی.</div>'
new_help = """<div class="date-help-wrap" id="dateConversionHelpWrap">
      <button type="button" class="date-help-trigger" id="dateConversionHelpToggle"
        aria-expanded="false" aria-controls="dateConversionHelpPanel"
        aria-label="د قمري تقویم یادونه" title="د قمري تقویم یادونه">?</button>
      <div class="date-help-panel" id="dateConversionHelpPanel" role="dialog"
        aria-modal="false" aria-label="د قمري تقویم یادونه" hidden>
        <h4 id="dateConversionHelpTitle">د قمري تقویم یادونه</h4>
        <p id="dateConversionHelpLunarNote">قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي.</p>
      </div>
    </div>"""
if html.count(old_notice) != 1:
    raise SystemExit("The expected date-note insertion point was not found exactly once.")
html = html.replace(old_notice, new_help, 1)

# Keep the help popup scoped to its own elements; it remains closed until clicked.
css_anchor = ".nav-btn>span{font-size:.73rem;font-weight:900;line-height:1.25;text-align:center}"
css_insert = r"""
/* Date-conversion lunar note: retain only the short help, not the removed example. */
.date-help-wrap{display:block;margin:9px 0 12px}
.date-help-trigger{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border:1px solid var(--border);border-radius:50%;background:rgba(56,145,220,.13);color:var(--num);font:900 1.05rem/1 inherit;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.16)}
.date-help-trigger:focus-visible{outline:2px solid var(--num);outline-offset:3px}
.date-help-panel{width:100%;max-width:680px;margin-top:9px;padding:13px 15px;border:1px solid var(--border);border-inline-start:3px solid var(--num);border-radius:12px;background:rgba(4,15,31,.96);color:inherit;box-shadow:0 9px 28px rgba(0,0,0,.24);line-height:1.85}
.date-help-panel[hidden]{display:none!important}
.date-help-panel h4{margin:0 0 8px;color:var(--num);font-size:1rem;font-weight:900}
.date-help-panel p{margin:7px 0 0;font-size:.88rem;line-height:1.9;overflow-wrap:anywhere}

/* Clear, section-specific active state for the four existing bottom navigation buttons. */
.bottom .nav-btn{position:relative;transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}
.bottom .nav-btn:nth-child(1){--nav-tone:#55a8ff}
.bottom .nav-btn:nth-child(2){--nav-tone:#67d6cf}
.bottom .nav-btn:nth-child(3){--nav-tone:#2dd884}
.bottom .nav-btn:nth-child(4){--nav-tone:#ffd466}
.bottom .nav-btn.active{color:#fff;border-color:var(--nav-tone);background:rgba(255,255,255,.075);box-shadow:inset 0 3px 0 var(--nav-tone),0 0 0 1px var(--nav-tone),0 3px 14px rgba(0,0,0,.22)}
.bottom .nav-btn.active::after{content:"";position:absolute;top:3px;left:50%;width:24px;height:3px;transform:translateX(-50%);border-radius:99px;background:var(--nav-tone);box-shadow:0 0 8px var(--nav-tone)}
.bottom .nav-btn.active>.nav-icon{opacity:1;transform:translateY(-2px) scale(1.12);filter:drop-shadow(0 0 6px var(--nav-tone))}
.bottom .nav-btn.active>span{color:#fff!important;text-shadow:0 0 8px rgba(255,255,255,.18)}
.bottom .nav-btn:not(.active)>.nav-icon{opacity:.76}
.bottom .nav-btn:focus-visible{outline:2px solid var(--nav-tone);outline-offset:2px}
"""
if html.count(css_anchor) != 1:
    raise SystemExit("The existing four-tab navigation style anchor was not found exactly once.")
html = html.replace(css_anchor, css_anchor + "\n" + css_insert, 1)

closing = html.rfind("</script>")
if closing < 0:
    raise SystemExit("The main application script closing tag was not found.")
if "initializeDateLunarHelp" in html:
    raise SystemExit("Lunar help runtime is already installed; refusing a duplicate.")
html = html[:closing] + "\n" + runtime + "\n" + html[closing:]

html_path.write_text(html, encoding="utf-8")
print("Removed the full date example; retained only the click-only lunar note; highlighted the four existing bottom tabs.")