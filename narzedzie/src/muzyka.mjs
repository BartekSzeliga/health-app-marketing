import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Blad, REPO, ffmpeg, ffprobe, sha256, uruchom, wzgledna, zapiszJson } from './wspolne.mjs';

// Synteza podkładu w Node — przeniesienie production/build-rhythmic-audio.py
// z paczki 21.10.2026. Wszystkie instrumenty to matematyka: bez sampli,
// nagrań, pętli z bibliotek i cudzych utworów. Aranżacje presetów są
// aranżacjami dwóch zaakceptowanych podkładów z tamtej paczki.
const SR = 48000;

export const PRESETY = {
  'cel-kalorii': {
    bpm: 124, opis: 'jasny piano-house, synkopowany groove (podkład „cel kalorii” z 21.10.2026)',
    akordy: [[55, 59, 62, 66, 69], [57, 60, 64, 67, 71], [52, 55, 59, 62, 66], [54, 57, 62, 66, 69]],
    basy: [31, 33, 40, 38], melodia: [79, 78, 74, 76, 83, 81, 78, 74],
    rytm: [0.75, 1.5, 2.5, 3.75], rytmMelodii: [0, 1.25, 2, 2.75],
  },
  generator: {
    bpm: 126, opis: 'jasny piano-house, synkopowany groove (podkład „generator” z 21.10.2026)',
    akordy: [[57, 61, 64, 68, 71], [54, 57, 61, 64, 68], [50, 54, 57, 61, 64], [52, 56, 59, 62, 66]],
    basy: [33, 30, 38, 40], melodia: [76, 80, 83, 81, 78, 76, 73, 71],
    rytm: [0.5, 1.5, 2.75, 3.5], rytmMelodii: [0.5, 1.25, 2.5, 3.25],
  },
};

/** Powtarzalny generator liczb o rozkładzie normalnym (mulberry32 + Box–Muller). */
function losowe(ziarno) {
  let stan = ziarno >>> 0;
  const jednostajna = () => {
    stan = (stan + 0x6D2B79F5) >>> 0;
    let t = stan;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - jednostajna())) * Math.cos(2 * Math.PI * jednostajna());
}

/** FFT radix-2 w miejscu; `odwrotna` daje transformatę odwrotną ze skalowaniem. */
function fft(re, im, odwrotna) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let dlugosc = 2; dlugosc <= n; dlugosc <<= 1) {
    const kat = (odwrotna ? 2 : -2) * Math.PI / dlugosc;
    const [wr, wi] = [Math.cos(kat), Math.sin(kat)];
    for (let i = 0; i < n; i += dlugosc) {
      let [ur, ui] = [1, 0];
      for (let j = 0; j < dlugosc / 2; j += 1) {
        const a = i + j;
        const b = a + dlugosc / 2;
        const [tr, ti] = [re[b] * ur - im[b] * ui, re[b] * ui + im[b] * ur];
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [ur, ui] = [ur * wr - ui * wi, ur * wi + ui * wr];
      }
    }
  }
  if (odwrotna) for (let i = 0; i < n; i += 1) { re[i] /= n; im[i] /= n; }
}

