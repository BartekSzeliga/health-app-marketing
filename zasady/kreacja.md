# Kreacja: grafika, karuzela, film

Źródła: zaakceptowane paczki z 18.10 i 21.10.2026 oraz lekcje z odrzuconych wersji z 30.09–02.10.2026
(`zasady/lekcje.md`). Narzędzie pilnuje geometrii, stref i długości; poniższych rzeczy nie sprawdzi za Ciebie.

## Reklama, nie instruktaż

Wersje v2–v6 odpadły, bo były prezentacją panelu: duży nagłówek nad nieruchomym zrzutem, numerowane kroki,
strzałki, kursor. Poprawianie czytelności niczego nie zmieniło — trzeba było zmienić pomysł.

- Zacznij od sytuacji odbiorcy i jednej korzyści. Produkt jest krótkim dowodem, nie tematem.
- **Jedna obietnica na planszę i na film.** Nie mnóż haseł.
- Bez strzałek, wielkich kursorów, numerowanych kroków, czytania okien dialogowych i długich nieruchomych zrzutów.
  Wyjątek: etykiety kart karuzeli („01 / TWÓJ CEL”).
- Materiał ma być zrozumiały bez dźwięku i dla osoby, która widzi aplikację pierwszy raz.
- Po negatywnym odbiorze zmień koncepcję, a nie krój pisma, kolor czy tempo.

## Grafika

- Nagłówek: dwie krótkie linie, łamane świadomie. Dłuższy tekst dziel na linie, nie zmniejszaj do drobnego druku —
  narzędzie ma dolną granicę stopnia pisma i zgłosi błąd zamiast ścisnąć napis.
- Treść: dwie lub trzy krótkie linie o tym, co użytkownik robi i co dostaje.
- Ekran: prawdziwy zrzut w ramce telefonu. Detal (karta z kadrem) pokazuje to, co obiecuje nagłówek,
  i zawsze towarzyszy mu cały ekran w tle — sam wycinek nie mówi, skąd pochodzi.
- Kadr dobierasz pod dowód obiecany w tekście, nie pod ogólną estetykę ekranu (`./reklama kadr`).
- Formaty: 1:1 i 4:5 to warianty umiejscowień tej samej reklamy; 9:16 dla Stories i Reels.

Układ planszy (`uklad` w kampanii) dobierasz do dowodu:

| Układ | Kiedy |
|---|---|
| `telefon` | jeden ekran mówi wszystko |
| `telefon+detal` | ważny jest fragment ekranu: liczba, wynik, lista (zaakceptowany wzorzec) |
| `dwa-telefony` | dwa ekrany tej samej historii; oba jasne, bo stoją na ciemnej kolumnie |
| `trzy-telefony` | ta sama aplikacja w kilku wyglądach albo trzy kroki obok siebie; rząd na całą szerokość |
| `panel`, `panel+telefon` | panel web w oknie przeglądarki, opcjonalnie z aplikacją podopiecznego |
| `zdjecie`, `zdjecie+telefon` | człowiek i sytuacja na całym tle, nagłówek w kolumnie obok twarzy, oferta u dołu, telefon jako dowód |

Do każdego układu można dodać `cena` — blok z kwotą jako największym elementem po nagłówku.
Reklamy do specjalistów i firm zaczynaj od układu ze zdjęciem albo od filmu z nagraniem: same makiety telefonów
na płaskim tle wyglądają jak reklamy konkurencji i zostały odrzucone (19.11.2026).

Ciemnego ekranu nie stawiaj na sosnowej kolumnie układu dzielonego — zlewa się z tłem. Użyj układu z pasem
(`trzy-telefony`, `panel`), gdzie urządzenia stoją na granicy kremu i sosny.

## Karuzela

- Jedna historia w stałej kolejności, zwykle 4 karty: od potrzeby do rezultatu.
- Każda karta działa też osobno: własny nagłówek, własny ekran.
- W tekstach podajemy kolejność plików i przypominamy o wyłączeniu automatycznej zmiany kolejności.

## Film Reels/Stories

Zaakceptowany przebieg 20 s (szablon `instalacje`): **hook → cały ekran → detal → rezultat → CTA**.

| Scena | Rola | Zasada |
|---|---|---|
| `hook` | rozpoznawalna wartość w pierwszej sekundzie | pytanie lub obietnica, nie ustawienia konta |
| `ekran` | kontekst: cały ekran aplikacji | prawdziwe nagranie czynności w tempie 1× |
| `detal` | czytelność: kadr tego, co ważne | poprzedzony całym ekranem, z tego samego ujęcia lub przepływu |
| `ekran` / `detal` | rezultat w tym samym środowisku | widz widzi, co ma po wykonaniu czynności |
| `cta` | marka, hasło, przycisk | co najmniej 3 s |

