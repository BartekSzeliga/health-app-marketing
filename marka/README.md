# Zasoby marki

| Folder | Zawartość |
|---|---|
| `logo/` | `diecik-icon.png` (ikona 512×512, używana na planszach i w filmach) i `diecik-logo.png`. Te same pliki co w `health-app-frontend/public/brand`. |
| `sklepy/` | zweryfikowane kody QR do karty Diecik w App Store i Google Play: PNG do ekranu, SVG do druku. Opis w `README.md` każdego folderu. |
| `muzyka/` | pięć zaakceptowanych podkładów po 20 s i ich licencja (`LICENCJA.md`). |

Kolory i pismo reklam: `zasady/marka.md` (wartości w `narzedzie/src/motyw.mjs`).

Marka klienta firmowego nie leży tutaj. Narzędzie czyta ją z `brand.json` klienta, np.
`sprzedaz/<klient>/marka/brand.json` albo `health-app-company-mobile/presentation-brands/<klient>/brand.json`.

Po zmianie logo w produkcie podmień pliki w `logo/` i przebuduj przykład wzorcowy — test zgodności
z paczką z 21.10.2026 pokaże różnicę i wtedy trzeba świadomie zaktualizować wzorzec.
