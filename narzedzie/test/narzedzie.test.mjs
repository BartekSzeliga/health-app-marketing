// Testy narzędzia: budowa pliku kampanii, kontrola treści, zgodność z
// zaakceptowanym wzorcem, muzyka i paczka. Uruchomienie: npm test (w narzedzie/).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { NARZEDZIE, REPO, sha256 } from '../src/wspolne.mjs';
import { wczytajKampanie } from '../src/kampania.mjs';
import { sprawdzKampanie } from '../src/kontrola.mjs';
import { renderujWszystkie } from '../src/grafika.mjs';
import { planszaOpcji, przygotujFilm, stempleScen, storyboard } from '../src/film.mjs';
import { PRESETY, zloz } from '../src/muzyka.mjs';
import { zapiszZip } from '../src/paczka.mjs';
import { porownaj } from './porownanie.mjs';

const przyklad = (nazwa) => path.join(NARZEDZIE, 'przyklady', nazwa);
const tymczasowe = [];
test.after(async () => { for (const katalog of tymczasowe) await fsp.rm(katalog, { recursive: true, force: true }); });

/** Kopia przykładu „post” w katalogu tymczasowym z podmienioną definicją. */
async function kampaniaTestowa(zmien) {
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  await fsp.cp(path.join(przyklad('przyklad-post'), 'zrodla'), path.join(katalog, 'zrodla'), { recursive: true });
  const definicja = JSON.parse(await fsp.readFile(path.join(przyklad('przyklad-post'), 'kampania.json'), 'utf8'));
  zmien(definicja);
  await fsp.writeFile(path.join(katalog, 'kampania.json'), JSON.stringify(definicja));
  return katalog;
}
const kontrola = async (zmien) => sprawdzKampanie(await wczytajKampanie(await kampaniaTestowa(zmien)));

test('przykłady wczytują się i przechodzą kontrolę bez błędów', async () => {
  for (const nazwa of ['wzorzec-instalacje', 'przyklad-specjalista', 'przyklad-firma', 'przyklad-post']) {
    const k = await wczytajKampanie(przyklad(nazwa));
    const wynik = await sprawdzKampanie(k);
    assert.deepEqual(wynik.bledy, [], `${nazwa}: ${wynik.bledy.join(' | ')}`);
  }
});

test('błędy budowy pliku kampanii są zbierane razem i nazwane', async () => {
  const katalog = await kampaniaTestowa((d) => {
    d.zrodla.brak = { plik: 'zrodla/ekrany/nie-ma.png' };
    d.tematy[0].uklad = 'hologram';
    d.tematy[0].formaty = ['3x4'];
    delete d.nazwa;
  });
  await assert.rejects(wczytajKampanie(katalog), (blad) => {
    for (const fragment of ['nazwa: brak', 'nie ma pliku zrodla/ekrany/nie-ma.png', 'uklad', 'nieznany format „3x4”']) assert.ok(blad.message.includes(fragment), `brak „${fragment}” w: ${blad.message}`);
    return true;
  });
});

test('nagranie w tempie innym niż 1× jest odrzucane', async () => {
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  await fsp.cp(path.join(przyklad('wzorzec-instalacje'), 'zrodla'), path.join(katalog, 'zrodla'), { recursive: true });
  const definicja = JSON.parse(await fsp.readFile(path.join(przyklad('wzorzec-instalacje'), 'kampania.json'), 'utf8'));
  definicja.tematy[0].film.sceny[1].klipy[0].tempo = 1.5;
  await fsp.writeFile(path.join(katalog, 'kampania.json'), JSON.stringify(definicja));
  await assert.rejects(wczytajKampanie(katalog), /wyłącznie w tempie 1×/);
});

test('zakazane obietnice blokują budowanie', async () => {
  const wynik = await kontrola((d) => { d.tematy[0].teksty.opis = 'Gwarantujemy, że schudniesz 5 kg w miesiąc z najlepszą aplikacją.'; });
  for (const powod of ['Nie gwarantujemy efektów', 'Bez obietnic utraty masy', 'najlepsza aplikacja']) assert.ok(wynik.bledy.some((b) => b.includes(powod)), `brak błędu „${powod}”`);
});

test('błędna pisownia marki i nieuzupełnione pole szablonu są błędami', async () => {
  const wynik = await kontrola((d) => { d.tematy[0].naglowek = ['TU: nagłówek', 'DIECIK']; });
  assert.ok(wynik.bledy.some((b) => b.includes('pole szablonu nie jest uzupełnione')));
  assert.ok(wynik.bledy.some((b) => b.includes('Nazwa marki zawsze jako „Diecik”')));
});

