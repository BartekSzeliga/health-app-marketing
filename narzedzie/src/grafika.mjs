import fsp from 'node:fs/promises';
import path from 'node:path';
import { Plotno, createCanvas, wczytajObraz } from './plotno.mjs';
import { FORMATY } from './kampania.mjs';
import { sha256 } from './wspolne.mjs';

const SZER = 1440;
// Bezpieczna ramka napisów na grafikach (z render-static.mjs 21.10).
const ramkaGrafiki = (wysokosc) => ({ lewo: 55, prawo: 1385, gora: 45, dol: wysokosc - 42 });

// Układ dzielony: tekst na kremie po lewej, urządzenie na sośnie po prawej.
// Liczby dla 1x1 i 4x5 pochodzą z zaakceptowanych grafik; pozostałe odstępy
// są z nich wyprowadzone, żeby inna liczba linii nie rozsypała kompozycji.
const DZIELONY = {
  '1x1': { etykieta: 292, naglowek: 459, interlinia: 124, doKreski: 139, doTresci: 84, doDopisku: 120, cta: 1155, telefon: { x: 1095, y: 744, wysokosc: 1170, kat: -0.023 }, dolDetalu: 1356 },
  '4x5': { etykieta: 315, naglowek: 494, interlinia: 132, doKreski: 164, doTresci: 102, doDopisku: 151, cta: 1393, telefon: { x: 1063, y: 929, wysokosc: 1488, kat: -0.023 }, dolDetalu: 1690 },
};
const KARTA = {
  '1x1': { etykieta: 296, naglowek: 466, interlinia: 121, doTresci: 227, doDopisku: 139, cta: 1131, kropki: 1363, telefon: { x: 1093, y: 745, wysokosc: 1170 }, dolDetalu: 1356 },
  '4x5': { etykieta: 315, naglowek: 500, interlinia: 130, doTresci: 250, doDopisku: 150, cta: 1393, kropki: 1716, telefon: { x: 1063, y: 929, wysokosc: 1488 }, dolDetalu: 1690 },
};
// W układzie pasowym 4:5 ma więcej wysokości niż kwadrat, więc nagłówek może być większy.
const DRABINKA = { dzielony: [114, 108, 102, 96, 90, 84], karta: [104, 98, 94, 88, 82], pasowy: { '4x5': [120, 112, 104, 96, 90, 84, 78, 72], '1x1': [104, 96, 90, 84, 78, 72] }, zdjecie: { '4x5': [132, 124, 116, 108, 100, 92], '1x1': [116, 108, 100, 92, 84], '9x16': [140, 132, 124, 116, 108, 100] }, pion: [140, 132, 124, 116, 108, 100] };

async function zasoby(k, klucze) {
  const wynik = { logo: (await wczytajObraz(k.motyw.logo)).obraz };
  for (const klucz of klucze.filter(Boolean)) wynik[klucz] = (await wczytajObraz(k.zrodla[klucz].plik)).obraz;
  return wynik;
}
const kluczeZrodel = (k, wpis) => [wpis.ekran, wpis.ekran2, wpis.ekran3, wpis.panel, wpis.zdjecie, wpis.detal && k.kadry[wpis.detal].zrodlo];

/** Największy rozmiar z drabinki, przy którym każda linia mieści się w `max`; przypięty rozmiar ma pierwszeństwo. */
function rozmiarNaglowka(p, linie, drabinka, max, przypiety) {
  if (przypiety) return przypiety;
  return drabinka.find((rozmiar) => linie.every((linia) => p.szerokoscTekstu(linia, rozmiar, { szeryf: true }) <= max)) ?? drabinka.at(-1);
}

