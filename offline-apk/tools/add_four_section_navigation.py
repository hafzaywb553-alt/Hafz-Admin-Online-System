from pathlib import Path
import re

html_path = Path(__file__).resolve().parents[1] / "app" / "src" / "main" / "assets" / "index.html"
html = html_path.read_text(encoding="utf-8")

# The date-conversion controls already exist in V18. Identify their actual
# containing section, then rename only that section for the bottom navigation.
needle = 'id="calendarInput"'
if html.count(needle) != 1:
    raise SystemExit("Expected exactly one existing date-conversion input; refusing to guess.")
input_pos = html.find(needle)
section_pos = html.rfind("<section", 0, input_pos)
if section_pos < 0:
    raise SystemExit("Could not locate the section containing the existing date converter.")
section_end = html.find(">", section_pos)
if section_end < 0:
    raise SystemExit("The date-conversion section opening tag is incomplete.")
section_tag = html[section_pos:section_end + 1]
section_id = re.search(r'\bid="([^"]+)"', section_tag)
if not section_id:
    raise SystemExit("The date-conversion section has no ID; refusing to rename an unknown section.")
old_section_id = section_id.group(1)
if old_section_id in ("salarySection", "contactSection", "settingsSection"):
    raise SystemExit(
        "The date-conversion controls appear inside the " + old_section_id +
        " section. No section was moved or renamed; source layout requires review."
    )
if old_section_id != "dateConversionSection":
    updated_tag, count = re.subn(
        r'\bid="' + re.escape(old_section_id) + r'"',
        'id="dateConversionSection"',
        section_tag,
        count=1,
    )
    if count != 1:
        raise SystemExit("Could not safely rename the date-conversion section.")
    html = html[:section_pos] + updated_tag + html[section_end + 1:]

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
# The smallest common DIV is the example-only wrapper, not the whole converter section.
block_start, block_end = min(valid_blocks.items(), key=lambda item: item[1] - item[0])
html = html[:block_start] + html[block_end:]
for phrase in example_phrases:
    if phrase in html:
        positions = []
        cursor = 0
        while True:
            found = html.find(phrase, cursor)
            if found < 0:
                break
            positions.append(html[max(0, found - 180):min(len(html), found + len(phrase) + 220)])
            cursor = found + len(phrase)
        print("DEBUG remaining phrase:", repr(phrase), "occurrences:", len(positions))
        for excerpt in positions:
            print("DEBUG CONTEXT:", excerpt)
        raise SystemExit("The date-example text remains after removing its exact block: " + phrase)

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

# Add the fourth navigation entry immediately after the salary entry.
nav_start = html.find('<nav class="bottom">')
nav_end = html.find("</nav>", nav_start)
if nav_start < 0 or nav_end < 0:
    raise SystemExit("The bottom navigation container was not found.")
nav_html = html[nav_start:nav_end]
if 'data-section="dateConversionSection"' in nav_html:
    raise SystemExit("The date-conversion navigation entry is already present.")
salary_pattern = re.compile(r'<a\b(?=[^>]*data-section="salarySection")[^>]*>[\s\S]*?</a>')
salary_matches = list(salary_pattern.finditer(nav_html))
if len(salary_matches) != 1:
    raise SystemExit("Could not uniquely locate the salary navigation entry.")
date_nav = """<a class="nav-btn" href="hafz://nav/dateConversion" data-section="dateConversionSection">
    <svg class="nav-icon date-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18M7 13h3M14 13h3M7 17h3"/></svg>
    <span data-t="navDateConversion">د نېټې تبدیل</span>
  </a>"""
m = salary_matches[0]
nav_html = nav_html[:m.end()] + "\n  " + date_nav + nav_html[m.end():]
html = html[:nav_start] + nav_html + html[nav_end:]

# Four equally sized navigation columns.
bottom_pattern = re.compile(r'(\.bottom\{[^}]*grid-template-columns:)repeat\(3,1fr\)')
html, count = bottom_pattern.subn(r'\1repeat(4,1fr)', html, count=1)
if count != 1:
    raise SystemExit("Could not safely change the bottom menu to four columns.")

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
/* Four-tab active-state colors: the selected tab changes both label and outline. */
.nav-btn[data-section="salarySection"].active{color:#55a8ff;background:rgba(85,168,255,.14);border-color:rgba(85,168,255,.58);box-shadow:inset 0 -3px 0 #55a8ff}
.nav-btn[data-section="dateConversionSection"].active{color:#b58cff;background:rgba(181,140,255,.15);border-color:rgba(181,140,255,.62);box-shadow:inset 0 -3px 0 #b58cff}
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

# Add the date-conversion label to all five supported language dictionaries.
translations = {
    "ps": "د نېټې تبدیل",
    "fa": "تبدیل تاریخ",
    "ar": "تحويل التاريخ",
    "ur": "تاریخ کی تبدیلی",
    "en": "Date Conversion",
}
for language, value in translations.items():
    marker = language + ":{"
    pos = html.find(marker)
    if pos < 0:
        raise SystemExit("The " + language + " language dictionary was not found.")
    line_start = html.rfind("\n", 0, pos) + 1
    line_end = html.find("\n", pos)
    if line_end < 0:
        line_end = len(html)
    line = html[line_start:line_end]
    line, count = re.subn(
        r"(navSalary:'[^']*',)",
        lambda match: match.group(1) + "navDateConversion:'" + value + "',",
        line,
        count=1,
    )
    if count != 1:
        raise SystemExit("Could not add the date-conversion label to " + language + ".")
    html = html[:line_start] + line + html[line_end:]

# Keep the same four existing sections and make the selected menu state explicit.
start = html.find("function showSection(id,btn){")
end = html.find("\nfunction contactText()", start)
if start < 0 or end < 0 or end <= start:
    raise SystemExit("The existing showSection function boundaries were not found.")
replacement = """function showSection(id,btn){
  ['salarySection','dateConversionSection','contactSection','settingsSection'].forEach(x=>{
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
html = html[:start] + replacement + html[end:]

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
    'id="dateConversionSection"',
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
