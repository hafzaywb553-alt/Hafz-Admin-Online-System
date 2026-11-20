from pathlib import Path

root = Path(__file__).resolve().parents[1]
html_path = root / "app" / "src" / "main" / "assets" / "index.html"
runtime_path = Path(__file__).with_name("date_conversion_help.js")
html = html_path.read_text(encoding="utf-8")
runtime = runtime_path.read_text(encoding="utf-8").strip()

if 'id="dateConversionHelpWrap"' in html or "initializeDateConversionHelp" in html:
    raise SystemExit("Date-conversion help is already installed; refusing to apply it twice.")

old_notice = '<div class="notice" data-t="dateNote">قمري نتیجه د ام القری تقویم له مخې ده؛ د ځايي سپوږمۍ لیدلو له مخې یوه ورځ توپیر ممکن دی.</div>'
new_help = """<div class="date-help-wrap" id="dateConversionHelpWrap">
      <button type="button" class="date-help-trigger" id="dateConversionHelpToggle"
        aria-expanded="false" aria-controls="dateConversionHelpPanel"
        aria-label="د نېټې د تبدیل مرسته" title="د نېټې د تبدیل مرسته">?</button>
      <div class="date-help-panel" id="dateConversionHelpPanel" role="dialog"
        aria-modal="false" aria-label="د نېټې د تبدیل بېلګه" hidden>
        <h4 id="dateConversionHelpTitle">د نېټې د تبدیل بېلګه</h4>
        <p class="date-help-example" id="dateConversionHelpExample" dir="ltr">1405/06/08 = 2026/08/30 = 1448/03/17</p>
        <p id="dateConversionHelpDescription">دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.</p>
        <p id="dateConversionHelpLunarNote">قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي.</p>
      </div>
    </div>"""
if html.count(old_notice) != 1:
    raise SystemExit("The expected original date-conversion notice was not found exactly once; refusing to alter the page.")

css_anchor = "\n.contact-card{position:relative}"
css_insert = r"""
/* Date conversion help: isolated styles; no calculator or conversion styles are changed. */
.date-help-wrap{display:block;position:relative;margin:9px 0 12px}
.date-help-trigger{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;padding:0;border:1px solid var(--border);border-radius:50%;background:rgba(56,145,220,.13);color:var(--num);font:900 1.05rem/1 inherit;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.16)}
.date-help-trigger:focus-visible{outline:2px solid var(--num);outline-offset:3px}
.date-help-panel{width:100%;max-width:680px;margin-top:9px;padding:13px 15px;border:1px solid var(--border);border-inline-start:3px solid var(--num);border-radius:12px;background:rgba(4,15,31,.96);color:inherit;box-shadow:0 9px 28px rgba(0,0,0,.24);line-height:1.85}
.date-help-panel[hidden]{display:none!important}
.date-help-panel h4{margin:0 0 8px;color:var(--num);font-size:1rem;font-weight:900}
.date-help-panel p{margin:7px 0 0;font-size:.88rem;line-height:1.9;overflow-wrap:anywhere}
.date-help-panel .date-help-example{margin:8px 0;padding:8px 6px;border:1px dashed var(--border);border-radius:8px;text-align:center;direction:ltr;unicode-bidi:embed;font-weight:900;font-size:1rem;letter-spacing:.15px}
"""
if html.count(css_anchor) != 1:
    raise SystemExit("The expected app CSS insertion anchor was not found exactly once; refusing to change styles.")
html = html.replace(old_notice, new_help, 1)
html = html.replace(css_anchor, "\n" + css_insert + css_anchor, 1)

closing = html.rfind("</script>")
if closing < 0:
    raise SystemExit("The main application script closing tag was not found.")
html = html[:closing] + "\n" + runtime + "\n" + html[closing:]

html_path.write_text(html, encoding="utf-8")
print("Added the click-only date-conversion help. No date-conversion calculations were changed.")