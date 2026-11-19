import fs from 'node:fs';
import path from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { Blad, REPO } from './wspolne.mjs';

// Zaakceptowany styl reklam Diecik (paczki 18.10 i 21.10.2026). Wartości są
// przeniesione 1:1 z tamtych rendererów; ich zmiana zmienia wygląd wzorca.
export const FONTY = { szeryf: 'Baskerville', bezszeryf: 'Avenir Next' };

export const DIECIK = {
  id: 'diecik',
  nazwa: 'Diecik',
  logo: path.join(REPO, 'marka/logo/diecik-icon.png'),
  kolory: {
    pine: '#153630', cream: '#F6F5EF', lime: '#DAF2A5', mint: '#E3F0DD', ink: '#18372F', muted: '#53645A',
    przycisk: '#DAF2A5', naPrzycisku: '#18372F', strzalka: '#153630',
    // grafiki
    poswiata: 'rgba(112,156,112,.22)', poswiataKoniec: 'rgba(112,156,112,0)', okregi: 'rgba(218,242,165,.11)',
    kropka: '#D6DDD1', ramkaTelefonu: '#071B16', obrysTelefonu: 'rgba(227,240,221,.5)',
    // film
    filmJasne: ['#E3ECD5', '#ECF0E3', '#F6F5EF'], filmCiemne: ['#2F6047', '#183F33', '#102C24'],
    filmOkregiJasne: 'rgba(21,54,48,.10)', filmOkregiCiemne: 'rgba(218,242,165,.13)',
    filmRamkaTelefonu: '#102C24', filmObrysTelefonu: 'rgba(213,231,218,.65)',
  },
};

const HEX = /^#([0-9a-f]{6})$/i;
function rgb(hex) {
  const dopasowanie = HEX.exec(hex);
  if (!dopasowanie) throw new Blad(`Kolor motywu musi mieć postać #RRGGBB, a jest: ${hex}`);
  const liczba = parseInt(dopasowanie[1], 16);
  return [liczba >> 16, (liczba >> 8) & 255, liczba & 255];
}
const hex = (kanaly) => `#${kanaly.map((kanal) => Math.round(Math.min(255, Math.max(0, kanal))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
export const mieszaj = (a, b, ile) => { const [x, y] = [rgb(a), rgb(b)]; return hex(x.map((kanal, i) => kanal + (y[i] - kanal) * ile)); };
export const rgba = (kolor, alfa) => `rgba(${rgb(kolor).join(',')},${alfa})`;

function logoKlienta(plik, marka) {
  const kandydaci = [marka.logo, 'logo.png', 'logo-1024.png', 'logo-512.png'].filter(Boolean).map((nazwa) => path.resolve(path.dirname(plik), nazwa));
  const logo = kandydaci.find((kandydat) => fs.existsSync(kandydat));
  if (!logo) throw new Blad(`Motyw ${plik} nie ma pliku logo (szukano: ${kandydaci.map((k) => path.basename(k)).join(', ')}).`);
  return logo;
}

/**
 * Motyw klienta firmowego z istniejącego formatu brand.json aplikacji firmowej
 * (presentation-brands/<klient>/brand.json, sprzedaz/<klient>/marka/brand.json).
 */
export function motywZBrandJson(plik) {
  if (!fs.existsSync(plik)) throw new Blad(`Brak pliku motywu: ${plik}`);
  const marka = JSON.parse(fs.readFileSync(plik, 'utf8'));
  const jasne = marka.colors?.light;
  const ciemneTlo = marka.navigation?.background;
  if (!jasne?.primary || !jasne?.primaryContainer || !ciemneTlo) throw new Blad(`Plik ${plik} nie wygląda na brand.json aplikacji firmowej (colors.light, navigation.background).`);
  const pine = ciemneTlo;
  const lime = jasne.primaryContainer;
  const ink = jasne.onPrimaryContainer ?? pine;
  const cream = '#F7F6F3';
  return {
    id: marka.slug ?? path.basename(path.dirname(plik)),
    nazwa: marka.displayName ?? marka.slug,
    logo: logoKlienta(plik, marka),
    kolory: {
      pine, cream, lime, ink,
      // Na jasnym tle blady kolor kontenera znika, więc przycisk dostaje pełny kolor marki klienta.
      przycisk: jasne.primary, naPrzycisku: jasne.onPrimary ?? '#FFFFFF', strzalka: jasne.onPrimary ?? '#FFFFFF',
      mint: mieszaj(lime, '#FFFFFF', 0.35),
      muted: mieszaj(ink, cream, 0.38),
      poswiata: rgba(mieszaj(pine, jasne.primary, 0.55), 0.3), poswiataKoniec: rgba(mieszaj(pine, jasne.primary, 0.55), 0), okregi: rgba(lime, 0.11),
      kropka: mieszaj(cream, ink, 0.14), ramkaTelefonu: mieszaj(pine, '#000000', 0.45), obrysTelefonu: rgba(mieszaj(lime, '#FFFFFF', 0.4), 0.5),
      filmJasne: [mieszaj(cream, lime, 0.55), mieszaj(cream, lime, 0.3), cream],
      filmCiemne: [mieszaj(pine, jasne.primary, 0.42), mieszaj(pine, jasne.primary, 0.14), mieszaj(pine, '#000000', 0.18)],
      filmOkregiJasne: rgba(pine, 0.1), filmOkregiCiemne: rgba(lime, 0.13),
      filmRamkaTelefonu: mieszaj(pine, '#000000', 0.18), filmObrysTelefonu: rgba(mieszaj(lime, '#FFFFFF', 0.4), 0.65),
    },
  };
}

/** "diecik" albo ścieżka do brand.json (względem folderu kampanii lub repo). */
export function wczytajMotyw(wartosc, katalogKampanii) {
  if (!wartosc || wartosc === 'diecik') return DIECIK;
  if (typeof wartosc !== 'string') throw new Blad('Pole "motyw" to "diecik" albo ścieżka do brand.json klienta.');
  const kandydaci = [path.resolve(katalogKampanii, wartosc), path.resolve(REPO, wartosc), path.resolve(REPO, '..', wartosc)];
  const plik = kandydaci.find((kandydat) => fs.existsSync(kandydat));
  if (!plik) throw new Blad(`Nie znaleziono motywu „${wartosc}” (szukano względem kampanii, repo i katalogu projektów).`);
  return motywZBrandJson(plik);
}

export function wymagajFontow() {
  for (const font of Object.values(FONTY)) {
    if (!GlobalFonts.has(font)) throw new Blad(`Brak fontu „${font}”. Narzędzie korzysta z fontów systemowych macOS (Avenir Next, Baskerville).`);
  }
}
