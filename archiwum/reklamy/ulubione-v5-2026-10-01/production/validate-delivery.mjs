import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire(import.meta.url);
const tooling=path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg=req(path.join(tooling,'ffmpeg-static/index.js'));
const ffprobe=path.join(tooling,'@ffprobe-installer/darwin-arm64/ffprobe');
const checks=[];
function check(name,pass,details){checks.push({name,pass,...(details===undefined?{}:{details})});if(!pass)console.error('FAIL',name,details);}
const files=(await fs.readdir(path.join(root,'filmy'))).filter(x=>x.endsWith('.mp4')).sort();
const expected=[
  'diecik-ulubione-a-20s-story.mp4','diecik-ulubione-b-20s-story.mp4',
  'diecik-ulubione-a-20s-feed.mp4','diecik-ulubione-b-20s-feed.mp4',
  'diecik-ulubione-a-10s-story.mp4',
  'diecik-specjalista-lead-a-25s-story.mp4','diecik-specjalista-lead-b-25s-story.mp4',
  'diecik-specjalista-website-a-25s-story.mp4','diecik-specjalista-website-b-25s-story.mp4',
  'diecik-specjalista-website-a-25s-wide.mp4'
].sort();
check('Complete revised set of 10 films',JSON.stringify(files)===JSON.stringify(expected),files);
const videos=[];
for(const file of files){
  const full=path.join(root,'filmy',file);
  const r=spawnSync(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',full],{encoding:'utf8',maxBuffer:3e6});
  check(`${file}: probe`,r.status===0);if(r.status!==0)continue;
  const p=JSON.parse(r.stdout),v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
  const d=file.includes('-20s-')?20:file.includes('-10s-')?10:25;
  const wide=file.includes('wide'),feed=file.includes('feed');
  check(`${file}: dimensions`,v.width===(wide?1920:1080)&&v.height===(wide?1080:feed?1350:1920),[v.width,v.height]);
  check(`${file}: H264/420/30fps`,v.codec_name==='h264'&&v.pix_fmt==='yuv420p'&&v.r_frame_rate==='30/1');
  check(`${file}: all frames`,Number(v.nb_read_frames)===d*30,v.nb_read_frames);
  check(`${file}: duration`,Math.abs(Number(p.format.duration)-d)<.06,p.format.duration);
  check(`${file}: audio`,a?.codec_name==='aac'&&a.sample_rate==='48000'&&a.channels===2);
  const dec=spawnSync(ffmpeg,['-hide_banner','-v','error','-i',full,'-f','null','-'],{encoding:'utf8',maxBuffer:3e6});
  check(`${file}: full AV decode`,dec.status===0&&dec.stderr.trim()==='',dec.stderr.trim()||undefined);
  const data=await fs.readFile(full);let offset=0,moov=-1,mdat=-1;
  while(offset+8<=data.length){const size=data.readUInt32BE(offset),type=data.toString('ascii',offset+4,offset+8);if(type==='moov')moov=offset;if(type==='mdat')mdat=offset;if(size<8)break;offset+=size;}
  check(`${file}: faststart`,moov>=0&&mdat>moov);
  videos.push({file:`filmy/${file}`,width:v.width,height:v.height,duration:d,frames:Number(v.nb_read_frames),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
const spec=JSON.parse(await fs.readFile(path.join(root,'kampanie/meta-konfiguracja-v5-PAUSED.json'),'utf8'));
check('Meta local default paused',spec.default_status==='PAUSED'&&spec.account_id===null);
for(const c of spec.campaigns){check(`${c.name}: paused`,c.status==='PAUSED');for(const ad of c.ads){
  check(`${ad.id}: paused`,ad.status==='PAUSED');for(const [placement,file] of Object.entries(ad.placements)){
    try{await fs.access(path.join(root,file));check(`${ad.id}/${placement}: file exists`,true);}catch{check(`${ad.id}/${placement}: file exists`,false,file);}
  }
}}
for(const c of spec.campaigns){if(c.website_alternative){
  check(`${c.name}: website alternative paused`,c.website_alternative.status==='PAUSED');
  for(const file of c.website_alternative.assets){
    try{await fs.access(path.join(root,file));check(`Website alternative/${file}: exists`,true);}catch{check(`Website alternative/${file}: exists`,false);}
  }
}}
for(const file of spec.creative_library.assets){
  try{await fs.access(path.join(root,file));check(`Creative library/${file}: exists`,true);}catch{check(`Creative library/${file}: exists`,false);}
}
for(const file of files){for(const role of ['hook','cta']){
  const cover=path.join(root,'okladki',file.replace('.mp4',`-${role}.jpg`));
  try{await fs.access(cover);check(`${file}: ${role} cover exists`,true);}catch{check(`${file}: ${role} cover exists`,false);}
}}
const review=JSON.parse(await fs.readFile(path.join(root,'qa/creative-final-review.json'),'utf8'));
const hero=videos.find(v=>v.file==='filmy/diecik-ulubione-a-20s-story.mp4');
check('Hero reviewed exact current file',hero?.sha256===review.reviewed_file_sha256);
check('Hero review has no pending corrections',review.pending_corrections.length===0);
check('Removed lower caption absent in reviewed hero',review.final_lower_offer_caption_present===false&&review.replacement_fine_print_present===false);
const variants=JSON.parse(await fs.readFile(path.join(root,'qa/b2c-variants-review.json'),'utf8'));
check('B2C variants have no open review issues',variants.open_issues.length===0);
for(const reviewed of variants.files){
  check(`${reviewed.file}: reviewed exact current file`,videos.find(v=>v.file===reviewed.file)?.sha256===reviewed.sha256);
}
const audio=JSON.parse(await fs.readFile(path.join(root,'qa/audio/audio-validation.json'),'utf8'));
check('Accepted B2C v3 audio technical review passed',audio.version===3&&audio.result==='PASS'&&audio.reports.length===12);
for(const reviewed of audio.reports){
  const data=await fs.readFile(path.join(root,'audio',reviewed.file));
  check(`${reviewed.file}: reviewed exact current audio`,crypto.createHash('sha256').update(data).digest('hex')===reviewed.sha256);
}
const previousRoot=path.resolve(root,'../ulubione-v3-2026-10-01');
for(const video of videos.filter(v=>v.file.includes('diecik-ulubione-'))){
  const accepted=await fs.readFile(path.join(previousRoot,video.file));
  check(`${video.file}: accepted B2C bytes preserved`,crypto.createHash('sha256').update(accepted).digest('hex')===video.sha256);
}
const specialistSources=JSON.parse(await fs.readFile(path.join(root,'assets/b2b/source-spec.json'),'utf8'));
check('Specialist external demo caption removed from source contract',specialistSources.required_external_caption===null);
check('Separate authentic specialist sources documented',specialistSources.handoff_verified===false);
const specialistAudio=JSON.parse(await fs.readFile(path.join(root,'qa/audio/specialist-audio-validation.json'),'utf8'));
check('Current specialist 25s audio technical review passed',specialistAudio.status==='TECHNICAL_PASS'&&specialistAudio.duration_seconds===25&&specialistAudio.clipped_samples===0);
const specialistAudioData=await fs.readFile(path.join(root,'audio',specialistAudio.file));
check('Current specialist audio reviewed exact file',crypto.createHash('sha256').update(specialistAudioData).digest('hex')===specialistAudio.sha256);
for(const reviewed of specialistAudio.reports){
  const data=await fs.readFile(path.join(root,'audio',reviewed.file));
  check(`${reviewed.file}: reviewed exact current specialist audio`,crypto.createHash('sha256').update(data).digest('hex')===reviewed.sha256&&reviewed.duration_seconds===25&&reviewed.clipped_samples===0);
}
const specialistReview=JSON.parse(await fs.readFile(path.join(root,'qa/b2b-render/creative-final-review.json'),'utf8'));
check('Specialist visual review complete',specialistReview.status==='CREATIVE_REVIEW_PASS'&&specialistReview.files.length===5&&specialistReview.open_issues.length===0);
check('Specialist rejected external labels absent in reviewed frames',specialistReview.external_demo_labels_present===false&&specialistReview.external_example_labels_present===false);
check('Specialist full context and meaning reviewed',specialistReview.full_context_ui_visible===true&&specialistReview.macro_zoom_used===false&&specialistReview.semantic_review_completed===true);
for(const reviewed of specialistReview.files){
  check(`${reviewed.file}: reviewed exact current specialist file`,videos.find(v=>v.file===reviewed.file)?.sha256===reviewed.sha256);
}
const copied=JSON.parse(await fs.readFile(path.join(root,'qa/copied-plan-validation.json'),'utf8'));
check('Strategy and budget base preserved',copied.status==='PASS'&&copied.files.length===9&&copied.files.every(f=>f.byte_identical_copy));
for(const file of copied.files){
  const data=await fs.readFile(path.join(root,file.file));
  const source=await fs.readFile(path.resolve(root,'../../..',file.source));
  const actual=crypto.createHash('sha256').update(data).digest('hex');
  check(`${file.file}: original strategy bytes preserved`,actual===file.sha256&&actual===crypto.createHash('sha256').update(source).digest('hex'));
}
const result={status:checks.every(c=>c.pass)?'PASS':'FAIL',scope:'Technical media validity, local campaign asset paths, exact reviewed B2C/B2B files and preserved accepted B2C bytes. Does not measure advertising effectiveness.',
  generated_at:new Date().toISOString(),movies:videos.length,checks,videos};
await fs.writeFile(path.join(root,'qa/delivery-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,movies:files.length,checks:checks.length,failures:checks.filter(c=>!c.pass)},null,2));
if(result.status!=='PASS')process.exitCode=1;
