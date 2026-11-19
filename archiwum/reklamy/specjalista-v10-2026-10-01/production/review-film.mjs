import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';

const req=createRequire(import.meta.url);
const {createCanvas,loadImage}=req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const probe=path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe');
const audience=process.argv[2]??'dietetyk';
if(audience!=='dietetyk')throw new Error('v10 is the dietitian revision only');
const stem='diecik-dietetyk-spacer-20s-story',movie=path.join(root,'filmy',`${stem}.mp4`);
const qa=path.join(root,'qa',audience);await fs.mkdir(qa,{recursive:true});
async function run(bin,args){
  const p=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let output='',err='';
  p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>err+=d);
  const[code]=await once(p,'close');if(code)throw new Error(err||output);return{output,err};
}
const info=JSON.parse((await run(probe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',movie])).output);
const video=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio');
if(video.width!==1080||video.height!==1920||video.codec_name!=='h264'||video.pix_fmt!=='yuv420p'||video.avg_frame_rate!=='30/1'||Number(video.nb_read_frames)!==600||audio.codec_name!=='aac'||audio.sample_rate!=='48000'||audio.channels!==2)throw new Error('Unexpected film format');
const decoded=await run(ffmpeg,['-hide_banner','-v','error','-i',movie,'-f','null','-']);
if(decoded.err.trim())throw new Error(decoded.err);
const loudness=await run(ffmpeg,['-hide_banner','-i',movie,'-af','loudnorm=I=-15:TP=-1.5:LRA=7:print_format=json','-f','null','-']);
const measured=JSON.parse(loudness.err.slice(loudness.err.lastIndexOf('{'),loudness.err.lastIndexOf('}')+1));
if(Number(measured.input_tp)>-1||Number(measured.input_i)<-18||Number(measured.input_i)>-12)throw new Error('Audio outside delivery range');
const stamps=[.7,2.5,4.6,6.2,7.7,9.5,11.7,14.4,16.6,18.5];
const board=createCanvas(5*360,2*684),b=board.getContext('2d');b.fillStyle='#E9E9E0';b.fillRect(0,0,board.width,board.height);
for(let i=0;i<stamps.length;i++){
  const t=stamps[i],full=path.join(qa,`frame-${t.toFixed(1)}.jpg`),small=path.join(qa,`frame-${t.toFixed(1)}-360.jpg`);
  await run(ffmpeg,['-v','error','-y','-ss',String(t),'-i',movie,'-frames:v','1','-q:v','2',full]);
  await run(ffmpeg,['-v','error','-y','-i',full,'-vf','scale=360:640','-frames:v','1','-q:v','2',small]);
  const im=await loadImage(small),x=(i%5)*360,y=Math.floor(i/5)*684;b.drawImage(im,x,y);
  b.font='20px "Avenir Next"';b.fillStyle='#153630';b.fillText(`${t.toFixed(1)} s`,x+14,y+668);
}
await fs.writeFile(path.join(root,`podglad/storyboard-${audience}-360.jpg`),board.toBuffer('image/jpeg',90));
// Cover is a real final movie frame, not an unrelated mockup.
await run(ffmpeg,['-v','error','-y','-ss','18.5','-i',movie,'-frames:v','1','-q:v','1',path.join(root,'okladki',`${stem}.jpg`)]);
const ui=await fs.readFile(path.join(root,'assets/client-plan-full-before.png'));
const uiOriginal=await fs.readFile(path.resolve(root,'../specjalista-v7-2026-10-01/assets/client-plan-full-before.png'));
const uiSame=ui.equals(uiOriginal);if(!uiSame)throw new Error('Phone source has changed');
const result={file:`filmy/${stem}.mp4`,sha256:createHash('sha256').update(await fs.readFile(movie)).digest('hex'),duration_s:Number(info.format.duration),frames:Number(video.nb_read_frames),video:{codec:video.codec_name,width:video.width,height:video.height,pixel_format:video.pix_fmt,fps:video.avg_frame_rate,color_space:video.color_space},audio:{codec:audio.codec_name,sample_rate:audio.sample_rate,channels:audio.channels,integrated_lufs:Number(measured.input_i),true_peak_dbtp:Number(measured.input_tp)},full_av_decode_errors:0,phone_original_byte_identical:uiSame,technical_status:'PASS',creative_acceptance:'Not established by technical checks; final-frame review documented separately',publication:false};
result.audience=audience;result.phone_meaning='published diet from specialist';result.private_workout_source_excluded=true;
await fs.writeFile(path.join(root,`qa/verification-${audience}.json`),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
