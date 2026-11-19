import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs";
import ffmpegPath from "../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const consumerRoot = path.resolve(root, "..", "meta-start-aplikacji");
const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 15;
const TRANSITION = 0.2;
const SCENE_DURATIONS = [2.7, 3.0, 3.2, 3.1, 3.8];

const sourcePanelDir = path.join(root, "sources", "panel");
const logoSource = path.join(consumerRoot, "sources", "diecik-logo.png");
const sourceAudio = path.join(
  consumerRoot,
  "meta",
  "audio",
  "diecik-meta-launch-original.wav",
);
const buildDir = path.join(root, "qa", ".build", "specialist-motion");
const sceneDir = path.join(buildDir, "scenes");
const frameDir = path.join(buildDir, "frames");
const contactDir = path.join(root, "qa", "contact-sheets");
const outputVideo = path.join(
  root,
  "meta",
  "reels-stories",
  "diecik-meta-specialist-ruch-15s-v2-1080x1920.mp4",
);
const stagedVideo = path.join(
  buildDir,
  "diecik-meta-specialist-ruch-15s-v2-1080x1920.rendering.mp4",
);
const outputAudio = path.join(
  root,
  "meta",
  "audio",
  "diecik-meta-specialist-original.wav",
);
const outputSrt = path.join(
  root,
  "meta",
  "subtitles",
  "diecik-meta-specialist-ruch-15s-pl.srt",
);
const outputContact = path.join(
  contactDir,
  "diecik-meta-specialist-ruch-15s-contact-sheet.jpg",
);
const outputManifest = path.join(root, "qa", "specialist-ruch-manifest.json");
const outputConfig = path.join(root, "config", "specialist-ruch.json");
const specialistUrl = "https://diecik.com/specjalista";

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
    source: "02-training-plan-three-days.png",
    crop: { left: 110, top: 400, width: 2050, height: 1120 },
    output: "01-hook.png",
    eyebrow: "DIETETYKU",
    eyebrowWidth: 310,
    eyebrowHeight: 74,
    eyebrowFontSize: 31,
    title: ["TWOJA OPIEKA", "MOŻE WIĘCEJ"],
    body: [
      "Wyróżnij się i rozszerz ją o plan ruchu",
      "przygotowany dla klienta.",
    ],
    bodyY: 542,
    underlineY: 618,
    chips: ["PLAN KLIENTA", "JEDEN PANEL", "PUBLIKUJ W APLIKACJI"],
    centerChips: true,
    footer: "Dieta i trening w jednym procesie.",
    dark: true,
  },
  {
    source: "03-training-template-functional.png",
    crop: { left: 110, top: 430, width: 2050, height: 1120 },
    output: "02-template.png",
    eyebrow: "GOTOWY START",
    title: ["DODAJ PLAN", "TRENINGOWY."],
    body: "W tym samym pakiecie co dieta.",
    chips: ["SZABLONY", "DNI", "ĆWICZENIA"],
    footer: "Szablon skraca start. Ty dopasowujesz szczegóły.",
    dark: false,
  },
  {
    source: "08-diet-week-macro-micro.png",
    crop: { left: 10, top: 12, width: 1340, height: 789 },
    output: "03-diet.png",
    eyebrow: "PEŁNY OBRAZ DIETY",
    title: ["PLAN DIETY.", "MAKRO + MIKRO."],
    body: "Każdy dzień i wszystkie wartości w jednym widoku.",
    chips: ["PLAN DIETY", "MAKRO", "MIKROSKŁADNIKI"],
    footer: "Jadłospis i wartości odżywcze zawsze pod kontrolą.",
    dark: true,
  },
  {
    source: "05-package-ready-dieta-training.png",
    crop: { left: 110, top: 420, width: 2050, height: 1120 },
    output: "04-package.png",
    eyebrow: "GOTOWE DO PUBLIKACJI",
    title: ["DIETA + TRENING.", "JEDEN PAKIET."],
    body: "Opublikuj gotowy pakiet w aplikacji klienta.",
    chips: ["DIETA", "TRENING", "APLIKACJA"],
    footer: "Gotowy pakiet trafia bezpośrednio do aplikacji klienta.",
    dark: false,
  },
];

