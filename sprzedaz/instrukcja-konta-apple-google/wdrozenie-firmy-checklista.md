# Wdrożenie aplikacji firmy w sklepach — lista kroków i czasy

Pierwszy przebieg: 2026-11-18, aplikacja demo „Forma Studio” (`pl.diecik.company.demo`, tenant `demo`),
na kontach Bartosza (Apple: konto indywidualne SG72C4GL94, Google: „Bartosz Szeliga”, Expo: `szebartek`, plan darmowy).
Czasy = zegar od kliknięcia do gotowego kroku. Kolejni klienci: robić w tej kolejności.

## 0. Przed startem (zależności, które wyszły w praniu)
- [x] Backend z modułem `companyapp` wdrożony na środowisko, na które celuje build (prod: `api.diecik.com`).
- [x] Klient Keycloak firmy (`company-<slug>-mobile`) na `auth.diecik.com` z redirectem `<bundleId>://oauth/callback`
      (`ops/keycloak/configure-brand-client.sh`). **Bez tego aplikacja ze sklepu nie zaloguje — review odrzuci.**
      Ręcznie (~3 min, demo dodane 19.11): Clients → Create client, OpenID Connect, Client authentication Off,
      tylko Standard flow, PKCE S256, Valid redirect URIs `<bundleId>://oauth/callback`, post logout `+`, Web origins
      puste. Test: `/realms/health-realm/protocol/openid-connect/auth?client_id=…&redirect_uri=…` zwraca stronę
      logowania (200), obcy redirect → 400, brak `code_challenge` → `invalid_request`.
      **Marka strony logowania:** Settings → Name = nazwa firmy (np. „Forma Studio”), Advanced → Fine grain OpenID
      Connect → Logo URL = adres z panelu admina (firma → Aplikacja mobilna firmy → „Logo na stronie logowania”, przycisk
      Kopiuj; logo wgrywa firma w Ustawieniach firmy). Działa tylko dla
      klientów `company-*`; wymaga Keycloaka z providerem `diecik-branding` z 19.11.2026 lub nowszym.
- [x] W adminie Diecika: firma ma przypisaną aplikację (Klient Keycloak + Bundle ID) i zaakceptowaną umowę powierzenia
      (z niej powstaje polityka prywatności).

## 1. Expo (EAS)
| Krok | Kto | Czas |
|---|---|---|
| `TENANT=<slug> npx eas-cli credentials -p ios` → tworzy projekt EAS. Przy dynamicznym `app.config.js` EAS nie zapisze `projectId`: wpisać `eas.projectId` i `eas.owner` w `tenants/<slug>/tenant.json` i powtórzyć | Bartosz + agent | ~5 min |
| To samo polecenie: logowanie Apple ID (hasło + 2FA na telefonie), „Build Credentials → All”. Certyfikat dystrybucyjny konta jest współdzielony (był z kwietnia), profil App Store nowy | Bartosz (wymaga telefonu) | ~3 min |
| `TENANT=<slug> npx eas-cli build -p ios -e production --non-interactive --no-wait` | agent | 1 min (+ build w chmurze) |

## 2. App Store Connect
| Krok | Kto | Czas |
|---|---|---|
| Apps → + → New App: iOS, nazwa, język **Polish**, Bundle ID (pojawia się po kroku EAS), SKU `company-<slug>-…`, Full Access. Uwaga: listy wyboru to natywne `select` — wybierać klawiaturą | agent | ~10 min (pierwszy raz, z błędami UI) |
| App Privacy: URL polityki (demo: `https://diecik.com/privacy`; firma: wygenerowany adres z panelu „Dokumenty aplikacji”), typy danych: Imię, E-mail, Zdrowie, Fitness, Wiadomości, Inne treści użytkownika, User ID — wszystkie „App Functionality”, powiązane z tożsamością, **bez śledzenia** (inaczej niż Diecik: brak Meta SDK, zakupów, zdjęć). Publish | agent | ~8 min |
| App Information: podtytuł („Dieta i trening od specjalisty”), kategoria Health & Fitness + Food & Drink, Content Rights „nie”, Save | agent | ~3 min |
| Age Rating: wszystko „nie/brak” poza Messaging and Chat = tak, Health or Wellness Topics = tak → 9+ | agent | ~3 min |
| Pricing: Darmowa (0,00), dostępność **tylko Polska** (wszystkie kraje = wymóg dokumentów dla Chin) | agent | ~4 min |
| Wysyłka do TestFlight: `eas submit -p ios --id <build>` — używa sesji Apple z kroku credentials (ważna kilka dni) i istniejącego klucza ASC API „[Expo] EAS Submit” (odpowiedź „y”). Na darmowym planie Expo kolejka wysyłki ~15+ min | agent | 2 min + kolejka |

