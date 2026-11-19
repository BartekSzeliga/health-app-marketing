import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../.tooling/node_modules/sharp/dist/index.mjs";
import ffmpegPath from "../.tooling/node_modules/ffmpeg-static/index.js";
import ffprobeStatic from "../.tooling/node_modules/ffprobe-static/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const ffprobePath = ffprobeStatic.path;
const checks = [];

const files = {
  video: path.join(
    root,
    "meta",
    "reels-stories",
    "diecik-meta-launch-15s-1080x1920.mp4",
  ),
  feed: path.join(
    root,
    "meta",
    "feed-images",
    "diecik-meta-launch-facebook-1080x1350.jpg",
  ),
  audio: path.join(
    root,
    "meta",
    "audio",
    "diecik-meta-launch-original.wav",
  ),
  subtitles: path.join(
    root,
    "meta",
    "subtitles",
    "diecik-meta-launch-15s-pl.srt",
  ),
  contact: path.join(
    root,
    "qa",
    "contact-sheets",
    "diecik-meta-launch-15s-contact-sheet.jpg",
  ),
  manifest: path.join(root, "MANIFEST.md"),
  instructions: path.join(root, "meta", "UPLOAD-INSTRUCTIONS.md"),
  facebookCopy: path.join(root, "meta", "copy", "facebook-launch-post.md"),
};

function check(name, condition, details = undefined) {
  const result = { name, pass: Boolean(condition) };
  if (details !== undefined) result.details = details;
  checks.push(result);
  if (!condition) process.stderr.write(`FAIL: ${name}${details ? ` — ${JSON.stringify(details)}` : ""}\n`);
}

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch {
    return false;
  }
}

