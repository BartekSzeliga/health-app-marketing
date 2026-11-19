# Diecik — specjalista — dieta i ruch

Osobna kampania Meta Reels/Stories skierowana do dietetyków i specjalistów.
Materiał pokazuje prawdziwy panel specjalisty na przygotowanym koncie testowym
oraz fikcyjną klientkę `Joanna Wysocka (DEMO)`.

## Pliki publikacyjne

- `meta/reels-stories/diecik-meta-specialist-ruch-15s-v2-1080x1920.mp4` — film
  9:16, 15 s;
- `meta/subtitles/diecik-meta-specialist-ruch-15s-pl.srt` — pięć napisów PL;
- `meta/audio/diecik-meta-specialist-original.wav` — master muzyki 48 kHz;
- `meta/copy/meta-primary-text.md` — tekst reklamy, nagłówek i CTA.

## Materiały kontrolne i wybór kadrów

- `qa/contact-sheets/diecik-meta-specialist-ruch-15s-contact-sheet.jpg` —
  kontaktówka finalnego MP4;
- `qa/contact-sheets/diecik-specialist-panel-stills-selection.jpg` — siedem
  czystych kadrów z panelu do wyboru;
- `qa/direction/diecik-specialist-direction-v1.png` — zaakceptowany kierunek
  wizualny;
- `sources/panel/08-diet-week-macro-micro.png` — źródło trzeciej sceny z
  widokiem planu diety, makro i mikro;
- `qa/validation.json` — wynik 57/57 kontroli;
- `qa/specialist-ruch-manifest.json` — hashe i źródła montażu.

## Storyboard

1. `Twoja opieka może więcej — publikuj plany w aplikacji.`
2. `Dodaj plan treningowy.`
3. `Plan diety. Makro + mikro.`
4. `Dieta + trening. Publikacja w aplikacji klienta.`
5. `Pełniejsza opieka. Jeden panel.`

CTA prowadzi do `https://diecik.com/specjalista`. Komunikat o planie Free do
2 aktywnych klientów bez karty został sprawdzony w aktualnym landingu.

## Specyfikacja i QA

- 1080 × 1920, H.264 High 4.1, yuv420p, BT.709;
- dokładnie 15,00 s i 450 klatek, 30 fps CFR;
- klatka kluczowa co 1,00 s, pięć różnych scen po przejściach;
- atom `moov` przed `mdat`, dzięki czemu MP4 wspiera odtwarzanie progresywne;
- AAC-LC stereo 48 kHz, `-14,27 LUFS`, true peak `-1,53 dBTP`;
- pełne dekodowanie obrazu i dźwięku bez błędów;
- finalny capture był tylko do odczytu i nie wykonał zapisów API;
- SHA-256 MP4:
  `c024b017cee374b218026aa1f90a92f179179f437e23349c982d25c67e4ceb2f`.

## Reprodukcja

```bash
node marketing/reklamy/meta-specjalista-ruch/automation/capture-specialist-stills.mjs
node marketing/reklamy/meta-specjalista-ruch/automation/build-direction-board.mjs
node marketing/reklamy/meta-specjalista-ruch/automation/build-stills-board.mjs
node marketing/reklamy/meta-specjalista-ruch/automation/build-specialist-video.mjs
node marketing/reklamy/meta-specjalista-ruch/automation/validate-specialist-video.mjs
```

Nie wykonano commita, pushu, deployu ani publikacji reklamy.