## 3. Google Play Console (konto organizacji — bez wymogu 14 dni testów zamkniętych z 12 testerami)
| Krok | Kto | Czas |
|---|---|---|
| Utwórz aplikację: nazwa, pakiet = bundleId, język **polski – pl-PL**, Aplikacja, Bezpłatna, 2 oświadczenia | agent | ~4 min |
| Build Androida: `TENANT=<slug> npx eas-cli build -p android -e production --non-interactive --no-wait` (EAS sam tworzy keystore przy pierwszym buildzie) | agent | 1 min + build |
| Zawartość aplikacji — Polityka prywatności (URL) | agent | 2 min |
| Reklamy: Nie · Identyfikator reklamowy: Nie (aplikacja firmy nie ma Meta SDK ani AD_ID) · Aplikacje instytucji państwowych: Nie · Funkcje finansowe: brak | agent | ~5 min |
| Aplikacje do dbania o zdrowie: „Aktywność i fitness” + „Odżywianie i kontrola wagi” | agent | 2 min |
| Oceny treści (IARC): e-mail kontaktowy, „Wszystkie inne typy aplikacji”, wszystko „Nie” poza: komunikacja tekstowa = Tak, interakcje tylko z zaproszonymi = Tak → „Wszystkie grupy wiekowe” | agent | ~5 min |
| Status przedsiębiorcy: Tak (dziedziczony z konta) + URL regulaminu | agent | 2 min |
| Bezpieczeństwo danych: szyfrowanie = Tak; konto: login i hasło; URL usunięcia konta i danych; typy: Nazwa, E-mail, ID użytkownika (wymagane; funkcje + zarządzanie kontem), Zdrowie, Aktywność fizyczna, Wiadomości w aplikacji, Inne treści (opcjonalne; funkcje). **Przesłanie możliwe dopiero po „Docelowi odbiorcy”** → zapisane jako wersja robocza | agent | ~12 min |
| Karta sklepu: krótki i pełny opis, ikona 512 (PNG RGBA), grafika 1024×500, 3 zrzuty **9:16** (np. 1080×1920 — 1:2 odrzuca), „nie oznaczaj zasobów jako AI” | agent | ~15 min |
| Ustawienia sklepu: kategoria Zdrowie i fitness, e-mail, strona | agent | 3 min |

## 4. Czego agent nie zrobi — do zrobienia przez Bartosza / przed wydaniem
- [x] **Produkcja (19.11):** wdrożenie backendu z `companyapp` + klient Keycloak firmy na `auth.diecik.com`. Dziś build produkcyjny nie zaloguje
      (klient `company-demo-mobile` nie istnieje na prod — sprawdzone 2026-11-19, kod 400).
- [x] **Konto do review** (Apple „Sign-In Information”, Google „Dane logowania”): login + hasło konta testowego na prod,
      połączonego z firmą demo, z planem diety. Agent nie wpisuje haseł.
      **Jedno konto platformy dla wszystkich firm:** `forma-demo@diecik.invalid` jest klientem naszej firmy demo
      „Forma Studio”, a backend (`APP_COMPANY_APP_REVIEW_ACCOUNTS`, w prod `application-prod.yml`) traktuje je jako
      klienta każdej aplikacji firmowej: ustawienia i dokumenty tej firmy, plany z naszej firmy demo. Firma nie
      zakłada fałszywego klienta i tego konta nie widzi. Dla kolejnej firmy wpisujemy te same dane logowania. Dopiero po „Danych logowania” Google pokaże
      „Docelowi odbiorcy” (wybrać 18+), a potem da się przesłać „Bezpieczeństwo danych”.
