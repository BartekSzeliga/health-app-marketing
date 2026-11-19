import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../.tooling/node_modules/sharp/dist/index.mjs";
import ffmpegPath from "../.tooling/node_modules/ffmpeg-static/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 15;
const TRANSITION = 0.2;
const SCENE_DURATIONS = [2.8, 2.8, 2.8, 2.8, 4.6];

const sourceDir = path.join(root, "moje zdjecia start aplikacji");
const marketingAssets = path.resolve(root, "..", "..", "assets");
const appStoreUrl = "https://apps.apple.com/pl/app/diecik/id6762611821?l=pl";
const googlePlayUrl =
  "https://play.google.com/store/apps/details?id=com.helti.app";
const appStoreQr = path.join(
  marketingAssets,
  "app-store",
  "diecik-app-store-qr-392x392.png",
);
const googlePlayQr = path.join(
  marketingAssets,
  "google-play",
  "diecik-google-play-qr-392x392.png",
);
const buildDir = path.join(root, "qa", ".build", "user-photos-stores-launch");
const frameDir = path.join(buildDir, "frames");
const sceneDir = path.join(buildDir, "scenes");
const contactDir = path.join(root, "qa", "contact-sheets");
const outputVideo = path.join(
  root,
  "meta",
  "reels-stories",
  "diecik-meta-launch-user-photos-stores-15s-1080x1920.mp4",
);
const outputSrt = path.join(
  root,
  "meta",
  "subtitles",
  "diecik-meta-launch-user-photos-stores-15s-pl.srt",
);
const outputContact = path.join(
  contactDir,
  "diecik-meta-launch-user-photos-stores-15s-contact-sheet.jpg",
);
const outputManifest = path.join(
  root,
  "qa",
  "user-photos-stores-launch-manifest.json",
);
const audio = path.join(
  root,
  "meta",
  "audio",
  "diecik-meta-launch-original.wav",
);

const colors = {
  ink: "#082F35",
  inkSoft: "#426269",
  ocean: "#0C6F84",
  mint: "#B6F1E2",
  mintBright: "#45D7BD",
  lime: "#D2F56F",
  cream: "#F6FAF5",
  white: "#FFFFFF",
};

const scenes = [
  {
    source: "1.png",
    output: "01-dieta.png",
    eyebrow: "PLAN DIETY",
    title: ["CAŁY DZIEŃ.", "JEDEN PLAN."],
    body: ["Posiłki i makro", "zawsze pod ręką."],
    dark: true,
  },
  {
    source: "2.png",
    output: "02-przepis.png",
    eyebrow: "PRZEPISY",
    title: ["OD POMYSŁU", "DO POSIŁKU."],
    body: ["Porcje, składniki", "i przygotowanie."],
    dark: false,
  },
  {
    source: "3.png",
    output: "03-trening.png",
    eyebrow: "PLAN TRENINGOWY",
    title: ["WIESZ, CO", "MASZ ROBIĆ."],
    body: ["Ćwiczenia, serie,", "powtórzenia i RPE."],
    dark: true,
  },
  {
    source: "4.png",
    output: "04-instrukcja.png",
    eyebrow: "ZACZNIJ Z DIECIKIEM",
    title: ["TRENUJ", "PEWNIEJ."],
    body: ["Technika i instrukcje", "zawsze pod ręką."],
    dark: false,
  },
];

await Promise.all(
  [buildDir, frameDir, sceneDir, contactDir, path.dirname(outputVideo), path.dirname(outputSrt)].map(
    (dir) => fs.mkdir(dir, { recursive: true }),
  ),
);

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
        <linearGradient id="light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FBFDF9"/>
          <stop offset="58%" stop-color="#EAF8F3"/>
          <stop offset="100%" stop-color="#D6F5EB"/>
        </linearGradient>
        <linearGradient id="dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#062A31"/>
          <stop offset="60%" stop-color="#0B5D68"/>
          <stop offset="100%" stop-color="#18A28D"/>
        </linearGradient>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#062A31" flood-opacity=".24"/>
        </filter>
      </defs>
      <style>.sans { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }</style>
      ${body}
    </svg>`,
  );
}

function textLines(values, { x, y, size, lineHeight, fill, weight = 800 }) {
  return values
    .map(
      (value, index) =>
        `<text class="sans" x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" letter-spacing="-1.3" fill="${fill}">${xml(value)}</text>`,
    )
    .join("");
}

function eyebrow(label, dark) {
  const width = Math.max(220, Math.min(430, 98 + label.length * 15));
  return `
    <rect x="90" y="238" width="${width}" height="58" rx="29" fill="${dark ? colors.lime : colors.ink}"/>
    <text class="sans" x="${90 + width / 2}" y="277" text-anchor="middle" font-size="23" font-weight="850" letter-spacing="1.5" fill="${dark ? colors.ink : colors.white}">${xml(label)}</text>`;
}

