import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';
import ffmpeg from '../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js';

const campaign = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ads = path.resolve(campaign, '..');
const original = path.join(ads, 'Nagranie z ekranu 2026-09-29 o 15.59.18.mov');
const phone = path.join(campaign, 'sources/iphone-17-od-specjalisty-varied-raw.mov');
const day = path.join(campaign, 'sources/iphone-full-day-overview.png');
const logo = path.join(ads, 'meta-start-aplikacji/sources/diecik-logo.png');
const loops = '/Library/Audio/Apple Loops/Apple/07 Chillwave';
const loopFiles = [
  'Moving Pictures Acoustic Guitar.caf',
  'Moving Pictures Bass.caf',
  'Minimal Backbeat 01.caf',
  'Moving Pictures Synth.caf',
].map((name) => path.join(loops, name));
const out = path.join(campaign, 'output');
const temp = path.join(campaign, 'qa/.build');
const cut = { start: 219.6, end: 224.0 };
const webSourceDuration = 249.65;
const typingSpeed = 4;
const typing = { firstStart: 218.0, firstEnd: cut.start, secondStart: cut.end, secondEnd: 245.4 };
const webSourceKept = webSourceDuration - cut.end + cut.start;
const webDuration = typing.firstStart +
  (typing.firstEnd - typing.firstStart) / typingSpeed +
  (typing.secondEnd - typing.secondStart) / typingSpeed +
  (webSourceDuration - typing.secondEnd);
// Nowe ujęcie jednego różnorodnego dnia: pięć posiłków, przepis i kolejny dzień.
const phoneTrim = { start: 15.88, end: 37.08 };
const introDuration = 3.5;
const overviewDuration = 5.5;
const outroDuration = 5;
const phoneDuration = phoneTrim.end - phoneTrim.start;
const phoneAt = introDuration + webDuration;
const duration = phoneAt + overviewDuration + phoneDuration + outroDuration;
const fps = 30;
const colors = { dark: '#082F35', teal: '#0C6F84', lime: '#D2F56F', mint: '#C7F2E4' };
const master = path.join(out, 'diecik-specjalista-youtube-2026-09-29.mp4');
const portrait = path.join(out, 'diecik-widok-klienta-iphone-demo-2026-09-29.mp4');

const sourceCues = [
  [0.4, 6.5, 'Panel specjalisty i najważniejsze zadania.'],
  [8, 19, 'Ustaw zakres pracy i ofertę dla klientów.'],
  [21, 30, 'Lista klientów prowadzi do ich kart.'],
  [31, 44, 'Gabinet: kalendarz, wizyty i dostępne terminy.'],
  [46, 61, 'Karta klienta zbiera wizyty, pomiary i wywiad.'],
  [63, 70, 'Dane klienta są pod ręką podczas pracy nad planem.'],
  [72, 91, 'Publiczny profil pomaga klientom poznać specjalistę.'],
  [93, 96.2, 'Prośby o wizytę i rezerwacje w jednym miejscu.'],
  [96.2, 106, 'Link Google Meet tworzy się automatycznie dla wizyt online.'],
  [108, 126, 'Szablony diet przyspieszają przygotowanie planu.'],
  [128, 140, 'Wybierz przepisy i przygotuj bazę posiłków.'],
  [141, 157, 'Utwórz pakiet dopasowany do klienta.'],
  [159, 173, 'Wczytaj szablon diety do pakietu.'],
  [175, 191, 'Sprawdź posiłki, składniki i wartości odżywcze.'],
  [193, 210, 'Przejrzyj zakres pakietu przed publikacją.'],
  [211, 216, 'Po publikacji plan trafia do klienta.'],
  [216, 218, 'Czat z klientem.'],
  [218, 245.4, 'Odpowiedz klientowi bez wychodzenia z panelu.'],
  [245.4, 249.5, 'Wyślij wiadomość i kontynuuj rozmowę.'],
];

