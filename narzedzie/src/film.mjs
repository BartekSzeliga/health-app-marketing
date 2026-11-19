import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Plotno, createCanvas, loadImage, wczytajObraz } from './plotno.mjs';
import { Blad, ffmpeg, ffprobe, sha256, uruchom, wzgledna, zapiszJson } from './wspolne.mjs';

// Film projektujemy w przestrzeni 1080×1920 i skalujemy do 1440×2560.
// Sceny, czasy wejść i położenia są przeniesione z render-videos.mjs (21.10).
export const FILM = { szerokosc: 1440, wysokosc: 2560, fps: 30 };
const SKALA = FILM.szerokosc / 1080;
// Strefa bezpieczna napisów w jednostkach projektu: 6–94% szerokości, 14–65% wysokości.
const STREFA = { lewo: 64.8, prawo: 1015.2, gora: 268.8, dol: 1248 };
// Film z dodatkowym kadrem 4:5 do Feedu: z pionu zostaje środkowe 1350 z 1920 jednostek (y 285–1635),
// więc napisy zaczynają się niżej, a telefon jest mniejszy, żeby zmieścił się w obu kadrach.
const STREFA_45 = { ...STREFA, gora: 292 };
// Kadr 4:5 to okno 1080×1350 na ten sam projekt (y 285–1635), renderowane osobno: napisy i telefon
// stoją tam, gdzie w pionie, a nagranie jest domyślnie wyrównane do góry, żeby nie ucinać twarzy.
const KADR_45 = { szerokosc: 1440, wysokosc: 1800, odGory: 285, srodekNagrania: 0.3516 };
// Delikatna, ciepła korekcja nagrań stockowych, wspólna dla wszystkich ujęć filmu.
const KOREKCJA = 'eq=saturation=0.96:contrast=1.025:brightness=0.005,colorbalance=rs=0.016:gs=0.003:bs=-0.008';

const ogranicz = (n) => Math.min(1, Math.max(0, n));
const postep = (t, a, b) => ogranicz((t - a) / (b - a));
const wygas = (n) => 1 - (1 - n) ** 3;
const miedzy = (a, b, x) => a + (b - a) * x;
const naSiatke = (sekundy) => Math.round(sekundy * FILM.fps) / FILM.fps;

/** Mapuje kadr zdefiniowany na zrzucie ekranu na klatkę nagrania o innej rozdzielczości. */
function kadrNaObraz(kadr, wzorzec, obraz) {
  return { x: kadr.x * obraz.width / wzorzec.width, y: kadr.y * obraz.height / wzorzec.height, szer: kadr.szer * obraz.width / wzorzec.width, wys: kadr.wys * obraz.height / wzorzec.height };
}

/**
 * Wycina ujęcie z nagrania w rzeczywistym tempie. Nagrania ekranu mają zmienną
 * liczbę klatek i potrafią zerować zegar w środku pliku, dlatego najpierw
 * rozwijamy całą oś czasu do stałych 30 kl./s, a dopiero potem przycinamy.
 */
