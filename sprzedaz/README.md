# Sprzedaż — decki dla firm

| Folder | Zawartość |
|---|---|
| `szablon/` | `Diecik Presentation Template.pptx` — szablon decka |
| `fabryka-ruchu/` | deck „Aplikacja pod Waszą marką” (PPTX, PDF), makiety, zrzuty aplikacji, pliki marki klienta |
| `michalina-gamon/` | deck „Aplikacja pod Twoją marką” (PPTX, PDF), makiety, zrzuty, `marka/brand.json` |
| `instrukcja-konta-apple-google/` | instrukcja zakładania kont Apple i Google dla firm (PDF, źródło HTML) i lista kontrolna wdrożenia |

Zasady decków: `zasady/proces.md`, część „Decki sprzedażowe”. Makiety w barwach klienta buduje narzędzie:
`./reklama nowa <klient> --typ firma` z `motyw` wskazującym `brand.json` klienta.

`michalina-gamon/build-deck.js` jest zapisem tego, jak powstał deck: odwołuje się do lokalnych zależności
i do umiejętności PPTX z sesji, w której był tworzony, więc nie uruchomi się bez ich odtworzenia.
