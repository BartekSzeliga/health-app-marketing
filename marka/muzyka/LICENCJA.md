# Podkłady muzyczne Diecik

Oryginalne podkłady instrumentalne do materiałów reklamowych Diecika. Kompozycja, aranżacja i brzmienie
powstały lokalnie przez syntezę dźwięku na zamówienie Bartosza. Bez nagrań osób, sampli, pętli z bibliotek,
cudzych utworów, lektora i odgłosów udających dotknięcia ekranu. Nie użyto biblioteki muzyki Meta
ani nagrań komercyjnych.

| Plik | Tempo | Pochodzenie |
|---|---|---|
| `przepisy-120bpm-20s.wav` | 120 BPM | paczka 18.10.2026, rewizja 2 (`diecik-recipes-groove-r2-20s-120bpm.wav`) |
| `dieta-124bpm-20s.wav` | 124 BPM | paczka 18.10.2026, rewizja 2 (`diecik-diet-groove-r2-20s-124bpm.wav`) |
| `trening-136bpm-20s.wav` | 136 BPM | paczka 18.10.2026, rewizja 2 (`diecik-training-groove-r2-20s-136bpm.wav`) |
| `cel-kalorii-124bpm-20s.wav` | 124 BPM | paczka 21.10.2026 (`diecik-deficit-groove-20261021-20s-124bpm.wav`) |
| `generator-126bpm-20s.wav` | 126 BPM | paczka 21.10.2026 (`diecik-generator-groove-20261021-20s-126bpm.wav`) |
| `kinowy-20s.wav` | spokojny, filmowy | spoty dla specjalistów v7–v10, 01.10.2026 (`diecik-cinematic-mix-20s.wav`); do filmów z nagraniami ludzi |

Format: stereo, 48 kHz, PCM 24 bit, 20 s; podkłady rytmiczne −14 LUFS, kinowy −15,4 LUFS. Pliki są kopiami bajt w bajt podkładów z zaakceptowanych paczek;
oryginalne opisy: `archiwum/reklamy/diecik-instalacje-2026-10-18/audio/LICENSE-r2.txt`
i `archiwum/reklamy/diecik-deficyt-generator-2026-10-21/audio/LICENSES.txt`.

## Użycie w kampanii

```json
"muzyka": { "plik": "marka/muzyka/generator-126bpm-20s.wav" }
```

Dla filmu o innej długości niż 20 s narzędzie generuje podkład z presetu pod czas filmu:

```json
"muzyka": { "preset": "generator" }
```

Presety `cel-kalorii` i `generator` to aranżacje dwóch podkładów z 21.10.2026 przeniesione do narzędzia
(`narzedzie/src/muzyka.mjs`). Porównanie z oryginałem: ten sam przebieg poza losowym szumem perkusji
(korelacja 0,98), ta sama głośność. Wygenerowany podkład zapisuje się w `muzyka/` kampanii i zawsze
wymaga odsłuchu Bartosza — narzędzie mierzy poziom, nie ocenia brzmienia.
