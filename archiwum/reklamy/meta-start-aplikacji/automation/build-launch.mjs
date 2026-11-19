import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../.tooling/node_modules/sharp/dist/index.mjs";
import ffmpegPath from "../.tooling/node_modules/ffmpeg-static/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const config = JSON.parse(
  await fs.readFile(path.join(root, "config", "launch.json"), "utf8"),
);

const W = config.video.width;
const H = config.video.height;
const FEED_W = config.feed.width;
const FEED_H = config.feed.height;
const FPS = config.video.fps;
const DURATION = config.video.durationSeconds;
const TRANSITION = config.video.transitionSeconds;
const SCENE_DURATIONS = config.video.sceneDurationsSeconds;

const theme = {
  ink: "#082F35",
  inkSoft: "#426269",
  ocean: "#0C6F84",
  blue: "#8EDAF2",
  mint: "#B6F1E2",
  mintBright: "#45D7BD",
  lime: "#D2F56F",
  cream: "#F6FAF5",
  white: "#FFFFFF",
  mist: "#E9F7F2",
};

const dirs = {
  scenes: path.join(root, "qa", ".build", "scenes"),
  temp: path.join(root, "qa", ".build"),
  proof: path.join(root, "qa", "proof"),
  frames: path.join(root, "qa", "frames"),
  contact: path.join(root, "qa", "contact-sheets"),
  video: path.join(root, "meta", "reels-stories"),
  feed: path.join(root, "meta", "feed-images"),
  audio: path.join(root, "meta", "audio"),
  subtitles: path.join(root, "meta", "subtitles"),
};
const appleLoopDir = "/Library/Audio/Apple Loops/Apple/07 Chillwave";
const appleLoops = {
  guitar: path.join(appleLoopDir, "Moving Pictures Acoustic Guitar.caf"),
  bass: path.join(appleLoopDir, "Moving Pictures Bass.caf"),
  beat: path.join(appleLoopDir, "Minimal Backbeat 01.caf"),
  texture: path.join(appleLoopDir, "Moving Pictures Synth.caf"),
};

await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));

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
        <linearGradient id="lightBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FBFDF9"/>
          <stop offset="58%" stop-color="#EAF8F3"/>
          <stop offset="100%" stop-color="#D6F5EB"/>
        </linearGradient>
        <linearGradient id="deepBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#062A31"/>
          <stop offset="58%" stop-color="#0B5D68"/>
          <stop offset="100%" stop-color="#18A28D"/>
        </linearGradient>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="25" stdDeviation="27" flood-color="#062A31" flood-opacity=".22"/>
        </filter>
        <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#062A31" flood-opacity=".16"/>
        </filter>
      </defs>
      <style>
        .sans { font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif; }
      </style>
      ${body}
    </svg>`,
  );
}

function textLines(
  values,
  {
    x,
    y,
    size,
    lineHeight,
    fill = theme.ink,
    weight = 800,
    anchor = "start",
    letterSpacing = 0,
  },
) {
  return values
    .map(
      (value, index) =>
        `<text class="sans" x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${fill}">${xml(value)}</text>`,
    )
    .join("");
}

