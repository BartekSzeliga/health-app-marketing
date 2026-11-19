import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createCanvas, loadImage, wczytajObraz } from './plotno.mjs';
import { NARZEDZIE, PRODUKT, czytajJson, ffmpeg, ffprobe, sha256, uruchom, wzgledna } from './wspolne.mjs';
import { renderujWszystkie } from './grafika.mjs';
import { przygotujFilm, stempleScen } from './film.mjs';

const lista = (wartosc) => (wartosc === undefined || wartosc === null ? [] : Array.isArray(wartosc) ? wartosc : [wartosc]);

/** Wszystkie napisy kampanii z informacją, skąd pochodzą i czy są napisem na kreacji / nagłówkiem. */
export function zbierzTeksty(k) {
  const wynik = [];
  const dodaj = (gdzie, wartosc, naglowek) => lista(wartosc).forEach((tekst) => { if (typeof tekst === 'string') wynik.push({ gdzie, tekst, naglowek }); });
  const plansza = (wpis, gdzie) => {
    for (const pole of ['etykieta', 'naglowek', 'tresc', 'dopisek']) dodaj(`${gdzie}.${pole}`, wpis[pole], true);
  };
  dodaj('cta.plansza', k.cta.plansza, true);
  for (const temat of k.tematy) {
    const gdzie = `temat ${temat.id}`;
    plansza(temat, gdzie);
    for (const [pole, wartosc] of Object.entries(temat.teksty ?? {})) dodaj(`${gdzie}.teksty.${pole}`, wartosc, pole === 'naglowek');
    for (const [i, scena] of (temat.film?.sceny ?? []).entries()) {
      for (const pole of ['etykieta', 'naglowek', 'wstep', 'tytul', 'opis', 'haslo']) dodaj(`${gdzie}.film scena ${i + 1}.${pole}`, scena[pole], true);
    }
  }
  if (k.karuzela) {
    dodaj('karuzela.tekstGlowny', k.karuzela.tekstGlowny, false);
    for (const karta of k.karuzela.karty) {
      plansza(karta, `karta ${karta.id}`);
      for (const [pole, wartosc] of Object.entries(karta.teksty ?? {})) dodaj(`karta ${karta.id}.teksty.${pole}`, wartosc, pole === 'naglowek');
    }
  }
  return wynik;
}

/**
 * Kontrola kampanii przed renderem: treści, twierdzenia, dowody, źródła,
 * kadry oraz suchy przebieg wszystkich plansz i punktów kontrolnych filmów.
 * Zwraca { bledy, uwagi, informacje }; błędy blokują budowanie.
 */
