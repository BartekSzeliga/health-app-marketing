import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { Blad, REPO, czytajJson, sha256, uruchom, zapiszJson } from './wspolne.mjs';

/** Jedyny folder, do którego Bartosz zagląda, żeby ocenić pracę: same grafiki i filmy ostatniej paczki. */
export const DO_OBEJRZENIA = path.join(REPO, 'DO_OBEJRZENIA');
const WIZUALNE = new Set(['.jpg', '.jpeg', '.png', '.mp4', '.mov']);

const ZNACZNIK_ZAAKCEPTOWANYCH = '# zaakceptowane paczki kampanii:';

/**
 * Zwraca treść .gitignore z dopisaną zgodą na gotowe pliki zaakceptowanej kampanii.
 * Niezaakceptowane paczki zostają poza Git, bo każda przebudowa filmów powiększałaby historię repo.
 */
export function wpuscDoGita(gitignore, idKampanii) {
  const linia = `!/kampanie/${idKampanii}/DO_WGRANIA/`;
  if (gitignore.split('\n').includes(linia)) return gitignore;
  if (!gitignore.includes(ZNACZNIK_ZAAKCEPTOWANYCH)) return `${gitignore.replace(/\n*$/, '\n')}${linia}\n`;
  return gitignore.replace(ZNACZNIK_ZAAKCEPTOWANYCH, `${ZNACZNIK_ZAAKCEPTOWANYCH}\n${linia}`);
}

/** Plansze wyboru przygotowane przy ostatnim budowaniu kampanii. */
export async function planszeWyboru(k) {
  const katalog = path.join(k.katalog, 'qa', 'opcje');
  try { return (await fsp.readdir(katalog)).filter((nazwa) => nazwa.endsWith('.jpg')).sort().map((nazwa) => path.join(katalog, nazwa)); } catch { return []; }
}


/**
 * Zastępuje zawartość folderu do obejrzenia grafikami i filmami podanej paczki.
 * Usuwa tylko pliki wizualne z samego folderu; podfolderów i innych plików nie rusza.
 */
export async function wystawDoObejrzenia(k, pliki, katalog = DO_OBEJRZENIA, plansze = []) {
  await fsp.mkdir(katalog, { recursive: true });
  for (const wpis of await fsp.readdir(katalog, { withFileTypes: true })) {
    if (wpis.isFile() && WIZUALNE.has(path.extname(wpis.name).toLowerCase())) await fsp.rm(path.join(katalog, wpis.name));
  }
  for (const plik of pliki) {
    // Klon APFS nie zajmuje dodatkowego miejsca; na innym systemie plików powstaje zwykła kopia.
    await fsp.copyFile(path.join(k.katalog, 'DO_WGRANIA', plik.nazwa), path.join(katalog, plik.nazwa), fs.constants.COPYFILE_FICLONE);
  }
  // Plansze wyboru (np. opcje nagrania do sceny) leżą obok gotowych plików, bo Bartosz decyduje, patrząc na jedno miejsce.
  for (const plansza of plansze) await fsp.copyFile(plansza, path.join(katalog, path.basename(plansza)), fs.constants.COPYFILE_FICLONE);
  return pliki.length + plansze.length;
}

export const plikManifestu = (k) => path.join(k.katalog, 'manifest.json');

export async function czytajManifest(k) {
  try { return await czytajJson(plikManifestu(k)); } catch { return null; }
}

/** manifest.json: pełny opis paczki z sumami kontrolnymi i wynikami kontroli. */
export async function zapiszManifest(k, { pliki, status, kontrola }) {
  const manifest = {
    kampania: k.nazwa, id: k.id, data: k.data, typ: k.typ, odbiorca: k.odbiorca, cel: k.cel, motyw: k.motyw.id,
    status, utworzono: new Date().toISOString(),
    wgraneDoMeta: false, opublikowane: false,
    liczby: { filmy: pliki.filter((p) => p.rodzaj === 'film').length, grafiki: pliki.filter((p) => p.rodzaj === 'grafika').length, kartyKaruzeli: pliki.filter((p) => p.rodzaj === 'karuzela').length },
    pliki,
    kolejnoscKaruzeli: pliki.filter((p) => p.rodzaj === 'karuzela').map((p) => p.nazwa),
    teksty: 'TEKSTY-REKLAM.txt', zrodla: 'ZRODLA.txt',
    autentycznyInterfejs: true, daneDemonstracyjne: true, interfejsRetuszowany: false, klikniecieSymulowane: false,
    kontrola: { technicznaZaliczona: pliki.every((p) => p.zaliczone), uwagi: kontrola.uwagi, informacje: kontrola.informacje, ocenaWizualna: 'DO_OCENY_BARTOSZA' },
  };
  await zapiszJson(plikManifestu(k), manifest);
  return manifest;
}

