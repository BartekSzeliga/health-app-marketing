#!/usr/bin/env node
// reklama — buduje paczkę reklam Diecik z jednego pliku kampania.json.
// Opis komend: ./reklama pomoc. Zasady pracy: AGENTS.md i zasady/ w repo.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Blad, NARZEDZIE, REPO, listaKampanii, sha256, uruchom, wzgledna, zapiszJson, znajdzKampanie } from './src/wspolne.mjs';
import { FORMATY, wczytajKampanie } from './src/kampania.mjs';
import { wymagajFontow } from './src/motyw.mjs';
import { planszaKontaktowa, renderujWszystkie, zapiszGrafike } from './src/grafika.mjs';
import { planszaOpcji, renderujFilm, storyboard } from './src/film.mjs';
import { przygotujMuzyke } from './src/muzyka.mjs';
import { sprawdzFilm, sprawdzGrafike, sprawdzKampanie } from './src/kontrola.mjs';
import { readme, tekstyReklam, zrodla } from './src/teksty.mjs';
import { zbudujPodglad } from './src/podglad.mjs';
import { DO_OBEJRZENIA, czytajManifest, planszeWyboru, spakuj, wpuscDoGita, wystawDoObejrzenia, zapiszManifest } from './src/paczka.mjs';
import { createCanvas, wczytajObraz } from './src/plotno.mjs';

const POMOC = `reklama — paczki reklam Diecik z jednego pliku kampanii

  ./reklama nowa <nazwa> [--typ instalacje|specjalista|firma|post] [--z <kampania>]
        zakłada kampanie/RRRR-MM-DD-<nazwa>/ z szablonu albo jako kopię istniejącej
  ./reklama lista                       kampanie i ich status
  ./reklama kadr <kampania> <źródło> [x y szer wys]
        zrzut z siatką współrzędnych; z prostokątem pokazuje też sam wycinek
  ./reklama sprawdz [kampania]          treści, twierdzenia, dowody, źródła, mieszczenie napisów
  ./reklama szkic [kampania]            po jednej grafice na temat, karuzela i storyboardy filmów
  ./reklama buduj [kampania] [--bez-filmow]
        wszystko: grafiki, karuzela, filmy, kontrola mediów, teksty, podgląd, manifest, ZIP
  ./reklama pokaz [kampania] [--port N] [--bez-otwierania]
        lokalny serwer ze stroną podglądu (Ctrl+C kończy)
  ./reklama wystaw <kampania>
        wkłada grafiki i filmy tej paczki do DO_OBEJRZENIA/ (buduj robi to samo dla pełnej paczki)
  ./reklama akceptuj <kampania> --cytat "słowa Bartosza"
        zapisuje akceptację; od tej chwili paczka jest zamrożona
  ./reklama odrzuc <kampania> --powod "słowa Bartosza"
        oznacza paczkę jako odrzuconą; pliki zostają, a powód trafia do manifestu
  ./reklama git-kontrola                co trafiłoby do Git: rozmiar, największe pliki, podejrzane nazwy

Kampania to nazwa folderu w kampanie/ (albo w narzedzie/przyklady/) lub ścieżka.
Narzędzie niczego nie wgrywa do Meta ani sklepów.`;

function argumenty(lista) {
  const pozycyjne = [];
  const flagi = {};
  for (let i = 0; i < lista.length; i += 1) {
    if (lista[i].startsWith('--')) {
      const nazwa = lista[i].slice(2);
      if (i + 1 < lista.length && !lista[i + 1].startsWith('--')) { flagi[nazwa] = lista[i + 1]; i += 1; } else flagi[nazwa] = true;
    } else pozycyjne.push(lista[i]);
  }
  return { pozycyjne, flagi };
}

const mb = (bajty) => `${(bajty / 1048576).toFixed(1)} MB`;
const pokaz = (plik) => wzgledna(process.cwd(), plik);

