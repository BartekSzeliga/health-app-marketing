import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

// Deterministic editorial composition. All app pixels come from the native
// captures; the renderer adds camera framing, typography and a device rim only.
const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previous = path.resolve(root, '../diecik-brand-v11-2026-10-02');
const tools = path.resolve(root, '../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg = require(path.join(tools, 'ffmpeg-static'));
const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const variant = arg('--variant', 'recipes');
const mode = arg('--mode', 'preview');
const size = Number(arg('--width', '1440'));
const W = size, H = size * 16 / 9, SCALE = W / 1080, FPS = 30;
if (![1080, 1440].includes(W) || !Number.isInteger(H)) throw new Error('Supported output: 1080 or 1440 wide, 9:16.');
if (!['prepare', 'preview', 'proof', 'final'].includes(mode)) throw new Error('Unknown render mode.');
const DURATION = mode === 'proof' ? 8 : 20;
const Q = path.join(root, 'qa/video-r2');
await fs.mkdir(Q, { recursive: true });

const C = { pine: '#153630', deep: '#0C211D', cream: '#F6F5EF', lime: '#DAF2A5', mint: '#E3F0DD' };
const films = {
  recipes: {
    stem: 'Diecik-pomysl-na-posilek-Reels-Stories-20s', native: 'recipes',
    source: 'assets/footage/recipes-salad-6707753.mp4',
    bpm: 120, audio: 'audio/diecik-recipes-groove-r2-20s-120bpm.wav',
    sourceStart: 1, crop: null, offset: 470, light: false,
    hook: ['Co dziś', 'zjeść?'], hookSize: 112,
    intro: 'Przepisy na co dzień.', title: 'Pomysł na posiłek.',
    subtitle: 'Zajrzyj do przepisów w Dieciku.',
    detailTitle: 'Zobacz, co ugotować.',
    result: ['Mniej szukania.', 'Więcej pomysłów.'],
    final: ['Pomysł na posiłek.', 'W Twoim telefonie.'],
    detail: { x: 30, y: 550, w: 1146, h: 1450 },
    meaning: 'Actual consumer recipe browsing screen, not a simulated generation result.',
  },
  diet: {
    stem: 'Diecik-kalorie-i-makro-Reels-Stories-20s', native: 'diet',
    fullNative: 'diet-plan',
    source: 'assets/footage/diet-kitchen-7198700.mp4',
    bpm: 124, audio: 'audio/diecik-diet-groove-r2-20s-124bpm.wav',
    sourceStart: .2, crop: [608, 1080, 900, 0], offset: 490, light: true,
    hook: ['Kalorie, makro', 'i mikroskładniki.'], hookSize: 96,
    intro: 'Podsumowanie zaplanowanych posiłków.',
    title: 'Kalorie, makro i mikroskładniki.', subtitle: 'Podsumowanie zaplanowanych posiłków.',
    detailTitle: 'Zobacz podsumowanie swojego planu.',
    result: ['Zobacz podsumowanie', 'swojego planu.'],
    final: ['Kalorie, makro', 'i mikroskładniki.'],
    detail: { x: 30, y: 1010, w: 1146, h: 1020 },
    meaning: 'Actual own planned diet day and nutritional totals of planned meals, not proof of eating or automatic food logging. No invented numbers.',
  },
  training: {
    stem: 'Diecik-plan-treningu-Reels-Stories-20s', native: 'training',
    source: 'assets/footage/training-gym-12188782.mp4',
    bpm: 136, audio: 'audio/diecik-training-groove-r2-20s-136bpm.wav',
    sourceStart: .5, crop: null, offset: 0, light: false,
    hook: ['Co ćwiczę', 'dzisiaj?'], hookSize: 104,
    intro: 'Twój plan. Jasny punkt wyjścia.',
    title: 'Plan na dzisiejszy trening.', subtitle: 'Ćwiczenia w jednym miejscu.',
    detailTitle: 'Zobacz swój plan.',
    result: ['Twój trening.', 'Zawsze pod ręką.'],
    final: ['Plan treningu.', 'W Twoim telefonie.'],
    detail: { x: 45, y: 1020, w: 1116, h: 1070 },
    meaning: 'Actual consumer training plan; stock exercise is illustrative, not a testimonial.',
  },
};
const film = films[variant];
if (!film) throw new Error('Choose recipes, diet or training.');
const bar = count => Math.round(count * 240 / film.bpm * FPS) / FPS;
const edit = {
  hookCut: bar(1), full: bar(2), settled: bar(2) + .5,
  detail: bar(variant === 'training' ? 4.5 : 4), detailSettled: bar(variant === 'training' ? 4.5 : 4) + .55,
  micro: variant === 'diet' ? bar(6) : null,
  result: variant === 'training' ? bar(7) : bar(6),
  cta: variant === 'training' ? bar(9) : bar(8),
};
const stock = path.resolve(root, film.source);
const background = path.join(Q, `${variant}-background-r2-${variant === 'training' ? 'feather-' : ''}${W}.mp4`);

async function run(binary, parameters, { binaryOutput = false } = {}) {
  const p = spawn(binary, parameters, { stdio: ['ignore', 'pipe', 'pipe'] });
  const chunks = []; let err = '';
  p.stdout.on('data', d => chunks.push(d));
  p.stderr.on('data', d => { err += d; });
  const [code] = await once(p, 'close');
  if (code) throw new Error(`${path.basename(binary)} (${code}): ${err}`);
  return { output: binaryOutput ? Buffer.concat(chunks) : Buffer.concat(chunks).toString(), err };
}

async function prepareBackground() {
  try { await fs.access(background); return; } catch {}
  const crop = film.crop ? `crop=${film.crop.join(':')},` : '';
  const offset = Math.round(film.offset * SCALE);
  const dir = path.join(Q, `${variant}-background-shots`); await fs.mkdir(dir, { recursive: true });
  const productEnd = variant === 'diet' ? edit.cta : edit.result;
  const shots = [
    { from: 0, to: edit.hookCut, source: film.sourceStart, kind: 'human' },
    { from: edit.hookCut, to: edit.full, source: variant === 'training' ? 11 : film.sourceStart + 3, kind: 'human' },
    { from: edit.full, to: productEnd, source: variant === 'training' ? 4 : 1, kind: 'product' },
    ...(variant === 'diet' ? [] : [{ from: edit.result, to: edit.cta, source: variant === 'training' ? 13 : 8, kind: 'human' }]),
    { from: edit.cta, to: 20, source: 0, kind: 'studio' },
  ];
  const files = [];
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i], output = path.join(dir, `${i}.mp4`);
    const frameCount = Math.round(shot.to * FPS) - Math.round(shot.from * FPS);
    const input = shot.kind === 'studio' ? ['-f', 'lavfi', '-i', `color=c=0x153630:s=${W}x${H}:r=${FPS}`] : ['-stream_loop', '-1', '-ss', String(shot.source), '-i', stock];
    const grade = 'eq=saturation=0.98:contrast=1.035:brightness=0.004';
    let filter;
    if (shot.kind === 'studio') {
      filter = ['-vf', 'setsar=1,format=yuv420p'];
    } else if (variant === 'training') {
      const foregroundH = Math.round(W * 2160 / 2240), foregroundY = Math.round(510 * SCALE);
      const feather = Math.round(42 * SCALE);
      const complex = `[0:v]split=2[base][pair];[base]crop=1216:2160:1500:0,scale=${W}:${H},gblur=sigma=${Math.round(30 * SCALE)}[b];` +
        `[pair]crop=2240:2160:1000:0,scale=${W}:${foregroundH},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*min(1,min(Y/${feather},(H-1-Y)/${feather}))'[f];[b][f]overlay=0:${foregroundY}:format=auto,setsar=1,fps=${FPS},${grade}` +
        `${shot.kind === 'product' ? `,gblur=sigma=${Math.round(14 * SCALE)}` : ''},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`;
      filter = ['-filter_complex', complex, '-map', '[v]'];
    } else {
      const reposition = shot.kind === 'human' ? `pad=${W}:${H + offset}:0:${offset}:color=${film.light ? '0xF6F5EF' : '0x153630'},crop=${W}:${H}:0:0,` : '';
      const filters = `${crop}scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS},${reposition}${grade}` +
        `${shot.kind === 'product' ? `,gblur=sigma=${Math.round(14 * SCALE)}` : ''},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`;
      filter = ['-vf', filters];
    }
    console.log(`Prepare ${variant} shot ${i + 1}/${shots.length}: ${shot.from.toFixed(2)}–${shot.to.toFixed(2)}s`);
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...input, '-an', ...filter, '-frames:v', String(frameCount),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-r', String(FPS), '-g', '30', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', output]);
    files.push(output);
  }
  const list = path.join(dir, 'concat.txt'); await fs.writeFile(list, files.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n') + '\n');
  const temp = background.replace('.mp4', '.rendering.mp4');
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', temp]);
  await fs.rename(temp, background);
}
await prepareBackground();
if (mode === 'prepare') process.exit(0);

