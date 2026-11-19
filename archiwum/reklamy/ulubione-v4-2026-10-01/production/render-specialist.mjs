import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

// Separate B2B film. The B2C renderer is deliberately not imported or edited.
// Only original capture pixels are used as UI textures; all movement is camera work.
const req=createRequire(import.meta.url);
const {createCanvas,loadImage}=req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const argv=process.argv.slice(2);
const arg=(key,fallback)=>argv.includes(key)?argv[argv.indexOf(key)+1]:fallback;
const variant=arg('--variant','A').toUpperCase();
if(!['A','B'].includes(variant))throw new Error('Use --variant A or B');
const destination=arg('--destination','lead');
if(!['lead','website'].includes(destination))throw new Error('Use --destination lead or website');
const format=arg('--format','story');
if(!['story','wide'].includes(format))throw new Error('Use --format story or wide');
const wide=format==='wide';
const preview=argv.includes('--preview');
const W=wide?1920:1080,H=wide?1080:1920,FPS=30,DURATION=25;
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const QA=path.join(root,'qa/b2b-render');
const OUT=path.join(root,'filmy');
const PREVIEW=path.join(root,'podglad');
const stem=`diecik-specjalista-${destination}-${variant.toLowerCase()}-25s-${format}`;
await fs.mkdir(QA,{recursive:true});await fs.mkdir(OUT,{recursive:true});await fs.mkdir(PREVIEW,{recursive:true});
const spec=JSON.parse(await fs.readFile(path.join(root,'assets/b2b/source-spec.json'),'utf8'));
if(spec.handoff_verified!==false||spec.separate_examples!==true||![null,'Przykładowe konta DEMO',undefined].includes(spec.required_external_caption))throw new Error('Source facts changed: re-review separate original examples');

async function command(args) {
  const p=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:['ignore','ignore','pipe']});
  let err='';p.stderr.on('data',d=>err+=d);
  const [code]=await once(p,'close');if(code!==0)throw new Error(err||`ffmpeg exit ${code}`);
}
const imageFiles={webPublish:'web-publish-full-context.png',webEditor:'web-editor-full-context.png',
  dialog:'publish-confirm-dialog.png',webPublished:'web-published-full-context.png',
  mobileBefore:'client-plan-full-before.png',mobileAfter:'client-plan-full-after.png'};
const images={};
for(const [name,file] of Object.entries(imageFiles))images[name]=await loadImage(path.join(root,'assets/b2b',file));
// The original screenshot contains a closed chat launcher outside the app panel.
// Crop only that unrelated outer area; leave navigation and the real panel intact.
const webCrop={left:208,top:0,width:1490,height:966,right:1698};
for(const name of ['webPublish','webEditor','webPublished']) {
  const c=createCanvas(webCrop.width,webCrop.height),g=c.getContext('2d');
  g.drawImage(images[name],webCrop.left,webCrop.top,webCrop.width,webCrop.height,0,0,webCrop.width,webCrop.height);images[name]=c;
}
images.icon=await loadImage(path.join(root,'assets/diecik-icon.png'));
const clipNames=['web-editor-full-collapse','publish-confirm-dialog','client-plan-full-scroll'];
const frames={};
for(const name of clipNames) {
  const source=spec.clips.find(c=>c.asset.endsWith(`/${name}.mp4`));
  if(!source)throw new Error(`Missing truthful source ${name}`);
  const dir=path.join(QA,'frames',name);await fs.mkdir(dir,{recursive:true});
  const filter=name.startsWith('web-')?`crop=${webCrop.width}:${webCrop.height}:${webCrop.left}:${webCrop.top},fps=30`:'fps=30';
  await command(['-i',path.join(root,source.asset),'-an','-vf',filter,'-frames:v',String(source.frames),path.join(dir,'%04d.png')]);
  frames[name]=await Promise.all(Array.from({length:source.frames},(_,i)=>loadImage(path.join(dir,`${String(i+1).padStart(4,'0')}.png`))));
}
// Additional full-screen frames come directly from the already reviewed CFR window.
// No partial UI is pasted over a frozen screen; even the cursor is the real capture.
const fullWebSources=[{name:'web-main-full',start:42.266666667,frames:12,originalStart:207.266666667},
  {name:'web-published-full',start:48,frames:36,originalStart:213}];
