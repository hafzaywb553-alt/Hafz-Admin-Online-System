# Finance App V20 — Fridays Excluded from Leave

This branch preserves the Finance V18 offline Android application source and the already-built V19 leave calculator. It changes only the leave-day counting rule requested for V20.

## Existing application retained

- Existing V18 interface, page sections, settings, and visual style are kept as the verified source baseline.
- Existing Android WebView wrapper, biometric integration, app sharing, file provider, and download behavior are retained.
- The previously added leave calculator remains in the existing date-conversion section.
- The main branch and the published V19 release are not modified.

## V20 leave-day rule

- The user enters the number of actual leave days to count.
- A Friday is shown in the day-by-day schedule but is not deducted from the requested leave-day count.
- Saturday, Sunday, and all other weekdays continue to count normally; only Friday is excluded.
- If the start date is Friday, that first date is excluded and counting starts on the next non-Friday date.
- The end date is the last counted leave day, not the last Friday or the raw calendar span.
- The number of excluded Fridays is shown separately, and Friday rows are highlighted with a distinct red tone.
- The end date is shown in Solar Hijri, Lunar Hijri (using the existing application conversion function), and Gregorian calendars.

## Verification cases

The CI test checks Solar Hijri, Lunar Hijri, and Gregorian starts, validates continuous day-by-day rows, verifies that only Fridays are excluded, and checks the supplied-pattern example: 17 counted leave days starting Friday 2026-12-18 exclude 3 Fridays and end on Gregorian 2027-01-06.

## Android build

- Package: `com.hafz.offlinefinance.v20`
- Version: `20 (2.0)`
- Minimum Android: `6.0 / API 23`
- Target SDK: `35`
- ABI-specific native libraries: none; one universal APK is produced.

The new package ID allows the V20 app to be installed separately from V19; previous local data is not migrated. No APK can be guaranteed to install on every phone: iPhones, Android versions below API 23, and devices that block sideloading are outside this APK's install support. Real-device testing across manufacturers is still required.

## Signing

The CI workflow uses the Android debug signing certificate for this public test/release build. A future update that must install over this V20 without uninstalling should use one persistent private release keystore stored only in encrypted GitHub Actions secrets. Never add a keystore or its passwords to this public repository.

## Rebuild

Push source changes to this branch or run the GitHub Actions workflow **Build Finance V20 - Fridays Excluded from Leave**. It restores and SHA-256 verifies the original V18 HTML payload, adds the V19 leave calculator, applies the narrowly scoped Friday-exclusion rule, runs regression tests, builds a universal APK, verifies package/signature metadata, and publishes a GitHub Release asset.
