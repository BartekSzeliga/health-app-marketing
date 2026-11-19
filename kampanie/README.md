# Kampanie

Każda kampania to folder `RRRR-MM-DD-nazwa/` założony przez `./reklama nowa <nazwa>`.

| Plik lub folder | Kto go tworzy | Co to |
|---|---|---|
| `kampania.json` | Ty | jedyne źródło prawdy: teksty plansz, kadry, sceny filmów, teksty reklam, dowody |
| `BRIEF.md` | Ty | ustalenia przed zrobieniem ujęć |
| `zrodla/ekrany`, `zrodla/nagrania` | Ty | autentyczne zrzuty i nagrania aplikacji, bez obróbki |
| `zrodla/material`, `zrodla/zdjecia` | Ty | nagrania stockowe (poza Git) i kadry z nich użyte na planszach |
| `muzyka/` | narzędzie | podkład wygenerowany z presetu pod długość filmu |
| `DO_WGRANIA/` | narzędzie | wyłącznie pliki do wgrania; niczego nie wkładaj tu ręcznie; w Git dopiero po akceptacji |
| `TEKSTY-REKLAM.txt`, `ZRODLA.txt`, `README.md`, `manifest.json` | narzędzie | teksty z licznikami, pochodzenie i dowody, opis paczki, sumy kontrolne i status |
| `podglad/` | narzędzie | strona podglądu (`./reklama pokaz`) |
| `qa/` | narzędzie | plansze kontrolne, storyboardy, raporty; poza Git |

Grafiki i filmy ostatniej pełnej paczki są też w `../DO_OBEJRZENIA/` — to folder, w którym Bartosz ogląda pracę.

Zmieniaj `kampania.json`, nie pliki wynikowe — po `./reklama buduj` wszystko powstaje od nowa z definicji.
Po akceptacji paczka jest zamrożona; poprawki idą do nowej kampanii (`./reklama nowa <nazwa> --z <kampania>`).
