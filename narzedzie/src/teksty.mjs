import fs from 'node:fs';
import path from 'node:path';
import { PRODUKT, uruchom } from './wspolne.mjs';

const ETYKIETY = { glowny: 'Tekst główny', krotki: 'Krótki wariant', naglowek: 'Nagłówek', opis: 'Opis', hashtagi: 'Hashtagi' };
const STATUSY = { SZKIC: 'szkic roboczy', DO_AKCEPTACJI: 'do akceptacji Bartosza. Bez wgrania i publikacji', ZAAKCEPTOWANE: 'zaakceptowane przez Bartosza' };
const dataPl = (data) => data.split('-').reverse().join('.');
const zawin = (tekst, szerokosc = 78) => {
  const linie = [];
  let biezaca = '';
  for (const slowo of tekst.split(/\s+/)) {
    if (biezaca && (biezaca + ' ' + slowo).length > szerokosc) { linie.push(biezaca); biezaca = slowo; } else biezaca = biezaca ? `${biezaca} ${slowo}` : slowo;
  }
  if (biezaca) linie.push(biezaca);
  return linie.join('\n');
};

const plikiTematu = (temat, pliki) => pliki.filter((plik) => plik.temat === temat.id && plik.rodzaj !== 'karuzela').map((plik) => plik.nazwa);

/** TEKSTY-REKLAM.txt: gotowe pola do wklejenia, z licznikiem znaków przy każdym. */
export function tekstyReklam(k, pliki, status) {
  const post = k.typ === 'post';
  const w = [`${k.motyw.nazwa} · ${post ? 'teksty postów' : 'teksty reklam'} · ${dataPl(k.data)}`,
    `Kampania: ${k.nazwa}`, `Status: ${STATUSY[status] ?? status}.`,
    'Liczby w nawiasach to znaki ze spacjami; nie kopiuj ich do reklamy.', ''];
  if (!post) {
    w.push('Wspólne ustawienia:');
    if (k.cel) w.push(`Cel: ${k.cel}.`);
    w.push(`CTA na planszach: ${k.cta.plansza}.${k.cta.przycisk ? ` Przycisk reklamy: ${k.cta.przycisk}.` : ''}`);
  }
  for (const [nazwa, adres] of Object.entries(k.linki)) w.push(`${nazwa}: ${adres}`);
  w.push('');
  k.tematy.forEach((temat, i) => {
    w.push(`${String(i + 1).padStart(2, '0')} — ${(temat.nazwa ?? temat.id).toLocaleUpperCase('pl-PL')}`);
    const nazwy = plikiTematu(temat, pliki);
    if (nazwy.length) w.push(zawin(`Pliki: ${nazwy.join('; ')}.`));
    w.push('');
    for (const [pole, wartosc] of Object.entries(temat.teksty ?? {})) {
      const tresc = Array.isArray(wartosc) ? wartosc.join(' ') : wartosc;
      w.push(`${ETYKIETY[pole] ?? pole} (${tresc.length}):`, tresc, '');
    }
  });
  if (k.karuzela) {
    w.push(`KARUZELA — ${(k.karuzela.nazwa ?? 'kolejność kart').toLocaleUpperCase('pl-PL')}`);
    if (k.karuzela.tekstGlowny) w.push(`Tekst główny (${k.karuzela.tekstGlowny.length}):`, k.karuzela.tekstGlowny, '');
    w.push('Kolejność kart jest stała; wyłącz automatyczną zmianę kolejności:');
    k.karuzela.karty.forEach((karta, i) => {
      w.push(`${i + 1}. Karuzela-${karta.id}-${k.karuzela.format}.jpg`);
      if (karta.teksty?.naglowek) w.push(`   Nagłówek (${karta.teksty.naglowek.length}): ${karta.teksty.naglowek}`);
      if (karta.teksty?.opis) w.push(`   Opis (${karta.teksty.opis.length}): ${karta.teksty.opis}`);
    });
    w.push('');
  }
  if (k.uwagi.length) w.push('Zakres przekazu:', ...k.uwagi.map((uwaga) => zawin(`- ${uwaga}`)), '');
  return `${w.join('\n').trimEnd()}\n`;
}

async function commit(repo) {
  const katalog = path.join(PRODUKT, repo);
  if (!fs.existsSync(path.join(katalog, '.git'))) return null;
  try { return (await uruchom('git', ['-C', katalog, 'rev-parse', 'HEAD'])).tekst.trim(); } catch { return null; }
}

