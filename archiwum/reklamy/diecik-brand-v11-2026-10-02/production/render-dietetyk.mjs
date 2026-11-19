import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const req=createRequire(import.meta.url);
const {createCanvas,loadImage}=req('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const W=1080,H=1920,FPS=30,DURATION=20;
const audience=process.argv[2]??'dietetyk';
if(audience!=='dietetyk')throw new Error('This renderer produces the v11 dietitian film only');
const c=createCanvas(W,H),ctx=c.getContext('2d');
const sourcePhone='assets/client-plan-full-before.png';
const image=await loadImage(path.join(root,sourcePhone));
const icon=await loadImage(path.join(root,'assets/diecik-icon.png'));
const C={cream:'#F6F5EF',pine:'#153630',lime:'#DAF2A5',mint:'#E3F0DD'};
const stem='Diecik-dietetyk-Reels-Stories-20s';
for(const d of ['filmy','okladki','podglad','qa'])await fs.mkdir(path.join(root,d),{recursive:true});

function smooth(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
function round(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function text(value,x,y,size,{weight=600,color=C.cream,align='left',serif=false,alpha=1}={}){
  ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.font=`${weight} ${size}px "${serif?'Baskerville':'Avenir Next'}"`;
  const width=ctx.measureText(value).width;
  if(width>920)throw new Error(`Text exceeds safe width: ${value} (${width})`);
  ctx.fillText(value,x,y);ctx.restore();
}
function brand(x,y,size,{color=C.cream,alpha=1,center=false}={}){
  ctx.save();ctx.globalAlpha*=alpha;
  const iconSize=size*0.93,gap=size*0.19;ctx.font=`700 ${size}px "Avenir Next"`;
  const word=ctx.measureText('Diecik').width,start=center?x-(word+iconSize+gap)/2:x;
  ctx.drawImage(icon,start,y-iconSize/2,iconSize,iconSize);
  ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText('Diecik',start+iconSize+gap,y+size*0.035);ctx.restore();
}
function lowerShade(alpha=0.74){
  const g=ctx.createLinearGradient(0,380,0,1440);g.addColorStop(0,'rgba(10,25,21,0)');
  g.addColorStop(.53,`rgba(10,25,21,${alpha*.7})`);g.addColorStop(1,`rgba(10,25,21,${alpha})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function topShade(){
  const g=ctx.createLinearGradient(0,0,0,550);g.addColorStop(0,'rgba(10,25,21,.5)');g.addColorStop(1,'rgba(10,25,21,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,550);
}
function openingShade(){
  const g=ctx.createLinearGradient(0,180,0,1080);g.addColorStop(0,'rgba(10,25,21,.62)');
  g.addColorStop(.6,'rgba(10,25,21,.40)');g.addColorStop(1,'rgba(10,25,21,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,1080);
}
function draw(t){
  ctx.clearRect(0,0,W,H);
  if(t<7){
    topShade();if(t<4)openingShade();brand(88,322,47);
    if(t<4){
      const a=smooth((t-.12)/.32),dy=(1-a)*18;
      text('Dietetyku,',90,420+dy,43,{weight:600,alpha:a,color:C.lime});
      const lines=['dieta nie','kończy się','w gabinecie.'];
      for(let i=0;i<lines.length;i++)text(lines[i],86,540+110*i+dy,106,{weight:400,serif:true,alpha:a});
    }
  }else if(t<11){
    ctx.fillStyle='rgba(10,25,21,.58)';ctx.fillRect(0,0,W,H);
    const a=smooth((t-7)/.25),dy=(1-a)*26;
    text('Dieta dla podopiecznego.',540,330,70,{align:'center',weight:600,alpha:a});
    ctx.save();ctx.globalAlpha=a;
    // One complete authentic phone screen, at a fixed size; no mock interface or UI callout.
    const height=1380,width=height*image.width/image.height,x=(W-width)/2,y=420+dy;
    ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=70;ctx.shadowOffsetY=25;
    ctx.fillStyle='#16221D';round(x-11,y-11,width+22,height+22,75);ctx.fill();
    ctx.shadowColor='transparent';round(x,y,width,height,64);ctx.clip();
    ctx.drawImage(image,x,y,width,height);ctx.restore();
  }else if(t<16){
    topShade();brand(88,322,47);lowerShade(.8);
    const a=smooth((t-11)/.26),dy=(1-a)*18;
    text('Zalecaj ruch.',88,948+dy,99,{serif:true,weight:400,alpha:a});
    text('Wspieraj szerzej.',88,1066+dy,99,{serif:true,weight:400,alpha:a});
  }else{
    const a=smooth((t-16)/.28);ctx.save();ctx.globalAlpha=a;
    ctx.fillStyle=C.pine;ctx.fillRect(0,0,W,H);
    // A restrained moving light field gives the final brand card depth.
    const light=ctx.createRadialGradient(820+Math.sin(t*.7)*30,370,0,820,370,980);
    light.addColorStop(0,'rgba(130,186,137,.18)');light.addColorStop(1,'rgba(130,186,137,0)');
    ctx.fillStyle=light;ctx.fillRect(0,0,W,H);
    const dy=(1-a)*20;
    text('DLA DIETETYKÓW',540,360+dy,37,{align:'center',color:C.lime,weight:600});
    brand(540,565+dy,147,{center:true});
    text('Więcej niż jadłospis.',540,755+dy,63,{align:'center',weight:600,color:C.cream});
    text('Zalecaj ruch podopiecznym.',540,830+dy,44,{align:'center',weight:500,color:C.mint});
    text('Wyróżnij swoją ofertę.',540,890+dy,44,{align:'center',weight:500,color:C.mint});
    ctx.fillStyle=C.lime;round(130,950+dy,820,136,28);ctx.fill();
    text('Zacznij bezpłatnie',540,1018+dy,58,{align:'center',color:C.pine,weight:700});
    text('Do 2 aktywnych klientów',540,1130+dy,43,{align:'center',color:C.mint,weight:500});
    text('Diecik.com/specjalista',540,1186+dy,43,{align:'center',weight:600});
    ctx.restore();
  }
}

const temp=path.join(root,'qa/work',audience,`${stem}.tmp.mp4`),output=path.join(root,'filmy',`${stem}.mp4`);
const p=spawn(ffmpeg,['-hide_banner','-loglevel','warning','-y',
  '-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0',
  '-i',path.join(root,'qa/work',audience,'film-background.mp4'),'-i',path.join(root,'audio/diecik-cinematic-mix-20s.wav'),
  '-filter_complex','[1:v][0:v]overlay=0:0:format=auto,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setsar=1[v]',
  '-map','[v]','-map','2:a:0','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',
  '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-r',String(FPS),'-g','30',
  '-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(DURATION),'-movflags','+faststart',temp
],{stdio:['pipe','ignore','pipe']});
let err='';p.stderr.on('data',d=>err+=d);const closed=once(p,'close');p.stdin.on('error',()=>{});
for(let n=0;n<DURATION*FPS;n++){
  draw(n/FPS);const raw=Buffer.from(ctx.getImageData(0,0,W,H).data);
  if(!p.stdin.write(raw))await Promise.race([once(p.stdin,'drain'),closed.then(([code])=>{throw new Error(`Encoder stopped (${code}): ${err}`);})]);
  if(n%150===0)console.log(`Film v11 ${audience}: ${n}/${DURATION*FPS}`);
}
p.stdin.end();const[code]=await closed;if(code)throw new Error(err);
await fs.rename(temp,output);
await fs.writeFile(path.join(root,`qa/render-${audience}.json`),JSON.stringify({file:path.relative(root,output),audience,duration:DURATION,width:W,height:H,fps:FPS,concept:'Dieta nie kończy się w gabinecie — zalecaj także codzienny ruch',scenes:{professional_with_authentic_panel:[0,4],context:[4,7],product:[7,11],benefit:[11,16],cta:[16,20]},opening_caption_moved_up:true,phone:{source:sourcePhone,full:true,fixed:true,no_ui_modification:true,height:1380,start:7,end:11,meaning:'published diet from specialist',private_workout_source_excluded:true},opening_panel_meaning:'approved v8 authentic diet editor',opening_restored_from_v8:true,gym_removed:true,same_plan_handoff_verified:false,stock_is_illustrative:true,fictional_testimonials:false,voiceover:false,external_demo_label:false,arrows:false,cursors:false,steps:false},null,2)+'\n');
console.log(`Ready: ${output}`);