await Promise.all(
  [
    buildDir,
    sceneDir,
    frameDir,
    contactDir,
    path.dirname(outputVideo),
    path.dirname(outputAudio),
    path.dirname(outputSrt),
    path.dirname(outputConfig),
  ].map((directory) => fs.mkdir(directory, { recursive: true })),
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
          <stop offset="58%" stop-color="#0B5D68"/>
          <stop offset="100%" stop-color="#18A28D"/>
        </linearGradient>
        <filter id="shadow" x="-35%" y="-35%" width="170%" height="180%">
          <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#031A1F" flood-opacity=".28"/>
        </filter>
      </defs>
      <style>.sans { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }</style>
      ${body}
    </svg>`,
  );
}

function textLines(values, { x, y, size, lineHeight, fill, weight = 900 }) {
  return values
    .map(
      (value, index) =>
        `<text class="sans" x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" letter-spacing="-1.8" fill="${fill}">${xml(value)}</text>`,
    )
    .join("");
}

function eyebrow(label, dark, options = {}) {
  const fontSize = options.eyebrowFontSize ?? 23;
  const height = options.eyebrowHeight ?? 58;
  const width =
    options.eyebrowWidth ?? Math.max(220, Math.min(470, 96 + label.length * 15));
  const top = 240;
  const baseline = top + height / 2 + fontSize * 0.43;
  return `
    <rect x="90" y="${top}" width="${width}" height="${height}" rx="${height / 2}" fill="${dark ? colors.lime : colors.ink}"/>
    <text class="sans" x="${90 + width / 2}" y="${baseline}" text-anchor="middle" font-size="${fontSize}" font-weight="900" letter-spacing="1.6" fill="${dark ? colors.ink : colors.white}">${xml(label)}</text>`;
}

function paragraphLines(value, { x, y, size, lineHeight, fill, weight = 650 }) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .map(
      (line, index) =>
        `<text class="sans" x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}">${xml(line)}</text>`,
    )
    .join("");
}

function benefitChips(labels, dark, { center = false } = {}) {
  const widths = labels.map((label) => Math.max(180, 86 + label.length * 11.5));
  const gap = 14;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  const scale = Math.min(1, 900 / total);
  const scaled = widths.map((width) => width * scale);
  const scaledGap = gap * scale;
  const scaledTotal = scaled.reduce((sum, width) => sum + width, 0) + scaledGap * (scaled.length - 1);
  let x = 90 + (center ? (900 - scaledTotal) / 2 : 0);
  return labels
    .map((label, index) => {
      const width = scaled[index];
      const foreground = dark ? colors.white : colors.ink;
      const fill = dark ? "#FFFFFF" : colors.white;
      const fillOpacity = dark ? ".12" : ".9";
      const stroke = dark ? colors.white : colors.ocean;
      const mark = `
        <rect x="${x}" y="1302" width="${width}" height="64" rx="32" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-opacity=".28"/>
        <circle cx="${x + 31}" cy="1334" r="15" fill="${colors.lime}"/>
        <path d="M${x + 23} 1334l5 5 11-12" fill="none" stroke="${colors.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <text class="sans" x="${x + 56}" y="1342" font-size="${20 * scale}" font-weight="850" fill="${foreground}">${xml(label)}</text>`;
      x += width + scaledGap;
      return mark;
    })
    .join("");
}