function syntezator(ziarno, sekundy) {
  const N = SR * sekundy;
  const normalna = losowe(ziarno);
  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
  const os = (czas) => { const n = Math.round(SR * czas); const t = new Float64Array(n); for (let i = 0; i < n; i += 1) t[i] = i / SR; return t; };

  function obwiednia(sygnal, atak = 0.003, wybrzmienie = 0.025) {
    const a = Math.min(sygnal.length, Math.round(SR * atak));
    const r = Math.min(sygnal.length, Math.round(SR * wybrzmienie));
    for (let i = 0; i < a; i += 1) sygnal[i] *= Math.sin((a === 1 ? 0 : i / (a - 1)) * Math.PI / 2) ** 2;
    for (let i = 0; i < r; i += 1) sygnal[sygnal.length - r + i] *= Math.cos((r === 1 ? 0 : i / (r - 1)) * Math.PI / 2) ** 2;
    return sygnal;
  }
  /** Szum pasmowy: biały szum kształtowany w dziedzinie częstotliwości, znormalizowany do odchylenia 1. */
  function szum(dlugosc, dol, gora) {
    let n = 1; while (n < dlugosc) n <<= 1;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i += 1) re[i] = normalna();
    fft(re, im, false);
    for (let i = 0; i < n; i += 1) {
      const f = Math.min(i, n - i) * SR / n;
      const ksztalt = (1 - Math.exp(-((f / dol) ** 4))) * Math.exp(-((f / gora) ** 8));
      re[i] *= ksztalt; im[i] *= ksztalt;
    }
    fft(re, im, true);
    const sygnal = re.subarray(0, dlugosc);
    let srednia = 0; for (const x of sygnal) srednia += x; srednia /= dlugosc;
    let wariancja = 0; for (const x of sygnal) wariancja += (x - srednia) ** 2;
    const odchylenie = Math.max(Math.sqrt(wariancja / dlugosc), 1e-9);
    return Float64Array.from(sygnal, (x) => x / odchylenie);
  }
  const szyna = () => [new Float64Array(N), new Float64Array(N)];
  /** Dodaje sygnał do szyny stereo z panoramą o stałej mocy. */
  function dodaj(cel, sygnal, start, glosnosc = 1, pan = 0) {
    let pozycja = Math.round(start * SR);
    let od = 0;
    if (pozycja < 0) { od = -pozycja; pozycja = 0; }
    const liczba = Math.min(sygnal.length - od, N - pozycja);
    if (liczba <= 0) return;
    const kat = (pan + 1) * Math.PI / 4;
    const [lewy, prawy] = [glosnosc * Math.cos(kat), glosnosc * Math.sin(kat)];
    for (let i = 0; i < liczba; i += 1) { cel[0][pozycja + i] += sygnal[od + i] * lewy; cel[1][pozycja + i] += sygnal[od + i] * prawy; }
  }

  const stopa = () => {
    const t = os(0.36);
    const klik = szum(t.length, 1800, 7600);
    const wynik = new Float64Array(t.length);
    let faza = 0;
    for (let i = 0; i < t.length; i += 1) {
      faza += 49 + 112 * Math.exp(-t[i] * 46);
      const korpus = Math.sin(2 * Math.PI * faza / SR) * Math.exp(-t[i] * 13) * (1 - Math.exp(-t[i] * 1800));
      wynik[i] = Math.tanh(korpus * 1.15) / 1.15 + klik[i] * Math.exp(-t[i] * 210) * 0.047;
    }
    return obwiednia(wynik, 0.0004, 0.03);
  };
  const klask = () => {
    const t = os(0.22);
    const szumy = szum(t.length, 1300, 8100);
    return obwiednia(Float64Array.from(t, (czas, i) => {
      let env = 0;
      for (const [opoznienie, sila] of [[0, 0.48], [0.011, 0.75], [0.025, 1], [0.039, 0.62]]) if (czas >= opoznienie) env += sila * Math.exp(-(czas - opoznienie) * 57);
      return szumy[i] * env * 0.28 + Math.sin(2 * Math.PI * 186 * czas) * Math.exp(-czas * 32) * 0.075;
    }), 0.0005, 0.025);
  };
  const hihat = (otwarty) => {
    const t = os(otwarty ? 0.23 : 0.075);
    const szumy = szum(t.length, 6200, 14900);
    return obwiednia(Float64Array.from(t, (czas, i) => {
      let metal = 0; for (const f of [6281, 7597, 9137, 11009]) metal += Math.sin(2 * Math.PI * f * czas);
      return (szumy[i] + metal * 0.06) * Math.exp(-czas * (otwarty ? 17 : 75));
    }), 0.0007, 0.018);
  };
  const shaker = () => {
    const t = os(0.085);
    const szumy = szum(t.length, 4200, 12800);
    return obwiednia(Float64Array.from(t, (czas, i) => szumy[i] * Math.exp(-czas * 54)), 0.004, 0.018);
  };
  const tom = (midi) => {
    const t = os(0.23);
    const szumy = szum(t.length, 450, 3600);
    let faza = 0;
    return obwiednia(Float64Array.from(t, (czas, i) => {
      faza += hz(midi) * (1 + 0.3 * Math.exp(-czas * 35));
      return Math.sin(2 * Math.PI * faza / SR) * Math.exp(-czas * 19) + szumy[i] * Math.exp(-czas * 80) * 0.035;
    }), 0.0008, 0.04);
  };
  const bas = (midi, czasTrwania) => {
    const f = hz(midi);
    return obwiednia(Float64Array.from(os(czasTrwania), (czas) => {
      let korpus = 0;
      for (const [k, amplituda] of [[1, 1], [2, 0.3], [3, 0.17], [4, 0.08], [5, 0.035], [7, 0.013]]) korpus += amplituda * Math.sin(2 * Math.PI * f * k * czas + (k === 1 ? 0 : 0.06));
      return Math.tanh(korpus * 1.22) / 1.22 * Math.exp(-czas * 3.3);
    }), 0.004, 0.035);
  };
  const klawisze = (midi, czasTrwania = 0.72, jasnosc = 1) => {
    const f = hz(midi);
    return obwiednia(Float64Array.from(os(czasTrwania), (czas) => {
      const faza = 2 * Math.PI * f * czas;
      let korpus = Math.sin(faza + (1.25 * Math.exp(-czas * 9) + 0.15) * Math.sin(2 * faza));
      korpus += 0.16 * jasnosc * Math.sin(2.001 * faza) * Math.exp(-czas * 8);
      korpus += 0.035 * jasnosc * Math.sin(4.003 * faza) * Math.exp(-czas * 15);
      return korpus * Math.exp(-czas * 3.6);
    }), 0.006, 0.065);
  };
  const tloAkordu = (midi, czasTrwania) => {
    const f = hz(midi);
    return obwiednia(Float64Array.from(os(czasTrwania), (czas) => 0.66 * Math.sin(2 * Math.PI * f * czas) + 0.32 * Math.sin(2 * Math.PI * f * 1.0016 * czas)
      + 0.08 * Math.sin(4 * Math.PI * f * czas) + 0.026 * Math.sin(6 * Math.PI * f * czas)), 0.09, 0.3);
  };
  const podmuch = (czasTrwania) => {
    const t = os(czasTrwania);
    const szumy = szum(t.length, 2300, 11500);
    return obwiednia(Float64Array.from(t, (czas, i) => szumy[i] * (czas / czasTrwania) ** 2), 0.015, 0.004);
  };
  /** Echo z zamianą kanałów, dodawane do tej samej szyny. */
  function echo(cel, sekundyOpoznienia, glosnosc) {
    const przesuniecie = Math.round(sekundyOpoznienia * SR);
    const [lewy, prawy] = [Float64Array.from(cel[0]), Float64Array.from(cel[1])];
    for (let i = przesuniecie; i < N; i += 1) { cel[0][i] += prawy[i - przesuniecie] * glosnosc; cel[1][i] += lewy[i - przesuniecie] * glosnosc; }
  }
  return { N, szyna, dodaj, stopa, klask, hihat, shaker, tom, bas, klawisze, tloAkordu, podmuch, echo };
}

