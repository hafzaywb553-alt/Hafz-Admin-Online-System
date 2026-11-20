const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const assets = path.join(__dirname, "..", "app", "src", "main", "assets");
const html = fs.readFileSync(path.join(assets, "index.html"), "utf8");
const runtime = fs.readFileSync(path.join(__dirname, "date_conversion_help.js"), "utf8");

for (const fragment of [
  'id="dateConversionHelpWrap"',
  'id="dateConversionHelpToggle"',
  'id="dateConversionHelpPanel" role="dialog"',
  "1405/06/08 = 2026/08/30 = 1448/03/17",
  "دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.",
  "قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي."
]) {
  assert.ok(html.includes(fragment), "Missing date-help requirement: " + fragment);
}
assert.ok(html.includes('aria-modal="false" aria-label="د نېټې د تبدیل بېلګه" hidden'),
  "The help panel must initially be hidden.");
assert.ok(!html.includes('data-t="dateNote"'),
  "The previous always-visible date note should now be shown through the help control only.");
assert.ok(html.includes(".date-help-panel[hidden]{display:none!important}"),
  "The help panel must remain hidden before it is opened.");

class FakeElement {
  constructor(id) {
    this.id = id;
    this.hidden = id === "dateConversionHelpPanel";
    this.value = "ps";
    this.attributes = {};
    this.listeners = {};
    this.textContent = "";
    this.title = "";
  }
  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  contains(target) {
    return target === this.button || target === this.panel || target === this.panelChild;
  }
}

const elements = {};
for (const id of [
  "dateConversionHelpWrap", "dateConversionHelpToggle", "dateConversionHelpPanel",
  "dateConversionHelpTitle", "dateConversionHelpExample",
  "dateConversionHelpDescription", "dateConversionHelpLunarNote", "lang"
]) elements[id] = new FakeElement(id);
const wrap = elements.dateConversionHelpWrap;
const button = elements.dateConversionHelpToggle;
const panel = elements.dateConversionHelpPanel;
wrap.button = button;
wrap.panel = panel;
const panelChild = new FakeElement("dateHelpTextChild");
wrap.panelChild = panelChild;

const documentListeners = {};
const document = {
  getElementById(id) { return elements[id] || null; },
  addEventListener(type, handler, capture) {
    (documentListeners[type] ||= []).push({ handler, capture: !!capture });
  }
};
vm.runInNewContext(runtime, { document });

function click(target) {
  const event = { target, preventDefault() {}, stopPropagation() {} };
  for (const entry of documentListeners.click || []) {
    if (entry.capture) entry.handler(event);
  }
  for (const handler of target.listeners?.click || []) handler(event);
  for (const entry of documentListeners.click || []) {
    if (!entry.capture) entry.handler(event);
  }
}

assert.equal(panel.hidden, true, "Help must start hidden.");
assert.equal(button.attributes["aria-expanded"], "false");
click(button);
assert.equal(panel.hidden, false, "Clicking the help icon must open the help.");
assert.equal(button.attributes["aria-expanded"], "true");
click(panelChild);
assert.equal(panel.hidden, false, "Clicking inside the help panel must not close it.");
click(new FakeElement("anotherHelpOrOutsideArea"));
assert.equal(panel.hidden, true, "Clicking another help or anywhere outside must close it.");

click(button);
assert.equal(panel.hidden, false);
for (const entry of documentListeners.keydown || []) entry.handler({ key: "Escape" });
assert.equal(panel.hidden, true, "Escape must close the help.");

elements.lang.value = "en";
for (const handler of elements.lang.listeners.change || []) handler();
assert.equal(elements.dateConversionHelpTitle.textContent, "Date conversion example");
assert.equal(elements.dateConversionHelpExample.textContent, "1405/06/08 = 2026/08/30 = 1448/03/17");

console.log("Date-conversion help tests passed: hidden by default, click-to-open, outside-click/ESC close, and language switching.");