export async function sprawdzKampanie(k, { katalogQa, zFilmami = true } = {}) {
  const [bledy, uwagi, informacje] = [[], [], []];
  const reguly = (await czytajJson(path.join(NARZEDZIE, 'reguly/tresci.json'))).reguly;
  const spec = await czytajJson(path.join(NARZEDZIE, 'specyfikacje/meta.json'));

  // 1. Sformułowania zakazane i ryzykowne.
  const dowody = k.tematy.flatMap((temat) => temat.dowody.map((dowod) => dowod.twierdzenie ?? ''));
  const skrot = (tekst) => (tekst.length > 72 ? `${tekst.slice(0, 70)}…` : tekst);
  for (const { gdzie, tekst, naglowek } of zbierzTeksty(k)) {
    for (const regula of reguly) {
      if (regula.pola === 'naglowki' && !naglowek) continue;
      if (!new RegExp(regula.wzorzec, regula.wielkoscLiter ? 'u' : 'iu').test(tekst)) continue;
      // Uwaga gaśnie, gdy kampania ma dowód na ten rodzaj twierdzenia (np. co jest darmowe).
      if (regula.gasiDowod && dowody.some((dowod) => new RegExp(regula.gasiDowod, 'iu').test(dowod))) continue;
      (regula.poziom === 'blad' ? bledy : uwagi).push(`${gdzie}: „${skrot(tekst)}” — ${regula.powod}`);
    }
  }

  // Pola szablonu, których nikt nie uzupełnił, nie mogą trafić na kreację.
  for (const { gdzie, tekst } of zbierzTeksty(k)) if (/\bTU:/u.test(tekst)) bledy.push(`${gdzie}: pole szablonu nie jest uzupełnione („${skrot(tekst)}”)`);
  if (/\bTU:/u.test(k.nazwa)) bledy.push('nazwa: pole szablonu nie jest uzupełnione');

  // 2. Długości tekstów reklam względem zaleceń Meta (informacyjnie).
  const limity = spec.limityZnakow;
  const dlugosc = (gdzie, tekst, limit) => {
    if (typeof tekst === 'string' && limit && tekst.length > limit.zalecane) informacje.push(`${gdzie}: ${tekst.length} znaków, Meta zaleca do ${limit.zalecane} (${limit.nota})`);
  };
  for (const temat of k.tematy) {
    const zestaw = k.typ === 'post' ? limity.post : limity.reklama;
    for (const [pole, wartosc] of Object.entries(temat.teksty ?? {})) dlugosc(`temat ${temat.id}.teksty.${pole}`, wartosc, zestaw[pole]);
    if (!temat.teksty || !Object.keys(temat.teksty).length) uwagi.push(`temat ${temat.id}: brak tekstów do wklejenia (pole "teksty")`);
  }
  if (k.karuzela) {
    dlugosc('karuzela.tekstGlowny', k.karuzela.tekstGlowny, limity.karuzela.tekstGlowny);
    for (const karta of k.karuzela.karty) for (const pole of ['naglowek', 'opis']) dlugosc(`karta ${karta.id}.teksty.${pole}`, karta.teksty?.[pole], limity.karuzela[pole]);
  }
  const wiek = Math.floor((Date.now() - Date.parse(spec.zweryfikowano)) / 86400000);
  if (wiek > spec.waznoscDni) uwagi.push(`Specyfikacje Meta w narzędziu sprawdzono ${spec.zweryfikowano} (${wiek} dni temu). Przed kampanią potwierdź formaty i strefy u źródła i zaktualizuj narzedzie/specyfikacje/meta.json.`);

  // 3. Dowody twierdzeń: plik wskazany jako dowód musi istnieć w repo produktu.
  for (const temat of k.tematy) {
    if (k.typ === 'reklama' && !temat.dowody.length) uwagi.push(`temat ${temat.id}: brak dowodów. Każde twierdzenie o produkcie powinno wskazywać plik w kodzie (pole "dowody").`);
    for (const dowod of temat.dowody) {
      if (!dowod.repo || !dowod.plik) { uwagi.push(`temat ${temat.id}: dowód „${dowod.twierdzenie}” nie wskazuje pliku (repo, plik)`); continue; }
      if (!fs.existsSync(path.join(PRODUKT, dowod.repo, dowod.plik))) bledy.push(`temat ${temat.id}: dowód wskazuje plik, którego nie ma: ${dowod.repo}/${dowod.plik}`);
    }
  }
  if (!k.pochodzenie) uwagi.push('Brak sekcji "pochodzenie": kiedy, na jakim urządzeniu i koncie demo powstały ujęcia oraz jaki był commit produktu.');

  // 4. Źródła i kadry.
  const uzyte = new Set();
  const wymiary = {};
  for (const zrodlo of Object.values(k.zrodla)) if (zrodlo.rodzaj === 'obraz') { const { obraz } = await wczytajObraz(zrodlo.plik); wymiary[zrodlo.klucz] = obraz; }
  const telefon = (klucz, gdzie) => {
    uzyte.add(klucz);
    const obraz = wymiary[klucz];
    if (obraz.width >= obraz.height) bledy.push(`${gdzie}: źródło „${klucz}” jest poziome (${obraz.width}×${obraz.height}), a ramka telefonu wymaga pionowego zrzutu ekranu`);
    else if (obraz.width < 1100) uwagi.push(`${gdzie}: źródło „${klucz}” ma ${obraz.width}×${obraz.height}; zaakceptowane paczki używały natywnych zrzutów 1206×2622`);
  };
  const panel = (klucz, gdzie) => {
    uzyte.add(klucz);
    const obraz = wymiary[klucz];
    if (obraz.width <= obraz.height) bledy.push(`${gdzie}: źródło „${klucz}” jest pionowe, a okno panelu web wymaga poziomego zrzutu`);
    else if (obraz.width < 1400) uwagi.push(`${gdzie}: zrzut panelu „${klucz}” ma tylko ${obraz.width} px szerokości — tekst panelu może być nieostry`);
  };
  for (const kadr of Object.values(k.kadry)) {
    const obraz = wymiary[kadr.zrodlo];
    if (kadr.x + kadr.szer > obraz.width || kadr.y + kadr.wys > obraz.height || kadr.szer <= 0 || kadr.wys <= 0) bledy.push(`kadr ${kadr.klucz}: wychodzi poza źródło „${kadr.zrodlo}” ${obraz.width}×${obraz.height}`);
  }
  const plansza = (wpis, gdzie) => {
    if (wpis.ekran) telefon(wpis.ekran, gdzie);
    if (wpis.ekran2) telefon(wpis.ekran2, gdzie);
    if (wpis.ekran3) telefon(wpis.ekran3, gdzie);
    if (wpis.panel) panel(wpis.panel, gdzie);
    if (wpis.zdjecie) uzyte.add(wpis.zdjecie);
    if (wpis.detal) uzyte.add(k.kadry[wpis.detal].zrodlo);
  };
  k.tematy.forEach((temat) => plansza(temat, `temat ${temat.id}`));
  k.karuzela?.karty.forEach((karta) => plansza(karta, `karta ${karta.id}`));

  // 5. Filmy: zasady kreacji, które da się sprawdzić mechanicznie.
  for (const film of k.filmy) {
    const gdzie = `film ${film.plik}`;
    if (!['hook', 'material'].includes(film.sceny[0].typ)) uwagi.push(`${gdzie}: film nie zaczyna się sceną hook ani material — pierwsza sekunda ma nieść rozpoznawalną wartość`);
    for (const [i, scena] of film.sceny.entries()) {
      const s = `${gdzie}, scena ${i + 1} (${scena.typ})`;
      if (scena.ekran) telefon(scena.ekran, s);
      if (scena.kadr) uzyte.add(k.kadry[scena.kadr].zrodlo);
      if (scena.material) uzyte.add(scena.material);
      if (scena.opcje?.length) {
        scena.opcje.forEach((opcja) => uzyte.add(opcja.material));
        informacje.push(`${s}: ${scena.opcje.length + 1} nagrania do wyboru przez Bartosza (plansza opcji trafia do DO_OBEJRZENIA/); przed akceptacją zostaje jedno`);
      }
      if (scena.typ === 'material' && scena.czas < 2) uwagi.push(`${s}: ${scena.czas} s to mało, żeby zobaczyć sytuację i przeczytać napis`);
      if (scena.typ === 'material' && (scena.naglowek?.length ?? 0) > 4) bledy.push(`${s}: napis na nagraniu ma ${scena.naglowek.length} linii; mieszczą się najwyżej 4`);
      scena.klipy.forEach((klip) => { uzyte.add(klip.zrodlo); if (klip.kadr) uzyte.add(k.kadry[klip.kadr].zrodlo); });
      if (scena.typ === 'hook' && scena.naglowek.length > 2) bledy.push(`${s}: hook ma ${scena.naglowek.length} linie; mieszczą się najwyżej 2`);
      if (scena.typ === 'cta' && scena.haslo.length > 2) bledy.push(`${s}: hasło końcowe ma ${scena.haslo.length} linie; mieszczą się najwyżej 2`);
      if ((scena.typ === 'ekran' || scena.typ === 'detal') && scena.czas < 2.5) uwagi.push(`${s}: ${scena.czas} s to mało na odczytanie ekranu — wydłuż scenę zamiast przyspieszać całość`);
      if (scena.typ === 'cta' && scena.czas < 3) uwagi.push(`${s}: plansza końcowa krótsza niż 3 s`);
    }
    if (film.dlugosc > 30) uwagi.push(`${gdzie}: ${film.dlugosc} s; dotychczasowe spoty Reels/Stories miały 15–30 s`);
  }
  for (const zrodlo of Object.values(k.zrodla)) if (!uzyte.has(zrodlo.klucz)) uwagi.push(`źródło „${zrodlo.klucz}” nie jest użyte w żadnej planszy ani scenie`);

  // 6. Suchy przebieg: czy każdy napis mieści się na planszy i w bezpiecznej strefie.
  if (!bledy.length) {
    for (const wynik of await renderujWszystkie(k)) bledy.push(...wynik.plotno.problemy);
    if (zFilmami && katalogQa) {
      for (const film of k.filmy) {
        const przygotowany = await przygotujFilm(k, film, katalogQa);
        for (const stempel of stempleScen(film)) await przygotowany.rysuj(stempel);
        bledy.push(...przygotowany.p.problemy);
      }
    }
  }
  return { bledy, uwagi, informacje };
}

