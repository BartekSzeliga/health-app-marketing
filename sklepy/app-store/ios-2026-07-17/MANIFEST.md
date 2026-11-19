# Diecik — materiały App Store iOS

Data przygotowania: 17.07.2026  
Język: polski  
Urządzenie źródłowe: iPhone 17 Pro Max, iOS Simulator 26.5  
Docelowy slot App Store Connect: slot wymagający 1242×2688 lub 1284×2778 px

## Screenshoty

Katalog gotowy do uploadu: `screenshots-app-store-1284x2778`

Wszystkie pliki są JPEG, 1284×2778 px i nie mają kanału alpha. Poprzedni
zestaw 1320×2868 px pozostaje zachowany w `screenshots-iphone-6.9`.

1. `01-dieta-i-trening-razem.jpg`
2. `02-twoj-tydzien-gotowy-w-chwile.jpg`
3. `03-posilki-dopasowane-do-ciebie.jpg`
4. `04-makro-pod-kontrola.jpg`
5. `05-plan-treningowy-w-kilka-chwil.jpg`
6. `06-kazda-seria-ma-swoj-cel.jpg`
7. `07-trening-zaplanowany-na-dzis.jpg`
8. `08-technika-krok-po-kroku.jpg`
9. `09-postepy-ktore-widac.jpg`
10. `10-dodawaj-bez-przepisywania.jpg`

## App Preview

Katalog gotowy do uploadu: `app-previews-app-store-aac`

Każdy plik ma jedną aktywną, cyfrowo cichą ścieżkę AAC-LC CBR stereo zgodną
z wymaganiami Apple. Poprzedni zestaw bez audio pozostaje zachowany w
`app-previews-iphone-6.9` i nie powinien być wysyłany do App Store Connect.

| Kolejność | Plik | Czas | Parametry |
| --- | --- | ---: | --- |
| 1 | `01-diecik-overview.mp4` | 22,000 s | H.264 High 4.0, 9,91 Mb/s, 886×1920, 30 fps, progressive; AAC-LC 255968 b/s, 48 kHz, stereo |
| 2 | `02-diet-generator.mp4` | 18,667 s | H.264 High 4.0, 9,89 Mb/s, 886×1920, 30 fps, progressive; AAC-LC 255962 b/s, 48 kHz, stereo |
| 3 | `03-training-generator.mp4` | 26,800 s | H.264 High 4.0, 10,00 Mb/s, 886×1920, 30 fps, progressive; AAC-LC 255974 b/s, 48 kHz, stereo |

## Scenariusz demonstracyjny

- Konto demonstracyjne nie używa prywatnych danych użytkownika i ma aktywny dostęp Premium.
- Dieta: wysokobiałkowa, 7 dni, 4 posiłki dziennie, szybkie i tanie propozycje.
- Trening: hipertrofia, 3 dni w tygodniu, 55 minut, poziom średniozaawansowany, trening domowy.
- Historia masy ciała: 7 demonstracyjnych pomiarów w 49 dni, łagodny trend 80,6 → 78,4 kg.

## QA i odtwarzalność

- Walidator: `automation/validate-assets.sh`
- Kompozycja screenshotów: `automation/compose-screenshots.js`
- Render App Preview: `automation/render-app-previews.sh`
- Plansza screenshotów: `qa/screenshots-contact-sheet-1284x2778.png`
- Próbki klatek App Preview:
  - `qa/01-diecik-overview-contact.png`
  - `qa/02-diet-generator-contact.png`
  - `qa/03-training-generator-contact.png`

Końcowy wynik walidatora: 0 błędów, 0 ostrzeżeń.

Walidator sprawdza osobno obraz i audio, w tym pełny decode obu strumieni,
profil AAC-LC, tag `mp4a`, bitrate, sample rate, stereo, włączone disposition
oraz zgodność długości. SHA-256 surowych strumieni H.264 jest identyczny
w starych i nowych plikach, więc podczas dodawania audio obraz nie został
ponownie skompresowany.

## Ważne przed wysłaniem do review

Konfiguracja aplikacji zawiera `ios.supportsTablet: false`, więc build nie deklaruje
obsługi iPada. Do wysłania użyj screenshotów z katalogu
`screenshots-app-store-1284x2778`, zgodnego z wymiarami pokazanymi przez aktualny
slot App Store Connect, oraz App Preview z katalogu
`app-previews-app-store-aac`.
