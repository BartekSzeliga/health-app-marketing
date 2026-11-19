import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const {createCanvas, loadImage, GlobalFonts} = require('/Users/bartoszszeliga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(root, '../../..');
const args = process.argv.slice(2);
const representative = args.includes('--representative');
const only = args.includes('--only') ? args[args.indexOf('--only')+1] : null;
if(only&&!['recipes','diet','training','favorites'].includes(only))throw new Error(`Unknown native selection: ${only}`);
const formats = representative ? ['square'] : ['square', 'portrait'];
const C = {pine:'#153630', pineLight:'#274E43', cream:'#F6F5EF', lime:'#DAF2A5', mint:'#E3F0DD', ink:'#18372F', muted:'#53645A'};
if (!GlobalFonts.has('Avenir Next') || !GlobalFonts.has('Baskerville')) throw new Error('Required reference typefaces are unavailable');

const concepts = [
  {id:'01-Przepisy', native:'recipes', headline:['Co dziś','zjeść?'],
    benefit:['Otwórz przepisy.','Wybierz swój posiłek.'], feature:'Pomysł na jedzenie', carousel:['Pomysł','na posiłek.'], carouselBody:['Przepisy, do których','chce się wracać.']},
  {id:'02-Kalorie-makro', native:'diet', headline:['Co ma','Twój plan?'],
    benefit:['Kalorie, makro','i mikroskładniki.'], feature:'Kalorie, makro i mikro', carousel:['Twój plan','pod lupą.'], carouselBody:['Kalorie, makro','i mikroskładniki.']},
  {id:'03-Plan-treningu', native:'training', headline:['Co dziś','ćwiczyć?'],
    benefit:['Otwórz swój plan.','Zobacz ćwiczenia.'], feature:'Plan treningu', carousel:['Plan.','Potem ruch.'], carouselBody:['Ćwiczenia i serie','zawsze pod ręką.']},
];
const favorite = {id:'04-Ulubione-posilki', native:'favorites', headline:['Twój smak.','Jeszcze raz.'],
  benefit:['Zapisz posiłek.','Dodaj go ponownie.'], feature:'Ulubione posiłki', carousel:['Twój smak.','Jeszcze raz.'], carouselBody:['Zapisz ulubiony posiłek.','Dodaj go innego dnia.']};
const representativeConcept=only?[...concepts,favorite].find(x=>x.native===only):concepts[0];
const allConcepts = representative ? [representativeConcept] : [...concepts, favorite].filter(x=>!only||x.native===only);
const sourcePaths = {
  icon: path.join(root,'assets/static/diecik-icon.png'),
  recipes: path.join(root,'assets/native/recipes.png'),
  diet: path.join(root,'assets/native/diet.png'),
  dietMicro: path.join(root,'assets/native/diet-micro.png'),
  training: path.join(root,'assets/native/training.png'),
  favorites: path.join(workspace,'marketing/reklamy/ulubione-v3-2026-10-01/assets/context/favorite-list.png'),
};
const images = {icon:await loadImage(sourcePaths.icon)};
const revision1Sources={
  recipes:'f3b0c6a38e36ac32c8ac2a1f1e30f9363e102c881752e7258de321ce2866de3f',
  training:'9eddee53740bafe236692c5f21df160ad9c1b15dabb1ef9f459a415830013e65',
};
for (const kind of new Set(allConcepts.map(x=>x.native))){
  const bytes=await fs.readFile(sourcePaths[kind]);
  if(revision1Sources[kind]&&hash(bytes)===revision1Sources[kind])throw new Error(`Revision 2 requires the new ${kind} source; old revision 1 capture is deliberately rejected`);
  images[kind]=await loadImage(bytes);
}
if(allConcepts.some(x=>x.native==='diet'))images.dietMicro=await loadImage(sourcePaths.dietMicro);
for (const folder of ['assets/static','DO_WGRANIA','podglad/static','qa/static']) await fs.mkdir(path.join(root,folder),{recursive:true});

const checks=[];
const exported=[];
function hash(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function font(size,{weight=500,serif=false,italic=false}={}){return `${italic?'italic ':''}${weight} ${size}px "${serif?'Baskerville':'Avenir Next'}"`;}
function text(ctx,value,x,y,size,{weight=500,serif=false,italic=false,color=C.ink,max=1000,align='left',name=value}={}){
  ctx.save();ctx.font=font(size,{weight,serif,italic});ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;
  const m=ctx.measureText(value);if(m.width>max)throw new Error(`Text overflow: ${value} (${m.width} > ${max})`);
  const left=x-(align==='center'?m.width/2:align==='right'?m.width:0);
  const bbox={name,text:value,left,top:y-m.actualBoundingBoxAscent,right:left+m.width,bottom:y+m.actualBoundingBoxDescent};
  if(bbox.left<55||bbox.right>1385||bbox.top<40||bbox.bottom>ctx.canvas.height-40)throw new Error(`Text outside safe canvas: ${JSON.stringify(bbox)}`);
  checks.push({...bbox,canvasHeight:ctx.canvas.height});ctx.fillText(value,x,y);ctx.restore();
}
function lines(ctx,values,x,y,size,leading,opts={}){values.forEach((v,i)=>text(ctx,v,x,y+i*leading,size,opts));}
function brand(ctx,x,y,{color=C.pine,size=62}={}){
  const icon=78;
  ctx.drawImage(images.icon,x,y-icon*.76,icon,icon);
  text(ctx,'Diecik',x+icon+16,y,size,{weight:700,color,max:350});
}
function background(ctx,H,{carousel=false,index=0}={}){
  ctx.fillStyle=C.cream;ctx.fillRect(0,0,1440,H);
  // The asymmetrical two-field composition presents a question and the actual product.
  const split=carousel?746:744;
  ctx.fillStyle=C.pine;ctx.fillRect(split,0,1440-split,H);
  const light=ctx.createRadialGradient(1150,H*.34,20,1150,H*.40,850);
  light.addColorStop(0,'rgba(112,156,112,.24)');light.addColorStop(1,'rgba(112,156,112,0)');
  ctx.fillStyle=light;ctx.fillRect(split,0,1440-split,H);
  // Quiet curves create depth without competing with real screenshot text.
  ctx.save();ctx.strokeStyle='rgba(218,242,165,.11)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(1215,H*.51,390,690,-.06,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(1215,H*.51,432,734,-.06,0,Math.PI*2);ctx.stroke();ctx.restore();
  if(carousel){
    for(let n=0;n<4;n++){
      ctx.fillStyle=n===index?C.pine:'#D6DDD1';round(ctx,96+n*43,H-88,27,6,3);ctx.fill();
    }
  }
}
function phone(ctx,img,{x,y,height,angle=-.024}={}){
  const width=height*img.width/img.height;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.shadowColor='rgba(0,16,12,.38)';ctx.shadowBlur=65;ctx.shadowOffsetY=28;
  ctx.fillStyle='#071B16';round(ctx,-width/2-12,-height/2-12,width+24,height+24,67);ctx.fill();
  ctx.shadowColor='transparent';ctx.strokeStyle='rgba(227,240,221,.5)';ctx.lineWidth=2;
  round(ctx,-width/2-11,-height/2-11,width+22,height+22,65);ctx.stroke();
  round(ctx,-width/2,-height/2,width,height,55);ctx.clip();
  ctx.drawImage(img,-width/2,-height/2,width,height);ctx.restore();
  return {x,y,height,width,angle,sourceWidth:img.width,sourceHeight:img.height,fullSource:true,nativePixelsRetouched:false};
}
function summaryDetail(ctx,{portrait=false,carousel=false}={}){
  // Two photographic crops preserve genuine native values and labels. The macro
  // crop retains the complete summary heading and all five rows; the larger micro
  // detail shows actual mineral/vitamin rows, without inventing an app card.
  function detail(image,source,crop,{x,y,width,radius=32}){
    const height=width*crop.height/crop.width;
    ctx.save();ctx.shadowColor='rgba(0,15,10,.38)';ctx.shadowBlur=48;ctx.shadowOffsetY=20;ctx.fillStyle='#FFFFFF';
    round(ctx,x,y,width,height,radius);ctx.fill();ctx.shadowColor='transparent';round(ctx,x,y,width,height,radius);ctx.clip();
    ctx.drawImage(image,crop.x,crop.y,crop.width,crop.height,x,y,width,height);ctx.restore();
    return{source,sourceRect:crop,x,y,width,height,framing:'Photographic native detail; no fabricated phone hardware',nativePixelsRetouched:false};
  }
  const macro=detail(images.diet,'assets/native/diet.png',{x:0,y:1022,width:1206,height:1206},{x:670,y:portrait?360:170,width:730,radius:64});
  const microY=portrait?1236:958;
  text(ctx,'Mikroskładniki',1000,microY-18,34,{align:'center',weight:600,color:C.lime,max:740});
  const micro=detail(images.dietMicro,'assets/native/diet-micro.png',{x:48,y:1640,width:1110,height:610},{x:600,y:microY,width:800,radius:22});
  return{context:'The untouched native summary title and planned-meals subtitle are retained in the macro crop.',macro,micro};
}
function cta(ctx,x,y,{small=false}={}){
  const w=small?430:468,h=small?86:98;
  ctx.fillStyle=C.lime;round(ctx,x,y,w,h,25);ctx.fill();
  text(ctx,'Pobierz Diecik',x+29,y+h*.66,small?39:43,{weight:700,max:w-90});
  ctx.save();ctx.strokeStyle=C.pine;ctx.lineWidth=3.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x+w-51,y+h/2);ctx.lineTo(x+w-30,y+h/2);ctx.moveTo(x+w-39,y+h/2-9);ctx.lineTo(x+w-30,y+h/2);ctx.lineTo(x+w-39,y+h/2+9);ctx.stroke();ctx.restore();
}
function staticAd(concept,format){
  const H=format==='square'?1440:1800;
  const c=createCanvas(1440,H),ctx=c.getContext('2d');background(ctx,H);brand(ctx,96,145);
  // The 4:5 export has its own hierarchy and larger product, not a stretched square.
  const portrait=format==='portrait';
  const titleY=portrait?488:414,titleSize=portrait?126:119,titleLeading=portrait?137:130;
  lines(ctx,concept.headline,90,titleY,titleSize,titleLeading,{serif:true,weight:400,max:650});
  ctx.fillStyle=C.pine;ctx.fillRect(96,portrait?776:690,70,4);
  lines(ctx,concept.benefit,96,portrait?883:791,46,65,{weight:500,max:610});
  cta(ctx,96,portrait?1390:1130);
  text(ctx,'iOS i Android',99,portrait?1544:1284,32,{weight:500,color:C.muted,max:550});
  const proof=concept.native==='diet'?summaryDetail(ctx,{portrait}):phone(ctx,images[concept.native],{x:portrait?1040:1080,y:portrait?970:755,height:portrait?1530:1190,angle:portrait?-.027:-.025});
  // An explicit feature heading sits outside, above, the untouched native screenshot.
  text(ctx,concept.feature,1080,portrait?171:122,34,{align:'center',weight:600,color:C.lime,max:600});
  return {canvas:c,kind:'static',concept:concept.id,format,proof};
}
function carouselAd(concept,index){
  const c=createCanvas(1440,1440),ctx=c.getContext('2d');background(ctx,1440,{carousel:true,index});brand(ctx,96,145);
  text(ctx,concept.feature.toLocaleUpperCase('pl-PL'),96,314,29,{weight:600,color:C.muted,max:605});
  lines(ctx,concept.carousel,90,486,113,127,{serif:true,weight:400,max:650});
  lines(ctx,concept.carouselBody,96,803,43,61,{weight:500,max:608});
  cta(ctx,96,1116,{small:true});
  const proof=concept.native==='diet'?summaryDetail(ctx,{carousel:true}):phone(ctx,images[concept.native],{x:1080,y:740,height:1210,angle:index%2===0?-.021:.016});
  return {canvas:c,kind:'carousel',concept:concept.id,format:'square',proof};
}
async function write(result,filename,{final=true}={}){
  const output=path.join(root,final?'DO_WGRANIA':'podglad/static',filename);
  const bytes=await result.canvas.encode('jpeg',95);await fs.writeFile(output,bytes);
  const preview=createCanvas(360,Math.round(result.canvas.height/4));preview.getContext('2d').drawImage(result.canvas,0,0,preview.width,preview.height);
  const previewPath=path.join(root,'podglad/static',filename.replace('.jpg','-360.jpg'));
  await fs.writeFile(previewPath,await preview.encode('jpeg',94));
  exported.push({file:path.relative(root,output),preview:path.relative(root,previewPath),width:1440,height:result.canvas.height,bytes:bytes.length,sha256:hash(bytes),kind:result.kind,concept:result.concept,proof:result.proof});
  return preview;
}

const previews=[];
for(const concept of (representative?[representativeConcept]:concepts.filter(x=>!only||x.native===only)))for(const format of formats){
  previews.push(await write(staticAd(concept,format),`Grafika-${concept.id}-${format==='square'?'1x1':'4x5'}.jpg`,{final:!representative}));
}
if(!representative)for(const [index,concept]of [...concepts,favorite].entries())if(!only||concept.native===only)previews.push(await write(carouselAd(concept,index),`Karuzela-${concept.id}-1x1.jpg`));
const suffix=only?`-${only}`:'';
const overview=representative?'static-representative.jpg':`static-overview${suffix}.jpg`;
if(representative){
  await fs.writeFile(path.join(root,'podglad',overview),await previews[0].encode('jpeg',94));
}else{
  const staticPreviews=exported.map((entry,index)=>({entry,image:previews[index]})).filter(x=>x.entry.kind==='static');
  const square=staticPreviews.filter(x=>x.entry.height===1440),portrait=staticPreviews.filter(x=>x.entry.height===1800);
  if(staticPreviews.length){
    const cols=Math.max(square.length,portrait.length),height=(square.length?360:0)+(portrait.length?450:0);
    const board=createCanvas(cols*360,height),g=board.getContext('2d');g.fillStyle='#E8E7DF';g.fillRect(0,0,board.width,board.height);
    square.forEach((x,i)=>g.drawImage(x.image,i*360,0));portrait.forEach((x,i)=>g.drawImage(x.image,i*360,square.length?360:0));
    await fs.writeFile(path.join(root,'podglad',overview),await board.encode('jpeg',94));
  }
  const carouselPreviews=exported.map((entry,index)=>({entry,image:previews[index]})).filter(x=>x.entry.kind==='carousel');
  if(carouselPreviews.length){
    const board=createCanvas(carouselPreviews.length*360,360),g=board.getContext('2d');
    carouselPreviews.forEach((x,i)=>g.drawImage(x.image,i*360,0));
    await fs.writeFile(path.join(root,'podglad',`static-carousel-overview${suffix}.jpg`),await board.encode('jpeg',94));
  }
}
const relevantSources=[...new Set(['icon',...allConcepts.map(x=>x.native),...(allConcepts.some(x=>x.native==='diet')?['dietMicro']:[])])];
const sources=[];for(const kind of relevantSources){const file=sourcePaths[kind],bytes=await fs.readFile(file);sources.push({kind,path:path.relative(workspace,file),sha256:hash(bytes),bytes:bytes.length});}
const report={createdAt:new Date().toISOString(),revision:2,mode:representative?'REPRESENTATIVE_FOR_REVIEW':'FINAL_EXPORT',status:'EXPORTED_PENDING_VISUAL_REVIEW',scope:'B2C install static and carousel assets only',brand:'Diecik',nativePixelsRetouched:false,screenshotProcessing:'Uniform scaling and rounded clipping. Diet uses separate documented photographic macro and micronutrient crops; the original complete summary heading and planned-meals subtitle provide context. No rewritten labels or added app controls.',palette:C,typefaces:['Baskerville','Avenir Next'],sources,files:exported,textBounds:checks,limitations:['No performance claims or guaranteed installation improvement.','Visual review and final user acceptance are separate from export success.']};
await fs.writeFile(path.join(root,'qa',representative?'static-representative.json':`static-verification${suffix}.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,files:exported.map(x=>x.file),preview:`podglad/${overview}`},null,2));
