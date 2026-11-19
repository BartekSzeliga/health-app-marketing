import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outputDir = path.join(root, "qa", "direction");
const output = path.join(outputDir, "diecik-specialist-direction-v1.png");
const source = path.join(root, "sources", "panel", "02-training-plan-three-days.png");
const logoSource = path.resolve(
  root,
  "..",
  "meta-start-aplikacji",
  "sources",
  "diecik-logo.png",
);

await fs.mkdir(outputDir, { recursive: true });

const colors = {
  ink: "#082F35",
  ocean: "#0C6F84",
  mint: "#B6F1E2",
  mintBright: "#45D7BD",
  lime: "#D2F56F",
  white: "#FFFFFF",
};

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(width, height, body) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#062A31"/>
          <stop offset="58%" stop-color="#0B5D68"/>
          <stop offset="100%" stop-color="#18A28D"/>
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#031A1F" flood-opacity=".34"/>
        </filter>
      </defs>
      <style>.sans { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }</style>
      ${body}
    </svg>`,
  );
}

function checkChip(x, y, width, label) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="64" rx="32" fill="#FFFFFF" fill-opacity=".12" stroke="#FFFFFF" stroke-opacity=".25"/>
    <circle cx="${x + 32}" cy="${y + 32}" r="15" fill="${colors.lime}"/>
    <path d="M${x + 24} ${y + 32}l5 5 11-12" fill="none" stroke="${colors.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text class="sans" x="${x + 58}" y="${y + 41}" font-size="21" font-weight="800" fill="#FFFFFF">${xml(label)}</text>`;
}

const panelCrop = await sharp(source)
  .extract({ left: 110, top: 400, width: 2050, height: 1120 })
  .resize(900, 492, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();
const panelMask = svg(
  900,
  492,
  `<rect width="900" height="492" rx="30" fill="#FFFFFF"/>`,
);
const roundedPanel = await sharp(panelCrop)
  .composite([{ input: panelMask, blend: "dest-in" }])
  .png()
  .toBuffer();
const logo = await sharp(logoSource)
  .resize(90, 90, { fit: "contain" })
  .png()
  .toBuffer();

const background = svg(
  1080,
  1920,
  `<rect width="1080" height="1920" fill="url(#bg)"/>
   <circle cx="1010" cy="170" r="350" fill="${colors.lime}" opacity=".12"/>
   <circle cx="70" cy="1750" r="420" fill="${colors.mintBright}" opacity=".14"/>
   <rect x="74" y="70" width="122" height="122" rx="35" fill="#FFFFFF" filter="url(#shadow)"/>
   <rect x="90" y="245" width="310" height="74" rx="37" fill="${colors.lime}"/>
   <text class="sans" x="245" y="296" text-anchor="middle" font-size="31" font-weight="900" letter-spacing="1.7" fill="${colors.ink}">DIETETYKU</text>
   <text class="sans" x="90" y="399" font-size="69" font-weight="950" letter-spacing="-2" fill="#FFFFFF">TWOJA OPIEKA</text>
   <text class="sans" x="90" y="473" font-size="69" font-weight="950" letter-spacing="-2" fill="#FFFFFF">MOŻE WIĘCEJ</text>
   <text class="sans" x="90" y="542" font-size="29" font-weight="650" fill="${colors.mint}">Wyróżnij się i rozszerz ją o plan ruchu</text>
   <text class="sans" x="90" y="580" font-size="29" font-weight="650" fill="${colors.mint}">przygotowany dla klienta.</text>
   <rect x="90" y="618" width="230" height="8" rx="4" fill="${colors.lime}"/>
   <rect x="70" y="675" width="940" height="552" rx="40" fill="#FFFFFF" opacity=".98" filter="url(#shadow)"/>
   ${checkChip(126, 1288, 222, "PLAN KLIENTA")}
   ${checkChip(362, 1288, 210, "JEDEN PANEL")}
   ${checkChip(586, 1288, 368, "PUBLIKUJ W APLIKACJI")}
   <text class="sans" x="90" y="1433" font-size="25" font-weight="800" letter-spacing="1.5" fill="${colors.lime}">PRAWDZIWY PANEL SPECJALISTY</text>
   <text class="sans" x="90" y="1508" font-size="42" font-weight="900" letter-spacing="-1" fill="#FFFFFF">Dieta i trening w jednym procesie.</text>
   <text class="sans" x="90" y="1570" font-size="28" font-weight="600" fill="${colors.mint}">Pełniejsza opieka. Mniej przełączania.</text>
   <text class="sans" x="975" y="112" text-anchor="end" font-size="25" font-weight="800" fill="#FFFFFF" opacity=".66">KIERUNEK 1</text>`,
);

await sharp(background)
  .composite([
    { input: logo, left: 90, top: 86 },
    { input: roundedPanel, left: 90, top: 705 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(output);

process.stdout.write(`${output}\n`);
