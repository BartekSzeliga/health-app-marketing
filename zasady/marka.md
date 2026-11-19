# Marka

Źródła: `archiwum/poprzedni-folder-marketing/brand-guide.md` oraz zaakceptowane paczki z 18.10 i 21.10.2026.

## Odbiorcy

| Segment | Kto | Główny komunikat |
|---|---|---|
| Osoba indywidualna (B2C) | planuje dietę i trening samodzielnie, chce oszczędzić czas, pilnuje kalorii, makro i regularności | **Dieta i trening w jednej aplikacji.** |
| Specjalista | dietetyk, trener personalny prowadzący podopiecznych | **Klient, tydzień, dieta, trening i wysyłka w jednym uporządkowanym procesie.** |
| Firma | siłownia, studio, gabinet — aplikacja pod własną marką dla klientów | **Aplikacja pod Twoją marką.** |

Każdy segment dostaje osobny materiał. Dietetyk i trener to też osobne materiały: dietetykowi pokazujemy
dietę i możliwość zalecania ruchu, trenerowi trening i możliwość dodania jadłospisu.
Etykiet i ekranów „Od specjalisty” nie przenosimy do kampanii dla osoby indywidualnej.

Gdy kampania promuje konkretną funkcję, ta funkcja jest główną obietnicą w hooku, ujęciach i tekstach.
„Dieta i trening w jednej aplikacji” zostaje wtedy tłem marki, a nie konkurencyjnym hasłem.

## Nazwa

- Zawsze **Diecik**: wielka litera, bez wersalików, bez wariantów pisowni. Dotyczy tekstów, napisów
  w filmie, okładek i logo końcowego. Narzędzie odrzuca `DIECIK`, `Dietcik` i podobne.
- Odmiana („w Dieciku”) jest dopuszczalna w tekstach reklam.
- Błędu w nazwie nie zamalowuje się w gotowym filmie — poprawia się go w definicji i renderuje ponownie.

## Styl reklam (zaakceptowany 18.10.2026)

Stały dla grafik, karuzel i filmów. Wartości są w `narzedzie/src/motyw.mjs`; ich zmiana zmienia wygląd wzorca.

| Rola | Kolor |
|---|---|
| sosna — ciemne tło, akcenty | `#153630` |
| krem — jasne tło | `#F6F5EF` |
| limonka — przycisk CTA | `#DAF2A5` |
| mięta — napisy na ciemnym tle | `#E3F0DD` |
| atrament — tekst na jasnym tle | `#18372F` |
| przygaszony — etykiety, dopiski | `#53645A` |

- **Pismo:** Baskerville w nagłówkach, Avenir Next w pozostałych napisach (fonty systemowe macOS, nie trafiają do repo).
- **Układ:** dużo światła, jedna obietnica na planszę, nagłówek w dwóch krótkich liniach, prawdziwy ekran aplikacji jako dowód.
- **Stałe elementy:** logo z nazwą u góry, przycisk CTA, informacja „Dane przykładowe”.
- **Wzorce do porównania:** `archiwum/reklamy/diecik-instalacje-2026-10-18/DO_WGRANIA` i
  `archiwum/reklamy/diecik-deficyt-generator-2026-10-21/DO_WGRANIA`.

Kolorów interfejsu aplikacji nie odtwarzamy w oprawie reklam. Aplikacja ma własną paletę, która zmienia
się razem z produktem; w reklamie widać ją wyłącznie na prawdziwych zrzutach.

## Marka klienta firmowego

Materiały dla aplikacji firmowej przyjmują logo i kolory klienta z jego `brand.json`
(`motyw` w kampanii). Układ, pismo i zasady treści zostają te same.

## Zasoby

- Logo i ikona: `marka/logo/` — te same pliki co w `health-app-frontend/public/brand`.
- Kody QR sklepów: `marka/sklepy/`.
- Podkłady muzyczne: `marka/muzyka/`.
- Adresy sklepów (z `health-app-frontend/src/components/MobileStoreButtons.tsx`, nie zgadujemy identyfikatorów):
  iOS `https://apps.apple.com/pl/app/diecik/id6762611821?l=pl`, Android `https://play.google.com/store/apps/details?id=com.helti.app`.
