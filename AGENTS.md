# Zasady repo `health-app-marketing`

Repo trzyma materiały marketingowe Diecika oraz narzędzie `./reklama`, które z jednego
pliku kampanii buduje kompletną paczkę: grafiki, karuzelę, filmy, teksty, podgląd, manifest i ZIP.

Obowiązują tu także ogólne zasady pracy z `../AGENTS.md` (plan przed większą pracą,
weryfikacja przed zgłoszeniem, sprzątanie po sobie). Plan i review zapisujesz w `../tasks/todo.md`.

## Twarde zasady

1. **Nic nie wychodzi na zewnątrz bez zgody Bartosza na tę konkretną czynność.** Dotyczy wgrania
   do Meta, sklepów i mediów społecznościowych, publikacji, aktywacji reklam i zmian budżetów.
   Akceptacja kreacji nie jest zgodą na wgranie, a zgoda na szkice nie jest zgodą na publikację.
2. **Nie commitujesz i nie pushujesz.** Commit robi Bartosz. Zmiany zostawiasz w drzewie roboczym.
3. **Zaakceptowanej paczki nie zmieniasz.** Poprawki robisz w nowej kampanii
   (`./reklama nowa <nazwa> --z <kampania>`), a poprzednia zostaje bajt w bajt. `archiwum/` jest tylko do odczytu.
4. **Ekranów aplikacji nie retuszujesz.** Wolno skalować, oprawić w ramkę, kadrować i ciąć nagranie.
   Nie wolno dopisywać ani zamalowywać interfejsu, podmieniać liczb i zdjęć, przyspieszać nagrań ani udawać kliknięć.
5. **Każde twierdzenie o produkcie ma dowód w kodzie**, wpisany w `dowody` kampanii. Co jest darmowe,
   a co płatne, sprawdzasz w repo produktu, nie z pamięci.
6. **Kontrola techniczna to nie akceptacja.** Poprawny plik, zielone testy i własna ocena nie zastępują
   decyzji Bartosza. Nie nazywaj materiału zaakceptowanym, dopóki on tego nie powie.
7. **Decydujesz sam i pokazujesz gotowe.** Po researchu nie pytasz o kierunek: wybierasz koncepcje, budujesz
   pełną paczkę i na końcu wypisujesz opcje, które rozważyłeś i odrzuciłeś. Pytasz tylko o rzeczy, których nie da się
   ustalić samemu, i o wszystko, co wychodzi na zewnątrz (zasada 1).
8. **Research przed koncepcją.** Zanim cokolwiek narysujesz: reklamy konkurencji do tej samej grupy w Bibliotece reklam Meta,
   ceny konkurencji, aktualna strona docelowa. Nie przerabiaj starych paczek ani wskazanego wzoru — bierz z nich zasady, nie wygląd.
9. **W tym repo niczego nie usuwasz** poza plikami, które sam utworzyłeś w tej sesji. Docker Bartosza jest nietykalny.
10. **Bartosz ogląda pracę w `DO_OBEJRZENIA/`.** W tym folderze są wyłącznie grafiki i filmy ostatniej pełnej paczki — żadnych
   dokumentów, podfolderów ani plików roboczych. `./reklama buduj` wypełnia go sam (`./reklama wystaw <kampania>` robi to na żądanie).
   Gdy Bartosz ma coś wybrać (np. aktora do sceny), obok plików leży jedna plansza „Opcja A / B / C” — narzędzie rysuje ją z pola `opcje`.
   Materiał wizualny zrobiony poza narzędziem (slajdy decka, zrzuty do sklepów) kopiujesz tam ręcznie w miejsce poprzednich plików.
   W wiadomości końcowej zawsze wskazujesz ten folder.
11. **Kończysz bez resztek w `../tmp/`.** Pliki robocze trzymasz w `qa/` kampanii albo w scratchpadzie sesji.
   Folder `../tmp/` sprzątasz według punktu 7 w `../AGENTS.md`; worktree usuwasz przez `git worktree remove`,
   nie przez skasowanie folderu.

