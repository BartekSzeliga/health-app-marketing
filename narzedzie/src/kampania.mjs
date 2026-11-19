import fs from 'node:fs';
import path from 'node:path';
import { Blad, czytajJson } from './wspolne.mjs';
import { wczytajMotyw } from './motyw.mjs';

export const UKLADY = {
  telefon: ['ekran'],
  'telefon+detal': ['ekran', 'detal'],
  panel: ['panel'],
  'panel+telefon': ['panel', 'ekran'],
  'dwa-telefony': ['ekran', 'ekran2'],
  // Rząd trzech telefonów pod tekstem: ekran na środku z przodu, ekran2 z lewej, ekran3 z prawej.
  'trzy-telefony': ['ekran', 'ekran2', 'ekran3'],
  // Zdjęcie na całe tło (kadr z licencjonowanego nagrania lub fotografia), opcjonalnie z telefonem jako dowodem.
  zdjecie: ['zdjecie'],
  'zdjecie+telefon': ['zdjecie', 'ekran'],
};
export const FORMATY = { '1x1': [1440, 1440], '4x5': [1440, 1800], '9x16': [1440, 2560] };
const TYPY_SCEN = ['hook', 'material', 'ekran', 'detal', 'cta'];
const NAGRANIA = /\.(mp4|mov|m4v|webm)$/i;
const CTA_DOMYSLNE = { plansza: 'Pobierz Diecik', podpis: 'iOS i Android', przycisk: 'Zainstaluj teraz' };

/**
 * Wczytuje kampania.json, uzupełnia wartości domyślne i sprawdza budowę pliku.
 * Błędy budowy zbiera razem, żeby poprawić je jednym podejściem.
 */