- [x] **Apple, kontakt do review:** imię, nazwisko, telefon, e-mail (App Review Information).
- [x] **Google, wysyłka AAB (19.11, ręcznie przez Bartosza):** wersja 2 (1.0.0) opublikowana w Testy wewnętrzne,
      „Dostępna dla testerów wewnętrznych”, niesprawdzona. Ścieżka „Nieaktywne”, dopóki w zakładce Testerzy nie
      zaznaczy się listy e-mailowej (np. „Diecik lista”) i nie zapisze. Do czasu review testerzy widzą nazwę
      tymczasową „pl.diecik.company.demo (unreviewed)”.
- [ ] **Google, wysyłka AAB (wariant automatyczny na kolejne firmy):** na koncie Expo nie ma klucza konta usługi Google (EAS Submit) — utworzyć w Google Cloud
      (rola w Play Console: Release Manager) albo przeciągnąć plik AAB ręcznie do Testy wewnętrzne → Utwórz wersję.
      AAB ma ~64 MB (przeglądarkowe wysyłanie przez agenta ma limit 10 MB).
- [ ] Zrzuty: z buildu deweloperskiego widać przycisk „Tools” — zamaskowany; docelowo robić zrzuty z buildu produkcyjnego
      (lub wariantu preview) z kontem demo, iPhone 6,3″ (1206×2622) przyjmowany jako rozmiar bazowy.

## 5. Treść konta demo (raz na platformę, nie dla każdej firmy)
Firma demo „Forma Studio” na koncie kontakt@diecik.com, karta „Anna Demo” połączona z `forma-demo@diecik.invalid`
(połączenie jednorazowo w bazie, opis w `tasks/todo.md`, 2026-11-19).
| Krok | Kto | Czas |
|---|---|---|
| Pakiet „Plan startowy” na **14 dni** (review trwa do tygodnia; plan nie może wygasnąć w trakcie): Zakres → Dieta → Wygeneruj (5 posiłków, standard) → Zastosuj podgląd | agent | ~4 min |
| Trening „Całe ciało A” (3 ćwiczenia z katalogu, 3×10) + „Kopiuj dzień” na kolejne terminy w zakresie (21.11, 24.11, 27.11, 1.12) → Sprawdź i wyślij → **Opublikuj w aplikacji** (bez maila) | agent | ~8 min |
| Ankieta: w firmie wymaga zakresu pracy z Gabinetem (Zespół → Dane specjalisty w firmie → „Gabinet, dietetyka i trening”), potem karta → Gabinet → Wywiad → Wyślij ankietę („Cotygodniowy check-in”) | agent | ~5 min |
| Nazwa opiekuna widoczna dla recenzenta: „Anna Kowalska — dietetyk” (zamiast „diecik-specjalista”) | agent | 1 min |
| Zgoda na dane zdrowotne na koncie demo: w aplikacji Profil → waga, wzrost, wiek, płeć, aktywność + zgoda → Zapisz. Bez zgody backend nie oddaje pomiarów (403), a postępy specjalisty są puste | Bartosz (zalogowany jako demo) | ~2 min |
| **Odświeżać przed każdym review:** nowy pakiet, gdy obecny się kończy (2.12.2026) | agent | ~10 min |

## 6. Wysyłka do review (19.11)
| Krok | Kto | Czas |
|---|---|---|
| Google „Dane logowania”: Tak → Dodaj szczegóły: nazwa „Reviewer account”, login `forma-demo@diecik.invalid`, hasło (Bartosz), instrukcja EN (bez 2FA, konto demo z dietą/treningiem/ankietą/czatem, brak rejestracji i zakupów), zaznaczyć „pełny dostęp” | agent + Bartosz (hasło) | ~4 min |
| Apple App Review Information: Sign-in required, User name jw., Password (Bartosz), Contact Information (Bartosz), Notes EN jak wyżej + „Account deletion: More > Delete account” | agent + Bartosz | ~4 min |
| Test buildu iOS przed review: TestFlight → Internal Testing „Team (Expo)” (EAS dodaje konto Bartosza). Status testera „Invited” = zaproszenie nieprzyjęte; aplikacja nie pojawi się w TestFlight, dopóki nie klikniesz linku z maila **na iPhonie z tym samym Apple ID**. Brak maila → zaznacz testera → Reinvite | Bartosz | ~3 min |
| Google „Docelowi odbiorcy i treści”: **18 lub więcej** → Dalej → Zapisz (od razu do podsumowania) | agent | 1 min |
| Google „Bezpieczeństwo danych”: otworzyć wersję roboczą → Dalej ×4 → Zapisz (odpowiedzi z kroku 3 zostają) | agent | 2 min |
| Apple App Compliance → **Declare Regulated Medical Device: No** (nowa deklaracja 2026 dla UE/UK/US; aplikacja dietetyczna to nie wyrób medyczny). Wpisy „China mainland” (Security Assessment, AIGC) pomijamy — sprzedaż tylko w Polsce | agent | 1 min |
| Google Produkcja → Kraje/regiony → wyszukaj „Polska” → zaznacz → Zapisz | agent | 2 min |
| Google Produkcja → Utwórz nową wersję → **Dodaj z biblioteki** (AAB z testów wewnętrznych, bez ponownego wgrywania) → informacje o wersji `<pl-PL>…</pl-PL>` → Dalej → Zapisz | agent | 3 min |
| Przegląd publikowanych zmian: Google robi szybkie testy (do 14 min), potem „Prześlij N zmian do sprawdzenia”. **Publikowanie zarządzane jest wyłączone → po akceptacji aplikacja wchodzi do sklepu sama**; włączyć je, jeśli firma ma zatwierdzić termin | Bartosz (zgoda) | 1 min |
| Apple: Add for Review → Submit for Review. Wydanie ustawione na ręczne | Bartosz (zgoda) | 2 min |