## Jak powstaje reklama

```
research: Biblioteka reklam Meta, ceny konkurencji, strona docelowa
./reklama nowa <nazwa> --typ instalacje|specjalista|firma|post
   → BRIEF.md → ujęcia i nagrania do zrodla/ → kampania.json
./reklama sprawdz    treści, twierdzenia, dowody, źródła, mieszczenie napisów
./reklama szkic      plansza 360 px i storyboardy — Twoja własna ocena przed pełnym renderem
./reklama buduj      pełna paczka z kontrolą mediów; grafiki i filmy trafiają też do DO_OBEJRZENIA/
./reklama pokaz      strona podglądu (teksty, pobieranie paczki) + lista rozważonych opcji w wiadomości
./reklama akceptuj   dopiero po jego słowach; zapisuje cytat i zamraża paczkę
./reklama odrzuc     gdy odrzuci; powód jego słowami, lekcja do zasady/lekcje.md
```

Pełny opis: `zasady/proces.md`. Opis komend: `./reklama pomoc`. Przykład wzorcowy, który odtwarza
zaakceptowaną paczkę z 21.10.2026: `narzedzie/przyklady/wzorzec-instalacje/`.

Nie pisz własnych rendererów do pojedynczej kampanii. Jeśli narzędziu brakuje układu albo sceny,
dodaj je w `narzedzie/src/` z testem i przykładem — wtedy skorzysta każda następna kampania.

## Gdzie co jest

| Folder | Zawartość |
|---|---|
| `DO_OBEJRZENIA/` | wyłącznie grafiki i filmy ostatniej paczki — tu Bartosz sprawdza pracę (poza Git) |
| `zasady/` | marka, komunikacja, kreacja, źródła i dane demo, specyfikacje, proces, lekcje |
| `marka/` | logo, kody QR sklepów, podkłady muzyczne z licencją |
| `narzedzie/` | kod narzędzia, szablony kampanii, przykłady, testy |
| `kampanie/` | nowe kampanie budowane narzędziem (`RRRR-MM-DD-nazwa/`) |
| `strategia/` | plany marketingowe |
| `sprzedaz/` | decki sprzedażowe dla firm |
| `sklepy/` | materiały App Store i Google Play |
| `filmy/` | dłuższe filmy produktowe |
| `archiwum/` | paczki sprzed narzędzia; statusy w `archiwum/INDEX.md` |

W Git są zasady, narzędzie, marka, definicje kampanii, źródłowe ekrany i gotowe pliki zaakceptowanych paczek.
Pliki robocze, `DO_OBEJRZENIA/`, `*.env` i `DO_WGRANIA/` niezaakceptowanych paczek leżą na dysku, ale poza Git (`.gitignore`);
`./reklama akceptuj` dopisuje gotowe pliki paczki do Git. Repo ma być zawsze w stanie „zaznacz wszystko, commit, push”:
po pracy uruchom `./reklama git-kontrola`, a haseł i danych logowania nie zapisuj w plikach, które Git śledzi.

## Które zasady czytać

| Robisz | Przeczytaj |
|---|---|
| teksty reklam, nagłówki, CTA | `zasady/komunikacja.md` |
| grafikę, karuzelę, film | `zasady/kreacja.md` |
| zrzuty, nagrania, dane demo, muzykę | `zasady/zrodla-i-dane-demo.md` |
| eksport, formaty, strefy bezpieczne | `zasady/specyfikacje.md` |
| cokolwiek od zlecenia do akceptacji | `zasady/proces.md` |
| deck sprzedażowy | `zasady/proces.md`, część „Decki sprzedażowe” |

## Po poprawce Bartosza

Każdą jego uwagę do materiału dopisz do `zasady/lekcje.md` (data, co odrzucił lub poprawił, jego słowa,
reguła na przyszłość). Jeśli da się ją sprawdzić mechanicznie, dodaj regułę do
`narzedzie/reguly/tresci.json` albo kontrolę w `narzedzie/src/kontrola.mjs`.