const webSource=spec.sources.find(s=>s.id==='web');
let normalizedWebPath=path.join(root,webSource.normalized_window);
try {await fs.access(normalizedWebPath);} catch {
  // Reuse the already validated local source; do not recapture or ship this raw window.
  normalizedWebPath=path.resolve(root,'../ulubione-v2-2026-10-01',webSource.normalized_window);
  await fs.access(normalizedWebPath);
}
for(const source of fullWebSources) {
  const dir=path.join(QA,'frames',source.name);await fs.mkdir(dir,{recursive:true});
  await command(['-ss',String(source.start),'-i',normalizedWebPath,'-an','-vf',`crop=${webCrop.width}:${webCrop.height}:${webCrop.left}:${webCrop.top},fps=30`,'-frames:v',String(source.frames),path.join(dir,'%04d.png')]);
  frames[source.name]=await Promise.all(Array.from({length:source.frames},(_,i)=>loadImage(path.join(dir,`${String(i+1).padStart(4,'0')}.png`))));
}
await fs.writeFile(path.join(QA,'derived-source-timing.json'),JSON.stringify({sourceWindow:path.relative(root,normalizedWebPath),sourceWebSha256:webSource.sha256,fullWebSources,webCrop,chatLauncherExcluded:true,speed:1,originalPixelsOnly:true,externalDemoCaption:false,handoffVerified:false,separateExamples:true},null,2)+'\n');
const C={ink:'#0B2130',deep:'#071924',teal:'#155E75',mint:'#DDF3EA',lime:'#CBEF85',white:'#F8FCF9',cyan:'#6ED5E0'};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,p)=>a+(b-a)*p;
const prog=(t,a,b)=>clamp((t-a)/(b-a));
const ease=p=>p*p*p*(p*(p*6-15)+10);
const win=(t,a,b,d=.18)=>ease(prog(t,a,a+d))*(1-ease(prog(t,b-d,b)));
const actual=(name,t,start,fallback)=>t<start?fallback:frames[name][Math.min(frames[name].length-1,Math.floor((t-start)*FPS+1e-7))];
function roundRect(x,y,w,h,r) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function text(value,x,y,size,{weight=600,alpha=1,color=C.white,align='center',max=960}={}) {
  if(alpha<=0)return;ctx.save();ctx.globalAlpha=clamp(alpha);ctx.fillStyle=color;
  ctx.font=`${weight} ${size}px "Avenir Next"`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(value,x,y,max);ctx.restore();
}
function background(t) {
  ctx.fillStyle=C.deep;ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W*.4+200*Math.sin(t*.45),H*.45+70*Math.cos(t*.6),40,W/2,H/2,Math.max(W,H)*.7);
  g.addColorStop(0,'#17677C');g.addColorStop(.5,'#123E51');g.addColorStop(1,C.deep);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // Studio lighting persists through the whole camera move.
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-.46+t*.035);ctx.strokeStyle='rgba(144,222,213,.12)';ctx.lineWidth=2;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,680+i*35,1080+i*35,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
  const floor=ctx.createLinearGradient(0,H*.72,0,H);floor.addColorStop(0,'rgba(2,12,20,0)');floor.addColorStop(1,'rgba(2,12,20,.7)');ctx.fillStyle=floor;ctx.fillRect(0,H*.72,W,H*.28);
}
// Perspective surface. Overlapping triangle clips plus one outer clip prevent seams.
function projected(img,x,y,w,{rx=0,ry=0,rz=0,alpha=1}={}) {
  if(alpha<=0)return;const h=w*img.height/img.width,focus=2100;
  const point=(u,v,depth=0)=>{
    const a=(u-.5)*w,b=(v-.5)*h;
    const b1=b*Math.cos(rx)-depth*Math.sin(rx),c1=b*Math.sin(rx)+depth*Math.cos(rx);
    const a2=a*Math.cos(ry)+c1*Math.sin(ry),c2=-a*Math.sin(ry)+c1*Math.cos(ry);
    const a3=a2*Math.cos(rz)-b1*Math.sin(rz),b3=a2*Math.sin(rz)+b1*Math.cos(rz);
    const q=focus/(focus+c2);return[x+a3*q,y+b3*q];
  };
  const corners=[[0,0],[1,0],[1,1],[0,1]].map(p=>point(...p));
  ctx.save();ctx.globalAlpha=clamp(alpha);ctx.shadowColor='rgba(0,8,15,.48)';ctx.shadowBlur=42;ctx.shadowOffsetY=28;
  ctx.fillStyle='#89B8B3';ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p[0]+3,p[1]+10):ctx.moveTo(p[0]+3,p[1]+10));ctx.closePath();ctx.fill();ctx.shadowColor='transparent';
  ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();
  const triangle=(s,d)=>{
    const [s0,s1,s2]=s,[d0,d1,d2]=d;const[x0,y0]=s0,[x1,y1]=s1,[x2,y2]=s2;
    const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
    const a=(d0[0]*(y1-y2)+d1[0]*(y2-y0)+d2[0]*(y0-y1))/det;
    const c=(d0[0]*(x2-x1)+d1[0]*(x0-x2)+d2[0]*(x1-x0))/det;
    const e=(d0[0]*(x1*y2-x2*y1)+d1[0]*(x2*y0-x0*y2)+d2[0]*(x0*y1-x1*y0))/det;
    const b=(d0[1]*(y1-y2)+d1[1]*(y2-y0)+d2[1]*(y0-y1))/det;
    const dm=(d0[1]*(x2-x1)+d1[1]*(x0-x2)+d2[1]*(x1-x0))/det;
    const f=(d0[1]*(x1*y2-x2*y1)+d1[1]*(x2*y0-x0*y2)+d2[1]*(x0*y1-x1*y0))/det;
    const mx=(d0[0]+d1[0]+d2[0])/3,my=(d0[1]+d1[1]+d2[1])/3;
    const expand=p=>{const dx=p[0]-mx,dy=p[1]-my,l=Math.hypot(dx,dy)||1;return[p[0]+dx/l*2.2,p[1]+dy/l*2.2];};
    ctx.save();ctx.beginPath();ctx.moveTo(...expand(d0));ctx.lineTo(...expand(d1));ctx.lineTo(...expand(d2));ctx.closePath();ctx.clip();ctx.setTransform(a,b,c,dm,e,f);ctx.drawImage(img,0,0);ctx.restore();
  };
  const nx=6,ny=4;
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const uv=[[i/nx,j/ny],[(i+1)/nx,j/ny],[(i+1)/nx,(j+1)/ny],[i/nx,(j+1)/ny]];
    const src=uv.map(([u,v])=>[u*img.width,v*img.height]),dst=uv.map(p=>point(...p));
    triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle([src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
  }ctx.restore();
}
// Continuous camera moves between authentic function examples, with long reading holds.
// The provenance records separate web and mobile examples; no handoff is claimed.
const cameraKeys=[
  [0,-7,155,3.00,.016,-.025,.005],
  [2.05,-7,155,2.98,.012,-.015,.002],
  [3.00,0,0,.65,.010,-.012,-.005],
  [5.00,0,0,.65,.008,-.008,-.003],
  [5.55,-2307,0,.65,.008,-.010,-.003],
  [6.00,-2815,235,1.64,.008,-.010,.001],
  [8.266667,-2815,235,1.65,.006,-.005,.001],
  [8.933333,-7,155,3.00,.008,-.008,-.003],
  [10.10,-7,155,3.00,.006,-.006,-.002],
  [10.40,950,-100,1.74,.008,-.006,.002],
  [12.30,950,-100,1.74,.006,-.003,.001],
  [12.70,1729,-163,2.30,.006,-.005,-.002],
  [14.70,1729,-163,2.30,.005,-.002,-.001],
  [15.30,4700,80,.62,.007,-.009,.004],
  [17.30,4700,80,.62,.005,-.006,.002],
  [21.00,4700,80,.62,.004,-.004,.001],
  [22.80,4700,80,.62,.004,-.003,.001],
  [23.20,4700,170,.54,.004,-.003,-.001],
  [25.00,4704,180,.55,.004,-.006,-.003]
];
const wideScales=[3.6,3.58,.90,.90,.90,1.90,1.90,3.6,3.6,2.45,2.45,3.10,3.10,.34,.34,.34,.34,.34,.345];
if(wide)cameraKeys.forEach((k,i)=>k[3]=wideScales[i]);
function camera(t) {
  let i=0;while(i<cameraKeys.length-2&&t>=cameraKeys[i+1][0])i++;
  const a=cameraKeys[i],b=cameraKeys[i+1],p=ease(prog(t,a[0],b[0]));
  const values=a.slice(1).map((v,j)=>lerp(v,b[j+1],p));
  return{x:values[0]+2*Math.sin(t*.45),y:values[1]+1.5*Math.sin(t*.53),scale:values[2],rx:values[3],ry:values[4],rz:values[5]};
}
function plane(img,x,y,w,cam,{alpha=1,rotation=0}={}) {
  const end=wide?ease(prog(currentTime,22.80,23.20)):0;
  const centerX=wide?lerp(960,570,end):540;
  const centerY=wide?lerp(655,535,ease(prog(currentTime,14.70,15.30))):955;
  const sx=centerX+(x-cam.x)*cam.scale,sy=centerY+(y-cam.y)*cam.scale,sw=w*cam.scale;
  if(sx+sw< -50||sx-sw>W+50)return;
  projected(img,sx,sy,sw,{rx:cam.rx,ry:cam.ry,rz:cam.rz+rotation,alpha});
}
function brand(y,alpha=1,size=64,centerX=W/2) {
  ctx.save();ctx.globalAlpha=alpha;ctx.font=`700 ${size}px "Avenir Next"`;const iw=size*.85,tw=ctx.measureText('diecik').width,bx=centerX-(tw+iw+16)/2;
  ctx.save();roundRect(bx,y-iw/2,iw,iw,iw*.25);ctx.clip();ctx.drawImage(images.icon,bx,y-iw/2,iw,iw);ctx.restore();
  ctx.fillStyle=C.white;ctx.textBaseline='middle';ctx.fillText('diecik',bx+iw+16,y+2);ctx.restore();
}
function hook(t) {
  // Intro copy only. There is no external DEMO/step label or permanent header/scrim.
  const alpha=win(t,.15,2.38,.25);if(alpha<=0)return;
  const copy=variant==='A'?'Plan gotowy. Klient też.':'Od planu do aplikacji.';
  ctx.save();ctx.globalAlpha=alpha;ctx.font=`700 ${wide?96:72}px "Avenir Next"`;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.strokeStyle='rgba(248,252,249,.80)';ctx.lineWidth=wide?5:4;
  ctx.strokeText(copy,W/2,wide?235:335,W-150);
  ctx.fillStyle=C.ink;ctx.fillText(copy,W/2,wide?235:335,W-150);ctx.restore();
}
function endCTA(t) {
  const p=ease(prog(t,22.80,23.10));if(p<=0)return;
  if(wide) {
    const cx=1390;
    const veil=ctx.createLinearGradient(880,0,1250,0);veil.addColorStop(0,'rgba(7,25,36,0)');veil.addColorStop(1,`rgba(7,25,36,${.83*p})`);ctx.fillStyle=veil;ctx.fillRect(880,245,W-880,H-245);
    brand(400,p,104,cx);
    text('Do 2 aktywnych klientów',cx,518,60,{alpha:p,weight:700,max:950});
    text('bez opłat',cx,589,60,{alpha:p,weight:700,max:950});
    text('diecik.com/specjalista',cx,692,58,{alpha:p,weight:600,max:930});
    const bw=820,bh=134,by=814+35*(1-p);
    ctx.save();ctx.globalAlpha=p;ctx.fillStyle=C.lime;roundRect(cx-bw/2,by-bh/2,bw,bh,29);ctx.fill();
    text(destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',cx-22,by,64,{color:C.ink,weight:700,max:720});
    ctx.strokeStyle=C.ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+bw/2-61,by-15);ctx.lineTo(cx+bw/2-43,by);ctx.lineTo(cx+bw/2-61,by+15);ctx.stroke();ctx.restore();return;
  }
  // CTA overlays the still moving native plan. The product never becomes an end card.
  const g=ctx.createLinearGradient(0,1020,0,1780);g.addColorStop(0,'rgba(7,25,36,0)');g.addColorStop(.30,`rgba(7,25,36,${.83*p})`);g.addColorStop(1,`rgba(7,25,36,${.98*p})`);ctx.fillStyle=g;ctx.fillRect(0,1020,W,760);
  brand(1180,p,78);
  text('Do 2 aktywnych klientów bez opłat',540,1270,44,{alpha:p,weight:700,max:970});
  text('diecik.com/specjalista',540,1350,43,{alpha:p,weight:600});
  const by=1455+35*(1-p),bw=880,bh=128;
  ctx.save();ctx.globalAlpha=p;ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=30;ctx.shadowOffsetY=12;ctx.fillStyle=C.lime;roundRect((W-bw)/2,by-bh/2,bw,bh,29);ctx.fill();ctx.shadowColor='transparent';
  text(destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',518,by+1,53,{weight:700,color:C.ink});
  ctx.strokeStyle=C.ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(872,by-15);ctx.lineTo(890,by);ctx.lineTo(872,by+15);ctx.stroke();ctx.restore();
}
let currentTime=0;
function render(t) {
  currentTime=t;background(t);const cam=camera(t);
  const editor=actual('web-editor-full-collapse',t,7.00,images.webEditor);
  // Every live clip runs once at capture speed. Camera holds while UI changes.
  plane(editor,-2307,0,1490,cam,{alpha:1-ease(prog(t,8.266667,8.933333))});
  plane(actual('web-main-full',t,9.633333333,images.webPublish),-7,0,1490,cam,{alpha:1-ease(prog(t,10.10,10.40))});
  if(t>=10.08)plane(actual('publish-confirm-dialog',t,10.75,images.dialog),950,-100,600,cam,{alpha:ease(prog(t,10.08,10.40))*(1-ease(prog(t,12.30,12.70)))});
  if(t>=12.28){
    const a=ease(prog(t,12.30,12.70))*(1-ease(prog(t,14.70,15.30)));
    plane(actual('web-published-full',t,12.70,images.webPublished),2293,0,1490,cam,{alpha:a});
  }
  if(t>=14.70){
    const a=ease(prog(t,14.70,15.30));
    // Full original native video; header and bottom navigation are never reconstructed.
    plane(t>=21.00?images.mobileAfter:actual('client-plan-full-scroll',t,17.30,images.mobileBefore),4700,0,1206,cam,{alpha:a});
  }
  hook(t);endCTA(t);
}
const keyframes=[.6,1.5,3.0,4.5,6.0,6.7,7.0,7.7,8.266667,9.2,9.966667,10.5,11.3,11.65,11.7,12.8,13.7,14.5,15.5,16.7,17.3,18.5,20.0,21.1,22.5,23.8,24.5];
async function savePreviews() {
  const dir=path.join(PREVIEW,`${stem}-keyframes`);await fs.mkdir(dir,{recursive:true});
  const smallH=wide?203:640;
  const small=createCanvas(360,smallH),sctx=small.getContext('2d');
  const contact=createCanvas(1800,Math.ceil(keyframes.length/5)*(smallH+40)),cctx=contact.getContext('2d');cctx.fillStyle='#ECF3EF';cctx.fillRect(0,0,contact.width,contact.height);
  for(let i=0;i<keyframes.length;i++){
    const t=keyframes[i];render(t);const name=`${String(i+1).padStart(2,'0')}-${t.toFixed(3)}s`;
    await fs.writeFile(path.join(dir,`${name}.png`),canvas.toBuffer('image/png'));
    sctx.drawImage(canvas,0,0,360,smallH);await fs.writeFile(path.join(dir,`${name}-360.png`),small.toBuffer('image/png'));
    const x=i%5*360,y=Math.floor(i/5)*(smallH+40);cctx.drawImage(small,x,y);cctx.fillStyle=C.ink;cctx.font='18px "Avenir Next"';cctx.fillText(`${name}`,x+12,y+smallH+23);
  }
  await fs.writeFile(path.join(PREVIEW,`${stem}-contact.png`),contact.toBuffer('image/png'));
  await fs.writeFile(path.join(QA,`${stem}-timing.json`),JSON.stringify({
    version:4,variant,destination,format,width:W,height:H,duration:DURATION,fps:FPS,
    hook:variant==='A'?'Plan gotowy. Klient też.':'Od planu do aplikacji.',
    sourceSpec:'assets/b2b/source-spec.json',webCrop,chatLauncherExcluded:true,
    externalDemoCaption:false,externalStepLabels:false,handoffVerified:false,separateExamples:true,
    full_panel_read_s:[3.00,5.00],editor_detail_read_s:[6.00,8.266667],
    editor_live_clip_start_s:7.00,editor_live_clip_end_s:8.266667,
    main_full_clip_start_s:9.633333333,main_sfx_s:9.933333333,main_first_observable_frame_s:9.933333333,
    dialog_live_clip_start_s:10.75,confirm_press_s:11.65,confirm_first_encoded_frame_s:11.666666667,
    pending_nominal_s:11.683333333,pending_first_s:11.70,
    published_result_read_s:[12.70,14.70],published_full_clip_start_s:12.70,
    mobile_full_before_read_s:[15.30,17.30],mobile_full_clip_start_s:17.30,mobile_full_clip_end_s:21.00,
    mobile_full_after_read_s:[21.00,22.80],cta_start_s:22.80,cta_full_s:23.10,
    cta:destination==='lead'?'Zobacz, jak to działa':'Zacznij bezpłatnie',
    audio:'audio/diecik-specjalista-v4-mix-25s.wav',capture_speed:1,cameraKeys,keyframes,
    note:'Function montage of separate authentic examples; no verified same-account handoff. All DEMO text inside source UI remains untouched.'
  },null,2)+'\n');
  console.log(JSON.stringify({previewDirectory:dir,contactSheet:path.join(PREVIEW,`${stem}-contact.png`)}));
}
await savePreviews();
if(!preview) {
  const audio=path.join(root,'audio/diecik-specjalista-v4-mix-25s.wav');await fs.access(audio);
  const output=path.join(OUT,`${stem}.mp4`);
  const temporary=path.join(QA,`${stem}.rendering.mp4`);
  const p=spawn(ffmpeg,['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',audio,'-map','0:v:0','-map','1:a:0','-vf','scale=out_color_matrix=bt709:out_range=tv,setsar=1','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-r',String(FPS),'-g','30','-c:a','aac','-b:a','192k','-ar','48000','-t',String(DURATION),'-movflags','+faststart',temporary],{stdio:['pipe','ignore','pipe']});
  let err='';p.stderr.on('data',d=>err+=d);const closed=once(p,'close');p.stdin.on('error',()=>{});
  for(let n=0;n<DURATION*FPS;n++){
    render(n/FPS);const data=canvas.getImageData?canvas.getImageData(0,0,W,H):ctx.getImageData(0,0,W,H);
    if(!p.stdin.write(Buffer.from(data.data)))await Promise.race([once(p.stdin,'drain'),closed.then(([c])=>{throw new Error(`ffmpeg terminated ${c}: ${err}`);})]);
    if(n%75===0)console.log(`B2B frame ${n}/${DURATION*FPS}`);
  }
  p.stdin.end();const [code]=await closed;if(code!==0)throw new Error(err);
  await fs.rename(temporary,output);
  console.log(JSON.stringify({output,width:W,height:H,fps:FPS,frames:DURATION*FPS,duration:DURATION}));
}