/**
 * Kontrola gotowych mediów (przeniesienie verify-media.mjs): parametry pliku,
 * pełne dekodowanie, głośność, odstęp klatek kluczowych, plansza kontaktowa
 * z zakodowanego filmu i okładka do podglądu.
 */
export async function sprawdzFilm(k, film, plik, katalogQa, { wymiary = null, okladka = true } = {}) {
  const spec = (await czytajJson(path.join(NARZEDZIE, 'specyfikacje/meta.json'))).film;
  const info = JSON.parse((await uruchom(ffprobe(), ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', plik])).tekst);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const a = info.streams.find((s) => s.codec_type === 'audio');
  const pakiety = (await uruchom(ffprobe(), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,flags', '-of', 'csv=p=0', plik])).tekst.trim().split('\n').map((linia) => linia.split(','));
  const kluczowe = pakiety.filter(([, flagi]) => flagi?.includes('K')).map(([czas]) => Number(czas)).sort((x, y) => x - y);
  const odstep = Math.max(...kluczowe.map((czas, i) => (i ? czas - kluczowe[i - 1] : czas)), film.dlugosc - kluczowe.at(-1));
  const glosnosc = await uruchom(ffmpeg(), ['-hide_banner', '-i', plik, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-']);
  const pomiar = JSON.parse(glosnosc.bledy.slice(glosnosc.bledy.lastIndexOf('{'), glosnosc.bledy.lastIndexOf('}') + 1));
  const [lufs, szczyt] = [Number(pomiar.input_i), Number(pomiar.input_tp)];
  const dekodowanie = await uruchom(ffmpeg(), ['-hide_banner', '-v', 'error', '-i', plik, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
  const kontrole = {
    wymiary: v?.width === (wymiary?.[0] ?? spec.szerokosc) && v?.height === (wymiary?.[1] ?? spec.wysokosc),
    h264Yuv420p: v?.codec_name === 'h264' && v?.pix_fmt === 'yuv420p',
    fps30: v?.avg_frame_rate === '30/1',
    klatki: Number(v?.nb_read_frames) === film.dlugosc * spec.fps,
    dlugosc: Math.abs(Number(v?.duration) - film.dlugosc) < 0.035 && Math.abs(Number(info.format.duration) - film.dlugosc) < 0.035,
    kwadratowePiksele: v?.sample_aspect_ratio === '1:1',
    bt709: v?.color_space === 'bt709' && v?.color_transfer === 'bt709' && v?.color_primaries === 'bt709',
    aacStereo48k: a?.codec_name === 'aac' && a?.channels === 2 && a?.sample_rate === '48000',
    pelneDekodowanie: dekodowanie.bledy.trim() === '',
    glosnosc: lufs >= spec.glosnoscLufs[0] && lufs <= spec.glosnoscLufs[1] && szczyt <= spec.szczytDbtp,
    klatkiKluczowe: odstep <= spec.maksOdstepKlatekKluczowychS,
  };

  // Plansza z zakodowanego pliku: oceniamy to, co naprawdę trafi do wgrania, nie storyboard.
  const katalog = path.join(katalogQa, 'film');
  await fsp.mkdir(katalog, { recursive: true });
  const stemple = Array.from({ length: 12 }, (_, i) => Math.round((0.6 + i * (film.dlugosc - 1.2) / 11) * 10) / 10);
  const wysokoscKlatki = Math.round(360 * v.height / v.width);
  const plansza = createCanvas(1440, 3 * (wysokoscKlatki + 40));
  const g = plansza.getContext('2d');
  g.fillStyle = k.motyw.kolory.cream; g.fillRect(0, 0, plansza.width, plansza.height);
  const nazwa = path.basename(plik, '.mp4');
  for (const [i, stempel] of stemple.entries()) {
    const klatka = path.join(katalog, `${nazwa}-zakodowany-${stempel.toFixed(1)}s.jpg`);
    await uruchom(ffmpeg(), ['-v', 'error', '-y', '-ss', String(stempel), '-i', plik, '-frames:v', '1', '-vf', `scale=360:${wysokoscKlatki}`, '-q:v', '2', klatka]);
    const [x, y] = [(i % 4) * 360, Math.floor(i / 4) * (wysokoscKlatki + 40)];
    g.drawImage(await loadImage(klatka), x, y);
    g.fillStyle = k.motyw.kolory.pine; g.font = '20px "Avenir Next"'; g.fillText(`${stempel.toFixed(1)} s`, x + 14, y + wysokoscKlatki + 30);
    await fsp.rm(klatka, { force: true });
  }
  const kontakt = path.join(katalog, `${nazwa}-kontakt.jpg`);
  await fsp.writeFile(kontakt, await plansza.encode('jpeg', 92));
  const plikOkladki = path.join(k.katalog, 'podglad/okladki', `${film.plik}.jpg`);
  if (okladka) {
    await fsp.mkdir(path.dirname(plikOkladki), { recursive: true });
    await uruchom(ffmpeg(), ['-v', 'error', '-y', '-ss', '1.6', '-i', plik, '-frames:v', '1', '-vf', 'scale=540:960', '-q:v', '2', plikOkladki]);
  }

  const bufor = await fsp.readFile(plik);
  return {
    plik: wzgledna(k.katalog, plik), nazwa: path.basename(plik), rodzaj: 'film', temat: film.temat, sha256: sha256(bufor), bajty: bufor.length,
    szerokosc: v.width, wysokosc: v.height, sekundy: film.dlugosc, fps: 30, klatek: Number(v.nb_read_frames),
    kontrole, zaliczone: Object.values(kontrole).every(Boolean),
    dzwiek: { lufs, szczytDbtp: szczyt, kodek: a?.codec_name, czestotliwosc: Number(a?.sample_rate), kanaly: a?.channels },
    najwiekszyOdstepKlatekKluczowychS: Math.round(odstep * 1000) / 1000,
    planszaKontaktowa: wzgledna(k.katalog, kontakt), okladka: wzgledna(k.katalog, plikOkladki),
  };
}

/** Kontrola zapisanej grafiki: nagłówek JPEG, wymiary po zdekodowaniu, rozmiar. */
export async function sprawdzGrafike(k, zapis, oczekiwane) {
  const bufor = await fsp.readFile(zapis.plik);
  const obraz = await loadImage(bufor);
  const kontrole = {
    jpeg: bufor[0] === 0xff && bufor[1] === 0xd8,
    wymiary: obraz.width === oczekiwane[0] && obraz.height === oczekiwane[1],
    rozmiar: bufor.length < 30 * 1024 * 1024,
  };
  return {
    plik: wzgledna(k.katalog, zapis.plik), nazwa: zapis.nazwa, rodzaj: zapis.rodzaj, temat: zapis.temat, format: zapis.format,
    sha256: sha256(bufor), bajty: bufor.length, szerokosc: obraz.width, wysokosc: obraz.height, kontrole, zaliczone: Object.values(kontrole).every(Boolean),
  };
}