test('uwaga o bezpłatności gaśnie, gdy kampania ma dowód', async () => {
  const bez = await kontrola((d) => { d.tematy[0].dopisek = 'Generator Standard za darmo.'; });
  assert.ok(bez.uwagi.some((u) => u.includes('Bezpłatność musi dotyczyć')));
  const z = await kontrola((d) => { d.tematy[0].dopisek = 'Generator Standard za darmo.'; d.tematy[0].dowody.push({ twierdzenie: 'Generator Standard jest darmowy.', repo: 'health-app-mobile', plik: 'src/screens/diet/DietGeneratorScreen.tsx' }); });
  assert.ok(!z.uwagi.some((u) => u.includes('Bezpłatność musi dotyczyć')));
});

test('dowód wskazujący nieistniejący plik jest błędem', async () => {
  const wynik = await kontrola((d) => { d.tematy[0].dowody = [{ twierdzenie: 'Coś działa.', repo: 'health-app-mobile', plik: 'src/nie/ma/takiego.ts' }]; });
  assert.ok(wynik.bledy.some((b) => b.includes('dowód wskazuje plik, którego nie ma')));
});

test('za długi nagłówek i kadr poza obrazem są zgłaszane z nazwą planszy', async () => {
  const dlugi = await kontrola((d) => { d.tematy[0].naglowek = ['Bardzo długi nagłówek, który na pewno się nie zmieści']; });
  assert.ok(dlugi.bledy.some((b) => b.includes('Grafika-01-Plan-na-jutro-4x5.jpg') && b.includes('skróć go albo podziel na linie')));
  const kadr = await kontrola((d) => { d.kadry.posilkiDnia.wys = 5000; });
  assert.ok(kadr.bledy.some((b) => b.includes('kadr posilkiDnia: wychodzi poza źródło')));
});

test('układ trzy-telefony składa się we wszystkich formatach bez zasłoniętych napisów', async () => {
  const katalog = await kampaniaTestowa((d) => {
    delete d.karuzela;
    Object.assign(d.tematy[0], { uklad: 'trzy-telefony', ekran: 'dietaDzien', ekran2: 'generatorPodglad', ekran3: 'dietaDzien', formaty: ['1x1', '4x5', '9x16'] });
  });
  const k = await wczytajKampanie(katalog);
  const wyniki = await renderujWszystkie(k);
  assert.deepEqual(wyniki.map((w) => [w.plotno.canvas.width, w.plotno.canvas.height]), [[1440, 1440], [1440, 1800], [1440, 2560]]);
  for (const wynik of wyniki) assert.deepEqual(wynik.plotno.problemy, [], wynik.plik);
  const bezTrzeciego = await kampaniaTestowa((d) => { delete d.karuzela; Object.assign(d.tematy[0], { uklad: 'trzy-telefony', ekran2: 'generatorPodglad' }); });
  await assert.rejects(wczytajKampanie(bezTrzeciego), /ekran3: brak/);
});

test('plansza ze zdjęciem, telefonem i blokiem ceny składa się w trzech formatach', async () => {
  const cena = { przed: 'od', kwota: '600 zł', po: 'miesięcznie', dopisek: 'brutto' };
  const katalog = await kampaniaTestowa((d) => {
    delete d.karuzela;
    Object.assign(d.tematy[0], { uklad: 'zdjecie+telefon', zdjecie: 'generatorPodglad', ekran: 'dietaDzien', naglowek: ['Czyje logo', 'widzi Twój', 'podopieczny?'], szerokoscNaglowka: 660, tresc: ['Prowadzenie podopiecznych', 'i własna aplikacja'], cena, formaty: ['4x5', '1x1', '9x16'] });
  });
  const wyniki = await renderujWszystkie(await wczytajKampanie(katalog));
  assert.equal(wyniki.length, 3);
  for (const wynik of wyniki) assert.deepEqual(wynik.plotno.problemy, [], wynik.plik);
  const bezKwoty = await kampaniaTestowa((d) => { delete d.karuzela; d.tematy[0].cena = { przed: 'od' }; });
  await assert.rejects(wczytajKampanie(bezKwoty), /cena\.kwota: brak kwoty/);
});

