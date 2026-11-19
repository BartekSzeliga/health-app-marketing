import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "../../..");
const ffmpeg = path.join(
  workspace,
  "exports/app-store/ios-2026-07-17/.tooling/node_modules/ffmpeg-static/ffmpeg",
);
const ffprobe = path.join(
  workspace,
  "exports/app-store/ios-2026-07-17/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe",
);
const sourceDir = path.join(here, "moje video");
const webSource = path.join(sourceDir, "web panel full.mov");
const chatSource = path.join(sourceDir, "chat specjalista.mov");
const mobileSource = path.join(sourceDir, "mobile-pakiet-2-clean.png");
const music = path.join(
  workspace,
  "marketing/reklamy/meta-start-aplikacji/meta/audio/diecik-meta-launch-original.wav",
);
const outputDir = path.join(here, "output");
const output = path.join(
  outputDir,
  "diecik-panel-specjalisty-glowny-material-promocyjny-v5-etapy-klienta-4k-youtube.mp4",
);
const subtitles = path.join(
  outputDir,
  "diecik-panel-specjalisty-glowny-material-promocyjny-v5-etapy-klienta-pl.srt",
);
const manifest = path.join(
  outputDir,
  "diecik-panel-specjalisty-glowny-material-promocyjny-v5-etapy-klienta-manifest.json",
);
const contactSheet = path.join(
  outputDir,
  "diecik-panel-specjalisty-glowny-material-promocyjny-v5-etapy-klienta-contact-sheet.jpg",
);
const runtime = path.join(here, "capture", ".runtime", "admin-promo-master");
const segmentDir = path.join(runtime, "segments");
const textDir = path.join(runtime, "text");
const fontRegular = "/System/Library/Fonts/Supplemental/Arial.ttf";
const fontBold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

const segments = [
  {
    id: "web-full",
    source: webSource,
    start: 0,
    trimEnd: 4,
    speed: 1,
    crop:
      "1706:960:x='if(lt(t,49.2),107,if(lt(t,49.9),107+107*(t-49.2)/0.7,if(lt(t,55.4),214,if(lt(t,56.1),214-107*(t-55.4)/0.7,107))))':y=120",
    contain: true,
    group: "web",
  },
  {
    id: "chat-open",
    source: chatSource,
    start: 1.2,
    end: 3,
    speed: 1,
    crop: "1706:960:214:120",
    contain: true,
    group: "chat",
  },
  {
    id: "chat-type-fast",
    source: chatSource,
    start: 3,
    end: 23,
    speed: 6,
    crop: "1706:960:214:120",
    contain: true,
    group: "chat",
  },
  {
    id: "chat-sent",
    source: chatSource,
    start: 23,
    end: 27.6,
    speed: 1,
    crop: "1706:960:214:120",
    contain: true,
    group: "chat",
  },
];

const captions = [
  {
    id: "panel",
    segment: "web-full",
    text: "Panel dopasowany do Twojej pracy",
    localStart: 0.3,
    duration: 2.9,
    placement: "bottom",
  },
  {
    id: "diet-only-mode",
    segment: "web-full",
    text: "Tryb „Tylko dieta” — prostszy panel bez treningów",
    localStart: 3.5,
    duration: 3.5,
    placement: "bottom",
  },
  {
    id: "diet-training-mode",
    segment: "web-full",
    text: "„Dieta i trening” — dodatkowe moduły jednym kliknięciem",
    localStart: 7.25,
    duration: 4.25,
    placement: "bottom",
  },
  {
    id: "client",
    segment: "web-full",
    text: "Klienci — cała współpraca w jednym panelu",
    localStart: 16.5,
    duration: 3.5,
    placement: "bottom",
  },
  {
    id: "client-panel",
    segment: "web-full",
    text: "Panel klienta — pakiety, dane i kontakt",
    localStart: 25.5,
    duration: 3.5,
    placement: "bottom",
  },
  {
    id: "packages",
    segment: "web-full",
    text: "Pakiety — dieta, trening i okres współpracy",
    localStart: 34.2,
    duration: 3.5,
    placement: "bottom",
  },
  {
    id: "date-range",
    segment: "web-full",
    text: "Zakres dat — plan zawsze na właściwy okres",
    localStart: 39,
    duration: 3.8,
    placement: "bottom",
  },
  {
    id: "plan-context",
    segment: "web-full",
    text: "Kontekst planu — alergie, preferencje i dziennik",
    localStart: 49.5,
    duration: 5.7,
    placement: "bottom",
  },
  {
    id: "builder",
    segment: "web-full",
    text: "Najpierw cel i układ dnia",
    localStart: 58.7,
    duration: 2.9,
    placement: "bottom",
  },
  {
    id: "template",
    segment: "web-full",
    text: "7 dni pod pełną kontrolą",
    localStart: 66,
    duration: 2.9,
    placement: "bottom",
  },
  {
    id: "template-load",
    segment: "web-full",
    text: "Szablon uzupełnia cały 7-dniowy plan",
    localStart: 75.4,
    duration: 5.2,
    placement: "bottom",
  },
  {
    id: "plan",
    segment: "web-full",
    text: "Posiłki, przepisy i makro w jednym widoku",
    localStart: 82,
    duration: 3.1,
    placement: "bottom",
  },
  {
    id: "publish",
    segment: "web-full",
    text: "Gotowy plan trafia do aplikacji",
    localStart: 110.4,
    duration: 3.1,
    placement: "bottom",
  },
  {
    id: "chat",
    segment: "chat-open",
    text: "Plan i kontakt w jednym miejscu",
    localStart: 0.2,
    duration: 3,
    placement: "bottom",
  },
];

