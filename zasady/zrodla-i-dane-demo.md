# Źródła, dane demo i muzyka

Źródła: `ZRODLA.txt` paczek z 18.10 i 21.10.2026, `qa/claims-review.md`, lekcje z poprawek.

## Ujęcia aplikacji

- **Aktualny build.** Przed kampanią zrób świeże ujęcia z bieżącej wersji. Dawne nagranie mobilne nie nadaje się
  do nowej publikacji tylko dlatego, że już istnieje.
- **Natywny zrzut i nagranie ekranu**, w pełnej rozdzielczości urządzenia (zaakceptowane paczki: 1206×2622).
  Panel web: szerokość co najmniej 1440 px.
- **Bez obróbki.** Do `zrodla/` trafia plik prosto z urządzenia. Dozwolone w kreacji: jednolite skalowanie, ramka,
  kadrowanie rzeczywistych detali, cięcia nagrania pomijające oczekiwanie.
- **Niedozwolone:** dopisywanie i zamalowywanie elementów interfejsu, podmiana liczb, nazw i zdjęć, symulowane
  kliknięcia, przyspieszanie lub zwalnianie nagrania, sklejanie ekranów z różnych kont w „jeden przepływ”.
- **Nagrania w tempie 1×.** Narzędzie odrzuca inne tempo. Nagrania ekranu mają zmienną liczbę klatek i potrafią
  zerować zegar w środku pliku — narzędzie rozwija oś czasu do stałych 30 kl./s i każe wskazać odcinek (`epoka`).
- Zrzut dostarczony w katalogu tymczasowym najpierw obejrzyj w pełnej rozdzielczości, potem skopiuj do `zrodla/`
  kampanii. Render ma dać się odtworzyć z samego folderu kampanii.
- Jeśli nie da się nagrać prawdziwego interfejsu, zatrzymaj produkcję i powiedz o konkretnej przeszkodzie.
  Plansze udające interfejs nie są zamiennikiem.

## Konta i dane demonstracyjne

- Tylko konta demonstracyjne i fikcyjne osoby. Żadnych danych realnych klientów ani podopiecznych.
- Najpierw sprawdź, czy istnieje przygotowane konto testowe i wcześniejszy scenariusz nagrania; odtwórz je,
  zanim poprosisz Bartosza o logowanie lub ręczne przygotowanie danych.
- Dane mają wyglądać wiarygodnie i sprzedażowo: prawdziwe zdjęcia posiłków, wartości mieszczące się w celach,
  spójny tydzień. Jeden wygenerowany dzień to za mało na materiał marketingowy.
- Panel specjalisty i aplikację podopiecznego opisujemy jako jeden przepływ tylko wtedy, gdy konta są powiązane,
  a pokazany pakiet jest tym opublikowanym. Nie łączymy kont i nie przerabiamy klienta offline tylko po to, żeby domknąć demo.
- Lokalne pliki kont QA (`*.local.json`), ślady sesji przeglądarki (`*.trace.zip`) i zrzuty paneli reklamowych
  zostają poza Git.

## Pochodzenie

Każda kampania ma w `kampania.json` sekcję `pochodzenie`: data ujęć, urządzenie i sposób przechwycenia, konto,
repo i commit produktu, zakres obróbki. Z niej i z `dowody` narzędzie generuje `ZRODLA.txt`.

## Muzyka

- Podkłady to własna synteza dźwięku: bez sampli, nagrań osób, pętli z bibliotek, lektora i odgłosów udających
  dotknięcia ekranu. Dzięki temu nie ma licencji do pilnowania.
- Gotowe podkłady po 20 s leżą w `marka/muzyka/`. Dla innej długości filmu użyj presetu
  (`"muzyka": { "preset": "generator" }`), który narzędzie generuje pod czas filmu.
- Narzędzie mierzy głośność (cel −14 LUFS, szczyt poniżej −1 dBTP) i sprawdza dźwięk po kodowaniu AAC.
  Brzmienia nie ocenia — nowy podkład zawsze jest do odsłuchu przez Bartosza.
- Nie używamy biblioteki muzyki Meta ani nagrań komercyjnych.

## Zdjęcia i filmy stockowe

- Dozwolone jako sceny z ludźmi i tło filmu, z zapisanym źródłem, autorem i licencją
  (wzór: `archiwum/reklamy/diecik-instalacje-2026-10-18/assets/footage/sources-r2.json`).
- Pliki stockowe leżą w `zrodla/material/` kampanii i zostają poza Git; kadry użyte na planszach trafiają do `zrodla/zdjecia/`.
  Przy źródle w `kampania.json` zapisujemy stronę i licencję (`strona`, `licencja`, jeśli znany także `autor`).
- Źródło: pexels.com (licencja Pexels: użycie komercyjne bez opłat). Osoby na nagraniach są ilustracją: nie przedstawiamy ich jako
  klientów, nie wkładamy im w usta opinii i piszemy o tym w `uwagi`.
- Każdy klip obejrzyj w całości: symbole, napisy, marki i logo w tle. Niechciany element wytnij kadrem albo zmień klip.
- Zdjęcie wolno wykadrować, przyciemnić pod napisy i odbić w poziomie. Ekranu aplikacji nie wolno odbijać ani przyciemniać.
- Wybieraj pionowe nagrania w 4K; kadr z nagrania HD po powiększeniu do planszy jest miękki.
- Autora odczytaj ze strony klipu otwartej w przeglądarce i wpisz w `autor` źródła. Stron nie odpytujemy automatem,
  jeśli proszą o potwierdzenie, że nie jesteśmy robotem.
- Pobranie każdego pliku wymaga zgody Bartosza: podaj nazwę pliku, źródło i rozmiar (rozmiar pokaże nagłówek pliku bez pobierania).
  Pobrany plik sprawdź (`ffprobe`), zanim trafi do `zrodla/material/`; odrzucone i nieużyte klipy usuń.
- **Obsada na rynek polski:** reklamy idą do odbiorców w Polsce, więc osoby na zdjęciach i nagraniach mają wyglądać jak
  specjaliści i podopieczni z ich otoczenia (decyzja Bartosza z 19.11.2026). Dotyczy to każdej opcji, którą mu pokazujesz.
- **Wybór osoby:** gdy Bartosz ma wybrać aktora do sceny, wpisz kandydatów w `opcje` tej sceny. `./reklama buduj` narysuje planszę
  „Opcja A — jest w filmie / B / C” i włoży ją do `DO_OBEJRZENIA/`. Kandydaci mają się różnić charakterem, nie tylko ujęciem.
  Po decyzji wybrane nagranie zostaje jako `material`, a `opcje` znikają — bez tego `./reklama akceptuj` nie przejdzie.
- Zdjęcia produktów i posiłków w katalogu aplikacji traktujemy jako własną treść; wątpliwy obraz zastępujemy
  wygenerowanym, zamiast wstrzymywać materiał.

## Zachowanie zaakceptowanych plików

Zaakceptowany plik jest nietykalny: nie nadpisujemy go, nie kodujemy ponownie, nie „poprawiamy” w miejscu.
Gdy wraca do nowej paczki jako materiał kontrolny, kopiujemy go bajt w bajt.
