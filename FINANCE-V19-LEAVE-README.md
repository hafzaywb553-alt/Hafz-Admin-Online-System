# Finance App V19 — Leave Calculator

This branch preserves the verified Finance V18 offline Android app project and adds a leave-duration calculator inside the existing Date Conversion section.

## What is retained

- Existing V18 app HTML and its established visual structure.
- Existing Android WebView wrapper, biometric integration, sharing, download and FileProvider code.
- Existing offline app resources and the verified original compressed HTML payload.
- Existing app settings and all other application sections.

## New feature

- Start-date calendar selector: Solar Hijri, Lunar Hijri (Umm al-Qura when available), or Gregorian.
- Start date and leave-day count fields.
- Automatic last-day result in all three calendars.
- Inclusive counting: the start date is day 1.
- Total Friday count and a day-by-day schedule.
- Friday rows are highlighted with a distinct color.
- Pashto, Dari, Arabic, Urdu and English labels.
- A final slash in a date input is accepted.

## Android build

The CI workflow restores the original V18 HTML payload and verifies its SHA-256 before applying the scoped patch. It then tests the leave calculations, builds the Android WebView wrapper and verifies the APK signature and package metadata.

- Package: `com.hafz.offlinefinance.v19`
- Version: `19 (1.9)`
- Minimum Android: `6.0 / API 23`
- Target SDK: `35`
- ABI-specific native libraries: none; one universal APK is produced.

The new package ID allows this fresh installation to coexist with the prior V18 app and avoids the old signing-certificate update conflict. Local app data is not migrated.

## Important compatibility note

No APK can be guaranteed to install on every phone. This build targets Android 6.0 and newer. It cannot install on iPhones or Android versions below API 23, and device security policies or damaged installer services may still block sideloading. The CI checks verify package structure and signing; they do not replace testing on physical devices from different manufacturers.

## Signing for future updates

The published APK is signed by the GitHub Actions runner's debug certificate. This is valid for a fresh sideload installation, but a later build from a different runner may use a different debug certificate. To update V19 in place without uninstalling it, configure one persistent private release keystore through GitHub Actions encrypted secrets and reuse it for every release. Never commit the keystore or its passwords to this public repository. Until that is configured, a future APK signed with a different certificate may require uninstalling the previous V19 first.

## Rebuild

Push changes to this branch or run the GitHub Actions workflow named **Build Finance V19 Leave Calculator APK**. The workflow publishes the APK as both an Actions artifact and a GitHub Release asset.
