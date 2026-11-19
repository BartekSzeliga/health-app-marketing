import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';
import ffmpeg from '../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js';

const root=path.resolve(import.meta.dirname,'..');
const partial=process.argv.includes('--partial');
const probe=path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe');
const frames=path.join(root,'qa/video-frames');
await fs.mkdir(frames,{recursive:true});
const checks=[];
const exports=[];
function command(binary,args) {
  const p=spawnSync(binary,args,{encoding:'utf8',maxBuffer:16*1024*1024});
  if(p.status!==0) throw new Error(`${path.basename(binary)} failed: ${p.stderr?.slice(0,600)}`);
  return p.stdout;
}
function check(ok,label,details={}) {
  checks.push({label,pass:Boolean(ok),...details});
  if(!ok) throw new Error(label);
}
async function record(file,details={}) {
  const data=await fs.readFile(path.join(root,file));
  exports.push({file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),...details});
}
async function walk(dir) {
  const out=[];
  for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})) {
    const f=path.posix.join(dir,e.name);
    if(e.isDirectory()) out.push(...await walk(f)); else out.push(f);
  }
  return out;
}
const media=(await Promise.all(['meta','google','organic'].map(walk))).flat().filter(f=>/\.(jpg|mp4)$/.test(f)).sort();
const images=media.filter(f=>f.endsWith('.jpg'));
const movies=media.filter(f=>f.endsWith('.mp4'));
check(images.length===13,'13 final placement-specific JPG files',{count:images.length});
if(!partial) check(movies.length===10,'10 final edited MP4 files',{count:movies.length});
for(const f of images) {
  const m=await sharp(path.join(root,f)).metadata();
  const dims=f.match(/(\d+)x(\d+)\.jpg$/);
  check(m.width===Number(dims[1])&&m.height===Number(dims[2]),'Image dimensions: '+f,{width:m.width,height:m.height});
  check(m.format==='jpeg'&&m.channels===3,'JPEG colour: '+f,{format:m.format,channels:m.channels});
  await record(f,{kind:'image',width:m.width,height:m.height,illustrativeFoodPhoto:f.includes('ulubione')&&!f.includes('proof')&&!/0[23]-/.test(f)});
}
function stamp(t) {
  const [h,m,s]=t.split(':');return Number(h)*3600+Number(m)*60+Number(s.replace(',','.'));
}
function atoms(b) {
  const out=[];let offset=0;
  while(offset+8<=b.length) {
    let size=b.readUInt32BE(offset),header=8;
    const type=b.toString('ascii',offset+4,offset+8);
    if(size===1) {size=Number(b.readBigUInt64BE(offset+8));header=16;}
    if(size===0) size=b.length-offset;
    if(size<header) break;
    out.push({type,offset,size});offset+=size;
  }
  return out;
}
for(const f of movies) {
  console.log('Validate '+f);
  const file=path.join(root,f);
  const p=JSON.parse(command(probe,['-v','error','-show_streams','-show_format','-of','json',file]));
  const v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
  const expected=Number(f.match(/-(\d+)s-/)[1]);
  const dims=f.match(/(\d+)x(\d+)\.mp4$/);
  const fps=Number(v.avg_frame_rate.split('/')[0])/Number(v.avg_frame_rate.split('/')[1]);
  const duration=Number(p.format.duration);
  check(v.codec_name==='h264'&&v.pix_fmt==='yuv420p'&&fps===30,'Video codec/fps: '+f,{codec:v.codec_name,pixelFormat:v.pix_fmt,fps});
  check(v.width===Number(dims[1])&&v.height===Number(dims[2]),'Video dimensions: '+f,{width:v.width,height:v.height});
  check(Math.abs(duration-expected)<0.1,'Video duration: '+f,{actual:duration,expected});
  check(Number(v.nb_frames)===expected*30&&Math.abs(Number(v.duration)-expected)<0.04,'Video stream duration and frame count: '+f,{streamDuration:v.duration,frames:v.nb_frames,expectedFrames:expected*30});
  check(a?.codec_name==='aac'&&Number(a.sample_rate)===48000&&a.channels===2,'Audio codec: '+f,{codec:a?.codec_name,sampleRate:a?.sample_rate,channels:a?.channels});
  const keys=JSON.parse(command(probe,['-v','error','-select_streams','v:0','-skip_frame','nokey','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file])).frames.map(x=>Number(x.best_effort_timestamp_time));
  const gaps=keys.slice(1).map((t,i)=>t-keys[i]);
  check(keys.length>1&&Math.max(...gaps)<=1.04,'Keyframe gap <= 1.04s: '+f,{maxGap:Math.max(...gaps),keyframes:keys.length});
  const container=atoms(await fs.readFile(file));
  check(container.find(x=>x.type==='moov')?.offset<container.find(x=>x.type==='mdat')?.offset,'Fast start: '+f);
  command(ffmpeg,['-hide_banner','-v','error','-xerror','-i',file,'-f','null','-']);
  check(true,'Full decode without errors: '+f);
  const srt=f.replace('.mp4','-pl.srt');
  const captions=await fs.readFile(path.join(root,srt),'utf8');
  const cues=[...captions.matchAll(/(\d\d:\d\d:\d\d,\d{3}) --> (\d\d:\d\d:\d\d,\d{3})/g)].map(x=>[stamp(x[1]),stamp(x[2])]);
  check(cues.length>0&&cues[0][0]===0&&Math.abs(cues.at(-1)[1]-expected)<0.01&&cues.every((x,i)=>x[1]>x[0]&&(i===0||x[0]>=cues[i-1][1])),'SRT cue coverage: '+f,{cues:cues.length});
  const ts=expected===6?[0.6,3,5.5]:expected===15?[1.0,3.8,7.5,10.8,13.8]:[1,4.7,8.8,13.2,18];
  const thumbFiles=[];
  for(let i=0;i<ts.length;i++) {
    const thumb=path.join(frames,path.basename(f,'.mp4')+`-${i+1}.jpg`);
    command(ffmpeg,['-hide_banner','-v','error','-y','-ss',String(ts[i]),'-i',file,'-frames:v','1','-q:v','2',thumb]);
    thumbFiles.push(thumb);
  }
  const thumbW=v.width>v.height?480:360;
  const thumbH=Math.round(thumbW*v.height/v.width);
  const tiles=await Promise.all(thumbFiles.map(async(f,i)=>({input:await sharp(f).resize(thumbW,thumbH).jpeg().toBuffer(),left:i*(thumbW+14),top:0})));
  await sharp({create:{width:tiles.length*(thumbW+14)-14,height:thumbH,channels:3,background:'#E8F4FB'}}).composite(tiles).jpeg({quality:94}).toFile(path.join(frames,path.basename(f,'.mp4')+'-contact.jpg'));
  await record(f,{kind:'video',width:v.width,height:v.height,duration,fps,codec:v.codec_name,audio:a.codec_name,embeddedPolishText:true,voiceover:false,transcription:srt});
  await record(srt,{kind:'transcription',purpose:'Editable transcription; text is already visible in the video, avoid duplicating it.'});
}
if(partial) {
  console.log(`Preview review: ${movies.length} currently rendered films checked; final report not yet written.`);
  process.exit(0);
}
const meta=JSON.parse(await fs.readFile(path.join(root,'campaigns/meta/manual-campaign-spec.json'),'utf8'));
const named=[...meta.campaigns.flatMap(c=>c.ads.flatMap(a=>Object.values(a.placements))),...meta.campaigns.flatMap(c=>c.website_alternative?.assets??[])];
for(const f of named) check(media.includes(f),'Campaign asset exists: '+f);
check(meta.campaigns.every(c=>c.status==='PAUSED'&&c.ads.every(a=>a.status==='PAUSED')),'All manual Meta campaign objects PAUSED');
const pdfQA=JSON.parse(await fs.readFile(path.join(root,'strategy/qa/pdf-validation.json'),'utf8'));
check(pdfQA.pages===11&&pdfQA.visual_review_all_pages&&pdfQA.visual_defects_detected===0,'PDF visual review complete');
const xlsxQA=JSON.parse(await fs.readFile(path.join(root,'campaigns/qa/final-file-validation.json'),'utf8'));
check(xlsxQA.xlsx_error_cells===0&&xlsxQA.test_data_removed&&xlsxQA.xlsx_sheets===10,'Workbook formulas and cleared input review complete');
const documents=['README.md','LICENSES.md','strategy/marketing-plan.pdf','strategy/marketing-plan.md','campaigns/diecik-campaign-operations.xlsx','campaigns/README.md','campaigns/launch-checklist.md','campaigns/meta/manual-campaign-spec.json','campaigns/meta/manual-ad-copy.csv',...(await walk('campaigns/google-editor')).filter(f=>f.endsWith('.csv')),'sources/photos/prompts.json','organic/teksty-publikacji.txt'];
for(const f of documents) await record(f,{kind:'document'});
await record('podglad-kampanii.jpg',{kind:'preview'});
for(const f of (await walk('sources/photos')).filter(f=>f.endsWith('.png'))) await record(f,{kind:'illustrative-photo-source',aiGenerated:true});
const nativeQA=JSON.parse(await fs.readFile(path.join(root,'qa/mobile/native-capture-review.json'),'utf8'));
check(nativeQA.result==='PASS'&&nativeQA.baseline_restored===true,'Native UI proof and baseline restoration verified');
const audioQA=JSON.parse(await fs.readFile(path.join(root,'qa/audio-review.json'),'utf8'));
check(audioQA.result==='PASS'&&audioQA.referenceFiles.every(x=>x.result==='PASS'),'Audio loudness and true peaks verified');
const report={createdAt:new Date().toISOString(),result:'PASS',imageCount:images.length,videoCount:movies.length,checks,limits:['No live ad-account import or publication.','Meta/Google placement previews in the advertising accounts remain a pre-launch check.','Panel source is 29.09.2026; native UI source is 30.09.2026. Two separate B2B DEMO accounts are disclosed.','The food photography is AI-generated illustration.'],nativeEvidence:'qa/mobile/native-capture-review.json',pdfEvidence:'strategy/qa/pdf-validation.json',workbookEvidence:'campaigns/qa/final-file-validation.json',audioEvidence:'qa/audio-review.json',visualReview:'qa/creative-review.md'};
await fs.writeFile(path.join(root,'qa/validation.json'),JSON.stringify(report,null,2));
const manifest={schema:'diecik.campaign-deliverables.v1',createdAt:report.createdAt,status:'READY_LOCAL_NOT_PUBLISHED',themeB2C:'Ulubione posiłki — Zapisz raz. Dodawaj ponownie.',budget:{proposed:true,totalPLN:3000,days:30,googleSearchB2B:1500,metaB2B:1000,metaB2C:500},sourceProvenance:{panel:'Authentic screen recording from 2026-09-29, private file preserved in the project.',native:'Fresh 2026-09-30 local iPhone capture; fictional DEMO accounts.',b2bContinuity:'Two separate DEMO examples, explicitly labelled in the film.',photos:'Built-in imagegen; exact prompts in sources/photos/prompts.json.',audio:'Existing original Diecik composition using GarageBand Apple Loops, see LICENSES.md.'},exports};
await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`PASS: ${images.length} JPG, ${movies.length} MP4; ${checks.length} checks.`);