/** Składa utwór presetu i zwraca próbki stereo jako float32 z przeplotem. */
export function zloz(preset, { bpm = preset.bpm, sekundy = 20, ziarno = 20261021 + bpm } = {}) {
  const s = syntezator(ziarno, sekundy);
  const { N } = s;
  const uderzenie = 60 / bpm;
  const takt = 240 / bpm;
  const [perkusja, dol, harmonia, prowadzacy, efekty] = [s.szyna(), s.szyna(), s.szyna(), s.szyna(), s.szyna()];
  const taktow = Math.ceil(sekundy / takt);
  const siatka = [];
  for (let numer = 0; numer < taktow; numer += 1) {
    const start = numer * takt;
    const indeks = Math.floor(numer / 2) % 4;
    const [akord, podstawa] = [preset.akordy[indeks], preset.basy[indeks]];
    for (let cwierc = 0; cwierc < 4; cwierc += 1) {
      s.dodaj(perkusja, s.stopa(), start + cwierc * uderzenie, 0.63 * (cwierc % 2 === 0 ? 1 : 0.93));
      if (cwierc === 1 || cwierc === 3) s.dodaj(perkusja, s.klask(), start + cwierc * uderzenie + 0.002, 0.32);
    }
    for (let osemka = 0; osemka < 8; osemka += 1) {
      const poza = osemka % 2 === 1;
      s.dodaj(perkusja, s.hihat(poza && numer > 0), start + osemka * uderzenie / 2 + (poza ? 0.006 : 0), 0.047 * (poza ? 1 : 0.7), poza ? -0.22 : 0.20);
    }
    for (let szesnastka = 0; szesnastka < 16; szesnastka += 1) {
      if ((szesnastka % 4 === 1 || szesnastka % 4 === 3) && numer % 4 !== 3) s.dodaj(perkusja, s.shaker(), start + szesnastka * uderzenie / 4 + (szesnastka % 2 ? 0.009 : 0), 0.032, szesnastka % 2 ? 0.34 : -0.34);
    }
    if (numer % 4 === 3) [57, 53, 50, 45].forEach((midi, i) => s.dodaj(perkusja, s.tom(midi), start + (3 + i / 4) * uderzenie, 0.08, -0.3 + i * 0.2));
    for (const [kiedy, interwal, dlugosc] of [[0, 0, 0.62], [0.75, 0, 0.34], [1.5, 12, 0.3], [2, 0, 0.58], [2.75, 7, 0.3], [3.5, 12, 0.32]]) {
      s.dodaj(dol, s.bas(podstawa + interwal, dlugosc * uderzenie), start + kiedy * uderzenie, 0.28);
    }
    for (const kiedy of preset.rytm) akord.forEach((midi, i) => s.dodaj(harmonia, s.klawisze(midi, 0.76, 0.85), start + kiedy * uderzenie + i * 0.0018, 0.074, [-0.36, 0.25, -0.16, 0.39, 0.04][i]));
    akord.forEach((midi, i) => s.dodaj(harmonia, s.tloAkordu(midi, takt + 0.1), start, 0.019, [-0.4, 0.4, -0.2, 0.2, 0][i]));
    // Dwutaktowe motywy; co drugi takt zostaje wolny dla obrazu.
    if (numer % 2 === 0) (numer % 4 === 0 ? preset.melodia.slice(0, 4) : preset.melodia.slice(4)).forEach((midi, i) => s.dodaj(prowadzacy, s.klawisze(midi, 0.80, 1), start + preset.rytmMelodii[i] * uderzenie, 0.062, i % 2 ? -0.14 : 0.14));
    if (numer >= 2 && numer % 2 === 0 && numer <= taktow - 3) s.dodaj(efekty, s.podmuch(0.21), start - 0.21, 0.018, -0.1);
    siatka.push({ takt: numer + 1, sekunda: Math.round(start * 1e6) / 1e6, klatka30fps: Math.round(start * 30) });
  }
  s.echo(prowadzacy, uderzenie * 0.75, 0.16);
  s.echo(harmonia, uderzenie * 0.5, 0.08);
  const muzyka = s.szyna();
  for (let i = 0; i < N; i += 1) {
    // Niskie szyny „oddychają” wokół stopy; perkusja zachowuje atak.
    const przyciszenie = 1 - 0.27 * Math.exp(-((i / SR) % uderzenie) * 24);
    for (const kanal of [0, 1]) muzyka[kanal][i] = perkusja[kanal][i] + (dol[kanal][i] + harmonia[kanal][i]) * przyciszenie + prowadzacy[kanal][i] + efekty[kanal][i];
  }
  // Krótki akord końcowy domyka fragment, perkusja gra dalej pod CTA.
  const domkniecie = Math.floor((sekundy - 2) / uderzenie) * uderzenie;
  preset.akordy[0].forEach((midi, i) => s.dodaj(muzyka, s.klawisze(midi, Math.min(2, sekundy - domkniecie), 0.6), domkniecie + i * 0.003, 0.045, [-0.3, 0.3, -0.15, 0.15, 0][i]));
  const wyciszenie = Math.round(SR * 0.62);
  const probki = new Float32Array(N * 2);
  for (let i = 0; i < N; i += 1) {
    let obwiednia = 1;
    if (i < 96) obwiednia = Math.sin((i / 95) * Math.PI / 2) ** 2;
    if (i >= N - wyciszenie) obwiednia = Math.cos(((i - (N - wyciszenie)) / (wyciszenie - 1)) * Math.PI / 2) ** 2;
    probki[2 * i] = muzyka[0][i] * obwiednia;
    probki[2 * i + 1] = muzyka[1][i] * obwiednia;
  }
  if (!probki.every(Number.isFinite)) throw new Error('Synteza dała nieskończone próbki.');
  return { probki, siatka };
}