- **Czas na odczytanie.** Zostaw spokojną chwilę przed czynnością i po niej. Gdy treść potrzebuje czasu,
  wydłuż scenę albo cały spot (15–30 s); nie zwalniaj i nie przyspieszaj nagrania razem z muzyką.
- **Kontekst przed zbliżeniem.** Odizolowany fragment interfejsu jest niezrozumiały. Najpierw cały ekran, potem detal, na końcu rezultat.
- **Jedna czynność i jeden rezultat na ujęcie.** Dwie akcje w jednym ujęciu widz bierze za pomyłkę.
- **Telefon w całości.** Ekran klienta pokazujemy cały, w ramce.
- **Stan danych ma sprzedawać.** Bez czerwonych pasków przekroczeń jako głównego dowodu, bez pustych list, z prawdziwymi zdjęciami posiłków.
- **Napisy w strefie bezpiecznej**, także w trakcie animacji wejścia — narzędzie sprawdza granice liter w każdej klatce.
- Zewnętrznych etykiet typu „konto DEMO”, „przykład 1/2” nie nakładamy na kadr. Fakt użycia kont demonstracyjnych
  opisują „Dane przykładowe” i `ZRODLA.txt`.
- Reels i Stories mogą dzielić jeden pionowy plik 9:16. Nie twórz identycznych kopii pod różnymi nazwami.

## Film dla specjalistów

Narzędzie buduje spot z nagrań ludzi i prawdziwych ekranów: scena `material` (nagranie na całe tło z napisem),
`ekran` z polem `material` (telefon na rozmytym nagraniu), `cta` z polem `cena` (plansza z ofertą) oraz `kadr45`
(osobny render 4:5 do Feedu). Wzór: `kampanie/2026-11-19-prowadzenie-i-aplikacja/kampania.json`.
Pole `opcje` w scenie z nagraniem podaje inne nagrania do tej samej sceny; narzędzie rysuje z nich planszę wyboru dla Bartosza
(`zasady/zrodla-i-dane-demo.md`). `srodek45` ustawia, która część nagrania trafia do kadru 4:5 (np. żeby było widać laptop).
Hasło otwarcia może stać w czterech krótkich liniach; dłuższe linie zmniejsz polem `rozmiar`, jeśli wchodzą na twarz.
Koncepcja nadal jest Twoją pracą:

- Zaakceptowany kierunek (v7–v10): sytuacja z życia specjalisty, człowiek, produkt jako krótki dowód.
  Hasło otwarcia, które Bartosz wybrał: „Dieta nie kończy się w gabinecie”.
- **Panelu web nie pokazujemy w pionowym filmie w całości** — przyciski i kursor stają się niewidocznym tłem (odrzucone v5).
  Używaj sceny `detal` z kadrem panelu i sceny `ekran` z aplikacją podopiecznego.
- Makrozbliżenia i przeloty kamery po fragmentach panelu też odpadły (odrzucone B2B 25 s). Trzy czytelne funkcje wystarczą.
- Panel na ujęciu z laptopem musi mieć perspektywę, ruch kamery i poprawne zasłanianie przez rękę; płaski zrzut naklejony na film odpada.
- Ruch w reklamie dietetyka to także zwykły spacer, nie siłownia.
- Casting dobieramy po widocznym wyglądzie i otoczeniu pasującym do kampanii w Polsce. Modelom nie przypisujemy
  narodowości, pochodzenia ani kwalifikacji.

## Dłuższy film produktowy (YouTube, strona)

- Powstaje z prawdziwej sesji aplikacji i rzeczywistych kliknięć, nie z plansz.
- Zaczyna się od głównego przepływu produktu, a kończy natywnym ekranem klienta.
- Samo 1920×1080 nie daje czytelności: nagrywaj w docelowej rozdzielczości, powiększ interfejs,
  kadruj scenę na jedną funkcję i oceniaj w rzeczywistym rozmiarze odtwarzania na laptopie i telefonie.

## Zanim pokażesz

1. Plansza 360 px (`./reklama szkic`): czy nagłówek, ekran i CTA czytają się w rozmiarze telefonu?
2. Plansze z **zakodowanych** filmów (`qa/film/*-kontakt.jpg`), nie tylko storyboard.
3. Pytanie do każdej sceny: czy odbiorca rozumie wartość bez zatrzymywania filmu?
4. Po każdej zmianie tekstu w scenie: napisy, teksty reklam, storyboard i manifest opisują tę samą wersję —
   narzędzie generuje je z jednego pliku, więc zmieniaj `kampania.json`, nie pliki wynikowe.