test('film z nagraniem na tło i planszą z ceną mieści napisy w pionie i w kadrze 4:5', async () => {
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  await fsp.cp(path.join(przyklad('wzorzec-instalacje'), 'zrodla'), path.join(katalog, 'zrodla'), { recursive: true });
  const definicja = JSON.parse(await fsp.readFile(path.join(przyklad('wzorzec-instalacje'), 'kampania.json'), 'utf8'));
  delete definicja.karuzela;
  definicja.tematy = [definicja.tematy[0]];
  definicja.tematy[0].film = {
    plik: 'Test-material', kadr45: true, muzyka: { plik: 'marka/muzyka/kinowy-20s.wav' },
    sceny: [
      { typ: 'material', czas: 2, material: 'profileFlow', od: 1, etykieta: 'Dietetyku,', naglowek: ['Czyje logo', 'widzi Twój', 'podopieczny?'] },
      { typ: 'ekran', czas: 2, material: 'profileFlow', od: 3, tytul: 'Może widzieć Twoje.', opis: 'Aplikacja z Twoją nazwą, logo i kolorami.', ekran: 'profileAuto' },
      { typ: 'material', czas: 2, material: 'profileFlow', od: 5, naglowek: ['Ty prowadzisz go', 'w panelu.'], pozycja: 'dol' },
      { typ: 'cta', czas: 3, tlo: 'jasne', haslo: ['Prowadzenie podopiecznych', 'i własna aplikacja'], cena: { przed: 'od', kwota: '600 zł', po: 'miesięcznie', dopisek: 'brutto' }, ekran: 'profileAuto' },
    ],
  };
  await fsp.writeFile(path.join(katalog, 'kampania.json'), JSON.stringify(definicja));
  definicja.tematy[0].film.sceny[2].opcje = [{ material: 'profileFlow', od: 6 }];
  await fsp.writeFile(path.join(katalog, 'kampania.json'), JSON.stringify(definicja));
  const k = await wczytajKampanie(katalog);
  const film = k.filmy[0];
  assert.equal(film.dlugosc, 9);
  // Scena z opcjami nagrania: plansza wyboru A/B powstaje w qa/opcje i ma dwie kolumny po dwie klatki.
  const plansza = await planszaOpcji(k, film, 2, path.join(katalog, 'qa'));
  assert.equal(path.basename(plansza), 'Opcje-Test-material-scena-3.jpg');
  assert.ok((await fsp.stat(plansza)).size > 20000);
  const zla = structuredClone(definicja);
  zla.tematy[0].film.sceny[2].opcje = [{ material: 'nie-ma-takiego' }];
  const katalogZly = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalogZly);
  await fsp.cp(path.join(przyklad('wzorzec-instalacje'), 'zrodla'), path.join(katalogZly, 'zrodla'), { recursive: true });
  await fsp.writeFile(path.join(katalogZly, 'kampania.json'), JSON.stringify(zla));
  await assert.rejects(wczytajKampanie(katalogZly), /opcje\[0\]\.material/);
  for (const kadr45 of [false, true]) {
    const przygotowany = await przygotujFilm(k, film, path.join(katalog, 'qa'), { kadr45 });
    assert.equal(przygotowany.p.canvas.height, kadr45 ? 1800 : 2560);
    // Wejścia scen (ruch napisów) i ich środki: napis ma mieścić się w strefie w każdej z tych klatek.
    for (const stempel of [...stempleScen(film), 0.15, 4.2, 6.1]) await przygotowany.rysuj(stempel);
    assert.deepEqual(przygotowany.p.problemy, [], kadr45 ? 'kadr 4:5' : 'pion 9:16');
  }
});

test('akceptacja dopisuje gotowe pliki kampanii do Git tylko raz', async () => {
  const { wpuscDoGita } = await import('../src/paczka.mjs');
  const przed = '/kampanie/*/DO_WGRANIA/\n# zaakceptowane paczki kampanii:\n\n# dalej\n';
  const po = wpuscDoGita(przed, '2026-11-19-test');
  assert.equal(po, '/kampanie/*/DO_WGRANIA/\n# zaakceptowane paczki kampanii:\n!/kampanie/2026-11-19-test/DO_WGRANIA/\n\n# dalej\n');
  assert.equal(wpuscDoGita(po, '2026-11-19-test'), po);
  assert.equal(wpuscDoGita('*.zip', '2026-11-19-test'), '*.zip\n!/kampanie/2026-11-19-test/DO_WGRANIA/\n');
});

