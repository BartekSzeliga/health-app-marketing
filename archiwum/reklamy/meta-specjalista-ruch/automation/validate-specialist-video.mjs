import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs";
import ffmpegPath from "../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js";
import ffprobeStatic from "../../meta-start-aplikacji/.tooling/node_modules/ffprobe-static/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const projectRoot = path.resolve(root, "..", "..", "..");
const ffprobePath = ffprobeStatic.path;
const outputValidation = path.join(root, "qa", "validation.json");

const files = {
  video: path.join(
    root,
    "meta",
    "reels-stories",
    "diecik-meta-specialist-ruch-15s-v2-1080x1920.mp4",
  ),
  audio: path.join(
    root,
    "meta",
    "audio",
    "diecik-meta-specialist-original.wav",
  ),
  subtitles: path.join(
    root,
    "meta",
    "subtitles",
    "diecik-meta-specialist-ruch-15s-pl.srt",
  ),
  contact: path.join(
    root,
    "qa",
    "contact-sheets",
    "diecik-meta-specialist-ruch-15s-contact-sheet.jpg",
  ),
  direction: path.join(
    root,
    "qa",
    "direction",
    "diecik-specialist-direction-v1.png",
  ),
  manifest: path.join(root, "qa", "specialist-ruch-manifest.json"),
  captureManifest: path.join(root, "qa", "capture-manifest.json"),
  config: path.join(root, "config", "specialist-ruch.json"),
};

const checks = [];

function check(name, condition, details = undefined) {
  const item = { name, pass: Boolean(condition) };
  if (details !== undefined) item.details = details;
  checks.push(item);
  if (!item.pass) {
    process.stderr.write(
      `FAIL: ${name}${details === undefined ? "" : ` — ${JSON.stringify(details)}`}\n`,
    );
  }
}

async function exists(file) {
  try {
    return (await fs.stat(file)).isFile();
  } catch {
    return false;
  }
}

function run(binary, args) {
  return spawnSync(binary, args, { encoding: "utf8" });
}

function probe(file, countFrames = false) {
  const args = ["-v", "error"];
  if (countFrames) args.push("-count_frames");
  args.push("-show_streams", "-show_format", "-of", "json", file);
  const result = run(ffprobePath, args);
  if (result.status !== 0) {
    throw new Error(result.stderr || `ffprobe failed for ${file}`);
  }
  return JSON.parse(result.stdout);
}

function frameRate(value) {
  const [numerator, denominator] = String(value).split("/").map(Number);
  return denominator ? numerator / denominator : numerator;
}

function measureLoudness(file) {
  const result = run(ffmpegPath, [
    "-hide_banner",
    "-i",
    file,
    "-af",
    "loudnorm=I=-14:LRA=6:TP=-1.5:print_format=json",
    "-f",
    "null",
    "-",
  ]);
  const matches = result.stderr.match(
    /\{[\s\S]*?"target_offset"\s*:\s*"[^"]+"\s*\}/g,
  );
  if (!matches?.length) {
    throw new Error(`Nie udało się odczytać loudnorm:\n${result.stderr}`);
  }
  return JSON.parse(matches.at(-1));
}

function measureStability(file, start, duration = 0.35) {
  const result = run(ffmpegPath, [
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
  ]);
  if (result.status !== 0) {
    throw new Error(result.stderr || `Stability measurement failed at ${start}`);
  }
  const averages = [
    ...result.stderr.matchAll(/lavfi\.signalstats\.YAVG=([0-9.eE+-]+)/g),
  ].map((match) => Number(match[1]));
  const peaks = [
    ...result.stderr.matchAll(/lavfi\.signalstats\.YMAX=([0-9.eE+-]+)/g),
  ].map((match) => Number(match[1]));
  return {
    start,
    maxAverageDifference: Math.max(...averages),
    maxPixelDifference: Math.max(...peaks),
  };
}

function readFrameTimes(file, { keyframesOnly = false } = {}) {
  const args = ["-v", "error", "-select_streams", "v:0"];
  if (keyframesOnly) args.push("-skip_frame", "nokey");
  args.push(
    "-show_frames",
    "-show_entries",
    "frame=best_effort_timestamp_time,key_frame",
    "-of",
    "json",
    file,
  );
  const result = run(ffprobePath, args);
  if (result.status !== 0) {
    throw new Error(result.stderr || `Frame probe failed for ${file}`);
  }
  return JSON.parse(result.stdout).frames.map((frame) => ({
    keyFrame: Number(frame.key_frame) === 1,
    time: Number(frame.best_effort_timestamp_time),
  }));
}