function run(command, args, stdio = "inherit") {
  execFileSync(command, args, { stdio });
}

function probe(file) {
  return JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8" },
    ),
  );
}

function durationOf(file) {
  return Number(probe(file).format.duration);
}

function filterPath(file) {
  return file
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'");
}

function srtTimestamp(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hh = Math.floor(ms / 3_600_000);
  const mm = Math.floor((ms % 3_600_000) / 60_000);
  const ss = Math.floor((ms % 60_000) / 1000);
  const mmm = ms % 1000;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(mmm).padStart(3, "0")}`;
}

async function requireFile(file, label) {
  try {
    await fs.access(file);
  } catch {
    throw new Error(`${label} not found: ${file}`);
  }
}

await Promise.all([
  fs.mkdir(segmentDir, { recursive: true }),
  fs.mkdir(textDir, { recursive: true }),
  fs.mkdir(outputDir, { recursive: true }),
]);
await Promise.all([
  requireFile(ffmpeg, "ffmpeg"),
  requireFile(ffprobe, "ffprobe"),
  requireFile(webSource, "Web recording"),
  requireFile(chatSource, "Chat recording"),
  requireFile(mobileSource, "Clean mobile screenshot"),
  requireFile(music, "Music bed"),
  requireFile(fontRegular, "Regular font"),
  requireFile(fontBold, "Bold font"),
]);

const timeline = [];
let cursor = 0;
for (const segment of segments) {
  const outputSegment = path.join(segmentDir, `${segment.id}.mp4`);
  const sourceDuration = durationOf(segment.source);
  const resolvedEnd = Number.isFinite(segment.end)
    ? segment.end
    : sourceDuration - Number(segment.trimEnd ?? 0);
  const rawDuration = resolvedEnd - segment.start;
  const plannedDuration = rawDuration / segment.speed;
  const filter = [
    `crop=${segment.crop}`,
    ...(segment.contain
      ? [
          "scale=1706:960:flags=lanczos",
          "pad=1920:1080:107:60:color=0x14213D",
        ]
      : ["scale=1920:1080:flags=lanczos"]),
    `setpts=(PTS-STARTPTS)/${segment.speed}`,
    "fps=30",
    `trim=duration=${plannedDuration.toFixed(6)}`,
    "setsar=1",
    "format=yuv420p",
  ].join(",");
  run(ffmpeg, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(segment.start),
    "-t",
    String(rawDuration),
    "-i",
    segment.source,
    "-an",
    "-vf",
    filter,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "12",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-video_track_timescale",
    "30000",
    "-y",
    outputSegment,
  ]);
  const actualDuration = durationOf(outputSegment);
  timeline.push({
    ...segment,
    end: resolvedEnd,
    file: outputSegment,
    offset: cursor,
    duration: actualDuration,
  });
  cursor += actualDuration;
}

const mobileDuration = 10;
const mobileSegment = path.join(segmentDir, "mobile-client.mp4");
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "lavfi",
  "-i",
  `color=c=0xEFF6F3:s=1920x1080:r=30:d=${mobileDuration}`,
  "-loop",
  "1",
  "-framerate",
  "30",
  "-i",
  mobileSource,
  "-filter_complex",
  [
    "[0:v]drawbox=x=0:y=0:w=1120:h=1080:color=0x14213D:t=fill,drawbox=x=1258:y=28:w=500:h=1024:color=0x0A1426@0.16:t=fill[bg]",
    "[1:v]scale=-2:980:flags=lanczos,format=rgba,fade=t=in:st=0:d=0.45:alpha=1[phone]",
    "[bg][phone]overlay=x=1280:y=50:shortest=1,format=yuv420p[v]",
  ].join(";"),
  "-map",
  "[v]",
  "-an",
  "-t",
  String(mobileDuration),
  "-c:v",
  "libx264",
  "-preset",
  "veryfast",
  "-crf",
  "12",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
  "-video_track_timescale",
  "30000",
  "-y",
  mobileSegment,
]);
const mobileOffset = cursor;
const actualMobileDuration = durationOf(mobileSegment);
timeline.push({
  id: "mobile-client",
  source: mobileSource,
  file: mobileSegment,
  offset: mobileOffset,
  duration: actualMobileDuration,
  group: "mobile",
});
cursor += actualMobileDuration;

const concatFile = path.join(runtime, "segments.ffconcat");
const concatBody = [
  "ffconcat version 1.0",
  ...timeline.map((segment) => `file '${segment.file.replaceAll("'", "'\\''")}'`),
  "",
].join("\n");
await fs.writeFile(concatFile, concatBody);
const silentMaster = path.join(runtime, "admin-promo-silent-1080.mp4");
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatFile,
  "-an",
  "-c:v",
  "copy",
  "-movflags",
  "+faststart",
  "-y",
  silentMaster,
]);

const resolvedCaptions = [];
for (const caption of captions) {
  const segment = timeline.find((entry) => entry.id === caption.segment);
  if (!segment) throw new Error(`Caption segment not found: ${caption.segment}`);
  const textFile = path.join(textDir, `${caption.id}.txt`);
  await fs.writeFile(textFile, `${caption.text}\n`);
  resolvedCaptions.push({
    ...caption,
    textFile,
    start: segment.offset + caption.localStart,
    end: segment.offset + caption.localStart + caption.duration,
  });
}

const mobileHeadline = path.join(textDir, "mobile-headline.txt");
const mobileCaption = path.join(textDir, "mobile-caption.txt");
const ctaHeadline = path.join(textDir, "cta-headline.txt");
const ctaCaption = path.join(textDir, "cta-caption.txt");
await Promise.all([
  fs.writeFile(mobileHeadline, "Klient widzi dietę\nod razu\n"),
  fs.writeFile(mobileCaption, "Opublikowany plan • 7 dni • posiłki i przepisy\n"),
  fs.writeFile(ctaHeadline, "Umów krótką\nprezentację\n"),
  fs.writeFile(ctaCaption, "Zobacz, jak Diecik usprawni Twoją pracę.\n"),
]);

const videoFilters = [
  "scale=3840:2160:flags=lanczos",
  "setsar=1",
  "format=yuv420p",
];
for (const caption of resolvedCaptions) {
  const y = 2040;
  const boxWidth = Math.min(2600, Math.max(1280, caption.text.length * 32 + 180));
  const enable = `between(t,${caption.start.toFixed(3)},${caption.end.toFixed(3)})`;
  videoFilters.push(
    `drawbox=x=210:y=${y}:w=${boxWidth}:h=100:color=0x14213D@1:t=fill:enable='${enable}'`,
    `drawbox=x=210:y=${y}:w=12:h=100:color=0x8BC53F@1:t=fill:enable='${enable}'`,
    `drawtext=fontfile='${filterPath(fontBold)}':textfile='${filterPath(caption.textFile)}':fontcolor=white:fontsize=48:x=255:y=${y + 24}:enable='${enable}'`,
  );
}

const mobileIntroEnd = mobileOffset + 6.25;
const ctaStart = mobileOffset + 6.25;
const totalDuration = durationOf(silentMaster);
videoFilters.push(
  `drawtext=fontfile='${filterPath(fontBold)}':text='DIECIK DLA DIETETYKÓW':fontcolor=0x8BC53F:fontsize=50:x=300:y=370:enable='between(t,${mobileOffset.toFixed(3)},${mobileIntroEnd.toFixed(3)})'`,
  `drawbox=x=300:y=505:w=20:h=820:color=0x8BC53F:t=fill:enable='between(t,${mobileOffset.toFixed(3)},${mobileIntroEnd.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontBold)}':textfile='${filterPath(mobileHeadline)}':fontcolor=white:fontsize=124:line_spacing=18:x=380:y=560:enable='between(t,${mobileOffset.toFixed(3)},${mobileIntroEnd.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontRegular)}':textfile='${filterPath(mobileCaption)}':fontcolor=0xDDE7F0:fontsize=49:x=386:y=920:enable='between(t,${mobileOffset.toFixed(3)},${mobileIntroEnd.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontBold)}':text='DIECIK DLA DIETETYKÓW':fontcolor=0x8BC53F:fontsize=50:x=300:y=370:enable='gte(t,${ctaStart.toFixed(3)})'`,
  `drawbox=x=300:y=505:w=20:h=820:color=0x8BC53F:t=fill:enable='gte(t,${ctaStart.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontBold)}':textfile='${filterPath(ctaHeadline)}':fontcolor=white:fontsize=122:line_spacing=18:x=380:y=560:enable='gte(t,${ctaStart.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontRegular)}':textfile='${filterPath(ctaCaption)}':fontcolor=0xDDE7F0:fontsize=49:x=386:y=920:enable='gte(t,${ctaStart.toFixed(3)})'`,
  `drawtext=fontfile='${filterPath(fontBold)}':text='DIECIK.COM':fontcolor=0x8BC53F:fontsize=58:x=386:y=1090:enable='gte(t,${ctaStart.toFixed(3)})'`,
  `fade=t=out:st=${Math.max(0, totalDuration - 0.55).toFixed(3)}:d=0.55`,
);

const fadeOutStart = Math.max(0, totalDuration - 2);
run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-i",
  silentMaster,
  "-stream_loop",
  "-1",
  "-i",
  music,
  "-filter_complex",
  `[0:v]${videoFilters.join(",")}[v];[1:a]volume=0.20,loudnorm=I=-17:TP=-1.5:LRA=9,atrim=duration=${totalDuration.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=2,aformat=sample_rates=48000:channel_layouts=stereo[a]`,
  "-map",
  "[v]",
  "-map",
  "[a]",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "17",
  "-profile:v",
  "high",
  "-level:v",
  "5.2",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
  "-color_primaries",
  "bt709",
  "-color_trc",
  "bt709",
  "-colorspace",
  "bt709",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-movflags",
  "+faststart",
  "-shortest",
  "-y",
  output,
]);

const subtitleEntries = [
  ...resolvedCaptions.map((caption) => ({
    start: caption.start,
    end: caption.end,
    text: caption.text,
  })),
  {
    start: mobileOffset,
    end: mobileIntroEnd,
    text: "Klient widzi dietę od razu",
  },
  {
    start: ctaStart,
    end: totalDuration,
    text: "Umów krótką prezentację — diecik.com",
  },
].sort((a, b) => a.start - b.start);
await fs.writeFile(
  subtitles,
  subtitleEntries
    .map(
      (entry, index) =>
        `${index + 1}\n${srtTimestamp(entry.start)} --> ${srtTimestamp(entry.end)}\n${entry.text}\n`,
    )
    .join("\n"),
);

run(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-i",
  output,
  "-vf",
  "fps=1/12,scale=640:360:flags=lanczos,tile=4x3:padding=8:margin=8:color=white",
  "-frames:v",
  "1",
  "-q:v",
  "2",
  "-y",
  contactSheet,
]);

const finalProbe = probe(output);
await fs.writeFile(
  manifest,
  `${JSON.stringify(
    {
      title: "Diecik — panel specjalisty — główny materiał promocyjny",
      createdAt: new Date().toISOString(),
      sources: {
        web: webSource,
        chat: chatSource,
        mobile: mobileSource,
        music,
      },
      editorial: {
        noVoiceover: true,
        browserChromeRemoved: true,
        recorderControlsRemoved: true,
        simulatorOverlayRemoved: true,
        chatTypingSpeed: 6,
        sequence: [
          "panel",
          "client",
          "builder",
          "template",
          "plan",
          "publish",
          "chat",
          "mobile",
          "cta",
        ],
      },
      timeline,
      captions: subtitleEntries,
      output: {
        file: output,
        duration: Number(finalProbe.format.duration),
        sizeBytes: Number(finalProbe.format.size),
        video: finalProbe.streams.find((stream) => stream.codec_type === "video"),
        audio: finalProbe.streams.find((stream) => stream.codec_type === "audio"),
      },
    },
    null,
    2,
  )}\n`,
);

console.log(`Created: ${output}`);
console.log(`Duration: ${Number(finalProbe.format.duration).toFixed(3)} s`);
console.log(`Contact sheet: ${contactSheet}`);
