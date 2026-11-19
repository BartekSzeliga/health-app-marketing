from pathlib import Path
import html, json, hashlib

root = Path(__file__).resolve().parent.parent
media = root / 'DO_WGRANIA'
films = [
    ('Pomysł na posiłek', 'Diecik-pomysl-na-posilek-Reels-Stories-20s.mp4'),
    ('Kalorie, makro i mikroskładniki', 'Diecik-kalorie-i-makro-Reels-Stories-20s.mp4'),
    ('Plan treningu', 'Diecik-plan-treningu-Reels-Stories-20s.mp4'),
    ('Ulubione posiłki · zachowany oryginał', 'Diecik-ulubione-posilki-Reels-Stories-20s.mp4'),
]
buttons = ''.join(f'<button class="choice" data-src="../DO_WGRANIA/{filename}" data-poster="okladki/{filename.replace(".mp4", ".jpg")}">{html.escape(title)}</button>' for title, filename in films)
statics = ''.join(f'<a href="../DO_WGRANIA/{p.name}" target="_blank"><img loading="lazy" src="../DO_WGRANIA/{p.name}" alt="{html.escape(p.stem)}"><span>{html.escape(p.stem)}</span></a>' for p in sorted(media.glob('Grafika-*.jpg')))
carousel = ''.join(f'<a href="../DO_WGRANIA/{p.name}" target="_blank"><img loading="lazy" src="../DO_WGRANIA/{p.name}" alt="{html.escape(p.stem)}"><span>{html.escape(p.stem)}</span></a>' for p in sorted(media.glob('Karuzela-*.jpg')))
refs = ''.join(f'<button class="choice reference" data-src="../../diecik-brand-v11-2026-10-02/filmy/Diecik-{slug}-Reels-Stories-20s.mp4">Referencja · {label}</button>' for slug, label in [('dietetyk', 'Dietetyk'), ('trener', 'Trener')])
document = '''<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diecik · zestaw reklam</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f5ef;color:#153630;font:16px -apple-system,BlinkMacSystemFont,"Avenir Next",sans-serif}main{max-width:1380px;margin:auto;padding:40px}header{display:flex;justify-content:space-between;align-items:center;gap:24px;border-bottom:1px solid #ccd6c9;padding-bottom:26px}h1{font:52px Baskerville,Georgia,serif;margin:8px 0}h2{font:36px Baskerville,Georgia,serif;margin:0 0 18px}p{line-height:1.6;max-width:720px}a{color:inherit}.tag{font-size:12px;text-transform:uppercase;letter-spacing:.15em}.download{padding:15px 24px;background:#153630;border-radius:14px;color:#fff;text-decoration:none;font-weight:650;white-space:nowrap}.player{display:grid;grid-template-columns:minmax(300px,430px) 1fr;gap:44px;margin-top:36px;align-items:center}.screen{padding:12px;background:#0c211d;border-radius:24px}video{display:block;width:100%;height:min(65vh,650px);object-fit:contain;background:#0c211d;border-radius:16px}button{font:inherit;cursor:pointer;border:0}.choices{display:grid;gap:12px}.choice{display:block;text-align:left;padding:18px 22px;color:#153630;background:#e3eadd;border-radius:13px}.choice.active{background:#153630;color:#fff}.play{padding:16px 24px;background:#daf2a5;color:#153630;border-radius:12px;font-weight:750;margin:16px 0 0}.status{font-size:14px;color:#52675e;min-height:24px}.hint{font-size:14px;color:#52675e}.references{margin-top:24px}.references .choice{display:inline-block;margin:10px 6px 0 0;font-size:13px;padding:10px 14px}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.gallery a,.carousel a{display:block;text-decoration:none;font-size:12px}.gallery img,.carousel img{display:block;width:100%;border:1px solid #d1d8d0;border-radius:12px}.gallery span,.carousel span{display:block;margin-top:8px;overflow-wrap:anywhere}.carousel{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}section{margin-top:64px}footer{margin-top:60px;border-top:1px solid #ccd6c9;padding-top:24px;font-size:14px}.links{display:flex;gap:22px;flex-wrap:wrap} @media(max-width:760px){main{padding:24px}h1{font-size:38px}header{display:block}.download{display:inline-block}.player{grid-template-columns:1fr;gap:24px}.gallery{grid-template-columns:repeat(2,1fr)}.carousel{grid-template-columns:repeat(2,1fr)}video{height:65vh}}
</style><main><header><div><div class="tag">Diecik · 18 października 2026</div><h1>Jeden problem. Konkretny powód, by pobrać.</h1><p>3 nowe filmy, zachowane Ulubione, 6 grafik i czterokartowa karuzela.</p></div><a class="download" href="../Diecik-materialy-do-wgrania.zip" download>Pobierz cały zestaw ↓</a></header>
<div class="player"><div class="screen"><video id="film" controls preload="metadata" playsinline src="../DO_WGRANIA/Diecik-pomysl-na-posilek-Reels-Stories-20s.mp4"></video></div><div><div class="tag">Filmy · Reels / Stories · 20 sekund</div><h2 id="current">Pomysł na posiłek</h2><div class="choices">__BUTTONS__</div><button class="play" id="play">Odtwórz wybrany film</button><p class="status" id="status" aria-live="polite">Wybierz film i odtwórz z dźwiękiem.</p><p class="hint">Każdy nowy film ma osobną obietnicę, prawdziwy produkt i wezwanie do pobrania. Oryginalne Ulubione zostały skopiowane bez zmian.</p><details class="references"><summary>Wzorce jakości z poprzedniego pakietu</summary>__REFS__</details></div></div>
<section><div class="tag">Oddzielne reklamy · 1:1 i 4:5</div><h2>Problem → rozwiązanie</h2><div class="gallery">__STATICS__</div></section>
<section><div class="tag">Jedna karuzela · kolejność od lewej</div><h2>Cztery powody, by otworzyć Diecik</h2><div class="carousel">__CAROUSEL__</div></section>
<footer><div class="links"><a href="../TEKSTY-REKLAM.txt">Teksty do skopiowania</a><a href="../README.md">Jak użyć zestawu</a><a href="../DO_WGRANIA/">Wszystkie 14 plików do wgrania</a></div><p>Podgląd lokalny. Materiały nie zostały opublikowane ani dodane do kampanii.</p></footer></main>
<script>
const film=document.querySelector('#film'),title=document.querySelector('#current'),status=document.querySelector('#status');
const choices=[...document.querySelectorAll('.choice')];choices[0].classList.add('active');
for(const button of choices)button.addEventListener('click',()=>{film.pause();film.src=button.dataset.src;film.load();title.textContent=button.textContent;choices.forEach(b=>b.classList.toggle('active',b===button));status.textContent='Gotowy do odtworzenia.'});
document.querySelector('#play').addEventListener('click',()=>{if(film.ended)film.currentTime=0;film.play().catch(()=>status.textContent='Użyj przycisku odtwarzania w filmie.')});
film.addEventListener('play',()=>status.textContent='Odtwarzanie…');film.addEventListener('ended',()=>status.textContent='Koniec filmu · 20 sekund');film.addEventListener('error',()=>status.textContent='Plik jeszcze się eksportuje. Odśwież podgląd za chwilę.');
</script></html>'''
for key, value in [('BUTTONS',buttons),('REFS',refs),('STATICS',statics),('CAROUSEL',carousel)]:
    document=document.replace('__'+key+'__',value)
document=document.replace('<video id="film" controls', '<video id="film" poster="okladki/Diecik-pomysl-na-posilek-Reels-Stories-20s.jpg" controls')
document=document.replace('film.src=button.dataset.src;film.load();', 'film.src=button.dataset.src;film.poster=button.dataset.poster||"";film.load();')
document=document.replace('Diecik · 18 października 2026', 'Diecik · korekta 2 · 18 października 2026')
document=document.replace('3 nowe filmy, zachowane Ulubione, 6 grafik i czterokartowa karuzela.', 'Nowa muzyka i obsada. Makaron, mikroskładniki i zdjęcia ćwiczeń. 14 gotowych materiałów.')
# A changed media file must never be confused with the previous revision cached
# by the browser. File URLs keep the same on-disk names for straightforward upload.
for p in [*media.iterdir(),*(root/'podglad/okladki').glob('*.jpg')]:
    if not p.is_file():continue
    version=hashlib.sha256(p.read_bytes()).hexdigest()[:12]
    document=document.replace(p.name+'"',p.name+'?v='+version+'"')
(root/'podglad/index.html').write_text(document)
print('Preview HTML ready')
