import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { createCanvas, loadImage } = require('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tooling = path.resolve(root, '../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg = require(path.join(tooling, 'ffmpeg-static'));
const ffprobe = path.join(tooling, '@ffprobe-installer/darwin-arm64/ffprobe');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback;
const variant = option('--variant', 'recipes');
const mode = option('--mode', 'final');
const width = Number(option('--width', '1440'));
const stems = { recipes: 'Diecik-pomysl-na-posilek-Reels-Stories-20s', diet: 'Diecik-kalorie-i-makro-Reels-Stories-20s', training: 'Diecik-plan-treningu-Reels-Stories-20s' };
if (!stems[variant] || !['proof', 'final'].includes(mode)) throw new Error('Choose a known variant and proof/final mode.');
const qa = path.join(root, 'qa/video-r2');
const file = mode === 'proof' ? path.join(qa, `${variant}-proof-8s-${width}.mp4`) : path.join(root, `DO_WGRANIA/${stems[variant]}.mp4`);
const duration = mode === 'proof' ? 8 : 20;
async function run(binary, parameters) {
  const p = spawn(binary, parameters, { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', error = '';
  p.stdout.on('data', d => { output += d; }); p.stderr.on('data', d => { error += d; });
  const [code] = await once(p, 'close'); if (code) throw new Error(`${binary} (${code}): ${error}`);
  return { output, error };
}
const info = JSON.parse((await run(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file])).output);
const video = info.streams.find(s => s.codec_type === 'video'), audio = info.streams.find(s => s.codec_type === 'audio');
const checks = {
  expectedPictureSize: video?.width === width && video?.height === width * 16 / 9,
  h264Yuv420: video?.codec_name === 'h264' && video?.pix_fmt === 'yuv420p',
  fps30: video?.avg_frame_rate === '30/1',
  frameCount: Number(video?.nb_read_frames) === duration * 30,
  exactDuration: Number(video?.duration) === duration && Number(info.format.duration) === duration,
  stereoAac48k: audio?.codec_name === 'aac' && audio?.sample_rate === '48000' && audio?.channels === 2,
  bt709: video?.color_space === 'bt709' && video?.color_transfer === 'bt709' && video?.color_primaries === 'bt709',
};
if (Object.values(checks).some(v => !v)) throw new Error(`Media contract failed: ${JSON.stringify(checks)}`);
const decoded = await run(ffmpeg, ['-hide_banner', '-v', 'error', '-i', file, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
if (decoded.error.trim()) throw new Error(`Decode errors: ${decoded.error}`);
const loudness = await run(ffmpeg, ['-hide_banner', '-i', file, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-']);
const audioMeasurement = JSON.parse(loudness.error.slice(loudness.error.lastIndexOf('{'), loudness.error.lastIndexOf('}') + 1));
if (Number(audioMeasurement.input_tp) > -1 || Number(audioMeasurement.input_i) < -18 || Number(audioMeasurement.input_i) > -12) throw new Error(`Unexpected soundtrack loudness: ${JSON.stringify(audioMeasurement)}`);
const samples = mode === 'proof' ? [.8, 1.3, 3.0, 4.8, 6.2, 7.8] : [.8, 1.3, 3.0, 4.8, 6.2, 8.5, 9.5, 10.5, 12.5, 13.8, 16.8, 18.1];
const columns = mode === 'proof' ? 3 : 4, rows = Math.ceil(samples.length / columns);
const board = createCanvas(columns * 360, rows * 680), ctx = board.getContext('2d');
ctx.fillStyle = '#F6F5EF'; ctx.fillRect(0, 0, board.width, board.height);
for (let i = 0; i < samples.length; i++) {
  const time = samples[i], sample = path.join(qa, `${variant}-${mode}-encoded-${time.toFixed(1)}s.jpg`);
  await run(ffmpeg, ['-v', 'error', '-y', '-ss', String(time), '-i', file, '-frames:v', '1', '-vf', 'scale=360:640', '-q:v', '2', sample]);
  const x = i % columns * 360, y = Math.floor(i / columns) * 680;
  ctx.drawImage(await loadImage(sample), x, y); ctx.fillStyle = '#153630'; ctx.font = '20px "Avenir Next"'; ctx.fillText(`${time.toFixed(1)} s`, x + 15, y + 669);
}
await fs.writeFile(path.join(qa, `${variant}-${mode}-encoded-storyboard.jpg`), board.toBuffer('image/jpeg', 94));
const hash = createHash('sha256').update(await fs.readFile(file)).digest('hex');
const report = { result: 'PASS', revision: 2, file: path.relative(root, file), sha256: hash, bytes: Number(info.format.size), checks, width: video.width, height: video.height, frames: Number(video.nb_read_frames), durationSeconds: Number(info.format.duration), fullAvDecodeErrors: 0, audio: { integratedLufs: Number(audioMeasurement.input_i), truePeakDbtp: Number(audioMeasurement.input_tp), codec: audio.codec_name, sampleRate: Number(audio.sample_rate), channels: audio.channels }, storyboard: `qa/video-r2/${variant}-${mode}-encoded-storyboard.jpg`, visualReview: 'Pending actual encoded-frame inspection', published: false };
await fs.writeFile(path.join(qa, `${variant}-${mode}-verification.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
