import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

// App pixels are only uniformly scaled, clipped and photographed from the
// authentic captures. All interactions come from the recorded native app.
const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolRoot = path.resolve(root, '../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg = require(path.join(toolRoot, 'ffmpeg-static'));
const ffprobe = path.join(toolRoot, '@ffprobe-installer/darwin-arm64/ffprobe');
const argv = process.argv.slice(2);
const arg = (name, fallback) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback;
const variant = arg('--variant', 'deficit');
const mode = arg('--mode', 'representative');
const W = Number(arg('--width', '1440')), H = W * 16 / 9, S = W / 1080, FPS = 30;
if (!['deficit', 'generator'].includes(variant)) throw new Error('Choose --variant deficit or generator.');
if (!['representative', 'proof', 'final'].includes(mode)) throw new Error('Choose --mode representative, proof or final.');
if (![1080, 1440].includes(W) || !Number.isInteger(H)) throw new Error('Use 1440 or 1080 wide, 9:16.');
if (!GlobalFonts.has('Avenir Next') || !GlobalFonts.has('Baskerville')) throw new Error('The reference fonts are required.');
const Q = path.join(root, 'qa/video');
await fs.mkdir(Q, { recursive: true });
const C = { cream: '#F6F5EF', pine: '#153630', deep: '#0C211D', lime: '#DAF2A5', mint: '#E3F0DD', subdued: '#53645A' };
const variants = {
  deficit: {
    stem: 'Diecik-automatyczny-cel-kalorii-Reels-Stories-20s',
    bpm: 124, audio: 'audio/diecik-deficit-groove-20261021-20s-124bpm.wav',
    sources: ['profile-basics', 'profile-goal', 'profile-auto'], flow: 'profile-flow',
    hook: ['Ile kalorii', 'na Twój cel?'], hookSize: 110,
    intro: 'Ustaw cel. Zobacz propozycję kcal.',
    full: 'Cel + aktywność.', fullBody: 'Aplikacja proponuje cel kalorii.',
    detail: 'Twój cel kalorii.', detailBody: 'Wyliczony z ustawień profilu.',
    result: 'Punkt wyjścia do planowania.', resultBody: 'Przykładowe ustawienia w aplikacji.',
    end: ['Cel kalorii.', 'Wyliczony za Ciebie.'], endSize: 80,
    meaning: 'An estimated nutrition target proposed from the demonstrated profile and chosen goal/activity. Not a measurement of energy expenditure or a promised weight outcome.',
    initial: 'profile-basics', detailSource: 'profile-auto', resultSource: 'profile-auto',
  },
  generator: {
    stem: 'Diecik-generator-diety-Reels-Stories-20s',
    bpm: 126, audio: 'audio/diecik-generator-groove-20261021-20s-126bpm.wav',
    sources: ['generator-config', 'generator-macro', 'generator-preview', 'generator-preview-top', 'generator-saved', 'diet-saved'], flow: 'generator-flow',
    hook: ['Twój cel.', 'Twój jadłospis.'], hookSize: 106,
    intro: 'Ustaw preferencje. Wygeneruj dietę.',
    full: 'Ustaw swoją dietę.', fullBody: 'Wybierz parametry generatora.',
    detail: 'Zobacz gotowy podgląd.', detailBody: 'Przejrzyj posiłki przed zapisem.',
    result: 'Zapisz do swojej diety.', resultBody: 'Przykładowy plan w aplikacji.',
    end: ['Od celu', 'do jadłospisu.'], endSize: 88,
    meaning: 'A real generator configuration, real generated-plan preview and actual save to the individual diet. Example demo account; no promised result or timing.',
    initial: 'generator-macro', detailSource: 'generator-preview', resultSource: 'diet-saved',
  },
};
const v = variants[variant];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function run(binary, parameters) {
  const p = spawn(binary, parameters, { stdio: ['ignore', 'pipe', 'pipe'] });
  const buffers = []; let err = '';
  p.stdout.on('data', d => buffers.push(d)); p.stderr.on('data', d => { err += d; });
  const [code] = await once(p, 'close');
  if (code) throw new Error(`${path.basename(binary)} failed (${code}): ${err.slice(-4000)}`);
  return { text: Buffer.concat(buffers).toString(), err };
}
const native = {}, sourceManifest = [];
for (const name of v.sources) {
  const file = path.join(root, 'assets/native', `${name}.png`), bytes = await fs.readFile(file);
  native[name] = await loadImage(bytes);
  sourceManifest.push({ file: path.relative(root, file), sha256: hash(bytes), bytes: bytes.length, width: native[name].width, height: native[name].height });
}
const iconFile = path.resolve(root, '../diecik-brand-v11-2026-10-02/assets/diecik-icon.png');
const iconBytes = await fs.readFile(iconFile), icon = await loadImage(iconBytes);
sourceManifest.push({ file: path.relative(root, iconFile), sha256: hash(iconBytes), role: 'original brand icon' });

// The parent records source times only after observing the real interaction.
// Each segment plays at 1x. A cut can omit waiting, but never invent a tap,
// calculation or save. Detailed source metadata is retained beside the film.
let plan = {};
const planFile = path.join(root, 'assets/native/video-source-plan.json');
try { plan = JSON.parse(await fs.readFile(planFile, 'utf8'))[variant] ?? {}; } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (mode === 'final' && (!argv.includes('--sources-approved') || plan.reviewed !== true)) throw new Error('Final render requires reviewed source timecodes and --sources-approved.');
const sourceDetail = native[v.detailSource];
const crop = plan.detailCrop ?? (variant === 'deficit'
  ? { x: Math.round(sourceDetail.width * .079), y: Math.round(sourceDetail.height * .244), width: Math.round(sourceDetail.width * .842), height: Math.round(sourceDetail.height * .427) }
  : { x: 18, y: Math.round(sourceDetail.height * .20), width: sourceDetail.width - 36, height: Math.round(sourceDetail.height * .52) });
function checkCrop(image, rect) {
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0 || rect.x + rect.width > image.width || rect.y + rect.height > image.height) throw new Error('The photographic crop must be inside the authentic source.');
}
checkCrop(sourceDetail, crop);
const resultCrop = plan.resultCrop ?? crop;
if (variant === 'deficit') checkCrop(native[v.resultSource], resultCrop);
const clips = [];
const sourceClocks = new Map();
for (const [index, entry] of (plan.clips ?? []).entries()) {
  const input = path.join(root, 'assets/native', `${entry.source ?? v.flow}.mp4`), bytes = await fs.readFile(input);
  if (![entry.adStart, entry.adEnd, entry.sourceStart].every(Number.isFinite) || entry.adStart < 0 || entry.adEnd > 16.6 || entry.adStart >= entry.adEnd || entry.sourceStart < 0 || (entry.speed ?? 1) !== 1) throw new Error('Source clips must have valid ad times and real-time speed.');
  if (entry.holdFinalUntil !== undefined && (!Number.isFinite(entry.holdFinalUntil) || entry.holdFinalUntil < entry.adEnd || entry.holdFinalUntil > 16.6)) throw new Error('A final-frame hold needs a valid end time.');
  if (clips.some(c => entry.adStart < (c.holdFinalUntil ?? c.adEnd) && (entry.holdFinalUntil ?? entry.adEnd) > c.adStart)) throw new Error('Source clips may not overlap.');
  const info = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_entries', 'stream=width,height,duration:format=duration', '-select_streams', 'v:0', '-of', 'json', input])).text);
  const duration = Number(info.streams[0].duration ?? info.format.duration);
  if (entry.sourceStart + entry.adEnd - entry.adStart > duration + .05) throw new Error('Source clip runs beyond the actual recording.');
  if (!sourceClocks.has(input)) {
    const timestamps = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-select_streams', 'v:0', '-of', 'json', input])).text).frames.map(frame => Number(frame.best_effort_timestamp_time));
    if (timestamps.some(time => !Number.isFinite(time))) throw new Error('Native source has an invalid frame timestamp.');
    const epochs = []; let first = 0;
    for (let i = 1; i <= timestamps.length; i++) if (i === timestamps.length || timestamps[i] < timestamps[i - 1]) {
      epochs.push({ firstFrame: first, lastFrame: i - 1, firstPts: timestamps[first], lastPts: timestamps[i - 1] }); first = i;
    }
    sourceClocks.set(input, { epochs, originalFrameCount: timestamps.length });
  }
  const clock = sourceClocks.get(input);
  if (clock.epochs.length > 1 && entry.sourceEpoch === undefined) throw new Error('The native container resets its clock; explicitly select the intended sourceEpoch.');
  const epoch = clock.epochs[entry.sourceEpoch ?? 0];
  if (!epoch || entry.sourceStart < epoch.firstPts || entry.sourceStart > epoch.lastPts) throw new Error('Clip is outside the selected monotonic source epoch.');
  const cache = path.join(Q, `frames-cfr3-${variant}-${index}-${hash(bytes).slice(0, 10)}-epoch${entry.sourceEpoch ?? 0}-${entry.sourceStart}-${entry.adEnd - entry.adStart}`);
  await fs.mkdir(cache, { recursive: true });
  const count = Math.round((entry.adEnd - entry.adStart) * FPS);
  try { await fs.access(path.join(cache, `frame-${String(count).padStart(4, '0')}.png`)); }
  catch {
    // Expand the complete VFR timeline before trimming. Input seeking can move
    // a sparse screen recording's first decoded state to t=0 and erase an idle
    // interval, which would misrepresent when the actual tap/result occurred.
    const end = entry.sourceStart + entry.adEnd - entry.adStart;
    const timeline = `select='between(n,${epoch.firstFrame},${epoch.lastFrame})',fps=${FPS}:round=near,trim=start=${entry.sourceStart}:end=${end},setpts=PTS-STARTPTS,scale=1000:-2`;
    await run(ffmpeg, ['-v', 'error', '-y', '-i', input, '-vf', timeline, '-frames:v', String(count), path.join(cache, 'frame-%04d.png')]);
  }
  if (entry.crop) checkCrop({ width: info.streams[0].width, height: info.streams[0].height }, entry.crop);
  clips.push({ ...entry, input, duration, cache, count, sourceWidth: info.streams[0].width, sourceHeight: info.streams[0].height, sha256: hash(bytes), cachedImage: null, cachedIndex: null });
}
async function actualFrame(t) {
  const clip = clips.find(c => t >= c.adStart && t < (c.holdFinalUntil ?? c.adEnd));
  if (!clip) return null;
  const index = Math.min(clip.count, Math.max(1, Math.floor((t - clip.adStart) * FPS + .0001) + 1));
  if (clip.cachedIndex !== index) { clip.cachedImage = await loadImage(path.join(clip.cache, `frame-${String(index).padStart(4, '0')}.png`)); clip.cachedIndex = index; }
  const crop = clip.crop ? {
    x: clip.crop.x * clip.cachedImage.width / clip.sourceWidth,
    y: clip.crop.y * clip.cachedImage.height / clip.sourceHeight,
    width: clip.crop.width * clip.cachedImage.width / clip.sourceWidth,
    height: clip.crop.height * clip.cachedImage.height / clip.sourceHeight,
  } : null;
  return { image: clip.cachedImage, framing: clip.framing ?? 'full', crop, clip };
}

