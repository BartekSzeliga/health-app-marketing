# Archiwalny szeroki plan publikacji materiałów Diecik

> Status: zastąpiony. Aktywny zakres obejmuje wyłącznie Meta, TikTok i YouTube Shorts. Aktualny plan znajduje się w `strategia/social-publishing-plan.md`.

Data weryfikacji: 18 lipca 2026  
Zakres: App Store, Google Play, Meta, TikTok, YouTube/Google Ads oraz LinkedIn

## Decyzja

Nie tworzymy kolejnego uniwersalnego pakietu reklamowego. Każdy materiał ma mieć przed renderem przypisane:

`odbiorca → kanał → placement → cel → format → CTA → audio → miejsce uploadu`

Obecnych filmów `marketing/output-v8/**/*-9x16.mp4` z syntetycznym lektorem nie należy publikować. Nie próbujemy ratować głosu filtrem lub modulacją. Wersje muted są materiałem montażowym, ale nie finalną reklamą TikTok i nie są materiałem App Store.

## Co jest gotowe do użycia

| Materiał | Status | Gdzie można użyć |
|---|---|---|
| `sklepy/app-store/ios-2026-07-17/app-previews-app-store-aac/*.mp4` | Gotowe | App Store Connect — App Preview |
| `sklepy/app-store/ios-2026-07-17/screenshots-app-store-1284x2778/*.jpg` | Gotowe dla aktualnie wybranego slotu 6.5" | App Store Connect — Screenshots |
| `sklepy/app-store/ios-2026-07-17/screenshots-iphone-6.9/*.jpg` | Gotowe dla slotu 6.9" | App Store Connect — Media Manager, jeżeli wybrany jest slot 6.9" |
| `sklepy/google-play/android-2026-07-18/screenshots-phone-1080x1920/*.jpg` | Gotowe | Google Play — Phone screenshots |
| `marketing/output-v8/consumer/assets/*-hero-4x5.jpg` | Gotowe | Instagram/Facebook Feed, testy Meta Single Image |
| `marketing/output-v8/trainer/assets/diecik-trener-v8-hero-4x5.jpg` | Gotowe | LinkedIn post oraz LinkedIn Single Image Ad na mobile |
| `marketing/output-v8/**/*-9x16.mp4` z lektorem | Nie publikować | Głos do wymiany; filmy są wyłącznie referencją montażową |
| `marketing/output-v8/**/*-muted.mp4` | Nie publikować jako finalne | Baza do nowego montażu, rytmu, muzyki i efektów |
| `marketing/output-v8/**/*.wav` | Odrzucone | Nie używać |

## 1. App Store — strona aplikacji

### Cel

Konwersja osoby, która już trafiła na kartę aplikacji. To nie jest reklama lifestyle ani social media.

### Gdzie wejść

`App Store Connect → Apps → Diecik → Distribution → wersja iOS → język polski → App Previews and Screenshots → iPhone`

### Co wrzucić

1. App Preview, w tej kolejności:
   - `01-diecik-overview.mp4`
   - `02-diet-generator.mp4`
   - `03-training-generator.mp4`
2. Dziesięć screenshotów od `01-...` do `10-...`.
3. Po przetworzeniu wejść w `View All Sizes in Media Manager` i sprawdzić właściwy slot urządzenia.
4. Ustawić czytelną klatkę poster frame każdego filmu.

### Właściwe pliki

- Preview: `sklepy/app-store/ios-2026-07-17/app-previews-app-store-aac`
- Screenshoty dla slotu, który wcześniej wymagał 1242×2688 lub 1284×2778:
  `sklepy/app-store/ios-2026-07-17/screenshots-app-store-1284x2778`
- Jeżeli Media Manager pokazuje aktualny slot 6.9":
  `sklepy/app-store/ios-2026-07-17/screenshots-iphone-6.9`

### Audio i copy

- Zostawić prawidłową, cyfrowo cichą ścieżkę AAC w już przygotowanych preview.
- Nie dodawać syntetycznego lektora. App Preview domyślnie startuje bez dźwięku.
- Obraz i napisy muszą samodzielnie wyjaśniać funkcję.
- Materiał musi pokazywać faktyczny interfejs aplikacji; lifestyle z `output-v8` nie nadaje się tutaj.

