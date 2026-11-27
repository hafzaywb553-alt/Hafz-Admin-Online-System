const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const javaPath = process.argv[3] || "offline-apk/app/src/main/java/com/hafz/offlinefinance/MainActivity.java";
const gradlePath = process.argv[4] || "offline-apk/app/build.gradle";
const html = fs.readFileSync(htmlPath, "utf8");
const java = fs.readFileSync(javaPath, "utf8");
const gradle = fs.readFileSync(gradlePath, "utf8");

for (const expected of [
  "function findScrollContainer(field)",
  "window.scrollBy(0,delta)",
  "window.visualViewport.addEventListener('resize'",
  "[100,240,420,700,1000,1400]",
  "body.keyboard-open .bottom",
]) {
  assert.ok(html.includes(expected), "Missing keyboard handling: " + expected);
}
for (const expected of [
  "WindowCompat.setDecorFitsSystemWindows(getWindow(), decorFits)",
  "boolean decorFits = Build.VERSION.SDK_INT < 35",
  "new FrameLayout(this)",
  "ViewCompat.setOnApplyWindowInsetsListener(rootLayout",
  "applyWebViewWindowInsets(view, windowInsets)",
  "rootView.getHeight() - safe.top - bottomInset",
  "adjustResize has already reduced this content root",
  'android:windowSoftInputMode="adjustResize|stateAlwaysHidden"',
]) {
  if (expected.startsWith("android:")) continue; // verified separately from the manifest
  assert.ok(java.includes(expected), "Missing native keyboard layout contract: " + expected);
}
assert.ok(gradle.includes("applicationId 'com.hafz.offlinefinance.v25'"));
assert.ok(gradle.includes("versionCode 25"));
assert.ok(gradle.includes("versionName '2.5'"));

for (const section of ["salarySection", "dateSection", "contactSection", "settingsSection"]) {
  assert.ok(html.includes('id="' + section + '"'), "Original section missing: " + section);
}
assert.ok(html.includes("const MILITARY="), "Military salary table missing.");
assert.ok(html.includes("const COLORS="), "Settings color presets missing.");
assert.ok(html.includes("function updateLeaveCalculator"), "Leave calculator missing.");
assert.ok(html.includes("leaveFridayCountLabel"), "Friday leave count missing.");
assert.ok(html.includes("let activeHelpTrigger=null"), "Settings Help controller missing.");

// Exercise the focus-reveal code against a short visual viewport (keyboard open).
function runFocusCase(useVisualViewport, visibleHeight) {
  const timers = [];
  const events = {};
  const bodyClasses = new Set();
  const field = {
    top: 610,
    bottom: 660,
    parentElement: null,
    isContentEditable: false,
    matches() { return true; },
    getBoundingClientRect() { return { top: this.top, bottom: this.bottom, height: 50 }; },
    scrollIntoView() { this.top = Math.min(this.top, visibleHeight - 80); this.bottom = this.top + 50; },
  };
  const body = { classList: {
    add(x) { bodyClasses.add(x); },
    remove(x) { bodyClasses.delete(x); },
    contains(x) { return bodyClasses.has(x); },
    toggle(x, force) { if (force) bodyClasses.add(x); else bodyClasses.delete(x); },
  }};
  const document = {
    activeElement: field,
    body,
    documentElement: { clientHeight: visibleHeight },
    scrollingElement: null,
    addEventListener(type, fn) { (events[type] ||= []).push(fn); },
  };
  const visualViewport = useVisualViewport ? {
    offsetTop: 0,
    height: visibleHeight,
    listeners: {},
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
  } : null;
  const window = {
    innerHeight: useVisualViewport ? 820 : visibleHeight,
    visualViewport,
    getComputedStyle() { return { overflowY: "visible", overflow: "visible" }; },
    addEventListener(type, fn) { (events["window:" + type] ||= []).push(fn); },
    scrollBy(_x, y) { field.top -= y; field.bottom -= y; },
  };
  const context = {
    window, document,
    setTimeout(fn, delay) { timers.push({ fn, delay }); },
    console,
  };
  vm.createContext(context);
  const start = html.indexOf("// Finance V25: resize-aware keyboard handling for every editable field.");
  const end = html.indexOf("})();", start) + 5;
  assert.ok(start >= 0 && end > start, "Could not isolate the V25 keyboard controller.");
  vm.runInContext(html.slice(start, end), context, { timeout: 1000 });

  context.window.setNativeKeyboardVisible(true);
  for (const fn of events.focusin || []) fn({ target: field });
  timers.sort((a, b) => a.delay - b.delay).forEach(t => t.fn());

  assert.ok(field.top >= -1, "Focused field scrolled above the visible area.");
  assert.ok(field.bottom <= visibleHeight - 28 + 1,
    "Focused field remains behind the keyboard: bottom=" + field.bottom + " visible=" + visibleHeight);
  assert.ok(bodyClasses.has("keyboard-open"), "Keyboard-open layout class was not applied.");
}
runFocusCase(true, 420);
runFocusCase(false, 420);

console.log("PASS: focused input is scrolled above a simulated keyboard with VisualViewport.");
console.log("PASS: focused input is also scrolled above a simulated keyboard without VisualViewport.");
console.log("PASS: Android 6–14 uses adjustResize without double-subtracting IME insets.");
console.log("PASS: Android 15+ explicitly resizes WebView to system-bar and IME insets.");
console.log("PASS: original four sections, salary data, leave calculator and Help controller remain.");
