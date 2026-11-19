// Porównanie dwóch obrazów piksel po pikselu — używane przez test zgodności
// z zaakceptowanym wzorcem. Zwraca średnią różnicę kanału (0–255) i odsetek
// pikseli różniących się wyraźnie (ponad 24 na którymś kanale).
import { createCanvas, loadImage } from '@napi-rs/canvas';

export async function piksele(zrodlo) {
  const obraz = await loadImage(zrodlo);
  const canvas = createCanvas(obraz.width, obraz.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(obraz, 0, 0);
  return { szerokosc: obraz.width, wysokosc: obraz.height, dane: ctx.getImageData(0, 0, obraz.width, obraz.height).data };
}

export async function porownaj(a, b) {
  const [x, y] = [await piksele(a), await piksele(b)];
  if (x.szerokosc !== y.szerokosc || x.wysokosc !== y.wysokosc) return { zgodneWymiary: false, wymiary: [[x.szerokosc, x.wysokosc], [y.szerokosc, y.wysokosc]] };
  let suma = 0;
  let wyrazne = 0;
  for (let i = 0; i < x.dane.length; i += 4) {
    const roznica = Math.max(Math.abs(x.dane[i] - y.dane[i]), Math.abs(x.dane[i + 1] - y.dane[i + 1]), Math.abs(x.dane[i + 2] - y.dane[i + 2]));
    suma += roznica;
    if (roznica > 24) wyrazne += 1;
  }
  const liczba = x.dane.length / 4;
  return { zgodneWymiary: true, srednia: suma / liczba, wyrazne: wyrazne / liczba };
}