test('folder do obejrzenia dostaje same grafiki i filmy paczki, a stare znikają', async () => {
  const { wystawDoObejrzenia } = await import('../src/paczka.mjs');
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  const k = { katalog: path.join(katalog, 'kampania') };
  const cel = path.join(katalog, 'DO_OBEJRZENIA');
  await fsp.mkdir(path.join(k.katalog, 'DO_WGRANIA'), { recursive: true });
  await fsp.mkdir(path.join(cel, 'podfolder'), { recursive: true });
  for (const nazwa of ['Grafika-01.jpg', 'Film-01.mp4']) await fsp.writeFile(path.join(k.katalog, 'DO_WGRANIA', nazwa), nazwa);
  for (const nazwa of ['stara-grafika.jpg', 'stary-film.mp4', 'notatka.txt']) await fsp.writeFile(path.join(cel, nazwa), 'stare');
  assert.equal(await wystawDoObejrzenia(k, [{ nazwa: 'Grafika-01.jpg' }, { nazwa: 'Film-01.mp4' }], cel), 2);
  assert.deepEqual((await fsp.readdir(cel)).sort(), ['Film-01.mp4', 'Grafika-01.jpg', 'notatka.txt', 'podfolder']);
  assert.equal(await fsp.readFile(path.join(cel, 'Film-01.mp4'), 'utf8'), 'Film-01.mp4');
});

test('poziomy zrzut w ramce telefonu jest błędem', async () => {
  const katalog = await kampaniaTestowa((d) => { d.zrodla.dietaDzien.plik = 'zrodla/ekrany/panel.png'; });
  await fsp.copyFile(path.join(przyklad('przyklad-specjalista'), 'zrodla/ekrany/panel-jadlospis.png'), path.join(katalog, 'zrodla/ekrany/panel.png'));
  const wynik = await sprawdzKampanie(await wczytajKampanie(katalog));
  assert.ok(wynik.bledy.some((b) => b.includes('ramka telefonu wymaga pionowego zrzutu')));
});

// Zaakceptowane pliki paczki z 21.10.2026 — narzędzie ma je odtwarzać co do bajta.
const WZORZEC = {
  'Grafika-01-Cel-kalorii-1x1.jpg': '140b94b91c10e1694ea04033c4fce245940c6056af6362ba56c31164f00d6617',
};
const ARCHIWUM = path.join(REPO, 'archiwum/reklamy/diecik-deficyt-generator-2026-10-21');

test('grafiki wzorca są zgodne z zaakceptowaną paczką z 21.10.2026', async (t) => {
  const k = await wczytajKampanie(przyklad('wzorzec-instalacje'));
  const wyniki = await renderujWszystkie(k);
  assert.equal(wyniki.length, 8);
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  for (const wynik of wyniki) {
    assert.deepEqual(wynik.plotno.problemy, []);
    const bufor = await wynik.plotno.canvas.encode('jpeg', 95);
    const zaakceptowany = path.join(ARCHIWUM, 'DO_WGRANIA', wynik.plik);
    const oczekiwany = WZORZEC[wynik.plik] ?? (fs.existsSync(zaakceptowany) ? sha256(await fsp.readFile(zaakceptowany)) : null);
    if (!oczekiwany) { t.diagnostic(`${wynik.plik}: brak archiwum do porównania`); continue; }
    if (sha256(bufor) === oczekiwany) continue;
    // Inna wersja systemu może minimalnie zmienić rasteryzację fontów — wtedy liczy się obraz, nie bajty.
    assert.ok(fs.existsSync(zaakceptowany), `${wynik.plik} różni się od wzorca, a archiwum nie jest dostępne do porównania obrazu`);
    const plik = path.join(katalog, wynik.plik);
    await fsp.writeFile(plik, bufor);
    const roznica = await porownaj(plik, zaakceptowany);
    assert.ok(roznica.zgodneWymiary && roznica.srednia < 1 && roznica.wyrazne < 0.005, `${wynik.plik} odbiega od wzorca: ${JSON.stringify(roznica)}`);
    t.diagnostic(`${wynik.plik}: inne bajty, obraz zgodny (średnia różnica ${roznica.srednia.toFixed(3)})`);
  }
});

test('klatki filmów wzorca są zgodne z zaakceptowanymi', async (t) => {
  const klatkiWzorca = path.join(ARCHIWUM, 'qa/video');
  if (!fs.existsSync(klatkiWzorca)) { t.skip('robocze klatki paczki 21.10 nie są dostępne (qa/ jest poza Git)'); return; }
  const k = await wczytajKampanie(przyklad('wzorzec-instalacje'));
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  const stemple = [1.6, 5.2, 9.6, 13.7, 18.3];
  for (const [numer, nazwa] of ['deficit', 'generator'].entries()) {
    const wynik = await storyboard(k, k.filmy[numer], katalog, stemple);
    assert.deepEqual(wynik.problemy, []);
    for (const [i, klatka] of wynik.klatki.entries()) {
      const roznica = await porownaj(klatka, path.join(klatkiWzorca, `${nazwa}-${stemple[i].toFixed(1)}s-1440.png`));
      assert.ok(roznica.zgodneWymiary && roznica.srednia < 0.5 && roznica.wyrazne < 0.002, `${nazwa} ${stemple[i]} s odbiega od wzorca: ${JSON.stringify(roznica)}`);
    }
  }
});