const DOS_CZAS = 0;
const DOS_DATA = ((2026 - 1980) << 9) | (1 << 5) | 1;

/** Minimalny zapis ZIP (deflate) — bez zależności, ze stałymi datami, więc ten sam wkład daje ten sam plik. */
export async function zapiszZip(plikZip, wpisy) {
  const czesci = [];
  const katalog = [];
  let pozycja = 0;
  for (const { nazwa, bufor } of wpisy) {
    const nazwaBajty = Buffer.from(nazwa, 'utf8');
    const skompresowany = zlib.deflateRawSync(bufor, { level: 6 });
    const crc = zlib.crc32(bufor);
    const naglowek = Buffer.alloc(30);
    naglowek.writeUInt32LE(0x04034b50, 0); naglowek.writeUInt16LE(20, 4); naglowek.writeUInt16LE(0x0800, 6); naglowek.writeUInt16LE(8, 8);
    naglowek.writeUInt16LE(DOS_CZAS, 10); naglowek.writeUInt16LE(DOS_DATA, 12); naglowek.writeUInt32LE(crc, 14);
    naglowek.writeUInt32LE(skompresowany.length, 18); naglowek.writeUInt32LE(bufor.length, 22); naglowek.writeUInt16LE(nazwaBajty.length, 26);
    const centralny = Buffer.alloc(46);
    centralny.writeUInt32LE(0x02014b50, 0); centralny.writeUInt16LE(20, 4); centralny.writeUInt16LE(20, 6); centralny.writeUInt16LE(0x0800, 8); centralny.writeUInt16LE(8, 10);
    centralny.writeUInt16LE(DOS_CZAS, 12); centralny.writeUInt16LE(DOS_DATA, 14); centralny.writeUInt32LE(crc, 16);
    centralny.writeUInt32LE(skompresowany.length, 20); centralny.writeUInt32LE(bufor.length, 24); centralny.writeUInt16LE(nazwaBajty.length, 28); centralny.writeUInt32LE(pozycja, 42);
    czesci.push(naglowek, nazwaBajty, skompresowany);
    katalog.push(centralny, nazwaBajty);
    pozycja += 30 + nazwaBajty.length + skompresowany.length;
  }
  const rozmiarKatalogu = katalog.reduce((suma, czesc) => suma + czesc.length, 0);
  const koniec = Buffer.alloc(22);
  koniec.writeUInt32LE(0x06054b50, 0); koniec.writeUInt16LE(wpisy.length, 8); koniec.writeUInt16LE(wpisy.length, 10); koniec.writeUInt32LE(rozmiarKatalogu, 12); koniec.writeUInt32LE(pozycja, 16);
  await fsp.writeFile(plikZip, Buffer.concat([...czesci, ...katalog, koniec]));
}

/** ZIP paczki: pliki do wgrania + teksty + opis + manifest; po zapisie sprawdzany przez `unzip -t`. */
export async function spakuj(k, pliki) {
  const nazwa = `${k.motyw.nazwa.replace(/[^A-Za-z0-9]+/g, '-')}-${k.id}.zip`;
  const plikZip = path.join(k.katalog, nazwa);
  const wpisy = [];
  for (const plik of pliki) {
    const bufor = await fsp.readFile(path.join(k.katalog, plik.plik));
    if (sha256(bufor) !== plik.sha256) throw new Blad(`Plik ${plik.plik} zmienił się po kontroli — zbuduj paczkę ponownie.`);
    wpisy.push({ nazwa: plik.plik, bufor });
  }
  for (const dodatkowy of ['README.md', 'TEKSTY-REKLAM.txt', 'ZRODLA.txt', 'manifest.json']) wpisy.push({ nazwa: dodatkowy, bufor: await fsp.readFile(path.join(k.katalog, dodatkowy)) });
  await zapiszZip(plikZip, wpisy);
  await uruchom('/usr/bin/unzip', ['-tq', plikZip]);
  const bufor = await fsp.readFile(plikZip);
  return { plik: nazwa, bajty: bufor.length, sha256: sha256(bufor), wpisow: wpisy.length };
}
