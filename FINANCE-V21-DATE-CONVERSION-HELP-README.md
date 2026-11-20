# Finance App V21 — Date Conversion Help

This branch is based on the verified V20 offline APK source. It makes one user-requested interface adjustment only: the existing always-visible date-conversion note becomes a compact help control.

## Exact change

- The date-conversion help starts hidden.
- Pressing the small question-mark help control reveals the supplied date example and explanation.
- Clicking anywhere outside the help closes it immediately, including another help control.
- Pressing Escape also closes the help.
- The help text follows the application's Pashto, Dari, Arabic, Urdu, and English language selection.
- The date values, conversion algorithms, leave calculator, Friday-exclusion rule, screens, settings, and all other application behavior are unchanged.

## Example shown in the Pashto help

1405/06/08 = 2026/08/30 = 1448/03/17

دا د ۱۴۰۵/۰۶/۰۸ د لمریزې نېټې برابرې میلادي او قمري نېټې دي.

قمري نتیجه د ام القری تقویم له مخې ده؛ که د موبایل WebView دا تقویم ونه پېژني، آفلاین حسابي بدیل کارېږي چې د ځايي سپوږمۍ لیدلو له مخې یوه یا دوه ورځې توپیر لرلای شي.

## Verification

The workflow restores and hash-verifies the original V18 HTML, reapplies the already-tested V20 leave calculator and Friday rule, applies only the click-to-open help, runs leave regression tests, runs direct interaction tests for the help visibility and closing behavior, checks JavaScript syntax, builds and verifies a universal Android APK.

- Package: com.hafz.offlinefinance.v21
- Version: 21 (2.1)
- Minimum Android: 6.0 / API 23
- Target SDK: 35
- ABI-specific native libraries: none.

This is a separate package from V20, so it can be installed alongside it. Local app data is not automatically migrated. The CI build uses a temporary debug signing key; retain the same APK when sharing this build. A future in-place update requires one persistent private signing key stored in encrypted build secrets, never in this public repository.