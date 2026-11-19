const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const html = fs.readFileSync(htmlPath, "utf8");

for (const required of [
  'id="leaveCalculator"',
  'id="leaveCalendarSource"',
  'id="leaveStartDate"',
  'id="leaveDays"',
  'id="leaveFridayCount"',
  'id="leaveEndSolar"',
  'id="leaveEndLunar"',
  'id="leaveEndGregorian"',
  'class="leave-schedule"',
  "row.weekday===5",
  "applyLeaveLang();"
]) {
  assert.ok(html.includes(required), "Missing calculator element or behavior: " + required);
}

const start = html.indexOf("function normalizeCalendarDigits");
const end = html.indexOf("function runCalendarConversion");
assert.ok(start >= 0 && end > start, "Calendar conversion functions were not found.");
const calendarCode = html.slice(start, end);
const context = { Intl, Date, Math, Number, String, Object, Array, RegExp, Error };
vm.createContext(context);
vm.runInContext(calendarCode + "\nthis.api={gregorianFromCalendar,calendarDateText,MS_PER_DAY};", context);

const cases = [
  { calendar: "solar", input: "1405/03/09", days: 17, end: "1405/03/25", fridays: 2 },
  { calendar: "lunar", input: "1448/06/05", days: 20, end: "1448/06/24", fridays: 3 },
  { calendar: "gregorian", input: "2026/02/04", days: 45, end: "2026/03/20", fridays: 7 }
];

for (const sample of cases) {
  const startDate = context.api.gregorianFromCalendar(sample.input, sample.calendar);
  assert.ok(startDate, "Could not parse " + sample.calendar + " start date.");
  let fridays = 0;
  let finalDate = null;
  for (let i = 0; i < sample.days; i++) {
    const date = new Date(startDate.getTime() + i * context.api.MS_PER_DAY);
    if (date.getUTCDay() === 5) fridays++;
    finalDate = date;
  }
  assert.equal(context.api.calendarDateText(finalDate, sample.calendar), sample.end);
  assert.equal(fridays, sample.fridays);
}

const trailingSlash = "2026/2/4/".replace(/[\\/\\s]+$/, "");
assert.ok(context.api.gregorianFromCalendar(trailingSlash, "gregorian"));
console.log("Leave calculator tests passed: 3 calendars, inclusive day count, Friday count and trailing-slash input.");
