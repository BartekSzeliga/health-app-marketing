import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qa = path.join(root, "qa");
const sources = {
  status: path.join(qa, "iphone-day29-top.png"),
  top: path.join(qa, "iphone-day29-top.png"),
  meals: path.join(qa, "iphone-day29-meals.png"),
  last: path.join(qa, "iphone-day29-fifth.png"),
};
const output = path.join(root, "sources", "iphone-full-day-overview.png");

// Montaż rzeczywistych przewinięć planu od specjalisty z 29 września 2026.
// Pięć różnych posiłków pozostaje bez zmian i mieści się w pierwszym kadrze mobile.
const strips = [
  { source: "status", top: 0, height: 140 }, // pasek systemowy
  { source: "top", top: 230, height: 260 }, // Dieta / od specjalisty
  { source: "top", top: 540, height: 120 }, // wybrana zakładka
  { source: "top", top: 1130, height: 170 }, // dzień
  { source: "top", top: 1355, height: 75 }, // Posiłki (5)
  { source: "meals", top: 264, height: 355 }, // owsianka
  { source: "last", top: 450, height: 355 }, // jabłko i skyr
  { source: "last", top: 862, height: 420 }, // penne, karta z dłuższą nazwą
  { source: "last", top: 1327, height: 355 }, // kefir
  { source: "last", top: 1736, height: 355 }, // tortilla
];

const composites = [];
let y = 0;
for (const strip of strips) {
  const input = await sharp(sources[strip.source])
    .extract({ left: 0, top: strip.top, width: 1206, height: strip.height })
    .png()
    .toBuffer();
  composites.push({ input, left: 0, top: y });
  y += strip.height;
}
if (y > 2622) throw new Error(`Overview exceeds iPhone viewport: ${y}`);
await fs.mkdir(path.dirname(output), { recursive: true });
await sharp({ create: { width: 1206, height: 2622, channels: 4, background: "#F5FAF8" } })
  .composite(composites)
  .png()
  .toFile(output);
process.stdout.write(`${output} (${y}/2622 px used)\n`);