const nativePath = path.join(root, `assets/native/${film.native}.png`);
const nativeBytes = await fs.readFile(nativePath);
const native = await loadImage(nativeBytes);
const fullNativePath = path.join(root, `assets/native/${film.fullNative ?? film.native}.png`);
const fullNativeBytes = fullNativePath === nativePath ? nativeBytes : await fs.readFile(fullNativePath);
const fullNative = fullNativePath === nativePath ? native : await loadImage(fullNativeBytes);
const sourceHash = bytes => createHash('sha256').update(bytes).digest('hex');
const icon = await loadImage(path.join(previous, 'assets/diecik-icon.png'));
const microPath = variant === 'diet' ? path.join(root, 'assets/native/diet-micro.png') : null;
const microBytes = microPath ? await fs.readFile(microPath) : null;
const microImage = microBytes ? await loadImage(microBytes) : null;
const microRect = { x: 30, y: 1208, w: 1146, h: 1037 };
let nativeFlow = null;
if (variant === 'diet') {
  const file = path.join(root, 'assets/native/diet-summary-flow.mp4');
  const probe = path.join(tools, '@ffprobe-installer/darwin-arm64/ffprobe');
  const info = JSON.parse((await run(probe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', file])).output);
  const times = info.frames.map(frame => Number(frame.best_effort_timestamp_time));
  if (!times.length || times.some((time, i) => !Number.isFinite(time) || (i > 0 && time < times[i - 1]))) throw new Error('Invalid native video timestamps.');
  const dir = path.join(Q, 'diet-native-frames'); await fs.mkdir(dir, { recursive: true });
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vf', 'scale=1000:-1', '-vsync', '0', path.join(dir, 'frame-%03d.png')]);
  const frames = await Promise.all(times.map((time, i) => loadImage(path.join(dir, `frame-${String(i + 1).padStart(3, '0')}.png`))));
  nativeFlow = { file, sha256: sourceHash(await fs.readFile(file)), times, frames };
}
let nativeSpec = {};
try { nativeSpec = JSON.parse(await fs.readFile(path.join(root, 'assets/native/video-crops.json'), 'utf8')); } catch {}
const detailRect = nativeSpec[variant]?.detail ?? film.detail ?? { x: 0, y: Math.round(native.height * .16), w: native.width, h: Math.round(native.height * .49) };
if (detailRect.x < 0 || detailRect.y < 0 || detailRect.w <= 0 || detailRect.h <= 0 || detailRect.x + detailRect.w > native.width || detailRect.y + detailRect.h > native.height) throw new Error('Detail crop is outside the authentic capture.');
const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
const audits = [];
const clamp = x => Math.max(0, Math.min(1, x));
const progress = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => x * x * (3 - 2 * x);
const out = x => 1 - (1 - x) ** 3;
const lerp = (a, b, p) => a + (b - a) * p;
const rgba = (hex, a) => `${hex}${Math.round(clamp(a) * 255).toString(16).padStart(2, '0')}`;
function round(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fill(color, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, 1080, 1920); ctx.restore(); }
function caption(text, x, y, size, { color = C.cream, family = 'Avenir Next', weight = 700, align = 'left', alpha = 1, primary = true } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.font = `${weight} ${size}px "${family}"`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
  const m = ctx.measureText(text);
  if (m.width > 930) throw new Error(`Wrap caption instead of squeezing: ${text} / ${m.width}`);
  const box = { text, x: x - m.actualBoundingBoxLeft, y: y - m.actualBoundingBoxAscent, right: x + m.actualBoundingBoxRight, bottom: y + m.actualBoundingBoxDescent };
  if (primary && (box.x < 64.8 || box.right > 1015.2 || box.y < 268.8 || box.bottom > 1248)) throw new Error(`Caption exceeds shared Reels safe zone: ${JSON.stringify(box)}`);
  if (primary) audits.push(box);
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}
function brand(x, y, size, { alpha = 1, center = false, color = C.cream } = {}) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `700 ${size}px "Avenir Next"`;
  const iw = size * .94, gap = size * .2, word = ctx.measureText('Diecik').width;
  const bx = center ? x - (iw + gap + word) / 2 : x;
  ctx.save(); round(bx, y - iw * .75, iw, iw, iw * .23); ctx.clip(); ctx.drawImage(icon, bx, y - iw * .75, iw, iw); ctx.restore();
  caption('Diecik', bx + iw + gap, y, size, { color, alpha }); ctx.restore();
}
function veil(t, light, strength) {
  const base = light ? C.cream : C.deep;
  const g = ctx.createLinearGradient(0, 0, 1080, 1920);
  g.addColorStop(0, rgba(base, Math.min(.97, strength + .1)));
  g.addColorStop(.65, rgba(base, strength)); g.addColorStop(1, rgba(base, Math.max(.38, strength - .12)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
}
function phone({ x = 540, y = 1145, h = 1310, rotation = 0, alpha = 1, zoom = 0, actualFrame = null, detailImage = native, cameraRect = detailRect, contextImage = fullNative } = {}) {
  if (alpha <= 0) return;
  const sourceImage = actualFrame ?? (zoom > 0 ? detailImage : contextImage);
  const src = { x: lerp(0, cameraRect.x, zoom), y: lerp(0, cameraRect.y, zoom), w: lerp(sourceImage.width, cameraRect.w, zoom), h: lerp(sourceImage.height, cameraRect.h, zoom) };
  const zoomHeight = Math.min(960, 980 * cameraRect.h / cameraRect.w);
  const height = lerp(h, zoomHeight, zoom), width = height * src.w / src.h;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rotation);
  const rim = lerp(13, 7, zoom), radius = lerp(55, 32, zoom);
  ctx.shadowColor = 'rgba(0,12,8,.35)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 22;
  const bezel = ctx.createLinearGradient(-width / 2, 0, width / 2, 0); bezel.addColorStop(0, '#092D24'); bezel.addColorStop(.45, '#779689'); bezel.addColorStop(1, '#0D211D');
  ctx.fillStyle = bezel; round(-width / 2 - rim, -height / 2 - rim, width + rim * 2, height + rim * 2, radius + rim); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); round(-width / 2, -height / 2, width, height, radius); ctx.clip(); ctx.drawImage(sourceImage, src.x, src.y, src.w, src.h, -width / 2, -height / 2, width, height); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 2; round(-width / 2 - rim + 2, -height / 2 - rim + 2, width + 2 * rim - 4, height + 2 * rim - 4, radius + rim); ctx.stroke();
  ctx.restore();
}
function studio(t) {
  fill(C.pine);
  const g = ctx.createRadialGradient(850 + 55 * Math.sin(t * .4), 1530, 40, 600, 1200, 1200);
  g.addColorStop(0, '#2D5F48'); g.addColorStop(.62, '#173D31'); g.addColorStop(1, '#0E2822'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  ctx.save(); ctx.globalAlpha = .09; ctx.strokeStyle = C.lime; ctx.lineWidth = 1.3; ctx.translate(580, 1500); ctx.rotate(-.3 + t * .018); ctx.beginPath(); ctx.ellipse(0, 0, 600, 880, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.scale(SCALE, SCALE);
  const ink = film.light ? C.pine : C.cream;
  if (t < edit.full) {
    const p = out(progress(t, .02, .42)), enter = out(progress(t, .28, 1.03));
    const top = ctx.createLinearGradient(0, 0, 0, 1000);
    top.addColorStop(0, rgba(film.light ? C.cream : C.pine, 1)); top.addColorStop(.55, rgba(film.light ? C.cream : C.pine, .98)); top.addColorStop(1, rgba(film.light ? C.cream : C.pine, 0));
    ctx.fillStyle = top; ctx.fillRect(0, 0, 1080, 1100);
    brand(86, 340, 46, { color: ink, alpha: p });
    film.hook.forEach((line, i) => caption(line, 82, 476 + i * 117 + (1 - p) * 14, film.hookSize, { family: 'Baskerville', weight: 400, color: ink, alpha: p }));
    caption(film.intro, 87, 685 + (1 - p) * 8, variant === 'diet' ? 36 : 38, { color: ink, weight: 700, alpha: p });
    // Real full screen is visible during the opening; no mock data or taps.
    phone({ x: lerp(1150, 785, enter), y: lerp(1550, variant === 'training' ? 1480 : 1340, enter), h: variant === 'training' ? 850 : 1010, rotation: lerp(.14, -.035, enter), alpha: enter });
  } else if (t < (variant === 'diet' ? edit.cta : edit.result)) {
    const p = out(progress(t, edit.full, edit.settled));
    veil(t, film.light, film.light ? .88 : .83);
    const textColor = film.light ? C.pine : C.cream;
    const micro = variant === 'diet' && t >= edit.micro;
    if (variant === 'diet' && !micro) {
      caption('Kalorie, makro', 540, 342, 66, { align: 'center', color: textColor, alpha: p });
      caption('i mikroskładniki.', 540, 418, 66, { align: 'center', color: textColor, alpha: p });
      caption(film.subtitle, 540, 485, 34, { align: 'center', color: textColor, alpha: p });
    } else {
      caption(micro ? 'Także mikroskładniki.' : film.title, 540, 357, variant === 'training' ? 60 : 70, { align: 'center', color: textColor, alpha: p });
      caption(film.subtitle, 540, 424, 36, { align: 'center', color: textColor, alpha: p });
    }
    const zoom = smooth(progress(t, edit.detail, edit.detailSettled));
    let actualFrame = null;
    if (nativeFlow && t >= edit.settled && t <= edit.detail) {
      const sourceTime = 3 + (t - edit.settled);
      let frameIndex = 0;
      for (let i = 1; i < nativeFlow.times.length && nativeFlow.times[i] <= sourceTime; i++) frameIndex = i;
      actualFrame = nativeFlow.frames[frameIndex];
    }
    if (micro) {
      const enter = out(progress(t, edit.micro, edit.micro + .25));
      phone({ x: 540 + 35 * (1 - enter), y: 1110, zoom: 1, alpha: enter, detailImage: microImage, cameraRect: microRect, contextImage: microImage });
    } else {
      phone({ x: 540 + (1 - p) * 245, y: lerp(variant === 'diet' ? 1190 : 1150, 1080, zoom) + (1 - p) * 80, h: variant === 'diet' ? 1270 : 1310, zoom, alpha: p, actualFrame });
    }
    if (t > edit.detailSettled && variant !== 'diet') caption(film.detailTitle, 540, 525, 42, { align: 'center', color: textColor, alpha: smooth(progress(t, edit.detailSettled, edit.detailSettled + .25)) });
  } else if (t < edit.cta) {
    const p = out(progress(t, edit.result, edit.result + .28));
    const shade = ctx.createLinearGradient(0, 260, 0, 1480); shade.addColorStop(0, 'rgba(9,30,23,.93)'); shade.addColorStop(.5, 'rgba(9,30,23,.85)'); shade.addColorStop(1, 'rgba(9,30,23,.08)'); ctx.fillStyle = shade; ctx.fillRect(0, 0, 1080, 1920);
    film.result.forEach((line, i) => caption(line, 86, 455 + i * 106 + (1 - p) * 14, variant === 'recipes' ? 83 : 88, { family: 'Baskerville', weight: 400, alpha: p }));
    phone({ x: 790 + 130 * (1 - p), y: variant === 'training' ? 1480 : 1338, h: variant === 'training' ? 850 : 1010, rotation: -.035, alpha: p });
    brand(88, 699, 47, { alpha: p });
  } else {
    const p = out(progress(t, edit.cta, edit.cta + .32)); studio(t);
    brand(540, 460, 86, { center: true, alpha: p });
    film.final.forEach((line, i) => caption(line, 540, 655 + i * 94, 76, { family: 'Baskerville', weight: 400, align: 'center', alpha: p }));
    caption('Zacznij za darmo', 540, 917, 46, { align: 'center', color: C.mint, alpha: p });
    ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = C.lime; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; round(115, 977, 850, 132, 28); ctx.fill(); ctx.restore();
    caption('Pobierz Diecik', 540, 1064, 64, { align: 'center', color: C.pine, alpha: p });
    caption('iOS i Android', 540, 1207, 42, { align: 'center', color: C.mint, alpha: p });
    // Secondary product silhouette stays below the CTA, outside essential text.
    phone({ x: 540, y: 1840 + 70 * (1 - p), h: 930, rotation: .035, alpha: p * .95 });
  }
}

async function backgroundFrame(t) {
  const r = await run(ffmpeg, ['-v', 'error', '-ss', String(t), '-i', background, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { binaryOutput: true });
  return loadImage(r.output);
}
async function compositePreview(t, file) {
  const bg = await backgroundFrame(t); draw(t);
  const out = createCanvas(W, H), g = out.getContext('2d'); g.drawImage(bg, 0, 0, W, H); g.drawImage(canvas, 0, 0);
  await fs.writeFile(file, out.toBuffer('image/png'));
  return out;
}
const stamps = [1.3, 3.0, 6.2, 10.4, 13.8, 18.1];
const boardColumns = 3;
const board = createCanvas(360 * boardColumns, Math.ceil(stamps.length / boardColumns) * 680), boardCtx = board.getContext('2d');
boardCtx.fillStyle = C.cream; boardCtx.fillRect(0, 0, board.width, board.height);
for (let i = 0; i < stamps.length; i++) {
  const at = stamps[i], rendered = await compositePreview(at, path.join(Q, `${variant}-${at.toFixed(1)}s.png`));
  const x = i % boardColumns * 360, y = Math.floor(i / boardColumns) * 680;
  boardCtx.drawImage(rendered, x, y, 360, 640); boardCtx.font = '20px "Avenir Next"'; boardCtx.fillStyle = C.pine; boardCtx.fillText(`${at.toFixed(1)} s`, x + 15, y + 669);
}
await fs.writeFile(path.join(Q, `${variant}-storyboard-360.jpg`), board.toBuffer('image/jpeg', 93));
const creativeSpec = {
  revision: 2, variant, stem: film.stem, width: W, height: H, fps: FPS, duration: 20,
  source: film.source, stockIllustrative: true,
  native: path.relative(root, nativePath), fullScreenNative: path.relative(root, fullNativePath),
  nativeSourceSha256: sourceHash(nativeBytes), fullScreenNativeSha256: sourceHash(fullNativeBytes),
  nativeFlow: nativeFlow ? { file: path.relative(root, nativeFlow.file), sha256: nativeFlow.sha256, originalFrameTimes: nativeFlow.times, adInterval: [edit.settled, edit.detail], sourceStart: 3, speed: 1, finalCapturedFrameHeld: true, clicksSynthesized: false } : null,
  microSource: microPath ? { file: path.relative(root, microPath), sha256: sourceHash(microBytes), cameraRect: microRect, adInterval: [edit.micro, edit.cta] } : null,
  nativeMeaning: film.meaning, nativePixelsRepainted: false, clicksSimulated: false,
  sourceRect: detailRect,
  scenes: { hookAndEarlyFullScreen: [0, edit.full], stableFullScreen: [edit.settled, edit.detail], detailCamera: [edit.detail, variant === 'diet' ? edit.micro : edit.result], microProof: microPath ? [edit.micro, edit.cta] : null, result: variant === 'diet' ? null : [edit.result, edit.cta], cta: [edit.cta, 20], musicalCuts: edit },
  safeZone: { x: [64.8, 1015.2], y: [268.8, 1248], coordinateSystem: '1080x1920 design' },
  audioSource: film.audio, bpm: film.bpm,
  reusableStockAttribution: 'assets/footage/sources-r2.json', sampleTextBounds: audits,
};
await fs.writeFile(path.join(Q, `${variant}-creative-spec.json`), JSON.stringify(creativeSpec, null, 2) + '\n');
if (mode === 'preview') { console.log(`Preview ready: ${variant}-storyboard-360.jpg`); process.exit(0); }
if (mode === 'final' && !args.includes('--sources-approved')) throw new Error('Final render requires --sources-approved after the native captures and proof have been reviewed.');

const output = mode === 'proof' ? path.join(Q, `${variant}-proof-8s-${W}.mp4`) : path.join(root, 'DO_WGRANIA', `${film.stem}.mp4`);
const temporary = path.join(Q, `${variant}-${mode}-${W}.rendering.mp4`);
const audio = path.join(root, film.audio);
const command = ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-i', background, '-i', audio,
  '-filter_complex', '[1:v][0:v]overlay=0:0:format=auto,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1[v]',
  '-map', '[v]', '-map', '2:a:0', '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', '30',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(DURATION), '-movflags', '+faststart', temporary];
const encoder = spawn(ffmpeg, command, { stdio: ['pipe', 'ignore', 'pipe'] });
let errors = ''; encoder.stderr.on('data', d => { errors += d; }); encoder.stdin.on('error', () => {});
const completion = once(encoder, 'close');
const started = Date.now();
for (let n = 0; n < FPS * DURATION; n++) {
  draw(n / FPS); const pixels = ctx.getImageData(0, 0, W, H).data;
  if (!encoder.stdin.write(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength))) await Promise.race([once(encoder.stdin, 'drain'), completion.then(([code]) => { throw new Error(`Encoder stopped (${code}): ${errors}`); })]);
  if (n % 90 === 0) console.log(`${variant} ${mode}: ${n}/${FPS * DURATION} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
encoder.stdin.end(); const [code] = await completion; if (code) throw new Error(errors);
await fs.rename(temporary, output);
const sha256 = createHash('sha256').update(await fs.readFile(output)).digest('hex');
await fs.writeFile(path.join(Q, `${variant}-${mode}-render.json`), JSON.stringify({ output: path.relative(root, output), sha256, width: W, height: H, fps: FPS, duration: DURATION, nativeSourceSha256: sourceHash(nativeBytes), fullScreenNativeSha256: sourceHash(fullNativeBytes), renderSeconds: (Date.now() - started) / 1000, errors }, null, 2) + '\n');
console.log(`Ready: ${output}`);
