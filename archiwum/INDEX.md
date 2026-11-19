# Archiwum reklam — statusy

Paczki zrobione przed narzędziem `./reklama` (lipiec–październik 2026). Leżą razem w `archiwum/reklamy/`,
bez zmian, żeby ich wzajemne odwołania nadal działały. **Tylko do odczytu.**

Status pochodzi z dokumentów paczek i z lekcji (`zasady/lekcje.md`). Gdzie zapis akceptacji nie istnieje,
jest napisane „nieustalony” — nie zgadujemy.

## Aktualne

| Paczka | Zawartość | Status | Finalne pliki |
|---|---|---|---|
| `diecik-deficyt-generator-2026-10-21` | B2C: 2 filmy 20 s, 4 grafiki, karuzela 4 karty — cel kalorii i generator diety | **Zaakceptowana 21.10.2026**; dodana do Meta jako niepublikowane szkice (publikacja i aktywacja poza zgodą) — `qa/meta-draft/authorization.json` | `DO_WGRANIA/` |
| `diecik-instalacje-2026-10-18` | B2C: 4 filmy 20 s, 6 grafik, karuzela 4 karty — przepisy, kalorie i makro, plan treningu, ulubione | **Zaakceptowana rewizja 2**; wzorzec stylu. Zapis sesji z 18.10 mówi o 16 wyłączonych szkicach w Meta | `DO_WGRANIA/` |

## Seria filmów dla specjalistów i „Ulubione posiłki” (01–02.10.2026)

| Paczka | Zawartość | Status |
|---|---|---|
| `diecik-brand-v11-2026-10-02` | 3 filmy 20 s: trener, dietetyk, ulubione — z poprawioną nazwą „Diecik” | Ostatnia wersja serii. Film „Ulubione posiłki” wrócił w paczce 18.10 jako materiał kontrolny. Akceptacja dwóch filmów dla specjalistów: nieustalona. Pliki: `filmy/` |
| `paczka-3-filmy-2026-10-01` | te same 3 filmy przed poprawką nazwy | Zastąpiona przez v11 |
| `specjalista-v10-2026-10-01` | spot dietetyka ze spacerem | Wersja po uwagach do v9 (spacer zamiast siłowni, otwarcie z v8); weszła do v11 |
| `specjalista-v9-2026-10-01` | dietetyk: dieta i ruch; trener: trening i jadłospis | Zastąpiona przez v10 |
| `specjalista-v8-2026-10-01` | dietetyk i trener, panel w laptopie | Otwarcie wybrane przez Bartosza; reszta poprawiona w v9–v10 |
| `specjalista-v7-2026-10-01` | „Dieta nie kończy się w gabinecie” | **Koncepcja zaakceptowana**; ujęcia poprawione w v8 |
| `ulubione-v6-2026-10-01` | B2C + specjalista 30 s z opisami czynności | Część dla specjalistów **odrzucona** w całości: instruktaż panelu |
| `ulubione-v5-2026-10-01` | specjalista 25 s, cały panel w pionie | **Odrzucona**: „nic nie widac co tam jest klikane w tle” |
| `ulubione-v4-2026-10-01` | specjalista 25 s ze zbliżeniami | **Odrzucona**: „te przybliżenia to nie wiadomo o co chodzi” |
| `ulubione-v3-2026-10-01` | B2C 20 s, specjalista 15 s | B2C 20 s **zaakceptowany**; tempo filmów dla specjalistów odrzucone |
| `ulubione-v2-2026-10-01` | B2C 15 s i warianty | Zastąpiona: ekrany zmieniały się za szybko |

## Wcześniejsze

| Paczka | Zawartość | Status |
|---|---|---|
| `launch-2026-09-30` | kampania B2C i dla specjalistów: Meta, Google, organiczne, plan | **Odrzucona** 01.10.2026: całość wyglądała jak prezentacja |
| `specjalista-youtube-2026-09-29` | film dla specjalistów do YouTube i na `diecik.com/specjalista` | Wg README niepublikowany; akceptacja nieustalona. Pliki: `output/` |
| `meta-specjalista-ruch` | Reels/Stories dla dietetyków: dieta i ruch | Nieustalony; poprzednik serii z 01.10 |
| `meta-start-aplikacji` | pakiet startowy Meta: film 15 s, grafika Feed, teksty | Wg dawnego README folderu: aktualny, zaakceptowany pakiet startowy. Podkład z pętli Apple Loops (GarageBand), nie z własnej syntezy. Pliki: `meta/` |
| `Nagranie z ekranu 2026-09-29 o 15.59.18.mov` | surowe nagranie ekranu | Materiał źródłowy, poza Git |

## Co jest w Git

Dla każdej paczki: dokumenty, teksty, manifesty i skrypty. Gotowe media tylko dla paczek aktualnych, ostatniej wersji
serii (v11, v10), pakietu startowego, `meta-specjalista-ruch` i filmu YouTube. Klatki kontrolne, ZIP-y, stock
i zależności zostają na dysku — patrz `.gitignore`.

## Co zabrać z archiwum do nowej pracy

- **Styl i układ:** `diecik-instalacje-2026-10-18` i `diecik-deficyt-generator-2026-10-21`.
- **Dowody twierdzeń i specyfikacje Meta:** `diecik-instalacje-2026-10-18/qa/claims-review.md` i `qa/specs-sources.md`.
- **Koncepcja filmu dla specjalistów:** `specjalista-v7` → `v10` oraz lekcje z 01.10.2026.
- **Plan i budżet kampanii:** `ulubione-v6-2026-10-01/plan/` (ten sam plik w v2–v6).