### Promotional Text

Na stronie wersji iOS, w polskiej lokalizacji:

> Zaplanuj dietę i trening w jednym miejscu. Rozpoznawaj składniki ze zdjęcia, twórz tygodniowe plany i monitoruj postępy. Wybrane funkcje wymagają Premium.

Po pierwszym zatwierdzeniu aplikacji warto utworzyć trzy Custom Product Pages:

- `photo-ai`
- `weekly-plan`
- `training`

Każda dostanie osobne screenshoty, copy i URL do konkretnej kampanii reklamowej.

## 2. Google Play — główna strona aplikacji

### Gdzie wejść

`Play Console → Diecik → Grow users / Rozwijaj bazę użytkowników → Store presence / Obecność w sklepie → Main store listing / Główna strona aplikacji → Graphics / Grafika`

### Screenshoty

W polu Phone screenshots przesłać osiem plików z:

`sklepy/google-play/android-2026-07-18/screenshots-phone-1080x1920`

Nie przesyłać tam grafik hero 1080×1350. Screenshoty sklepu mają pokazywać aktualny produkt, a nie reklamowe CTA.

### Preview video

Google Play nie przyjmuje tutaj MP4 bezpośrednio. Potrzebny jest URL YouTube.

Nowy materiał do wykonania:

- `google-play/preview/diecik-google-play-preview-25s-16x9.mp4`
- 1920×1080, 20–25 sekund;
- minimum 80% faktycznego UI;
- pierwsze 10 sekund pokazuje dieta → trening;
- końcówka pokazuje progres;
- bez CTA „Wypróbuj za darmo”;
- bez lektora, z subtelnym sound designem i czytelnymi napisami;
- musi działać również przy autoplay bez dźwięku.

Publikacja:

1. `YouTube Studio → CREATE → Upload videos`.
2. Ustawić film jako Publiczny.
3. Wyłączyć monetyzację.
4. Zezwolić na osadzanie.
5. Nie ustawiać ograniczenia wiekowego.
6. Wrócić do `Main store listing → Graphics → Preview video`.
7. Wkleić URL YouTube.

## 3. Meta — użytkownicy aplikacji B2C

Meta jest pierwszym płatnym kanałem, który należy uruchomić dla zwykłych użytkowników.

### Organiczne Instagram i Facebook

#### Reels

- Instagram: `Utwórz → Rolka → wybierz film → okładka → opis → Udostępnij`
- Facebook Page: `Wideo → Reels → Utwórz rolkę → Dodaj wideo → Opublikuj`
- Format: 1080×1920, 9:16, 15 sekund.

#### Feed

- Instagram: `Utwórz → Post → wybierz grafikę → Udostępnij`
- Facebook Page lub Meta Business Suite: `Utwórz post → Zdjęcie/Wideo`
- Format: 1080×1350, 4:5.
- Można wykorzystać trzy obecne hero konsumenckie.

### Meta Ads Manager

Ścieżka:

`Meta Ads Manager → + Utwórz kampanię → Promocja aplikacji → zestaw reklam → Umiejscowienia → reklama → Pojedynczy obraz lub film → Multimedia`

Na poziomie reklamy użyć dostosowania zasobów do umiejscowień:

- Instagram Reels, Facebook Reels i Stories: 1080×1920;
- Instagram/Facebook Feed: 1080×1350;
- CTA systemowe: `Zainstaluj`;
- link: właściwy store URL albo później URL Custom Product Page Apple.

### Nowe materiały Meta

| Kampania | Reels/Stories | Feed video | Feed image | CTA |
|---|---|---|---|---|
| Zdjęcie posiłku | 1080×1920, 15 s | 1080×1350, 15 s | obecny hero 4:5 | Zainstaluj |
| Plan tygodnia | 1080×1920, 15 s | 1080×1350, 15 s | obecny hero 4:5 | Zainstaluj |
| Trening | 1080×1920, 15 s | 1080×1350, 15 s | obecny hero 4:5 | Zainstaluj |

Audio:

- bez narracji jako wariant podstawowy;
- licencjonowana muzyka z Meta Sound Collection;
- subtelne efekty zsynchronizowane z przejściami i akcjami UI;
- wypalone napisy;
- przekaz musi być kompletny także po wyciszeniu.