function run(args, label) {
  process.stdout.write(label + '\n');
  const result = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(label + ': ffmpeg zakończył się kodem ' + result.status);
}
function xml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function svg(w, h, body) {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<defs><linearGradient id="dark" x2="1" y2="1"><stop stop-color="#082F35"/><stop offset="1" stop-color="#0B5864"/></linearGradient>' +
    '<linearGradient id="light" x2="1" y2="1"><stop stop-color="#F7FBF7"/><stop offset="1" stop-color="#C7F2E4"/></linearGradient>' +
    '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="16" stdDeviation="20" flood-opacity=".25"/></filter></defs>' +
    '<style>text{font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif}</style>' + body + '</svg>');
}
async function rounded(file, width, height, radius) {
  const mask = svg(width, height, '<rect width="' + width + '" height="' + height + '" rx="' + radius + '" fill="white"/>');
  return sharp(file).resize(width, height, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .png().composite([{ input: mask, blend: 'dest-in' }]).toBuffer();
}
async function art() {
  await Promise.all([fs.mkdir(out, { recursive: true }), fs.mkdir(temp, { recursive: true })]);
  const panelStill = path.join(temp, 'web-still.png');
  run(['-ss', '5', '-i', original, '-frames:v', '1', panelStill], 'Klatka panelu do planszy');
  const cleanToolbarFrame = path.join(temp, 'web-clean-toolbar-frame.png');
  run(['-ss', '247.5', '-i', original, '-frames:v', '1', cleanToolbarFrame], 'Czysta klatka końca nagrania');
  await sharp(cleanToolbarFrame).extract({ left: 940, top: 800, width: 490, height: 130 })
    .png().toFile(path.join(temp, 'web-clean-toolbar-patch.png'));
  const introBg = svg(1920, 1080,
    '<rect width="1920" height="1080" fill="url(#light)"/>' +
    '<circle cx="1900" cy="-70" r="470" fill="white" opacity=".42"/>' +
    '<rect x="118" y="350" width="120" height="8" rx="4" fill="#0C6F84"/>' +
    '<text x="118" y="465" font-size="76" font-weight="800" fill="#082F35">Diecik dla</text>' +
    '<text x="118" y="558" font-size="76" font-weight="800" fill="#082F35">specjalistów</text>' +
    '<text x="121" y="637" font-size="31" fill="#0C6F84">Od panelu do aplikacji klienta</text>' +
    '<rect x="1010" y="180" width="795" height="478" rx="24" fill="white" filter="url(#shadow)"/>' +
    '<rect x="1465" y="420" width="310" height="608" rx="38" fill="white" filter="url(#shadow)"/>' +
    '<rect x="127" y="816" width="491" height="80" rx="40" fill="#082F35"/>' +
    '<text x="373" y="869" text-anchor="middle" font-size="27" font-weight="700" fill="white">DLA DIETETYKÓW I TRENERÓW</text>');
  const introLayers = [
    { input: await rounded(panelStill, 763, 447, 15), left: 1026, top: 195 },
    { input: await rounded(day, 265, 575, 27), left: 1487, top: 436 },
    { input: await sharp(logo).resize(142, 142, { fit: 'contain' }).png().toBuffer(), left: 110, top: 74 },
  ];
  await sharp(introBg).composite(introLayers).png().toFile(path.join(temp, 'intro.png'));

  function mobileBackground(overview) {
    const names = overview
      ? ['Owsianka z borówkami i siemieniem', 'Jabłko ze skyrem i orzechami',
        'Penne z indykiem i groszkiem', 'Kefir z kiwi i migdałami', 'Tortilla z twarożkiem']
      : ['Otwórz przepis', 'Sprawdź składniki', 'Przejdź do kolejnego dnia'];
    const list = names.map((name, index) => {
      const y = (overview ? 508 : 572) + index * (overview ? 91 : 105);
      return '<circle cx="143" cy="' + (y - 10) + '" r="21" fill="#D2F56F"/>' +
        '<text x="143" y="' + (y - 2) + '" text-anchor="middle" font-size="21" font-weight="800" fill="#082F35">' + (index + 1) + '</text>' +
        '<text x="188" y="' + y + '" font-size="31" font-weight="600" fill="white">' + xml(name) + '</text>';
    }).join('');
    return svg(1920, 1080,
      '<rect width="1920" height="1080" fill="url(#dark)"/>' +
      '<circle cx="1405" cy="894" r="500" fill="#0C6F84" opacity=".34"/>' +
      '<rect x="122" y="105" width="284" height="52" rx="26" fill="#D2F56F"/>' +
      '<text x="264" y="140" text-anchor="middle" font-size="25" font-weight="800" letter-spacing="1.5" fill="#082F35">WIDOK KLIENTA</text>' +
      '<text x="121" y="260" font-size="70" font-weight="800" fill="white">' + (overview ? 'Cały dzień' : 'Plan w aplikacji') + '</text>' +
      '<text x="121" y="342" font-size="70" font-weight="800" fill="white">od specjalisty</text>' +
      '<text x="127" y="423" font-size="29" fill="#B7D9D5">' +
      (overview ? '29 września 2026 · pięć posiłków' : 'Przepis, składniki i kolejne dni') + '</text>' +
      list + '<rect x="1325" y="45" width="470" height="990" rx="48" fill="white" filter="url(#shadow)"/>');
  }
  await sharp(mobileBackground(true)).composite([{ input: await rounded(day, 430, 935, 28), left: 1345, top: 72 }])
    .png().toFile(path.join(temp, 'phone-overview.png'));
  await sharp(mobileBackground(false)).png().toFile(path.join(temp, 'phone-live-bg.png'));

  const outroBg = svg(1920, 1080,
    '<rect width="1920" height="1080" fill="url(#dark)"/>' +
    '<circle cx="1860" cy="0" r="470" fill="#0C6F84" opacity=".42"/>' +
    '<rect x="815" y="175" width="290" height="230" rx="30" fill="white" filter="url(#shadow)"/>' +
    '<text x="960" y="550" text-anchor="middle" font-size="71" font-weight="800" fill="white">Diecik dla specjalistów</text>' +
    '<text x="960" y="628" text-anchor="middle" font-size="33" fill="#B7D9D5">Dla dietetyków i trenerów</text>' +
    '<rect x="548" y="704" width="824" height="97" rx="48" fill="#D2F56F"/>' +
    '<text x="960" y="769" text-anchor="middle" font-size="37" font-weight="800" fill="#082F35">diecik.com/specjalista</text>' +
    '<text x="960" y="857" text-anchor="middle" font-size="31" font-weight="600" fill="#B7D9D5">Umów prezentację</text>' +
    '<text x="960" y="914" text-anchor="middle" font-size="42" font-weight="700" fill="white">kontakt@diecik.com</text>');
  await sharp(outroBg).composite([
    { input: await sharp(logo).resize(205, 205, { fit: 'contain' }).png().toBuffer(), left: 858, top: 188 },
  ]).png().toFile(path.join(temp, 'outro.png'));
  await sharp(path.join(temp, 'intro.png')).resize(1280, 720)
    .jpeg({ quality: 93, chromaSubsampling: '4:4:4' })
    .toFile(path.join(out, 'diecik-specjalista-miniatura.jpg'));
}
function time(seconds, ass = false) {
  const n = Math.round(seconds * (ass ? 100 : 1000));
  const unit = ass ? 100 : 1000;
  const h = Math.floor(n / (unit * 3600));
  const m = Math.floor((n % (unit * 3600)) / (unit * 60));
  const s = Math.floor((n % (unit * 60)) / unit);
  const f = n % unit;
  return (ass ? String(h) : String(h).padStart(2, '0')) + ':' + String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0') + (ass ? '.' + String(f).padStart(2, '0') : ',' + String(f).padStart(3, '0'));
}
async function captions() {
  const map = (second) => {
    if (second <= typing.firstStart) return second;
    if (second <= typing.firstEnd) return typing.firstStart + (second - typing.firstStart) / typingSpeed;
    const afterFirst = typing.firstStart + (typing.firstEnd - typing.firstStart) / typingSpeed;
    if (second <= typing.secondEnd) return afterFirst + (second - typing.secondStart) / typingSpeed;
    return afterFirst + (typing.secondEnd - typing.secondStart) / typingSpeed + (second - typing.secondEnd);
  };
  const web = sourceCues.map(([start, end, content]) => [map(start), map(end), content]);
  const full = [
    [0, introDuration, 'Diecik dla specjalistów. Od panelu do aplikacji klienta.'],
    ...web.map(([start, end, content]) => [start + introDuration, end + introDuration, content]),
    [phoneAt, phoneAt + overviewDuration, 'Plan od specjalisty: cały dzień i pięć posiłków na jednym ekranie.'],
    [phoneAt + overviewDuration, phoneAt + overviewDuration + phoneDuration,
      'Klient może otworzyć przepis, sprawdzić składniki i kolejne dni.'],
    [duration - outroDuration, duration, 'Diecik dla specjalistów. Umów prezentację: kontakt@diecik.com.'],
  ];
  const srt = full.map(([start, end, content], index) => String(index + 1) + '\n' +
    time(start) + ' --> ' + time(end) + '\n' + content + '\n').join('\n');
  await fs.writeFile(path.join(out, 'diecik-specjalista-napisy-pl.srt'), srt);
  const header = [
    '[Script Info]', 'Title: Diecik dla specjalistów', 'ScriptType: v4.00+',
    'PlayResX: 1920', 'PlayResY: 1080', 'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Caption,Avenir Next,42,&H00FFFFFF,&H00FFFFFF,&H00082F35,&H00082F35,-1,0,0,0,100,100,0,0,1,2,0,2,70,70,31,1',
    '', '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const ass = header.concat(web.map(([start, end, content]) =>
    'Dialogue: 0,' + time(start, true) + ',' + time(end, true) + ',Caption,,0,0,0,,' + content)).join('\n') + '\n';
  await fs.writeFile(path.join(temp, 'web-captions.ass'), ass);
  return full.length;
}
const videoOptions = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-r', String(fps), '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'];
function still(name, length, dest) {
  run(['-loop', '1', '-framerate', '30', '-i', path.join(temp, name + '.png'),
    '-frames:v', String(Math.round(length * fps)), '-an', ...videoOptions, dest], 'Render: ' + name);
}
async function concat(files, dest) {
  const list = path.join(temp, path.basename(dest) + '.txt');
  await fs.writeFile(list, files.map((file) => "file '" + file.replaceAll("'", "'\\''") + "'").join('\n') + '\n');
  run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', dest], 'Łączenie scen');
}
function renderWeb(dest) {
  const filter = '[0:v]trim=start=0:end=' + typing.firstStart + ',setpts=PTS-STARTPTS,fps=30[a];' +
    '[0:v]trim=start=' + typing.firstStart + ':end=' + typing.firstEnd +
      ',setpts=(PTS-STARTPTS)/' + typingSpeed + ',fps=30[b];' +
    '[0:v]trim=start=' + typing.secondStart + ':end=' + typing.secondEnd +
      ',setpts=(PTS-STARTPTS)/' + typingSpeed + ',fps=30[c];' +
    '[0:v]trim=start=' + typing.secondEnd + ':end=' + webSourceDuration +
      ',setpts=PTS-STARTPTS,fps=30[d];' +
    '[a][b][c][d]concat=n=4:v=1:a=0,pad=1920:1080:0:0:color=0x082F35[web];' +
    "[web][1:v]overlay=940:800:enable='between(t,226.5,228)':shortest=1,ass=" +
    path.join(temp, 'web-captions.ass') + ',format=yuv420p[v]';
  run(['-i', original, '-loop', '1', '-framerate', '30', '-i', path.join(temp, 'web-clean-toolbar-patch.png'),
    '-filter_complex', filter, '-map', '[v]', '-frames:v', String(Math.round(webDuration * fps)),
    '-an', ...videoOptions, dest], 'Render: cały film panelu z napisami');
}
function renderPhone(dest) {
  run(['-i', phone,
    '-loop', '1', '-framerate', '30', '-i', path.join(temp, 'phone-live-bg.png'),
    '-filter_complex', '[0:v]trim=start=' + phoneTrim.start + ':end=' + phoneTrim.end +
      ',setpts=PTS-STARTPTS,fps=30,scale=430:935:flags=lanczos,setsar=1,format=rgba[ui];' +
      '[1:v][ui]overlay=1345:72:shortest=1,format=yuv420p[v]',
    '-map', '[v]', '-frames:v', String(Math.round(phoneDuration * fps)), '-an', ...videoOptions, dest],
  'Render: aktualny plan klienta');
}
function audioFilter() {
  return '[1:a]volume=.72,highpass=f=95,lowpass=f=10500[g];' +
    '[2:a]volume=.30,highpass=f=42,lowpass=f=420[b];' +
    '[3:a]volume=.34,highpass=f=65,lowpass=f=9200[d];' +
    '[4:a]volume=.12,highpass=f=170,lowpass=f=7600[s];' +
    '[g][b][d][s]amix=inputs=4:duration=longest:normalize=0,' +
    'acompressor=threshold=.18:ratio=2.2:attack=20:release=220:makeup=1,' +
    'loudnorm=I=-18:LRA=7:TP=-2,afade=t=in:st=0:d=1.2,' +
    'afade=t=out:st=' + (duration - 2.5) + ':d=2.5,atrim=0:' + duration + ',asetpts=PTS-STARTPTS[a]';
}
async function hash(file) {
  return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
}
async function main() {
  await art();
  const cueCount = await captions();
  const segments = Array.from({ length: 5 }, (_unused, index) =>
    path.join(temp, 'segment-' + String(index).padStart(2, '0') + '.mp4'));
  still('intro', introDuration, segments[0]);
  renderWeb(segments[1]);
  still('phone-overview', overviewDuration, segments[2]);
  renderPhone(segments[3]);
  still('outro', outroDuration, segments[4]);
  const silent = path.join(temp, 'master-silent.mp4');
  await concat(segments, silent);
  const audioInputs = loopFiles.flatMap((file) => ['-stream_loop', '-1', '-i', file]);
  const musicMaster = path.join(temp, 'master-music.mp4');
  run(['-i', silent, ...audioInputs, '-filter_complex', audioFilter(), '-map', '0:v:0', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', String(duration), '-movflags', '+faststart', musicMaster], 'Miks muzyki i master YouTube');
  await fs.rename(musicMaster, master);

  const verticalStill = path.join(temp, 'vertical-overview.mp4');
  const verticalLive = path.join(temp, 'vertical-live.mp4');
  run(['-loop', '1', '-framerate', '30', '-i', day,
    '-vf', 'scale=884:1920:flags=lanczos,pad=1080:1920:98:0:color=0x082F35,format=yuv420p',
    '-frames:v', String(Math.round(overviewDuration * fps)), '-an', ...videoOptions, verticalStill],
  'Pionowy kadr całego dnia');
  run(['-i', phone,
    '-vf', 'trim=start=' + phoneTrim.start + ':end=' + phoneTrim.end +
      ',setpts=PTS-STARTPTS,fps=30,scale=884:1920:flags=lanczos,setsar=1,' +
      'pad=1080:1920:98:0:color=0x082F35,format=yuv420p',
    '-frames:v', String(Math.round(phoneDuration * fps)), '-an', ...videoOptions, verticalLive],
  'Pionowe ujęcie planu');
  const verticalSilent = path.join(temp, 'vertical-silent.mp4');
  await concat([verticalStill, verticalLive], verticalSilent);
  run(['-i', verticalSilent, '-ss', String(phoneAt), '-t', String(overviewDuration + phoneDuration),
    '-i', master, '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-movflags', '+faststart', portrait],
  'Pionowy klip z muzyką');

  const manifest = {
    project: 'Diecik /specjalista', date: '2026-09-29', totalSeconds: duration,
    webSourceDurationSeconds: webSourceDuration, webCutSeconds: cut,
    webSourceKeptSeconds: webSourceKept, webRenderedSeconds: webDuration,
    webCaptureToolbarPatch: { sourceFrameSeconds: 247.5, renderedRangeSeconds: [226.5, 228],
      rectangle: { x: 940, y: 800, width: 490, height: 130 } },
    chatTypingSpeed: { factor: typingSpeed, sourceRanges: [
      [typing.firstStart, typing.firstEnd], [typing.secondStart, typing.secondEnd]],
      sendNormalSpeedSourceRange: [typing.secondEnd, webSourceDuration] },
    mobileRawSeconds: phoneTrim,
    mobileOverview: 'Pięć rzeczywistych posiłków z 29 września 2026, złożonych z przewinięć tego samego dnia.',
    sources: [
      { file: path.relative(campaign, original), sha256: await hash(original) },
      { file: path.relative(campaign, phone), sha256: await hash(phone) },
      { file: path.relative(campaign, day), sha256: await hash(day) },
    ],
    scenes: [
      { kind: 'intro', duration: introDuration },
      { kind: 'web', sourceRanges: [[0, cut.start], [cut.end, webSourceDuration]],
        speedRanges: [[typing.firstStart, typing.firstEnd, typingSpeed],
          [typing.secondStart, typing.secondEnd, typingSpeed]], duration: webDuration },
      { kind: 'phoneOverview', duration: overviewDuration },
      { kind: 'phoneLive', sourceRange: [phoneTrim.start, phoneTrim.end], duration: phoneDuration },
      { kind: 'outro', duration: outroDuration },
    ],
    captions: { language: 'pl', embeddedInVideo: true, srtCues: cueCount },
    music: { type: 'Diecik mix from Apple Loops', sources: loopFiles.map((file) => path.basename(file)),
      license: '../meta-start-aplikacji/meta/audio/LICENSES.md' },
    outputs: await Promise.all([master, portrait,
      path.join(out, 'diecik-specjalista-miniatura.jpg'),
      path.join(out, 'diecik-specjalista-napisy-pl.srt')]
      .map(async (file) => ({ file: path.basename(file), sha256: await hash(file) }))),
  };
  await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write('Gotowe: ' + master + '\n');
}
await main();
