import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const sourceDir = path.join(root, "sources", "panel");
const output = path.join(
  root,
  "qa",
  "contact-sheets",
  "diecik-specialist-panel-stills-selection.jpg",
);

const items = [
  ["01-workflow-dieta-trening.png", "01 · Proces: dieta + trening"],
  ["02-training-plan-three-days.png", "02 · Plan ruchu: 3 dni"],
  ["03-training-template-functional.png", "03 · Szablon funkcjonalny"],
  ["04-functional-day-details.png", "04 · Szczegóły dnia i serie"],
  ["05-package-ready-dieta-training.png", "05 · Gotowy pakiet"],
  ["06-package-preview.png", "06 · Podgląd diety"],
  ["07-package-preview-training.png", "07 · Podgląd treningu"],
];

const width = 1800;
const header = 100;
const columnWidth = 900;
const imageWidth = 840;
const imageHeight = 578;
const labelHeight = 56;
const rowHeight = imageHeight + labelHeight + 36;
const rows = Math.ceil(items.length / 2);
const height = header + rows * rowHeight;

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(w, h, body) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <style>.sans { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }</style>
      ${body}
    </svg>`,
  );
}

await fs.mkdir(path.dirname(output), { recursive: true });
const background = sharp(
  svg(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="#F6FAF5"/>
     <text class="sans" x="40" y="63" font-size="38" font-weight="900" fill="#082F35">Diecik · kadry z panelu specjalisty · klient DEMO</text>`,
  ),
);
const composites = [];
for (let index = 0; index < items.length; index += 1) {
  const [filename, label] = items[index];
  const column = index % 2;
  const row = Math.floor(index / 2);
  const left = column * columnWidth + 30;
  const top = header + row * rowHeight;
  const thumbnail = await sharp(path.join(sourceDir, filename))
    .resize(imageWidth, imageHeight, {
      fit: "contain",
      background: "#FFFFFF",
    })
    .flatten({ background: "#FFFFFF" })
    .jpeg({ quality: 91 })
    .toBuffer();
  composites.push({ input: thumbnail, left, top });
  composites.push({
    input: svg(
      imageWidth,
      labelHeight,
      `<rect width="${imageWidth}" height="${labelHeight}" fill="#082F35"/>
       <text class="sans" x="18" y="38" font-size="27" font-weight="800" fill="#FFFFFF">${xml(label)}</text>`,
    ),
    left,
    top: top + imageHeight,
  });
}

await background
  .composite(composites)
  .flatten({ background: "#F6FAF5" })
  .jpeg({ quality: 92 })
  .toFile(output);

process.stdout.write(`${output}\n`);
