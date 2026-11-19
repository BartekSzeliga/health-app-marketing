import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

// V5: three complete, frontal UI scenes. No camera, fragment crops or fake UI.
const req=createRequire(import.meta.url);
const {createCanvas,loadImage}=req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const variant=arg('--variant','A').toUpperCase(),destination=arg('--destination','lead'),format=arg('--format','story');
if(!['A','B'].includes(variant)||!['lead','website'].includes(destination)||!['story','wide'].includes(format))throw new Error('Invalid variant/destination/format');
const wide=format==='wide',preview=args.includes('--preview'),W=wide?1920:1080,H=wide?1080:1920,FPS=30,DURATION=25;
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const QA=path.join(root,'qa/b2b-render'),OUT=path.join(root,'filmy'),PREVIEW=path.join(root,'podglad');
const stem=`diecik-specjalista-${destination}-${variant.toLowerCase()}-25s-${format}`;
for(const d of [QA,OUT,PREVIEW])await fs.mkdir(d,{recursive:true});
const spec=JSON.parse(await fs.readFile(path.join(root,'assets/b2b/source-spec.json'),'utf8'));
if(spec.handoff_verified!==false||spec.separate_examples!==true)throw new Error('Source provenance must remain separate, unverified handoff');
const webCrop={left:208,top:0,width:1490,height:966,right:1698};
const C={deep:'#081E2A',ink:'#0B2130',white:'#F8FCF9',mint:'#DDF3EA',lime:'#CBEF85'};
async function command(a){const p=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y',...a],{stdio:['ignore','ignore','pipe']});let err='';p.stderr.on('data',d=>err+=d);const[code]=await once(p,'close');if(code)throw new Error(err);}
const images={};
for(const [name,file] of Object.entries({editor:'web-editor-full-context.png',publish:'web-publish-full-context.png',published:'web-published-full-context.png',mobileBefore:'client-plan-full-before.png',mobileAfter:'client-plan-full-after.png'})){
  const image=await loadImage(path.join(root,'assets/b2b',file));
  if(['editor','publish','published'].includes(name)){const c=createCanvas(1490,966);c.getContext('2d').drawImage(image,208,0,1490,966,0,0,1490,966);images[name]=c;}else images[name]=image;
}
images.icon=await loadImage(path.join(root,'assets/diecik-icon.png'));
const webSource=spec.sources.find(s=>s.id==='web');
let normalized=path.resolve(root,webSource.normalized_window);
try{await fs.access(normalized);}catch{normalized=path.resolve(root,'../ulubione-v2-2026-10-01/qa/b2b/web-165-217-cfr30.mp4');await fs.access(normalized);}
const jobs=[
  {name:'editor-live',file:normalized,start:7.5,count:91,web:true},
  {name:'main-full',file:normalized,start:42.266666667,count:12,web:true},
  {name:'dialog-full',file:normalized,start:45.8,count:33,web:true},
  {name:'published-full',file:normalized,start:48,count:36,web:true},
  {name:'mobile-full',file:path.join(root,'assets/b2b/client-plan-full-scroll.mp4'),count:111,web:false}
];
const frames={};
for(const job of jobs){
  const dir=path.join(QA,'frames',job.name);await fs.mkdir(dir,{recursive:true});
  const vf=job.web?'crop=1490:966:208:0,fps=30':'fps=30';
  await command([...(job.start===undefined?[]:['-ss',String(job.start)]),'-i',job.file,'-an','-vf',vf,'-frames:v',String(job.count),path.join(dir,'%04d.png')]);
  frames[job.name]=await Promise.all(Array.from({length:job.count},(_,i)=>loadImage(path.join(dir,`${String(i+1).padStart(4,'0')}.png`))));
}
const actual=(name,t,start,fallback)=>t<start?fallback:frames[name][Math.min(frames[name].length-1,Math.floor((t-start)*30+1e-7))];
const webBounds=wide?{x:580,y:118,w:1290,h:1290*966/1490}:{x:48,y:650,w:984,h:984*966/1490};
const phoneBounds=wide?{x:1060,y:100,w:400,h:400*2622/1206}:{x:240,y:540,w:600,h:600*2622/1206};
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function background(){ctx.fillStyle=C.deep;ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W*.52,H*.50,10,W*.52,H*.50,Math.max(W,H)*.7);g.addColorStop(0,'#176478');g.addColorStop(.6,'#0E3547');g.addColorStop(1,C.deep);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function text(value,x,y,size,{color=C.white,weight=700,alpha=1,max=984}={}){ctx.save();ctx.globalAlpha=alpha;ctx.font=`${weight} ${size}px "Avenir Next"`;if(ctx.measureText(value).width>max)throw new Error(`Caption must be wrapped, not squeezed: ${value}`);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,x,y);ctx.restore();}
function screen(image,bounds,desktop=false){
  const{x,y,w,h}=bounds;ctx.save();ctx.shadowColor='rgba(0,5,12,.40)';ctx.shadowBlur=40;ctx.shadowOffsetY=16;ctx.fillStyle='#102D39';rr(x-10,y-10,w+20,h+20,desktop?16:35);ctx.fill();ctx.shadowColor='transparent';
  ctx.strokeStyle='rgba(185,237,222,.38)';ctx.lineWidth=2;rr(x-10,y-10,w+20,h+20,desktop?16:35);ctx.stroke();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,x,y,w,h);ctx.restore();
  if(desktop){ctx.fillStyle='#153E4D';rr(x+w*.45,y+h+12,w*.10,32,7);ctx.fill();rr(x+w*.33,y+h+38,w*.34,12,6);ctx.fill();}
}
function caption(scene){
  let lines;
  if(scene==='editor')lines=variant==='A'?['Układasz dietę.','Klient ma ją w aplikacji.']:['Dieta od Ciebie.','W aplikacji klienta.'];
  else if(scene==='publish')lines=['Publikujesz plan','w aplikacji.'];
  else lines=['Klient ma dietę','pod ręką.'];
  if(wide){const wrap=scene==='editor'&&variant==='A'?['Układasz dietę.','Klient ma ją','w aplikacji.']:lines;text(wrap[0],285,350,62,{max:540});for(let i=1;i<wrap.length;i++)text(wrap[i],285,440+(i-1)*70,50,{weight:600,color:C.mint,max:540});}
  else {text(lines[0],540,280,76);text(lines[1],540,380,64,{weight:600,color:C.mint});}
}
function anchor(rect,t){const b=webBounds,k=b.w/1490;ctx.save();ctx.strokeStyle=`rgba(203,239,133,${.64+.12*Math.sin(t*2)})`;ctx.lineWidth=wide?4:3;ctx.shadowColor='rgba(203,239,133,.30)';ctx.shadowBlur=9;rr(b.x+(rect.x-208)*k-4,b.y+rect.y*k-4,rect.w*k+8,rect.h*k+8,5);ctx.stroke();ctx.restore();}
function brand(x,y,size){ctx.save();ctx.font=`700 ${size}px "Avenir Next"`;const iw=size*.8,tw=ctx.measureText('diecik').width,bx=x-(tw+iw+14)/2;ctx.drawImage(images.icon,bx,y-iw/2,iw,iw);ctx.fillStyle=C.white;ctx.textBaseline='middle';ctx.fillText('diecik',bx+iw+14,y+2);ctx.restore();}
function cta(t){const alpha=Math.min(1,Math.max(0,(t-22.8)/.3));if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;
  if(wide){brand(295,265,80);text('Do 2 aktywnych',295,365,43,{max:550});text('klientów bez opłat',295,425,43,{max:550});text('diecik.com/specjalista',295,520,40,{weight:600,max:550});ctx.fillStyle=C.lime;rr(35,615,520,120,23);ctx.fill();text(destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',295,675,45,{color:C.ink,max:490});}
  else {brand(540,270,70);text('Do 2 aktywnych klientów bez opłat',540,330,40);text('diecik.com/specjalista',540,390,39,{weight:600});ctx.fillStyle=C.lime;rr(90,415,900,110,24);ctx.fill();text(destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',540,470,52,{color:C.ink,max:860});}
  ctx.restore();
}
function render(t){background();if(t<8.5){screen(actual('editor-live',t,4.8,frames['editor-live'][0]),webBounds,true);caption('editor');}
  else if(t<15.3){let image;if(t<10.10)image=actual('main-full',t,9.633333333,images.publish);else if(t<12.70)image=actual('dialog-full',t,10.75,frames['dialog-full'][0]);else image=actual('published-full',t,12.70,images.published);screen(image,webBounds,true);caption('publish');
    if(t<10.10)anchor({x:718,y:610,w:470,h:56},t);else if(t<12.70)anchor({x:1084,y:560,w:168,h:44},t);else anchor({x:1510,y:174,w:116,h:52},t);}
  else {screen(t>=21?images.mobileAfter:actual('mobile-full',t,17.3,images.mobileBefore),phoneBounds);if(t<22.8)caption('mobile');else cta(t);}}
const timing={version:5,variant,destination,format,width:W,height:H,duration:25,fps:30,concept:'Three complete authentic screens in fixed frontal frames; no camera/zoom/fragment UI',scenes:{editor:[0,8.5],publish:[8.5,15.3],mobile:[15.3,25],cta:[22.8,25]},webBounds,phoneBounds,webCrop,capture_speed:1,editor_live_clip_start_s:4.8,editor_live_clip_end_s:7.833333333,editor_source_normalized_s:[7.5,10.533333333],editor_source_original_s:[172.5,175.533333333],editor_live_frames:91,editor_first_frame_hold_s:[0,4.8],editor_last_frame_hold_s:[7.833333333,8.5],main_full_clip_start_s:9.633333333,main_sfx_s:9.933333333,dialog_full_clip_start_s:10.75,confirm_press_s:11.65,confirm_first_encoded_frame_s:11.666666667,pending_first_s:11.70,published_full_clip_start_s:12.70,published_result_read_s:[12.7,15.3],mobile_full_before_read_s:[15.3,17.3],mobile_full_clip_start_s:17.3,mobile_full_clip_end_s:21,mobile_full_after_read_s:[21,22.8],cta_start_s:22.8,cta_full_s:23.1,cta:destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',externalDemoCaption:false,externalStepLabels:false,handoffVerified:false,separateExamples:true,audio:'audio/diecik-specjalista-v4-mix-25s.wav',audio_reused_byte_identical_v4:true,sourceSpec:'assets/b2b/source-spec.json',normalizedSource:path.relative(root,normalized),full_dialog_source_original_s:[210.8,211.9],transient_warning_excluded:true};
await fs.writeFile(path.join(QA,`${stem}-timing.json`),JSON.stringify(timing,null,2)+'\n');
const stamps=[3,11.3,18,23.8];
const dir=path.join(PREVIEW,`${stem}-context`);await fs.mkdir(dir,{recursive:true});
const contact=createCanvas(1440,wide?241:678),cg=contact.getContext('2d');cg.fillStyle='#ECF3EF';cg.fillRect(0,0,contact.width,contact.height);
for(let i=0;i<stamps.length;i++){const t=stamps[i];render(t);const file=path.join(dir,`${t.toFixed(3)}s.png`),small=path.join(dir,`${t.toFixed(3)}s-360.png`);await fs.writeFile(file,canvas.toBuffer('image/png'));await command(['-i',file,'-vf','scale=360:-1','-frames:v','1',small]);cg.drawImage(await loadImage(small),i*360,0);cg.fillStyle=C.ink;cg.font='18px "Avenir Next"';cg.fillText(`${t.toFixed(1)} s`,i*360+12,(wide?203:640)+25);}
await fs.writeFile(path.join(PREVIEW,`${stem}-context-contact.jpg`),contact.toBuffer('image/jpeg',90));
console.log(JSON.stringify({context:dir,contact:path.join(PREVIEW,`${stem}-context-contact.jpg`)}));
if(!preview){const audio=path.join(root,'audio/diecik-specjalista-v4-mix-25s.wav'),output=path.join(OUT,`${stem}.mp4`),temporary=path.join(QA,`${stem}.rendering.mp4`);await fs.access(audio);
const p=spawn(ffmpeg,['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r','30','-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-vf','scale=out_color_matrix=bt709:out_range=tv,setsar=1','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-r','30','-g','30','-c:a','aac','-b:a','192k','-ar','48000','-t','25','-movflags','+faststart',temporary],{stdio:['pipe','ignore','pipe']});let err='';p.stderr.on('data',d=>err+=d);const closed=once(p,'close');p.stdin.on('error',()=>{});
for(let n=0;n<750;n++){render(n/30);const data=ctx.getImageData(0,0,W,H);if(!p.stdin.write(Buffer.from(data.data)))await Promise.race([once(p.stdin,'drain'),closed.then(([c])=>{throw new Error(`ffmpeg exited ${c}: ${err}`);})]);if(n%150===0)console.log(`B2B v5 ${n}/750`);}
p.stdin.end();const[code]=await closed;if(code)throw new Error(err);await fs.rename(temporary,output);console.log(JSON.stringify({output,duration:25,frames:750,width:W,height:H}));}