async function panelImage(scene) {
  const screenshot = await sharp(path.join(sourcePanelDir, scene.source))
    .extract(scene.crop)
    .resize(900, 530, { fit: "contain", background: colors.white })
    .png()
    .toBuffer();
  const mask = svg(
    900,
    530,
    `<rect width="900" height="530" rx="30" fill="#FFFFFF"/>`,
  );
  return sharp(screenshot)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function brandLogo(size = 90) {
  return sharp(logoSource)
    .resize(size, size, { fit: "contain" })
    .png()
    .toBuffer();
}

async function buildPanelScene(scene, index) {
  const dark = scene.dark;
  const titleColor = dark ? colors.white : colors.ink;
  const bodyColor = dark ? colors.mint : colors.inkSoft;
  const bodyY = scene.bodyY ?? 552;
  const underlineY = scene.underlineY ?? 606;
  const logo = await brandLogo();
  const panel = await panelImage(scene);
  const background = svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="url(#${dark ? "dark" : "light"})"/>
     <circle cx="1010" cy="165" r="350" fill="${dark ? colors.lime : colors.mintBright}" opacity=".12"/>
     <circle cx="75" cy="1770" r="420" fill="${dark ? colors.mintBright : colors.lime}" opacity=".13"/>
     <rect x="74" y="68" width="122" height="122" rx="35" fill="#FFFFFF" filter="url(#shadow)"/>
     ${eyebrow(scene.eyebrow, dark, scene)}
     ${textLines(scene.title, {
       x: 90,
       y: 390,
       size: 65,
       lineHeight: 72,
       fill: titleColor,
     })}
     ${paragraphLines(scene.body, {
       x: 90,
       y: bodyY,
       size: 29,
       lineHeight: 38,
       fill: bodyColor,
     })}
     <rect x="90" y="${underlineY}" width="230" height="8" rx="4" fill="${dark ? colors.lime : colors.mintBright}"/>
     <rect x="70" y="665" width="940" height="590" rx="40" fill="#FFFFFF" filter="url(#shadow)"/>
     ${benefitChips(scene.chips, dark, { center: scene.centerChips })}
     <text class="sans" x="90" y="1450" font-size="24" font-weight="850" letter-spacing="1.5" fill="${dark ? colors.lime : colors.ocean}">PRAWDZIWY PANEL SPECJALISTY</text>
     <text class="sans" x="90" y="1501" font-size="27" font-weight="650" fill="${bodyColor}">${xml(scene.footer)}</text>
     <text class="sans" x="975" y="112" text-anchor="end" font-size="25" font-weight="800" fill="${titleColor}" opacity=".66">${index + 1}/5</text>`,
  );
  const output = path.join(sceneDir, scene.output);
  await sharp(background)
    .composite([
      { input: logo, left: 90, top: 84 },
      { input: panel, left: 90, top: 695 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(output);
  return output;
}

async function buildCtaScene() {
  const logo = await brandLogo(128);
  const screenshot = await sharp(
    path.join(sourcePanelDir, "05-package-ready-dieta-training.png"),
  )
    .extract({ left: 110, top: 420, width: 2050, height: 900 })
    .resize(900, 395, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const mask = svg(
    900,
    395,
    `<rect width="900" height="395" rx="30" fill="#FFFFFF"/>`,
  );
  const panel = await sharp(screenshot)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const background = svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="url(#dark)"/>
     <circle cx="1010" cy="165" r="360" fill="${colors.lime}" opacity=".13"/>
     <circle cx="70" cy="1760" r="430" fill="${colors.mintBright}" opacity=".15"/>
     <rect x="64" y="62" width="154" height="154" rx="42" fill="#FFFFFF" filter="url(#shadow)"/>
     <rect x="90" y="260" width="324" height="58" rx="29" fill="${colors.lime}"/>
     <text class="sans" x="252" y="299" text-anchor="middle" font-size="23" font-weight="900" letter-spacing="1.4" fill="${colors.ink}">DLA SPECJALISTÓW</text>
     ${textLines(["PEŁNIEJSZA OPIEKA.", "JEDEN PANEL."], {
       x: 90,
       y: 410,
       size: 62,
       lineHeight: 70,
       fill: colors.white,
     })}
     <text class="sans" x="90" y="568" font-size="29" font-weight="650" fill="${colors.mint}">Publikuj dietę i plan ruchu w aplikacji klienta.</text>
     <rect x="90" y="620" width="230" height="8" rx="4" fill="${colors.lime}"/>
     <rect x="70" y="675" width="940" height="455" rx="40" fill="#FFFFFF" filter="url(#shadow)"/>
     ${benefitChips(["DIETA + TRENING", "APLIKACJA KLIENTA"], true, { center: true }).replaceAll("1302", "1172").replaceAll("1334", "1204").replaceAll("1342", "1212")}
     <rect x="90" y="1300" width="900" height="96" rx="48" fill="${colors.lime}" filter="url(#shadow)"/>
     <text class="sans" x="540" y="1362" text-anchor="middle" font-size="31" font-weight="950" letter-spacing=".7" fill="${colors.ink}">SPRAWDŹ PANEL SPECJALISTY</text>
     <text class="sans" x="540" y="1454" text-anchor="middle" font-size="34" font-weight="850" fill="#FFFFFF">diecik.com/specjalista</text>
     <text class="sans" x="540" y="1510" text-anchor="middle" font-size="24" font-weight="650" fill="${colors.mint}">Free do 2 aktywnych klientów · bez karty</text>
     <text class="sans" x="975" y="112" text-anchor="end" font-size="25" font-weight="800" fill="#FFFFFF" opacity=".66">5/5</text>`,
  );
  const output = path.join(sceneDir, "05-cta.png");
  await sharp(background)
    .composite([
      { input: logo, left: 77, top: 76 },
      { input: panel, left: 90, top: 705 },
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

function buildVideo(scenePaths, destination) {
  const args = ["-y"];
  scenePaths.forEach((scene, index) => {
    args.push(
      "-loop",
      "1",
      "-framerate",
      String(FPS),
      "-t",
      String(SCENE_DURATIONS[index]),
      "-i",
      scene,
    );
  });
  args.push(
    "-i",
    outputAudio,
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
    "-g",
    String(FPS),
    "-keyint_min",
    String(FPS),
    "-sc_threshold",
    "0",
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
    destination,
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
    [0, 2.5, "Dietetyku: publikuj plany w aplikacji klienta."],
    [2.5, 5.3, "Dodaj plan treningowy w tym samym pakiecie co dieta."],
    [5.3, 8.3, "Plan diety, makro i mikroskładniki w jednym widoku."],
    [8.3, 11.2, "Opublikuj dietę i trening w aplikacji klienta."],
    [11.2, 15, "Pełniejsza opieka. Jeden panel. Sprawdź diecik.com/specjalista."],
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
  const output = path.join(
    frameDir,
    `${String(index + 1).padStart(2, "0")}-${time.toFixed(2)}.jpg`,
  );
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
  const times = [0.4, 2.35, 2.65, 5.1, 5.5, 8.1, 8.5, 11.0, 11.4, 14.6];
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
       <text class="sans" x="34" y="52" font-size="29" font-weight="850" fill="${colors.ink}">Diecik · specjalista · dieta + ruch · 15 s</text>`,
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

async function writeConfig() {
  const starts = [0, 2.5, 5.3, 8.3, 11.2];
  const config = {
    campaign: "Diecik — specjalista — dieta i ruch",
    language: "pl-PL",
    specialistUrl,
    video: {
      width: W,
      height: H,
      fps: FPS,
      durationSeconds: DURATION,
      sceneDurationsSeconds: SCENE_DURATIONS,
      sceneStartsSeconds: starts,
      transitionSeconds: TRANSITION,
      safeArea: { left: 90, right: 90, top: 240, bottom: 410 },
    },
    claims: {
      freePlan: "Free do 2 aktywnych klientów · bez karty",
      verifiedInSource: "health-app-frontend/src/pages/TrainerLanding.tsx",
    },
    copy: [
      "Twoja opieka może więcej — publikuj plany w aplikacji.",
      "Dodaj plan treningowy.",
      "Plan diety. Makro i mikro w jednym widoku.",
      "Dieta + trening. Publikacja w aplikacji klienta.",
      "Pełniejsza opieka. Jeden panel.",
    ],
  };
  await fs.writeFile(outputConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function writeManifest(scenePaths) {
  const sources = [];
  for (const scene of scenes) {
    const file = path.join(sourcePanelDir, scene.source);
    sources.push({
      file: path.relative(root, file),
      crop: scene.crop,
      sha256: await sha256(file),
    });
  }
  const ctaSource = path.join(
    sourcePanelDir,
    "05-package-ready-dieta-training.png",
  );
  sources.push({
    file: path.relative(root, ctaSource),
    crop: { left: 110, top: 420, width: 2050, height: 900 },
    sha256: await sha256(ctaSource),
  });
  const manifest = {
    generatedAt: new Date().toISOString(),
    durationSeconds: DURATION,
    sceneDurationsSeconds: SCENE_DURATIONS,
    transitionSeconds: TRANSITION,
    specialistUrl,
    demoClient: "Joanna Wysocka (DEMO)",
    usesRealSpecialistPanel: true,
    output: path.relative(root, outputVideo),
    outputSha256: await sha256(outputVideo),
    audio: {
      file: path.relative(root, outputAudio),
      sha256: await sha256(outputAudio),
      sourceCampaign: path.relative(root, sourceAudio),
    },
    subtitles: path.relative(root, outputSrt),
    contactSheet: path.relative(root, outputContact),
    config: path.relative(root, outputConfig),
    sources,
    scenes: scenePaths.map((file) => path.relative(root, file)),
  };
  await fs.writeFile(outputManifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

await Promise.all([
  fs.access(logoSource),
  fs.access(sourceAudio),
  ...scenes.map((scene) => fs.access(path.join(sourcePanelDir, scene.source))),
]);
await fs.copyFile(sourceAudio, outputAudio);
const scenePaths = [];
for (let index = 0; index < scenes.length; index += 1) {
  scenePaths.push(await buildPanelScene(scenes[index], index));
}
scenePaths.push(await buildCtaScene());
buildVideo(scenePaths, stagedVideo);
await fs.rename(stagedVideo, outputVideo);
await writeSubtitles();
await writeConfig();
await makeContactSheet();
await writeManifest(scenePaths);

process.stdout.write(
  `${JSON.stringify(
    {
      video: outputVideo,
      subtitles: outputSrt,
      contactSheet: outputContact,
      manifest: outputManifest,
    },
    null,
    2,
  )}\n`,
);