function eyebrow(x, y, label, width, { dark = false } = {}) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="58" rx="29" fill="${dark ? theme.lime : theme.ink}"/>
    <text class="sans" x="${x + width / 2}" y="${y + 39}" text-anchor="middle" font-size="23" font-weight="850" letter-spacing="1.8" fill="${dark ? theme.ink : theme.white}">${xml(label)}</text>
  `;
}

async function logo(size) {
  return sharp(path.join(root, "sources", "diecik-logo.png"))
    .resize(size, size, { fit: "contain" })
    .png()
    .toBuffer();
}

async function icon(size) {
  return sharp(path.join(root, "sources", "diecik-icon.png"))
    .resize(size, size, { fit: "cover" })
    .png()
    .toBuffer();
}

async function phone(source, width, height) {
  const radius = Math.round(width * 0.068);
  const inset = Math.max(10, Math.round(width * 0.025));
  const shadowPad = Math.max(45, Math.round(width * 0.1));
  const mask = svg(
    width,
    height,
    `<rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>`,
  );
  const screen = await sharp(source)
    .resize(width, height, { fit: "cover", position: "top" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const outerW = width + shadowPad * 2;
  const outerH = height + shadowPad * 2;
  const frame = svg(
    outerW,
    outerH,
    `<rect x="${shadowPad - inset}" y="${shadowPad - inset}" width="${width + inset * 2}" height="${height + inset * 2}" rx="${radius + inset}" fill="#FFFFFF" filter="url(#shadow)"/>`,
  );
  return sharp(frame)
    .composite([{ input: screen, left: shadowPad, top: shadowPad }])
    .png()
    .toBuffer();
}

async function writePng(output, buffer) {
  await sharp(buffer).png({ compressionLevel: 9 }).toFile(output);
  return output;
}

async function sceneLaunch(output) {
  const diet = await phone(
    path.join(root, "sources", "mobile", "diet-plan-ready.png"),
    398,
    888,
  );
  const training = await phone(
    path.join(root, "sources", "mobile", "training-generator-configured.png"),
    398,
    888,
  );
  const rotatedDiet = await sharp(diet)
    .rotate(-5, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const rotatedTraining = await sharp(training)
    .rotate(5, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const mark = await logo(106);
  const body = svg(
    W,
    H,
    `
      <rect width="${W}" height="${H}" fill="url(#deepBg)"/>
      <circle cx="986" cy="240" r="360" fill="${theme.lime}" opacity=".12"/>
      <circle cx="80" cy="1670" r="420" fill="${theme.mintBright}" opacity=".12"/>
      <rect x="52" y="70" width="130" height="130" rx="36" fill="#FFFFFF" opacity=".98"/>
      ${eyebrow(90, 252, "NOWA APLIKACJA", 316, { dark: true })}
      ${textLines(["DIECIK", "JUŻ JEST"], {
        x: 90,
        y: 416,
        size: 85,
        lineHeight: 92,
        fill: theme.white,
        weight: 900,
        letterSpacing: -2,
      })}
      ${textLines(["Dieta i trening", "w jednym miejscu."], {
        x: 90,
        y: 622,
        size: 35,
        lineHeight: 44,
        fill: theme.mint,
        weight: 650,
      })}
      <rect x="86" y="727" width="260" height="9" rx="5" fill="${theme.lime}"/>
    `,
  );
  return writePng(
    output,
    await sharp(body)
      .composite([
        { input: mark, left: 64, top: 82 },
        { input: rotatedDiet, left: 42, top: 768 },
        { input: rotatedTraining, left: 498, top: 734 },
      ])
      .png()
      .toBuffer(),
  );
}

async function sceneDiet(output) {
  const device = await phone(
    path.join(root, "sources", "mobile", "diet-generator-configured.png"),
    592,
    1321,
  );
  const mark = await logo(78);
  const body = svg(
    W,
    H,
    `
      <rect width="${W}" height="${H}" fill="url(#lightBg)"/>
      <circle cx="1000" cy="120" r="260" fill="${theme.blue}" opacity=".22"/>
      <circle cx="55" cy="1690" r="330" fill="${theme.lime}" opacity=".20"/>
      ${eyebrow(90, 252, "PLAN DIETY", 232)}
      ${textLines(["USTAW.", "WYGENERUJ."], {
        x: 90,
        y: 410,
        size: 72,
        lineHeight: 80,
        fill: theme.ink,
        weight: 900,
        letterSpacing: -1.7,
      })}
      ${textLines(["Preferencje, wykluczenia", "i makro pod ręką."], {
        x: 90,
        y: 597,
        size: 31,
        lineHeight: 41,
        fill: theme.inkSoft,
        weight: 650,
      })}
      <rect x="86" y="714" width="250" height="8" rx="4" fill="${theme.mintBright}"/>
      <rect x="900" y="72" width="106" height="106" rx="30" fill="#FFFFFF" opacity=".95"/>
    `,
  );
  return writePng(
    output,
    await sharp(body)
      .composite([
        { input: mark, left: 914, top: 86 },
        { input: device, left: 375, top: 630 },
      ])
      .png()
      .toBuffer(),
  );
}

async function sceneTraining(output) {
  const device = await phone(
    path.join(root, "sources", "mobile", "training-generator-configured.png"),
    565,
    1261,
  );
  const instruction = await phone(
    path.join(root, "sources", "mobile", "exercise-instruction.png"),
    344,
    768,
  );
  const mark = await logo(78);
  const body = svg(
    W,
    H,
    `
      <rect width="${W}" height="${H}" fill="url(#lightBg)"/>
      <circle cx="1040" cy="1660" r="430" fill="${theme.mintBright}" opacity=".16"/>
      <circle cx="40" cy="120" r="280" fill="${theme.lime}" opacity=".18"/>
      ${eyebrow(90, 252, "PLAN TRENINGOWY", 344)}
      ${textLines(["TRENUJ", "PO SWOJEMU."], {
        x: 90,
        y: 410,
        size: 70,
        lineHeight: 80,
        fill: theme.ink,
        weight: 900,
        letterSpacing: -1.7,
      })}
      ${textLines(["Wybierz dni, czas,", "poziom i sprzęt."], {
        x: 90,
        y: 597,
        size: 31,
        lineHeight: 41,
        fill: theme.inkSoft,
        weight: 650,
      })}
      <rect x="86" y="714" width="250" height="8" rx="4" fill="${theme.ocean}"/>
      <g transform="translate(82 880)">
        <rect width="340" height="248" rx="40" fill="${theme.ink}" filter="url(#softShadow)"/>
        <circle cx="58" cy="65" r="22" fill="${theme.lime}"/>
        <text class="sans" x="98" y="76" font-size="27" font-weight="820" fill="${theme.white}">Twój rytm</text>
        <text class="sans" x="42" y="139" font-size="24" font-weight="650" fill="${theme.mint}">dni · czas · poziom</text>
        <text class="sans" x="42" y="184" font-size="24" font-weight="650" fill="${theme.mint}">sprzęt · ograniczenia</text>
      </g>
      <rect x="900" y="72" width="106" height="106" rx="30" fill="#FFFFFF" opacity=".95"/>
    `,
  );
  return writePng(
    output,
    await sharp(body)
      .composite([
        { input: mark, left: 914, top: 86 },
        { input: device, left: 440, top: 610 },
        { input: instruction, left: 40, top: 1094 },
      ])
      .png()
      .toBuffer(),
  );
}

async function sceneCta(output) {
  const app = await icon(190);
  const body = svg(
    W,
    H,
    `
      <rect width="${W}" height="${H}" fill="url(#deepBg)"/>
      <circle cx="1000" cy="210" r="390" fill="${theme.lime}" opacity=".12"/>
      <circle cx="64" cy="1740" r="430" fill="${theme.mintBright}" opacity=".13"/>
      <rect x="429" y="305" width="222" height="222" rx="62" fill="#FFFFFF" filter="url(#shadow)"/>
      ${eyebrow(432, 585, "DIECIK", 216, { dark: true })}
      ${textLines(["ZACZNIJ", "DZISIAJ."], {
        x: 540,
        y: 795,
        size: 82,
        lineHeight: 96,
        fill: theme.white,
        weight: 900,
        anchor: "middle",
        letterSpacing: -1.8,
      })}
      ${textLines(["Dieta i trening", "w jednym miejscu."], {
        x: 540,
        y: 1050,
        size: 34,
        lineHeight: 44,
        fill: theme.mint,
        weight: 650,
        anchor: "middle",
      })}
      <text class="sans" x="540" y="1256" text-anchor="middle" font-size="37" font-weight="850" fill="${theme.white}">Pobierz aplikację</text>
      <rect x="360" y="1300" width="360" height="8" rx="4" fill="${theme.lime}"/>
      <text class="sans" x="540" y="1380" text-anchor="middle" font-size="29" font-weight="700" letter-spacing="1.4" fill="${theme.mint}">iOS  •  ANDROID</text>
    `,
  );
  return writePng(
    output,
    await sharp(body)
      .composite([{ input: app, left: 445, top: 321 }])
      .png()
      .toBuffer(),
  );
}

async function feedHero(output) {
  const diet = await phone(
    path.join(root, "sources", "mobile", "diet-plan-ready.png"),
    342,
    763,
  );
  const training = await phone(
    path.join(root, "sources", "mobile", "training-generator-configured.png"),
    342,
    763,
  );
  const dietRotated = await sharp(diet)
    .rotate(-4, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const trainingRotated = await sharp(training)
    .rotate(4, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const mark = await logo(92);
  const body = svg(
    FEED_W,
    FEED_H,
    `
      <rect width="${FEED_W}" height="${FEED_H}" fill="url(#deepBg)"/>
      <circle cx="1000" cy="160" r="330" fill="${theme.lime}" opacity=".12"/>
      <circle cx="70" cy="1220" r="360" fill="${theme.mintBright}" opacity=".13"/>
      <rect x="48" y="46" width="118" height="118" rx="34" fill="#FFFFFF"/>
      ${eyebrow(64, 212, "NOWA APLIKACJA", 304, { dark: true })}
      ${textLines(["DIECIK JUŻ JEST"], {
        x: 64,
        y: 386,
        size: 72,
        lineHeight: 80,
        fill: theme.white,
        weight: 900,
        letterSpacing: -1.8,
      })}
      ${textLines(["Dieta i trening.", "W jednym miejscu."], {
        x: 64,
        y: 468,
        size: 31,
        lineHeight: 40,
        fill: theme.mint,
        weight: 650,
      })}
      <rect x="64" y="573" width="256" height="8" rx="4" fill="${theme.lime}"/>
    `,
  );
  const footer = svg(
    FEED_W,
    FEED_H,
    `
      <rect x="64" y="1202" width="660" height="96" rx="48" fill="#FFFFFF" opacity=".96" filter="url(#softShadow)"/>
      <circle cx="120" cy="1250" r="17" fill="${theme.mintBright}"/>
      <text class="sans" x="164" y="1261" font-size="30" font-weight="850" fill="${theme.ink}">Pobierz aplikację</text>
      <text class="sans" x="470" y="1260" font-size="25" font-weight="750" fill="${theme.ocean}">iOS + Android</text>
    `,
  );
  await sharp(body)
    .composite([
      { input: mark, left: 61, top: 59 },
      { input: dietRotated, left: 260, top: 548 },
      { input: trainingRotated, left: 630, top: 530 },
      { input: footer, left: 0, top: 0 },
    ])
    .flatten({ background: theme.ink })
    .toColourspace("srgb")
    .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
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

async function buildAudio() {
  const output = path.join(dirs.audio, "diecik-meta-launch-original.wav");
  for (const [name, file] of Object.entries(appleLoops)) {
    try {
      await fs.access(file);
    } catch {
      throw new Error(
        `Brak Apple Loop "${name}": ${file}. Zainstaluj bibliotekę dźwięków GarageBand.`,
      );
    }
  }
  runFfmpeg([
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    appleLoops.guitar,
    "-stream_loop",
    "-1",
    "-i",
    appleLoops.bass,
    "-stream_loop",
    "-1",
    "-i",
    appleLoops.beat,
    "-stream_loop",
    "-1",
    "-i",
    appleLoops.texture,
    "-filter_complex",
    [
      "[0:a]atrim=0:15,asetpts=PTS-STARTPTS,volume=0.72,highpass=f=95,lowpass=f=10500,afade=t=in:st=0:d=0.18,afade=t=out:st=14.15:d=0.85[guitar]",
      "[1:a]atrim=0:15,asetpts=PTS-STARTPTS,volume=0.30,highpass=f=42,lowpass=f=420,afade=t=in:st=0.25:d=0.65,afade=t=out:st=14.1:d=0.9[bass]",
      "[2:a]atrim=0:15,asetpts=PTS-STARTPTS,volume=0.34,highpass=f=65,lowpass=f=9200,afade=t=in:st=0:d=0.35,afade=t=out:st=14.15:d=0.85[beat]",
      "[3:a]atrim=0:15,asetpts=PTS-STARTPTS,volume=0.12,highpass=f=170,lowpass=f=7600,afade=t=in:st=6.15:d=1.1,afade=t=out:st=14.0:d=1.0[texture]",
      "[guitar][bass][beat][texture]amix=inputs=4:duration=longest:normalize=0,acompressor=threshold=0.18:ratio=2.2:attack=20:release=220:makeup=1,loudnorm=I=-14:LRA=7:TP=-1.5,atrim=0:15,apad,atrim=0:15[out]",
    ].join(";"),
    "-map",
    "[out]",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-c:a",
    "pcm_s16le",
    output,
  ]);
  return output;
}

function videoFilter(durations, totalDuration) {
  const inputs = durations
    .map(
      (_duration, index) =>
        `[${index}:v]fps=${FPS},scale=${W}:${H}:flags=lanczos,` +
        `format=yuv420p,setsar=1[v${index}]`,
    )
    .join(";");
  let chain = "";
  let previous = "v0";
  let cumulative = durations[0];
  for (let index = 1; index < durations.length; index += 1) {
    const output = index === durations.length - 1 ? "vout" : `vx${index}`;
    const offset = cumulative - index * TRANSITION;
    chain += `;[${previous}][v${index}]xfade=transition=fade:duration=${TRANSITION}:offset=${offset.toFixed(3)}[${output}]`;
    previous = output;
    cumulative += durations[index];
  }
  return `${inputs}${chain};[vout]trim=duration=${totalDuration},setpts=PTS-STARTPTS[vfinal]`;
}

function buildVideo(scenePaths, durations, duration, audio, output) {
  const args = ["-y"];
  scenePaths.forEach((scene, index) => {
    args.push("-loop", "1", "-t", String(durations[index]), "-i", scene);
  });
  args.push(
    "-i",
    audio,
    "-filter_complex",
    videoFilter(durations, duration),
    "-map",
    "[vfinal]",
    "-map",
    `${scenePaths.length}:a:0`,
    "-t",
    String(duration),
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
    output,
  );
  runFfmpeg(args);
}

function srtTime(value) {
  const milliseconds = Math.round(value * 1000);
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

async function writeSubtitles(output) {
  const cues = [
    [0, 2.4, "Diecik już jest!\\nDieta i trening w jednym miejscu."],
    [2.4, 6.2, "Plan diety\\nUstaw preferencje. Wygeneruj swój plan."],
    [6.2, 11.8, "Plan treningowy\\nWybierz dni, czas, poziom i sprzęt."],
    [11.8, 15, "Zacznij z Diecikiem\\nPobierz aplikację."],
  ];
  const content = cues
    .map(
      ([start, end, text], index) =>
        `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${text}\n`,
    )
    .join("\n");
  await fs.writeFile(output, content, "utf8");
}

async function extractFrame(video, time, output) {
  runFfmpeg([
    "-y",
    "-ss",
    String(time),
    "-i",
    video,
    "-frames:v",
    "1",
    "-update",
    "1",
    "-q:v",
    "2",
    output,
  ]);
  return output;
}

async function makeContactSheet(video, times, output, title) {
  const thumbW = 270;
  const thumbH = 480;
  const columns = 4;
  const rows = Math.ceil(times.length / columns);
  const header = 78;
  const framePaths = [];
  for (let index = 0; index < times.length; index += 1) {
    const target = path.join(
      dirs.frames,
      `${path.basename(video, ".mp4")}-${index + 1}.jpg`,
    );
    await extractFrame(video, times[index], target);
    framePaths.push(target);
  }
  const canvas = sharp(
    svg(
      thumbW * columns,
      header + thumbH * rows,
      `<rect width="${thumbW * columns}" height="${header + thumbH * rows}" fill="${theme.cream}"/>
       <text class="sans" x="34" y="49" font-size="28" font-weight="850" fill="${theme.ink}">${xml(title)}</text>`,
    ),
  );
  const composites = [];
  for (let index = 0; index < framePaths.length; index += 1) {
    composites.push({
      input: await sharp(framePaths[index])
        .resize(thumbW, thumbH, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer(),
      left: (index % columns) * thumbW,
      top: header + Math.floor(index / columns) * thumbH,
    });
  }
  await canvas
    .composite(composites)
    .flatten({ background: theme.cream })
    .jpeg({ quality: 92 })
    .toFile(output);
  return output;
}

async function buildScenes() {
  const paths = [
    path.join(dirs.scenes, "01-launch.png"),
    path.join(dirs.scenes, "02-diet.png"),
    path.join(dirs.scenes, "03-training.png"),
    path.join(dirs.scenes, "04-cta.png"),
  ];
  await sceneLaunch(paths[0]);
  await sceneDiet(paths[1]);
  await sceneTraining(paths[2]);
  await sceneCta(paths[3]);
  return paths;
}

async function hash(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function writeManifest(files) {
  const rows = [];
  for (const file of files) {
    const stat = await fs.stat(file);
    rows.push(
      `| \`${path.relative(root, file)}\` | ${(stat.size / 1024 / 1024).toFixed(2)} MB | \`${await hash(file)}\` |`,
    );
  }
  const content = `# Diecik — launch Meta

Pierwszy zestaw informujący o starcie aplikacji, przygotowany dla Facebooka i
Instagrama. Materiał wideo ma własny instrumentalny miks z royalty-free Apple
Loops dołączonych do GarageBand, nie zawiera lektora i zachowuje pełny sens po
wyciszeniu.

## Pliki publikacyjne

| Plik | Rozmiar | SHA-256 |
|---|---:|---|
${rows.join("\n")}

## Specyfikacja

- film: 1080 × 1920, 15 s, 30 fps CFR, H.264 High, yuv420p, BT.709;
- obraz: stabilne plansze bez ciągłego zoomu; ruch tylko w 0,2-sekundowych
  przejściach crossfade;
- audio w filmie: AAC-LC, 48 kHz, stereo;
- grafika Feed: 1080 × 1350, JPEG, sRGB;
- interfejs: aktualne zrzuty aplikacji z 18 lipca 2026;
- audio: własny miks royalty-free Apple Loops; źródła i warunki użycia opisano
  w \`meta/audio/LICENSES.md\`;
- copy i kolejność publikacji: katalog \`meta/copy\` oraz
  \`meta/UPLOAD-INSTRUCTIONS.md\`.

## Reprodukcja

\`\`\`bash
npm ci --prefix marketing/reklamy/meta-start-aplikacji/.tooling
node marketing/reklamy/meta-start-aplikacji/automation/build-launch.mjs
node marketing/reklamy/meta-start-aplikacji/automation/validate-launch.mjs
\`\`\`
`;
  await fs.writeFile(path.join(root, "MANIFEST.md"), content, "utf8");
}

