# Kampania Diecik dla klientów indywidualnych i specjalistów

Gotowy lokalny pakiet reklamowy: plan, kreacje, copy i konfiguracje kampanii.
Główny temat dla klienta indywidualnego to **ulubione posiłki**:
„Twój smak. Twój skrót.” oraz „Zapisz raz. Dodawaj ponownie.”
Specjalistom pokazujemy „Od planu do telefonu klienta”.

Rekomendowany test mediów to **3000 zł na 30 dni**: 1500 zł Google Search
specjalista, 1000 zł Meta specjalista i 500 zł Meta ulubione. To propozycja
budżetu, nie zlecenie wydatków. Badamy opłacalność i faktyczne użycie funkcji.

## Otwórz w pierwszej kolejności

1. `strategy/marketing-plan.pdf` — analiza konkurencji i kanałów, plan 30 dni,
   scenariusze ekonomii, harmonogram i reguły decyzji.
2. `meta/b2c-ulubione-15s-1080x1920.mp4` — główny film o ulubionych posiłkach.
3. `meta/b2c-ulubione-hook-b-15s-1080x1920.mp4` — wariant pytający
   „Lubisz ten posiłek?”. Dalszy montaż jest identyczny.
4. `meta/b2b-prezentacja-20s-1080x1920.mp4` — film do formularza prezentacji.
5. `campaigns/diecik-campaign-operations.xlsx` — budżet, kampanie, reklamy,
   słowa kluczowe, wykluczenia, UTM, KPI i dziennik wyników.
6. `campaigns/launch-checklist.md` — konkretne kroki uruchomienia.
7. `organic/teksty-publikacji.txt` — gotowe opisy rolki, karuzeli i filmu specjalisty.

## Pliki i miejsca publikacji

| Kanał i miejsce | Materiał | Zastosowanie |
| --- | --- | --- |
| Meta Reels i Stories B2C | `meta/b2c-ulubione[-hook-b]-15s-1080x1920.mp4` | Dwa początki tej samej historii, test A/B |
| Meta Feed B2C | `meta/b2c-ulubione[-hook-b]-15s-1080x1350.mp4` | Osobny układ 4:5; bez automatycznego kadrowania rolki |
| Meta Feed B2C | `meta/b2c-ulubione-feed-1080x1350.jpg`, `meta/b2c-ulubione-hook-b-feed-1080x1350.jpg` | Zdjęcie i jedna korzyść |
| Meta Feed i Stories B2C | `meta/b2c-ulubione-proof-feed-1080x1350.jpg`, `meta/b2c-ulubione-proof-story-1080x1920.jpg` | Powiększona prawdziwa karta ulubionego z aplikacji |
| Meta Stories B2C | `meta/b2c-ulubione-story-1080x1920.jpg` | Statyczny wariant głównej kreacji |
| Meta formularz prezentacji B2B | `meta/b2b-prezentacja[-hook-b]-20s-1080x1920.mp4` | CTA „Zobacz, jak to działa”; przypisać do formularza prezentacji |
| Meta darmowy start B2B | `meta/b2b-publikacja[-hook-b]-20s-1080x1920.mp4` | CTA „Zacznij bezpłatnie”; kierować do oferty i startu specjalisty |
| Meta Feed i Stories B2B | `meta/b2b-publikacja-feed-1080x1350.jpg`, `meta/b2b-publikacja-story-1080x1920.jpg` | Oferta darmowego startu; nie przypisywać do formularza z innym CTA |
| Google Search B2B | `campaigns/google-editor/*.csv` | Dwie grupy, 32 słowa, 15 wykluczeń i dwie RSA; instrukcja kolejności w `campaigns/README.md` |
| Google i YouTube — zapas | `google/b2b-publikacja-20s-1920x1080.mp4`, `google/b2b-publikacja-1200x628.jpg`, `google/b2b-publikacja-1200x1200.jpg` | Osobne poziome kreacje do kolejnego etapu. Search nie wymaga wideo |
| Instagram i Facebook organic | `organic/carousel/01…03*.jpg` | Karuzela: ulubione → zapis → wybór i ponowne dodanie |
| Reels, Shorts i TikTok organic | `organic/b2c-ulubione-bumper-6s-1080x1920.mp4` | Krótka animowana kreacja zdjęciowa o ulubionych |