const canvas = createCanvas(W, H), ctx = canvas.getContext('2d'), textAudit = [];
const clamp = n => Math.min(1, Math.max(0, n));
const p = (t, a, b) => clamp((t - a) / (b - a));
const smooth = n => n * n * (3 - 2 * n);
const ease = n => 1 - (1 - n) ** 3;
const lerp = (a, b, x) => a + (b - a) * x;
function round(x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
function text(value, x, y, size, { color = C.pine, serif = false, weight = 600, align = 'left', alpha = 1, audit = true } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.font = `${serif ? 400 : weight} ${size}px "${serif ? 'Baskerville' : 'Avenir Next'}"`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(value);
  const left = x - (align === 'center' ? metrics.width / 2 : align === 'right' ? metrics.width : 0);
  const rect = { text: value, left, right: left + metrics.width, top: y - metrics.actualBoundingBoxAscent, bottom: y + metrics.actualBoundingBoxDescent, size };
  if (audit && (rect.left < 64.8 || rect.right > 1015.2 || rect.top < 268.8 || rect.bottom > 1248)) throw new Error(`Essential text outside 6–94% / 14–65% safe region: ${JSON.stringify(rect)}`);
  if (audit) textAudit.push(rect);
  ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fillText(value, x, y); ctx.restore();
}
function brand(x, y, { size = 47, alpha = 1, color = C.pine, center = false } = {}) {
  const iw = size * 1.08, gap = size * .25;
  ctx.save(); ctx.font = `700 ${size}px "Avenir Next"`; const tw = ctx.measureText('Diecik').width; const left = center ? x - (iw + gap + tw) / 2 : x;
  ctx.globalAlpha = alpha; ctx.drawImage(icon, left, y - iw * .8, iw, iw);
  text('Diecik', left + iw + gap, y, size, { alpha, color, weight: 700 }); ctx.restore();
}
function background(t, dark = false) {
  ctx.fillStyle = dark ? C.pine : C.cream; ctx.fillRect(0, 0, 1080, 1920);
  const g = ctx.createRadialGradient(850 + Math.sin(t * .17) * 40, 1320, 40, 780, 1320, 1020);
  if (dark) { g.addColorStop(0, '#2F6047'); g.addColorStop(.62, '#183F33'); g.addColorStop(1, '#102C24'); }
  else { g.addColorStop(0, '#E3ECD5'); g.addColorStop(.56, '#ECF0E3'); g.addColorStop(1, C.cream); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  ctx.save(); ctx.strokeStyle = dark ? 'rgba(218,242,165,.13)' : 'rgba(21,54,48,.10)'; ctx.lineWidth = 1.4; ctx.translate(800, 1430); ctx.rotate(-.35 + t * .009);
  for (const size of [0, 44, 88]) { ctx.beginPath(); ctx.ellipse(0, 0, 470 + size, 760 + size, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}
function phone(image, { x = 540, y = 1160, height = 1220, rotate = 0, alpha = 1 } = {}) {
  const width = height * image.width / image.height;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotate); ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(0,20,10,.29)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#102C24'; round(-width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 60); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(213,231,218,.65)'; ctx.lineWidth = 2; round(-width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 58); ctx.stroke();
  ctx.save(); round(-width / 2, -height / 2, width, height, 48); ctx.clip(); ctx.drawImage(image, -width / 2, -height / 2, width, height); ctx.restore(); ctx.restore();
}
function detail(image, rect, { x = 540, y = 1170, width = 940, alpha = 1 } = {}) {
  checkCrop(image, rect);
  const height = width * rect.height / rect.width;
  ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = 'rgba(0,20,10,.24)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#FFFFFF'; round(x - width / 2, y - height / 2, width, height, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  round(x - width / 2, y - height / 2, width, height, 30); ctx.clip();
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, x - width / 2, y - height / 2, width, height); ctx.restore();
}
function sectionHeading(title, body, { alpha = 1, dark = false } = {}) {
  const color = dark ? C.cream : C.pine;
  text(title, 540, 351, title.length > 25 ? 60 : 68, { align: 'center', color, alpha, weight: 700 });
  text(body, 540, 421, 37, { align: 'center', color: dark ? C.mint : C.subdued, alpha, weight: 500 });
  text('Dane przykładowe', 540, 480, 27, { align: 'center', color: dark ? C.mint : C.subdued, alpha: alpha * .85, weight: 500 });
}
async function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.scale(S, S);
  const real = await actualFrame(t);
  if (t < 3.8) {
    background(t);
    const enter = ease(p(t, .03, .6)), phoneEnter = ease(p(t, .25, 1.1));
    brand(86, 337, { alpha: enter });
    v.hook.forEach((line, i) => text(line, 82, 484 + i * 118 + (1 - enter) * 18, v.hookSize, { serif: true, alpha: enter }));
    text(v.intro, 87, 697, 37, { weight: 600, alpha: enter });
    text('Dane przykładowe', 87, 757, 27, { weight: 500, color: C.subdued, alpha: enter * .85 });
    phone(real?.image ?? native[v.initial], { x: lerp(1150, 710, phoneEnter), y: lerp(1430, 1310, phoneEnter), height: 1060, rotate: lerp(.10, -.025, phoneEnter), alpha: phoneEnter });
  } else if (t < 8.4) {
    background(t);
    const enter = ease(p(t, 3.8, 4.25)); sectionHeading(v.full, v.fullBody, { alpha: enter });
    phone(real?.image ?? native[v.initial], { x: lerp(650, 540, enter), y: lerp(1220, 1150, enter), height: 1240, alpha: enter });
  } else if (t < 11.6) {
    background(t, true);
    const enter = ease(p(t, 8.4, 8.8)); sectionHeading(v.detail, v.detailBody, { alpha: enter, dark: true });
    if (real?.framing === 'full') phone(real.image, { y: 1150, height: 1240, alpha: enter });
    else {
      const image = real?.image ?? sourceDetail;
      let sourceCrop = real?.crop;
      if (!sourceCrop) sourceCrop = real ? { x: crop.x * image.width / sourceDetail.width, y: crop.y * image.height / sourceDetail.height, width: crop.width * image.width / sourceDetail.width, height: crop.height * image.height / sourceDetail.height } : crop;
      detail(image, sourceCrop, { y: lerp(1194, 1160, enter), alpha: enter });
    }
  } else if (t < 16.6) {
    background(t);
    const enter = ease(p(t, 11.6, 12.0)); sectionHeading(v.result, v.resultBody, { alpha: enter });
    const image = real?.image ?? native[v.resultSource];
    if (real?.framing === 'detail' && real.crop) detail(image, real.crop, { y: 1160, alpha: enter });
    else if (variant === 'deficit' && !real) detail(image, resultCrop, { y: 1160, alpha: enter });
    else phone(image, { y: lerp(1210, 1150, enter), height: 1240, alpha: enter });
  } else {
    background(t, true);
    const enter = ease(p(t, 16.6, 17)); brand(540, 456, { size: 84, alpha: enter, color: C.cream, center: true });
    v.end.forEach((line, i) => text(line, 540, 654 + i * 100 + (1 - enter) * 12, v.endSize, { serif: true, color: C.cream, align: 'center', alpha: enter }));
    ctx.save(); ctx.globalAlpha = enter; ctx.fillStyle = C.lime; round(118, 920, 844, 132, 28); ctx.fill(); ctx.restore();
    text('Pobierz Diecik', 540, 1008, 65, { align: 'center', alpha: enter, weight: 700 });
    text('iOS i Android', 540, 1154, 41, { align: 'center', color: C.mint, alpha: enter, weight: 500 });
    phone(native[v.resultSource], { x: 540, y: 1765 + (1 - enter) * 80, height: 940, rotate: .025, alpha: enter });
  }
}

const stamps = [1.6, 5.2, 9.6, 13.7, 18.3];
const board = createCanvas(stamps.length * 360, 690), g = board.getContext('2d');
g.fillStyle = C.cream; g.fillRect(0, 0, board.width, board.height);
for (const [index, stamp] of stamps.entries()) {
  await draw(stamp);
  const bytes = await canvas.encode('png');
  await fs.writeFile(path.join(Q, `${variant}-${stamp.toFixed(1)}s-${W}.png`), bytes);
  // Freeze each frame: Skia can retain a reference to a mutable canvas.
  g.drawImage(await loadImage(bytes), index * 360, 0, 360, 640); g.fillStyle = C.pine; g.font = '20px "Avenir Next"'; g.fillText(`${stamp.toFixed(1)} s`, index * 360 + 15, 674);
}
await fs.writeFile(path.join(Q, `${variant}-storyboard-360.jpg`), await board.encode('jpeg', 94));
const creative = {
  createdAt: new Date().toISOString(), variant, mode, stem: v.stem, width: W, height: H, fps: FPS, duration: 20,
  status: 'EXPORTED_PENDING_VISUAL_REVIEW', palette: C, fonts: ['Avenir Next', 'Baskerville'],
  sources: sourceManifest, nativeMeaning: v.meaning, nativePixelsRetouched: false, simulatedTaps: false,
  sourcePlanReviewed: plan.reviewed === true, detailCrop: crop, resultCrop: variant === 'deficit' ? resultCrop : null,
  nativeClips: clips.map(({ input, adStart, adEnd, sourceStart, sourceEpoch, holdFinalUntil, framing, crop, sha256, duration }) => ({ file: path.relative(root, input), sha256, sourceDuration: duration, adStart, adEnd, sourceStart, sourceEpoch: sourceEpoch ?? 0, speed: 1, holdFinalUntil, finalCapturedFrameHeld: holdFinalUntil !== undefined, framing, crop, clicksSynthesized: false })),
  sourceClocks: [...sourceClocks].map(([file, clock]) => ({ file: path.relative(root, file), ...clock, interpretation: 'Select an original monotonic clock epoch before real-time CFR conversion; no fabricated frames or actions.' })),
  sourcePlan: path.relative(root, planFile), audio: v.audio, bpm: v.bpm,
  scenes: { hookAndNativeContext: [0, 3.8], fullNative: [3.8, 8.4], photographicDetail: [8.4, 11.6], actualResult: [11.6, 16.6], cta: [16.6, 20] },
  textSafeZone: { xPercent: [6, 94], yPercent: [14, 65], design: '1080x1920' },
  representativeTextBounds: textAudit,
  limitations: ['Export success is separate from visual/audio review.', 'Demo account and example settings; no weight outcome or guaranteed energy requirement.', 'A cut in the real workflow does not assert instant generation.'],
};
await fs.writeFile(path.join(Q, `${variant}-creative-spec.json`), JSON.stringify(creative, null, 2) + '\n');
if (mode === 'representative') { console.log(`${variant}: representative ready, reviewed clips=${clips.length}`); process.exit(0); }
if (!clips.length) throw new Error('Video proof/final requires authentic source clip timecodes.');
const duration = mode === 'proof' ? 8 : 20;
const output = mode === 'proof' ? path.join(Q, `proof-${variant}-8s-${W}.mp4`) : path.join(root, 'DO_WGRANIA', `${v.stem}.mp4`);
await fs.mkdir(path.dirname(output), { recursive: true });
const temp = path.join(Q, `${variant}-${mode}-${W}.rendering.mp4`);
const audioFile = path.join(root, v.audio), audioBytes = await fs.readFile(audioFile);
const command = ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-i', audioFile,
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1', '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', '30',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(duration), '-movflags', '+faststart', temp];
const encoder = spawn(ffmpeg, command, { stdio: ['pipe', 'ignore', 'pipe'] });
let errors = ''; encoder.stderr.on('data', d => { errors += d; }); encoder.stdin.on('error', () => {});
const completion = once(encoder, 'close'), started = Date.now();
for (let frame = 0; frame < duration * FPS; frame++) {
  await draw(frame / FPS); const pixels = ctx.getImageData(0, 0, W, H).data;
  if (!encoder.stdin.write(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength))) await Promise.race([once(encoder.stdin, 'drain'), completion.then(([code]) => { throw new Error(`Encoder stopped ${code}: ${errors}`); })]);
  if (frame % 90 === 0) console.log(`${variant} ${mode}: ${frame}/${duration * FPS} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
}
encoder.stdin.end(); const [code] = await completion; if (code) throw new Error(errors);
await fs.rename(temp, output);
const media = JSON.parse((await run(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output])).text);
const video = media.streams.find(s => s.codec_type === 'video'), audio = media.streams.find(s => s.codec_type === 'audio');
const checks = {
  codec: video.codec_name === 'h264', dimensions: video.width === W && video.height === H, fps: video.avg_frame_rate === '30/1',
  bt709: ['color_space', 'color_transfer', 'color_primaries'].every(key => video[key] === 'bt709'), pixelFormat: video.pix_fmt === 'yuv420p',
  duration: Math.abs(Number(video.duration) - duration) < .035, frames: Number(video.nb_frames) === duration * FPS,
  aacStereo: audio?.codec_name === 'aac' && audio.channels === 2 && audio.sample_rate === '48000',
};
const report = { createdAt: new Date().toISOString(), status: Object.values(checks).every(Boolean) ? 'TECHNICAL_PASS_PENDING_VISUAL_REVIEW' : 'FAIL',
  output: path.relative(root, output), bytes: (await fs.stat(output)).size, sha256: hash(await fs.readFile(output)), width: W, height: H, fps: FPS, duration,
  audio: { source: v.audio, sha256: hash(audioBytes), bpm: v.bpm }, sourcePlanReviewed: plan.reviewed === true, checks, streams: media.streams, renderSeconds: (Date.now() - started) / 1000, encoderWarnings: errors };
await fs.writeFile(path.join(Q, `${variant}-${mode}-render.json`), JSON.stringify(report, null, 2) + '\n');
if (!Object.values(checks).every(Boolean)) throw new Error(`Output verification failed: ${JSON.stringify(checks)}`);
console.log(`Ready: ${output}`);