function wypiszKontrole({ bledy, uwagi, informacje }) {
  if (bledy.length) console.log(`\nBŁĘDY (${bledy.length}) — blokują budowanie:\n${bledy.map((b) => `  ✗ ${b}`).join('\n')}`);
  if (uwagi.length) console.log(`\nUwagi (${uwagi.length}) — do świadomej decyzji:\n${uwagi.map((u) => `  ! ${u}`).join('\n')}`);
  if (informacje.length) console.log(`\nDługości tekstów (${informacje.length}):\n${informacje.map((i) => `  · ${i}`).join('\n')}`);
  if (!bledy.length) console.log(`\nKontrola treści i źródeł: bez błędów${uwagi.length ? `, ${uwagi.length} uwag` : ''}.`);
}

async function kampania(argument) {
  wymagajFontow();
  return wczytajKampanie(znajdzKampanie(argument));
}

async function komendaSprawdz(argument) {
  const k = await kampania(argument);
  const wynik = await sprawdzKampanie(k, { katalogQa: path.join(k.katalog, 'qa') });
  console.log(`${k.nazwa} (${k.id}): tematy ${k.tematy.length}, filmy ${k.filmy.length}${k.karuzela ? `, karty karuzeli ${k.karuzela.karty.length}` : ''}`);
  wypiszKontrole(wynik);
  if (wynik.bledy.length) process.exitCode = 1;
}

/** Sceny, w których Bartosz ma wybrać nagranie: plansza z opcjami A, B, C dla każdej z nich. */
async function planszeOpcji(k, qa) {
  await fsp.rm(path.join(qa, 'opcje'), { recursive: true, force: true });
  const plansze = [];
  for (const film of k.filmy) {
    for (const [numer, scena] of film.sceny.entries()) if (scena.opcje?.length) plansze.push(await planszaOpcji(k, film, numer, qa));
  }
  return plansze;
}

async function komendaSzkic(argument) {
  const k = await kampania(argument);
  const qa = path.join(k.katalog, 'qa');
  const kontrola = await sprawdzKampanie(k, { katalogQa: qa, zFilmami: false });
  wypiszKontrole(kontrola);
  if (kontrola.bledy.length) { process.exitCode = 1; return; }
  const zapisane = [];
  for (const wynik of await renderujWszystkie(k, { tylkoPierwszyFormat: true })) zapisane.push(await zapiszGrafike(wynik, path.join(qa, 'szkic'), path.join(qa, 'szkic/360')));
  const plansza = await planszaKontaktowa(zapisane, path.join(qa, 'szkic/plansza.jpg'));
  console.log(`\nSzkic grafik (${zapisane.length}): ${pokaz(path.join(qa, 'szkic'))}\nPlansza 360 px: ${pokaz(plansza)}`);
  for (const film of k.filmy) {
    const wynik = await storyboard(k, film, qa);
    console.log(`Storyboard filmu ${film.plik} (${film.dlugosc} s): ${pokaz(wynik.plik)}`);
    if (wynik.problemy.length) { console.log(wynik.problemy.map((p) => `  ✗ ${p}`).join('\n')); process.exitCode = 1; }
  }
  for (const plansza of await planszeOpcji(k, qa)) console.log(`Opcje nagrania do wyboru: ${pokaz(plansza)}`);
  console.log('\nSzkic to materiał do oceny kierunku. Pełna paczka: ./reklama buduj');
}

async function dokumenty(k, pliki, status, raportyFilmow) {
  await fsp.writeFile(path.join(k.katalog, 'TEKSTY-REKLAM.txt'), tekstyReklam(k, pliki, status));
  if (raportyFilmow) await fsp.writeFile(path.join(k.katalog, 'ZRODLA.txt'), await zrodla(k, raportyFilmow));
  const nazwaZip = `${k.motyw.nazwa.replace(/[^A-Za-z0-9]+/g, '-')}-${k.id}.zip`;
  await fsp.writeFile(path.join(k.katalog, 'README.md'), readme(k, pliki, status, nazwaZip));
  return nazwaZip;
}