## 4. TikTok — organic najpierw, reklama później

Nie należy zaczynać od wgrywania „reklamowego spotu” jako Non-Spark Ad. Najpierw publikujemy trzy naturalniejsze filmy organiczne i promujemy ten, który najlepiej utrzymuje uwagę.

### TikTok organiczny

Na Macu:

`tiktok.com/tiktokstudio → Upload`

Alternatywnie w aplikacji:

`+ → Upload → Dalej → opis → Opublikuj`

Nowe pliki:

- `tiktok/organic/diecik-photo-15s-9x16.mp4`
- `tiktok/organic/diecik-week-15s-9x16.mp4`
- `tiktok/organic/diecik-training-15s-9x16.mp4`

Format:

- 1080×1920;
- 12–15 sekund;
- szybszy, bardziej naturalny montaż niż Meta;
- prawdziwa interakcja z aplikacją w pierwszej sekundzie;
- tekst poza interfejsem TikTok;
- muzyka z TikTok Commercial Music Library;
- bez syntetycznego voice-over.

### TikTok Ads

Po publikacji organicznej:

`TikTok Ads Manager → Create ad → App Promotion → App Install → Identity → konto Diecik → wybierz istniejący post`

Uruchomić najlepszy organiczny post jako Spark Ad.

TikTok wymaga w reklamie wyraźnego audio. Wersja muted nie jest finalnym materiałem reklamowym. Muzyka z Commercial Music Library wraz z efektami i tekstem ekranowym jest właściwym domyślnym rozwiązaniem.

## 5. YouTube Shorts i Google Ads

### YouTube Shorts organic

`YouTube Studio → CREATE → Upload videos`

Nowe pliki:

- `youtube-shorts/diecik-photo-15s-9x16.mp4`
- `youtube-shorts/diecik-week-15s-9x16.mp4`
- `youtube-shorts/diecik-training-15s-9x16.mp4`

Ustawienie: Publiczny.

Audio:

- muzyka z YouTube Audio Library albo własne audio z pełnymi prawami;
- wypalone napisy;
- bez syntetycznego lektora.

Nie używać muzyki licencjonowanej wyłącznie w narzędziu Shorts jako mastera do Google Ads lub Google Play.

### Google Ads — App Campaign

Ścieżka:

`Google Ads → Campaigns → + → New campaign → App promotion → App installs → wybór Android/iOS i aplikacji → Ad groups → Ad assets`

Wideo dodaje się jako URL YouTube, nie lokalny plik.

Nowe materiały:

- trzy pionowe wideo 1080×1920, 15 sekund, z audio wyczyszczonym prawnie;
- trzy obrazy 1200×1500, 4:5;
- obrazy Google Ads powinny mieć minimalną ilość tekstu — najlepiej lifestyle + prawdziwy UI + logo.

Film trenerski nie trafia do kampanii instalacyjnej aplikacji konsumenckiej.

## 6. LinkedIn — trenerzy i dietetycy

LinkedIn jest głównym kanałem dla produktu trenerskiego.

### Post organiczny

`LinkedIn Page → widok administratora → Page posts → Start a post → Video albo Photo → wybierz plik → Post`

Obecny hero:

`marketing/output-v8/trainer/assets/diecik-trener-v8-hero-4x5.jpg`

może zostać użyty jako pierwszy organiczny post obrazowy.

Nowy film organiczny:

- 1080×1350, 4:5;
- 25–30 sekund;
- proces: klient → tydzień → dieta i trening → PDF/aplikacja;
- wypalone polskie napisy;
- bez syntetycznego lektora;
- CTA w treści posta: `Zobacz, jak działa Diecik Trener: diecik.pl/trener`.

### LinkedIn Campaign Manager

Ścieżka:

`Campaign Manager → utwórz kampanię/ad set → Ads in this ad set → Create new ad → Upload → Headline → Destination URL → CTA → Save`

Nowe materiały:

- film 1080×1350, 30 sekund, 25 FPS;
- hero 1080×1350 jako Single Image Ad na mobile;
- dodatkowy obraz 1200×1200 dla szerszej emisji;
- opcjonalnie 1200×628 dla desktopu.

CTA systemowe: `Dowiedz się więcej`  
Destination URL: `https://diecik.pl/trener`