async function phone(source) {
  const screenWidth = 590;
  const screenHeight = 1283;
  const pad = 54;
  const radius = 42;
  const mask = svg(
    screenWidth,
    screenHeight,
    `<rect width="${screenWidth}" height="${screenHeight}" rx="${radius}" fill="#FFFFFF"/>`,
  );
  const screen = await sharp(source)
    .resize(screenWidth, screenHeight, { fit: "fill" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const outer = svg(
    screenWidth + pad * 2,
    screenHeight + pad * 2,
    `<rect x="${pad - 10}" y="${pad - 10}" width="${screenWidth + 20}" height="${screenHeight + 20}" rx="${radius + 10}" fill="#FFFFFF" filter="url(#shadow)"/>`,
  );
  return sharp(outer)
    .composite([{ input: screen, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function buildScene(scene, index) {
  const dark = scene.dark;
  const titleColor = dark ? colors.white : colors.ink;
  const bodyColor = dark ? colors.mint : colors.inkSoft;
  const logo = await sharp(path.join(root, "sources", "diecik-logo.png"))
    .resize(88, 88, { fit: "contain" })
    .png()
    .toBuffer();
  const device = await phone(path.join(sourceDir, scene.source));
  const background = svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="url(#${dark ? "dark" : "light"})"/>
     <circle cx="980" cy="150" r="330" fill="${dark ? colors.lime : colors.mintBright}" opacity=".12"/>
     <circle cx="90" cy="1740" r="380" fill="${dark ? colors.mintBright : colors.lime}" opacity=".13"/>
     <rect x="74" y="64" width="118" height="118" rx="34" fill="#FFFFFF" opacity=".98"/>
     ${eyebrow(scene.eyebrow, dark)}
     ${textLines(scene.title, {
       x: 90,
       y: 382,
       size: 66,
       lineHeight: 72,
       fill: titleColor,
       weight: 900,
     })}
     ${textLines(scene.body, {
       x: 90,
       y: 538,
       size: 29,
       lineHeight: 37,
       fill: bodyColor,
       weight: 650,
     })}
     <rect x="90" y="615" width="220" height="8" rx="4" fill="${dark ? colors.lime : colors.mintBright}"/>
     <text class="sans" x="975" y="112" text-anchor="end" font-size="27" font-weight="800" fill="${titleColor}" opacity=".72">${index + 1}/5</text>`,
  );
  const output = path.join(sceneDir, scene.output);
  await sharp(background)
    .composite([
      { input: logo, left: 89, top: 79 },
      { input: device, left: 191, top: 566 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(output);
  return output;
}

function benefitChip(x, width, label) {
  return `
    <rect x="${x}" y="692" width="${width}" height="62" rx="31" fill="#FFFFFF" opacity=".12" stroke="#FFFFFF" stroke-opacity=".24"/>
    <circle cx="${x + 31}" cy="723" r="15" fill="${colors.lime}"/>
    <path d="M${x + 23} 723l5 5 10-12" fill="none" stroke="${colors.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text class="sans" x="${x + 56}" y="731" font-size="21" font-weight="800" letter-spacing=".3" fill="#FFFFFF">${xml(label)}</text>`;
}

function storeBadge(x, y, platform) {
  const apple = platform === "apple";
  const icon = apple
    ? `<g transform="translate(${x + 24} ${y + 17}) scale(2.25)">
         <path fill="#FFFFFF" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
       </g>`
    : `<g transform="translate(${x + 24} ${y + 18}) scale(2.2)">
         <path fill="#00D2FF" d="M3.5 3.1v17.8L12.4 12 3.5 3.1Z"/>
         <path fill="#00E676" d="m3.5 3.1 11.2 6.5-2.3 2.4-8.9-8.9Z"/>
         <path fill="#FFEA00" d="m3.5 20.9 11.2-6.5-2.3-2.4-8.9 8.9Z"/>
         <path fill="#FF3D00" d="m14.7 9.6 4.7 2.7c.4.2.4.6 0 .8l-4.7 2.7-2.3-3.8 2.3-2.4Z"/>
       </g>`;
  return `
    <rect x="${x}" y="${y}" width="340" height="88" rx="20" fill="#111827"/>
    ${icon}
    <text class="sans" x="${x + 94}" y="${y + 33}" font-size="18" font-weight="650" letter-spacing=".8" fill="#FFFFFF">Pobierz w</text>
    <text class="sans" x="${x + 94}" y="${y + 68}" font-size="31" font-weight="800" letter-spacing="-.5" fill="#FFFFFF">${apple ? "App Store" : "Google Play"}</text>`;
}

async function buildDownloadScene() {
  const appIcon = await sharp(path.join(root, "sources", "diecik-icon.png"))
    .resize(120, 120, { fit: "contain" })
    .png()
    .toBuffer();
  const [appleQr, googleQr] = await Promise.all(
    [appStoreQr, googlePlayQr].map((source) =>
      sharp(source)
        .resize(294, 294, { fit: "fill", kernel: sharp.kernel.nearest })
        .png()
        .toBuffer(),
    ),
  );
  const background = svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="url(#dark)"/>
     <circle cx="1020" cy="210" r="390" fill="${colors.lime}" opacity=".13"/>
     <circle cx="65" cy="1715" r="430" fill="${colors.mintBright}" opacity=".16"/>
     <circle cx="490" cy="305" r="112" fill="#FFFFFF" opacity=".08"/>
     <rect x="410" y="225" width="160" height="160" rx="44" fill="#FFFFFF" filter="url(#shadow)"/>
     <text class="sans" x="490" y="441" text-anchor="middle" font-size="24" font-weight="850" letter-spacing="2.8" fill="${colors.lime}">DIECIK — NOWA APLIKACJA</text>
     <text class="sans" x="490" y="535" text-anchor="middle" font-size="78" font-weight="900" letter-spacing="-2" fill="#FFFFFF">ZACZNIJ DZISIAJ.</text>
     <text class="sans" x="490" y="595" text-anchor="middle" font-size="33" font-weight="650" fill="${colors.mint}">Twój plan diety i treningu — zawsze pod ręką.</text>
     ${benefitChip(80, 245, "DIETA I MAKRO")}
     ${benefitChip(340, 260, "PLANY TRENINGOWE")}
     ${benefitChip(615, 285, "PRZEPISY I TECHNIKA")}
     <text class="sans" x="490" y="823" text-anchor="middle" font-size="30" font-weight="900" letter-spacing="2.2" fill="#FFFFFF">ZESKANUJ I POBIERZ</text>
     <rect x="80" y="850" width="380" height="545" rx="34" fill="#FFFFFF" filter="url(#shadow)"/>
     <rect x="520" y="850" width="380" height="545" rx="34" fill="#FFFFFF" filter="url(#shadow)"/>
     ${storeBadge(100, 875, "apple")}
     ${storeBadge(540, 875, "google")}
     <text class="sans" x="270" y="1350" text-anchor="middle" font-size="21" font-weight="850" letter-spacing="1.6" fill="${colors.ink}">ZESKANUJ KOD</text>
     <text class="sans" x="710" y="1350" text-anchor="middle" font-size="21" font-weight="850" letter-spacing="1.6" fill="${colors.ink}">ZESKANUJ KOD</text>
     <text class="sans" x="490" y="1490" text-anchor="middle" font-size="28" font-weight="750" fill="${colors.mint}">Dostępny na iOS i Androidzie</text>
     <text class="sans" x="975" y="112" text-anchor="end" font-size="27" font-weight="800" fill="#FFFFFF" opacity=".72">5/5</text>`,
  );
  const output = path.join(sceneDir, "05-pobierz-aplikacje.png");
  await sharp(background)
    .composite([
      { input: appIcon, left: 430, top: 245 },
      { input: appleQr, left: 123, top: 990 },
      { input: googleQr, left: 563, top: 990 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(output);
  return output;
}

function runFfmpeg(args, { quiet = false } = {}) {
  if (quiet) {
    const result = spawnSync(ffmpegPath, args, { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || `ffmpeg failed with status ${result.status}`);
    }
    return result;
  }
  execFileSync(ffmpegPath, args, { stdio: "inherit" });
  return undefined;
}

function videoFilter() {
  const inputs = SCENE_DURATIONS.map(
    (_duration, index) =>
      `[${index}:v]fps=${FPS},scale=${W}:${H}:flags=lanczos,format=yuv420p,setsar=1[v${index}]`,
  ).join(";");
  let chain = "";
  let previous = "v0";
  let cumulative = SCENE_DURATIONS[0];
  for (let index = 1; index < SCENE_DURATIONS.length; index += 1) {
    const output = index === SCENE_DURATIONS.length - 1 ? "vout" : `vx${index}`;
    const offset = cumulative - index * TRANSITION;
    chain += `;[${previous}][v${index}]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${output}]`;
    previous = output;
    cumulative += SCENE_DURATIONS[index];
  }
  return `${inputs}${chain};[vout]trim=duration=${DURATION},setpts=PTS-STARTPTS[vfinal]`;
}

function buildVideo(scenePaths) {
  const args = ["-y"];
  scenePaths.forEach((scene, index) => {
    args.push("-loop", "1", "-t", String(SCENE_DURATIONS[index]), "-i", scene);
  });
  args.push(
    "-i",
    audio,
    "-filter_complex",
    videoFilter(),
    "-map",
    "[vfinal]",
    "-map",
    `${scenePaths.length}:a:0`,
    "-t",
    String(DURATION),
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "17",
    "-profile:v",
    "high",
    "-level:v",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-fps_mode",
    "cfr",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-c:a",
    "aac",
    "-b:a",
    "256k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-metadata:s:a:0",
    "language=pol",
    "-movflags",
    "+faststart",
    outputVideo,
  );
  runFfmpeg(args);
}

function srtTime(value) {
  const milliseconds = Math.round(value * 1000);
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  return `00:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

async function writeSubtitles() {
  const cues = [
    [0, 2.7, "Plan diety\nCały dzień. Jeden plan."],
    [2.7, 5.3, "Przepisy\nOd pomysłu do posiłku."],
    [5.3, 7.9, "Plan treningowy\nWiesz, co masz robić."],
    [7.9, 10.5, "Technika ćwiczeń\nTrenuj pewniej."],
    [10.5, 15, "Zacznij dzisiaj\nZeskanuj kod i pobierz Diecik."],
  ];
  const content = cues
    .map(
      ([start, end, text], index) =>
        `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${text}\n`,
    )
    .join("\n");
  await fs.writeFile(outputSrt, content, "utf8");
}

async function extractFrame(time, index) {
  const output = path.join(frameDir, `${String(index + 1).padStart(2, "0")}-${time.toFixed(2)}.jpg`);
  runFfmpeg(
    [
      "-y",
      "-ss",
      String(time),
      "-i",
      outputVideo,
      "-frames:v",
      "1",
      "-update",
      "1",
      "-q:v",
      "2",
      output,
    ],
    { quiet: true },
  );
  return output;
}

async function makeContactSheet() {
  const times = [0.4, 2.45, 2.85, 5.05, 5.45, 7.65, 8.05, 10.25, 10.65, 14.55];
  const frames = [];
  for (let index = 0; index < times.length; index += 1) {
    frames.push(await extractFrame(times[index], index));
  }
  const thumbWidth = 216;
  const thumbHeight = 384;
  const header = 84;
  const canvas = sharp(
    svg(
      1080,
      header + thumbHeight * 2,
      `<rect width="1080" height="${header + thumbHeight * 2}" fill="${colors.cream}"/>
       <text class="sans" x="34" y="52" font-size="29" font-weight="850" fill="${colors.ink}">Diecik · zdjęcia 1–4 + pobranie · 15 s</text>`,
    ),
  );
  const composites = [];
  for (let index = 0; index < frames.length; index += 1) {
    composites.push({
      input: await sharp(frames[index])
        .resize(thumbWidth, thumbHeight, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer(),
      left: (index % 5) * thumbWidth,
      top: header + Math.floor(index / 5) * thumbHeight,
    });
  }
  await canvas
    .composite(composites)
    .flatten({ background: colors.cream })
    .jpeg({ quality: 92 })
    .toFile(outputContact);
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function writeManifest(scenePaths) {
  const sources = [];
  for (let index = 0; index < scenes.length; index += 1) {
    const source = path.join(sourceDir, scenes[index].source);
    sources.push({
      order: index + 1,
      file: path.relative(root, source),
      sha256: await sha256(source),
    });
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceOrder: [1, 2, 3, 4],
    durationSeconds: DURATION,
    sceneDurationsSeconds: SCENE_DURATIONS,
    transitionSeconds: TRANSITION,
    output: path.relative(root, outputVideo),
    outputSha256: await sha256(outputVideo),
    subtitles: path.relative(root, outputSrt),
    contactSheet: path.relative(root, outputContact),
    storeLinks: {
      appStore: appStoreUrl,
      googlePlay: googlePlayUrl,
    },
    qrSources: {
      appStore: {
        file: path.relative(root, appStoreQr),
        sha256: await sha256(appStoreQr),
      },
      googlePlay: {
        file: path.relative(root, googlePlayQr),
        sha256: await sha256(googlePlayQr),
      },
    },
    sources,
    scenes: scenePaths.map((file) => path.relative(root, file)),
  };
  await fs.writeFile(outputManifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

await fs.access(audio);
await fs.access(appStoreQr);
await fs.access(googlePlayQr);
for (const scene of scenes) {
  await fs.access(path.join(sourceDir, scene.source));
}

const scenePaths = [];
for (let index = 0; index < scenes.length; index += 1) {
  scenePaths.push(await buildScene(scenes[index], index));
}
scenePaths.push(await buildDownloadScene());
buildVideo(scenePaths);
await writeSubtitles();
await makeContactSheet();
await writeManifest(scenePaths);

process.stdout.write(`${outputVideo}\n`);