Google JPG z nagłówkiem, logo i CTA nie są zasobami graficznymi Search.
Są zapasem kreacji do przyszłego etapu, wymagającym doboru obsługiwanego formatu.
Pilot Search korzysta z RSA. [Zasady Google dla zasobów graficznych](https://support.google.com/adspolicy/answer/10347108?hl=en)
wykluczają nakładki tekstu i logo w Search; PMax ma odrębny wyjątek.

Nawias `[-hook-b]` w tabeli oznacza dwa rzeczywiste pliki, podstawowy i wariant B.
Materiały mają polskie teksty już widoczne w obrazie. SRT jest edytowalną
transkrypcją; nie dodawaj go jako drugiej widocznej warstwy tych samych napisów.

Na początek wybierz **dwa filmy w tym samym formacie**. Porównanie filmu z
grafiką zmienia równocześnie format i hook. Pozostałe materiały są gotowym
zapasem oraz materiałami organicznymi, a nie poleceniem włączenia wszystkich
reklam w małym budżecie.

## Uruchomienie kampanii

Konfiguracje pozostają **PAUSED / DRAFT**. Nie utworzono kampanii na kontach
reklamowych i nie uruchomiono wydatków. Brakuje zweryfikowanego dostępu do
właściwych kont, zatwierdzonego budżetu oraz odbioru pomiaru i obsługi leadów.
Dostępny Windsor.ai może pomóc zarządzać Meta i Google Ads, ale jego połączenie
nie zostało potwierdzone podczas tego zadania.

Dla Google wybierz jedną opcję: nową Search z budżetem łącznym 1500 zł / 30 dni
albo wariant średniego dziennego 49,34 zł w Editor. Nie wczytuj alternatywnego
pliku budżetu do kampanii z budżetem łącznym. Meta JSON i CSV są specyfikacją
do ręcznego ustawienia, nie importem ani żądaniem API.

Meta B2B ma osobne materiały do formularza prezentacji i do darmowego startu.
Przypisz je zgodnie z CTA. B2C nie może być oceniany samymi wizytami strony:
docelowy wynik to zapis i ponowne użycie ulubionego, powrót oraz płatnik.
Pomiar treści posiłków i informacji zdrowotnych pozostaje wewnątrz aplikacji.

## Pochodzenie materiałów i odbiór

Ujęcia ulubionych oraz aplikacji klienta wykonano 30.09.2026 na aktualnym
natywnym buildzie iPhone, podłączonym do lokalnych usług. Konta i dane są
demonstracyjne. Sprawdzono rzeczywisty zapis oraz ponowne dodanie produktów.
Przepływ B2C korzysta z „Mojej diety”. Klient B2B korzysta z „Od specjalisty”.

Panel B2B pochodzi z autentycznego nagrania 29.09.2026. Użyto istniejącego
materiału po odmowie dodatkowej sesji przeglądarki, bez obejścia ograniczenia.
Panel i świeży klient są przykładami dwóch kont DEMO; film ma napis
„DEMO · osobny przykład klienta” i nie przedstawia ich jako jednego
przekazanego pakietu. Wybrano prawdziwy status opublikowanego planu.

Zdjęcia potraw powstały we wbudowanym imagegen jako ilustracyjna oprawa.
Dokładne prompty są w `sources/photos/prompts.json`, a oba oryginały w
`sources/photos/`. Interfejs aplikacji pozostaje rzeczywisty; layout wyłącznie
kadruje i powiększa ujęcia oraz dodaje zewnętrzne podpisy.

Muzyka to istniejący miks Diecika z Apple Loops. Zasady licencji oraz pochodzenie
zapisano w `LICENSES.md`. Materiały mają muzykę i polskie napisy, bez lektora.

`qa/validation.json` zawiera kontrolę parametrów, dekodowania, klatek kluczowych
i napisów. Reprezentatywne klatki i podglądy są w `qa/`. PDF oraz arkusz mają
osobne raporty wizualne. Nie wykonano importu na zalogowanym koncie reklamowym;
podglądy placementów Meta/Google są ostatnim krokiem przed emisją.

Do panelu reklamowego wgrywaj wyłącznie wskazane JPG/MP4. Źródła, SVG,
automatyzacja i QA służą do odtworzenia oraz weryfikacji, nie do publikacji.
Pakiet ZIP zawiera gotowe eksporty i dokumenty, z pominięciem danych logowania,
lokalnego fixture oraz środowisk narzędziowych.

Odtworzenie w tym projekcie: `node automation/build-creatives.mjs`,
`node automation/build-videos.mjs bumper`, następnie `b2c` i `b2b`.
Skrypty korzystają z istniejącej instalacji Sharp/FFmpeg w sąsiednim katalogu
`meta-start-aplikacji/.tooling/`. Pełne źródła pozostają w projekcie.