test('synteza muzyki jest powtarzalna i trzyma poziom', () => {
  const a = zloz(PRESETY.generator, { sekundy: 6 });
  const b = zloz(PRESETY.generator, { sekundy: 6 });
  assert.equal(a.probki.length, 6 * 48000 * 2);
  assert.deepEqual(sha256(Buffer.from(a.probki.buffer)), sha256(Buffer.from(b.probki.buffer)));
  let szczyt = 0;
  let energia = 0;
  for (const probka of a.probki) { szczyt = Math.max(szczyt, Math.abs(probka)); energia += probka * probka; }
  assert.ok(szczyt > 0.2 && szczyt < 4, `szczyt ${szczyt}`);
  assert.ok(Math.sqrt(energia / a.probki.length) > 0.03);
  assert.equal(a.probki[0], 0, 'utwór zaczyna się od ciszy (wejście bez trzasku)');
  assert.ok(Math.abs(a.probki.at(-1)) < 1e-6, 'utwór kończy się wyciszeniem');
});

test('ZIP paczki przechodzi test integralności i oddaje te same bajty', async () => {
  const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
  tymczasowe.push(katalog);
  const plik = path.join(katalog, 'paczka.zip');
  const obraz = await fsp.readFile(path.join(REPO, 'marka/logo/diecik-icon.png'));
  await zapiszZip(plik, [{ nazwa: 'DO_WGRANIA/ikona.png', bufor: obraz }, { nazwa: 'TEKSTY-REKLAM.txt', bufor: Buffer.from('Zażółć gęślą jaźń\n') }]);
  execFileSync('/usr/bin/unzip', ['-tq', plik]);
  assert.equal(sha256(execFileSync('/usr/bin/unzip', ['-p', plik, 'DO_WGRANIA/ikona.png'], { maxBuffer: 1 << 24 })), sha256(obraz));
  assert.equal(execFileSync('/usr/bin/unzip', ['-p', plik, 'TEKSTY-REKLAM.txt']).toString(), 'Zażółć gęślą jaźń\n');
});

test('szablony są poprawnym JSON-em i po dodaniu ujęć zgłaszają nieuzupełnione pola', async () => {
  const zrzut = path.join(przyklad('przyklad-post'), 'zrodla/ekrany/dieta-dzien.png');
  const panel = path.join(przyklad('przyklad-specjalista'), 'zrodla/ekrany/panel-jadlospis.png');
  const nagranie = path.join(przyklad('wzorzec-instalacje'), 'zrodla/nagrania/profile-flow.mp4');
  for (const typ of fs.readdirSync(path.join(NARZEDZIE, 'szablony'))) {
    const definicja = JSON.parse(await fsp.readFile(path.join(NARZEDZIE, 'szablony', typ, 'kampania.json'), 'utf8'));
    assert.ok(fs.existsSync(path.join(NARZEDZIE, 'szablony', typ, 'BRIEF.md')), `${typ}: brak BRIEF.md`);
    const katalog = await fsp.mkdtemp(path.join(os.tmpdir(), 'reklama-test-'));
    tymczasowe.push(katalog);
    definicja.data = '2026-11-19';
    if (typ === 'firma') definicja.motyw = 'sprzedaz/michalina-gamon/marka/brand.json';
    for (const [klucz, zrodlo] of Object.entries(definicja.zrodla)) {
      await fsp.mkdir(path.dirname(path.join(katalog, zrodlo.plik)), { recursive: true });
      await fsp.copyFile(zrodlo.plik.endsWith('.mp4') ? nagranie : klucz === 'panel' ? panel : zrzut, path.join(katalog, zrodlo.plik));
    }
    await fsp.writeFile(path.join(katalog, 'kampania.json'), JSON.stringify(definicja));
    const wynik = await sprawdzKampanie(await wczytajKampanie(katalog));
    assert.ok(wynik.bledy.some((b) => b.includes('pole szablonu nie jest uzupełnione')), `${typ}: szablon nie zgłasza pól do uzupełnienia`);
  }
});