export async function wczytajKampanie(katalog) {
  const surowa = await czytajJson(path.join(katalog, 'kampania.json'));
  const bledy = [];
  const blad = (gdzie, tresc) => bledy.push(`${gdzie}: ${tresc}`);
  const tekst = (wartosc) => typeof wartosc === 'string' && wartosc.trim().length > 0;
  const linie = (wartosc, gdzie, { wymagane = true } = {}) => {
    if (wartosc === undefined || wartosc === null) { if (wymagane) blad(gdzie, 'brak'); return []; }
    const lista = Array.isArray(wartosc) ? wartosc : [wartosc];
    if (!lista.length || !lista.every(tekst)) blad(gdzie, 'ma być tekstem albo listą niepustych linii');
    return lista;
  };

  for (const pole of ['nazwa', 'data', 'odbiorca']) if (!tekst(surowa[pole])) blad(pole, 'brak');
  if (tekst(surowa.data) && !/^\d{4}-\d{2}-\d{2}$/.test(surowa.data)) blad('data', 'format RRRR-MM-DD');
  if (tekst(surowa.odbiorca) && !['b2c', 'specjalista', 'firma'].includes(surowa.odbiorca)) blad('odbiorca', 'dozwolone: b2c, specjalista, firma');
  const typ = surowa.typ ?? 'reklama';
  if (!['reklama', 'post'].includes(typ)) blad('typ', 'dozwolone: reklama, post');

  // Źródła: autentyczne ekrany i nagrania.
  const zrodla = {};
  for (const [klucz, wpis] of Object.entries(surowa.zrodla ?? {})) {
    const dane = typeof wpis === 'string' ? { plik: wpis } : wpis;
    if (!tekst(dane?.plik)) { blad(`zrodla.${klucz}`, 'brak pola "plik"'); continue; }
    const plik = path.resolve(katalog, dane.plik);
    if (!fs.existsSync(plik)) blad(`zrodla.${klucz}`, `nie ma pliku ${dane.plik}`);
    zrodla[klucz] = { klucz, plik, sciezka: dane.plik, opis: dane.opis ?? '', rodzaj: NAGRANIA.test(plik) ? 'nagranie' : 'obraz', autor: dane.autor ?? null, strona: dane.strona ?? null, licencja: dane.licencja ?? null };
  }
  if (!Object.keys(zrodla).length) blad('zrodla', 'kampania nie ma żadnego źródła (ekranu ani nagrania)');
  const obraz = (klucz, gdzie) => {
    if (!tekst(klucz)) return blad(gdzie, 'brak');
    if (!zrodla[klucz]) return blad(gdzie, `nie ma źródła „${klucz}” w sekcji zrodla`);
    if (zrodla[klucz].rodzaj !== 'obraz') blad(gdzie, `źródło „${klucz}” jest nagraniem, a tu potrzebny jest zrzut ekranu`);
  };

  const kadry = {};
  for (const [klucz, wpis] of Object.entries(surowa.kadry ?? {})) {
    const gdzie = `kadry.${klucz}`;
    obraz(wpis?.zrodlo, `${gdzie}.zrodlo`);
    for (const pole of ['x', 'y', 'szer', 'wys']) if (!Number.isFinite(wpis?.[pole]) || wpis[pole] < 0) blad(`${gdzie}.${pole}`, 'ma być liczbą nieujemną');
    kadry[klucz] = { klucz, ...wpis };
  }
  const kadr = (klucz, gdzie) => { if (!tekst(klucz)) return blad(gdzie, 'brak'); if (!kadry[klucz]) blad(gdzie, `nie ma kadru „${klucz}” w sekcji kadry`); };
  const nagranie = (klucz, gdzie) => { if (!zrodla[klucz] || zrodla[klucz].rodzaj !== 'nagranie') blad(gdzie, 'ma wskazywać nagranie z sekcji zrodla'); };
  // Blok ceny: { przed: "od", kwota: "600 zł", po: "miesięcznie", dopisek: "brutto" }.
  const cena = (wpis, gdzie) => {
    if (wpis === undefined) return;
    if (!tekst(wpis?.kwota)) blad(`${gdzie}.kwota`, 'brak kwoty, np. "600 zł"');
    for (const pole of ['przed', 'po', 'dopisek']) if (wpis?.[pole] !== undefined && !tekst(wpis[pole])) blad(`${gdzie}.${pole}`, 'ma być niepustym tekstem');
  };

  // Wspólna część tematu grafiki i karty karuzeli.
  const plansza = (wpis, gdzie) => {
    const uklad = wpis.uklad ?? (wpis.detal ? 'telefon+detal' : wpis.panel ? (wpis.ekran ? 'panel+telefon' : 'panel') : 'telefon');
    if (!UKLADY[uklad]) blad(`${gdzie}.uklad`, `dozwolone: ${Object.keys(UKLADY).join(', ')}`);
    else for (const pole of UKLADY[uklad]) (pole === 'detal' ? kadr : obraz)(wpis[pole], `${gdzie}.${pole}`);
    if (!tekst(wpis.id) || !/^[A-Za-z0-9-]+$/.test(wpis.id ?? '')) blad(`${gdzie}.id`, 'krótki identyfikator z liter, cyfr i myślników (trafia do nazwy pliku)');
    cena(wpis.cena, `${gdzie}.cena`);
    return {
      ...wpis, uklad,
      naglowek: linie(wpis.naglowek, `${gdzie}.naglowek`),
      tresc: linie(wpis.tresc, `${gdzie}.tresc`, { wymagane: false }),
    };
  };

  const filmy = [];
  const tematy = (surowa.tematy ?? []).map((wpis, numer) => {
    const gdzie = `tematy[${numer}]`;
    const temat = plansza(wpis, gdzie);
    temat.formaty = wpis.formaty ?? ['1x1', '4x5'];
    for (const format of temat.formaty) if (!FORMATY[format]) blad(`${gdzie}.formaty`, `nieznany format „${format}”; dozwolone: ${Object.keys(FORMATY).join(', ')}`);
    temat.dowody = wpis.dowody ?? [];
    temat.dowody.forEach((dowod, i) => { if (!tekst(dowod.twierdzenie)) blad(`${gdzie}.dowody[${i}].twierdzenie`, 'brak'); });
    if (wpis.film) {
      const film = wpis.film;
      const g = `${gdzie}.film`;
      if (!tekst(film.plik) || !/^[A-Za-z0-9-]+$/.test(film.plik ?? '')) blad(`${g}.plik`, 'nazwa pliku bez rozszerzenia, z liter, cyfr i myślników');
      if (!Array.isArray(film.sceny) || !film.sceny.length) blad(`${g}.sceny`, 'brak scen');
      let poczatek = 0;
      const sceny = (film.sceny ?? []).map((scena, i) => {
        const s = `${g}.sceny[${i}]`;
        if (!TYPY_SCEN.includes(scena.typ)) blad(`${s}.typ`, `dozwolone: ${TYPY_SCEN.join(', ')}`);
        if (!Number.isFinite(scena.czas) || scena.czas <= 0) blad(`${s}.czas`, 'czas sceny w sekundach');
        if (scena.typ === 'hook') { linie(scena.naglowek, `${s}.naglowek`); obraz(scena.ekran, `${s}.ekran`); }
        if (scena.typ === 'material') { linie(scena.naglowek, `${s}.naglowek`, { wymagane: false }); if (scena.pozycja && !['gora', 'dol'].includes(scena.pozycja)) blad(`${s}.pozycja`, 'dozwolone: gora, dol'); }
        if (scena.typ === 'ekran') { if (!tekst(scena.tytul)) blad(`${s}.tytul`, 'brak'); obraz(scena.ekran, `${s}.ekran`); }
        if (scena.typ === 'detal') { if (!tekst(scena.tytul)) blad(`${s}.tytul`, 'brak'); kadr(scena.kadr, `${s}.kadr`); }
        if (scena.typ === 'cta') { linie(scena.haslo, `${s}.haslo`); if (scena.ekran !== undefined) obraz(scena.ekran, `${s}.ekran`); cena(scena.cena, `${s}.cena`); }
        // Nagranie na całe tło (scena material) albo rozmyte tło pod telefonem (ekran, detal).
        if (scena.typ === 'material' || scena.material !== undefined) {
          nagranie(scena.material, `${s}.material`);
          if (scena.od !== undefined && !(Number.isFinite(scena.od) && scena.od >= 0)) blad(`${s}.od`, 'sekunda nagrania, od której zaczyna się scena');
          const kadrNagrania = (wpis, gdzie) => { if (wpis !== undefined && !['x', 'y', 'szer', 'wys'].every((pole) => Number.isInteger(wpis?.[pole]) && wpis[pole] >= 0)) blad(gdzie, 'x, y, szer, wys jako liczby całkowite w pikselach nagrania'); };
          kadrNagrania(scena.kadrMaterialu, `${s}.kadrMaterialu`);
          // `opcje`: inne nagrania do tej samej sceny, pokazywane Bartoszowi na planszy wyboru (A to nagranie użyte w filmie).
          if (scena.opcje !== undefined) {
            if (!Array.isArray(scena.opcje) || !scena.opcje.length) blad(`${s}.opcje`, 'lista wariantów nagrania, np. [{ "material": "laptopB", "od": 1 }]');
            else scena.opcje.forEach((opcja, j) => {
              nagranie(opcja?.material, `${s}.opcje[${j}].material`);
              if (opcja?.od !== undefined && !(Number.isFinite(opcja.od) && opcja.od >= 0)) blad(`${s}.opcje[${j}].od`, 'sekunda nagrania, od której zaczyna się scena');
              kadrNagrania(opcja?.kadrMaterialu, `${s}.opcje[${j}].kadrMaterialu`);
            });
          }
        }
        const klipy = (scena.klipy ?? []).map((klip, j) => {
          const c = `${s}.klipy[${j}]`;
          if (!zrodla[klip.zrodlo] || zrodla[klip.zrodlo].rodzaj !== 'nagranie') blad(`${c}.zrodlo`, 'ma wskazywać nagranie z sekcji zrodla');
          if (!Number.isFinite(klip.od) || klip.od < 0) blad(`${c}.od`, 'sekunda nagrania, od której zaczyna się ujęcie');
          const start = klip.start ?? 0;
          const koniec = klip.koniec ?? scena.czas;
          if (!(start >= 0 && koniec > start && koniec <= scena.czas + 1e-6)) blad(c, 'start/koniec muszą mieścić się w czasie sceny');
          if (klip.tempo !== undefined && klip.tempo !== 1) blad(`${c}.tempo`, 'nagrania aplikacji pokazujemy wyłącznie w tempie 1×');
          if (klip.ujecie && !['pelny', 'detal'].includes(klip.ujecie)) blad(`${c}.ujecie`, 'dozwolone: pelny, detal');
          if (klip.ujecie === 'detal') kadr(klip.kadr, `${c}.kadr`);
          return { ...klip, start, koniec, ujecie: klip.ujecie ?? (scena.typ === 'detal' ? 'detal' : 'pelny') };
        });
        // Granice scen i ujęć leżą dokładnie na siatce klatek (30 kl./s), bez błędu sumowania ułamków.
        const naSiatke = (sekundy) => Math.round(sekundy * 30) / 30;
        const koniecSceny = naSiatke(poczatek + (scena.czas || 0));
        const wynik = { ...scena, klipy: klipy.map((klip) => ({ ...klip, start: naSiatke(klip.start), koniec: naSiatke(klip.koniec) })), poczatek, koniec: koniecSceny };
        poczatek = koniecSceny;
        return wynik;
      });
      if (sceny.length && sceny.at(-1).typ !== 'cta') blad(`${g}.sceny`, 'ostatnia scena ma być typu cta');
      const dlugosc = Math.round(poczatek * 1000) / 1000;
      if (!Number.isInteger(dlugosc * 30)) blad(`${g}.sceny`, `suma czasów (${dlugosc} s) musi dawać całą liczbę klatek przy 30 fps`);
      if (dlugosc < 6 || dlugosc > 60) blad(`${g}.sceny`, `film ma ${dlugosc} s; dozwolone 6–60 s`);
      temat.film = { ...film, sceny, dlugosc, temat: temat.id, kadr45: Boolean(film.kadr45) };
      filmy.push(temat.film);
    }
    return temat;
  });
  if (!tematy.length) blad('tematy', 'kampania nie ma żadnego tematu');
  const powtorzone = tematy.map((t) => t.id).filter((id, i, wszystkie) => wszystkie.indexOf(id) !== i);
  if (powtorzone.length) blad('tematy', `powtórzone id: ${[...new Set(powtorzone)].join(', ')}`);

  let karuzela = null;
  if (surowa.karuzela) {
    const format = surowa.karuzela.format ?? '1x1';
    if (!['1x1', '4x5'].includes(format)) blad('karuzela.format', 'dozwolone: 1x1, 4x5');
    const karty = (surowa.karuzela.karty ?? []).map((wpis, numer) => plansza(wpis, `karuzela.karty[${numer}]`));
    if (karty.length < 2 || karty.length > 10) blad('karuzela.karty', 'karuzela ma mieć od 2 do 10 kart');
    karuzela = { ...surowa.karuzela, format, karty };
  }

  if (bledy.length) throw new Blad(`Plik kampania.json wymaga poprawek (${bledy.length}):\n${bledy.map((b) => `  - ${b}`).join('\n')}`);

  return {
    katalog, typ,
    id: path.basename(katalog),
    nazwa: surowa.nazwa, data: surowa.data, odbiorca: surowa.odbiorca, cel: surowa.cel ?? null,
    motyw: wczytajMotyw(surowa.motyw, katalog),
    cta: { ...CTA_DOMYSLNE, ...(surowa.cta ?? {}) },
    ujawnienie: surowa.ujawnienie === undefined ? 'Dane przykładowe' : surowa.ujawnienie,
    linki: surowa.linki ?? {},
    uwagi: surowa.uwagi ?? [],
    pochodzenie: surowa.pochodzenie ?? null,
    zrodla, kadry, tematy, karuzela, filmy,
  };
}
