const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");

const htmlPath = process.argv[2] || "offline-apk/app/src/main/assets/index.html";
const javaPath = process.argv[3] || "offline-apk/app/src/main/java/com/hafz/offlinefinance/MainActivity.java";
const html = fs.readFileSync(htmlPath, "utf8");
const java = fs.readFileSync(javaPath, "utf8");

// Freeze the salary and allowance tables exactly as they were in V18.
// This test fails if any of those user-selected rates are changed.
const tableStart = html.indexOf("const MILITARY=");
const tableEnd = html.indexOf("const COLORS=", tableStart);
assert.ok(tableStart >= 0 && tableEnd > tableStart, "Salary/allowance table block is missing.");
const tableHash = crypto.createHash("sha256").update(html.slice(tableStart, tableEnd), "utf8").digest("hex");
assert.equal(tableHash, "48e4202510f0c829d61325fca345bdba8f33d4b63b3dbac6eba6bf21721a33f6",
  "Military, civilian, education and step allowance tables changed unexpectedly.");

// Execute the actual Jalali arithmetic and periods code from the generated APK HTML.
const jalaliStart = html.indexOf("const JALALI_BREAKS=");
const jalaliEnd = html.indexOf("function normalizeCalendarDigits", jalaliStart);
assert.ok(jalaliStart >= 0 && jalaliEnd > jalaliStart, "Jalali calculation code is missing.");
const periodsStart = html.indexOf("function periods(y,m,total){");
const periodsEnd = html.indexOf("function isCivilianInstitution", periodsStart);
assert.ok(periodsStart >= 0 && periodsEnd > periodsStart, "Salary period generator is missing.");
const months = [["01","حمل"],["02","ثور"],["03","جوزا"],["04","سرطان"],["05","اسد"],["06","سنبله"],["07","میزان"],["08","عقرب"],["09","قوس"],["10","جدی"],["11","دلو"],["12","حوت"]];
const context = { Math, Number, Date, Array, Error, MONTHS: months };
vm.createContext(context);
vm.runInContext(
  html.slice(jalaliStart, jalaliEnd) + "\n" +
  html.slice(periodsStart, periodsEnd) +
  "\nthis.api={jalaliCalendar,solarDays,periods,jalaliToGregorian,gregorianToJalali};",
  context
);

assert.equal(context.api.solarDays(1, 1403), 31);
assert.equal(context.api.solarDays(6, 1403), 31);
assert.equal(context.api.solarDays(7, 1403), 30);
assert.equal(context.api.solarDays(11, 1403), 30);
assert.equal(context.api.solarDays(12, 1403), 30, "1403 must have 30 days in Hoot.");
assert.equal(context.api.solarDays(12, 1404), 29, "1404 must have 29 days in Hoot.");
assert.equal(context.api.solarDays(12, 1408), 30, "1408 must have 30 days in Hoot.");

// Cross-check every Jalali year in the app's selectable range against the
// platform Persian calendar implementation. The app's arithmetic fallback
// must agree with ICU where ICU is available.
const persian = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric"
});
function persianParts(date) {
  const result = {};
  for (const p of persian.formatToParts(date)) {
    if (["year", "month", "day"].includes(p.type)) result[p.type] = Number(p.value);
  }
  return result;
}
function persianNewYearStart(year) {
  const approx = Date.UTC(year + 621, 2, 18);
  for (let i = 0; i < 10; i++) {
    const d = new Date(approx + i * 86400000);
    const p = persianParts(d);
    if (p.year === year && p.month === 1 && p.day === 1) return d;
  }
  throw new Error("Could not find Persian new year " + year);
}
for (let y = 1300; y < 1500; y++) {
  const length = (persianNewYearStart(y + 1) - persianNewYearStart(y)) / 86400000;
  assert.equal(context.api.solarDays(12, y), length - 336,
    "Jalali leap-year mismatch in year " + y);
}

for (const [year, month, day, expected] of [
  [1403, 12, 30, "2025-03-20"],
  [1404, 1, 1, "2025-03-21"],
  [1408, 12, 30, "2030-03-20"]
]) {
  const date = context.api.jalaliToGregorian({year, month, day});
  assert.ok(date instanceof Date || Object.prototype.toString.call(date) === "[object Date]");
  assert.equal(date.toISOString().slice(0,10), expected);
  const back = context.api.gregorianToJalali(date);
  assert.deepEqual(
    {year:back.year, month:back.month, day:back.day},
    {year, month, day},
    "Jalali/Gregorian round-trip failed."
  );
}

const leapMonth = context.api.periods(1403, 12, 30);
assert.equal(leapMonth.length, 1);
assert.equal(leapMonth[0].monthDays, 30);
assert.equal(leapMonth[0].days, 30);

const nonLeapMonth = context.api.periods(1404, 12, 30);
assert.equal(nonLeapMonth[0].monthDays, 29);
assert.equal(nonLeapMonth[0].days, 29);
assert.equal(nonLeapMonth[1].year, 1405);
assert.equal(nonLeapMonth[1].month, 1);
assert.equal(nonLeapMonth[1].days, 1);

const longPeriod = context.api.periods(1405, 1, 3660);
assert.equal(longPeriod.reduce((sum, p) => sum + p.days, 0), 3660,
  "Long calculations must never silently drop days.");
assert.ok(longPeriod.length > 120,
  "The former 120-month cap must be removed.");

assert.ok(html.includes("max=\"3660\" step=\"1\""), "Calculation-day input needs a visible integer limit.");
assert.ok(html.includes("id=\"calcDaysError\""), "Invalid calculation days need an error message.");
assert.ok(html.includes("id=\"attendanceDaysError\""), "Invalid absence days need an error message.");
assert.ok(html.includes("if(kind==='solar')return gregorianToJalali(date)"), "Solar date-to-Gregorian fallback is missing.");
assert.ok(html.includes("if(!formatter)return jalaliToGregorian(wanted);"), "Solar Gregorian-to-date fallback is missing.");
assert.ok(html.includes("const CALC_ERROR_TEXT="), "Localized validation messages are missing.");

assert.ok(html.includes("if(id==='status'&&data.status==='حاضر'){data.attendanceDays='0';$('attendanceDays').value='0';}"),
  "Changing back to present must clear stale absence days.");
assert.ok(html.includes("data.attendanceDays='0';}"), "Present status must persist the zero absence value.");
assert.equal((html.match(/function resetAppearance\(\)/g)||[]).length, 1,
  "Duplicate resetAppearance declarations remain.");
assert.equal((html.match(/function resetColors\(\)/g)||[]).length, 1,
  "Duplicate resetColors declarations remain.");
assert.ok(html.includes("buildServiceYears();if(typeof updateLeaveCalculator==='function')updateLeaveCalculator();"),
  "Settings reset must refresh translated controls.");

assert.ok(java.includes('if ("tel".equals(scheme))'), "Android tel: links must open the system dialer.");
assert.ok(java.includes("WindowInsetsCompat.Type.systemBars()"), "Android system-bar insets are not handled.");
assert.ok(java.includes("confirmDeviceCredential"), "A phone PIN/password fallback is missing.");
assert.ok(java.includes("Finance-App-V23-Verified-Fixes.apk"), "APK share name is not updated to V23.");

console.log("PASS: salary/allowance tables unchanged.");
console.log("PASS: Jalali leap years, Hoot 29/30, and Solar/Gregorian round-trips.");
console.log("PASS: leap-year payroll month lengths and long-period day preservation.");
console.log("PASS: input validation, stale absence reset, and settings refresh.");
console.log("PASS: Android dialer, system-bar insets, and device-credential fallback.");
