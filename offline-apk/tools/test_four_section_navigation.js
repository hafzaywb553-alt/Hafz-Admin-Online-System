const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const html = fs.readFileSync(htmlPath, "utf8");
const expected = [
  "salarySection",
  "dateConversionSection",
  "contactSection",
  "settingsSection"
];

const navStart = html.indexOf('<nav class="bottom">');
const navEnd = html.indexOf("</nav>", navStart);
assert.ok(navStart >= 0 && navEnd > navStart, "Bottom navigation is missing.");
const nav = html.slice(navStart, navEnd);
const actual = [...nav.matchAll(/<a\b[^>]*data-section="([^"]+)"[^>]*>/g)].map(m => m[1]);
assert.deepEqual(actual, expected, "The four navigation tabs must be in the requested order.");

const dateInput = html.indexOf('id="calendarInput"');
assert.ok(dateInput >= 0, "The original date-conversion input is missing.");
const dateSectionStart = html.lastIndexOf('<section', dateInput);
const dateSectionTagEnd = html.indexOf(">", dateSectionStart);
assert.ok(dateSectionStart >= 0 && dateSectionTagEnd > dateSectionStart);
const dateSectionTag = html.slice(dateSectionStart, dateSectionTagEnd + 1);
assert.ok(dateSectionTag.includes('id="dateConversionSection"'),
  "The existing calendar converter must belong to the second tab.");

for (const item of [
  'data-t="navDateConversion"',
  'class="nav-icon date-icon"',
  "grid-template-columns:repeat(4,1fr)",
  '.nav-btn[data-section="salarySection"].active',
  '.nav-btn[data-section="dateConversionSection"].active',
  '.nav-btn[data-section="contactSection"].active',
  '.nav-btn[data-section="settingsSection"].active',
  "aria-current",
  "function gregorianFromCalendar(",
  "function calendarDateText("
]) {
  assert.ok(html.includes(item), "Missing four-tab feature: " + item);
}

for (const unwanted of [
  'id="dateConversionHelpWrap"',
  'id="dateConversionHelpToggle"',
  'id="dateConversionHelpPanel"',
  "initializeDateConversionHelp",
  "1405/06/08 = 2026/08/30 = 1448/03/17",
  "دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.",
  'data-t="dateNote"'
]) {
  assert.ok(!html.includes(unwanted), "Date help/example content should be removed: " + unwanted);
}

const start = html.indexOf("function showSection(id,btn){");
const end = html.indexOf("\nfunction contactText()", start);
assert.ok(start >= 0 && end > start, "The navigation controller was not found.");
const controller = html.slice(start, end);

class FakeClassList {
  constructor() { this.values = new Set(); }
  toggle(name, force) {
    if (force) this.values.add(name);
    else this.values.delete(name);
  }
  contains(name) { return this.values.has(name); }
}
class FakeSection {
  constructor(id) { this.id = id; this.classList = new FakeClassList(); }
}
class FakeButton {
  constructor(section) {
    this.section = section;
    this.classList = new FakeClassList();
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  removeAttribute(k) { delete this.attributes[k]; }
}
const sections = Object.fromEntries(expected.map(id => [id, new FakeSection(id)]));
const buttons = expected.map(id => new FakeButton(id));
const context = {
  $: id => sections[id],
  document: { querySelectorAll: selector => selector === ".nav-btn" ? buttons : [] }
};
vm.createContext(context);
vm.runInContext(controller, context);
for (let i = 0; i < expected.length; i++) {
  context.showSection(expected[i], buttons[i]);
  for (const id of expected) {
    assert.equal(sections[id].classList.contains("hidden"), id !== expected[i],
      "Wrong section visibility after selecting " + expected[i]);
  }
  for (let j = 0; j < buttons.length; j++) {
    assert.equal(buttons[j].classList.contains("active"), j === i,
      "Wrong active button after selecting " + expected[i]);
    assert.equal(buttons[j].attributes["aria-current"], j === i ? "page" : undefined,
      "Wrong accessibility active state after selecting " + expected[i]);
  }
}

console.log("All four tabs, active indicators, date-help removal and original converter checks passed.");
