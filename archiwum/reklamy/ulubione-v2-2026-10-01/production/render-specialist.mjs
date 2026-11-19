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
const W=wide?1920:1080,H=wide?1080:1920,FPS=30,DURATION=15;
const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
const QA=path.join(root,'qa/b2b-render');
const OUT=path.join(root,'filmy');
const PREVIEW=path.join(root,'podglad');
const stem=`diecik-specjalista-${destination}-${variant.toLowerCase()}-15s-${format}`;
await fs.mkdir(QA,{recursive:true});await fs.mkdir(OUT,{recursive:true});await fs.mkdir(PREVIEW,{recursive:true});
const spec=JSON.parse(await fs.readFile(path.join(root,'assets/b2b/source-spec.json'),'utf8'));
if(spec.handoff_verified!==false||spec.required_external_caption!=='Przykładowe konta DEMO')throw new Error('Source facts changed: re-review both DEMO examples');

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
images.icon=await loadImage(path.resolve(root,'../../../health-app-frontend/public/brand/diecik-icon.png'));
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
for(const source of fullWebSources) {
  const dir=path.join(QA,'frames',source.name);await fs.mkdir(dir,{recursive:true});
  await command(['-ss',String(source.start),'-i',path.join(root,webSource.normalized_window),'-an','-vf',`crop=${webCrop.width}:${webCrop.height}:${webCrop.left}:${webCrop.top},fps=30`,'-frames:v',String(source.frames),path.join(dir,'%04d.png')]);
  frames[source.name]=await Promise.all(Array.from({length:source.frames},(_,i)=>loadImage(path.join(dir,`${String(i+1).padStart(4,'0')}.png`))));
}
await fs.writeFile(path.join(QA,'derived-source-timing.json'),JSON.stringify({sourceWindow:webSource.normalized_window,sourceWebSha256:webSource.sha256,fullWebSources,webCrop,chatLauncherExcluded:true,speed:1,originalPixelsOnly:true},null,2)+'\n');
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
// One camera in a persistent space of authentic UI fragments. No background cuts.
// Position is not a claim about an application handoff; the two examples are labelled.
const cameraKeys=[
  [0,-7,155,4.2,.045,-.03,.018],
  [.44,-7,155,3.05,.025,.025,-.018],
  [.91,0,0,.65,.08,-.09,-.025],
  [1.30,0,0,.64,.035,-.025,-.008],
  [1.74,-2300,0,.65,.06,.05,.024],
  [2.15,-2486,285,1.95,-.02,.018,-.008],
  [2.96,-2390,215,1.75,.022,-.018,.01],
  [3.42,-7,155,3.25,-.03,.02,-.008],
  [4.00,-7,155,3.18,-.015,.01,-.006],
  [4.64,950,-100,1.74,.045,-.012,.018],
  [5.09,950,-100,1.8,.018,.012,.008],
  [5.48,1158,-5,3.35,.016,-.012,-.012],
  [5.83,1158,-5,3.3,.008,.008,-.005],
  [6.64,2300,0,.65,.04,-.055,-.018],
  [7.09,1729,-163,2.5,-.012,.012,-.008],
  [7.80,1729,-163,2.42,.008,.0,.01],
  [8.42,4700,-160,.53,.04,-.08,.024],
  [9.17,4700,-160,.55,.022,-.022,.012],
  [9.78,4700,305,.9,-.015,.018,-.012],
  [11.74,4700,250,.91,-.018,.022,-.013],
  [12.40,4700,-200,.55,-.025,.026,-.012],
  [13.125,4700,-260,.56,-.022,.031,-.015],
  [15,4715,-290,.575,-.018,.046,-.022]
];
const wideScales=[4.3,3.1,.87,.86,.87,2.2,1.9,4.1,4.05,2.3,2.3,3.9,3.8,.87,2.9,2.8,.31,.32,.85,.86,.31,.31,.315];
if(wide)cameraKeys.forEach((k,i)=>k[3]=wideScales[i]);
function camera(t) {
  let i=0;while(i<cameraKeys.length-2&&t>=cameraKeys[i+1][0])i++;
  const a=cameraKeys[i],b=cameraKeys[i+1],p=ease(prog(t,a[0],b[0]));
  const values=a.slice(1).map((v,j)=>lerp(v,b[j+1],p));
  return{x:values[0]+8*Math.sin(t*1.1),y:values[1]+5*Math.sin(t*1.4),scale:values[2],rx:values[3],ry:values[4],rz:values[5]};
}
function plane(img,x,y,w,cam,{alpha=1,rotation=0}={}) {
  const end=wide?ease(prog(currentTime,11.90,12.55)):0;
  const centerX=wide?lerp(960,570,end):540;
  const centerY=wide?lerp(655,535,ease(prog(currentTime,7.96,8.42))):955;
  const sx=centerX+(x-cam.x)*cam.scale,sy=centerY+(y-cam.y)*cam.scale,sw=w*cam.scale;
  if(sx+sw< -50||sx-sw>W+50)return;
  projected(img,sx,sy,sw,{rx:cam.rx,ry:cam.ry,rz:cam.rz+rotation,alpha});
}
function brand(y,alpha=1,size=64,centerX=W/2) {
  ctx.save();ctx.globalAlpha=alpha;ctx.font=`700 ${size}px "Avenir Next"`;const iw=size*.85,tw=ctx.measureText('diecik').width,bx=centerX-(tw+iw+16)/2;
  ctx.save();roundRect(bx,y-iw/2,iw,iw,iw*.25);ctx.clip();ctx.drawImage(images.icon,bx,y-iw/2,iw,iw);ctx.restore();
  ctx.fillStyle=C.white;ctx.textBaseline='middle';ctx.fillText('diecik',bx+iw+16,y+2);ctx.restore();
}
function labels(t) {
  // Readable at 360 px, deliberately outside the source UI.
  const hookOut=1-ease(prog(t,2.35,2.78));
  const topHeight=wide?190+90*hookOut:345+125*hookOut;
  ctx.fillStyle=C.deep;ctx.fillRect(0,0,W,topHeight);
  const top=ctx.createLinearGradient(0,topHeight,0,topHeight+(wide?70:100));top.addColorStop(0,'rgba(7,25,36,1)');top.addColorStop(1,'rgba(7,25,36,0)');ctx.fillStyle=top;ctx.fillRect(0,topHeight,W,wide?70:100);
  text('Przykładowe konta DEMO',W/2,wide?80:245,wide?58:39,{weight:600,color:C.mint,max:W-160});
  const mobile=ease(prog(t,8.02,8.36));
  text('Panel specjalisty · przykład 1',W/2,wide?145:301,wide?54:36,{alpha:1-mobile,color:'#B5D9D4',max:W-160});
  text('Aplikacja klienta · osobny przykład 2',W/2,wide?145:301,wide?54:36,{alpha:mobile,color:C.mint,max:W-160});
  const hook=win(t,.12,2.75,.28);
  const copy=variant==='A'?'Plan gotowy. Klient też.':'Od planu do aplikacji.';
  text(copy,W/2,(wide?235:425)-30*ease(prog(t,2.1,2.75)),wide?96:72,{weight:700,alpha:hook,max:W-150});
}
function endCTA(t) {
  const p=ease(prog(t,11.95,12.45));if(p<=0)return;
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
  const editor=actual('web-editor-full-collapse',t,1.78,images.webEditor);
  // UI clips retain 1× recorded speed. No cursor, typing, badge, or spinner is invented.
  plane(editor,-2307,0,1490,cam,{alpha:1-ease(prog(t,3.10,3.48))});
  plane(actual('web-main-full',t,3.45,images.webPublish),-7,0,1490,cam,{alpha:1-ease(prog(t,4.14,4.50))});
  if(t>=4.12)plane(actual('publish-confirm-dialog',t,4.70,images.dialog),950,-100,600,cam,{alpha:ease(prog(t,4.12,4.48))*(1-ease(prog(t,6.15,6.83)))});
  if(t>=6.05){
    const a=ease(prog(t,6.20,6.64))*(1-ease(prog(t,7.96,8.45)));
    plane(actual('web-published-full',t,6.50,images.webPublished),2293,0,1490,cam,{alpha:a});
  }
  if(t>=7.90){
    const a=ease(prog(t,7.90,8.33));
    // Full original native video, including real scrolling header and bottom menu.
    plane(t>=12.32?images.mobileAfter:actual('client-plan-full-scroll',t,8.62,images.mobileBefore),4700,0,1206,cam,{alpha:a});
  }
  labels(t);endCTA(t);
}
const keyframes=[0,.25,.6,.95,1.3,1.75,2.15,2.55,3.1,3.5,3.766667,4.12,4.65,5.1,5.5,5.6,5.666667,6.25,6.64,7.1,7.4,8.15,8.6,9.0,9.8,10.7,11.5,12.2,13.125,14.4];
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
  await fs.writeFile(path.join(QA,`${stem}-timing.json`),JSON.stringify({variant,destination,format,width:W,height:H,duration:DURATION,fps:FPS,hook:variant==='A'?'Plan gotowy. Klient też.':'Od planu do aplikacji.',sourceSpec:'assets/b2b/source-spec.json',webCrop,chatLauncherExcluded:true,main_sfx_s:3.75,main_first_observable_frame_s:3.766667,confirm_press_s:5.6,pending_first_s:5.633333,published_context_first_s:6.20,published_full_clip_start_s:6.50,mobile_other_example_first_s:8.02,mobile_full_clip_start_s:8.62,cta_start_s:11.95,cameraKeys,keyframes},null,2)+'\n');
  console.log(JSON.stringify({previewDirectory:dir,contactSheet:path.join(PREVIEW,`${stem}-contact.png`)}));
}
await savePreviews();
if(!preview) {
  const audio=path.join(root,'audio/diecik-specjalista-v2-mix-15s-128bpm.wav');await fs.access(audio);
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
