# Diecik — marketing

Materiały marketingowe Diecika, zasady ich tworzenia i narzędzie `./reklama`, które z jednego pliku kampanii
buduje gotową paczkę: grafiki, karuzelę, filmy, teksty, stronę podglądu, manifest i ZIP.

## Nowa reklama

```sh
cd narzedzie && npm ci && cd ..        # raz, po sklonowaniu
./reklama nowa generator-treningu --typ instalacje
#  uzupełnij kampanie/<data>-generator-treningu/BRIEF.md, wgraj ujęcia do zrodla/, popraw kampania.json
./reklama sprawdz <kampania>           # treści, dowody, źródła, mieszczenie napisów
./reklama szkic <kampania>             # plansza 360 px i storyboardy do oceny kierunku
./reklama buduj <kampania>             # pełna paczka, około minuty przy dwóch filmach
./reklama pokaz <kampania>             # strona podglądu w przeglądarce
```

Typy: `instalacje` (osoba indywidualna), `specjalista` (dietetyk, trener), `firma` (aplikacja w barwach klienta),
`post` (post organiczny). Wszystkie komendy: `./reklama pomoc`. Zasady pracy: [`AGENTS.md`](AGENTS.md) i [`zasady/`](zasady/).

Narzędzie niczego nie wgrywa do Meta ani sklepów. Wgranie i publikacja wymagają osobnej zgody Bartosza.

## Gdzie obejrzeć gotowe materiały

`DO_OBEJRZENIA/` — jeden folder, w którym są wyłącznie grafiki i filmy ostatniej zbudowanej paczki. Nic więcej tam nie trafia.
Folder odświeża się przy każdym `./reklama buduj`; `./reklama wystaw <kampania>` wkłada do niego wskazaną paczkę.
Teksty reklam i komplet do wgrania są w folderze kampanii (`TEKSTY-REKLAM.txt`, `DO_WGRANIA/`).

## Co narzędzie robi samo

- trzyma zaakceptowany styl (krem, sosna, limonka; Baskerville i Avenir Next) i geometrię plansz;
- pilnuje, żeby każdy napis mieścił się na planszy i w strefie bezpiecznej, także w każdej klatce filmu;
- odrzuca zakazane obietnice, błędną pisownię marki, dowody wskazujące nieistniejący kod, nagrania w tempie innym niż 1×;
- montuje filmy z prawdziwych nagrań aplikacji i z nagrań ludzi na całe tło, dobiera lub generuje podkład,
  renderuje pion 9:16 i osobny kadr 4:5 do Feedu, sprawdza gotowe pliki (wymiary, kodek, klatki, kolor, głośność, pełne dekodowanie);
- składa plansze ze zdjęciem na całe tło, z blokiem ceny i telefonem jako dowodem;
- rysuje planszę wyboru „Opcja A / B / C”, gdy scena filmu ma kilka nagrań do wyboru (pole `opcje`);
- wystawia grafiki i filmy ostatniej paczki w `DO_OBEJRZENIA/`;
- generuje teksty z licznikami znaków, opis źródeł, stronę podglądu, manifest z sumami kontrolnymi i ZIP;
- zamraża paczkę po akceptacji.

Przykład `narzedzie/przyklady/wzorzec-instalacje` odtwarza zaakceptowaną paczkę z 21.10.2026: grafiki i karuzela
wychodzą identyczne co do bajta, filmy co do klatki (poza 11 klatkami, na których oryginał miał ślad cienia).
Układy dla specjalistów, firm i postów są nowe — przykłady w `narzedzie/przyklady/przyklad-*` czekają na ocenę Bartosza.

## Aktualne paczki reklam

| Paczka | Status | Pliki do wgrania |
|---|---|---|
| Cel kalorii i generator diety, 21.10.2026 | zaakceptowana; dodana do Meta jako niepublikowane szkice | `archiwum/reklamy/diecik-deficyt-generator-2026-10-21/DO_WGRANIA` |
| Instalacje, 18.10.2026, rewizja 2 | zaakceptowana; wzorzec stylu | `archiwum/reklamy/diecik-instalacje-2026-10-18/DO_WGRANIA` |

Kampanie budowane narzędziem i ich statusy: `./reklama lista`. Pierwsza: `kampanie/2026-11-19-prowadzenie-i-aplikacja`
(własna aplikacja dla firm, Facebook) — czeka na ocenę; `kampanie/2026-11-19-wlasna-aplikacja` to jej odrzucona wersja 1.

Wszystkie wcześniejsze paczki i ich statusy: [`archiwum/INDEX.md`](archiwum/INDEX.md).

## Mapa repo

| Folder | Zawartość |
|---|---|
| `DO_OBEJRZENIA/` | grafiki i filmy ostatniej paczki do szybkiego przeglądu (poza Git) |
| `zasady/` | marka, komunikacja, kreacja, źródła i dane demo, specyfikacje, proces, lekcje |
| `marka/` | logo, kody QR sklepów, podkłady muzyczne |
| `narzedzie/` | kod narzędzia, szablony, przykłady, testy (`npm test`) |
| `kampanie/` | nowe kampanie budowane narzędziem |
| `strategia/` | plany marketingowe |
| `sprzedaz/` | decki sprzedażowe i instrukcja kont dla firm |
| `sklepy/` | materiały App Store i Google Play |
| `filmy/` | dłuższe filmy produktowe |
| `archiwum/` | paczki reklam sprzed narzędzia |

Materiały marketingowe, które zostają w repo produktu: `health-app-frontend/public/marketing` i `docs/marketing`
(obrazy i teksty strony), `health-app-company-mobile/presentation-brands` (marki do buildów prezentacyjnych).

## Git

W Git są zasady, narzędzie, marka, definicje kampanii, źródłowe ekrany i gotowe pliki zaakceptowanych paczek.
Poza Git, ale na dysku: pliki robocze (klatki kontrolne, ZIP-y, stock, zależności), `DO_OBEJRZENIA/`, pliki `*.env`
oraz `DO_WGRANIA/` paczek, które czekają na akceptację — `./reklama akceptuj` sam dopisuje je do Git.
Dzięki temu można zaznaczyć wszystkie zmiany, zrobić commit i push. `./reklama git-kontrola` pokazuje, co trafiłoby
do commita, i ostrzega przed plikami powyżej 50 MB oraz nazwami wyglądającymi na dane logowania.

## Gdzie były te pliki przed 19.11.2026

| Stara ścieżka (w `health-app/`) | Nowa ścieżka |
|---|---|
| `marketing/reklamy/<paczka>` | `archiwum/reklamy/<paczka>` |
| `marketing/assets/app-store`, `google-play` | `marka/sklepy/` |
| `marketing/brand-guide.md`, `README.md` | `archiwum/poprzedni-folder-marketing/` (treść przeniesiona do `zasady/marka.md`) |
| `prezentacje/` | `sprzedaz/` |
| `exports/app-store`, `exports/google-play` | `sklepy/app-store`, `sklepy/google-play` |
| `output/store-promo/2026-10-30` | `sklepy/2026-10-30-store-promo` |
| `tmp/promo trener dane/video` | `filmy/dla-dietetykow-2026-08-24` |
| `tasks/social-publishing-plan.md`, `marketing-placement-plan.md`, `first-10-specialists-plan.md` | `strategia/` |

Skrypty starych paczek (`production/`, `automation/`) są zapisem historycznym: odwołują się do środowiska,
w którym powstały, i do dawnych ścieżek. Nowych materiałów nimi nie budujemy.
