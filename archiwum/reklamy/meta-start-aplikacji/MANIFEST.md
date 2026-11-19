# Diecik — launch Meta

Pierwszy zestaw informujący o starcie aplikacji, przygotowany dla Facebooka i
Instagrama. Materiał wideo ma własny instrumentalny miks z royalty-free Apple
Loops dołączonych do GarageBand, nie zawiera lektora i zachowuje pełny sens po
wyciszeniu.

## Pliki publikacyjne

| Plik | Rozmiar | SHA-256 |
|---|---:|---|
| `meta/reels-stories/diecik-meta-launch-15s-1080x1920.mp4` | 1.50 MB | `4b9847a74abfcc1b640c46d8efa838989bde8255bee2e0a6deb9c1aa3d6326b8` |
| `meta/feed-images/diecik-meta-launch-facebook-1080x1350.jpg` | 0.25 MB | `41238d55c06ac731a694a59e0f35bf19943f151d5822d26a1a091ea912a13f2e` |
| `meta/audio/diecik-meta-launch-original.wav` | 2.75 MB | `8d94a0cb7fa1b160adbdcb600f1dcf895091e72fd3c10e614b3cdb3774f5eea2` |
| `meta/subtitles/diecik-meta-launch-15s-pl.srt` | 0.00 MB | `4e1c29462efd5c7c09fee1ce36949877f86fd9cf33c1366d50a0b030916b5ede` |

## Specyfikacja

- film: 1080 × 1920, 15 s, 30 fps CFR, H.264 High, yuv420p, BT.709;
- obraz: stabilne plansze bez ciągłego zoomu; ruch tylko w 0,2-sekundowych
  przejściach crossfade;
- audio w filmie: AAC-LC, 48 kHz, stereo;
- grafika Feed: 1080 × 1350, JPEG, sRGB;
- interfejs: aktualne zrzuty aplikacji z 18 lipca 2026;
- audio: własny miks royalty-free Apple Loops; źródła i warunki użycia opisano
  w `meta/audio/LICENSES.md`;
- copy i kolejność publikacji: katalog `meta/copy` oraz
  `meta/UPLOAD-INSTRUCTIONS.md`.

## Reprodukcja

```bash
npm ci --prefix marketing/reklamy/meta-start-aplikacji/.tooling
node marketing/reklamy/meta-start-aplikacji/automation/build-launch.mjs
node marketing/reklamy/meta-start-aplikacji/automation/validate-launch.mjs
```
