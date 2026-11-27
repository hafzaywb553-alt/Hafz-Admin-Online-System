from pathlib import Path
import re

html_path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
html = html_path.read_text(encoding="utf-8")

# Keep the four original top-level sections. The existing second tab is dateSection.
if 'id="dateSection"' not in html:
    raise SystemExit("The original date-conversion navigation section (dateSection) is missing.")
for required_date_control in ('id="calendarInput"', 'id="calendarConvert"'):
    if html.count(required_date_control) != 1:
        raise SystemExit("The existing date-conversion screen is incomplete: " + required_date_control)

# Remove the old one-line lunar note. It is explanatory help text, not part
# of the calendar conversion calculations.
note_pattern = re.compile(r'\s*<div class="notice" data-t="dateNote">[\s\S]*?</div>')
html, note_count = note_pattern.subn("", html, count=1)
if note_count != 1:
    raise SystemExit("Expected the old date-conversion note exactly once; refusing to leave mixed help text.")

# Remove the exact example block from the original converter screen. The block
# is located from its three exact text strings; its wrapper is removed only if
# it does not contain the date converter's actual input or convert button.
from html.parser import HTMLParser
from itertools import product

example_phrases = (
    "د نېټې د تبدیل بېلګه",
    "1405/06/08 = 2026/08/30 = 1448/03/17",
    "دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.",
)
line_offsets = [0]
line_offsets.extend(match.end() for match in re.finditer("\n", html))