Obecny film 1080×1920/30 FPS nie jest wariantem LinkedIn Ads: LinkedIn literalnie wymaga mniej niż 30 FPS, a 18-sekundowy materiał będzie zapętlany.

## Strategia audio

### Wariant bazowy — rekomendowany

Bez narracji:

- muzyka dopasowana do kanału i z prawami do danego użycia;
- krótkie efekty interfejsu i przejść;
- rytm montażu wynikający z akcji w aplikacji;
- wypalone napisy;
- przekaz zrozumiały przy wyciszeniu.

### Wariant A/B

Prawdziwy polski lektor:

- najpierw jedna próbka 8–10 sekund;
- akceptacja barwy, tempa i emocji przed nagraniem całego zestawu;
- osobne czytanie B2C i B2B;
- czyste nagranie, bez agresywnej kompresji i bez „radiowej” przesady.

Nie generujemy całej paczki przed akceptacją próbki głosu.

## Kolejność wdrożenia

### Etap 1 — sklepy

1. Wgrać gotowy zestaw App Store.
2. Wgrać osiem gotowych screenshotów Google Play.
3. Przygotować jeden nowy Google Play preview 20–25 sekund.

### Etap 2 — organic

1. Opublikować trzy Reels na Instagramie i Facebooku.
2. Opublikować trzy TikToki.
3. Opublikować trzy YouTube Shorts.
4. Opublikować hero oraz jeden film trenerski na LinkedIn.

### Etap 3 — paid

1. Meta App Promotion — trzy kampanie B2C.
2. Najlepszy TikTok promować jako Spark Ad.
3. Google App Campaign po podłączeniu prawidłowego pomiaru instalacji.
4. LinkedIn Ads osobno dla trenera.

Przed etapem paid należy zweryfikować:

- linki App Store i Google Play;
- UTM-y dla strony trenera;
- pomiar instalacji i zdarzeń;
- strony docelowe;
- politykę prywatności i zgody;
- prawa do całego audio.

## Docelowa struktura `marketing/output-v9`

```text
output-v9/
├── 00-START-HERE.md
├── app-store/
│   ├── previews/
│   ├── screenshots/
│   ├── metadata/
│   └── UPLOAD-INSTRUCTIONS.md
├── google-play/
│   ├── screenshots/
│   ├── preview/
│   └── UPLOAD-INSTRUCTIONS.md
├── meta/
│   ├── reels-stories/
│   ├── feed-video/
│   ├── feed-image/
│   └── UPLOAD-INSTRUCTIONS.md
├── tiktok/
│   ├── organic/
│   ├── ads-master/
│   └── UPLOAD-INSTRUCTIONS.md
├── youtube-shorts/
├── google-ads/
├── linkedin-trainer/
│   ├── organic/
│   ├── ads/
│   └── UPLOAD-INSTRUCTIONS.md
└── qa/
```

Każdy `UPLOAD-INSTRUCTIONS.md` ma zawierać dokładny panel, kolejność plików, copy posta/reklamy, CTA, URL oraz checklistę po uploadzie.

## Oficjalne źródła

- Apple App Preview i upload:
  - https://developer.apple.com/app-store/app-previews/
  - https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications
  - https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Google Play:
  - https://support.google.com/googleplay/android-developer/answer/9866151
  - https://support.google.com/googleplay/android-developer/answer/15501235
- Google Ads i YouTube Shorts:
  - https://support.google.com/google-ads/answer/16041697
  - https://support.google.com/youtube/answer/12779649
- TikTok:
  - https://ads.tiktok.com/help/article/how-to-use-app-promotion
  - https://ads.tiktok.com/help/article/ad-set-up
  - https://ads.tiktok.com/help/article/tiktok-ads-policy-ad-format-and-functionality
- Meta:
  - https://www.facebook.com/business/ads/facebook-instagram-reels-ads
  - https://www.facebook.com/help/instagram/225190788256708
  - https://www.facebook.com/help/instagram/1038071743007909
- LinkedIn:
  - https://www.linkedin.com/help/lms/answer/a424737
  - https://www.linkedin.com/help/linkedin/answer/a426534
  - https://www.linkedin.com/help/linkedin/answer/a7174587
