import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const req = createRequire(import.meta.url);
const {createCanvas,loadImage} = req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tooling = path.resolve(root, '../meta-start-aplikacji/.tooling/node_modules');
const ffmpeg = req(path.join(tooling,'ffmpeg-static/index.js'));
const argv = process.argv.slice(2);
const arg = (key, fallback) => argv.includes(key) ? argv[argv.indexOf(key)+1] : fallback;
const mode = arg('--mode','hero');
const format = arg('--format','story');
const variant = arg('--variant','A');
const preview = argv.includes('--preview');
const W = 1080;
const H = format==='feed'?1350:1920;
const FPS = 30;
const duration = mode==='bumper'?6:15;
const canvas = createCanvas(W,H);
const ctx = canvas.getContext('2d');
const assets = {};
for (const [key,file] of Object.entries({food:'meal-cutout.png',card:'ui-favorite-card.png',
  panel:'ui-favorite-panel.png',save:'ui-save-button.png',add:'ui-add-button.png',result:'ui-added-date-card.png'}))
  assets[key] = await loadImage(path.join(root,'assets',file));
assets.icon = await loadImage(path.join(root,'assets/diecik-icon.png'));
assets.saveFrames = await Promise.all(Array.from({length:7},(_,i)=>loadImage(path.join(root,`qa/build/save-${String(i+1).padStart(2,'0')}.png`))));
assets.addFrames = await Promise.all(Array.from({length:12},(_,i)=>loadImage(path.join(root,`qa/build/add-${String(i+1).padStart(2,'0')}.png`))));
assets.fullDay = await loadImage(path.join(root,'assets/context/own-meal.png'));
assets.fullMenu = await loadImage(path.join(root,'assets/context/favorite-save-actions.png'));
assets.fullAdded = await loadImage(path.join(root,'assets/context/favorite-added-day.png'));
assets.fullFavorites = await loadImage(path.join(root,'assets/context/favorite-list.png'));
let actualTime=0;
const C = {ink:'#0B2130',teal:'#155E75',mint:'#DDF3EA',lime:'#CBEF85',white:'#F8FCF9',cyan:'#6ED5E0'};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const progress=(t,a,b)=>clamp((t-a)/(b-a));
const smooth=t=>t*t*(3-2*t);
const out=t=>1-(1-t)**3;
const inout=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
const window=(t,a,b,d=.22)=>smooth(progress(t,a,a+d))*(1-smooth(progress(t,b-d,b)));
const y=f=>H*f;
const breathe=t=>Math.sin(t*1.5);
function rounded(x,z,w,h,r) {ctx.beginPath();ctx.roundRect(x,z,w,h,r);}
function shadow(x,z,w,h,opacity=.3) {
  const g=ctx.createRadialGradient(x,z,0,x,z,w/2);g.addColorStop(0,`rgba(0,0,0,${opacity})`);g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.save();ctx.translate(x,z);ctx.scale(1,h/w);ctx.fillStyle=g;ctx.fillRect(-w/2,-w/2,w,w);ctx.restore();
}
function backdrop(t,light=0) {
  const a=clamp(light);ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(500+120*Math.sin(t*.52),y(.51),30,540,y(.50),1100);
  g.addColorStop(0,'#176278');g.addColorStop(.55,'#113C50');g.addColorStop(1,'#071823');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // A continuously moving studio light and orbit. No slideshow backgrounds.
  ctx.save();ctx.globalAlpha=.14*(1-a);ctx.translate(550,y(.52));ctx.rotate(-.30+t*.055);
  ctx.strokeStyle=C.cyan;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,640,790,0,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,595,750,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  if(a>0){ctx.globalAlpha=a;const l=ctx.createLinearGradient(0,0,W,H);l.addColorStop(0,'#E8F4DD');l.addColorStop(.6,'#DDF3EA');l.addColorStop(1,'#BFE6DD');ctx.fillStyle=l;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
  // Small restrained studio flecks in depth; motion stays slow behind readable UI.
  ctx.save();ctx.globalAlpha=.16*(1-a);ctx.fillStyle='#BFE4DE';
  for(let i=0;i<24;i++){const px=(i*193+40*Math.sin(t*.25+i))%W;const py=(i*337+t*(7+i%4))%H;ctx.beginPath();ctx.arc(px,py,1.4+(i%3)*.6,0,Math.PI*2);ctx.fill();}ctx.restore();
}
function type(text,x,z,size,{color=C.white,align='center',alpha=1,max=980,rotate=0}={}) {
  if(alpha<=0)return;ctx.save();ctx.globalAlpha=clamp(alpha);ctx.translate(x,z);ctx.rotate(rotate);
  ctx.font=`700 ${size}px "Avenir Next Condensed"`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;
  ctx.fillText(text,0,0,max);ctx.restore();
}
function body(text,x,z,size,{color=C.white,align='center',alpha=1,max=950,weight=700}={}) {
  if(alpha<=0)return;ctx.save();ctx.globalAlpha=clamp(alpha);ctx.font=`${weight} ${size}px "Avenir Next"`;
  ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(text,x,z,max);ctx.restore();
}
function brand(z,alpha=1,size=65,color=C.white) {
  ctx.save();ctx.globalAlpha=alpha;ctx.font=`700 ${size}px "Avenir Next"`;ctx.textBaseline='middle';ctx.textAlign='left';
  const tw=ctx.measureText('diecik').width;const iw=size*.88;const bx=(W-tw-iw-17)/2;
  ctx.save();rounded(bx,z-iw/2,iw,iw,iw*.24);ctx.clip();ctx.drawImage(assets.icon,bx,z-iw/2,iw,iw);ctx.restore();
  ctx.fillStyle=color;ctx.fillText('diecik',bx+iw+17,z+2);ctx.restore();
}
function food(x,z,w,t,{rotation=0,alpha=1,tilt=0,shadowStrength=.28}={}) {
  if(alpha<=0)return;const h=w*(assets.food.height/assets.food.width);
  shadow(x,z+h*.45,w*.91,w*.19,shadowStrength*alpha);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,z);ctx.rotate(rotation);ctx.scale(1,1-tilt*.14);
  ctx.shadowColor='rgba(0,0,0,.17)';ctx.shadowBlur=w*.027;ctx.shadowOffsetY=w*.03;
  ctx.drawImage(assets.food,-w/2,-h/2,w,h);ctx.restore();
}
function ui(img,x,z,w,{rotation=0,alpha=1,scaleY=1,radius=30,fill=true}={}) {
  if(alpha<=0)return;const h=w*img.height/img.width;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,z);ctx.rotate(rotation);ctx.scale(1,scaleY);
  if(fill){ctx.shadowColor='rgba(0,12,20,.30)';ctx.shadowBlur=45;ctx.shadowOffsetY=26;ctx.fillStyle='white';rounded(-w/2,-h/2,w,h,radius);ctx.fill();ctx.shadowColor='transparent';}
  rounded(-w/2,-h/2,w,h,radius);ctx.clip();ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
}
// A textured 3D surface, projected into a single camera. The texture remains the
// original app capture. This changes the camera, never the UI content.
function projected(img,x,z,w,{rx=0,ry=0,rz=0,alpha=1}={}) {
  if(alpha<=0)return;const h=w*img.height/img.width,focus=1600;
  const point=(u,v,depth=0)=>{
    const a=(u-.5)*w,b=(v-.5)*h;
    const b1=b*Math.cos(rx)-depth*Math.sin(rx),c1=b*Math.sin(rx)+depth*Math.cos(rx);
    const a2=a*Math.cos(ry)+c1*Math.sin(ry),c2=-a*Math.sin(ry)+c1*Math.cos(ry);
    const a3=a2*Math.cos(rz)-b1*Math.sin(rz),b3=a2*Math.sin(rz)+b1*Math.cos(rz);
    const q=focus/(focus+c2);return [x+a3*q,z+b3*q];
  };
  const corners=[[0,0],[1,0],[1,1],[0,1]].map(p=>point(...p));
  ctx.save();ctx.globalAlpha=alpha;ctx.shadowColor='rgba(0,12,20,.38)';ctx.shadowBlur=45;ctx.shadowOffsetY=25;
  ctx.fillStyle='#A9CEC6';ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p[0]+3,p[1]+9):ctx.moveTo(p[0]+3,p[1]+9));ctx.closePath();ctx.fill();ctx.shadowColor='transparent';
  const nx=6,ny=4;
  function triangle(s,d) {
    const [s0,s1,s2]=s,[d0,d1,d2]=d;
    const x0=s0[0],y0=s0[1],x1=s1[0],y1=s1[1],x2=s2[0],y2=s2[1];
    const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
    const a=(d0[0]*(y1-y2)+d1[0]*(y2-y0)+d2[0]*(y0-y1))/det;
    const c=(d0[0]*(x2-x1)+d1[0]*(x0-x2)+d2[0]*(x1-x0))/det;
    const e=(d0[0]*(x1*y2-x2*y1)+d1[0]*(x2*y0-x0*y2)+d2[0]*(x0*y1-x1*y0))/det;
    const b=(d0[1]*(y1-y2)+d1[1]*(y2-y0)+d2[1]*(y0-y1))/det;
    const d1m=(d0[1]*(x2-x1)+d1[1]*(x0-x2)+d2[1]*(x1-x0))/det;
    const f=(d0[1]*(x1*y2-x2*y1)+d1[1]*(x2*y0-x0*y2)+d2[1]*(x0*y1-x1*y0))/det;
    const mx=(d0[0]+d1[0]+d2[0])/3,my=(d0[1]+d1[1]+d2[1])/3;
    const expand=p=>{const dx=p[0]-mx,dy=p[1]-my,l=Math.hypot(dx,dy);return[p[0]+dx/l*.55,p[1]+dy/l*.55];};
    ctx.save();ctx.beginPath();ctx.moveTo(...expand(d0));ctx.lineTo(...expand(d1));ctx.lineTo(...expand(d2));ctx.closePath();ctx.clip();ctx.setTransform(a,b,c,d1m,e,f);ctx.drawImage(img,0,0);ctx.restore();
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const uv=[[i/nx,j/ny],[(i+1)/nx,j/ny],[(i+1)/nx,(j+1)/ny],[i/nx,(j+1)/ny]];
    const src=uv.map(([u,v])=>[u*img.width,v*img.height]);const dst=uv.map(p=>point(...p));
    triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle([src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
  }
  ctx.restore();
}
function phoneLens(img,detail,p,{x=540,z=y(.50),width=700,rotation=0,alpha=1}={}) {
  const sx=lerp(0,detail.left,p),sy=lerp(0,detail.top,p);
  const sw=lerp(img.width,detail.width,p),sh=lerp(img.height,detail.height,p);
  const dw=lerp(width,detail.displayWidth,p),dh=dw*sh/sw;
  const zz=lerp(z,detail.displayY,p),r=lerp(58,33,p),rim=14*(1-p);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,zz);ctx.rotate(rotation);
  ctx.shadowColor='rgba(0,10,20,.34)';ctx.shadowBlur=42;ctx.shadowOffsetY=24;
  const g=ctx.createLinearGradient(-dw/2,0,dw/2,0);g.addColorStop(0,'#062B3A');g.addColorStop(.35,'#B2CBCE');g.addColorStop(1,'#092735');
  ctx.fillStyle=g;rounded(-dw/2-rim,-dh/2-rim,dw+2*rim,dh+2*rim,r+rim);ctx.fill();ctx.shadowColor='transparent';
  ctx.save();rounded(-dw/2,-dh/2,dw,dh,r);ctx.clip();ctx.drawImage(img,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);ctx.restore();
  ctx.strokeStyle=`rgba(232,255,251,${.25*(1-p)})`;ctx.lineWidth=3;rounded(-dw/2-rim+2,-dh/2-rim+2,dw+2*rim-4,dh+2*rim-4,r+rim);ctx.stroke();ctx.restore();
}
function firstPhoneContext(t) {
  if(t<1.15||t>=3.08)return;
  const enter=out(progress(t,1.15,1.42)),zoom=inout(progress(t,2.60,3.08));
  const img=t<2.30?assets.fullDay:assets.fullMenu;
  const width=H===1350?480:700;
  const detail={left:44,top:1908,width:1118,height:150,displayWidth:1050,displayY:y(.302)};
  phoneLens(img,detail,zoom,{x:540+1250*(1-enter),width,rotation:-.045*(1-zoom)+.01*Math.sin(t*2)*(1-zoom),alpha:enter});
}
function resultPhoneContext(t) {
  const zoom=t<8.15?1-out(progress(t,7.85,8.15)):inout(progress(t,9.35,9.85));
  backdrop(timeWarp(t),1);
  food(1050,y(.80),H===1350?720:980,t,{rotation:.1,alpha:.50,shadowStrength:.15});
  const detail={left:46,top:704,width:1114,height:696,displayWidth:1030,displayY:y(.47)};
  phoneLens(assets.fullAdded,detail,zoom,{width:H===1350?480:700,rotation:.02*(1-zoom)*Math.sin(t)});
}
const cardTextures=Array.from({length:13},(_,i)=>{
  const c=createCanvas(1118,640),g=c.getContext('2d');g.beginPath();g.roundRect(0,0,1118,640,40);g.clip();g.drawImage(assets.card,0,0);
  if(i<12)g.drawImage(assets.addFrames[i],42,484,1038,172);return c;
});
function heart(x,z,size,{alpha=1,rotation=0,filled=true}={}) {
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,z);ctx.rotate(rotation);ctx.scale(size/100,size/100);
  ctx.beginPath();ctx.moveTo(0,38);ctx.bezierCurveTo(-62,-4,-42,-48,-14,-31);ctx.bezierCurveTo(-5,-26,0,-20,0,-17);
  ctx.bezierCurveTo(0,-20,5,-26,14,-31);ctx.bezierCurveTo(42,-48,62,-4,0,38);
  ctx.fillStyle=C.lime;ctx.strokeStyle=C.lime;ctx.lineWidth=6;filled?ctx.fill():ctx.stroke();ctx.restore();
}
function pulse(x,z,t,start,scale=1,color=C.lime) {
  const p=progress(t,start,start+.46);if(t<start||p>=1)return;
  ctx.save();ctx.globalAlpha=(1-p)*.88;ctx.strokeStyle=color;ctx.lineWidth=5*(1-p);ctx.beginPath();ctx.arc(x,z,(24+85*out(p))*scale,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=(1-p)*.7;ctx.fillStyle='white';ctx.beginPath();ctx.arc(x,z,(12+6*p)*scale,0,Math.PI*2);ctx.fill();ctx.restore();
}
function saveTexture(t) {
  const local=t-(2.8125-2/30);
  if(local>=0&&local<7/30)return assets.saveFrames[Math.floor(local*30)];
  return assets.save;
}
function addTexture(t) {
  const local=t-(8.90625-.30);
  if(local>=0&&local<12/30)return assets.addFrames[Math.floor(local*30)];
  return assets.add;
}
function favoriteCard(x,z,w,t,{rotation=0,alpha=1,press=false,rx=0,ry=0}={}) {
  const local=t-(8.90625-.30);
  const img=press&&local>=0&&local<.4?cardTextures[Math.floor(local*30)]:cardTextures[12];
  if(Math.abs(rx)+Math.abs(ry)>.002){projected(img,x,z,w,{rx,ry,rz:rotation,alpha});return;}
  const h=w*640/1118;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,z);ctx.rotate(rotation);
  // Soft extrusion and a highlight make the recorded UI behave as a physical surface.
  ctx.fillStyle='#AACEC6';ctx.shadowColor='rgba(0,10,25,.34)';ctx.shadowBlur=48;ctx.shadowOffsetY=26;
  rounded(-w/2+3,-h/2+7,w,h,40);ctx.fill();ctx.shadowColor='transparent';
  rounded(-w/2,-h/2,w,h,40);ctx.clip();ctx.drawImage(assets.card,-w/2,-h/2,w,h);
  if(press){const s=w/1118;ctx.drawImage(addTexture(t),-w/2+42*s,-h/2+484*s,1038*s,172*s);}
  ctx.restore();
}
function calendar(x,z,w,t,alpha=1) {
  const flip=inout(progress(t,5.88,6.16));const h=w*.74;
  const label=flip<.5?'DZISIAJ':'JUTRO';const sy=Math.max(.045,Math.abs(Math.cos(flip*Math.PI)));
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,z);ctx.rotate(lerp(-.10,.06,out(progress(t,5.625,7.3))));
  ctx.shadowColor='rgba(0,10,25,.22)';ctx.shadowBlur=38;ctx.shadowOffsetY=25;ctx.fillStyle='#B5D6CC';rounded(-w/2+3,-h/2+12,w,h,32);ctx.fill();
  ctx.shadowColor='transparent';ctx.fillStyle='#FAFFFA';rounded(-w/2,-h/2,w,h,32);ctx.fill();
  ctx.fillStyle=C.teal;rounded(-w/2,-h/2,w,65,30);ctx.fill();ctx.fillRect(-w/2,-h/2+31,w,36);
  for(const dx of [-w*.28,w*.28]){ctx.strokeStyle='#CED9D8';ctx.lineWidth=16;ctx.beginPath();ctx.moveTo(dx,-h/2-17);ctx.lineTo(dx,-h/2+34);ctx.stroke();}
  ctx.save();ctx.translate(0,30);ctx.scale(1,sy);type(label,0,22,w*.22,{color:C.ink,max:w*.85});ctx.restore();
  ctx.restore();
}
function actionCTA(t,start=13.125) {
  const p=out(progress(t,start,start+.34));
  const cy=y(H===1350?.79:.736)+80*(1-p);const cw=850,ch=H===1350?112:130;
  ctx.save();ctx.globalAlpha=p;ctx.shadowColor='rgba(0,0,0,.23)';ctx.shadowBlur=28;ctx.shadowOffsetY=16;
  ctx.fillStyle=C.lime;rounded((W-cw)/2,cy-ch/2,cw,ch,30);ctx.fill();ctx.shadowColor='transparent';
  body('Wypróbuj za darmo',W/2-16,cy+18,H===1350?48:52,{color:C.ink,max:720,alpha:p});
  ctx.strokeStyle=C.ink;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(890,cy-15);ctx.lineTo(907,cy);ctx.lineTo(890,cy+15);ctx.stroke();ctx.restore();
  body('diecik.com',540,y(H===1350?.706:.676),42,{alpha:p});
  body('3 ulubione za darmo · Premium bez limitu',540,y(H===1350?.894:.817),40,{alpha:p,max:948,weight:700});
}
function hero(t) {
  const light=window(t,3.66,11.10,.32);
  backdrop(t,light);
  const ink=light>.5?C.ink:C.white;

  if(t<2.23){
    const enter=out(progress(t,.02,.74));const depart=inout(progress(t,1.75,2.23));
    const ty=y(.262)-170*depart;
    const ta=smooth(progress(t,.15,.40))*(1-depart);
    if(variant==='B'){
      type('LUBISZ',540,ty,H===1350?170:210,{alpha:ta});
      type('TEN SMAK?',540,ty+y(.105),H===1350?155:193,{alpha:ta,color:C.lime});
    }else{
      type('JESZCZE',540,ty,H===1350?175:220,{alpha:ta});
      type('RAZ?',540,ty+y(.098),H===1350?190:232,{alpha:ta,color:C.lime});
    }
    const w=lerp(3200,H===1350?1020:1200,enter)+55*Math.sin(t*1.35);
    const x=600-190*Math.sin(t*1.5);
    const tx=360+38*Math.sin(t*2),tz=y(.625),tw=H===1350?1080:1320;
    food(lerp(x,tx,depart),lerp(lerp(y(.54),y(H===1350?.74:.67),enter),tz,depart),lerp(w,tw,depart),t,
      {rotation:lerp(lerp(-.24,.027,enter)+.025*breathe(t),-.14+.055*breathe(t),depart),tilt:.5*(1-enter)});
  }
  if(t>=1.75&&t<4.16){
    const enter=inout(progress(t,1.75,2.23));const leave=inout(progress(t,3.60,4.16));
    const fw=H===1350?1080:1320;
    if(t>=2.23&&t<3.60)food(360+38*Math.sin(t*2),y(.625),fw,t,{rotation:-.14+.055*breathe(t)});
    const sw=1050;const sz=y(.302)+220*(1-enter)-90*leave;
    if(actualTime>=3.08)ui(saveTexture(t),540,sz,sw,{alpha:enter*(1-leave),rotation:.07*(1-enter),radius:33});
    pulse(861,sz,t,2.8125,.97);
    if(t>=2.8125){const hp=out(progress(t,2.8125,3.11));
      heart(815+30*hp,y(.66)-65*hp,300*hp,{alpha:(1-leave),rotation:.17*hp});
      ctx.save();ctx.globalAlpha=hp*(1-leave);ctx.fillStyle=C.ink;rounded(657,y(.775)-62,296,89,30);ctx.fill();ctx.restore();
      body('Zapisane',805,y(.775),55,{alpha:hp*(1-leave),color:C.lime});}
  }
  if(t>=3.60&&t<5.95){
    const enter=inout(progress(t,3.60,4.16));const leave=inout(progress(t,5.55,5.95));
    const dolly=smooth(progress(t,4.16,5.55));
    const cx=lerp(1420,540,enter)-1250*leave+38*Math.sin(t*1.6);const cz=y(.535)+28*Math.sin((t-3.6)*1.0)-75*dolly;
    const pw=lerp(H===1350?970:1010,H===1350?1060:1140,dolly);
    projected(assets.panel,cx,cz,pw,{alpha:enter,rz:lerp(.24,-.045,enter)-.12*leave,rx:.04,ry:-.16+Math.sin(t*1.5)*.09});
    // The food moves continuously into the real recorded photo position.
    if(enter<1){const s=pw/1118;food(lerp(360+38*Math.sin(t*2),cx-pw/2+142*s,enter),lerp(y(.625),cz-(pw*1188/1118)/2+681*s,enter),lerp(H===1350?1080:1320,154*s,enter),t,{alpha:1,rotation:(-.14+.055*breathe(t))*(1-enter),shadowStrength:.15});}
  }
  if(t>=5.55&&t<6.50){
    const enter=inout(progress(t,5.55,5.87));const leave=inout(progress(t,6.15,6.50));
    calendar(540+1450*(1-enter)-1700*leave,y(.48),lerp(1600,1250,enter),t,enter*(1-leave));
    food(800+1400*(1-enter)-1500*leave,y(.92),H===1350?710:920,t,{alpha:enter*(1-leave),rotation:.1-.18*leave});
  }
  if(t>=6.23&&t<9.65){
    const enter=out(progress(t,6.23,6.60));const leave=inout(progress(t,9.30,9.65));
    const land=inout(progress(t,6.65,8.50));
    // Camera lands close to the action: no additional instruction headline.
    const labelReady=H===1350?smooth(progress(land,.96,1)):smooth(progress(t,7.45,7.75));
    body('Jutro. Ten sam smak.',84+1050*(1-enter)-1100*leave,y(.21),H===1350?48:58,{alpha:enter*(1-leave)*labelReady,color:C.ink,align:'left'});
    const cx=540+1150*(1-enter)+180*(1-land);const cz=y(.45)-45*leave-160*(1-land);
    const cw=lerp(1680,1050,land);
    if(H===1350)food(732,y(.87),620,t,{alpha:enter*(1-leave),rotation:-.08+.03*breathe(t),shadowStrength:.15});
    favoriteCard(cx,cz,cw,t,{alpha:enter*(1-leave),rotation:.20*(1-land),press:true,rx:.12*(1-land),ry:.32*(1-land)});
    if(H!==1350)food(732,y(.835),820,t,{alpha:enter*(1-leave),rotation:-.08+.03*breathe(t),shadowStrength:.15});
    const sy=cw/1118;const by=cz-cw*640/1118/2+(484+86)*sy;
    pulse(840,by,t,8.90625,.98,C.teal);
  }
  if(t>=9.30&&t<11.10){
    const enter=inout(progress(t,9.30,9.65));const leave=inout(progress(t,10.60,11.10));
    const rw=1030,rz=y(.47)+180*(1-enter);
    ui(assets.result,540,rz,rw,{alpha:enter*(1-leave),rotation:.04*(1-enter),radius:38});
    if(t>9.64){const p=out(progress(t,9.64,9.91));
      ctx.save();ctx.globalAlpha=p*(1-leave);ctx.fillStyle=C.teal;ctx.beginPath();ctx.arc(845,y(.745),60,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=9;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(818,y(.745));ctx.lineTo(838,y(.745)+18);ctx.lineTo(874,y(.745)-23);ctx.stroke();ctx.restore();
      body('Ponownie dodane',540,y(.84),H===1350?47:57,{alpha:p*(1-leave),color:C.teal});}
    if(leave>0){const s=rw/1114;const thumbx=540-rw/2+123*s;const thumby=rz-rw*696/1114/2+377*s;
      food(lerp(thumbx,540+50*Math.sin(t*1.1),leave),lerp(thumby,y(.58)+18*breathe(t),leave),lerp(154*s,H===1350?780:990,leave),t,
        {alpha:Math.min(1,leave*12),rotation:(.08+Math.sin(t*.8)*.05)*leave});}
  }
  if(t>=10.60){
    const enter=inout(progress(t,10.60,11.10));const end=out(progress(t,12.50,13.00));
    const callback=enter===1?1:0;
    type('JESZCZE',540-1100*end,y(.245),H===1350?160:190,{alpha:callback*(1-end)});
    type('RAZ.',540-1100*end,y(.347),H===1350?172:210,{alpha:callback*(1-end),color:C.lime});
    const fw=lerp(H===1350?780:990,H===1350?520:770,end);
    if(enter===1)food(540+50*Math.sin(t*1.1),lerp(y(.58),y(H===1350?.508:.48),end)+18*breathe(t),fw,t,{alpha:1,rotation:.08+Math.sin(t*.8)*.05});
    brand(y(.235)-80*(1-end),end,H===1350?78:86);
    body('Ulubione posiłki. Twoje smaki.',540,y(H===1350?.318:.283),H===1350?39:43,{alpha:end});
    actionCTA(t,12.60);
  }
}
function bumper(t) {
  backdrop(t,window(t,2.9,4.0,.2));
  const intro=out(progress(t,0,.48));
  if(t<1.23){const leave=inout(progress(t,1.0,1.23));
    type('JESZCZE RAZ?',540,y(.26),H===1350?150:180,{alpha:intro*(1-leave),color:C.lime});
    food(510-800*leave,y(.67),lerp(3200,H===1350?1010:1200,intro),t,{rotation:-.16+.10*intro,alpha:1-leave});}
  if(t>=1.0&&t<2.65){const e=out(progress(t,1.0,1.23)),p=inout(progress(t,2.1,2.65));
    phoneLens(assets.fullFavorites,{left:42,top:756,width:1118,height:640,displayWidth:1050,displayY:y(.46)},p,
      {x:540+1200*(1-e),width:H===1350?480:700,rotation:-.04*(1-p),alpha:e});}
  if(t>=2.65&&t<3.2){const tt=8.90625+(t-2.8125);
    favoriteCard(540,y(.46),1050,tt,{press:true});
    pulse(840,y(.46)-1050*640/1118/2+570*1050/1118,t,2.8125,1.0,C.lime);}
  if(t>=3.2&&t<3.92){ui(assets.result,540,y(.47),1030,{radius:38});}
  if(t>=3.92){const e=out(progress(t,3.92,4.2));
    food(540+35*Math.sin(t*1.4),y(H===1350?.508:.48),H===1350?520:770,t,{alpha:e,rotation:.06+.035*breathe(t)});
    brand(y(.235),e,H===1350?78:86);body('Twoje smaki. Pod ręką.',540,y(H===1350?.318:.283),43,{alpha:e});actionCTA(t,4.0);}
}
function timeWarp(t) {
  // Editing follows the story and the real actions, not eight identical slides.
  const knots=[[0,0],[1.15,1.75],[1.42,2.23],[2.60,2.23],[3.28125,2.8125],
    [3.65,3.60],[4.22,5.55],[4.67,6.23],[7.50,8.90625],[7.94,9.30],
    [9.35,9.65],[10.20,10.60],[10.825,11.10],[11.75,12.50],
    [12.1875,12.60],[12.5625,13.0],[15,15]];
  for(let i=1;i<knots.length;i++)if(t<=knots[i][0]){
    const [a,u]=knots[i-1],[b,v]=knots[i];return lerp(u,v,(t-a)/(b-a));}
  return 15;
}
function frame(t){
  actualTime=t;ctx.clearRect(0,0,W,H);
  if(mode==='bumper'){bumper(t);return;}
  if(t>=7.85&&t<9.85){resultPhoneContext(t);return;}
  hero(timeWarp(t));firstPhoneContext(t);
}

const basename=`diecik-ulubione-${variant.toLowerCase()}-${duration}s-${format}`;
await fs.mkdir(path.join(root,'podglad'),{recursive:true});
await fs.mkdir(path.join(root,'filmy'),{recursive:true});
if(preview){
  const times=duration===15?[0,.20,.65,1.0,1.6,2.36,2.9,3.3,3.85,4.42,5.4,6.5,7.53,8.4,9.75,10.95,12.8,14.5]:[.4,1.0,2.25,3.10,4.0,5.2];
  for(let i=0;i<times.length;i++){frame(times[i]);await fs.writeFile(path.join(root,`podglad/${basename}-${String(i+1).padStart(2,'0')}.png`),canvas.toBuffer('image/png'));}
  console.log(`Preview: ${times.length} frames (${W}×${H}).`);
  await fs.writeFile(path.join(root,`podglad/${basename}-times.json`),JSON.stringify(times));
}else{
  const outpath=path.join(root,`filmy/${basename}.mp4`);
  const args=['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0',
    '-i',path.join(root,mode==='bumper'?'audio/diecik-ulubione-v2-music-15s-128bpm.wav':'audio/diecik-ulubione-v2-mix-15s-128bpm.wav'),
    '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-r',String(FPS),'-g','30',
    '-c:a','aac','-b:a','192k','-ar','48000','-t',String(duration),'-movflags','+faststart',
    ...(mode==='bumper'?['-af','afade=t=out:st=5.7:d=0.3']:[]),outpath];
  const ff=spawn(ffmpeg,args,{stdio:['pipe','ignore','pipe']});
  let errors='';ff.stderr.on('data',d=>{errors+=d;});
  const completion=once(ff,'close');
  ff.stdin.on('error',e=>{console.error('Encoder stdin:',e.message);});
  const start=Date.now();
  for(let n=0;n<duration*FPS;n++){
    frame(n/FPS);const rgba=ctx.getImageData(0,0,W,H).data;
    if(!ff.stdin.write(Buffer.from(rgba.buffer,rgba.byteOffset,rgba.byteLength))) await once(ff.stdin,'drain');
    if(n%75===0)console.log(`${basename}: ${n}/${duration*FPS} frames (${((Date.now()-start)/1000).toFixed(1)} s)`);
  }
  ff.stdin.end();const [code]=await completion;if(code!==0)throw new Error(errors);
  console.log(`Saved ${outpath} in ${((Date.now()-start)/1000).toFixed(1)} s.`);
  if(errors)console.log(errors.slice(-1000));
}
