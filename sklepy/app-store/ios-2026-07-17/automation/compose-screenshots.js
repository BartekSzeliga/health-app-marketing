#!/usr/bin/env node

/**
 * Produces the final 1284x2778 App Store screenshot set from real app captures.
 * The script only reads the mobile app icon and raw captures. All generated files
 * stay in the App Store export directory.
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const exportDir = path.resolve(__dirname, "..");
const sharp = require(path.join(exportDir, ".tooling", "node_modules", "sharp"));

const rawDir = path.join(exportDir, "raw");
const outputDir = path.join(exportDir, "screenshots-app-store-1284x2778");
const qaDir = path.join(exportDir, "qa");
const appIconPath = path.resolve(
  exportDir,
  "..",
  "..",
  "..",
  "health-app-mobile",
  "assets",
  "icon.png",
);

const SOURCE_WIDTH = 1320;
const SOURCE_HEIGHT = 2868;
const OUTPUT_WIDTH = 1284;
const OUTPUT_HEIGHT = 2778;
const SCREEN_WIDTH = 1070;
const SCREEN_HEIGHT = Math.round((SCREEN_WIDTH * SOURCE_HEIGHT) / SOURCE_WIDTH);
const SCREEN_X = Math.round((OUTPUT_WIDTH - SCREEN_WIDTH) / 2);
const SCREEN_Y = 400;
const SCREEN_RADIUS = 56;
const CONTACT_PNG = "screenshots-contact-sheet-1284x2778.png";
const CONTACT_HTML = "screenshots-contact-sheet-1284x2778.html";

const screenshots = [
  {
    source: "diet-day.png",
    output: "01-dieta-i-trening-razem.jpg",
    lines: ["Dieta i trening.", "Razem."],
  },
  {
    source: "diet-generator-configured.png",
    output: "02-twoj-tydzien-gotowy-w-chwile.jpg",
    lines: ["Twój tydzień,", "gotowy w chwilę"],
  },
  {
    source: "diet-plan-ready.png",
    output: "03-posilki-dopasowane-do-ciebie.jpg",
    lines: ["Posiłki dopasowane", "do Ciebie"],
  },
  {
    source: "profile.png",
    output: "04-makro-pod-kontrola.jpg",
    lines: ["Makro pod kontrolą"],
  },
  {
    source: "training-generator-configured.png",
    output: "05-plan-treningowy-w-kilka-chwil.jpg",
    lines: ["Plan treningowy", "w kilka chwil"],
  },
  {
    source: "training-draft.png",
    output: "06-kazda-seria-ma-swoj-cel.jpg",
    lines: ["Każda seria", "ma swój cel"],
  },
  {
    source: "my-workouts.png",
    output: "07-trening-zaplanowany-na-dzis.jpg",
    lines: ["Trening zaplanowany", "na dziś"],
  },
  {
    source: "exercise-instruction.png",
    output: "08-technika-krok-po-kroku.jpg",
    lines: ["Technika krok po kroku"],
  },
  {
    source: "weight-trend.png",
    output: "09-postepy-ktore-widac.jpg",
    lines: ["Postępy, które widać"],
  },
  {
    source: "product-search.png",
    output: "10-dodawaj-bez-przepisywania.jpg",
    lines: ["Dodawaj bez przepisywania"],
  },
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return escapeXml(value);
}

function titleSvg(lines) {
  const firstBaseline = lines.length === 1 ? 272 : 194;
  const lineGap = 88;
  const text = lines
    .map(
      (line, index) =>
        `<text x="107" y="${firstBaseline + index * lineGap}" class="headline">${escapeXml(line)}</text>`,
    )
    .join("");

  return Buffer.from(`
    <svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F9FCFA"/>
          <stop offset="0.48" stop-color="#F0F9F6"/>
          <stop offset="1" stop-color="#E4F4EF"/>
        </linearGradient>
        <radialGradient id="mintGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#5DDFC4" stop-opacity="0.28"/>
          <stop offset="1" stop-color="#5DDFC4" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="limeGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#B7DE42" stop-opacity="0.20"/>
          <stop offset="1" stop-color="#B7DE42" stop-opacity="0"/>
        </radialGradient>
        <filter id="screenShadow" x="-25%" y="-15%" width="150%" height="145%">
          <feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#0A3D39" flood-opacity="0.20"/>
          <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#092C35" flood-opacity="0.10"/>
        </filter>
        <style>
          .brand {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
            font-size: 29px;
            font-weight: 800;
            letter-spacing: 4px;
            fill: #0D5965;
          }
          .headline {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
            font-size: 73px;
            font-weight: 760;
            letter-spacing: -2.1px;
            fill: #102A32;
          }
        </style>
      </defs>

      <rect width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" fill="url(#background)"/>
      <circle cx="1162" cy="31" r="399" fill="url(#mintGlow)"/>
      <circle cx="-5" cy="294" r="330" fill="url(#limeGlow)"/>
      <path d="M1060 0 C1148 93 1216 170 1284 272 L1284 0 Z" fill="#20A58D" opacity="0.055"/>
      <path d="M0 211 C89 137 168 89 267 64" fill="none" stroke="#8DCB35" stroke-width="10" stroke-linecap="round" opacity="0.18"/>

      <rect x="${SCREEN_X - 1}" y="${SCREEN_Y - 1}" width="${SCREEN_WIDTH + 2}" height="${SCREEN_HEIGHT + 2}" rx="${SCREEN_RADIUS + 1}"
            fill="#FFFFFF" filter="url(#screenShadow)"/>
      <rect x="${SCREEN_X - 1}" y="${SCREEN_Y - 1}" width="${SCREEN_WIDTH + 2}" height="${SCREEN_HEIGHT + 2}" rx="${SCREEN_RADIUS + 1}"
            fill="none" stroke="#FFFFFF" stroke-width="5" opacity="0.94"/>

      <text x="181" y="94" class="brand">DIECIK</text>
      <circle cx="1114" cy="85" r="6" fill="#20A58D" opacity="0.50"/>
      <circle cx="1140" cy="85" r="6" fill="#84BE32" opacity="0.72"/>
      <circle cx="1166" cy="85" r="6" fill="#1B6D96" opacity="0.46"/>
      ${text}
    </svg>
  `);
}

async function roundedScreen(sourcePath) {
  const mask = Buffer.from(`
    <svg width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" rx="${SCREEN_RADIUS}" fill="#FFFFFF"/>
    </svg>
  `);

  return sharp(sourcePath)
    .resize({
      width: SCREEN_WIDTH,
      height: null,
      kernel: sharp.kernel.lanczos3,
    })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function brandMark() {
  return sharp(appIconPath)
    .trim({ background: "#FFFFFF", threshold: 12 })
    .resize({ width: 58, height: 58, fit: "inside" })
    .png()
    .toBuffer();
}

async function composeScreenshot(item, logo) {
  const sourcePath = path.join(rawDir, item.source);
  const outputPath = path.join(outputDir, item.output);
  const metadata = await sharp(sourcePath).metadata();

  if (metadata.width !== SOURCE_WIDTH || metadata.height !== SOURCE_HEIGHT) {
    throw new Error(
      `${item.source}: expected source ${SOURCE_WIDTH}x${SOURCE_HEIGHT}, got ${metadata.width}x${metadata.height}`,
    );
  }

  const screen = await roundedScreen(sourcePath);

  await sharp(titleSvg(item.lines))
    .composite([
      { input: logo, left: 107, top: 51 },
      { input: screen, left: SCREEN_X, top: SCREEN_Y },
    ])
    .flatten({ background: "#F4FAF7" })
    .removeAlpha()
    .toColourspace("srgb")
    .jpeg({
      quality: 94,
      chromaSubsampling: "4:4:4",
      progressive: true,
      mozjpeg: true,
    })
    .toFile(outputPath);
}

async function createContactSheet() {
  const canvasWidth = 1600;
  const canvasHeight = 1470;
  const thumbWidth = 278;
  const thumbHeight = Math.round((thumbWidth * OUTPUT_HEIGHT) / OUTPUT_WIDTH);
  const left = 57;
  const top = 125;
  const columnGap = 29;
  const rowGap = 92;
  const composites = [];

  for (let index = 0; index < screenshots.length; index += 1) {
    const item = screenshots[index];
    const column = index % 5;
    const row = Math.floor(index / 5);
    const x = left + column * (thumbWidth + columnGap);
    const y = top + row * (thumbHeight + rowGap);
    const thumb = await sharp(path.join(outputDir, item.output))
      .resize({ width: thumbWidth, kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
      .toBuffer();

    const label = Buffer.from(`
      <svg width="${thumbWidth}" height="52" xmlns="http://www.w3.org/2000/svg">
        <style>
          text {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
            fill: #29464D;
            font-size: 16px;
            font-weight: 700;
          }
        </style>
        <text x="0" y="31">${String(index + 1).padStart(2, "0")} · ${escapeXml(item.lines.join(" "))}</text>
      </svg>
    `);

    composites.push({ input: thumb, left: x, top: y });
    composites.push({ input: label, left: x, top: y + thumbHeight + 4 });
  }

  const contactBackground = Buffer.from(`
    <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F8FCFA"/>
          <stop offset="1" stop-color="#E8F6F2"/>
        </linearGradient>
        <style>
          .title {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
            font-size: 40px;
            font-weight: 760;
            fill: #102A32;
          }
          .meta {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
            font-size: 21px;
            font-weight: 600;
            fill: #567078;
          }
        </style>
      </defs>
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#bg)"/>
      <text x="57" y="62" class="title">Diecik · App Store screenshot set</text>
      <text x="57" y="96" class="meta">10 × JPG · 1284 × 2778 px · PL</text>
    </svg>
  `);

  await sharp(contactBackground)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(qaDir, CONTACT_PNG));
}

async function createContactHtml() {
  const cards = screenshots
    .map(
      (item, index) => `
        <figure>
          <img src="../${escapeHtml(path.basename(outputDir))}/${escapeHtml(item.output)}"
               alt="${escapeHtml(item.lines.join(" "))}">
          <figcaption>
            <strong>${String(index + 1).padStart(2, "0")}</strong>
            <span>${escapeHtml(item.lines.join(" "))}</span>
          </figcaption>
        </figure>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Diecik · App Store screenshot set</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #102a32; background: linear-gradient(135deg, #f8fcfa, #e8f6f2); }
    main { max-width: 1800px; margin: 0 auto; padding: 48px; }
    h1 { margin: 0; font-size: 42px; letter-spacing: -1px; }
    header p { margin: 8px 0 36px; color: #567078; font-weight: 600; }
    section { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 30px; align-items: start; }
    figure { margin: 0; }
    img { display: block; width: 100%; height: auto; border-radius: 18px; box-shadow: 0 18px 42px rgba(10, 61, 57, .16); }
    figcaption { display: flex; gap: 9px; padding: 12px 2px 0; font-size: 15px; line-height: 1.3; }
    figcaption strong { color: #168d7c; }
    @media (max-width: 1150px) { section { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 720px) { main { padding: 24px; } section { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Diecik · App Store screenshot set</h1>
      <p>10 × JPG · 1284 × 2778 px · język polski</p>
    </header>
    <section>${cards}
    </section>
  </main>
</body>
</html>
`;

  await fs.writeFile(path.join(qaDir, CONTACT_HTML), html, "utf8");
}

async function verifyOutputs() {
  const directoryEntries = await fs.readdir(outputDir, { withFileTypes: true });
  const files = directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const expected = screenshots.map((item) => item.output).sort();

  if (JSON.stringify(files) !== JSON.stringify(expected)) {
    throw new Error(
      `Final directory must contain exactly the expected 10 JPG files.\nExpected: ${expected.join(", ")}\nActual: ${files.join(", ")}`,
    );
  }

  for (const filename of expected) {
    const metadata = await sharp(path.join(outputDir, filename)).metadata();
    if (
      metadata.format !== "jpeg" ||
      metadata.width !== OUTPUT_WIDTH ||
      metadata.height !== OUTPUT_HEIGHT ||
      metadata.hasAlpha
    ) {
      throw new Error(
        `${filename}: invalid output (${metadata.format}, ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha})`,
      );
    }
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(qaDir, { recursive: true });

  const logo = await brandMark();
  for (const item of screenshots) {
    await composeScreenshot(item, logo);
    process.stdout.write(`Created ${item.output}\n`);
  }

  await verifyOutputs();
  await Promise.all([createContactSheet(), createContactHtml()]);
  process.stdout.write(
    `Verified 10 JPEG files at ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} with no alpha.\n`,
  );
  process.stdout.write(`Created QA contact sheet: ${CONTACT_PNG} and ${CONTACT_HTML}.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
