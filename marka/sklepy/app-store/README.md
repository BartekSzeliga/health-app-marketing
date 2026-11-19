# QR — Diecik w App Store

Kod prowadzi bezpośrednio do polskiej karty aplikacji:

`https://apps.apple.com/pl/app/diecik/id6762611821?l=pl`

## Pliki

- `diecik-app-store-qr-980x980.png` — duży master do Canvy, prezentacji i
  materiałów ekranowych.
- `diecik-app-store-qr-392x392.png` — gotowy wariant do osadzenia w kreacji
  1080 px; każdy moduł QR ma całkowity rozmiar ośmiu pikseli.
- `diecik-app-store-qr.svg` — do druku i dowolnego skalowania bez utraty
  ostrości.

Kod ma korekcję błędów `H`, cztery moduły białego marginesu i ciemny kolor marki
`#14213D` na białym tle.

## Jak używać

- Umieść kod na spokojnym, jasnym tle.
- Nie przycinaj białego marginesu i nie nakładaj niczego na kod.
- Na ekranie eksportuj go w rozmiarze co najmniej `220 × 220 px`; w druku
  przyjmij co najmniej `30 × 30 mm`.
- Obok dodaj krótki opis, np. `Pobierz Diecik w App Store`.
- Po eksporcie finalnej reklamy zawsze zeskanuj kod z innego telefonu.

## Regeneracja

```bash
npx --yes qrcode@1.5.4 -t png -e H -q 4 -w 980 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/app-store/diecik-app-store-qr-980x980.png \
  'https://apps.apple.com/pl/app/diecik/id6762611821?l=pl'

npx --yes qrcode@1.5.4 -t png -e H -q 4 -w 392 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/app-store/diecik-app-store-qr-392x392.png \
  'https://apps.apple.com/pl/app/diecik/id6762611821?l=pl'

npx --yes qrcode@1.5.4 -t svg -e H -q 4 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/app-store/diecik-app-store-qr.svg \
  'https://apps.apple.com/pl/app/diecik/id6762611821?l=pl'
```
