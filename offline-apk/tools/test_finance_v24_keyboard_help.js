const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const html = fs.readFileSync(htmlPath, "utf8");

for (const expected of [
  "window.setNativeKeyboardVisible=function(visible)",
  "document.addEventListener('focusin'",
  "document.addEventListener('focusout'",
  "window.visualViewport.addEventListener('resize'",
  "field.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'})",
  "body.keyboard-open .bottom",
  "document.querySelectorAll('.help-trigger').forEach(trigger=>",
  "helpCloseButton.addEventListener('click'",
  "helpPreviousButton.addEventListener('click'",
  "helpNextButton.addEventListener('click'",
  "modal.classList.remove('hidden')",
  "body.help-modal-open",
]) {
  assert.ok(html.includes(expected), "Missing required implementation: " + expected);
}
assert.ok(!html.includes("Delegated click handling is lighter"),
  "Obsolete delegated Help click listener must be removed.");
const topics = (html.match(/class="help-item help-topic help-trigger"/g) || []).length;
assert.ok(topics >= 5, "Original Settings Help topics were removed.");

const sectionStart = html.indexOf("let activeHelpTrigger=null;");
const sectionEnd = html.indexOf("function contactText(){", sectionStart);
assert.ok(sectionStart >= 0 && sectionEnd > sectionStart, "Help controller is missing.");
const helpCode = html.slice(sectionStart, sectionEnd);

function classList(initial = []) {
  const values = new Set(initial);
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    contains: value => values.has(value),
    toggle(value, force) {
      if (force === undefined) force = !values.has(value);
      if (force) values.add(value); else values.delete(value);
      return force;
    },
  };
}
function element(id, initialClasses = []) {
  return {
    id, classList: classList(initialClasses), dataset: {}, listeners: {},
    textContent: "", scrollTop: 0, disabled: false, attributes: {},
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    getAttribute(name) { return this.attributes[name]; },
  };
}
const modal = element("helpModal", ["hidden"]);
const title = element("helpModalTitle");
const body = element("helpModalBody");
const close = element("helpModalClose");
const previous = element("helpPrevBtn");
const next = element("helpNextBtn");
const backdrop = element("helpBackdrop");
const triggerA = element("helpA");
triggerA.dataset = { helpTitleKey: "t1", helpBodyKey: "b1" };
const triggerB = element("helpB");
triggerB.dataset = { helpTitleKey: "t2", helpBodyKey: "b2" };
const byId = {
  helpModal: modal, helpModalTitle: title, helpModalBody: body,
  helpModalClose: close, helpPrevBtn: previous, helpNextBtn: next,
};
const documentListeners = {};
const doc = {
  body: element("body"),
  documentElement: element("html"),
  activeElement: null,
  querySelectorAll(selector) {
    if (selector === ".help-trigger") return [triggerA, triggerB];
    if (selector === '[data-help-close="true"]') return [backdrop];
    return [];
  },
  getElementById(id) { return byId[id] || null; },
  addEventListener(type, fn) { (documentListeners[type] ||= []).push(fn); },
};
const context = {
  document: doc,
  settings: { lang: "ps" },
  TXT: { ps: {
    t1: "لومړۍ مرسته", b1: "د لومړۍ مرستې اصلي متن",
    t2: "دوهمه مرسته", b2: "د دوهمې مرستې اصلي متن",
    helpTitle: "مرسته", helpClose: "بندول",
    helpPrevious: "مخکینی", helpNext: "راتلونکی",
  } },
  console,
  $: id => doc.getElementById(id),
};
vm.createContext(context);
vm.runInContext(helpCode, context, { timeout: 1000 });

function fire(node, type) {
  const event = {
    key: type,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
  };
  for (const fn of node.listeners[type] || []) fn(event);
  return event;
}
fire(triggerA, "click");
assert.equal(modal.classList.contains("hidden"), false, "Help topic click did not open the modal.");
assert.equal(modal.attributes["aria-hidden"], "false");
assert.equal(title.textContent, "لومړۍ مرسته");
assert.equal(body.textContent, "د لومړۍ مرستې اصلي متن");
assert.equal(body.focused, true, "Help body should receive focus.");
assert.equal(next.disabled, false);

fire(next, "click");
assert.equal(title.textContent, "دوهمه مرسته");
assert.equal(body.textContent, "د دوهمې مرستې اصلي متن");
assert.equal(next.disabled, true);
assert.equal(previous.disabled, false);

fire(previous, "click");
assert.equal(title.textContent, "لومړۍ مرسته");
fire(close, "click");
assert.equal(modal.classList.contains("hidden"), true);
assert.equal(modal.attributes["aria-hidden"], "true");
assert.equal(triggerA.focused, true);

fire(triggerB, "click");
assert.equal(modal.classList.contains("hidden"), false, "Second Help topic did not open the modal.");
fire(backdrop, "click");
assert.equal(modal.classList.contains("hidden"), true);

fire(triggerA, "click");
const escapeEvent = { key: "Escape", preventDefault() { this.prevented = true; } };
for (const fn of documentListeners.keydown || []) fn(escapeEvent);
assert.equal(modal.classList.contains("hidden"), true);

console.log("PASS: keyboard visibility, field focus reveal and bottom-tab avoidance are present.");
console.log("PASS: every tested Help action opens localized modal content and previous/next/close works.");
console.log("PASS: backdrop and Escape both close the Help modal.");
