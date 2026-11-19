import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const scriptDir=path.dirname(fileURLToPath(import.meta.url));
const outputRoot=path.resolve(scriptDir,'../..');
const projectRoot=path.resolve(outputRoot,'../../..');
const sourceRoot=path.resolve(outputRoot,'../ulubione-v3-2026-10-01');
const req=createRequire(import.meta.url);
const tooling=path.resolve(outputRoot,'../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg=req(path.join(tooling,'ffmpeg-static'));
const ffprobe=req(path.join(tooling,'ffprobe-static')).path;
const sharp=req(path.join(tooling,'sharp'));
const {createCanvas}=req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const qa=path.join(outputRoot,'qa/ulubione');
const framesRoot=path.join(qa,'frames');
const basename='Diecik-ulubione-posilki-Reels-Stories-20s';
const finalPath=path.join(outputRoot,'filmy',basename+'.mp4');
const reference=path.join(sourceRoot,'filmy/diecik-ulubione-a-20s-story.mp4');
await fs.mkdir(framesRoot,{recursive:true});
await fs.mkdir(path.join(outputRoot,'okladki'),{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileHash=async file=>hash(await fs.readFile(file));
function run(exe,args){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:2**23});if(r.status!==0)throw new Error(r.stderr||r.error?.message||`Exit ${r.status}`);return {stdout:r.stdout,stderr:r.stderr};}
const probe=JSON.parse(run(ffprobe,['-v','error','-count_frames','-show_entries','stream=index,codec_name,codec_type,width,height,avg_frame_rate,r_frame_rate,nb_frames,nb_read_frames,duration,sample_rate,channels','-show_entries','format=duration,size','-of','json',finalPath]).stdout);
const video=probe.streams.find(x=>x.codec_type==='video');
const audio=probe.streams.find(x=>x.codec_type==='audio');
if(Number(video?.nb_read_frames)!==600||Number(video.nb_frames)!==600||video.width!==1080||video.height!==1920||video.avg_frame_rate!=='30/1'||Number(video.duration)!==20)throw new Error('Unexpected video stream');
if(!audio||audio.codec_name!=='aac'||Number(audio.sample_rate)!==48000||audio.channels!==2||Number(audio.duration)!==20)throw new Error('Unexpected audio stream');
const decode=run(ffmpeg,['-v','error','-i',finalPath,'-map','0:v:0','-map','0:a:0','-f','null','-']);
if(decode.stderr.trim())throw new Error('Decode errors: '+decode.stderr);
function audioHash(file,decoded=false){return run(ffmpeg,['-v','error','-i',file,'-map','0:a:0','-c:a',decoded?'pcm_s16le':'copy','-f','hash','-hash','sha256','-']).stdout.trim().split('=')[1];}
const aac={reference:audioHash(reference),final:audioHash(finalPath)};
const pcm={reference:audioHash(reference,true),final:audioHash(finalPath,true)};
if(aac.reference!==aac.final||pcm.reference!==pcm.final)throw new Error('Audio changed');
const manifest=JSON.parse(await fs.readFile(path.join(qa,'source-manifest.json'),'utf8'));
const readback=[];
for(const item of manifest.original_sources){const actual=await fileHash(path.join(projectRoot,item.path));readback.push({path:item.path,sha256:actual,unchanged:actual===item.sha256});}
if(readback.some(x=>!x.unchanged))throw new Error('Original source was modified');
const original=await fs.readFile(path.join(sourceRoot,'production/render-motion.mjs'),'utf8');
const renderedScript=await fs.readFile(path.join(scriptDir,'render-motion-brand-v11.mjs'),'utf8');
const body=x=>x.slice(x.indexOf('const W = 1080;'),x.indexOf('const basename='));
const normalized=body(renderedScript)
.replace("'Diecik'","'diecik'").replace("'Diecik'","'diecik'").replace("'Diecik.com'","'diecik.com'")
.replace('const cy=H===1350?y(.79)+80*(1-p):1150+8*(1-p);','const cy=y(H===1350?.79:.736)+80*(1-p);')
.replace("body('diecik.com',540,H===1350?y(.706):1058,42,{alpha:p});","body('diecik.com',540,y(H===1350?.706:.676),42,{alpha:p});")
.replace('const fw=lerp(H===1350?780:990,H===1350?520:450,end);','const fw=lerp(H===1350?780:990,H===1350?520:770,end);')
.replace('lerp(y(.58),y(H===1350?.508:.414),end)','lerp(y(.58),y(H===1350?.508:.48),end)');
if(normalized!==body(original))throw new Error('Unexpected graphical change');
const samples=[{name:'01-hook',frame:20},{name:'02-add-action',frame:353},{name:'03-brand',frame:531},{name:'04-final',frame:585}];
for(const item of samples){item.time_s=item.frame/30;item.file=`qa/ulubione/frames/${item.name}.png`;item.file_360=`qa/ulubione/frames/${item.name}-360.png`;run(ffmpeg,['-v','error','-y','-i',finalPath,'-vf',`select=eq(n\\,${item.frame})`,'-frames:v','1',path.join(outputRoot,item.file)]);await sharp(path.join(outputRoot,item.file)).resize(360,640).png().toFile(path.join(outputRoot,item.file_360));item.sha256=await fileHash(path.join(outputRoot,item.file));}
const cover=path.join(outputRoot,'okladki',basename+'.jpg');
run(ffmpeg,['-v','error','-y','-i',finalPath,'-vf','select=eq(n\\,561)','-frames:v','1','-q:v','2',cover]);
const gap=18,labelHeight=54,boardWidth=samples.length*360+(samples.length+1)*gap,boardHeight=640+labelHeight+gap*2;
const labels=['0,67 s · hook','11,77 s · Dodaj','17,70 s · marka','19,50 s · finał'];
const svg=`<svg width="${boardWidth}" height="${boardHeight}"><rect width="100%" height="100%" fill="#DDF3EA"/>${labels.map((x,i)=>`<text x="${gap+i*(360+gap)+180}" y="35" text-anchor="middle" font-family="Arial" font-size="21" fill="#0B2130">${x}</text>`).join('')}</svg>`;
await sharp(Buffer.from(svg)).composite(samples.map((x,i)=>({input:path.join(outputRoot,x.file_360),left:gap+i*(360+gap),top:labelHeight+gap}))).jpeg({quality:92}).toFile(path.join(qa,'encoded-review-board-360.jpg'));
const c=createCanvas(1080,1920).getContext('2d');
function bbox(text,x,y,size,{align='center',baseline='alphabetic',family='Avenir Next',weight=700,max=Infinity}={}){c.font=`${weight} ${size}px "${family}"`;c.textAlign=align;c.textBaseline=baseline;const m=c.measureText(text),scale=Math.min(1,max/m.width);return {text,left:x-m.actualBoundingBoxLeft*scale,top:y-m.actualBoundingBoxAscent,right:x+m.actualBoundingBoxRight*scale,bottom:y+m.actualBoundingBoxDescent};}
c.font='700 86px "Avenir Next"';const tw=c.measureText('Diecik').width,iw=86*.88,bx=(1080-tw-iw-17)/2;
const critical=[bbox('Diecik',bx+iw+17,453.2,86,{align:'left',baseline:'middle'}),{text:'brand icon',left:bx,top:451.2-iw/2,right:bx+iw,bottom:451.2+iw/2},bbox('Ulubione posiłki. Twoje smaki.',540,543.36,43,{max:950}),bbox('Diecik.com',540,1058,42,{max:950}),bbox('Wypróbuj za darmo',524,1168,52,{max:720}),{text:'CTA button',left:115,top:1085,right:965,bottom:1215}];
for(const b of critical)b.within_safe_zone=b.left>=70&&b.right<=1010&&b.top>=288&&b.bottom<=1230;
if(critical.some(x=>!x.within_safe_zone))throw new Error('Final critical text outside safe zone');
const report={result:'PASS',scope:'B2C A / 20s / Story: Diecik spelling and authorized final safe-zone layout only',created_at:new Date().toISOString(),output:{file:'filmy/'+basename+'.mp4',sha256:await fileHash(finalPath),bytes:(await fs.stat(finalPath)).size},reference:{file:manifest.source_root+'/filmy/diecik-ulubione-a-20s-story.mp4',sha256:await fileHash(reference)},probe,full_decode:{result:'PASS',errors:decode.stderr.trim()},audio:{aac_packet_sha256:aac,decoded_pcm_sha256:pcm,identical_to_accepted_v3:true,source_wav_unchanged:true},original_sources_unchanged:readback,graphic_functions_equal_after_normalizing_authorized_changes:true,native_capture_pixels_modified:false,final_lower_offer_caption:false,brand_wordmark:'Diecik',visual_url:'Diecik.com',real_target_url:'https://diecik.com',safe_zone:{left:70,right:1010,top:288,bottom:1230,reference:manifest.authorized_changes.final_layout.reference,critical_final_bboxes:critical,cta_enter_max_bottom_y:1223},encoded_samples:samples,cover:{file:'okladki/'+basename+'.jpg',frame:561,time_s:18.7,sha256:await fileHash(cover)},review:{technical:'PASS',visual:'PENDING_INDEPENDENT_REVIEW',user_acceptance:false},limitations:['Native capture pixels and legacy scene annotations remain unchanged; safe-zone assertion covers the final primary brand, tagline, URL and CTA.','Existing real UI and source timings are preserved. Brand spelling correction is for compositor-owned text; native app pixels are not retouched.']};
await fs.writeFile(path.join(qa,'technical-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,sha256:report.output.sha256,frames:Number(video.nb_read_frames),duration:Number(video.duration),audio_identical:true,sources_unchanged:readback.length,review_board:'qa/ulubione/encoded-review-board-360.jpg',cover:report.cover.file}));
