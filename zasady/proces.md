# Proces: od zlecenia do akceptacji

## Reklama krok po kroku

| Krok | Co robisz | Wynik |
|---|---|---|
| 0. Research | Biblioteka reklam Meta: co do tej samej grupy emituje konkurencja (hasła, wygląd, oferta). Ceny konkurencji. Aktualna strona docelowa i jej dokładne sformułowania. | wnioski w `BRIEF.md`: czym nasza reklama ma się odróżnić |
| 1. Zlecenie | Ustal: odbiorca → kanał → umiejscowienie → cel → format → CTA → dokąd prowadzi. Jedna funkcja lub jedna korzyść na temat. | `./reklama nowa <nazwa> --typ …` i uzupełniony `BRIEF.md` |
| 2. Prawda o produkcie | Sprawdź w kodzie, co funkcja robi, co jest darmowe, czego nie obiecamy. | wpisy `dowody` i `uwagi` w `kampania.json` |
| 3. Ujęcia | Konto demo, aktualny build, natywne zrzuty i nagrania. | pliki w `zrodla/`, sekcja `pochodzenie` |
| 4. Definicja | Teksty plansz, kadry (`./reklama kadr`), sceny filmu, teksty reklam. | `kampania.json` |
| 5. Kontrola | `./reklama sprawdz` do zera błędów; uwagi rozstrzygnij świadomie. | — |
| 6. Szkic | `./reklama szkic`; obejrzyj planszę 360 px i storyboardy. Poprawiaj, aż sam uznasz materiał za gotowy. | `qa/szkic/`, `qa/film/` |
| 7. Decyzja | Kierunek wybierasz sam — Bartosz nie chce pytań o koncepcję. Kilka naprawdę różnych koncepcji jest lepsze niż warianty jednej. | zapis rozważonych opcji w `BRIEF.md` |
| 8. Paczka | `./reklama buduj`; obejrzyj każdy plik w pełnej rozdzielczości i plansze z zakodowanych filmów (pion i kadr 4:5). | `DO_WGRANIA/`, teksty, manifest, ZIP, podgląd |
| 9. Pokaz | Bartosz ogląda pliki w `DO_OBEJRZENIA/` (same grafiki i filmy; `buduj` wypełnia folder). `./reklama pokaz` otwiera stronę z tekstami; w wiadomości: co jest w paczce, czego nie sprawdziłeś, co wymaga odsłuchu i **jakie opcje odrzuciłeś**. | status `DO_AKCEPTACJI` |
| 10. Akceptacja | Po słowach Bartosza: `./reklama akceptuj <kampania> --cytat "…"`. | status `ZAAKCEPTOWANE`, paczka zamrożona |
| 11. Wgranie | Tylko na jego osobne, wyraźne polecenie i w zakresie, który podał. | zapis w `qa/`, co i gdzie wgrano |

Kroki 1–6 zajmują najwięcej uwagi; krok 8 to około minuty dla paczki z dwoma filmami.

## Kiedy się zatrzymać

- Funkcja działa inaczej, niż zakłada zlecenie, albo ekran nie dowodzi obietnicy → powiedz to przed zrobieniem kreacji.
- Brak bezpiecznej drogi do ujęć (konto, build, dostęp do przeglądarki) → nazwij przeszkodę, nie zastępuj nagrania planszami.
- Bartosz odrzucił kierunek → `./reklama odrzuc`, lekcja do `zasady/lekcje.md`, nowa koncepcja w nowej kampanii; nie produkuj wariantów starej.

## Poprawki

- Uwagę do jednej sceny traktuj dosłownie: zmień tylko to, co wskazał. Usuniętego napisu nie zastępuj innym.
- Zaakceptowane elementy (hook, rytm, muzyka, ujęcia) zostają, chyba że sam poprosi o zmianę.
- Paczka w statusie `DO_AKCEPTACJI` może być przebudowana. Po akceptacji zmiany idą do nowej kampanii:
  `./reklama nowa <nazwa> --z <kampania>`.
- Każdą poprawkę dopisz do `zasady/lekcje.md`.

## Co mówisz przy przekazaniu

Rozdzielaj cztery rzeczy, bo to różne twierdzenia:

1. **techniczne** — pliki mają właściwe parametry (to sprawdziło narzędzie);
2. **zgodność z produktem** — twierdzenia mają dowody w kodzie;
3. **ocena własna** — co widzisz na planszach, co budzi wątpliwość;
4. **akceptacja** — należy wyłącznie do Bartosza.

Nie obiecuj skuteczności reklamy. Napisz wprost, czego nie zrobiłeś: podglądu umiejscowień w Menedżerze reklam,
odsłuchu muzyki, testu na prawdziwym telefonie.

## Wgranie i publikacja

- Zakres zgody zapisuj dosłownie (cytat, data, co obejmuje: szkice, publikację, aktywację, budżet).
- Domyślnie wgrywamy jako wyłączone szkice, z zachowaniem istniejących reklam, budżetów i przełączników.
- Aktywacja, zmiana budżetu i publikacja wymagają osobnej zgody.
- Po wgraniu zapisz, co trafiło do którego zestawu reklam; poprzednia paczka zostaje zachowana.

## Decki sprzedażowe (`sprzedaz/`)

- Deck dla firmy jest sprzedażowy: korzyści klienta, nie lista funkcji i nie obowiązki po jego stronie.
- Makiety telefonu z aplikacją w **marce klienta** (logo, kolory), z prawdziwych zrzutów gotowego buildu z jego marką.
  Surowe zrzuty aplikacji Diecik odpadają.
- Dwa warianty wdrożenia: wspólna aplikacja Diecik z marką klienta (od razu) albo własna aplikacja na kontach
  Apple i Google klienta (klient zakłada konta z naszą instrukcją, publikuje Bartosz).
- Nie obiecujemy publikacji aplikacji pod nazwą klienta z konta Diecik (Apple 4.2.6).
- Kolejność: najpierw build z marką klienta, potem zrzuty, makiety (`./reklama nowa … --typ firma`) i deck.
- Szablon: `sprzedaz/szablon/Diecik Presentation Template.pptx`. Instrukcja kont dla klienta: `sprzedaz/instrukcja-konta-apple-google/`.

## Materiały sklepowe (`sklepy/`)

Zrzuty i opisy do App Store i Google Play mają własne wymagania sklepów (wymiary, brak kanału alfa, limity znaków)
opisane w `MANIFEST.md` każdej paczki. Zasady treści i źródeł są te same co dla reklam.
Zapis w sklepie i wysłanie do recenzji to czynności wymagające zgody Bartosza.