function frameFingerprint(file, time) {
  const result = run(ffmpegPath, [
    "-v",
    "error",
    "-ss",
    String(time),
    "-i",
    file,
    "-map",
    "0:v:0",
    "-frames:v",
    "1",
    "-f",
    "md5",
    "-",
  ]);
  if (result.status !== 0) {
    throw new Error(result.stderr || `Frame fingerprint failed at ${time}`);
  }
  return { time, hash: result.stdout.trim() };
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

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

for (const [name, file] of Object.entries(files)) {
  check(`Plik istnieje: ${name}`, await exists(file), path.relative(root, file));
}

const videoProbe = probe(files.video, true);
const video = videoProbe.streams.find((stream) => stream.codec_type === "video");
const embeddedAudio = videoProbe.streams.find(
  (stream) => stream.codec_type === "audio",
);
const duration = Number(videoProbe.format.duration);
const frameCount = Number(video?.nb_read_frames ?? video?.nb_frames);
const videoSize = (await fs.stat(files.video)).size;
const videoBytes = await fs.readFile(files.video);
const moovOffset = videoBytes.indexOf(Buffer.from("moov"));
const mdatOffset = videoBytes.indexOf(Buffer.from("mdat"));

check("Film ma wymiary 1080 × 1920", video?.width === 1080 && video?.height === 1920, {
  width: video?.width,
  height: video?.height,
});
check("Film ma proporcję 9:16", Math.abs(video.width / video.height - 9 / 16) < 0.0001);
check("Kodek obrazu to H.264", video?.codec_name === "h264", video?.codec_name);
check("Profil obrazu to High", video?.profile === "High", video?.profile);
check("Poziom H.264 to 4.1", Number(video?.level) === 41, video?.level);
check("Pixel format to yuv420p", video?.pix_fmt === "yuv420p", video?.pix_fmt);
check("Film ma stałe 30 fps", Math.abs(frameRate(video?.avg_frame_rate) - 30) < 0.001 && Math.abs(frameRate(video?.r_frame_rate) - 30) < 0.001, {
  average: video?.avg_frame_rate,
  real: video?.r_frame_rate,
});
check("Film ma dokładnie 15 s", Math.abs(duration - 15) <= 0.01, duration);
check("Film ma dokładnie 450 klatek", frameCount === 450, frameCount);
check(
  "Atom moov jest przed mdat i plik wspiera progresywne odtwarzanie",
  moovOffset > 0 && mdatOffset > 0 && moovOffset < mdatOffset,
  { moovOffset, mdatOffset },
);

const frameTimes = readFrameTimes(files.video);
const frameDeltas = frameTimes.slice(1).map((frame, index) =>
  frame.time - frameTimes[index].time,
);
const maximumFrameStepError = Math.max(
  ...frameDeltas.map((delta) => Math.abs(delta - 1 / 30)),
);
check(
  "Timestampy wszystkich klatek są ciągłe i monotoniczne",
  frameTimes.length === 450 &&
    frameDeltas.every((delta) => delta > 0) &&
    maximumFrameStepError <= 0.00001,
  { count: frameTimes.length, maximumFrameStepError },
);

const keyframeTimes = readFrameTimes(files.video, { keyframesOnly: true }).map(
  (frame) => frame.time,
);
const keyframeGaps = keyframeTimes
  .slice(1)
  .map((time, index) => time - keyframeTimes[index]);
keyframeGaps.push(duration - keyframeTimes.at(-1));
const maximumKeyframeGap = Math.max(...keyframeGaps);
check(
  "Klatka kluczowa występuje co najwyżej co sekundę",
  keyframeTimes[0] === 0 && maximumKeyframeGap <= 1.01,
  { keyframeTimes, maximumKeyframeGap },
);

const representativeFrames = [0.8, 3.5, 6.6, 9.5, 13.2].map((time) =>
  frameFingerprint(files.video, time),
);
check(
  "Film zawiera pięć różnych scen i nie zatrzymuje się na scenie 2",
  new Set(representativeFrames.map((frame) => frame.hash)).size === 5,
  representativeFrames,
);
check(
  "Film ma komplet tagów BT.709",
  video?.color_space === "bt709" &&
    video?.color_transfer === "bt709" &&
    video?.color_primaries === "bt709",
  {
    space: video?.color_space,
    transfer: video?.color_transfer,
    primaries: video?.color_primaries,
  },
);
check("Audio w MP4 to AAC", embeddedAudio?.codec_name === "aac", embeddedAudio?.codec_name);
check("Audio w MP4 ma 48 kHz", Number(embeddedAudio?.sample_rate) === 48000, embeddedAudio?.sample_rate);
check("Audio w MP4 jest stereo", embeddedAudio?.channels === 2, embeddedAudio?.channels);
check("Język ścieżki audio to polski", embeddedAudio?.tags?.language === "pol", embeddedAudio?.tags?.language);
check("MP4 ma praktyczny rozmiar do Meta", videoSize > 500_000 && videoSize < 30_000_000, videoSize);

const decode = run(ffmpegPath, [
  "-v",
  "error",
  "-i",
  files.video,
  "-map",
  "0:v:0",
  "-map",
  "0:a:0",
  "-f",
  "null",
  "-",
]);
check("Pełne dekodowanie obrazu i dźwięku przechodzi bez błędów", decode.status === 0, decode.stderr.trim());

const loudness = measureLoudness(files.video);
check("Głośność filmu jest blisko -14 LUFS", Number(loudness.input_i) >= -15.2 && Number(loudness.input_i) <= -12.8, loudness);
check("True peak nie przekracza -1 dBTP", Number(loudness.input_tp) <= -1, loudness.input_tp);

const stability = [0.6, 3.5, 6.6, 9.5, 13.2].map((time) =>
  measureStability(files.video, time),
);
check(
  "Plansze są stabilne poza przejściami",
  stability.every(
    (item) =>
      item.maxAverageDifference <= 0.05 && item.maxPixelDifference <= 64,
  ),
  stability,
);

const audioProbe = probe(files.audio);
const wave = audioProbe.streams.find((stream) => stream.codec_type === "audio");
check("Master WAV to PCM 16-bit", wave?.codec_name === "pcm_s16le", wave?.codec_name);
check("Master WAV ma 48 kHz stereo", Number(wave?.sample_rate) === 48000 && wave?.channels === 2, {
  sampleRate: wave?.sample_rate,
  channels: wave?.channels,
});
check("Master WAV ma 15 s", Math.abs(Number(audioProbe.format.duration) - 15) <= 0.01, audioProbe.format.duration);

const subtitles = await fs.readFile(files.subtitles, "utf8");
const subtitleBlocks = subtitles.trim().split(/\n\s*\n/);
const subtitleRanges = subtitleBlocks.map((block) => {
  const timing = block.split("\n").find((line) => line.includes("-->"));
  const [start, end] = timing.split("-->").map((value) => srtSeconds(value.trim()));
  return { start, end };
});
check("SRT ma pięć komunikatów", subtitleBlocks.length === 5, subtitleBlocks.length);
check("Napisy SRT nie nakładają się", subtitleRanges.every((range, index) => index === 0 || range.start >= subtitleRanges[index - 1].end), subtitleRanges);
check("Pierwszy napis zaczyna się w 0 s", subtitleRanges[0].start === 0, subtitleRanges[0]);
check("Ostatni napis kończy się w 15 s", subtitleRanges.at(-1).end === 15, subtitleRanges.at(-1));
check("SRT zawiera polskie znaki", /[ąćęłńóśźż]/i.test(subtitles));

const contact = await sharp(files.contact).metadata();
check("Kontaktówka ma 1080 × 852", contact.width === 1080 && contact.height === 852, contact);
check("Kontaktówka jest JPEG sRGB", contact.format === "jpeg" && contact.space === "srgb", {
  format: contact.format,
  space: contact.space,
});
const direction = await sharp(files.direction).metadata();
check("Plansza kierunkowa ma 1080 × 1920", direction.width === 1080 && direction.height === 1920, direction);

const manifest = JSON.parse(await fs.readFile(files.manifest, "utf8"));
check("Manifest wskazuje prawdziwy panel specjalisty", manifest.usesRealSpecialistPanel === true);
check("Manifest wskazuje klienta DEMO", manifest.demoClient === "Joanna Wysocka (DEMO)", manifest.demoClient);
check("Hash MP4 zgadza się z manifestem", manifest.outputSha256 === (await sha256(files.video)), {
  expected: manifest.outputSha256,
  actual: await sha256(files.video),
});
check("Manifest ma pięć scen", manifest.scenes.length === 5, manifest.scenes);
for (const relativeScene of manifest.scenes) {
  const scenePath = path.join(root, relativeScene);
  const metadata = await sharp(scenePath).metadata();
  check(`Scena ma 1080 × 1920: ${path.basename(scenePath)}`, metadata.width === 1080 && metadata.height === 1920, metadata);
}

const captureManifest = JSON.parse(
  await fs.readFile(files.captureManifest, "utf8"),
);
check("Capture używa klienta DEMO", captureManifest.demoClient === "Joanna Wysocka (DEMO)", captureManifest.demoClient);
check("Finalny capture był tylko do odczytu", captureManifest.readOnlyCapture === true);
check("Finalny capture nie wykonał zapisów API", captureManifest.unexpectedWrites.length === 0, captureManifest.unexpectedWrites);
check("Capture zawiera siedem czystych kadrów", captureManifest.files.length === 7, captureManifest.files);

const trainerLanding = await fs.readFile(
  path.join(projectRoot, "health-app-frontend", "src", "pages", "TrainerLanding.tsx"),
  "utf8",
);
check("Claim Free do 2 klientów istnieje w aktualnym landingu", trainerLanding.includes("Free do 2 aktywnych klientów"));
check("Claim bez karty istnieje w aktualnym landingu", trainerLanding.includes("bez karty"));

const failed = checks.filter((item) => !item.pass);
const report = {
  generatedAt: new Date().toISOString(),
  pass: failed.length === 0,
  summary: { passed: checks.length - failed.length, failed: failed.length },
  video: {
    durationSeconds: duration,
    frameCount,
    sizeBytes: videoSize,
    loudness,
    keyframeTimes,
    maximumKeyframeGap,
    representativeFrames,
  },
  checks,
};
await fs.writeFile(outputValidation, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