async function komendaBuduj(argument, flagi) {
  const start = Date.now();
  const k = await kampania(argument);
  const qa = path.join(k.katalog, 'qa');
  const poprzedni = await czytajManifest(k);
  if (poprzedni?.status === 'ZAAKCEPTOWANE') throw new Blad(`Kampania „${k.id}” jest zaakceptowana i zamrożona. Zmiany wprowadź w nowej: ./reklama nowa <nazwa> --z ${k.id}`);
  const bezFilmow = Boolean(flagi['bez-filmow']);
  const kontrola = await sprawdzKampanie(k, { katalogQa: qa, zFilmami: !bezFilmow });
  wypiszKontrole(kontrola);
  if (kontrola.bledy.length) { process.exitCode = 1; return; }

  const wyjscie = path.join(k.katalog, 'DO_WGRANIA');
  const grafiki = await renderujWszystkie(k);
  const oczekiwane = new Set([...grafiki.map((g) => g.plik), ...k.filmy.flatMap((f) => (f.kadr45 ? [`${f.plik}.mp4`, `${f.plik}-4x5.mp4`] : [`${f.plik}.mp4`]))]);
  if (fs.existsSync(wyjscie)) {
    const obce = fs.readdirSync(wyjscie).filter((nazwa) => !oczekiwane.has(nazwa) && nazwa !== '.DS_Store');
    if (obce.length) throw new Blad(`W DO_WGRANIA są pliki spoza tej kampanii: ${obce.join(', ')}. Przenieś je lub usuń — folder ma zawierać wyłącznie pliki do wgrania.`);
  }

  const pliki = [];
  const zapisane = [];
  for (const wynik of grafiki) {
    const zapis = await zapiszGrafike(wynik, wyjscie, path.join(qa, 'grafiki'));
    zapisane.push(zapis);
    pliki.push(await sprawdzGrafike(k, zapis, FORMATY[wynik.format]));
  }
  await planszaKontaktowa(zapisane, path.join(qa, 'grafiki/plansza.jpg'));
  console.log(`\nGrafiki i karuzela: ${zapisane.length} plików (${((Date.now() - start) / 1000).toFixed(1)} s)`);

  const raportyFilmow = [];
  if (!bezFilmow && k.filmy.length) {
    // Muzykę przygotowujemy po kolei (może się generować), filmy renderują się równolegle w osobnych procesach.
    const zadania = [];
    for (const [numer, film] of k.filmy.entries()) zadania.push({ numer, film, muzyka: await przygotujMuzyke(k, film, qa) });
    const kolejka = [...zadania];
    const wyniki = new Array(zadania.length);
    const pracownik = async () => {
      for (let zadanie = kolejka.shift(); zadanie; zadanie = kolejka.shift()) {
        const t0 = Date.now();
        const { tekst } = await uruchom(process.execPath, [fileURLToPath(import.meta.url), '_film', k.katalog, String(zadanie.numer), JSON.stringify(zadanie.muzyka)]);
        const wynik = JSON.parse(tekst);
        if (wynik.problemy.length) throw new Blad(`Film „${zadanie.film.plik}” ma napisy poza bezpieczną strefą:\n${wynik.problemy.map((p) => `  ✗ ${p}`).join('\n')}`);
        wyniki[zadanie.numer] = wynik;
        console.log(`Film ${zadanie.film.plik}.mp4: ${zadanie.film.dlugosc} s, ${mb(wynik.kontrola.bajty)}, ${wynik.kontrola.dzwiek.lufs} LUFS (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, zadania.length) }, pracownik));
    for (const wynik of wyniki) { raportyFilmow.push(wynik.raport); pliki.push(wynik.kontrola); if (wynik.kontrola45) pliki.push(wynik.kontrola45); }
  } else if (k.filmy.length) console.log(`Pominięto ${k.filmy.length} filmów (--bez-filmow); paczka zostaje szkicem.`);

  const niezaliczone = pliki.filter((p) => !p.zaliczone);
  if (niezaliczone.length) {
    throw new Blad(`Kontrola techniczna nie przeszła:\n${niezaliczone.map((p) => `  ✗ ${p.nazwa}: ${Object.entries(p.kontrole).filter(([, ok]) => !ok).map(([nazwa]) => nazwa).join(', ')}`).join('\n')}`);
  }
  pliki.sort((a, b) => a.nazwa.localeCompare(b.nazwa));
  const status = bezFilmow && k.filmy.length ? 'SZKIC' : 'DO_AKCEPTACJI';
  const nazwaZip = await dokumenty(k, pliki, status, raportyFilmow);
  await zapiszManifest(k, { pliki, status, kontrola });
  const zip = await spakuj(k, pliki);
  await zapiszJson(path.join(qa, 'zip.json'), zip);
  await zbudujPodglad(k, pliki, status, nazwaZip);
  // Bartosz ogląda pracę w jednym folderze. Trafia tam tylko pełna paczka prawdziwej kampanii, nie szkic ani przykład narzędzia.
  const doObejrzenia = status === 'DO_AKCEPTACJI' && k.katalog.startsWith(path.join(REPO, 'kampanie') + path.sep);
  const plansze = bezFilmow ? [] : await planszeOpcji(k, qa);
  if (doObejrzenia) await wystawDoObejrzenia(k, pliki, undefined, plansze);

  console.log(`\nPaczka gotowa w ${((Date.now() - start) / 1000).toFixed(1)} s — status ${status}`);
  console.log(`  DO_WGRANIA: ${pliki.length} plików, ${mb(pliki.reduce((suma, p) => suma + p.bajty, 0))}`);
  console.log(`  ZIP: ${zip.plik} (${mb(zip.bajty)}, ${zip.wpisow} wpisów, sprawdzony)`);
  console.log(`  Plansze do oceny: ${pokaz(path.join(qa, 'grafiki/plansza.jpg'))}${raportyFilmow.length ? `, ${pokaz(path.join(qa, 'film'))}/*-kontakt.jpg` : ''}`);
  if (doObejrzenia) console.log(`  Do obejrzenia: ${pokaz(DO_OBEJRZENIA)}/ — same grafiki i filmy tej paczki${plansze.length ? ` oraz ${plansze.length} plansza opcji do wyboru` : ''}`);
  console.log(`  Podgląd: ./reklama pokaz ${k.id}`);
  console.log('\nKontrola techniczna to nie akceptacja. Obejrzyj plansze i filmy, potem pokaż podgląd Bartoszowi.');
}

/** Wewnętrzna komenda: render i kontrola jednego filmu w osobnym procesie; wynik jako JSON na stdout. */
async function komendaFilm([katalog, numer, muzyka]) {
  const k = await wczytajKampanie(katalog);
  const film = k.filmy[Number(numer)];
  const qa = path.join(k.katalog, 'qa');
  const wynik = await renderujFilm(k, film, { katalogWyjscia: path.join(k.katalog, 'DO_WGRANIA'), katalogQa: qa, muzyka: JSON.parse(muzyka) });
  if (wynik.problemy.length) { process.stdout.write(JSON.stringify({ problemy: wynik.problemy })); return; }
  const kontrola = await sprawdzFilm(k, film, wynik.plik, qa);
  const kontrola45 = wynik.plik45 ? await sprawdzFilm(k, film, wynik.plik45, qa, { wymiary: [1440, 1800], okladka: false }) : null;
  process.stdout.write(JSON.stringify({ problemy: [], raport: wynik.raport, kontrola, kontrola45 }));
}

async function komendaKadr(pozycyjne) {
  const [argument, klucz, ...liczby] = pozycyjne;
  if (!argument || !klucz) throw new Blad('Użycie: ./reklama kadr <kampania> <źródło> [x y szer wys]');
  const k = await kampania(argument);
  const zrodlo = k.zrodla[klucz];
  if (!zrodlo || zrodlo.rodzaj !== 'obraz') throw new Blad(`Źródło „${klucz}” nie istnieje albo jest nagraniem. Zrzuty: ${Object.values(k.zrodla).filter((z) => z.rodzaj === 'obraz').map((z) => z.klucz).join(', ')}`);
  const { obraz } = await wczytajObraz(zrodlo.plik);
  const canvas = createCanvas(obraz.width, obraz.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(obraz, 0, 0);
  ctx.font = '600 24px "Avenir Next"';
  for (let x = 0; x <= obraz.width; x += 100) {
    ctx.fillStyle = x % 500 === 0 ? 'rgba(220,30,60,.75)' : 'rgba(220,30,60,.32)';
    ctx.fillRect(x, 0, x % 500 === 0 ? 2 : 1, obraz.height);
    if (x % 200 === 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x + 3, 3, 62, 30); ctx.fillStyle = '#B4002D'; ctx.fillText(String(x), x + 6, 26); }
  }
  for (let y = 0; y <= obraz.height; y += 100) {
    ctx.fillStyle = y % 500 === 0 ? 'rgba(220,30,60,.75)' : 'rgba(220,30,60,.32)';
    ctx.fillRect(0, y, obraz.width, y % 500 === 0 ? 2 : 1);
    if (y % 200 === 0 && y) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(3, y + 3, 72, 30); ctx.fillStyle = '#B4002D'; ctx.fillText(String(y), 6, y + 26); }
  }
  const katalog = path.join(k.katalog, 'qa/kadr');
  await fsp.mkdir(katalog, { recursive: true });
  const [x, y, szer, wys] = liczby.map(Number);
  if (liczby.length === 4 && [x, y, szer, wys].every(Number.isFinite)) {
    if (x < 0 || y < 0 || x + szer > obraz.width || y + wys > obraz.height) throw new Blad(`Kadr wychodzi poza źródło ${obraz.width}×${obraz.height}.`);
    ctx.strokeStyle = '#00A651'; ctx.lineWidth = 6; ctx.strokeRect(x, y, szer, wys);
    const wycinek = createCanvas(szer, wys);
    wycinek.getContext('2d').drawImage(obraz, x, y, szer, wys, 0, 0, szer, wys);
    await fsp.writeFile(path.join(katalog, `${klucz}-wycinek.jpg`), await wycinek.encode('jpeg', 92));
    console.log(`Wycinek: ${pokaz(path.join(katalog, `${klucz}-wycinek.jpg`))}`);
    console.log(`Do kampania.json: "nazwaKadru": { "zrodlo": "${klucz}", "x": ${x}, "y": ${y}, "szer": ${szer}, "wys": ${wys} }`);
  }
  const plik = path.join(katalog, `${klucz}-siatka.jpg`);
  await fsp.writeFile(plik, await canvas.encode('jpeg', 88));
  console.log(`Źródło ${klucz}: ${obraz.width}×${obraz.height}. Siatka co 100 px: ${pokaz(plik)}`);
}

async function komendaNowa(pozycyjne, flagi) {
  const nazwa = pozycyjne[0];
  if (!nazwa || !/^[a-z0-9-]+$/.test(nazwa)) throw new Blad('Użycie: ./reklama nowa <nazwa> — małe litery, cyfry i myślniki, np. generator-treningu');
  const dzis = new Date().toLocaleDateString('sv-SE');
  const cel = path.join(REPO, 'kampanie', `${dzis}-${nazwa}`);
  if (fs.existsSync(cel)) throw new Blad(`Folder ${pokaz(cel)} już istnieje.`);
  await fsp.mkdir(path.join(cel, 'zrodla/ekrany'), { recursive: true });
  await fsp.mkdir(path.join(cel, 'zrodla/nagrania'), { recursive: true });
  if (flagi.z) {
    const zrodlowa = znajdzKampanie(flagi.z);
    await fsp.cp(path.join(zrodlowa, 'zrodla'), path.join(cel, 'zrodla'), { recursive: true });
    if (fs.existsSync(path.join(zrodlowa, 'muzyka'))) await fsp.cp(path.join(zrodlowa, 'muzyka'), path.join(cel, 'muzyka'), { recursive: true });
    const definicja = JSON.parse(await fsp.readFile(path.join(zrodlowa, 'kampania.json'), 'utf8'));
    definicja.data = dzis;
    await zapiszJson(path.join(cel, 'kampania.json'), definicja);
    console.log(`Nowa kampania jako kopia „${path.basename(zrodlowa)}”: ${pokaz(cel)}`);
  } else {
    const typ = flagi.typ ?? 'instalacje';
    const szablon = path.join(NARZEDZIE, 'szablony', typ);
    if (!fs.existsSync(szablon)) throw new Blad(`Nieznany typ „${typ}”. Dostępne: ${fs.readdirSync(path.join(NARZEDZIE, 'szablony')).join(', ')}`);
    const definicja = JSON.parse(await fsp.readFile(path.join(szablon, 'kampania.json'), 'utf8'));
    definicja.data = dzis;
    await zapiszJson(path.join(cel, 'kampania.json'), definicja);
    await fsp.copyFile(path.join(szablon, 'BRIEF.md'), path.join(cel, 'BRIEF.md'));
    console.log(`Nowa kampania (${typ}): ${pokaz(cel)}`);
    console.log('Kolejność: uzupełnij BRIEF.md → wgraj ujęcia do zrodla/ → popraw kampania.json → ./reklama sprawdz → ./reklama szkic');
  }
}

async function komendaLista() {
  const kampanie = listaKampanii();
  if (!kampanie.length) { console.log('Brak kampanii. Załóż pierwszą: ./reklama nowa <nazwa>'); return; }
  for (const wpis of kampanie) {
    let status = 'bez paczki';
    try { status = JSON.parse(fs.readFileSync(path.join(wpis.katalog, 'manifest.json'), 'utf8')).status; } catch { /* brak manifestu */ }
    console.log(`${wpis.grupa.padEnd(10)} ${wpis.nazwa.padEnd(44)} ${status}`);
  }
}

const TYPY_MIME = { '.html': 'text/html; charset=utf-8', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.zip': 'application/zip', '.wav': 'audio/wav' };

async function komendaPokaz(argument, flagi) {
  const k = await kampania(argument);
  if (!fs.existsSync(path.join(k.katalog, 'podglad/index.html'))) throw new Blad(`Kampania „${k.id}” nie ma jeszcze podglądu. Najpierw: ./reklama buduj ${k.id}`);
  // Serwujemy repo (logo marki leży poza folderem kampanii); obsługa Range jest potrzebna do przewijania filmów.
  const serwer = http.createServer(async (zadanie, odpowiedz) => {
    try {
      const sciezka = decodeURIComponent(new URL(zadanie.url, 'http://x').pathname);
      const plik = path.join(REPO, sciezka);
      if (!plik.startsWith(REPO)) { odpowiedz.writeHead(403).end(); return; }
      const dane = await fsp.stat(plik);
      if (dane.isDirectory()) { odpowiedz.writeHead(404).end(); return; }
      const naglowki = { 'Content-Type': TYPY_MIME[path.extname(plik).toLowerCase()] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
      const zakres = /^bytes=(\d*)-(\d*)$/.exec(zadanie.headers.range ?? '');
      if (zakres) {
        const od = zakres[1] ? Number(zakres[1]) : Math.max(0, dane.size - Number(zakres[2]));
        const doBajtu = zakres[1] && zakres[2] ? Math.min(Number(zakres[2]), dane.size - 1) : dane.size - 1;
        odpowiedz.writeHead(206, { ...naglowki, 'Content-Range': `bytes ${od}-${doBajtu}/${dane.size}`, 'Content-Length': doBajtu - od + 1 });
        fs.createReadStream(plik, { start: od, end: doBajtu }).pipe(odpowiedz);
      } else {
        odpowiedz.writeHead(200, { ...naglowki, 'Content-Length': dane.size });
        fs.createReadStream(plik).pipe(odpowiedz);
      }
    } catch { odpowiedz.writeHead(404).end(); }
  });
  const port = Number(flagi.port ?? 4173);
  await new Promise((gotowe, blad) => { serwer.once('error', blad); serwer.listen(port, '127.0.0.1', gotowe); }).catch((blad) => { throw new Blad(blad.code === 'EADDRINUSE' ? `Port ${port} jest zajęty. Podaj inny: --port 4174` : blad.message); });
  const adres = `http://127.0.0.1:${port}/${wzgledna(REPO, path.join(k.katalog, 'podglad/index.html'))}`;
  console.log(`Podgląd: ${adres}\nCtrl+C kończy serwer.`);
  if (!flagi['bez-otwierania']) spawn('open', [adres], { stdio: 'ignore', detached: true }).unref();
}

/** Klatki nagrań to pamięć podręczna na czas pracy nad kampanią; po decyzji Bartosza nie są już potrzebne. */
async function usunKlatki(k) {
  await fsp.rm(path.join(k.katalog, 'qa', 'klatki'), { recursive: true, force: true });
}

async function komendaAkceptuj(argument, flagi) {
  if (!argument || typeof flagi.cytat !== 'string') throw new Blad('Użycie: ./reklama akceptuj <kampania> --cytat "słowa Bartosza". Akceptację zapisujemy tylko po jego wyraźnej zgodzie.');
  const k = await kampania(argument);
  const manifest = await czytajManifest(k);
  if (!manifest) throw new Blad(`Kampania „${k.id}” nie ma paczki. Najpierw: ./reklama buduj ${k.id}`);
  if (manifest.status !== 'DO_AKCEPTACJI') throw new Blad(`Status paczki to ${manifest.status}; akceptować można tylko pełną paczkę DO_AKCEPTACJI.`);
  const doWyboru = k.filmy.filter((film) => film.sceny.some((scena) => scena.opcje?.length)).map((film) => film.plik);
  if (doWyboru.length) throw new Blad(`W filmach ${doWyboru.join(', ')} są sceny z opcjami nagrania do wyboru. Wpisz wybrane nagranie jako "material", usuń "opcje" i zbuduj paczkę ponownie.`);
  for (const plik of manifest.pliki) {
    if (sha256(await fsp.readFile(path.join(k.katalog, plik.plik))) !== plik.sha256) throw new Blad(`Plik ${plik.plik} różni się od zbudowanego. Zbuduj paczkę ponownie i pokaż ją jeszcze raz.`);
  }
  const nazwaZip = await dokumenty(k, manifest.pliki, 'ZAAKCEPTOWANE', null);
  const nowy = { ...manifest, status: 'ZAAKCEPTOWANE', akceptacja: { data: new Date().toISOString(), cytat: flagi.cytat } };
  await zapiszJson(path.join(k.katalog, 'manifest.json'), nowy);
  const zip = await spakuj(k, manifest.pliki);
  await zapiszJson(path.join(k.katalog, 'qa/zip.json'), zip);
  await zbudujPodglad(k, manifest.pliki, 'ZAAKCEPTOWANE', nazwaZip);
  await usunKlatki(k);
  // Od akceptacji gotowe pliki są częścią repo: dopisujemy wyjątek w .gitignore (tylko dla prawdziwych kampanii).
  if (k.katalog.startsWith(path.join(REPO, 'kampanie') + path.sep)) {
    const gitignore = path.join(REPO, '.gitignore');
    await fsp.writeFile(gitignore, wpuscDoGita(await fsp.readFile(gitignore, 'utf8'), k.id));
  }
  console.log(`Zapisano akceptację kampanii „${k.id}”. Paczka jest zamrożona; wgranie i publikacja nadal wymagają osobnej zgody Bartosza.`);
}

async function komendaWystaw(argument) {
  if (!argument) throw new Blad('Użycie: ./reklama wystaw <kampania>');
  const k = await kampania(argument);
  const manifest = await czytajManifest(k);
  if (!manifest) throw new Blad(`Kampania „${k.id}” nie ma paczki. Najpierw: ./reklama buduj ${k.id}`);
  const ile = await wystawDoObejrzenia(k, manifest.pliki, undefined, await planszeWyboru(k));
  console.log(`W ${pokaz(DO_OBEJRZENIA)}/ jest teraz ${ile} plików kampanii „${k.id}” (status ${manifest.status}).`);
}

async function komendaOdrzuc(argument, flagi) {
  if (!argument || typeof flagi.powod !== 'string') throw new Blad('Użycie: ./reklama odrzuc <kampania> --powod "dlaczego, najlepiej słowami Bartosza"');
  const k = await kampania(argument);
  const manifest = await czytajManifest(k);
  if (!manifest) throw new Blad(`Kampania „${k.id}” nie ma paczki, więc nie ma czego odrzucać.`);
  if (manifest.status === 'ZAAKCEPTOWANE') throw new Blad('Ta paczka jest zaakceptowana. Odrzucenie zaakceptowanej paczki wymaga decyzji Bartosza i ręcznej zmiany manifestu.');
  await zapiszJson(path.join(k.katalog, 'manifest.json'), { ...manifest, status: 'ODRZUCONE', odrzucenie: { data: new Date().toISOString(), powod: flagi.powod } });
  await usunKlatki(k);
  console.log(`Kampania „${k.id}” oznaczona jako odrzucona. Lekcję z odrzucenia dopisz do zasady/lekcje.md.`);
}

async function komendaGitKontrola() {
  const { tekst } = await uruchom('git', ['-C', REPO, 'add', '-n', '.']);
  const { tekst: sledzone } = await uruchom('git', ['-C', REPO, 'ls-files']);
  const pliki = [...new Set([...tekst.split('\n').map((linia) => /^add '(.*)'$/.exec(linia)?.[1]), ...sledzone.split('\n')].filter(Boolean))];
  const rozmiary = pliki.map((plik) => { try { return { plik, bajty: fs.statSync(path.join(REPO, plik)).size }; } catch { return { plik, bajty: 0 }; } }).sort((a, b) => b.bajty - a.bajty);
  const suma = rozmiary.reduce((s, p) => s + p.bajty, 0);
  console.log(`W Git znalazłoby się ${pliki.length} plików, razem ${mb(suma)}.`);
  const czekajace = listaKampanii().filter((wpis) => wpis.grupa === 'kampanie' && fs.existsSync(path.join(wpis.katalog, 'DO_WGRANIA')) && !pliki.some((plik) => plik.startsWith(`kampanie/${wpis.nazwa}/DO_WGRANIA/`)));
  if (czekajace.length) console.log(`Gotowe pliki poza Git do czasu akceptacji: ${czekajace.map((wpis) => wpis.nazwa).join(', ')}.`);
  console.log('Największe:');
  for (const p of rozmiary.slice(0, 8)) console.log(`  ${mb(p.bajty).padStart(9)}  ${p.plik}`);
  const duze = rozmiary.filter((p) => p.bajty > 50 * 1048576);
  const podejrzane = pliki.filter((plik) => /(^|\/)\.env|\.env$|\.pem$|\.p8$|\.p12$|\.jks$|\.keystore$|\.local\.json$|storage-?state|cookies|credentials|secret|token|password|\.har$|\.trace\.zip$/i.test(plik));
  if (duze.length) { console.log(`\n✗ Pliki powyżej 50 MB (GitHub odrzuca powyżej 100 MB):\n${duze.map((p) => `  ${mb(p.bajty)}  ${p.plik}`).join('\n')}`); process.exitCode = 1; }
  if (podejrzane.length) { console.log(`\n✗ Nazwy wyglądające na dane logowania lub sesje — sprawdź przed commitem:\n${podejrzane.map((p) => `  ${p}`).join('\n')}`); process.exitCode = 1; }
  if (!duze.length && !podejrzane.length) console.log('\nBez plików powyżej 50 MB i bez podejrzanych nazw.');
}

const [komenda, ...reszta] = process.argv.slice(2);
const { pozycyjne, flagi } = argumenty(reszta);
try {
  if (!komenda || komenda === 'pomoc' || komenda === '--help' || komenda === '-h') console.log(POMOC);
  else if (komenda === 'nowa') await komendaNowa(pozycyjne, flagi);
  else if (komenda === 'lista') await komendaLista();
  else if (komenda === 'kadr') await komendaKadr(pozycyjne);
  else if (komenda === 'sprawdz') await komendaSprawdz(pozycyjne[0]);
  else if (komenda === 'szkic') await komendaSzkic(pozycyjne[0]);
  else if (komenda === 'buduj') await komendaBuduj(pozycyjne[0], flagi);
  else if (komenda === 'pokaz') await komendaPokaz(pozycyjne[0], flagi);
  else if (komenda === 'akceptuj') await komendaAkceptuj(pozycyjne[0], flagi);
  else if (komenda === 'odrzuc') await komendaOdrzuc(pozycyjne[0], flagi);
  else if (komenda === 'wystaw') await komendaWystaw(pozycyjne[0]);
  else if (komenda === 'git-kontrola') await komendaGitKontrola();
  else if (komenda === '_film') await komendaFilm(pozycyjne);
  else throw new Blad(`Nieznana komenda „${komenda}”.\n\n${POMOC}`);
} catch (blad) {
  if (blad instanceof Blad) { console.error(`\n${blad.message}`); process.exitCode = 1; } else throw blad;
}
