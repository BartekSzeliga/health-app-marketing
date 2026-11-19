# QR — Diecik w Google Play

Kod prowadzi bezpośrednio do karty aplikacji:

`https://play.google.com/store/apps/details?id=com.helti.app`

## Pliki

- `diecik-google-play-qr-980x980.png` — duży master do materiałów ekranowych.
- `diecik-google-play-qr-392x392.png` — wariant do kreacji 1080 px.
- `diecik-google-play-qr.svg` — wariant wektorowy do druku i skalowania.

Kod ma korekcję błędów `H`, cztery moduły białego marginesu i kolor marki
`#14213D` na białym tle.

## Regeneracja

```bash
npx --yes qrcode@1.5.4 -t png -e H -q 4 -w 980 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/google-play/diecik-google-play-qr-980x980.png \
  'https://play.google.com/store/apps/details?id=com.helti.app'

npx --yes qrcode@1.5.4 -t png -e H -q 4 -w 392 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/google-play/diecik-google-play-qr-392x392.png \
  'https://play.google.com/store/apps/details?id=com.helti.app'

npx --yes qrcode@1.5.4 -t svg -e H -q 4 \
  -d 14213Dff -l FFFFFFFF \
  -o marketing/assets/google-play/diecik-google-play-qr.svg \
  'https://play.google.com/store/apps/details?id=com.helti.app'
```

Po eksporcie materiału trzeba odczytać kod z finalnej klatki filmu, nie tylko
z pliku źródłowego.