**Dokumenty demo vs firma:** dla demo zostają `diecik.com/privacy`, `/terms`, `/account-deletion` (Forma Studio nie jest
podmiotem prawnym). Dla prawdziwej firmy: wygenerowane `https://api.diecik.com/api/public/company-app/organizations/<id>/{privacy-policy|terms|account-deletion}`
(działają po przypisaniu aplikacji; treść szablonu `CompanyAppLegalTemplates` do przeglądu prawnika przed pierwszą firmą).

## 6a. Wysyłka buildów do sklepów przez EAS (bez ręcznego wgrywania)
| Krok | Kto | Czas |
|---|---|---|
| Profil `submit.<slug>-production` w eas.json: `ios.ascAppId` (ID aplikacji z App Store Connect), `android.track: production`, `releaseStatus: draft` | agent | 1 min |
| Play Console firmy → Użytkownicy i uprawnienia → Zaproś `eas-submit@sage-inquiry-447217-k7.iam.gserviceaccount.com` → aplikacja firmy: wersje produkcyjne, ścieżki testów, zarządzanie ścieżkami, wersje robocze (resztę Google dobiera sam) | agent | 3 min |
| Klucz JSON konta usługi (Google Cloud „Diecik” → Konta usługi → eas-submit → Klucze) wgrany do projektu Expo firmy: `TENANT=<slug> npx eas credentials -p android` → Google Service Account → Upload. Klucza nie commitować | Bartosz | 2 min |
| Pierwszy AAB nowej aplikacji Google przyjmuje tylko ręcznie (Play Console); kolejne: `TENANT=<slug> npx eas submit -p android --profile <slug>-production --latest` | agent | 2 min |
| iOS: `TENANT=<slug> npx eas submit -p ios --profile <slug>-production --latest`, potem w App Store Connect wybierz build w wersji | agent | 2 min + przetwarzanie Apple ~15 min |

## 6b. Wnioski z pierwszej wysyłki do review (Forma Studio, 2026-11-19)
Rzeczy, które zablokowały wysyłkę — sprawdzić PRZED kliknięciem „Add for Review” u każdego klienta:

| Blokada | Gdzie | Rozwiązanie |
|---|---|---|
| **„Unable to Add for Review” — DAC7** (unijna dyrektywa podatkowa) | App Store Connect → Business → Agreements → Compliance → „Directive on Administrative Cooperation – 7th Amendment” | Przejść kreator: „Czy aplikacje świadczą usługi osobiste?” → zostawić dotychczasową odpowiedź; na liście aplikacji **NIE zaznaczać aplikacji firmy** (darmowa, nic nie sprzedaje przez App Store; usługi studia są płatne poza Apple) → Next → potwierdzić zapisane NIP/VAT → Done. Nowa aplikacja musi być „ujęta” w deklaracji, nawet jeśli DAC7 było już aktywne dla innych aplikacji. **Na koncie klienta robi to klient (Account Holder/Admin)** — przy pierwszym wypełnieniu Apple prosi o NIP, VAT, datę urodzenia (JDG) / numer rejestrowy (spółka): danych podatkowych nie wpisujemy za klienta |
| Puste „Contact Information” w App Review Information (imię, nazwisko, telefon, e-mail) | wersja aplikacji → App Review Information | Dane osoby kontaktowej klienta (zapytać klienta; nie zgadywać). Bez nich „Add for Review” jest nieaktywne |
| W wersji wybrany stary build | wersja → Build | Najechać na wiersz → czerwony minus → „Add Build” → najnowszy build → Done → Save |
| Wydanie po akceptacji | wersja → App Store Version Release | Zostawić **„Manually release this version”**, dopóki produkcja (backend, panel, linki sklepów) nie jest gotowa |