function tloDzielone(p, wysokosc) {
  const { ctx, kolory: K } = p;
  ctx.fillStyle = K.cream; ctx.fillRect(0, 0, SZER, wysokosc);
  ctx.fillStyle = K.pine; ctx.fillRect(744, 0, 696, wysokosc);
  const gradient = ctx.createRadialGradient(1130, wysokosc * 0.35, 15, 1130, wysokosc * 0.44, 820);
  gradient.addColorStop(0, K.poswiata); gradient.addColorStop(1, K.poswiataKoniec);
  ctx.fillStyle = gradient; ctx.fillRect(744, 0, 696, wysokosc);
  ctx.save(); ctx.strokeStyle = K.okregi; ctx.lineWidth = 2;
  for (const odsuniecie of [0, 43]) { ctx.beginPath(); ctx.ellipse(1210, wysokosc * 0.52, 390 + odsuniecie, 680 + odsuniecie, -0.06, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/** Krem u góry, sosnowy pas od `odY` w dół — dla układów z szerokim panelem i dla pionu 9:16. */
function tloPasowe(p, wysokosc, odY) {
  const { ctx, kolory: K } = p;
  ctx.fillStyle = K.cream; ctx.fillRect(0, 0, SZER, wysokosc);
  ctx.fillStyle = K.pine; ctx.fillRect(0, odY, SZER, wysokosc - odY);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, odY, SZER, wysokosc - odY); ctx.clip();
  const srodek = odY + (wysokosc - odY) * 0.5;
  const gradient = ctx.createRadialGradient(SZER * 0.62, srodek, 20, SZER * 0.62, srodek, 900);
  gradient.addColorStop(0, K.poswiata); gradient.addColorStop(1, K.poswiataKoniec);
  ctx.fillStyle = gradient; ctx.fillRect(0, odY, SZER, wysokosc - odY);
  ctx.strokeStyle = K.okregi; ctx.lineWidth = 2;
  for (const odsuniecie of [0, 43]) { ctx.beginPath(); ctx.ellipse(SZER * 0.7, srodek + 120, 620 + odsuniecie, 430 + odsuniecie, -0.06, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/** Logo i nazwa w lewym górnym rogu; dłuższa nazwa klienta firmowego dostaje mniejszy stopień pisma. */
function marka(p, k, logo, { x = 96, y = 87, max = 500 } = {}) {
  const dostepne = max - 78 * logo.width / logo.height - 16;
  const rozmiar = [62, 56, 50, 44, 38].find((stopien) => p.szerokoscTekstu(k.motyw.nazwa, stopien, { waga: 700 }) <= dostepne) ?? 38;
  p.marka(k.motyw, logo, { x, y, rozmiar: 78, rozmiarNazwy: rozmiar, liniaBazowa: y + 58, max: dostepne });
}

/** Przycisk CTA z planszy; rośnie, gdy napis jest dłuższy od wzorcowego „Pobierz Diecik”. */
function cta(p, k, y, { x = 96, podpis = true, kolorPodpisu } = {}) {
  const { ctx, kolory: K } = p;
  const napis = k.cta.plansza;
  const szerokosc = Math.max(468, Math.ceil(p.szerokoscTekstu(napis, 43, { waga: 700 })) + 119);
  const wysokosc = 98;
  ctx.fillStyle = K.przycisk; p.zaokraglij(x, y, szerokosc, wysokosc, 25); ctx.fill();
  p.tekst(napis, x + 29, y + 65, 43, { waga: 700, max: szerokosc - 90, kolor: K.naPrzycisku });
  ctx.save(); ctx.strokeStyle = K.strzalka; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + szerokosc - 51, y + 49); ctx.lineTo(x + szerokosc - 30, y + 49);
  ctx.moveTo(x + szerokosc - 39, y + 40); ctx.lineTo(x + szerokosc - 30, y + 49); ctx.lineTo(x + szerokosc - 39, y + 58); ctx.stroke(); ctx.restore();
  if (podpis && k.cta.podpis) p.tekst(k.cta.podpis, x + 3, y + 151, 32, { kolor: kolorPodpisu ?? K.muted, max: 620 });
  return { x, y, szerokosc, wysokosc };
}

function ujawnienie(p, k, x, y) {
  if (k.ujawnienie) p.tekst(k.ujawnienie, x, y, 30, { kolor: p.kolory.mint, wyrownanie: 'center', max: 560 });
}

/** Karta detalu w układzie dzielonym: 90 px wchodzi na kolumnę tekstu, więc pilnujemy zasłonięć. */
function detalDzielony(p, k, wpis, obrazy, format, dolDetalu) {
  const kadr = k.kadry[wpis.detal];
  const szerokosc = 740;
  const wysokosc = szerokosc * kadr.wys / kadr.szer;
  const x = 654;
  const y = wpis.pozycjaDetalu?.[format] ?? Math.round(dolDetalu - wysokosc);
  p.sprawdzZasloniecie({ x, y, szerokosc, wysokosc }, 'Karta detalu', (pole) => pole.lewo < 744);
  return p.detal(obrazy[kadr.zrodlo], kadr, { x, y, szerokosc });
}

/** Prostokąt zajmowany przez telefon (bez uwzględniania lekkiego obrotu) do kontroli zasłonięć. */
const obrysTelefonu = (t) => ({ x: t.x - t.szerokosc / 2 - 12, y: t.y - t.wysokosc / 2 - 12, szerokosc: t.szerokosc + 24, wysokosc: t.wysokosc + 24 });

function urzadzeniaDzielone(p, k, wpis, obrazy, format, geometria, kat) {
  const t = geometria.telefon;
  if (wpis.uklad === 'dwa-telefony') {
    // Dwa telefony mieszczą się w sosnowej kolumnie; tylny wychodzi lekko za prawą krawędź.
    const [przod, tyl] = format === '4x5'
      ? [{ x: 1006, y: 850, wysokosc: 1010, kat: -0.03 }, { x: 1278, y: 985, wysokosc: 930, kat: 0.04 }]
      : [{ x: 1000, y: 690, wysokosc: 920, kat: -0.03 }, { x: 1266, y: 790, wysokosc: 850, kat: 0.04 }];
    p.telefon(obrazy[wpis.ekran2], tyl);
    p.sprawdzZasloniecie(obrysTelefonu(p.telefon(obrazy[wpis.ekran], przod)), 'Telefon');
    return;
  }
  p.sprawdzZasloniecie(obrysTelefonu(p.telefon(obrazy[wpis.ekran], { x: t.x, y: t.y, wysokosc: t.wysokosc, kat: kat ?? t.kat })), 'Telefon');
  if (wpis.uklad === 'telefon+detal') detalDzielony(p, k, wpis, obrazy, format, geometria.dolDetalu);
}

function grafikaDzielona(p, k, temat, obrazy, format) {
  const g = DZIELONY[format];
  const wysokosc = FORMATY[format][1];
  const K = p.kolory;
  tloDzielone(p, wysokosc);
  marka(p, k, obrazy.logo);
  if (temat.etykieta) p.tekst(temat.etykieta.toLocaleUpperCase('pl-PL'), 96, g.etykieta, 30, { kolor: K.muted, waga: 600, max: 610 });
  const rozmiar = rozmiarNaglowka(p, temat.naglowek, DRABINKA.dzielony, 650, temat.rozmiarNaglowka);
  p.linie(temat.naglowek, 90, g.naglowek, rozmiar, g.interlinia, { szeryf: true, max: 650 });
  let y = g.naglowek + (temat.naglowek.length - 1) * g.interlinia + g.doKreski;
  p.ctx.fillStyle = K.pine; p.ctx.fillRect(96, y, 70, 4);
  y += g.doTresci;
  if (temat.tresc.length) { p.linie(temat.tresc, 96, y, 43, 62, { max: 610 }); y += (temat.tresc.length - 1) * 62; }
  if (temat.cena) { y += 150; p.cena(temat.cena, { x: 96, y, rozmiar: 118 }); }
  if (temat.dopisek) { y += temat.cena ? 70 : g.doDopisku; p.tekst(temat.dopisek, 96, y, 29, { max: 620, kolor: K.muted }); }
  if (y > g.cta - 40) p.problem(`tekst kończy się na y=${Math.round(y)}, a przycisk zaczyna na ${g.cta} — usuń linię nagłówka lub treści`);
  cta(p, k, g.cta);
  urzadzeniaDzielone(p, k, temat, obrazy, format, g);
  ujawnienie(p, k, 1087, wysokosc - 54);
}

function kartaDzielona(p, k, karta, obrazy, format, numer, liczba) {
  const g = KARTA[format];
  const wysokosc = FORMATY[format][1];
  const K = p.kolory;
  tloDzielone(p, wysokosc);
  marka(p, k, obrazy.logo);
  if (karta.etykieta) p.tekst(karta.etykieta, 96, g.etykieta, 30, { kolor: K.muted, waga: 600, max: 620 });
  const rozmiar = rozmiarNaglowka(p, karta.naglowek, DRABINKA.karta, 650, karta.rozmiarNaglowka);
  p.linie(karta.naglowek, 90, g.naglowek, rozmiar, g.interlinia, { szeryf: true, max: 650 });
  let y = g.naglowek + (karta.naglowek.length - 1) * g.interlinia + g.doTresci;
  if (karta.tresc.length) { p.linie(karta.tresc, 96, y, 40, 61, { max: 605 }); y += (karta.tresc.length - 1) * 61; }
  if (karta.dopisek) { y += g.doDopisku; p.tekst(karta.dopisek, 96, y, 29, { max: 620, kolor: K.muted }); }
  if (y > g.cta - 40) p.problem(`tekst kończy się na y=${Math.round(y)}, a przycisk zaczyna na ${g.cta} — usuń linię nagłówka lub treści`);
  cta(p, k, g.cta);
  for (let kropka = 0; kropka < liczba; kropka += 1) {
    p.ctx.fillStyle = kropka === numer ? K.pine : K.kropka;
    p.zaokraglij(96 + kropka * 44, g.kropki, 27, 6, 3); p.ctx.fill();
  }
  urzadzeniaDzielone(p, k, karta, obrazy, format, g, numer % 2 ? 0.014 : -0.021);
  ujawnienie(p, k, 1087, wysokosc - 54);
}

/** Okno panelu web (opcjonalnie z telefonem klienta w prawym dolnym rogu) dla układu pasowego. */
function grupaPanelu(p, temat, obrazy, { gora, wysokosc, pion }) {
  const zTelefonem = temat.uklad === 'panel+telefon';
  const obrazPanelu = obrazy[temat.panel];
  const wysokoscPanelu = (szerokosc) => Math.round(szerokosc * 0.034) + szerokosc * obrazPanelu.height / obrazPanelu.width;
  const miejsce = wysokosc - 70 - gora;
  let szerokosc = zTelefonem ? 1130 : 1248;
  // W kwadracie panel może wychodzić za dolną krawędź (widać co najmniej 60% ekranu):
  // większy interfejs jest czytelniejszy niż cały, ale drobny.
  while (szerokosc > 700 && miejsce < wysokoscPanelu(szerokosc) * (pion ? 1 : 0.6)) szerokosc -= 8;
  if (szerokosc <= 700) p.problem('panel web nie mieści się pod tekstem — skróć nagłówek lub treść albo użyj formatu 4x5');
  const x = zTelefonem ? 96 : Math.round((SZER - szerokosc) / 2);
  const panelY = Math.round(gora + Math.max(0, (miejsce - wysokoscPanelu(szerokosc)) * 0.4));
  return {
    pas: Math.round(panelY + wysokoscPanelu(szerokosc) * 0.24),
    rysuj() {
      p.sprawdzZasloniecie(p.panel(obrazPanelu, { x, y: panelY, szerokosc }), 'Okno panelu');
      if (zTelefonem) {
        const wysokoscTelefonu = Math.min(pion ? 820 : 640, wysokosc - 60 - panelY - 40);
        p.telefon(obrazy[temat.ekran], { x: 1236, y: wysokosc - 60 - wysokoscTelefonu / 2, wysokosc: wysokoscTelefonu, kat: 0.02 });
      }
    },
  };
}

/**
 * Rząd trzech telefonów: środkowy większy i z przodu, boczne lekko odchylone.
 * `widoczne` to część wysokości telefonu, która musi zmieścić się na planszy;
 * poniżej 1 telefony wychodzą za dolną krawędź, żeby ekrany były większe.
 */
function grupaTrzechTelefonow(p, temat, obrazy, { gora, dol, widoczne, najwyzszy }) {
  const [srodkowy, lewy, prawy] = [obrazy[temat.ekran], obrazy[temat.ekran2], obrazy[temat.ekran3]];
  const h = Math.round(Math.min(najwyzszy, Math.max(700, (dol - gora) / widoczne)));
  const hBoczny = Math.round(h * 0.9);
  const szerokosc = (obraz, wysokosc) => wysokosc * obraz.width / obraz.height;
  // Telefony stoją obok siebie bez nachodzenia: na każdym ma być widać cały nagłówek ekranu z logo.
  const odstep = szerokosc(srodkowy, h) / 2 + Math.max(szerokosc(lewy, hBoczny), szerokosc(prawy, hBoczny)) / 2 + 30;
  return {
    pas: Math.round(gora + h * 0.42),
    rysuj() {
      p.telefon(lewy, { x: SZER / 2 - odstep, y: gora + 60 + hBoczny / 2, wysokosc: hBoczny, kat: -0.035 });
      p.telefon(prawy, { x: SZER / 2 + odstep, y: gora + 60 + hBoczny / 2, wysokosc: hBoczny, kat: 0.035 });
      p.sprawdzZasloniecie(obrysTelefonu(p.telefon(srodkowy, { x: SZER / 2, y: gora + h / 2, wysokosc: h })), 'Telefon');
    },
  };
}

/**
 * Układ pasowy dla 1:1 i 4:5: tekst i przycisk u góry na kremie, urządzenia
 * poniżej na sosnowym pasie. Używany, gdy urządzenie potrzebuje całej
 * szerokości planszy: panel web albo rząd telefonów.
 */
function grafikaPasowa(p, k, temat, obrazy, format) {
  const wysokosc = FORMATY[format][1];
  const K = p.kolory;
  const pion = format === '4x5';
  const etykietaY = pion ? 330 : 286;
  const rozmiar = rozmiarNaglowka(p, temat.naglowek, DRABINKA.pasowy[format], 1240, temat.rozmiarNaglowka);
  const interlinia = Math.round(rozmiar * 1.09);
  const naglowekY = etykietaY + (pion ? 128 : 110);
  let y = naglowekY + (temat.naglowek.length - 1) * interlinia;
  const trescY = y + (pion ? 96 : 80);
  if (temat.tresc.length) y = trescY + (temat.tresc.length - 1) * 56;
  // Cena stoi pod nagłówkiem (lub treścią) jako największy element po nagłówku.
  const rozmiarCeny = pion ? 150 : 128;
  const cenaY = y + Math.round(rozmiarCeny * 0.78) + (pion ? 70 : 54);
  if (temat.cena) y = cenaY;
  const dopisekY = y + (temat.cena ? 78 : 62);
  if (temat.dopisek) y = dopisekY;
  const gora = y + (pion ? 96 : 64);
  const grupa = temat.uklad === 'trzy-telefony'
    ? grupaTrzechTelefonow(p, temat, obrazy, { gora, dol: wysokosc, widoczne: pion ? 0.88 : 0.7, najwyzszy: 1010 })
    : grupaPanelu(p, temat, obrazy, { gora, wysokosc, pion });

  tloPasowe(p, wysokosc, grupa.pas);
  marka(p, k, obrazy.logo, { max: 700 });
  const szerokoscPrzycisku = Math.max(468, Math.ceil(p.szerokoscTekstu(k.cta.plansza, 43, { waga: 700 })) + 119);
  const przycisk = cta(p, k, 77, { x: 1344 - szerokoscPrzycisku, podpis: false });
  if (k.cta.podpis) p.tekst(k.cta.podpis, 1344, przycisk.y + 151, 32, { kolor: K.muted, wyrownanie: 'right', max: 620 });
  if (temat.etykieta) p.tekst(temat.etykieta.toLocaleUpperCase('pl-PL'), 96, etykietaY, 30, { kolor: K.muted, waga: 600, max: 800 });
  // Urządzenia mogą sięgać dolnej krawędzi, więc informacja o danych przykładowych stoi w wierszu etykiety.
  if (k.ujawnienie) p.tekst(k.ujawnienie, 1344, etykietaY, 28, { kolor: K.muted, wyrownanie: 'right', max: 420 });
  p.linie(temat.naglowek, 90, naglowekY, rozmiar, interlinia, { szeryf: true, max: 1240 });
  if (temat.tresc.length) p.linie(temat.tresc, 96, trescY, 40, 56, { max: 1240 });
  if (temat.cena) p.cena(temat.cena, { x: 96, y: cenaY, rozmiar: rozmiarCeny });
  if (temat.dopisek) p.tekst(temat.dopisek, 96, dopisekY, 29, { kolor: K.muted, max: 1240 });
  grupa.rysuj();
}

/**
 * Pion 9:16 (Stories, Reels jako obraz). Napisy, logo i przycisk stoją w
 * strefie bezpiecznej Meta; urządzenia zajmują dolną część i są widoczne w całości.
 */
function grafikaPionowa(p, k, temat, obrazy) {
  const wysokosc = FORMATY['9x16'][1];
  const K = p.kolory;
  const { ctx } = p;
  const rozmiar = rozmiarNaglowka(p, temat.naglowek, DRABINKA.pion, 1180, temat.rozmiarNaglowka);
  const interlinia = Math.round(rozmiar * 1.1);
  const naglowekY = 700;
  let y = naglowekY + (temat.naglowek.length - 1) * interlinia + 118;
  const trescY = y;
  if (temat.tresc.length) y += (temat.tresc.length - 1) * 70;
  else y -= 70;
  const cenaY = y + 190;
  if (temat.cena) y = cenaY;
  const dopisekY = y + (temat.cena ? 86 : 76);
  if (temat.dopisek) y = dopisekY;
  const przyciskY = y + 70;
  const gora = przyciskY + (k.cta.podpis ? 165 : 98) + 80;
  const miejsce = wysokosc - 70 - gora;

  ctx.fillStyle = K.cream; ctx.fillRect(0, 0, SZER, wysokosc);
  const gradient = ctx.createRadialGradient(1133, 1500, 53, 1040, 1500, 1360);
  gradient.addColorStop(0, K.filmJasne[0]); gradient.addColorStop(0.56, K.filmJasne[1]); gradient.addColorStop(1, K.filmJasne[2]);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, SZER, wysokosc);
  const pas = Math.round(gora + miejsce * 0.46);
  ctx.fillStyle = K.pine; ctx.fillRect(0, pas, SZER, wysokosc - pas);
  ctx.save(); ctx.beginPath(); ctx.rect(0, pas, SZER, wysokosc - pas); ctx.clip();
  const poswiata = ctx.createRadialGradient(SZER * 0.6, wysokosc - 200, 20, SZER * 0.6, wysokosc - 200, 900);
  poswiata.addColorStop(0, K.poswiata); poswiata.addColorStop(1, K.poswiataKoniec);
  ctx.fillStyle = poswiata; ctx.fillRect(0, pas, SZER, wysokosc - pas);
  ctx.strokeStyle = K.okregi; ctx.lineWidth = 2;
  for (const odsuniecie of [0, 43]) { ctx.beginPath(); ctx.ellipse(SZER * 0.68, wysokosc - 120, 640 + odsuniecie, 470 + odsuniecie, -0.06, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();

  const dostepne = 1180 - 68 * obrazy.logo.width / obrazy.logo.height - 16;
  const stopienNazwy = [63, 56, 50, 44].find((stopien) => p.szerokoscTekstu(k.motyw.nazwa, stopien, { waga: 700 }) <= dostepne) ?? 44;
  p.marka(k.motyw, obrazy.logo, { x: 115, y: 372, rozmiar: 68, rozmiarNazwy: stopienNazwy, liniaBazowa: 426, odstep: 16, max: dostepne });
  if (temat.etykieta) p.tekst(temat.etykieta.toLocaleUpperCase('pl-PL'), 115, 540, 34, { kolor: K.muted, waga: 600, max: 1180 });
  p.linie(temat.naglowek, 109, naglowekY, rozmiar, interlinia, { szeryf: true, max: 1180 });
  if (temat.tresc.length) p.linie(temat.tresc, 115, trescY, 50, 70, { waga: 600, max: 1180 });
  if (temat.cena) p.cena(temat.cena, { x: 115, y: cenaY, rozmiar: 170 });
  if (temat.dopisek) p.tekst(temat.dopisek, 115, dopisekY, 36, { kolor: K.muted, max: 1180 });
  const przycisk = cta(p, k, przyciskY, { x: 115 });
  if (k.ujawnienie) p.tekst(k.ujawnienie, 1325, przycisk.y + 62, 30, { kolor: K.muted, wyrownanie: 'right', max: 420 });
  if (miejsce < 700) p.problem(`na urządzenie zostaje ${Math.round(miejsce)} px wysokości — skróć tekst planszy 9:16`);

  if (temat.uklad === 'panel' || temat.uklad === 'panel+telefon') {
    const obrazPanelu = obrazy[temat.panel];
    const zTelefonem = temat.uklad === 'panel+telefon';
    const szerokosc = 1260;
    const wysokoscPanelu = Math.round(szerokosc * 0.034) + szerokosc * obrazPanelu.height / obrazPanelu.width;
    const panel = p.panel(obrazPanelu, { x: 90, y: Math.round(gora + Math.max(0, (miejsce - wysokoscPanelu) * (zTelefonem ? 0.15 : 0.45))), szerokosc });
    p.sprawdzZasloniecie(panel, 'Okno panelu');
    if (zTelefonem) { const h = Math.min(860, miejsce * 0.8); p.telefon(obrazy[temat.ekran], { x: 1130, y: wysokosc - 70 - h / 2, wysokosc: h, kat: 0.02 }); }
  } else if (temat.uklad === 'trzy-telefony') {
    grupaTrzechTelefonow(p, temat, obrazy, { gora, dol: wysokosc - 70, widoczne: 1, najwyzszy: 980 }).rysuj();
  } else if (temat.uklad === 'dwa-telefony') {
    const h = Math.min(1180, miejsce);
    p.telefon(obrazy[temat.ekran2], { x: 1005, y: gora + miejsce - h * 0.47, wysokosc: h * 0.94, kat: 0.03 });
    p.sprawdzZasloniecie(obrysTelefonu(p.telefon(obrazy[temat.ekran], { x: 455, y: gora + h / 2, wysokosc: h, kat: -0.03 })), 'Telefon');
  } else {
    const h = Math.min(1500, miejsce);
    const zDetalem = temat.uklad === 'telefon+detal';
    p.sprawdzZasloniecie(obrysTelefonu(p.telefon(obrazy[temat.ekran], { x: zDetalem ? 500 : 720, y: gora + h / 2, wysokosc: h, kat: -0.02 })), 'Telefon');
    if (zDetalem) {
      const kadr = k.kadry[temat.detal];
      const szerokosc = 720;
      const wysokoscDetalu = szerokosc * kadr.wys / kadr.szer;
      p.detal(obrazy[kadr.zrodlo], kadr, { x: 640, y: Math.round(Math.max(gora + 120, wysokosc - 110 - wysokoscDetalu)), szerokosc });
    }
  }
}

/**
 * Zdjęcie na całe tło: człowiek i sytuacja zamiast makiety. U góry pytanie lub
 * teza, u dołu odpowiedź z ofertą i przyciskiem, po prawej telefon jako dowód.
 * Napisy stoją na przyciemnieniach, więc czytają się na każdym zdjęciu.
 */
function grafikaZdjeciowa(p, k, temat, obrazy, format) {
  const wysokosc = FORMATY[format][1];
  const K = p.kolory;
  const { ctx } = p;
  const pion = format === '9x16';
  const zdjecie = obrazy[temat.zdjecie];
  // Kadr wypełnia planszę; `ostrosc` wskazuje punkt zdjęcia, który ma zostać w kadrze (ułamki szerokości i wysokości).
  const [ox, oy] = temat.ostrosc ?? [0.5, 0.4];
  const skala = Math.max(SZER / zdjecie.width, wysokosc / zdjecie.height) * (temat.powiekszenie ?? 1);
  const [sw, sh] = [SZER / skala, wysokosc / skala];
  const sx = Math.min(Math.max(zdjecie.width * ox - sw / 2, 0), zdjecie.width - sw);
  const sy = Math.min(Math.max(zdjecie.height * oy - sh / 2, 0), zdjecie.height - sh);
  // `odbicie` odwraca zdjęcie w poziomie, gdy bohater stoi po stronie nagłówka (dozwolone dla zdjęć, nigdy dla ekranów aplikacji).
  ctx.save();
  if (temat.odbicie) { ctx.translate(SZER, 0); ctx.scale(-1, 1); }
  ctx.drawImage(zdjecie, sx, sy, sw, sh, 0, 0, SZER, wysokosc);
  ctx.restore();
  // Przyciemnienia tylko tam, gdzie stoją napisy: lewa strona pod nagłówek, dół pod ofertę,
  // wąski pas u góry pod markę. Bohater zdjęcia zostaje jasny.
  const cien = (x0, y0, x1, y1, przystanki) => {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [miejsce, alfa] of przystanki) gradient.addColorStop(miejsce, `rgba(8,22,18,${alfa})`);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, SZER, wysokosc);
  };
  cien(0, 0, SZER * 0.7, 0, [[0, 0.8], [0.55, 0.42], [1, 0]]);
  cien(0, 0, 0, wysokosc * 0.2, [[0, 0.5], [1, 0]]);
  cien(0, wysokosc * 0.5, 0, wysokosc, [[0, 0], [0.5, 0.6], [1, 0.92]]);

  const x = pion ? 115 : 96;
  const gora = pion ? 372 : 87;
  const dostepne = 720 - 78 * obrazy.logo.width / obrazy.logo.height - 16;
  const stopienNazwy = [62, 56, 50, 44].find((stopien) => p.szerokoscTekstu(k.motyw.nazwa, stopien, { waga: 700 }) <= dostepne) ?? 44;
  p.marka(k.motyw, obrazy.logo, { x, y: gora, rozmiar: 78, rozmiarNazwy: stopienNazwy, liniaBazowa: gora + 58, kolor: K.cream, max: dostepne });
  if (k.ujawnienie) {
    // Na jasnym fragmencie zdjęcia napis potrzebuje własnego tła.
    const prawo = pion ? 1325 : 1344;
    const szerokosc = p.szerokoscTekstu(k.ujawnienie, 26, { waga: 500 });
    ctx.fillStyle = 'rgba(8,22,18,.46)'; p.zaokraglij(prawo - szerokosc - 36, gora + 12, szerokosc + 36, 54, 27); ctx.fill();
    p.tekst(k.ujawnienie, prawo - 18, gora + 48, 26, { kolor: K.cream, wyrownanie: 'right', max: 420 });
  }
  const etykietaY = pion ? 580 : format === '4x5' ? 338 : 300;
  if (temat.etykieta) p.tekst(temat.etykieta.toLocaleUpperCase('pl-PL'), x, etykietaY, 34, { kolor: K.lime, waga: 700, max: 1240 });
  // `szerokoscNaglowka` zwęża nagłówek do lewej kolumny, gdy po prawej jest twarz bohatera zdjęcia.
  const szerokoscNaglowka = temat.szerokoscNaglowka ?? 1250;
  const rozmiar = rozmiarNaglowka(p, temat.naglowek, DRABINKA.zdjecie[format], szerokoscNaglowka, temat.rozmiarNaglowka);
  const interlinia = Math.round(rozmiar * 1.06);
  p.linie(temat.naglowek, x - 6, etykietaY + Math.round(rozmiar * 1.14), rozmiar, interlinia, { szeryf: true, kolor: K.cream, max: szerokoscNaglowka });

  // Dolny blok budujemy od dołu: adres, przycisk, cena, dopisek, treść.
  const granica = pion ? STREFA_PIONU.dol : wysokosc - 70;
  const przyciskY = granica - 12 - 151;
  let y = przyciskY - 58;
  const rozmiarCeny = format === '1x1' ? 118 : 138;
  const cenaY = y;
  if (temat.cena) y -= Math.round(rozmiarCeny * 0.78) + 46;
  const dopisekY = y;
  if (temat.dopisek) y -= 58;
  const trescY = y - (temat.tresc.length - 1) * 60;
  if (temat.tresc.length) p.linie(temat.tresc, x, trescY, 46, 60, { waga: 600, kolor: K.cream, max: 800 });
  if (temat.dopisek) p.tekst(temat.dopisek, x, dopisekY, 30, { kolor: K.mint, max: 800 });
  if (temat.cena) p.cena(temat.cena, { x, y: cenaY, rozmiar: rozmiarCeny, ciemne: true });
  cta(p, k, przyciskY, { x, kolorPodpisu: K.mint });
  if (temat.uklad === 'zdjecie+telefon') {
    const wysokoscTelefonu = pion ? 980 : format === '4x5' ? 850 : 650;
    const szerokoscTelefonu = wysokoscTelefonu * obrazy[temat.ekran].width / obrazy[temat.ekran].height;
    const telefon = p.telefon(obrazy[temat.ekran], { x: SZER - 84 - szerokoscTelefonu / 2, y: (pion ? wysokosc - 150 : wysokosc - 64) - wysokoscTelefonu / 2, wysokosc: wysokoscTelefonu, kat: 0.03 });
    p.sprawdzZasloniecie(obrysTelefonu(telefon), 'Telefon');
  }
}

const STREFA_PIONU = { lewo: 86, prawo: 1354, gora: 358, dol: 1664 }; // Meta: 14% góry, 35% dołu, 6% boków

/** Renderuje jedną grafikę tematu w podanym formacie. */
export async function renderujGrafike(k, temat, format) {
  const [, wysokosc] = FORMATY[format];
  const plik = `Grafika-${temat.id}-${format}.jpg`;
  const p = new Plotno(SZER, wysokosc, { kolory: k.motyw.kolory, nazwa: plik, ramka: format === '9x16' ? STREFA_PIONU : ramkaGrafiki(wysokosc) });
  const obrazy = await zasoby(k, kluczeZrodel(k, temat));
  if (temat.uklad === 'zdjecie' || temat.uklad === 'zdjecie+telefon') grafikaZdjeciowa(p, k, temat, obrazy, format);
  else if (format === '9x16') grafikaPionowa(p, k, temat, obrazy);
  else if (['panel', 'panel+telefon', 'trzy-telefony'].includes(temat.uklad)) grafikaPasowa(p, k, temat, obrazy, format);
  else grafikaDzielona(p, k, temat, obrazy, format);
  return { plotno: p, plik, rodzaj: 'grafika', temat: temat.id, format };
}

/** Renderuje kartę karuzeli o podanym numerze (od zera). */
export async function renderujKarte(k, numer) {
  const { format, karty } = k.karuzela;
  const karta = karty[numer];
  const [, wysokosc] = FORMATY[format];
  const plik = `Karuzela-${karta.id}-${format}.jpg`;
  const p = new Plotno(SZER, wysokosc, { kolory: k.motyw.kolory, nazwa: plik, ramka: ramkaGrafiki(wysokosc) });
  const obrazy = await zasoby(k, kluczeZrodel(k, karta));
  kartaDzielona(p, k, karta, obrazy, format, numer, karty.length);
  return { plotno: p, plik, rodzaj: 'karuzela', temat: karta.id, format };
}

/** Wszystkie grafiki kampanii w kolejności plików; `tylkoPierwszyFormat` służy szkicowi. */
export async function renderujWszystkie(k, { tylkoPierwszyFormat = false } = {}) {
  const wyniki = [];
  for (const temat of k.tematy) for (const format of tylkoPierwszyFormat ? temat.formaty.slice(0, 1) : temat.formaty) wyniki.push(await renderujGrafike(k, temat, format));
  if (k.karuzela) for (let numer = 0; numer < k.karuzela.karty.length; numer += 1) wyniki.push(await renderujKarte(k, numer));
  return wyniki;
}

/** Zapis JPEG 95 + miniatura 360 px do oceny w rozmiarze telefonu. */
export async function zapiszGrafike(wynik, katalogWyjscia, katalogQa) {
  const { canvas } = wynik.plotno;
  await fsp.mkdir(katalogWyjscia, { recursive: true });
  await fsp.mkdir(katalogQa, { recursive: true });
  const bufor = await canvas.encode('jpeg', 95);
  const plik = path.join(katalogWyjscia, wynik.plik);
  await fsp.writeFile(plik, bufor);
  const miniatura = createCanvas(360, Math.round(canvas.height / 4));
  miniatura.getContext('2d').drawImage(canvas, 0, 0, miniatura.width, miniatura.height);
  await fsp.writeFile(path.join(katalogQa, wynik.plik.replace('.jpg', '-360.jpg')), await miniatura.encode('jpeg', 94));
  return { plik, nazwa: wynik.plik, rodzaj: wynik.rodzaj, temat: wynik.temat, format: wynik.format, szerokosc: canvas.width, wysokosc: canvas.height, bajty: bufor.length, sha256: sha256(bufor), miniatura };
}

/** Plansza kontaktowa z miniatur 360 px: wiersz na format, do szybkiej oceny całości. */
export async function planszaKontaktowa(zapisane, plik) {
  if (!zapisane.length) return null;
  const wiersze = new Map();
  for (const wpis of zapisane) { const klucz = `${wpis.rodzaj}-${wpis.format}`; if (!wiersze.has(klucz)) wiersze.set(klucz, []); wiersze.get(klucz).push(wpis); }
  const odstep = 16;
  const szerokosc = Math.max(...[...wiersze.values()].map((w) => w.length)) * (360 + odstep) + odstep;
  const wysokosc = [...wiersze.values()].reduce((suma, w) => suma + w[0].miniatura.height + odstep, odstep);
  const plansza = createCanvas(szerokosc, wysokosc);
  const ctx = plansza.getContext('2d');
  ctx.fillStyle = '#E8E7DF'; ctx.fillRect(0, 0, szerokosc, wysokosc);
  let y = odstep;
  for (const wiersz of wiersze.values()) {
    wiersz.forEach((wpis, numer) => ctx.drawImage(wpis.miniatura, odstep + numer * (360 + odstep), y));
    y += wiersz[0].miniatura.height + odstep;
  }
  await fsp.mkdir(path.dirname(plik), { recursive: true });
  await fsp.writeFile(plik, await plansza.encode('jpeg', 92));
  return plik;
}
