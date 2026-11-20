const assert = require("node:assert/strict");
const fs = require("node:fs");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const html = fs.readFileSync(htmlPath, "utf8");

for (const forbidden of [
  "د نېټې د تبدیل بېلګه",
  "1405/06/08 = 2026/08/30 = 1448/03/17",
  'data-t="dateExampleTitle"',
  'data-t="dateExampleText"',
  "dateExampleTitle",
  "dateExampleText"
]) {
  assert.ok(!html.includes(forbidden), "The removed date example is still present: " + forbidden);
}

for (const required of [
  'id="dateConversionHelpWrap"',
  'id="dateConversionHelpToggle"',
  'id="dateConversionHelpPanel"',
  'id="dateConversionHelpLunarNote"',
  "قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني",
  ".date-help-panel[hidden]{display:none!important}",
  ".bottom .nav-btn.active::after",
  ".bottom .nav-btn.active>.nav-icon",
  ".bottom .nav-btn:nth-child(1){--nav-tone:#55a8ff}",
  ".bottom .nav-btn:nth-child(2){--nav-tone:#67d6cf}",
  ".bottom .nav-btn:nth-child(3){--nav-tone:#2dd884}",
  ".bottom .nav-btn:nth-child(4){--nav-tone:#ffd466}"
]) {
  assert.ok(html.includes(required), "Missing V22 UI behavior/style: " + required);
}

const navStart = html.indexOf('<nav class="bottom">');
const navEnd = html.indexOf("</nav>", navStart);
assert.ok(navStart >= 0 && navEnd > navStart, "Bottom navigation was not found.");
const nav = html.slice(navStart, navEnd + 6);
const expected = [
  ["salarySection", "salary-icon"],
  ["dateSection", "date-icon"],
  ["contactSection", "contact-icon"],
  ["settingsSection", "settings-icon"]
];
const navButtons = [...nav.matchAll(/<a class="nav-btn[^"]*"[^>]*data-section="([^"]+)"[\s\S]*?<svg class="nav-icon ([^"]+)"/g)];
assert.equal(navButtons.length, 4, "Exactly four existing bottom tabs must remain.");
for (let i = 0; i < expected.length; i++) {
  assert.equal(navButtons[i][1], expected[i][0], "Bottom tab order or section target changed.");
  assert.equal(navButtons[i][2], expected[i][1], "The existing tab icon changed.");
}

const showStart = html.indexOf("function showSection(id,btn){");
assert.ok(showStart >= 0, "Existing showSection handler was not found.");
const showEnd = html.indexOf("\n}", showStart);
assert.ok(showEnd > showStart, "Existing showSection function was incomplete.");
const showCode = html.slice(showStart, showEnd + 2);
const sections = ["salarySection", "dateSection", "contactSection", "settingsSection"];
class FakeClassList {
  constructor() { this.values = new Set(); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : !!force;
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
  contains(name) { return this.values.has(name); }
}
const fakeSections = Object.fromEntries(sections.map(id => [id, {classList:new FakeClassList()}]));
const fakeButtons = expected.map(() => ({classList:new FakeClassList()}));
const vm = require("node:vm");
const context = {
  $: id => fakeSections[id],
  document: { querySelectorAll: selector => selector === ".nav-btn" ? fakeButtons : [] }
};
vm.runInNewContext(showCode + "\nthis.testShowSection=showSection;", context);
for (let selected = 0; selected < sections.length; selected++) {
  context.testShowSection(sections[selected], fakeButtons[selected]);
  for (let i = 0; i < sections.length; i++) {
    assert.equal(fakeSections[sections[i]].classList.contains("hidden"), i !== selected,
      "The selected section visibility did not follow the tapped tab.");
    assert.equal(fakeButtons[i].classList.contains("active"), i === selected,
      "The active highlight did not follow the tapped tab.");
  }
}

console.log("V22 tests passed: date sample removed, lunar help retained, four tabs and active selection verified.");