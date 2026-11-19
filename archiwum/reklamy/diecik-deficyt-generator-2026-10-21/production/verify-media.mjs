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
const proof = process.argv.includes('--proof');
const onlyIndex = process.argv.indexOf('--variant');
const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];
if (only && (!proof || !['deficit','generator'].includes(only))) throw new Error('--variant is available for proof deficit/generator only');
const duration = proof ? 8 : 20;
const stems = {
  deficit: 'Diecik-automatyczny-cel-kalorii-Reels-Stories-20s',
  generator: 'Diecik-generator-diety-Reels-Stories-20s',
};
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const reports = [];
async function run(binary, args) {
  const p = spawn(binary, args, { stdio:['ignore','pipe','pipe'] });
  let out = '', err = '';
  p.stdout.on('data', b => out += b); p.stderr.on('data', b => err += b);
  const [code] = await once(p, 'close');
  if (code) throw new Error(`${path.basename(binary)} failed (${code}): ${err.slice(-3000)}`);
  return {out,err};
}
await fs.mkdir(path.join(root, 'qa/encoded'), {recursive:true});
await fs.mkdir(path.join(root, 'podglad/okladki'), {recursive:true});
for (const [variant, stem] of Object.entries(stems).filter(([variant])=>!only || only===variant)) {
  const file = path.join(root, proof ? `qa/video/proof-${variant}-8s-1440.mp4` : `DO_WGRANIA/${stem}.mp4`);
  const info = JSON.parse((await run(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',file])).out);
  const v = info.streams.find(s=>s.codec_type==='video'), a = info.streams.find(s=>s.codec_type==='audio');
  const checks = {
    dimensions:v?.width===1440 && v?.height===2560,
    h264Yuv420p:v?.codec_name==='h264' && v?.pix_fmt==='yuv420p',
    fps30:v?.avg_frame_rate==='30/1',
    frames:Number(v?.nb_read_frames)===duration*30,
    duration:Number(v?.duration)===duration && Number(info.format.duration)===duration,
    squarePixels:v?.sample_aspect_ratio==='1:1',
    bt709:v?.color_space==='bt709' && v?.color_transfer==='bt709' && v?.color_primaries==='bt709',
    aacStereo48k:a?.codec_name==='aac' && a?.channels===2 && a?.sample_rate==='48000',
  };
  if (!Object.values(checks).every(Boolean)) throw new Error(`Video contract failed: ${variant} ${JSON.stringify(checks)}`);
  const decoded = await run(ffmpeg,['-hide_banner','-v','error','-i',file,'-map','0:v:0','-map','0:a:0','-f','null','-']);
  if (decoded.err.trim()) throw new Error(`Decode error: ${decoded.err}`);
  const audio = await run(ffmpeg,['-hide_banner','-i',file,'-af','loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json','-f','null','-']);
  const measurement = JSON.parse(audio.err.slice(audio.err.lastIndexOf('{'), audio.err.lastIndexOf('}')+1));
  const loudness = Number(measurement.input_i), peak = Number(measurement.input_tp);
  if (!(loudness>=-18 && loudness<=-12 && peak<=-1)) throw new Error(`Audio level failed: ${variant} ${loudness} LUFS ${peak} dBTP`);
  const stamps = proof ? [1.6,3.9,4.6,5.1,6.8,7.9] : [1.6,4.1,4.9,5.3,7.9,8.9,10.2,11.9,12.8,14.6,16.3,18.3];
  const board = createCanvas(proof?1080:1440, Math.ceil(stamps.length/(proof?3:4))*680), g=board.getContext('2d');
  g.fillStyle='#f6f5ef';g.fillRect(0,0,board.width,board.height);
  for (const [i,t] of stamps.entries()) {
    const output = path.join(root,`qa/encoded/${variant}-${proof?'proof':'final'}-${t.toFixed(1)}s.jpg`);
    await run(ffmpeg,['-v','error','-y','-ss',String(t),'-i',file,'-frames:v','1','-vf','scale=360:640','-q:v','2',output]);
    const columns=proof?3:4,x=i%columns*360,y=Math.floor(i/columns)*680;
    g.drawImage(await loadImage(output),x,y);g.fillStyle='#153630';g.font='20px "Avenir Next"';g.fillText(`${t.toFixed(1)} s`,x+14,y+670);
  }
  const boardName=`qa/encoded/${variant}-${proof?'proof':'final'}-contact.jpg`;
  await fs.writeFile(path.join(root,boardName),await board.encode('jpeg',94));
  if (!proof) await run(ffmpeg,['-v','error','-y','-ss','1.6','-i',file,'-frames:v','1','-vf','scale=540:960','-q:v','2',path.join(root,`podglad/okladki/${variant}.jpg`)]);
  const buffer=await fs.readFile(file);
  const report={file:path.relative(root,file),sha256:hash(buffer),bytes:buffer.length,kind:'video',variant,width:v.width,height:v.height,durationSeconds:duration,fps:30,frames:Number(v.nb_read_frames),checks,fullDecodeErrors:0,audio:{integratedLufs:loudness,truePeakDbtp:peak,codec:a.codec_name,sampleRate:Number(a.sample_rate),channels:a.channels},contactSheet:boardName,visualReview:'PENDING_PARENT_INSPECTION'};
  reports.push(report);console.log(JSON.stringify(report));
}
if (!proof) {
  const expected = [
    'Grafika-01-Cel-kalorii-1x1.jpg','Grafika-01-Cel-kalorii-4x5.jpg',
    'Grafika-02-Generator-diety-1x1.jpg','Grafika-02-Generator-diety-4x5.jpg',
    'Karuzela-01-Cel-1x1.jpg','Karuzela-02-Ustawienia-1x1.jpg','Karuzela-03-Podglad-1x1.jpg','Karuzela-04-Zapis-1x1.jpg',
  ];
  const actual=(await fs.readdir(path.join(root,'DO_WGRANIA'))).sort();
  const allExpected=[...expected,...Object.values(stems).map(s=>s+'.mp4')].sort();
  if (JSON.stringify(actual)!==JSON.stringify(allExpected)) throw new Error(`Unexpected upload folder contents: ${JSON.stringify(actual)}`);
  for (const name of expected) {
    const file=path.join(root,'DO_WGRANIA',name),buffer=await fs.readFile(file),img=await loadImage(buffer);
    const expectedHeight=name.includes('4x5')?1800:1440;
    if(img.width!==1440 || img.height!==expectedHeight || buffer[0]!==0xff || buffer[1]!==0xd8) throw new Error(`Image size/format failed: ${name}`);
    reports.push({file:path.relative(root,file),sha256:hash(buffer),bytes:buffer.length,kind:name.startsWith('Karuzela')?'carousel':'static',width:img.width,height:img.height,decoded:true,visualReview:'PENDING_PARENT_INSPECTION'});
  }
}
const reportName=`qa/${proof?'proof':'media'}-verification.json`;
if (proof && only) {
  try {
    const previous=JSON.parse(await fs.readFile(path.join(root,reportName),'utf8'));
    reports.push(...previous.files.filter(f=>f.variant!==only));
  } catch(error) { if(error.code!=='ENOENT') throw error; }
}
await fs.writeFile(path.join(root,reportName),JSON.stringify({at:new Date().toISOString(),technicalResult:'PASS',mode:proof?'8_SECOND_PROOF':'FINAL_MEDIA',files:reports,visualApproval:'PENDING'},null,2)+'\n');