class ExampleBlockScanner(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.stack = []
        self.ranges = {}
        self.matches = {phrase: [] for phrase in example_phrases}

    def current_offset(self):
        line, column = self.getpos()
        return line_offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            return
        start = self.current_offset()
        raw = self.get_starttag_text() or ""
        self.stack.append({"tag": tag, "start": start, "attrs": dict(attrs), "open_end": start + len(raw)})

    def handle_startendtag(self, tag, attrs):
        return

    def handle_endtag(self, tag):
        start = self.current_offset()
        close = self.source.find(">", start)
        end = len(self.source) if close < 0 else close + 1
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                item = self.stack[index]
                self.ranges[item["start"]] = end
                del self.stack[index:]
                break

    def handle_data(self, data):
        if any(item["tag"] in ("script", "style") for item in self.stack):
            return
        for phrase in example_phrases:
            if phrase in data:
                self.matches[phrase].append(list(self.stack))

scanner = ExampleBlockScanner(html)
scanner.feed(html)
scanner.close()
if any(not scanner.matches[phrase] for phrase in example_phrases):
    missing = [phrase for phrase in example_phrases if not scanner.matches[phrase]]
    raise SystemExit("Could not locate every exact date-example text fragment: " + " | ".join(missing))

valid_blocks = {}
for stack_combo in product(*(scanner.matches[phrase] for phrase in example_phrases)):
    common_div_starts = None
    for stack in stack_combo:
        starts = {item["start"] for item in stack if item["tag"] == "div"}
        common_div_starts = starts if common_div_starts is None else common_div_starts & starts
    for block_start in common_div_starts or set():
        block_end = scanner.ranges.get(block_start)
        if block_end is None:
            continue
        block = html[block_start:block_end]
        if not all(phrase in block for phrase in example_phrases):
            continue
        if 'id="calendarInput"' in block or 'id="calendarConvert"' in block:
            continue
        valid_blocks[block_start] = block_end

if not valid_blocks:
    raise SystemExit("The exact date-example text has no safe shared block; no converter content was removed.")
# The same help strings are also stored in the five language dictionaries.
# Remove only the obsolete example/note entries; keep all date-conversion labels.
# Delete obsolete translation properties without touching live converter labels.
removed_dictionary_entries = 0
for obsolete_key in ("dateExampleTitle", "dateExampleText", "dateNote"):
    property_pattern = re.compile(
        r"['\"]?" + re.escape(obsolete_key) + r"['\"]?\s*:\s*(['\"])(.*?)\1\s*,?",
        re.DOTALL,
    )
    html, count = property_pattern.subn("", html)
    removed_dictionary_entries += count
if removed_dictionary_entries < 3:
    raise SystemExit(
        "Could not remove all obsolete date-example translations; removed "
        + str(removed_dictionary_entries) + " of at least 3."
    )


# The smallest common DIV is the example-only wrapper, not the whole converter section.
block_start, block_end = min(valid_blocks.items(), key=lambda item: item[1] - item[0])
html = html[:block_start] + html[block_end:]
# Remove any remaining literal copies of the user's example text from all source locations.
# This is text-only cleanup and does not touch the date conversion functions.
for phrase in example_phrases:
    html = html.replace(phrase, "")
for phrase in example_phrases:
    if phrase in html:
        raise SystemExit("The date-example text remains after removal: " + phrase)


# No V21 example/help panel is added in this build. Fail if one has slipped in.
for forbidden in (
    'id="dateConversionHelpWrap"',
    'id="dateConversionHelpToggle"',
    'id="dateConversionHelpPanel"',
    "initializeDateConversionHelp",
    "1405/06/08 = 2026/08/30 = 1448/03/17",
    "دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.",
):
    if forbidden in html:
        raise SystemExit("Unexpected V21 date-help content found: " + forbidden)

# Preserve the four original bottom-navigation entries and exact order.
nav_start = html.find('<nav class="bottom">')
nav_end = html.find("</nav>", nav_start)
if nav_start < 0 or nav_end < 0:
    raise SystemExit("The bottom navigation container was not found.")
nav_html = html[nav_start:nav_end]
nav_sections = re.findall(r'<a\b(?=[^>]*data-section="([^"]+)")[^>]*>', nav_html)
expected_nav_sections = ["salarySection", "dateSection", "contactSection", "settingsSection"]
if nav_sections != expected_nav_sections:
    raise SystemExit("The original four navigation entries are not in the requested order: " + repr(nav_sections))

# Four-column layout is applied in a scoped override below.

# Give the new icon its own color, then make every active section unmistakable.
icon_anchor = ".salary-icon{color:#55a8ff}.contact-icon{color:#2dd884}.settings-icon{color:#ffd466}"
if html.count(icon_anchor) != 1:
    raise SystemExit("Could not locate the existing navigation icon color rules.")
html = html.replace(
    icon_anchor,
    ".salary-icon{color:#55a8ff}.date-icon{color:#b58cff}.contact-icon{color:#2dd884}.settings-icon{color:#ffd466}",
    1,
)
active_css = r"""
/* Force four equal bottom-nav columns even when the original CSS uses a different spacing style. */
.bottom{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:7px}
/* Four-tab active-state colors: the selected tab changes both label and outline. */
.nav-btn[data-section="salarySection"].active{color:#55a8ff;background:rgba(85,168,255,.14);border-color:rgba(85,168,255,.58);box-shadow:inset 0 -3px 0 #55a8ff}
.nav-btn[data-section="dateSection"].active{color:#b58cff;background:rgba(181,140,255,.15);border-color:rgba(181,140,255,.62);box-shadow:inset 0 -3px 0 #b58cff}.nav-btn[data-section="dateSection"].active .nav-icon{color:#b58cff}
.nav-btn[data-section="contactSection"].active{color:#2dd884;background:rgba(45,216,132,.14);border-color:rgba(45,216,132,.60);box-shadow:inset 0 -3px 0 #2dd884}
.nav-btn[data-section="settingsSection"].active{color:#ffd466;background:rgba(255,212,102,.14);border-color:rgba(255,212,102,.62);box-shadow:inset 0 -3px 0 #ffd466}
.nav-btn.active .nav-icon{transform:scale(1.10)}
.nav-btn .nav-icon{transition:transform .15s ease}
@media(max-width:520px){
 .nav-btn{min-height:57px;gap:3px;padding-inline:2px;font-size:clamp(.66rem,2.45vw,.78rem);white-space:normal;line-height:1.25}
 .nav-btn span{text-align:center;max-width:100%}
 .nav-icon{width:23px;height:23px}
}
"""
if "</style>" not in html:
    raise SystemExit("Could not locate the application style closing tag.")
html = html.replace("</style>", active_css + "\n</style>", 1)

# Keep the same four existing sections and make the selected menu state explicit.
show_section_pattern = re.compile(r"function showSection\\(id,btn\\)\\{[\\s\\S]*?\\n\\}", re.MULTILINE)
show_section_match = show_section_pattern.search(html)
if not show_section_match:
    raise SystemExit("The existing showSection function was not found.")
replacement = """function showSection(id,btn){
  ['salarySection','dateSection','contactSection','settingsSection'].forEach(x=>{
    const section=$(x);
    if(section) section.classList.toggle('hidden',x!==id);
  });
  document.querySelectorAll('.nav-btn').forEach(x=>{
    const selected=x===btn;
    x.classList.toggle('active',selected);
    if(selected)x.setAttribute('aria-current','page');
    else x.removeAttribute('aria-current');
  });
}"""
html = html[:show_section_match.start()] + replacement + html[show_section_match.end():]

# Mark the default selected menu item for accessibility on first launch.
html, count = re.subn(
    r'(<a class="nav-btn active"[^>]*data-section="salarySection")>',
    r'\1 aria-current="page">',
    html,
    count=1,
)
if count != 1:
    raise SystemExit("Could not mark the initial salary tab as selected.")

# Recheck the four-section order and confirm the original converter remains intact.
required = [
    'id="salarySection"',
    'id="dateSection"',
    'id="contactSection"',
    'id="settingsSection"',
    'id="calendarInput"',
    'id="calendarConvert"',
    'function runCalendarConversion(){',
    'function gregorianFromCalendar(',
    'function calendarDateText(',
]
for fragment in required:
    if fragment not in html:
        raise SystemExit("Missing expected original feature after navigation patch: " + fragment)

html_path.write_text(html, encoding="utf-8")
print("The existing date converter is now the second tab; the four-tab active indicators are installed.")
print("No date-conversion algorithm or leave-day calculation was changed.")
