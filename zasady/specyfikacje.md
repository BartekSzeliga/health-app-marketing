# Specyfikacje techniczne

Stan na **18.10.2026**, odczytany z publicznych stron Meta Ads Guide dla celu „Instalacje aplikacji”
(pełna tabela z adresami: `archiwum/reklamy/diecik-instalacje-2026-10-18/qa/specs-sources.md`).
Wartości używane przez narzędzie są w `narzedzie/specyfikacje/meta.json`.

To zalecenia projektowe Meta, nie gwarancja dostępności umiejscowienia na koncie. Narzędzie przypomina
o ponownej weryfikacji, gdy od daty w `meta.json` minie 60 dni. Stref i limitów nie przenosimy między
umiejscowieniami z pamięci — sprawdzamy u źródła dla każdego i aktualizujemy `meta.json` z nową datą.

## Formaty

| Format | Wymiary | Zastosowanie |
|---|---|---|
| 1:1 | 1440 × 1440 | Feed, karuzela |
| 4:5 | 1440 × 1800 | Feed (zalecany przez Meta) |
| 9:16 obraz | 1440 × 2560 | Stories, Reels |
| 9:16 film | 1440 × 2560, 30 kl./s | Reels, Stories |

Obrazy: JPG, do 30 MB. Karuzela: 2–10 kart.

## Film

MP4, H.264, yuv420p, stałe 30 kl./s, piksele kwadratowe, BT.709, AAC stereo 48 kHz, klatka kluczowa co sekundę.
Głośność −18…−12 LUFS (cel −14), szczyt najwyżej −1 dBTP. `./reklama buduj` sprawdza każdy z tych parametrów,
dekoduje plik w całości i zatrzymuje paczkę, jeśli któryś nie pasuje.

## Strefy bezpieczne 9:16

Napisy, logo i przycisk trzymamy poza 14% góry, 35% dołu i 6% boków kadru. Dla 1440 × 2560 to x 87–1353, y 359–1664.
Liczby podają Instagram Reels i Stories; Facebook Stories podaje 14% góry i 20% dołu — przyjmujemy ostrożniejszy wariant.
Narzędzie sprawdza rzeczywiste granice liter w każdej klatce filmu i na planszach 9:16.

## Zalecane długości tekstów

| Pole | Zalecenie | Uwaga |
|---|---|---|
| tekst główny | do 125 znaków | dłuższy zwija się pod „więcej”; Facebook Feed zaleca 50–150 |
| krótki wariant (Reels) | ok. 40 widocznych | |
| nagłówek | do 40 (Facebook Feed: 27) | |
| karuzela: tekst główny | do 125 (Facebook: 80) | |
| karuzela: nagłówek karty | do 20 | |
| karuzela: opis karty | do 18 | |

Przekroczenia narzędzie pokazuje informacyjnie — zaakceptowane paczki miały dłuższe teksty główne.
Opis i nagłówek nie są widoczne w każdym umiejscowieniu.

## Po eksporcie

Poprawny eksport nie oznacza poprawnego wyświetlenia. Przed uruchomieniem reklamy trzeba obejrzeć w Menedżerze reklam
podgląd każdego wybranego umiejscowienia, zwłaszcza widoczność napisów i CTA po kadrowaniu.