async function buildProof(scenes, audio) {
  const feed = path.join(dirs.proof, "diecik-meta-launch-proof-1080x1350.jpg");
  await feedHero(feed);
  const proofVideo = path.join(dirs.proof, "diecik-meta-launch-proof-6s.mp4");
  buildVideo(scenes.slice(0, 2), [2.6, 3.6], 6, audio, proofVideo);
  await makeContactSheet(
    proofVideo,
    [0.35, 2.15, 2.85, 5.45],
    path.join(dirs.proof, "diecik-meta-launch-proof-contact-sheet.jpg"),
    "Diecik · launch Meta · proof 6 s",
  );
  runFfmpeg([
    "-y",
    "-i",
    audio,
    "-filter_complex",
    "showwavespic=s=1080x280:colors=0C6F84|45D7BD",
    "-frames:v",
    "1",
    "-update",
    "1",
    path.join(dirs.proof, "diecik-meta-launch-audio-waveform.png"),
  ]);
}

async function buildFull(scenes, audio) {
  const video = path.join(
    dirs.video,
    "diecik-meta-launch-15s-1080x1920.mp4",
  );
  const feed = path.join(
    dirs.feed,
    "diecik-meta-launch-facebook-1080x1350.jpg",
  );
  const subtitles = path.join(
    dirs.subtitles,
    "diecik-meta-launch-15s-pl.srt",
  );
  await feedHero(feed);
  buildVideo(scenes, SCENE_DURATIONS, DURATION, audio, video);
  await writeSubtitles(subtitles);
  const contact = path.join(
    dirs.contact,
    "diecik-meta-launch-15s-contact-sheet.jpg",
  );
  await makeContactSheet(
    video,
    [0.35, 2.15, 2.9, 5.65, 6.75, 10.9, 12.35, 14.25],
    contact,
    "Diecik · launch Meta · final 15 s",
  );
  await writeManifest([video, feed, audio, subtitles]);
}

const mode = process.argv.includes("--proof") ? "proof" : "full";
const scenes = await buildScenes();
const audio = await buildAudio();

if (mode === "proof") {
  await buildProof(scenes, audio);
  process.stdout.write("Proof launchowy gotowy w qa/proof.\n");
} else {
  await buildFull(scenes, audio);
  process.stdout.write("Finalny zestaw launchowy Meta gotowy.\n");
}
