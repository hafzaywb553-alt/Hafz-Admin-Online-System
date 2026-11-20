# Finance App V22 — Four Sections

V22 is built from the verified offline V18 HTML source, the existing leave calculator and the Friday-exclusion update.

## Navigation order

1. Salary information (د معاشونو معلومات)
2. Date conversion (د نېټې تبدیل)
3. Contact us (زموږ سره اړیکه)
4. Settings (تنظیمات)

The second tab uses the application's existing Solar Hijri, Lunar Hijri and Gregorian date-conversion screen. It is not a newly invented or substituted calculator. The existing conversion inputs, calculation functions and leave-day rules are retained.

## Exact V22 changes

- Added the existing date-conversion screen as the second bottom-navigation section.
- Added a dedicated calendar icon to that tab.
- Each of the four bottom tabs has its own icon color; selecting a tab also changes its label, border and active underline to that tab's color.
- Removed the V21 date-conversion help/example panel and its example text. The old explanatory note is also removed.
- Did not modify the date-conversion algorithms or the leave-calculation / Friday-exclusion logic.

## Android APK

- Package: `com.hafz.offlinefinance.v22`
- Version code: `22`
- Version name: `2.2`
- Minimum Android: 6.0 / API 23
- Target SDK: 35
- Universal APK: the build is checked to contain no ABI-specific native libraries.

This APK is suitable for Android 6.0 and later across common phone brands and CPU architectures. It cannot install on Android versions below 6.0, and device policies or manufacturer restrictions may still block APK sideloading.

V22 uses a new package ID so it can be installed alongside V21 without an APK-signature update conflict. App data is stored separately and is not automatically migrated from V21. The current CI debug signing key is temporary; an in-place future update would require a persistent private signing key stored securely in GitHub Actions secrets.
