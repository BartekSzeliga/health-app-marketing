import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(root, '../../..');
const args = process.argv.slice(2);
const representative = args.includes('--representative');
const final = args.includes('--final');
if (representative === final) throw new Error('Choose --representative or --final explicitly. Full exports require the parent agent to approve the source captures and representative.');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
if (only && !['goal', 'generator'].includes(only)) throw new Error('Use --only goal or --only generator.');
if (!GlobalFonts.has('Avenir Next') || !GlobalFonts.has('Baskerville')) throw new Error('The approved Avenir Next and Baskerville typefaces must be present.');

const C = { pine: '#153630', pineLight: '#274E43', cream: '#F6F5EF', lime: '#DAF2A5', mint: '#E3F0DD', ink: '#18372F', muted: '#53645A' };
const sourcePaths = {
  icon: path.resolve(root, '../diecik-instalacje-2026-10-18/assets/static/diecik-icon.png'),
  profileBasics: path.join(root, 'assets/native/profile-basics.png'),
  profileGoal: path.join(root, 'assets/native/profile-goal.png'),
  profileAuto: path.join(root, 'assets/native/profile-auto.png'),
  generatorConfig: path.join(root, 'assets/native/generator-config.png'),
  generatorMacro: path.join(root, 'assets/native/generator-macro.png'),
  generatorPreview: path.join(root, 'assets/native/generator-preview.png'),
  generatorPreviewTop: path.join(root, 'assets/native/generator-preview-top.png'),
  dietSaved: path.join(root, 'assets/native/diet-saved.png'),
};

// Crop coordinates are set only after inspecting the real current capture. A crop
// repeats photographed native UI in front of its complete source; it never paints
// labels, controls, numbers, generated meals, or other content into the app.
const nativeDetails = {
  profileAuto: { x: 96, y: 1320, width: 1014, height: 918 },
  generatorPreviewTop: { source: 'generatorPreview', x: 96, y: 274, width: 1014, height: 1296 },
};

const concepts = [
  {
    key: 'goal', id: '01-Cel-kalorii', source: 'profileAuto',
    feature: 'Cel dla redukcji',
    headline: ['Cel kalorii.', 'Wyliczony.'],
    body: ['Ustaw cel redukcji.', 'Zobacz propozycję', 'kalorii i makro.'],
    qualifier: 'Z danych profilu i aktywności.',
  },
  {
    key: 'generator', id: '02-Generator-diety', source: 'generatorPreviewTop',
    feature: 'Generator diety',
    headline: ['Od celu', 'do jadłospisu.'],
    body: ['Wybierz preferencje.', 'Sprawdź posiłki.', 'Zapisz swój plan.'],
    qualifier: 'Generator Standard za darmo.',
  },
];

const carousel = [
  { id: '01-Cel', source: 'profileAuto', feature: '01 / TWÓJ CEL', headline: ['Najpierw', 'cel kalorii.'], body: ['Ustaw redukcję i aktywność.', 'Zobacz sugerowane makro.'], qualifier: 'Propozycja z danych profilu.' },
  { id: '02-Ustawienia', source: 'generatorConfig', feature: '02 / USTAWIENIA', headline: ['Twój plan.', 'Twoje wybory.'], body: ['Wybierz liczbę posiłków,', 'dni i preferencje.'], qualifier: 'Generator Standard za darmo.' },
  { id: '03-Podglad', source: 'generatorPreviewTop', feature: '03 / PODGLĄD', headline: ['Najpierw', 'podgląd.'], body: ['Sprawdź posiłki', 'i dostępne przepisy.'], qualifier: 'Zanim zapiszesz swój plan.' },
  { id: '04-Zapis', source: 'dietSaved', feature: '04 / ZAPIS', headline: ['Plan gotowy?', 'Zapisz go.'], body: ['Otwórz swoją dietę.', 'Edytuj posiłki po swojemu.'], qualifier: 'Ty decydujesz o zapisie.' },
];

const selected = concepts.filter((concept) => !only || concept.key === only);
const selectedCarousel = !only ? carousel : only === 'goal' ? carousel.slice(0, 1) : carousel.slice(1);
const required = representative
  ? new Set(['icon', selected[0].source])
  : new Set(['icon', ...selected.map((item) => item.source), ...selectedCarousel.map((item) => item.source)]);
