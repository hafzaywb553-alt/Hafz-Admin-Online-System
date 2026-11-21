const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const actualPath = process.argv[2] || 'offline-apk/app/src/main/assets/index.html';
const baselinePath = process.argv[3] || '/tmp/finance-v22-before-v23.html';
const html = fs.readFileSync(actualPath, 'utf8');
const baseline = fs.readFileSync(baselinePath, 'utf8');

function between(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Cannot extract ' + start + ' ... ' + end);
  return source.slice(a, b);
}

// Preserve all salary, education and allowance constants byte-for-byte.
assert.equal(
  between(html, 'const MILITARY=[', 'const COLORS=['),
  between(baseline, 'const MILITARY=[', 'const COLORS=['),
  'Owner-provided salary, education and allowance tables must remain byte-for-byte unchanged.'
);

// Execute production calculation helpers in an isolated VM.
const monthBlock = between(html, 'const MONTHS=', 'const MILITARY=');
const arithmeticBlock = between(html, 'function round(', 'function normalizeCalendarDigits(');
const calendarBlock = between(html, 'function normalizeCalendarDigits(', 'const LEAVE_TEXT=');
const periodBlock = between(html, 'function periods(', 'function isCivilianInstitution(');
const context = { Intl, Date, Math, Number, String, Object, Array, RegExp, Error };
vm.createContext(context);
vm.runInContext([
  monthBlock,
  arithmeticBlock,
  calendarBlock,
  periodBlock,
  'globalThis.testApi={solarDays,isSolarLeapYear,solarMonthName,resolveCalculationDays,resolveAbsenceDays,periods,tax,sumMonthlyTax};'
].join('\n'), context);

// Tax thresholds/formula remain unchanged, but tax is calculated for each period.
assert.equal(context.testApi.tax(50000), 4000);
assert.equal(context.testApi.tax(120000), 12000);
assert.equal(context.testApi.sumMonthlyTax([50000, 50000]), 8000);
assert.match(html, /totals\.tax\s*=\s*sumMonthlyTax\(detail\.map\(r\s*=>\s*r\.gross\)\)/);
assert.doesNotMatch(html, /totals\.tax\s*=\s*tax\(totals\.gross\)/);

// Solar Hijri leap years, including Esfand 30.
assert.equal(context.testApi.solarDays(12, 1403), 30);
assert.equal(context.testApi.solarDays(12, 1404), 29);
assert.equal(context.testApi.solarDays(12, 1408), 30);
assert.equal(context.testApi.solarDays(12, 1409), 29);
assert.equal(context.testApi.periods(1403, 12, 30, 'en')[0].days, 30);
const yearCross = context.testApi.periods(1404, 12, 30, 'en');
assert.equal(yearCross[0].days, 29);
assert.equal(yearCross[1].year, 1405);
assert.equal(yearCross[1].month, 1);
assert.equal(yearCross[1].days, 1);

// Accept whole-number Persian digits; reject negatives, decimals and over-limit input.
assert.deepEqual(JSON.parse(JSON.stringify(context.testApi.resolveCalculationDays('۱۷', 31))), {ok:true, days:17});
for (const bad of ['0', '-1', '1.5', '3661', 'abc']) {
  assert.equal(context.testApi.resolveCalculationDays(bad, 31).ok, false, 'Invalid days accepted: ' + bad);
}
assert.equal(context.testApi.resolveCalculationDays('', 30).days, 30);
assert.equal(context.testApi.resolveAbsenceDays('۵', 17).days, 5);
for (const bad of ['-1', '1.5', '18', 'abc']) {
  assert.equal(context.testApi.resolveAbsenceDays(bad, 17).ok, false, 'Invalid absence days accepted: ' + bad);
}

// Full 3,660-day range must not be silently truncated at 120 months.
const longPeriod = context.testApi.periods(1405, 1, 3660, 'en');
assert.ok(longPeriod.length > 120);
assert.equal(longPeriod.reduce((sum, period) => sum + period.days, 0), 3660);

// Solar month names follow each supported UI language.
assert.equal(context.testApi.solarMonthName(1, 'ps'), 'حمل');
assert.equal(context.testApi.solarMonthName(1, 'fa'), 'حمل');
assert.equal(context.testApi.solarMonthName(1, 'ar'), 'الحمل');
assert.equal(context.testApi.solarMonthName(1, 'ur'), 'حمل');
assert.equal(context.testApi.solarMonthName(1, 'en'), 'Hamal');

// Stale absence value must be cleared when changing to present.
assert.match(html, /if\(id==='status'&&data\.status==='حاضر'\)\{data\.attendanceDays='0';\$\('attendanceDays'\)\.value='0'\}/);
assert.match(html, /if\(data\.status==='حاضر'\)\{const changed=data\.attendanceDays!=='0';data\.attendanceDays='0';\$\('attendanceDays'\)\.value='0';if\(changed\)save\(\)\}/);

// Storage failures have an explicit in-app warning.
assert.match(html, /function save\(\)\{try\{localStorage\.setItem\(STORE,JSON\.stringify\(data\)\);return true\}catch\(e\)\{showStorageWarning\(\);return false\}\}/);
assert.match(html, /id="storageWarning"/);

// Do not silently use an arithmetic civil calendar while labeling it Umm al-Qura.
assert.match(html, /const CALENDAR_NAMES=\{solar:'persian',lunar:'islamic-umalqura',gregorian:'gregory'\}/);
assert.match(html, /function calendarParts\(date,kind\)\{\s*const formatter=calendarFormatter\(kind\);\s*if\(formatter\)return partsFromFormatter\(date,formatter\);\s*throw new Error\('unsupported-calendar'\);\s*\}/);
assert.match(html, /function islamicCivilFromDate\(/); // Retained as unused helper for safe backwards compatibility; no longer a fallback.
assert.doesNotMatch(html, /if\(kind==='lunar'\)return islamicCivilFromDate\(date\)/);

console.log('Finance V23 core regression tests passed.');
