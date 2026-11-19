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
  "function buildLeaveSchedule(startDate,requestedDays)",
  "row.excludedFriday",
  "L.leaveSkippedFriday",
  "Fridays are excluded from the count"
]) {
  assert.ok(html.includes(required), "Missing leave-calculator feature: " + required);
}
assert.ok(html.includes(".leave-day-row.friday"), "Friday highlight styling is missing.");

const start = html.indexOf("function normalizeCalendarDigits");
const end = html.indexOf("function runCalendarConversion");
assert.ok(start >= 0 && end > start, "Calendar conversion functions were not found.");
const calendarCode = html.slice(start, end);
const context = { Intl, Date, Math, Number, String, Object, Array, RegExp, Error };
vm.createContext(context);
vm.runInContext(
  calendarCode + "\nthis.api={gregorianFromCalendar,calendarDateText,MS_PER_DAY,buildLeaveSchedule};",
  context
);

const cases = [
  { calendar: "solar", input: "1405/03/09", days: 17 },
  { calendar: "lunar", input: "1448/06/05", days: 20 },
  { calendar: "gregorian", input: "2026/02/04", days: 45 }
];

for (const sample of cases) {
  const startDate = context.api.gregorianFromCalendar(sample.input, sample.calendar);
  assert.ok(startDate, "Could not parse " + sample.calendar + " start date.");
  const result = context.api.buildLeaveSchedule(startDate, sample.days);

  assert.equal(result.countedDays, sample.days, "Requested leave days were not completed.");
  assert.equal(result.dayRows.length, sample.days + result.fridayCount,
    "Calendar duration must equal counted leave days plus excluded Fridays.");
  assert.equal(result.dayRows.filter(row => row.excludedFriday).length, result.fridayCount);
  assert.equal(result.dayRows.filter(row => !row.excludedFriday).length, sample.days);
  assert.equal(result.lastDay.excludedFriday, false, "The end date must be a counted leave day.");

  let nextCountedDay = 0;
  for (let i = 0; i < result.dayRows.length; i++) {
    const row = result.dayRows[i];
    assert.equal(row.date.getTime(), startDate.getTime() + i * context.api.MS_PER_DAY,
      "The day-by-day schedule contains a skipped calendar date.");
    assert.equal(row.excludedFriday, row.weekday === 5,
      "Only Friday may be excluded.");
    if (row.excludedFriday) {
      assert.equal(row.leaveDayNumber, null);
    } else {
      nextCountedDay++;
      assert.equal(row.leaveDayNumber, nextCountedDay,
        "Counted leave-day numbering is not continuous.");
    }
  }
  assert.equal(nextCountedDay, sample.days);
  console.log(
    sample.calendar + ": " + sample.days + " counted days, " +
    result.fridayCount + " Fridays excluded, end " +
    context.api.calendarDateText(result.lastDay.date, sample.calendar)
  );
}

// Exact case matching the supplied sample: start on Friday 2026-12-18.
// Three Fridays (18 Dec, 25 Dec and 1 Jan) are excluded; 17 leave days end on 6 Jan 2027.
const fridayStart = context.api.gregorianFromCalendar("2026/12/18", "gregorian");
assert.equal(fridayStart.getUTCDay(), 5);
const fridayCase = context.api.buildLeaveSchedule(fridayStart, 17);
assert.equal(fridayCase.fridayCount, 3);
assert.equal(fridayCase.calendarDays, 20);
assert.equal(context.api.calendarDateText(fridayCase.lastDay.date, "gregorian"), "2027/01/06");
assert.equal(fridayCase.dayRows[0].excludedFriday, true);
assert.equal(fridayCase.dayRows[0].leaveDayNumber, null);

// A start date that is not Friday must count normally; Saturday and Sunday are not excluded.
const midweekStart = context.api.gregorianFromCalendar("2026/12/16", "gregorian");
const midweekCase = context.api.buildLeaveSchedule(midweekStart, 2);
assert.equal(midweekCase.fridayCount, 0);
assert.equal(midweekCase.calendarDays, 2);
assert.equal(context.api.calendarDateText(midweekCase.lastDay.date, "gregorian"), "2026/12/17");

const trailingSlash = "2026/2/4/".replace(/[\/\s]+$/, "");
assert.ok(context.api.gregorianFromCalendar(trailingSlash, "gregorian"));

console.log("All Friday-exclusion tests passed for Solar Hijri, Lunar Hijri and Gregorian dates.");
