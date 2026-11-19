#!/usr/bin/env node

/**
 * Builds the production Google Play phone screenshot set from real Android
 * emulator captures. The final assets are exact 9:16 JPEG files.
 */

const fs = require("node:fs/promises");
const path = require("node:path");

const exportDir = path.resolve(__dirname, "..");
const sharp = require(
  path.resolve(
    exportDir,
    "..",
    "..",
    "app-store",
    "ios-2026-07-17",
    ".tooling",
    "node_modules",
    "sharp",
  ),
);

const rawDir = path.join(exportDir, "raw");
const outputDir = path.join(exportDir, "screenshots-phone-1080x1920");
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

const SOURCE_WIDTH = 1280;
const SOURCE_HEIGHT = 2856;
const SOURCE_CROP_HEIGHT = 2304;
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const SCREEN_WIDTH = 900;
const SCREEN_HEIGHT = 1620;
const SCREEN_X = Math.round((OUTPUT_WIDTH - SCREEN_WIDTH) / 2);
const SCREEN_Y = 300;
const SCREEN_RADIUS = 46;
const CONTACT_PNG = "screenshots-contact-sheet-1080x1920.png";
const CONTACT_HTML = "screenshots-contact-sheet-1080x1920.html";

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
    source: "my-workouts.png",
    output: "06-trening-zaplanowany-na-dzis.jpg",
    lines: ["Trening zaplanowany", "na dziś"],
  },
  {
    source: "exercise-instruction.png",
    output: "07-technika-krok-po-kroku.jpg",
    lines: ["Technika krok po kroku"],
  },
  {
    source: "weight-trend.png",
    output: "08-postepy-ktore-widac.jpg",
    lines: ["Postępy, które widać"],
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

function titleSvg(lines) {
  const firstBaseline = lines.length === 1 ? 228 : 174;
  const lineGap = 66;
  const text = lines
    .map(
      (line, index) =>
        `<text x="90" y="${firstBaseline + index * lineGap}" class="headline">${escapeXml(line)}</text>`,
    )
    .join("");

  return Buffer.from(`
    <svg width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FAFDFB"/>
          <stop offset="0.50" stop-color="#EFF9F6"/>
          <stop offset="1" stop-color="#DFF2EC"/>
        </linearGradient>
        <radialGradient id="mintGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#5DDFC4" stop-opacity="0.30"/>
          <stop offset="1" stop-color="#5DDFC4" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="limeGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#B7DE42" stop-opacity="0.20"/>
          <stop offset="1" stop-color="#B7DE42" stop-opacity="0"/>
        </radialGradient>
        <filter id="screenShadow" x="-25%" y="-15%" width="150%" height="145%">
          <feDropShadow dx="0" dy="22" stdDeviation="25" flood-color="#0A3D39" flood-opacity="0.20"/>
          <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#092C35" flood-opacity="0.10"/>
        </filter>
        <style>
          .brand {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 3.5px;
            fill: #0D5965;
          }
          .headline {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
            font-size: 59px;
            font-weight: 760;
            letter-spacing: -1.7px;
            fill: #102A32;
          }
        </style>
      </defs>

      <rect width="${OUTPUT_WIDTH}" height="${OUTPUT_HEIGHT}" fill="url(#background)"/>
      <circle cx="1004" cy="10" r="330" fill="url(#mintGlow)"/>
      <circle cx="-10" cy="245" r="280" fill="url(#limeGlow)"/>
      <path d="M895 0 C974 82 1025 145 1080 238 L1080 0 Z" fill="#20A58D" opacity="0.055"/>
      <path d="M0 182 C73 121 140 80 226 57" fill="none" stroke="#8DCB35" stroke-width="8" stroke-linecap="round" opacity="0.18"/>

      <rect x="${SCREEN_X - 1}" y="${SCREEN_Y - 1}" width="${SCREEN_WIDTH + 2}" height="${SCREEN_HEIGHT + 2}" rx="${SCREEN_RADIUS + 1}"
            fill="#FFFFFF" filter="url(#screenShadow)"/>
      <rect x="${SCREEN_X - 1}" y="${SCREEN_Y - 1}" width="${SCREEN_WIDTH + 2}" height="${SCREEN_HEIGHT + 2}" rx="${SCREEN_RADIUS + 1}"
            fill="none" stroke="#FFFFFF" stroke-width="5" opacity="0.95"/>

      <text x="151" y="81" class="brand">DIECIK</text>
      <circle cx="938" cy="71" r="5" fill="#20A58D" opacity="0.50"/>
      <circle cx="961" cy="71" r="5" fill="#84BE32" opacity="0.72"/>
      <circle cx="984" cy="71" r="5" fill="#1B6D96" opacity="0.46"/>
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
    .extract({
      left: 0,
      top: 0,
      width: SOURCE_WIDTH,
      height: SOURCE_CROP_HEIGHT,
    })
    .resize({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function brandMark() {
  return sharp(appIconPath)
    .trim({ background: "#FFFFFF", threshold: 12 })
    .resize({ width: 48, height: 48, fit: "inside" })
    .png()
    .toBuffer();
}

async function composeScreenshot(item, logo) {
  const sourcePath = path.join(rawDir, item.source);
  const outputPath = path.join(outputDir, item.output);
  const metadata = await sharp(sourcePath).metadata();

  if (metadata.width !== SOURCE_WIDTH || metadata.height !== SOURCE_HEIGHT) {
    throw new Error(
      `${item.source}: expected ${SOURCE_WIDTH}x${SOURCE_HEIGHT}, got ${metadata.width}x${metadata.height}`,
    );
  }

  const screen = await roundedScreen(sourcePath);

  await sharp(titleSvg(item.lines))
    .composite([
      { input: logo, left: 90, top: 41 },
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
  const canvasWidth = 1400;
  const canvasHeight = 1330;
  const thumbWidth = 290;
  const thumbHeight = Math.round((thumbWidth * OUTPUT_HEIGHT) / OUTPUT_WIDTH);
  const left = 45;
  const top = 120;
  const columnGap = 40;
  const rowGap = 84;
  const composites = [];

  for (let index = 0; index < screenshots.length; index += 1) {
    const item = screenshots[index];
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = left + column * (thumbWidth + columnGap);
    const y = top + row * (thumbHeight + rowGap);
    const thumb = await sharp(path.join(outputDir, item.output))
      .resize({ width: thumbWidth, kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
      .toBuffer();

    const label = Buffer.from(`
      <svg width="${thumbWidth}" height="54" xmlns="http://www.w3.org/2000/svg">
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
      <text x="45" y="55" class="title">Diecik · Google Play screenshot set</text>
      <text x="45" y="91" class="meta">8 × JPG · 1080 × 1920 px · 9:16 · PL</text>
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
          <img src="../${path.basename(outputDir)}/${item.output}" alt="${escapeXml(item.lines.join(" "))}">
          <figcaption><strong>${String(index + 1).padStart(2, "0")}</strong> ${escapeXml(item.lines.join(" "))}</figcaption>
        </figure>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Diecik · Google Play screenshot set</title>
  <style>
    :root { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; color: #102a32; }
    * { box-sizing: border-box; }
    body { margin: 0; background: linear-gradient(135deg, #f8fcfa, #e8f6f2); }
    main { max-width: 1500px; margin: 0 auto; padding: 48px; }
    h1 { margin: 0; font-size: 42px; letter-spacing: -1px; }
    header p { margin: 8px 0 36px; color: #567078; font-weight: 600; }
    section { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 30px; }
    figure { margin: 0; }
    img { display: block; width: 100%; border-radius: 18px; box-shadow: 0 18px 42px rgba(10, 61, 57, .16); }
    figcaption { padding: 12px 2px 0; font-size: 15px; font-weight: 650; }
    figcaption strong { margin-right: 8px; color: #168d7c; }
    @media (max-width: 1000px) { section { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Diecik · Google Play screenshot set</h1>
      <p>8 × JPG · 1080 × 1920 px · dokładne 9:16 · język polski</p>
    </header>
    <section>${cards}</section>
  </main>
</body>
</html>
`;

  await fs.writeFile(path.join(qaDir, CONTACT_HTML), html, "utf8");
}

async function verifyOutputs() {
  const files = (await fs.readdir(outputDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
  const expected = screenshots.map((item) => item.output).sort();

  if (JSON.stringify(files) !== JSON.stringify(expected)) {
    throw new Error(
      `Final directory must contain exactly 8 expected JPG files.\nExpected: ${expected.join(", ")}\nActual: ${files.join(", ")}`,
    );
  }

  for (const filename of expected) {
    const filePath = path.join(outputDir, filename);
    const [metadata, stats] = await Promise.all([
      sharp(filePath).metadata(),
      fs.stat(filePath),
    ]);

    if (
      metadata.format !== "jpeg" ||
      metadata.width !== OUTPUT_WIDTH ||
      metadata.height !== OUTPUT_HEIGHT ||
      metadata.hasAlpha ||
      stats.size > 8 * 1024 * 1024
    ) {
      throw new Error(
        `${filename}: invalid output (${metadata.format}, ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha}, bytes=${stats.size})`,
      );
    }
  }
}

async function main() {
  await fs.rm(outputDir, { recursive: true, force: true });
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
    `Verified 8 JPEG files at ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}, exact 9:16, no alpha, below 8 MB.\n`,
  );
  process.stdout.write(`Created QA contact sheet: ${CONTACT_PNG} and ${CONTACT_HTML}.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
