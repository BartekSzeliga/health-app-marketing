# Android native screenshot handoff — 2026-10-30

## Completed

- [x] Preserve original AVD data using an APFS clone named `Diecik_Store_Promo_QA_20261030`.
- [x] Run actual Android Expo SDK57 development client with current canonical React Native JS, own IPv4 Metro8089, and local API8086/Keycloak8080.
- [x] Navigate the native app only through CUA Android Studio Running Devices.
- [x] Capture eight raw native PNGs, each 1280×2856 RGBA, and verify their SHA256 values.
- [x] Visually review all eight sources in `native-final-contact-sheet.png`.
- [x] Stop own Metro8089 and own emulator. Original AVDs and root services retained.

## Final source directory

`output/store-promo/2026-10-30/source/native-current/android/`

1. `01-own-diet.png` — own diet with actual recipe photos, macro summary and rounded recipe quantities.
2. `02-generator-config.png` — actual generator configuration, active Premium, all diet types available, four meals and seven days. No claim that a plan was successfully saved.
3. `03-recipe-ingredients.png` — actual recipe ingredients 50/120/10/10g and preparation steps.
4. `04-training-plan.png` — actual four-exercise, twelve-set, forty-five-minute plan with three sets of ten reps.
5. `05-exercise-instruction.png` — actual native instruction with human exercise video/poster.
6. `06-progress-weight.png` — seven actual synthetic local weight entries with modest fluctuations.
7. `07-specialist-diet.png` — actual published local specialist diet with photos and macros.
8. `08-shopping-list.png` — actual weekly shopping list with two checked items and real food quantities.

## Generator issue discovered while capturing

An actual seven-day preview for 2026-11-09–2026-11-15 was generated. Saving it failed with the native message:

> Porcje w podglądzie nie odpowiadają przepisowi lub dopuszczalnej wielkości posiłku. Wygeneruj ten dzień ponownie. Plan nie został zmieniony.

Evidence: `generator-save-validation-error.png` and matching JSON. The unsaved preview was discarded through the native UI. Existing October30–November1 fixture data was not overwritten. Root explicitly selected the authentic configuration screen for promotional frame02. No generator source changes, false success, error masking or repeated save attempts were made. Generator repair remains outside this marketing task.

## Provenance limits

`final-source-manifest.json` records eight immutable source hashes. The source-working-tree snapshot hash68b0… was observed after the first bundle and is not proof of exact previously loaded bytes. Metro read the canonical workspace directly with automatic reloads disabled through CI. Another console changed seventeen files compared with the iOS source snapshot; see `ios-js-match.json`. Do not claim one identical iOS/Android source tree or a frozen source checkout.

`served-bundle-proof.json` records a read-only observation of the Android launchAsset served by the existing Metro instance. Its observed SHA256 is24d41ea625456b726b412bfb4950bd8d03af4f0eac50bd9846c9decee7b13490. This is the served response at observation time, not an assertion of historical device-loaded bytes.

Only original native screenshot pixels are handed off. No Expo Web, archived app screenshots, fake device UI, repainted text, modified app source, production writes or store-console actions were used by this capture agent. `cleanup.json` verifies the owned emulator and Metro are stopped.
