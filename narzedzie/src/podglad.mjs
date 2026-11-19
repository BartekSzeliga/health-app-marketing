import fsp from 'node:fs/promises';
import path from 'node:path';

const esc = (tekst) => String(tekst).replace(/[&<>"']/g, (znak) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[znak]));
const dataPl = (data) => data.split('-').reverse().join('.');
const STATUSY = { SZKIC: 'Szkic', DO_AKCEPTACJI: 'Do akceptacji', ZAAKCEPTOWANE: 'Zaakceptowane' };
const POLA = { glowny: 'Tekst główny', krotki: 'Krótki wariant', naglowek: 'Nagłówek', opis: 'Opis', hashtagi: 'Hashtagi' };

/**
 * Strona podglądu paczki: filmy z dźwiękiem, grafiki w pełnej rozdzielczości,
 * kolejność karuzeli i teksty z przyciskiem kopiowania. Adresy plików mają
 * skrót zawartości, żeby przeglądarka nie pokazała starej wersji z pamięci.
 */
export async function zbudujPodglad(k, pliki, status, nazwaZip) {
  const K = k.motyw.kolory;
  const adres = (plik) => `../${esc(plik.plik)}?v=${plik.sha256.slice(0, 12)}`;
  const filmy = pliki.filter((p) => p.rodzaj === 'film');
  const grafiki = pliki.filter((p) => p.rodzaj === 'grafika');
  const karty = pliki.filter((p) => p.rodzaj === 'karuzela');
  const nazwaTematu = (id) => k.tematy.find((t) => t.id === id)?.nazwa ?? id;
  const logo = path.relative(path.join(k.katalog, 'podglad'), k.motyw.logo).split(path.sep).join('/');

  const okladka = (film) => `okladki/${esc(path.basename(film.nazwa, '.mp4').replace(/-4x5$/, ''))}.jpg`;
  const opisFilmu = (film) => `${film.sekundy} s · ${film.wysokosc === 1800 ? 'kadr 4:5 do Feedu' : '9:16 Reels i Stories'} · z muzyką`;
  const wyboryFilmow = filmy.map((film, i) => `<button class="choice${i ? '' : ' active'}" data-src="${adres(film)}" data-poster="${okladka(film)}" data-title="${esc(nazwaTematu(film.temat))}">${esc(nazwaTematu(film.temat))}<span>${opisFilmu(film)}</span></button>`).join('');
  const galeria = grafiki.map((g) => `<a class="asset" href="${adres(g)}" target="_blank"><img loading="lazy" src="${adres(g)}" alt="${esc(g.nazwa)}"><span>${esc(nazwaTematu(g.temat))} · ${g.format.replace('x', ':')}</span></a>`).join('');
  const karuzela = karty.map((c, i) => `<a class="asset" href="${adres(c)}" target="_blank"><img loading="lazy" src="${adres(c)}" alt="${esc(c.nazwa)}"><span>${i + 1}. ${esc(k.karuzela.karty[i].teksty?.naglowek ?? k.karuzela.karty[i].id)}</span></a>`).join('');
  let licznik = 0;
  const blok = (tytul, wpisy, stopka = '') => `<article><h3>${esc(tytul)}</h3>${wpisy.map(([etykieta, tresc]) => { licznik += 1; return `<div class="field"><div class="label">${esc(etykieta)} · ${tresc.length} zn.</div><p id="t${licznik}">${esc(tresc)}</p><button data-copy="t${licznik}">Kopiuj</button></div>`; }).join('')}${stopka}</article>`;
  const teksty = k.tematy.filter((t) => t.teksty && Object.keys(t.teksty).length).map((t) => blok(t.nazwa ?? t.id, Object.entries(t.teksty).map(([pole, wartosc]) => [POLA[pole] ?? pole, Array.isArray(wartosc) ? wartosc.join(' ') : wartosc]), k.cta.przycisk && k.typ !== 'post' ? `<small>Przycisk: ${esc(k.cta.przycisk)}</small>` : ''));
  if (k.karuzela?.tekstGlowny) teksty.push(blok(`Karuzela${k.karuzela.nazwa ? `: ${k.karuzela.nazwa}` : ''}`, [['Tekst główny', k.karuzela.tekstGlowny], ...k.karuzela.karty.flatMap((karta, i) => [karta.teksty?.naglowek && [`Karta ${i + 1} — nagłówek`, karta.teksty.naglowek], karta.teksty?.opis && [`Karta ${i + 1} — opis`, karta.teksty.opis]].filter(Boolean))]));
  const odbiorca = { b2c: 'Dla osoby indywidualnej', specjalista: 'Dla specjalistów', firma: 'Dla firm' }[k.odbiorca];
  const sklad = [filmy.length && `${filmy.length} × film`, grafiki.length && `${grafiki.length} × grafika`, karty.length && `${karty.length} kart karuzeli`].filter(Boolean).join(', ');

  const html = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(k.nazwa)} · podgląd · ${dataPl(k.data)}</title>
<style>
:root{--pine:${K.pine};--cream:${K.cream};--lime:${K.lime};--muted:${K.muted};--line:#d5ddcf;--card:#e8edde}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--cream);color:var(--pine);font:16px "Avenir Next",-apple-system,BlinkMacSystemFont,sans-serif}main{max-width:1420px;margin:auto;padding:36px 48px 48px}a{color:inherit}button{font:inherit;cursor:pointer}header{display:flex;justify-content:space-between;align-items:center;gap:24px;padding-bottom:30px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px;font-size:24px;font-weight:750}.brand img{height:38px}.badge{padding:9px 14px;background:#e4ebdd;border-radius:30px;font-size:13px;font-weight:650}nav{display:flex;gap:24px;align-items:center}nav a{text-decoration:none;font-size:14px}h1,h2{font-family:Baskerville,Georgia,serif;font-weight:400}h1{font-size:clamp(38px,4.4vw,68px);line-height:1.05;max-width:900px;margin:16px 0 18px}h2{font-size:38px;line-height:1.12;margin:8px 0 16px}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}.lead{font-size:18px;line-height:1.65;max-width:750px;color:var(--muted)}.intro{margin:36px 0 26px}.player{display:grid;grid-template-columns:390px 1fr;gap:52px;align-items:center}.screen{padding:9px;background:#102c24;border-radius:22px;box-shadow:0 12px 38px #1536301c}video{display:block;width:100%;height:min(68vh,650px);object-fit:contain;border-radius:15px;background:#102c24}.choices{display:grid;gap:12px;margin:22px 0}.choice{border:1px solid #d2dccb;background:#e7ecdf;border-radius:14px;padding:17px 20px;text-align:left;font-size:18px;font-weight:700;color:var(--pine)}.choice span{display:block;margin-top:5px;font-size:13px;font-weight:450}.choice.active{background:var(--pine);color:var(--cream);border-color:var(--pine)}.play,.download{display:inline-block;padding:15px 23px;border:0;border-radius:12px;background:var(--lime);color:var(--pine);font-weight:750;text-decoration:none}.status{min-height:24px;color:var(--muted);font-size:14px;line-height:1.6}.links{display:flex;gap:24px;flex-wrap:wrap;font-size:14px}.gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;align-items:start}.asset{text-decoration:none;display:block;min-width:0}.asset img{display:block;width:100%;border-radius:12px;border:1px solid #d3dccc}.asset span{display:block;font-size:13px;margin-top:10px}.section{margin-top:72px}.section>p{color:var(--muted);line-height:1.7}.copy{display:grid;grid-template-columns:1fr 1fr;gap:22px}.copy article{background:var(--card);border-radius:18px;padding:24px}.copy h3{margin:0 0 14px;font-size:18px}.field{margin-bottom:18px}.label{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:650}.field p{margin:6px 0 10px;line-height:1.55}.copy button{padding:8px 13px;background:var(--pine);color:#fff;border:0;border-radius:9px;font-size:14px}.copy small{display:block;margin-top:6px;line-height:1.7;color:var(--muted)}footer{margin-top:64px;border-top:1px solid var(--line);padding-top:24px;font-size:14px;line-height:1.7;color:var(--muted)}@media(max-width:900px){main{padding:24px}header{align-items:flex-start}nav{gap:16px;flex-wrap:wrap;justify-content:flex-end}.player{grid-template-columns:340px 1fr;gap:28px}.gallery{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){header{display:block}nav{justify-content:flex-start;margin-top:20px}.player{grid-template-columns:1fr;gap:24px}.screen{max-width:360px;width:100%;margin:auto}video{height:62vh;min-height:440px}.copy{grid-template-columns:1fr}.section{margin-top:48px}h2{font-size:32px}.lead{font-size:16px}}
</style></head><body><main>
<header><div class="brand"><img src="${esc(logo)}" alt="">${esc(k.motyw.nazwa)} <span class="badge">${STATUSY[status] ?? esc(status)}</span></div><nav>${filmy.length ? '<a href="#filmy">Filmy</a>' : ''}${grafiki.length ? '<a href="#grafiki">Grafiki</a>' : ''}${karty.length ? '<a href="#karuzela">Karuzela</a>' : ''}<a href="#teksty">Teksty</a>${nazwaZip ? `<a class="download" href="../${esc(nazwaZip)}" download>Pobierz paczkę ↓</a>` : ''}</nav></header>
<div class="intro"><div class="eyebrow">${esc(odbiorca)} · ${dataPl(k.data)}</div><h1>${esc(k.nazwa)}</h1><p class="lead">${esc(sklad)}. Prawdziwe ekrany aplikacji, dane przykładowe. Niczego nie wgrano ani nie opublikowano.</p></div>
${filmy.length ? `<section class="player" id="filmy"><div class="screen"><video id="film" controls playsinline preload="metadata" poster="${okladka(filmy[0])}" src="${adres(filmy[0])}"></video></div><div><div class="eyebrow">Reels / Stories</div><h2 id="current">${esc(nazwaTematu(filmy[0].temat))}</h2><div class="choices">${wyboryFilmow}</div><button class="play" id="play">Odtwórz z dźwiękiem</button><p class="status" id="status" role="status">Wybierz film i uruchom odtwarzanie.</p><div class="links"><a href="../TEKSTY-REKLAM.txt" target="_blank">Teksty</a><a href="../ZRODLA.txt" target="_blank">Źródła i zakres przekazu</a></div></div></section>` : ''}
${grafiki.length ? `<section class="section" id="grafiki"><div class="eyebrow">Osobne reklamy</div><h2>Grafiki.</h2><p>Kliknij grafikę, aby obejrzeć ją w pełnej rozdzielczości. Rozmiary tej samej grafiki to warianty umiejscowień, nie karty karuzeli.</p><div class="gallery">${galeria}</div></section>` : ''}
${karty.length ? `<section class="section" id="karuzela"><div class="eyebrow">Jedna historia · kolejność 1 → ${karty.length}</div><h2>Karuzela.</h2><div class="gallery">${karuzela}</div></section>` : ''}
<section class="section" id="teksty"><div class="eyebrow">Teksty do wklejenia</div><h2>Komunikat do każdego tematu.</h2><div class="copy">${teksty.join('')}</div></section>
<footer><div class="links"><a href="../README.md" target="_blank">Opis paczki</a><a href="../TEKSTY-REKLAM.txt" target="_blank">Wszystkie teksty</a><a href="../ZRODLA.txt" target="_blank">Źródła i zakres przekazu</a><a href="../manifest.json" target="_blank">Manifest</a></div>${k.uwagi.length ? `<p>${k.uwagi.map(esc).join(' ')}</p>` : ''}</footer>
</main><script>
const film=document.querySelector('#film'), status=document.querySelector('#status'), current=document.querySelector('#current');
const choices=[...document.querySelectorAll('.choice')];
for(const b of choices)b.addEventListener('click',()=>{film.pause();film.src=b.dataset.src;film.poster=b.dataset.poster;film.load();current.textContent=b.dataset.title;choices.forEach(x=>x.classList.toggle('active',x===b));status.textContent='Gotowy do odtworzenia.'});
document.querySelector('#play')?.addEventListener('click',()=>{if(film.ended)film.currentTime=0;film.muted=false;film.volume=1;film.play().catch(()=>status.textContent='Uruchom odtwarzanie przyciskiem w filmie.')});
film?.addEventListener('play',()=>status.textContent='Odtwarzanie z muzyką…');film?.addEventListener('ended',()=>status.textContent='Koniec filmu.');film?.addEventListener('error',()=>status.textContent='Nie udało się odczytać pliku. Odśwież podgląd.');
for(const b of document.querySelectorAll('[data-copy]'))b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).textContent);b.textContent='Skopiowano ✓'}catch{b.textContent='Zaznacz i skopiuj tekst powyżej'}});
</script></body></html>
`;
  const plik = path.join(k.katalog, 'podglad/index.html');
  await fsp.mkdir(path.dirname(plik), { recursive: true });
  await fsp.writeFile(plik, html);
  return plik;
}
