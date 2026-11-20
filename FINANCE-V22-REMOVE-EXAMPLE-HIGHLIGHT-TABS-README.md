# Finance App V22 — Date Example Removed and Active Tabs Highlighted

This version is based on the tested V21 offline Android source. It makes only the requested visible-interface changes and Android install-compatibility declarations.

## Requested changes

- The full date-equivalence example card is removed, including its heading, Gregorian/Solar/Lunar equality line, and explanatory sentence.
- The example is also removed from the click-only panel. The separate lunar-calendar caution remains available only when its help icon is tapped.
- The four existing bottom navigation buttons are retained in the same order: salary information, date conversion, contacts, and settings.
- When a section is selected, its own icon receives a clear color-matched glow, border, top marker and selected background. The existing `showSection` logic continues to control which one is active.
- The date conversion algorithm, leave calculator, Friday-exclusion logic, app structure, section contents and other app behavior are not changed.

## Android compatibility

- The APK remains universal and contains no ABI-specific native libraries.
- Minimum supported Android version remains Android 6.0 / API 23 because the app currently uses the AndroidX biometric library.
- Small, normal, large and extra-large screens are explicitly declared supported.
- Fingerprint hardware is optional, so devices without fingerprint hardware are not excluded from installation; biometric setup already reports unsupported hardware at runtime.
- No APK can be truthfully guaranteed to install on every Android phone. Android versions below 6.0, manufacturer restrictions, damaged/modified Android installations and policies blocking sideloaded apps may prevent installation. The build is checked for package metadata and universal native-library compatibility, but physical testing on every manufacturer/model is not possible.

## Build metadata

- Package: `com.hafz.offlinefinance.v22`
- Version: `22 (2.2)`
- Minimum Android: `6.0 / API 23`
- Target SDK: `35`
- Native ABI-specific libraries: none

The package ID is separate from V21, so V22 can be installed alongside V21. Local app data is not automatically migrated. The CI build uses a temporary debug signing key; a future in-place update must use one persistent private signing key stored in encrypted build secrets, never in this public repository.

## Verification

The workflow restores and verifies the original V18 HTML, applies the already-tested leave calculator and Friday-exclusion rule, applies the limited V22 UI patch, checks the four-tab selection logic and example removal, checks JavaScript syntax, builds a universal APK, verifies its signature and checks the Android compatibility declarations.