async function przygotujKlip(k, klip, scena, katalogKlatek, zegary) {
  const zrodlo = k.zrodla[klip.zrodlo];
  const bajty = await fsp.readFile(zrodlo.plik);
  const skrot = sha256(bajty);
  const info = JSON.parse((await uruchom(ffprobe(), ['-v', 'error', '-show_entries', 'stream=width,height,duration:format=duration', '-select_streams', 'v:0', '-of', 'json', zrodlo.plik])).tekst);
  const dlugoscZrodla = Number(info.streams[0].duration ?? info.format.duration);
  const czas = klip.koniec - klip.start;
  if (klip.od + czas > dlugoscZrodla + 0.05) throw new Blad(`Ujęcie z „${klip.zrodlo}” (${klip.od}–${klip.od + czas} s) wychodzi poza nagranie o długości ${dlugoscZrodla.toFixed(2)} s.`);
  if (!zegary.has(zrodlo.plik)) {
    const stemple = JSON.parse((await uruchom(ffprobe(), ['-v', 'error', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-select_streams', 'v:0', '-of', 'json', zrodlo.plik])).tekst).frames.map((klatka) => Number(klatka.best_effort_timestamp_time));
    const epoki = [];
    let pierwsza = 0;
    for (let i = 1; i <= stemple.length; i += 1) {
      if (i === stemple.length || stemple[i] < stemple[i - 1]) { epoki.push({ pierwszaKlatka: pierwsza, ostatniaKlatka: i - 1, od: stemple[pierwsza], do: stemple[i - 1] }); pierwsza = i; }
    }
    zegary.set(zrodlo.plik, epoki);
  }
  const epoki = zegary.get(zrodlo.plik);
  if (epoki.length > 1 && klip.epoka === undefined) throw new Blad(`Nagranie „${klip.zrodlo}” zeruje zegar (${epoki.length} odcinki: ${epoki.map((e, i) => `${i}: ${e.od.toFixed(1)}–${e.do.toFixed(1)} s`).join(', ')}). Dopisz w ujęciu "epoka".`);
  const epoka = epoki[klip.epoka ?? 0];
  if (!epoka || klip.od < epoka.od || klip.od > epoka.do) throw new Blad(`Ujęcie z „${klip.zrodlo}” zaczyna się w ${klip.od} s, poza odcinkiem ${klip.epoka ?? 0} nagrania.`);
  const liczba = Math.round(czas * FILM.fps);
  const katalog = path.join(katalogKlatek, `${klip.zrodlo}-${skrot.slice(0, 10)}-e${klip.epoka ?? 0}-${klip.od}-${czas}`);
  await fsp.mkdir(katalog, { recursive: true });
  try {
    await fsp.access(path.join(katalog, `klatka-${String(liczba).padStart(4, '0')}.png`));
  } catch {
    const os = `select='between(n,${epoka.pierwszaKlatka},${epoka.ostatniaKlatka})',fps=${FILM.fps}:round=near,trim=start=${klip.od}:end=${klip.od + czas},setpts=PTS-STARTPTS,scale=1000:-2`;
    await uruchom(ffmpeg(), ['-v', 'error', '-y', '-i', zrodlo.plik, '-vf', os, '-frames:v', String(liczba), path.join(katalog, 'klatka-%04d.png')]);
  }
  return {
    ...klip, katalog, liczba, sha256: skrot,
    odFilmu: naSiatke(scena.poczatek + klip.start), doFilmu: naSiatke(scena.poczatek + klip.koniec),
    trzymajDo: klip.zatrzymajDo !== undefined ? naSiatke(scena.poczatek + klip.zatrzymajDo) : null,
    obraz: null, numer: null,
  };
}

/**
 * Klatki nagrania na całe tło sceny: kadr do pionu, tempo naturalne, wspólna
 * korekcja barw. Pod telefonem (sceny ekran i detal) nagranie jest rozmyte.
 */
async function przygotujMaterial(k, scena, katalogKlatek, skroty) {
  const zrodlo = k.zrodla[scena.material];
  const od = scena.od ?? 0;
  const rozmyte = scena.typ !== 'material';
  if (!skroty.has(zrodlo.plik)) skroty.set(zrodlo.plik, sha256(await fsp.readFile(zrodlo.plik)));
  const info = JSON.parse((await uruchom(ffprobe(), ['-v', 'error', '-show_entries', 'stream=duration:format=duration', '-select_streams', 'v:0', '-of', 'json', zrodlo.plik])).tekst);
  const dlugosc = Number(info.streams[0].duration ?? info.format.duration);
  if (od + scena.czas > dlugosc + 0.05) throw new Blad(`Scena z nagraniem „${scena.material}” potrzebuje ${od}–${od + scena.czas} s, a nagranie trwa ${dlugosc.toFixed(2)} s.`);
  const liczba = Math.round(scena.czas * FILM.fps);
  // `kadrMaterialu` wycina fragment nagrania (w pikselach źródła), np. żeby pominąć niechciany element tła.
  const kadr = scena.kadrMaterialu;
  const katalog = path.join(katalogKlatek, `material-${scena.material}-${skroty.get(zrodlo.plik).slice(0, 10)}-${od}-${scena.czas}${rozmyte ? '-rozmyte' : ''}${kadr ? `-k${kadr.x}-${kadr.y}-${kadr.szer}-${kadr.wys}` : ''}`);
  await fsp.mkdir(katalog, { recursive: true });
  try {
    await fsp.access(path.join(katalog, `klatka-${String(liczba).padStart(4, '0')}.jpg`));
  } catch {
    const filtr = `${kadr ? `crop=${kadr.szer}:${kadr.wys}:${kadr.x}:${kadr.y},` : ''}scale=${FILM.szerokosc}:${FILM.wysokosc}:force_original_aspect_ratio=increase,crop=${FILM.szerokosc}:${FILM.wysokosc},setsar=1,fps=${FILM.fps},${KOREKCJA}${rozmyte ? ',gblur=sigma=24' : ''}`;
    await uruchom(ffmpeg(), ['-v', 'error', '-y', '-ss', String(od), '-i', zrodlo.plik, '-an', '-vf', filtr, '-frames:v', String(liczba), '-q:v', '2', path.join(katalog, 'klatka-%04d.jpg')]);
  }
  return { katalog, liczba, zrodlo: scena.material, od, sha256: skroty.get(zrodlo.plik), rozmyte, obraz: null, numer: null };
}

/** Wczytuje źródła filmu, przygotowuje ujęcia i zwraca funkcję rysującą klatkę dla czasu t. */
export async function przygotujFilm(k, film, katalogQa, { kadr45 = false } = {}) {
  const K = k.motyw.kolory;
  const p = new Plotno(FILM.szerokosc, kadr45 ? KADR_45.wysokosc : FILM.wysokosc, {
    skala: SKALA, ramka: film.kadr45 ? STREFA_45 : STREFA, styl: 'film', kolory: K,
    nazwa: `${film.plik}${kadr45 ? '-4x5' : ''}.mp4`, przesuniecieY: kadr45 ? KADR_45.odGory : 0,
  });
  const logo = (await wczytajObraz(k.motyw.logo)).obraz;
  const obrazy = {};
  const potrzebne = new Set();
  for (const scena of film.sceny) {
    if (scena.ekran) potrzebne.add(scena.ekran);
    if (scena.kadr) potrzebne.add(k.kadry[scena.kadr].zrodlo);
    for (const klip of scena.klipy) if (klip.kadr) potrzebne.add(k.kadry[klip.kadr].zrodlo);
  }
  for (const klucz of potrzebne) obrazy[klucz] = (await wczytajObraz(k.zrodla[klucz].plik)).obraz;

  const zegary = new Map();
  const klipy = [];
  for (const scena of film.sceny) for (const klip of scena.klipy) klipy.push(await przygotujKlip(k, klip, scena, path.join(katalogQa, 'klatki'), zegary));
  for (const [i, a] of klipy.entries()) for (const b of klipy.slice(i + 1)) {
    if (a.odFilmu < (b.trzymajDo ?? b.doFilmu) && (a.trzymajDo ?? a.doFilmu) > b.odFilmu) throw new Blad(`Ujęcia w filmie „${film.plik}” nachodzą na siebie (${a.odFilmu}–${a.doFilmu} s i ${b.odFilmu}–${b.doFilmu} s).`);
  }

  const materialy = new Map();
  const skroty = new Map();
  for (const scena of film.sceny) if (scena.material) materialy.set(scena, await przygotujMaterial(k, scena, path.join(katalogQa, 'klatki'), skroty));

  /** Rysuje klatkę nagrania jako tło sceny. */
  async function tloMaterialu(scena, t) {
    const m = materialy.get(scena);
    const numer = Math.min(m.liczba, Math.max(1, Math.floor((t - scena.poczatek) * FILM.fps + 0.0001) + 1));
    if (m.numer !== numer) { m.obraz = await loadImage(path.join(m.katalog, `klatka-${String(numer).padStart(4, '0')}.jpg`)); m.numer = numer; }
    // W kadrze 4:5 widać 1350 z 1920 jednostek nagrania; `srodek45` wskazuje, która część ma trafić na środek okna.
    const srodek = Math.min(0.6484, Math.max(0.3516, scena.srodek45 ?? KADR_45.srodekNagrania));
    p.ctx.drawImage(m.obraz, 0, kadr45 ? 960 - srodek * 1920 : 0, 1080, 1920);
  }

  async function klatkaNagrania(t) {
    const klip = klipy.find((c) => t >= c.odFilmu && t < (c.trzymajDo ?? c.doFilmu));
    if (!klip) return null;
    const numer = Math.min(klip.liczba, Math.max(1, Math.floor((t - klip.odFilmu) * FILM.fps + 0.0001) + 1));
    if (klip.numer !== numer) { klip.obraz = await loadImage(path.join(klip.katalog, `klatka-${String(numer).padStart(4, '0')}.png`)); klip.numer = numer; }
    return klip;
  }

  const { ctx } = p;
  function tlo(t, ciemne) {
    ctx.fillStyle = ciemne ? K.pine : K.cream; ctx.fillRect(0, 0, 1080, 1920);
    const gradient = ctx.createRadialGradient(850 + Math.sin(t * 0.17) * 40, 1320, 40, 780, 1320, 1020);
    const barwy = ciemne ? K.filmCiemne : K.filmJasne;
    gradient.addColorStop(0, barwy[0]); gradient.addColorStop(ciemne ? 0.62 : 0.56, barwy[1]); gradient.addColorStop(1, barwy[2]);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
    ctx.save(); ctx.strokeStyle = ciemne ? K.filmOkregiCiemne : K.filmOkregiJasne; ctx.lineWidth = 1.4; ctx.translate(800, 1430); ctx.rotate(-0.35 + t * 0.009);
    for (const rozmiar of [0, 44, 88]) { ctx.beginPath(); ctx.ellipse(0, 0, 470 + rozmiar, 760 + rozmiar, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  function marka(x, y, { rozmiar = 47, alfa = 1, kolor = K.pine, srodek = false } = {}) {
    const wysokoscLogo = rozmiar * 1.08;
    p.marka(k.motyw, logo, { x, y: y - wysokoscLogo * 0.8, rozmiar: wysokoscLogo, rozmiarNazwy: rozmiar, liniaBazowa: y, odstep: rozmiar * 0.25, kolor, alfa, srodek });
  }
  function naglowekSceny(scena, alfa, ciemne) {
    p.tekst(scena.tytul, 540, 351, scena.tytul.length > 25 ? 60 : 68, { wyrownanie: 'center', kolor: ciemne ? K.cream : K.pine, alfa, waga: 700 });
    if (scena.opis) p.tekst(scena.opis, 540, 421, 37, { wyrownanie: 'center', kolor: ciemne ? K.mint : K.muted, alfa, waga: 500 });
    if (k.ujawnienie) p.tekst(k.ujawnienie, 540, 480, 27, { wyrownanie: 'center', kolor: ciemne ? K.mint : K.muted, alfa: alfa * 0.85, waga: 500 });
  }
  const telefon = (obraz, { x = 540, y = 1160, wysokosc = 1220, kat = 0, alfa = 1 } = {}) => { if (alfa > 0) p.telefon(obraz, { x, y, wysokosc, kat, alfa }); };
  // Przyciemnienia pod napisy na nagraniu: góra kadru, dół kadru albo cały kadr pod telefonem.
  const CIEN = '10,25,21';
  function cien(odY, doY, przystanki) {
    // Gradient między odY a doY; poza tym zakresem trzyma skrajną wartość, więc nie zostawia ostrej krawędzi.
    const gradient = ctx.createLinearGradient(0, odY, 0, doY);
    for (const [miejsce, alfa] of przystanki) gradient.addColorStop(miejsce, `rgba(${CIEN},${alfa})`);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
  }
  /** Stopień pisma nagłówka na nagraniu: największy, przy którym każda linia mieści się w strefie. */
  const stopien = (linie, drabinka) => drabinka.find((rozmiar) => linie.every((linia) => p.szerokoscTekstu(linia, rozmiar, { szeryf: true }) <= 930)) ?? drabinka.at(-1);
  // Telefon w filmie z kadrem 4:5 jest niższy, żeby cały zmieścił się także w kadrze do Feedu.
  const TELEFON = film.kadr45 ? { y: 1085, wysokosc: 1080 } : { y: 1150, wysokosc: 1240 };
  function detal(obraz, kadr, { y, alfa }) {
    if (alfa <= 0) return;
    const szerokosc = 940;
    const wysokosc = szerokosc * kadr.wys / kadr.szer;
    p.detal(obraz, kadr, { x: 540 - szerokosc / 2, y: y - wysokosc / 2, szerokosc, alfa });
  }
  const kadrKlipu = (klip) => kadrNaObraz(k.kadry[klip.kadr], obrazy[k.kadry[klip.kadr].zrodlo], klip.obraz);

  async function rysuj(t) {
    p.wyczysc();
    p.napisy.length = 0;
    const znaleziona = film.sceny.findIndex((kandydat) => t < kandydat.koniec);
    const numer = znaleziona === -1 ? film.sceny.length - 1 : znaleziona;
    const scena = film.sceny[numer];
    const poprzednia = film.sceny[numer - 1];
    const s = scena.poczatek;
    const klip = await klatkaNagrania(t);
    const naNagraniu = Boolean(scena.material);
    const ciemne = naNagraniu || (scena.tlo ?? (scena.typ === 'detal' || scena.typ === 'cta' ? 'ciemne' : 'jasne')) === 'ciemne';
    if (naNagraniu) {
      await tloMaterialu(scena, t);
      if (scena.typ !== 'material') { ctx.fillStyle = `rgba(${CIEN},.58)`; ctx.fillRect(0, 0, 1080, 1920); }
    } else tlo(t, ciemne);

    if (scena.typ === 'hook') {
      const wejscie = wygas(postep(t, s + 0.03, s + 0.6));
      const wejscieTelefonu = wygas(postep(t, s + 0.25, s + 1.1));
      marka(86, 337, { alfa: wejscie });
      scena.naglowek.forEach((linia, i) => p.tekst(linia, 82, 484 + i * 118 + (1 - wejscie) * 18, scena.rozmiar ?? 110, { szeryf: true, kolor: K.pine, alfa: wejscie }));
      const pod = 484 + (scena.naglowek.length - 1) * 118;
      if (scena.wstep) p.tekst(scena.wstep, 87, pod + 95, 37, { waga: 600, kolor: K.pine, alfa: wejscie });
      if (k.ujawnienie) p.tekst(k.ujawnienie, 87, pod + 155, 27, { waga: 500, kolor: K.muted, alfa: wejscie * 0.85 });
      telefon(klip?.obraz ?? obrazy[scena.ekran], { x: miedzy(1150, 710, wejscieTelefonu), y: miedzy(1430, 1310, wejscieTelefonu), wysokosc: 1060, kat: miedzy(0.10, -0.025, wejscieTelefonu), alfa: wejscieTelefonu });
    } else if (scena.typ === 'material') {
      // Człowiek i sytuacja na całym kadrze; napis u góry (otwarcie) albo u dołu (kolejne ujęcia).
      const wejscie = wygas(postep(t, s + 0.12, s + 0.5));
      const dy = (1 - wejscie) * 18;
      const linie = scena.naglowek ?? [];
      const naDole = (scena.pozycja ?? 'gora') === 'dol';
      const rozmiar = scena.rozmiar ?? stopien(linie, [104, 96, 88, 80]);
      const interlinia = Math.round(rozmiar * 1.08);
      // Dolny napis kończy się z zapasem na wydłużenia liter i 18 px ruchu wejścia, żeby cały czas mieścił się w strefie.
      const pierwsza = naDole ? 1188 - (linie.length - 1) * interlinia : (scena.etykieta ? 590 : 510);
      cien(0, 560, [[0, 0.5], [1, 0]]);
      if (naDole) cien(620, 1760, [[0, 0], [0.53, 0.56], [1, 0.8]]);
      // Górne przyciemnienie sięga pod ostatnią linię napisu, także gdy hasło stoi w czterech krótkich liniach.
      else cien(180, Math.max(1100, pierwsza + (linie.length - 1) * interlinia + 280), [[0, 0.62], [0.6, 0.4], [1, 0]]);
      marka(86, 338, { kolor: K.cream });
      if (linie.length) {
        if (scena.etykieta) p.tekst(scena.etykieta, 88, pierwsza - Math.round(rozmiar * 1.18) + dy, 42, { waga: 600, kolor: K.lime, alfa: wejscie });
        linie.forEach((linia, i) => p.tekst(linia, 86, pierwsza + i * interlinia + dy, rozmiar, { szeryf: true, kolor: K.cream, alfa: wejscie }));
      }
    } else if (scena.typ === 'ekran') {
      // Po otwarciu telefon dojeżdża z boku (ciągłość z hookiem), w kolejnych scenach z dołu.
      const zBoku = (scena.wejscie ?? (poprzednia?.typ === 'hook' ? 'z-boku' : 'z-dolu')) === 'z-boku';
      const wejscie = wygas(postep(t, s, s + (zBoku ? 0.45 : 0.4)));
      naglowekSceny(scena, wejscie, ciemne);
      if (klip?.ujecie === 'detal') detal(klip.obraz, kadrKlipu(klip), { y: 1160, alfa: wejscie });
      else telefon(klip?.obraz ?? obrazy[scena.ekran], zBoku
        ? { x: miedzy(650, 540, wejscie), y: miedzy(TELEFON.y + 70, TELEFON.y, wejscie), wysokosc: TELEFON.wysokosc, alfa: wejscie }
        : { y: miedzy(TELEFON.y + 60, TELEFON.y, wejscie), wysokosc: TELEFON.wysokosc, alfa: wejscie });
    } else if (scena.typ === 'detal') {
      const wejscie = wygas(postep(t, s, s + 0.4));
      naglowekSceny(scena, wejscie, ciemne);
      const kadr = k.kadry[scena.kadr];
      const wjazd = (scena.wejscie ?? (poprzednia?.typ === 'detal' ? 'bez' : 'z-dolu')) === 'z-dolu';
      const y = wjazd ? miedzy(1194, 1160, wejscie) : 1160;
      if (klip?.ujecie === 'pelny') telefon(klip.obraz, { y: TELEFON.y, wysokosc: TELEFON.wysokosc, alfa: wejscie });
      else if (klip) detal(klip.obraz, klip.kadr ? kadrKlipu(klip) : kadrNaObraz(kadr, obrazy[kadr.zrodlo], klip.obraz), { y, alfa: wejscie });
      else detal(obrazy[kadr.zrodlo], kadr, { y, alfa: wejscie });
    } else {
      const wejscie = wygas(postep(t, s, s + 0.4));
      const glowny = ciemne ? K.cream : K.pine;
      if (scena.cena) {
        // Plansza z ofertą: marka, hasło, cena jako największy element, przycisk i adres — wszystko w kadrze 4:5.
        const dy = (1 - wejscie) * 14;
        const rozmiar = scena.rozmiar ?? stopien(scena.haslo, [78, 72, 66, 60]);
        const interlinia = Math.round(rozmiar * 1.16);
        const ostatnia = 590 + (scena.haslo.length - 1) * interlinia;
        marka(540, 430 + dy, { rozmiar: 70, alfa: wejscie, kolor: glowny, srodek: true });
        scena.haslo.forEach((linia, i) => p.tekst(linia, 540, 590 + i * interlinia + dy, rozmiar, { szeryf: true, kolor: glowny, wyrownanie: 'center', alfa: wejscie }));
        p.cena(scena.cena, { x: 540, y: ostatnia + 196 + dy, rozmiar: 156, srodek: true, ciemne, alfa: wejscie });
        const przycisk = ostatnia + 268 + dy;
        ctx.save(); ctx.globalAlpha = wejscie; ctx.fillStyle = ciemne ? K.lime : K.pine; p.zaokraglij(118, przycisk, 844, 132, 28); ctx.fill(); ctx.restore();
        p.tekst(k.cta.plansza, 540, przycisk + 88, 62, { wyrownanie: 'center', kolor: ciemne ? K.pine : K.cream, alfa: wejscie, waga: 700, max: 800 });
        if (k.cta.podpis) p.tekst(k.cta.podpis, 540, przycisk + 212, 40, { wyrownanie: 'center', kolor: ciemne ? K.mint : K.muted, alfa: wejscie, waga: 600 });
      } else {
        marka(540, 456, { rozmiar: 84, alfa: wejscie, kolor: glowny, srodek: true });
        scena.haslo.forEach((linia, i) => p.tekst(linia, 540, 654 + i * 100 + (1 - wejscie) * 12, scena.rozmiar ?? 84, { szeryf: true, kolor: glowny, wyrownanie: 'center', alfa: wejscie }));
        const przesuniecie = (scena.haslo.length - 2) * 100;
        ctx.save(); ctx.globalAlpha = wejscie; ctx.fillStyle = K.lime; p.zaokraglij(118, 920 + przesuniecie, 844, 132, 28); ctx.fill(); ctx.restore();
        p.tekst(k.cta.plansza, 540, 1008 + przesuniecie, 65, { wyrownanie: 'center', kolor: K.pine, alfa: wejscie, waga: 700, max: 800 });
        if (k.cta.podpis) p.tekst(k.cta.podpis, 540, 1154 + przesuniecie, 41, { wyrownanie: 'center', kolor: ciemne ? K.mint : K.muted, alfa: wejscie, waga: 500 });
      }
      if (scena.ekran) telefon(obrazy[scena.ekran], { x: 540, y: 1765 + (1 - wejscie) * 80, wysokosc: 940, kat: 0.025, alfa: wejscie });
    }
  }

  return { p, rysuj, klipy, film, materialy: [...materialy.values()] };
}

/** Środek każdej sceny (hook po rozbiegu) — domyślne punkty storyboardu. */
export function stempleScen(film) {
  return film.sceny.map((scena) => Math.round((scena.poczatek + Math.min(scena.czas * 0.5, scena.typ === 'hook' ? 1.6 : scena.czas * 0.5)) * 10) / 10);
}

/** Klatki kontrolne w pełnej rozdzielczości + plansza 360 px do oceny kierunku przed pełnym renderem. */
export async function storyboard(k, film, katalogQa, stemple = stempleScen(film)) {
  const przygotowany = await przygotujFilm(k, film, katalogQa);
  const katalog = path.join(katalogQa, 'film');
  await fsp.mkdir(katalog, { recursive: true });
  const plansza = createCanvas(stemple.length * 360, 690);
  const g = plansza.getContext('2d');
  g.fillStyle = k.motyw.kolory.cream; g.fillRect(0, 0, plansza.width, plansza.height);
  const klatki = [];
  for (const [i, stempel] of stemple.entries()) {
    await przygotowany.rysuj(stempel);
    const bajty = await przygotowany.p.canvas.encode('png');
    const plik = path.join(katalog, `${film.plik}-${stempel.toFixed(1)}s.png`);
    await fsp.writeFile(plik, bajty);
    klatki.push(plik);
    // Zamrożenie klatki: Skia potrafi trzymać referencję do zmienianego płótna.
    g.drawImage(await loadImage(bajty), i * 360, 0, 360, 640);
    g.fillStyle = k.motyw.kolory.pine; g.font = '20px "Avenir Next"'; g.fillText(`${stempel.toFixed(1)} s`, i * 360 + 15, 674);
  }
  const plik = path.join(katalog, `${film.plik}-storyboard.jpg`);
  await fsp.writeFile(plik, await plansza.encode('jpeg', 94));
  return { plik, klatki, problemy: przygotowany.p.problemy };
}

/**
 * Plansza wyboru nagrania do jednej sceny: A to nagranie użyte w filmie, kolejne litery to `opcje` sceny.
 * Każdy wariant jest narysowany tak jak w filmie (kadr, korekcja barw, napis), w dwóch chwilach sceny.
 */
export async function planszaOpcji(k, film, numer, katalogQa) {
  const scena = film.sceny[numer];
  const warianty = [null, ...scena.opcje];
  const chwile = [0.3, 0.85].map((ulamek) => scena.poczatek + scena.czas * ulamek);
  const [w, h, odstep, naglowek] = [360, 640, 40, 92];
  const kolumna = chwile.length * w + odstep;
  const plansza = createCanvas(odstep + warianty.length * kolumna, naglowek + h + odstep);
  const g = plansza.getContext('2d');
  g.fillStyle = k.motyw.kolory.cream; g.fillRect(0, 0, plansza.width, plansza.height);
  for (const [i, wariant] of warianty.entries()) {
    // Opcja nie dziedziczy kadru ani początku po nagraniu z filmu: to inne nagranie.
    const odmiana = wariant ? { ...film, sceny: film.sceny.map((s, j) => (j === numer ? { ...s, od: undefined, kadrMaterialu: undefined, srodek45: undefined, ...wariant } : s)) } : film;
    const przygotowany = await przygotujFilm(k, odmiana, katalogQa);
    const x = odstep + i * kolumna;
    for (const [j, t] of chwile.entries()) {
      await przygotowany.rysuj(t);
      g.drawImage(await loadImage(await przygotowany.p.canvas.encode('png')), x + j * w, naglowek, w, h);
    }
    g.fillStyle = k.motyw.kolory.pine; g.font = '600 40px "Avenir Next"';
    g.fillText(`Opcja ${String.fromCharCode(65 + i)}${wariant ? '' : ' — jest w filmie'}`, x, 60);
  }
  const katalog = path.join(katalogQa, 'opcje');
  await fsp.mkdir(katalog, { recursive: true });
  const plik = path.join(katalog, `Opcje-${film.plik}-scena-${numer + 1}.jpg`);
  await fsp.writeFile(plik, await plansza.encode('jpeg', 93));
  return plik;
}

/**
 * Pełny render: klatki RGBA płyną do ffmpeg, który koduje H.264 z muzyką.
 * Kodujemy do pliku tymczasowego i podmieniamy po sukcesie, żeby odtwarzacz
 * podglądu nigdy nie trafił na niepełny plik.
 */
export async function renderujFilm(k, film, { katalogWyjscia, katalogQa, muzyka, postepy = () => {} }) {
  await fsp.mkdir(katalogWyjscia, { recursive: true });
  await fsp.mkdir(path.join(katalogQa, 'film'), { recursive: true });
  const { fps } = FILM;
  const klatek = Math.round(film.dlugosc * fps);
  const start = Date.now();

  /** Rysuje wszystkie klatki i koduje H.264 z muzyką; zwraca problemy z napisami albo ścieżkę pliku. */
  async function koduj(przygotowany, wyjscie) {
    const { p } = przygotowany;
    const [W, H] = [p.canvas.width, p.canvas.height];
    // Suchy przebieg napisów w punktach kontrolnych: błąd treści ma wyjść przed minutą kodowania.
    for (const stempel of stempleScen(film)) await przygotowany.rysuj(stempel);
    if (p.problemy.length) return p.problemy;
    const tymczasowy = path.join(katalogQa, 'film', `${path.basename(wyjscie, '.mp4')}.w-toku.mp4`);
    const argumenty = ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(fps), '-i', 'pipe:0', '-i', muzyka.plik,
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1', '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps), '-g', '30',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(film.dlugosc), '-movflags', '+faststart', tymczasowy];
    const koder = spawn(ffmpeg(), argumenty, { stdio: ['pipe', 'ignore', 'pipe'] });
    let bledy = '';
    koder.stderr.on('data', (dane) => { bledy += dane; });
    koder.stdin.on('error', () => {});
    const koniec = once(koder, 'close');
    for (let klatka = 0; klatka < klatek; klatka += 1) {
      await przygotowany.rysuj(klatka / fps);
      const piksele = p.ctx.getImageData(0, 0, W, H).data;
      if (!koder.stdin.write(Buffer.from(piksele.buffer, piksele.byteOffset, piksele.byteLength))) {
        await Promise.race([once(koder.stdin, 'drain'), koniec.then(([kod]) => { throw new Error(`Koder zatrzymał się z kodem ${kod}: ${bledy}`); })]);
      }
      if (klatka % 90 === 0) postepy(klatka, klatek);
    }
    koder.stdin.end();
    const [kod] = await koniec;
    if (kod) throw new Error(`Kodowanie filmu nie powiodło się: ${bledy.slice(-3000)}`);
    if (p.problemy.length) { await fsp.rm(tymczasowy, { force: true }); return p.problemy; }
    // Kodujemy do pliku tymczasowego i podmieniamy po sukcesie, żeby podgląd nie trafił na niepełny plik.
    await fsp.rename(tymczasowy, wyjscie);
    return [];
  }

  const przygotowany = await przygotujFilm(k, film, katalogQa);
  const wyjscie = path.join(katalogWyjscia, `${film.plik}.mp4`);
  let problemy = await koduj(przygotowany, wyjscie);
  if (problemy.length) return { problemy };
  // Kadr 4:5 do Feedu: osobny przebieg na tym samym projekcie, z nagraniem wyrównanym tak, by nie ucinać twarzy.
  let plik45 = null;
  if (film.kadr45) {
    plik45 = path.join(katalogWyjscia, `${film.plik}-4x5.mp4`);
    problemy = await koduj(await przygotujFilm(k, film, katalogQa, { kadr45: true }), plik45);
    if (problemy.length) return { problemy };
  }

  const raport = {
    plik: wzgledna(k.katalog, wyjscie), kadr45: plik45 ? wzgledna(k.katalog, plik45) : null, temat: film.temat, dlugosc: film.dlugosc, klatek, sekundRenderu: (Date.now() - start) / 1000,
    muzyka: { plik: wzgledna(k.katalog, muzyka.plik), opis: muzyka.opis },
    sceny: film.sceny.map((scena) => ({ typ: scena.typ, od: scena.poczatek, do: scena.koniec })),
    ujecia: przygotowany.klipy.map((klip) => ({ zrodlo: klip.zrodlo, sha256: klip.sha256, odNagrania: klip.od, epoka: klip.epoka ?? 0, odFilmu: klip.odFilmu, doFilmu: klip.doFilmu, tempo: 1, ujecie: klip.ujecie, kadr: klip.kadr ?? null, zatrzymanaOstatniaKlatkaDo: klip.trzymajDo })),
    material: przygotowany.materialy.map((m) => ({ zrodlo: m.zrodlo, sha256: m.sha256, odNagrania: m.od, tempo: 1, rozmyte: m.rozmyte })),
    strefaBezpieczna: { x: '6–94%', y: film.kadr45 ? '15–65% (wspólna dla 9:16 i kadru 4:5)' : '14–65%' },
    interfejsRetuszowany: false, klikniecieSymulowane: false,
  };
  await zapiszJson(path.join(katalogQa, 'film', `${film.plik}-render.json`), raport);
  return { plik: wyjscie, plik45, raport, problemy: [] };
}