Google Play: **wysyłaj do sprawdzenia od razu ostatni build**. Podmiana buildu w trakcie sprawdzania („Czy chcesz ponownie rozpocząć sprawdzanie?”) anuluje review i zaczyna od nowa (Forma Studio 19.11: build 2 był już w review, build 3 z poprawkami wysłany ponownie). Nowy AAB z `eas submit` trafia jako szkic: Produkcyjna → Wersje → Edytuj wersję → Dalej → Zapisz → Przegląd publikowanych zmian → Prześlij do sprawdzenia (Google najpierw robi szybkie testy, do 14 min).

Google Play: pierwsze wydanie i tak przechodzi ręczne „Wyślij zmiany do sprawdzenia” w Przeglądzie publikowanych zmian; AAB z `eas submit` trafia jako szkic (`releaseStatus: draft`).

Kolejność, która działa: 1) DAC7 i umowy na koncie, 2) dane recenzenta + kontakt, 3) build wybrany, 4) ręczne wydanie, 5) Add for Review → Submit for Review („1 Item Submitted”, do 48 h).

Apple odrzuciło Forma Studio 20.11 jako **2.1 „Information Needed”**, bo krótka notatka nie wystarczyła. Aplikacja firmowa wygląda dla Apple jak aplikacja tylko dla jednej firmy, a Apple przypomina wtedy o Guideline 3.2 (dystrybucja prywatna).

Przy każdej firmie, już przy pierwszej wysyłce:
- **Notes:** wpisz pełną notatkę EN. Wzór jest w polu Notes wersji Forma Studio (zapisany 20.11). Musi zawierać:
  - cel i odbiorców: publiczna aplikacja dla klientów studia, nie narzędzie wewnętrzne;
  - zakładki po polsku z tłumaczeniem;
  - usługi zewnętrzne: nasz backend, Keycloak, Google jako opcja logowania, Expo Update; bez płatności i AI;
  - region: tylko Polska;
  - informację, że to nie wyrób medyczny.
- **Attachment:** dołącz nagranie ekranu. Ma zaczynać się od uruchomienia aplikacji i pokazywać:
  - logowanie;
  - połączenie z firmą;
  - funkcje;
  - usunięcie konta (Więcej → Usuń konto).

## 6c. Nagranie dla App Review (wzór: Forma Studio, 20.11.2026)
Apple chce nagrania z „fizycznego urządzenia z najnowszym iOS”. Research z 20.11.2026: nie ma przykładów, w których Apple przyjęło nagranie z symulatora, gdy prosiło o urządzenie. Przyjmuje za to nagranie ekranu z Centrum sterowania iPhone'a. Że Diecik kiedyś przeszedł z symulatorem, nie jest dowodem na przyszłość.
**Kolejność wyboru:** 1) nowszy iPhone z najnowszym iOS (np. pożyczony; instalacja przez TestFlight, nagranie z Centrum sterowania); 2) starszy iPhone z najnowszym iOS, jaki obsługuje, i ta informacja w notatce (aplikacja wymaga iOS ≥ 16.4, więc iPhone 8 z iOS 16.7 wystarczy); 3) symulator tylko w ostateczności.
Kroki z symulatorem poniżej zostają jako wariant awaryjny i do zrzutów ekranu.