async function zmierz(plik, cel) {
  const { bledy } = await uruchom(ffmpeg(), ['-hide_banner', '-i', plik, '-af', `loudnorm=I=${cel}:TP=-1.8:LRA=5:print_format=json`, '-f', 'null', '-']);
  return JSON.parse(bledy.slice(bledy.lastIndexOf('{'), bledy.lastIndexOf('}') + 1));
}

/** Mastering jak w oryginale: filtr pasma, liniowa normalizacja głośności, WAV 24 bit i kontrola po kodowaniu AAC. */
async function master(probki, plik, katalogRoboczy, sekundy, cel = -14) {
  await fsp.mkdir(katalogRoboczy, { recursive: true });
  await fsp.mkdir(path.dirname(plik), { recursive: true });
  const surowy = path.join(katalogRoboczy, `${path.basename(plik, '.wav')}.float.wav`);
  await uruchom(ffmpeg(), ['-hide_banner', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0', '-af', 'highpass=f=28,lowpass=f=17500', '-c:a', 'pcm_f32le', surowy], { wejscie: Buffer.from(probki.buffer) });
  const pomiar = await zmierz(surowy, cel);
  const normalizacja = `loudnorm=I=${cel}:TP=-1.8:LRA=5:measured_I=${pomiar.input_i}:measured_TP=${pomiar.input_tp}:measured_LRA=${pomiar.input_lra}:measured_thresh=${pomiar.input_thresh}:offset=${pomiar.target_offset}:linear=true`;
  await uruchom(ffmpeg(), ['-hide_banner', '-y', '-i', surowy, '-af', normalizacja, '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s24le', '-t', String(sekundy), plik]);
  const proba = path.join(katalogRoboczy, `${path.basename(plik, '.wav')}-aac.m4a`);
  await uruchom(ffmpeg(), ['-hide_banner', '-y', '-i', plik, '-c:a', 'aac', '-b:a', '192k', '-ar', String(SR), '-ac', '2', proba]);
  await fsp.rm(surowy, { force: true });
  const [wav, aac] = [await zmierz(plik, cel), await zmierz(proba, cel)];
  if (Math.abs(Number(wav.input_i) - cel) > 0.8 || Number(aac.input_tp) > -1.05) throw new Error(`Mastering poza normą: WAV ${wav.input_i} LUFS, AAC szczyt ${aac.input_tp} dBTP.`);
  return { wav: { lufs: Number(wav.input_i), szczytDbtp: Number(wav.input_tp) }, aac192k: { lufs: Number(aac.input_i), szczytDbtp: Number(aac.input_tp) } };
}

/** Generuje podkład presetu do pliku WAV i zapisuje raport. */
export async function generuj(nazwaPresetu, plik, katalogRoboczy, { bpm, sekundy = 20, ziarno } = {}) {
  const preset = PRESETY[nazwaPresetu];
  if (!preset) throw new Blad(`Nieznany preset muzyki „${nazwaPresetu}”. Dostępne: ${Object.keys(PRESETY).join(', ')}.`);
  const tempo = bpm ?? preset.bpm;
  if (!(tempo >= 90 && tempo <= 150)) throw new Blad(`Tempo ${tempo} BPM poza zakresem 90–150.`);
  const { probki, siatka } = zloz(preset, { bpm: tempo, sekundy, ziarno });
  const pomiary = await master(probki, plik, katalogRoboczy, sekundy);
  const raport = {
    plik: path.basename(plik), preset: nazwaPresetu, opis: preset.opis, bpm: tempo, sekundy, czestotliwosc: SR, kanaly: 2,
    sha256: sha256(await fsp.readFile(plik)), ...pomiary, siatkaTaktow: siatka,
    nagraniaObce: false, lektor: false, odglosyKlikniec: false,
    odsluch: 'DO_ODSŁUCHU — narzędzie mierzy głośność i szczyty, ale nie ocenia brzmienia',
  };
  await zapiszJson(path.join(katalogRoboczy, `${path.basename(plik, '.wav')}.json`), raport);
  return raport;
}

/**
 * Podkład filmu: gotowy plik ("plik") albo preset generowany pod długość filmu
 * ("preset", opcjonalnie "bpm"). Wygenerowany plik zostaje w kampanii, żeby
 * kolejne budowania dawały ten sam dźwięk.
 */
export async function przygotujMuzyke(k, film, katalogQa) {
  const m = film.muzyka;
  if (!m || (!m.plik && !m.preset)) throw new Blad(`Film „${film.plik}” nie ma muzyki. Podaj "muzyka": { "plik": "marka/muzyka/..." } albo { "preset": "${Object.keys(PRESETY)[0]}" }.`);
  if (m.plik) {
    const plik = [path.resolve(k.katalog, m.plik), path.resolve(REPO, m.plik)].find((kandydat) => fs.existsSync(kandydat));
    if (!plik) throw new Blad(`Nie ma pliku muzyki „${m.plik}” (szukano w kampanii i w repo).`);
    const { tekst } = await uruchom(ffprobe(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', plik]);
    const dlugosc = Number(JSON.parse(tekst).format.duration);
    if (dlugosc + 0.05 < film.dlugosc) throw new Blad(`Podkład „${m.plik}” trwa ${dlugosc.toFixed(1)} s, a film ${film.dlugosc} s. Wybierz preset z generowaniem pod długość filmu.`);
    return { plik, opis: `gotowy podkład ${wzgledna(REPO, plik)}`, wygenerowana: false };
  }
  const tempo = m.bpm ?? PRESETY[m.preset]?.bpm;
  const plik = path.join(k.katalog, 'muzyka', `${film.plik}-${m.preset}-${tempo}bpm-${film.dlugosc}s.wav`);
  if (!fs.existsSync(plik)) await generuj(m.preset, plik, path.join(katalogQa, 'muzyka'), { bpm: m.bpm, sekundy: film.dlugosc, ziarno: m.ziarno });
  return { plik, opis: `podkład syntezowany lokalnie, preset „${m.preset}”, ${tempo} BPM, ${film.dlugosc} s`, wygenerowana: true };
}