function probe(file) {
  return JSON.parse(
    execFileSync(
      ffprobePath,
      [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    ),
  );
}

function frameRate(value) {
  const [numerator, denominator] = String(value).split("/").map(Number);
  return denominator ? numerator / denominator : numerator;
}

function measureLoudness(file) {
  const result = spawnSync(
    ffmpegPath,
    [
      "-hide_banner",
      "-i",
      file,
      "-af",
      "loudnorm=I=-14:LRA=6:TP=-1.5:print_format=json",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  const matches = result.stderr.match(/\{[\s\S]*?"target_offset"\s*:\s*"[^"]+"\s*\}/g);
  if (!matches?.length) {
    throw new Error(`Nie udało się odczytać pomiaru loudnorm:\n${result.stderr}`);
  }
  return JSON.parse(matches.at(-1));
}

function measureStability(file, start, duration = 0.35) {
  const result = spawnSync(
    ffmpegPath,
    [
      "-hide_banner",
      "-ss",
      String(start),
      "-t",
      String(duration),
      "-i",
      file,
      "-an",
      "-vf",
      "tblend=all_mode=difference,signalstats,metadata=print",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `Pomiar stabilności nie powiódł się dla ${file}`);
  }
  const averageValues = [...result.stderr.matchAll(/lavfi\.signalstats\.YAVG=([0-9.eE+-]+)/g)].map(
    (match) => Number(match[1]),
  );
  const peakValues = [...result.stderr.matchAll(/lavfi\.signalstats\.YMAX=([0-9.eE+-]+)/g)].map(
    (match) => Number(match[1]),
  );
  if (!averageValues.length || !peakValues.length) {
    throw new Error(`Brak danych pomiaru stabilności dla ${file} @ ${start}s`);
  }
  return {
    start,
    duration,
    maxAverageDifference: Math.max(...averageValues),
    maxPixelDifference: Math.max(...peakValues),
  };
}

function srtSeconds(value) {
  const match = value.match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!match) return Number.NaN;
  return (
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 1000
  );
}

for (const [name, file] of Object.entries(files)) {
  check(`Plik istnieje: ${name}`, await exists(file), path.relative(root, file));
}

if (await exists(files.feed)) {
  const metadata = await sharp(files.feed).metadata();
  check("Feed ma wymiary 1080 × 1350", metadata.width === 1080 && metadata.height === 1350, metadata);
  check("Feed jest JPEG", metadata.format === "jpeg", metadata.format);
  check("Feed jest sRGB", metadata.space === "srgb", metadata.space);
  check("Feed nie ma kanału alpha", !metadata.hasAlpha, metadata.hasAlpha);
  check("Feed ma proporcję 4:5", Math.abs(metadata.width / metadata.height - 0.8) < 0.0001);
}

if (await exists(files.video)) {
  const data = probe(files.video);
  const video = data.streams.find((stream) => stream.codec_type === "video");
  const audio = data.streams.find((stream) => stream.codec_type === "audio");
  const duration = Number(data.format.duration);
  check("Film ma wymiary 1080 × 1920", video?.width === 1080 && video?.height === 1920, {
    width: video?.width,
    height: video?.height,
  });
  check("Film ma proporcję 9:16", Math.abs(video?.width / video?.height - 9 / 16) < 0.0001);
  check("Kodek filmu to H.264", video?.codec_name === "h264", video?.codec_name);
  check("Profil filmu to H.264 High", video?.profile === "High", video?.profile);
  check("Pixel format to yuv420p", video?.pix_fmt === "yuv420p", video?.pix_fmt);
  check("Film ma stałe 30 fps", Math.abs(frameRate(video?.avg_frame_rate) - 30) < 0.001, {
    average: video?.avg_frame_rate,
    real: video?.r_frame_rate,
  });
  check("Film ma dokładnie 15 s", Math.abs(duration - 15) <= 0.05, duration);
  check(
    "Film ma pełne tagi BT.709",
    video?.color_space === "bt709" &&
      video?.color_transfer === "bt709" &&
      video?.color_primaries === "bt709",
    {
      space: video?.color_space,
      transfer: video?.color_transfer,
      primaries: video?.color_primaries,
    },
  );
  check("Audio w MP4 to AAC", audio?.codec_name === "aac", audio?.codec_name);
  check("Audio w MP4 ma 48 kHz", Number(audio?.sample_rate) === 48000, audio?.sample_rate);
  check("Audio w MP4 jest stereo", audio?.channels === 2, audio?.channels);
  check("Język ścieżki audio to polski", audio?.tags?.language === "pol", audio?.tags?.language);

  const loudness = measureLoudness(files.video);
  check(
    "Głośność filmu jest blisko -14 LUFS",
    Number(loudness.input_i) >= -15.2 && Number(loudness.input_i) <= -12.8,
    loudness,
  );
  check(
    "True peak nie przekracza -1 dBTP",
    Number(loudness.input_tp) <= -1,
    loudness,
  );

  const stability = [0.6, 3.2, 7.2, 12.6].map((start) =>
    measureStability(files.video, start),
  );
  check(
    "Plansze nie drgają między sąsiednimi klatkami",
    stability.every(
      (segment) =>
        segment.maxAverageDifference <= 0.05 &&
        segment.maxPixelDifference <= 20,
    ),
    stability,
  );
}

if (await exists(files.audio)) {
  const data = probe(files.audio);
  const audio = data.streams.find((stream) => stream.codec_type === "audio");
  check("Master WAV to PCM 16-bit", audio?.codec_name === "pcm_s16le", audio?.codec_name);
  check("Master WAV ma 48 kHz", Number(audio?.sample_rate) === 48000, audio?.sample_rate);
  check("Master WAV jest stereo", audio?.channels === 2, audio?.channels);
  check("Master WAV ma 15 s", Math.abs(Number(data.format.duration) - 15) <= 0.05, data.format.duration);
}

if (await exists(files.subtitles)) {
  const content = await fs.readFile(files.subtitles, "utf8");
  const blocks = content.trim().split(/\n\s*\n/);
  check("SRT ma cztery komunikaty", blocks.length === 4, blocks.length);
  const ranges = blocks.map((block) => {
    const timing = block.split("\n").find((line) => line.includes("-->"));
    const [start, end] = timing.split("-->").map((value) => srtSeconds(value.trim()));
    return { start, end };
  });
  check(
    "Napisy SRT nie nakładają się",
    ranges.every((range, index) => index === 0 || range.start >= ranges[index - 1].end),
    ranges,
  );
  check("Ostatni napis kończy się w 15 s", Math.abs(ranges.at(-1).end - 15) <= 0.001, ranges.at(-1));
  check("SRT zawiera polskie znaki", /[ąćęłńóśźż]/i.test(content));
}

if (await exists(files.contact)) {
  const metadata = await sharp(files.contact).metadata();
  check(
    "Plansza kontaktowa ma osiem klatek",
    metadata.format === "jpeg" && metadata.width === 1080 && metadata.height === 1038,
    metadata,
  );
}

const buildSource = await fs.readFile(
  path.join(root, "automation", "build-launch.mjs"),
  "utf8",
);
check(
  "Pipeline nie używa systemowego TTS",
  !buildSource.includes("/usr/bin/say") &&
    !buildSource.includes("flite=") &&
    !buildSource.includes('"Zosia"'),
);
check(
  "Pipeline nie używa skokowego zoompan",
  !buildSource.includes("zoompan="),
);

async function findForbidden(dir) {
  const found = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".build") continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await findForbidden(target)));
    if (
      entry.isFile() &&
      (entry.name === ".DS_Store" ||
        /(?:tts|narration|lektor)/i.test(entry.name))
    ) {
      found.push(path.relative(root, target));
    }
  }
  return found;
}

const forbidden = await findForbidden(root);
check("Pakiet nie zawiera plików TTS ani .DS_Store", forbidden.length === 0, forbidden);

const passed = checks.filter((item) => item.pass).length;
const failed = checks.length - passed;
const report = {
  campaign: "Diecik — start aplikacji",
  generatedAt: new Date().toISOString(),
  passed,
  failed,
  checks,
};
await fs.mkdir(path.join(root, "qa"), { recursive: true });
await fs.writeFile(
  path.join(root, "qa", "validation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

process.stdout.write(`Walidacja: ${passed} OK, ${failed} błędów.\n`);
if (failed > 0) process.exitCode = 1;