| Krok | Kto | Czas |
|---|---|---|
| Build na symulator z produkcji: `TENANT=<slug> npx eas build -p ios --profile <slug>-simulator --non-interactive --no-wait`. Profil dziedziczy po `<slug>-production`, a dodatkowo ma `distribution: internal`, `ios.simulator: true`, `ios.autoIncrement: false`, żeby nie podbijać numeru buildu w sklepie | agent | ~15 min (chmura) |
| Runtime z najnowszym iOS **dla zwykłych iPhone'ów**: `xcrun simctl list runtimes -j` → supportedDeviceTypes. Stan na 20.11.2026: iOS 27.1 jest tylko dla „iPhone Duo” (także po `xcodebuild -downloadPlatform iOS`, 7,85 GB, niepotrzebne), więc najnowszy iOS dla zwykłego iPhone'a to **27.0 na iPhone 18 Pro** | agent | 1 min |
| Nowy symulator „App Review iPhone 17 Pro” na tym runtime, `simctl install`, czysty start bez danych | agent | 2 min |
| Nagranie `xcrun simctl io <udid> recordVideo --codec=h264 <plik>.mov`. Bartosz klika w oknie symulatora (w Xcode 27 to **DeviceHub.app** w `/Applications/Xcode.app/Contents/Applications/`, nie Simulator.app; pasek statusu: `simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100`) i wpisuje hasła (agent nie wpisuje haseł ani danych rejestracji na produkcji) | agent + Bartosz | ~10 min |
| Kontrola filmu klatkami (start od uruchomienia, każdy wymagany krok widoczny), dopisanie do notatki, wgranie do Attachment, Resubmit za zgodą Bartosza | agent | ~10 min |

**Scenariusz** (ok. 3–4 min, bez przyspieszania):
1. Ekran główny symulatora → tap w ikonę aplikacji (nagranie zaczyna się PRZED uruchomieniem).
2. **Rejestracja:** Zaloguj → strona logowania firmy → „Rejestracja” → nowy adres e-mail i hasło → (potwierdzenie e-mail, jeśli Keycloak wymaga) → powrót do aplikacji.
3. Konto bez zaproszenia: ekran „Poproś o zaproszenie” z kontaktem do firmy.
4. **Usunięcie konta:** Więcej → Usuń konto → potwierdzenie → powrót do logowania. Konto testowe znika z produkcji.
5. **Logowanie** kontem demo z Sign-In Information.
6. Funkcje: Start → Dieta (posiłek, przepis, lista zakupów) → Trening → Postępy → Ankiety → Czat.
7. **Treści użytkowników (czat):** przytrzymanie wiadomości → „Zgłoś wiadomość” (anuluj); ikona „i” → „Zgłoś zachowanie”, „Zablokuj rozmowę” (pokazać, nie potwierdzać).
8. Więcej → Usuń konto: pokazać ekran, nie usuwać konta demo.
Płatnych treści brak, więc ten punkt opisujemy tylko w notatce.

## 7. Po publikacji w sklepach — zaproszenia w marce firmy
Zaproszenia klientów od firmy z AKTYWNĄ aplikacją wychodzą w jej marce: nadawca = nazwa firmy (adres noreply@diecik.com),
odpowiedź = e-mail kontaktowy firmy, logo z Ustawień firmy, kolor wybranej palety, stopka „w imieniu … przez Diecik”.
Klient potwierdza zaproszenie na stronie z logo firmy, pobiera aplikację i łączy konto na ekranie Start aplikacji.

| Krok | Kto | Czas |
|---|---|---|
| Firma dodaje logo (PNG/JPG) w Ustawieniach firmy i e-mail kontaktowy — bez logo mail pokaże samą nazwę | firma | 2 min |
| Admin → Organizacje → firma → Aplikacja mobilna firmy: wpisz „Link w App Store” (https://apps.apple.com/…) i „Link w Google Play” (https://play.google.com/…) → Zapisz aplikację. Inne adresy są odrzucane | agent | 1 min |
| Do czasu wpisania linków mail i strona akceptacji nie pokazują przycisków pobrania (tekst: „Link do aplikacji przekaże Ci firma”) | — | — |

## Pomiar czasu (pierwszy przebieg, 2026-11-18/19)
- Start: 23:38 (credentials Apple przez Bartosza) · stan końcowy: 00:42 → **~65 min pracy agenta** z nauką UI.
- Czekanie poza pracą: build iOS ~15 min, kolejka EAS Submit ~25 min, build Android ~40 min (darmowy plan Expo — kolejka).
- Szacunek dla kolejnej firmy z tą listą: **~35–45 min klikania + ~1 h buildów/kolejek**, plus czas Bartosza na 2FA
  i konto do review (~10 min). Review Apple 1–3 dni, Google zwykle 1–7 dni dla nowej aplikacji.
