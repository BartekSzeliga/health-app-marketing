import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const NARZEDZIE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(NARZEDZIE, '..');
// Katalog nadrzędny z repo produktu (health-app-mobile, health-app-frontend, health-app).
export const PRODUKT = path.resolve(REPO, '..');

/** Błąd zrozumiały dla zamawiającego: CLI pokazuje sam komunikat, bez stosu. */
export class Blad extends Error {}

export const sha256 = (bufor) => crypto.createHash('sha256').update(bufor).digest('hex');
export const wzgledna = (od, plik) => path.relative(od, plik).split(path.sep).join('/');

export async function zapiszJson(plik, dane) {
  await fsp.mkdir(path.dirname(plik), { recursive: true });
  await fsp.writeFile(plik, `${JSON.stringify(dane, null, 2)}\n`);
}

export async function czytajJson(plik) {
  try {
    return JSON.parse(await fsp.readFile(plik, 'utf8'));
  } catch (blad) {
    if (blad.code === 'ENOENT') throw new Blad(`Brak pliku: ${plik}`);
    throw new Blad(`Niepoprawny JSON w ${plik}: ${blad.message}`);
  }
}

export const ffmpeg = () => require('ffmpeg-static');
export const ffprobe = () => require('@ffprobe-installer/ffprobe').path;

/** Uruchamia program i zwraca stdout/stderr; kod różny od zera kończy się błędem z końcówką stderr. */
export async function uruchom(program, argumenty, { wejscie } = {}) {
  const proces = spawn(program, argumenty, { stdio: [wejscie ? 'pipe' : 'ignore', 'pipe', 'pipe'] });
  const wyjscie = [];
  let bledy = '';
  proces.stdout.on('data', (dane) => wyjscie.push(dane));
  proces.stderr.on('data', (dane) => { bledy += dane; });
  if (wejscie) proces.stdin.end(wejscie);
  const [kod] = await once(proces, 'close');
  if (kod) throw new Error(`${path.basename(program)} zakończył się kodem ${kod}: ${bledy.slice(-3000)}`);
  return { tekst: Buffer.concat(wyjscie).toString(), bledy };
}

/** Folder kampanii: ścieżka, nazwa w kampanie/ albo nazwa przykładu narzędzia. */
export function znajdzKampanie(argument) {
  const kandydaci = argument
    ? [path.resolve(argument), path.join(REPO, 'kampanie', argument), path.join(NARZEDZIE, 'przyklady', argument)]
    : [process.cwd()];
  for (const katalog of kandydaci) if (fs.existsSync(path.join(katalog, 'kampania.json'))) return katalog;
  throw new Blad(argument
    ? `Nie ma kampanii „${argument}”. Dostępne: ./reklama lista`
    : 'Podaj nazwę kampanii albo uruchom polecenie w jej folderze. Dostępne: ./reklama lista');
}

export function listaKampanii() {
  const wynik = [];
  for (const [grupa, katalog] of [['kampanie', path.join(REPO, 'kampanie')], ['przykłady', path.join(NARZEDZIE, 'przyklady')]]) {
    if (!fs.existsSync(katalog)) continue;
    for (const nazwa of fs.readdirSync(katalog).sort()) {
      if (fs.existsSync(path.join(katalog, nazwa, 'kampania.json'))) wynik.push({ grupa, nazwa, katalog: path.join(katalog, nazwa) });
    }
  }
  return wynik;
}