for (const key of [...required]) if (nativeDetails[key]?.source) required.add(nativeDetails[key].source);
const images = {};
const sources = [];
for (const key of required) {
  const source = sourcePaths[key];
  const buffer = await fs.readFile(source);
  images[key] = await loadImage(buffer);
  sources.push({ key, file: path.relative(workspace, source), width: images[key].width, height: images[key].height, bytes: buffer.length, sha256: hash(buffer) });
  if (key !== 'icon' && (images[key].width < 1100 || images[key].height < 2300)) throw new Error(`Expected a full-resolution native portrait capture: ${key}`);
}
await fs.mkdir(path.join(root, 'qa/static'), { recursive: true });
if (final) await fs.mkdir(path.join(root, 'DO_WGRANIA'), { recursive: true });

const files = [];
const bounds = [];
let artwork = null;
function hash(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function round(ctx, x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
function font(size, { serif = false, weight = 500 } = {}) { return `${weight} ${size}px "${serif ? 'Baskerville' : 'Avenir Next'}"`; }
function text(ctx, value, x, y, size, { color = C.ink, max = 650, serif = false, weight = 500, align = 'left' } = {}) {
  ctx.save();
  ctx.font = font(size, { serif, weight }); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  const measure = ctx.measureText(value);
  if (measure.width > max) throw new Error(`Text overflow (${measure.width} > ${max}): ${value}`);
  const left = x - (align === 'center' ? measure.width / 2 : align === 'right' ? measure.width : 0);
  const box = { text: value, left, top: y - measure.actualBoundingBoxAscent, right: left + measure.width, bottom: y + measure.actualBoundingBoxDescent, canvasHeight: ctx.canvas.height };
  if (box.left < 55 || box.right > 1385 || box.top < 45 || box.bottom > ctx.canvas.height - 42) throw new Error(`Text outside safe frame: ${JSON.stringify(box)}`);
  bounds.push({ ...box, artwork }); ctx.fillText(value, x, y); ctx.restore();
}
function lines(ctx, values, x, y, size, leading, options = {}) { values.forEach((value, index) => text(ctx, value, x, y + index * leading, size, options)); }
function background(ctx, height) {
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, 1440, height);
  ctx.fillStyle = C.pine; ctx.fillRect(744, 0, 696, height);
  const gradient = ctx.createRadialGradient(1130, height * .35, 15, 1130, height * .44, 820);
  gradient.addColorStop(0, 'rgba(112,156,112,.22)'); gradient.addColorStop(1, 'rgba(112,156,112,0)');
  ctx.fillStyle = gradient; ctx.fillRect(744, 0, 696, height);
  ctx.save(); ctx.strokeStyle = 'rgba(218,242,165,.11)'; ctx.lineWidth = 2;
  for (const offset of [0, 43]) { ctx.beginPath(); ctx.ellipse(1210, height * .52, 390 + offset, 680 + offset, -.06, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}
function brand(ctx) {
  ctx.drawImage(images.icon, 96, 87, 78, 78);
  text(ctx, 'Diecik', 190, 145, 62, { weight: 700, max: 350 });
}
function phone(ctx, key, { x = 1095, y = 744, height = 1170, angle = -.023 } = {}) {
  const image = images[key]; const width = height * image.width / image.height;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.shadowColor = 'rgba(0,16,12,.38)'; ctx.shadowBlur = 55; ctx.shadowOffsetY = 25;
  ctx.fillStyle = '#071B16'; round(ctx, -width / 2 - 12, -height / 2 - 12, width + 24, height + 24, 65); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(227,240,221,.5)'; ctx.lineWidth = 2;
  round(ctx, -width / 2 - 11, -height / 2 - 11, width + 22, height + 22, 63); ctx.stroke();
  round(ctx, -width / 2, -height / 2, width, height, 52); ctx.clip();
  ctx.drawImage(image, -width / 2, -height / 2, width, height); ctx.restore();
  return { source: path.relative(root, sourcePaths[key]), sourceWidth: image.width, sourceHeight: image.height, x, y, width, height, angle, fullSource: true, nativePixelsRetouched: false };
}
function nativeDetail(ctx, key, { portrait = false, carouselCard = false } = {}) {
  const crop = nativeDetails[key];
  if (!crop) return null;
  const detailSourceKey = crop.source ?? key;
  const source = images[detailSourceKey];
  if (crop.x < 0 || crop.y < 0 || crop.x + crop.width > source.width || crop.y + crop.height > source.height) throw new Error(`Crop outside real source: ${key}`);
  const width = 740; const height = width * crop.height / crop.width;
  const x = 654; const y = key === 'generatorPreviewTop' ? (portrait ? 744 : 410) : portrait ? 814 : 686;
  for (const box of bounds.filter((entry) => entry.artwork === artwork && entry.left < 744)) {
    if (box.right > x && box.left < x + width && box.top < y + height && box.bottom > y) throw new Error(`Native detail would cover marketing text in ${artwork}: ${box.text}`);
  }
  ctx.save(); ctx.shadowColor = 'rgba(0,15,10,.32)'; ctx.shadowBlur = 42; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#FFFFFF'; round(ctx, x, y, width, height, 30); ctx.fill();
  ctx.shadowColor = 'transparent'; round(ctx, x, y, width, height, 30); ctx.clip();
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, x, y, width, height); ctx.restore();
  return { source: path.relative(root, sourcePaths[detailSourceKey]), sourceRect: { x: crop.x, y: crop.y, width: crop.width, height: crop.height }, x, y, width, height, framing: detailSourceKey === key ? 'Photographic detail repeated from the complete native capture visible behind it' : 'Photographic detail of actual preview meals from the same current native flow; the complete preview-header capture is visible behind it', nativePixelsRetouched: false };
}
function cta(ctx, y) {
  const x = 96, width = 468, height = 98;
  ctx.fillStyle = C.lime; round(ctx, x, y, width, height, 25); ctx.fill();
  text(ctx, 'Pobierz Diecik', x + 29, y + 65, 43, { weight: 700, max: width - 90 });
  ctx.save(); ctx.strokeStyle = C.pine; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + width - 51, y + 49); ctx.lineTo(x + width - 30, y + 49);
  ctx.moveTo(x + width - 39, y + 40); ctx.lineTo(x + width - 30, y + 49); ctx.lineTo(x + width - 39, y + 58); ctx.stroke(); ctx.restore();
  text(ctx, 'iOS i Android', 99, y + 151, 32, { color: C.muted, max: 580 });
}
function disclosure(ctx, height) {
  text(ctx, 'Dane przykładowe', 1087, height - 54, 30, { color: C.mint, align: 'center', max: 560 });
}
function staticAd(concept, format) {
  artwork = `Grafika-${concept.id}-${format}.jpg`;
  const portrait = format === '4x5'; const height = portrait ? 1800 : 1440;
  const canvas = createCanvas(1440, height); const ctx = canvas.getContext('2d'); background(ctx, height); brand(ctx);
  text(ctx, concept.feature.toLocaleUpperCase('pl-PL'), 96, portrait ? 315 : 292, 30, { color: C.muted, weight: 600, max: 610 });
  lines(ctx, concept.headline, 90, portrait ? 494 : 459, concept.key === 'generator' ? 102 : 114, portrait ? 132 : 124, { serif: true, weight: 400, max: 650 });
  ctx.fillStyle = C.pine; ctx.fillRect(96, portrait ? 790 : 722, 70, 4);
  lines(ctx, concept.body, 96, portrait ? 892 : 806, 43, 62, { max: 610 });
  text(ctx, concept.qualifier, 96, portrait ? 1167 : 1050, 29, { max: 620, color: C.muted });
  cta(ctx, portrait ? 1393 : 1155);
  const context = phone(ctx, concept.source, { x: portrait ? 1063 : 1095, y: portrait ? 929 : 744, height: portrait ? 1488 : 1170 });
  const detail = nativeDetail(ctx, concept.source, { portrait });
  disclosure(ctx, height);
  return { canvas, kind: 'static', concept: concept.key, format, proof: { context, detail } };
}
function carouselAd(item, index) {
  artwork = `Karuzela-${item.id}-1x1.jpg`;
  const canvas = createCanvas(1440, 1440); const ctx = canvas.getContext('2d'); background(ctx, 1440); brand(ctx);
  text(ctx, item.feature, 96, 296, 30, { color: C.muted, weight: 600, max: 620 });
  lines(ctx, item.headline, 90, 466, index === 2 ? 94 : 104, 121, { serif: true, weight: 400, max: 650 });
  lines(ctx, item.body, 96, 814, 40, 61, { max: 605 });
  text(ctx, item.qualifier, 96, 1014, 29, { max: 620, color: C.muted });
  cta(ctx, 1131);
  for (let dot = 0; dot < 4; dot += 1) { ctx.fillStyle = dot === index ? C.pine : '#D6DDD1'; round(ctx, 96 + dot * 44, 1363, 27, 6, 3); ctx.fill(); }
  const context = phone(ctx, item.source, { x: 1093, y: 745, height: 1170, angle: index % 2 ? .014 : -.021 });
  const detail = nativeDetail(ctx, item.source, { carouselCard: true });
  disclosure(ctx, 1440);
  return { canvas, kind: 'carousel', concept: item.id, format: '1x1', proof: { context, detail } };
}
async function write(result, filename) {
  const output = path.join(root, representative ? 'qa/static' : 'DO_WGRANIA', filename);
  const buffer = await result.canvas.encode('jpeg', 95); await fs.writeFile(output, buffer);
  const preview = createCanvas(360, result.canvas.height / 4); preview.getContext('2d').drawImage(result.canvas, 0, 0, preview.width, preview.height);
  const previewFile = path.join(root, 'qa/static', filename.replace('.jpg', '-360.jpg'));
  await fs.writeFile(previewFile, await preview.encode('jpeg', 94));
  files.push({ file: path.relative(root, output), preview: path.relative(root, previewFile), width: result.canvas.width, height: result.canvas.height, bytes: buffer.length, sha256: hash(buffer), kind: result.kind, concept: result.concept, format: result.format, proof: result.proof });
  return preview;
}

const previews = [];
for (const concept of representative ? [selected[0]] : selected) {
  for (const format of representative ? ['1x1'] : ['1x1', '4x5']) previews.push(await write(staticAd(concept, format), `${representative ? 'Representative-' : 'Grafika-'}${concept.id}-${format}.jpg`));
}
if (final) for (const item of selectedCarousel) previews.push(await write(carouselAd(item, carousel.indexOf(item)), `Karuzela-${item.id}-1x1.jpg`));

if (final) {
  const staticCount = files.filter((item) => item.kind === 'static').length;
  const carouselCount = files.filter((item) => item.kind === 'carousel').length;
  const sheet = createCanvas(Math.max(staticCount, carouselCount) * 360, 810); const ctx = sheet.getContext('2d'); ctx.fillStyle = '#E8E7DF'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  files.forEach((item, index) => {
    const staticIndex = files.slice(0, index).filter((entry) => entry.kind === 'static').length;
    const carouselIndex = files.slice(0, index).filter((entry) => entry.kind === 'carousel').length;
    if (item.kind === 'carousel') ctx.drawImage(previews[index], carouselIndex * 360, 450);
    else ctx.drawImage(previews[index], staticIndex * 360, item.format === '1x1' ? 45 : 0);
  });
  await fs.writeFile(path.join(root, 'qa/static/static-contact-sheet.jpg'), await sheet.encode('jpeg', 94));
}
const report = {
  createdAt: new Date().toISOString(), mode: representative ? 'REPRESENTATIVE_FOR_PARENT_REVIEW' : 'FINAL_EXPORT', status: 'EXPORTED_PENDING_VISUAL_REVIEW',
  scope: 'Additional consumer install ads: suggested calorie target for reduction and diet-generator preview/save', brand: 'Diecik',
  palette: C, typefaces: ['Baskerville', 'Avenir Next'], sources, files, textBounds: bounds,
  nativePixelsRetouched: false,
  screenshotProcessing: 'Uniform scaling and rounded framing. Any optional native detail is a documented crop of the real current source, accompanied by the complete native profile or generator-context capture behind it. The generator detail and context are different captures from the same current flow and are identified separately. No labels, controls, meals, amounts, or calculated values are added to app UI.',
  claims: ['The app proposes calories and macros from profile data and selected reduction/activity settings.', 'The standard diet generator is free; premium diet types and shopping lists are not advertised as free.', 'Generation first produces a preview; the person can review meals and then explicitly save.'],
  limitations: ['An estimated calorie target is not a measured actual deficit or a promised rate of weight change.', 'Synthetic demo data is explicitly disclosed outside native UI.', 'Preview day 1842 kcal is an actual generated approximation to the 1902 kcal target, without a claim of exact fit.', 'Day replacement is not claimed because the capture did not demonstrate an observable replacement.', 'Export success is separate from visual approval and advertising effectiveness.'],
};
const reportFile = representative ? `static-representative-${selected[0].key}.json` : `static-verification${only ? `-${only}` : ''}.json`;
await fs.writeFile(path.join(root, 'qa', reportFile), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ mode: report.mode, files: files.map((file) => file.file), report: `qa/${reportFile}` }, null, 2));