/** ZRODLA.txt: pochodzenie ujęć, dowody twierdzeń z commitem repo produktu, obróbka, muzyka, eksport. */
export async function zrodla(k, raportyFilmow) {
  const w = [`${k.motyw.nazwa} · pochodzenie materiałów · ${dataPl(k.data)}`, `Kampania: ${k.nazwa}`, ''];
  w.push('1. UJĘCIA');
  if (k.pochodzenie) for (const [pole, wartosc] of Object.entries(k.pochodzenie)) w.push(zawin(`${pole}: ${wartosc}`));
  else w.push('Brak opisu pochodzenia w kampania.json (sekcja "pochodzenie").');
  w.push('');
  for (const zrodlo of Object.values(k.zrodla)) {
    w.push(`${zrodlo.sciezka}${zrodlo.opis ? ` — ${zrodlo.opis}` : ''}`);
    // Materiał stockowy: autor, strona źródłowa i licencja stoją przy pliku.
    if (zrodlo.autor || zrodlo.strona || zrodlo.licencja) w.push(`  ${[zrodlo.autor && `autor: ${zrodlo.autor}`, zrodlo.licencja && `licencja: ${zrodlo.licencja}`, zrodlo.strona].filter(Boolean).join(' · ')}`);
  }
  w.push('', '2. DOWODY TWIERDZEŃ');
  const repozytoria = new Map();
  for (const temat of k.tematy) {
    if (!temat.dowody.length) continue;
    w.push(`${temat.nazwa ?? temat.id}:`);
    for (const dowod of temat.dowody) {
      w.push(zawin(`- ${dowod.twierdzenie}`));
      if (dowod.repo && dowod.plik) { w.push(`  ${dowod.repo}/${dowod.plik}${dowod.linie ? `:${dowod.linie}` : ''}`); if (!repozytoria.has(dowod.repo)) repozytoria.set(dowod.repo, await commit(dowod.repo)); }
    }
  }
  if (repozytoria.size) { w.push('', 'Stan repo produktu w chwili budowania:'); for (const [repo, hash] of repozytoria) w.push(`${repo} HEAD ${hash ?? '(nieustalony)'}`); }
  w.push('', '3. OBRÓBKA',
    zawin('Ekrany aplikacji są tylko jednolicie skalowane, oprawione w ramkę i kadrowane. Narzędzie nie dopisuje do interfejsu etykiet, przycisków, liczb ani treści. Nagrania grają w tempie 1×; cięcia mogą pomijać oczekiwanie, nie dodają kliknięć.'));
  if (raportyFilmow.length) {
    w.push('', '4. FILMY I MUZYKA');
    for (const raport of raportyFilmow) {
      w.push(`${path.basename(raport.plik)}: ${raport.dlugosc} s, ${raport.muzyka.opis}.`);
      for (const ujecie of raport.ujecia) w.push(`  ujęcie ${ujecie.zrodlo} od ${ujecie.odNagrania} s (film ${ujecie.odFilmu}–${ujecie.doFilmu} s, ${ujecie.ujecie}${ujecie.kadr ? `, kadr ${ujecie.kadr}` : ''})`);
      for (const material of raport.material ?? []) w.push(`  nagranie ${material.zrodlo} od ${material.odNagrania} s, tempo 1×${material.rozmyte ? ', rozmyte tło pod telefonem' : ''}`);
    }
    w.push(zawin('Podkłady to własna synteza dźwięku: bez sampli, nagrań osób, lektora i odgłosów udających dotknięcia. Format filmów: MP4 1440×2560 (kadr 4:5: 1440×1800), 30 kl./s, H.264, yuv420p, BT.709, AAC 48 kHz stereo.'));
    if (raportyFilmow.some((raport) => raport.material?.length)) w.push(zawin('Nagrania ludzi to materiał stockowy użyty ilustracyjnie: osoby na nagraniach nie są klientami ani użytkownikami Diecika i niczego nie rekomendują. Dźwięk oryginalny usunięty.'));
  }
  if (k.uwagi.length) w.push('', `${raportyFilmow.length ? 5 : 4}. ZAKRES PRZEKAZU`, ...k.uwagi.map((uwaga) => zawin(`- ${uwaga}`)));
  return `${w.join('\n').trimEnd()}\n`;
}

/** README.md paczki: co jest w środku, jak obejrzeć, jaki jest status. */
export function readme(k, pliki, status, nazwaZip) {
  const filmy = pliki.filter((p) => p.rodzaj === 'film');
  const grafiki = pliki.filter((p) => p.rodzaj === 'grafika');
  const karty = pliki.filter((p) => p.rodzaj === 'karuzela');
  const w = [`# ${k.nazwa}`, '', `${dataPl(k.data)}. Status: **${STATUSY[status] ?? status}**. Niczego nie wgrano do Meta ani nie opublikowano.`, '',
    `W \`DO_WGRANIA\` jest ${pliki.length} plików:`, ''];
  if (filmy.length) w.push(`- ${filmy.length} × film ${filmy[0].szerokosc} × ${filmy[0].wysokosc}, 9:16: ${filmy.map((f) => `\`${f.nazwa}\` (${f.sekundy} s)`).join(', ')};`);
  if (grafiki.length) w.push(`- ${grafiki.length} × grafika: ${[...new Set(grafiki.map((g) => `${g.szerokosc} × ${g.wysokosc}`))].join(', ')};`);
  if (karty.length) w.push(`- ${karty.length} kart jednej karuzeli ${karty[0].szerokosc} × ${karty[0].wysokosc}, w kolejności z \`TEKSTY-REKLAM.txt\`.`);
  w.push('', '## Jak obejrzeć', '', `\`./reklama pokaz ${k.id}\` otwiera stronę podglądu z filmami, grafikami, kolejnością karuzeli i tekstami do skopiowania.`,
    nazwaZip ? `ZIP \`${nazwaZip}\` zawiera pliki do wgrania, teksty, opis i manifest.` : '', '',
    '## Pliki paczki', '', '- `TEKSTY-REKLAM.txt` — teksty i nagłówki z licznikami znaków;', '- `ZRODLA.txt` — pochodzenie ekranów, dowody twierdzeń, obróbka, muzyka;',
    '- `manifest.json` — parametry i sumy kontrolne każdego pliku, wyniki kontroli;', '- `kampania.json` — definicja kampanii, z której narzędzie odtwarza całą paczkę.', '',
    '## Przed wgraniem', '', 'Obejrzyj gotowe materiały i sprawdź w Menedżerze reklam podgląd każdego umiejscowienia. Sam eksport nie gwarantuje dostępności ani dostarczania we wszystkich umiejscowieniach. Kontrola techniczna plików to nie ocena skuteczności reklamy.');
  if (k.uwagi.length) w.push('', '## Zakres przekazu', '', ...k.uwagi.map((uwaga) => `- ${uwaga}`));
  return `${w.filter((linia) => linia !== null).join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
