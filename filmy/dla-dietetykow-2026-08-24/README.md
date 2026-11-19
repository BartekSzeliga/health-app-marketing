# Film Diecik dla dietetyków — prawdziwy panel webowy

Finalny materiał trwa 73,03 s i składa się wyłącznie z nagrań rzeczywiście
uruchomionego panelu specjalisty na `http://localhost:3000`. Poprzedni film
oparty na wizualizacjach pozostaje artefaktem historycznym i nie jest wersją do
wysyłki.

## Artefakty do przekazania

- `output/diecik-dla-dietetykow-pelny-proces-youtube.mp4` — finalny master
  YouTube, 1920×1080, 30 fps, H.264 High/AAC;
- `output/diecik-dla-dietetykow-pelny-proces-thumbnail-1280x720.jpg` — miniatura
  z rzeczywistego widoku przepisu klienta;
- `output/diecik-dla-dietetykow-pelny-proces-youtube-pl.srt` — polskie napisy;
- `output/diecik-dla-dietetykow-pelny-proces-final-contact-sheet.png` — klatki
  z osi czasu finalnego mastera;
- `output/diecik-dla-dietetykow-pelny-proces-contact-sheet.png` — 16 klatek
  źródłowych przed montażem.

## Co pokazuje film

1. Przełączenie prawdziwego profilu specjalisty na przejrzysty tryb
   `Tylko dieta`.
2. Wyszukanie szablonu `7 dni`, wybór dnia i posiłku.
3. Makroskładniki, mikroskładniki oraz pełny przepis z przygotowaniem.
4. Joannę Wysocką (DEMO) ze statusem połączonego konta.
5. Kontrolę pakietu tylko z dietą oraz cele, w których wartości mieszczą się
   w czytelnych, nieczerwonych zakresach.
6. Rzeczywistą publikację pakietu w aplikacji klienta — bez PDF-u jako głównej
   ścieżki.
7. Opublikowany plan i przepis widziane z osobnego konta klienta.
8. Prawdziwy czat klienta ze specjalistą.

Kursor widoczny w filmie jest warstwą nagrania pokazującą rzeczywiste kliknięcia
automatu w prawdziwym DOM. Każdy z ośmiu klipów ma osobną listę dozwolonych
zapisów. Pipeline wykonał tylko trzy oczekiwane akcje 2xx: zmianę profilu,
publikację planu i oznaczenie rozmowy jako przeczytanej. Każdy inny zapis jest
blokowany i przerywa nagranie.

## Dźwięk i oprawa

Master nie używa systemowego lektora. Ma licencjonowany podkład marki, czytelne
wbudowane podpisy i osobny plik SRT. Nagłówki są widoczne tylko przez pierwsze
3,2 s ujęcia i zajmują górny pasek, dzięki czemu body aplikacji pozostaje
czytelne. Końcowe CTA pozostaje na prawdziwym ekranie czatu klienta.

## Odtworzenie

Pipeline znajduje się w `video/capture`. Hasło konta DEMO musi być przekazane
wyłącznie przez zmienną środowiskową i nie jest zapisywane w skryptach:

```bash
cd "tmp/promo trener dane/video/capture"
DIECIK_WEB_URL=http://localhost:3000 \
  DIECIK_DEMO_PASSWORD='...' \
  DIECIK_CLIENT_DEMO_PASSWORD='...' npm run capture
DIECIK_NO_NARRATION=1 npm run assemble
npm run verify
```

Film nie został przesłany na YouTube ani opublikowany.
