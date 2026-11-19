import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const C = {ink:'#14213D', blue:'#155E75', green:'#43A047', mist:'#EAF6F3', sky:'#E8F4FB', white:'#FFFFFF', muted:'#526273'};
const iconFile = path.resolve(root, '../../../health-app-frontend/public/brand/diecik-icon.png');
let icon;
try {icon=await fs.readFile(iconFile);} catch {icon=await fs.readFile(path.resolve(root,'../meta-start-aplikacji/sources/diecik-icon.png'));}
export const enc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const txt = (s,x,y,size=40,fill=C.ink,weight=600,more='') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${more}>${enc(s)}</text>`;
export const lines = (arr,x,y,size=94,fill=C.ink,lh=104) => arr.map((s,i)=>txt(s,x,y+i*lh,size,fill,800,'letter-spacing="-3"')).join('');
export function svg(w,h,body) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="pastel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E8F4FB"/><stop offset="1" stop-color="#EAF6F3"/></linearGradient><linearGradient id="night" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#14213D"/><stop offset="1" stop-color="#155E75"/></linearGradient><linearGradient id="veil" x2="0" y2="1"><stop stop-color="#FCFDFC" stop-opacity=".94"/><stop offset=".58" stop-color="#FCFDFC" stop-opacity=".75"/><stop offset="1" stop-color="#FCFDFC" stop-opacity="0"/></linearGradient><filter id="shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#14213D" flood-opacity=".16"/></filter></defs><style>text{font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif}</style>${body}</svg>`);
}
export async function imageTag(file,x,y,w,h,{radius=0,fit='cover',crop}={}) {
  let im=sharp(file); if(crop) im=im.extract(crop);
  const b=await im.resize(Math.round(w),Math.round(h),{fit,kernel:'lanczos3',background:'#FFFFFF'}).png().toBuffer();
  const id='clip'+x+'x'+y+'w'+w;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}"/></clipPath></defs><image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="data:image/png;base64,${b.toString('base64')}" clip-path="url(#${id})"/>`;
}
export function brand(x,y,{dark=false,size=60}={}) {
  return `<defs><clipPath id="brand${x}x${y}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size*.2}"/></clipPath></defs><image x="${x}" y="${y}" width="${size}" height="${size}" xlink:href="data:image/png;base64,${icon.toString('base64')}" clip-path="url(#brand${x}x${y})"/>`+txt('diecik',x+size+16,y+size*.76,size*.69,dark?C.white:C.ink,800,'letter-spacing="-1.5"');
}
export function heart(x,y,size=90,fill=C.blue) {
  return `<g transform="translate(${x} ${y}) scale(${size/100})"><path d="M50 87C35 75 8 56 8 32C8 9 36 1 50 23C64 1 92 9 92 32C92 56 65 75 50 87Z" fill="${fill}"/></g>`;
}
export function button(label,x,y,w=448,h=84,{dark=false}={}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${dark?C.white:C.blue}"/>`+txt(label,x+30,y+h*.64,32,dark?C.ink:C.white,700)+`<path d="M${x+w-66} ${y+h/2}h26m-10-10 10 10-10 10" stroke="${dark?C.blue:C.white}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}
async function saveSvg(name,w,h,body) {
  const target=path.join(root,name); await fs.mkdir(path.dirname(target),{recursive:true});
  const source=svg(w,h,body); await fs.writeFile(target.replace(/\.(jpg|png)$/i,'.svg'),source);
  const im=sharp(source); if(name.endsWith('.jpg')) await im.jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(target); else await im.png().toFile(target);
  return target;
}
export async function foodHero(w,h,{variant='primary',cta=true}={}) {
  const portrait=h>w*1.5;
  const square=w===h;
  const margin=w*.062;
  const top=portrait?270:64;
  const scale=w/1080;
  let body=await imageTag(path.join(root,'sources/photos/ulubione-kakaowa-owsianka-editorial.png'),0,0,w,h,{fit:'cover'});
  body+=`<rect width="${w}" height="${portrait?1120:h*.64}" fill="url(#veil)"/>`;
  body+=brand(margin,top,{size:64*scale});
  body+=txt('ULUBIONE POSIŁKI',margin,top+142*scale,24*scale,C.blue,700,'letter-spacing="3"');
  const copy=variant==='secondary'?['Lubisz ten','posiłek?']:['Twój smak.','Twój skrót.'];
  body+=lines(copy,margin,top+278*scale,portrait?112*scale:square?98*scale:112*scale,C.ink,portrait?126*scale:124*scale);
  body+=txt('Zapisz raz. Dodawaj ponownie.',margin,top+473*scale,35*scale,C.ink,500);
  body+=`<circle cx="${w*.80}" cy="${portrait?h*.66:h*.66}" r="${75*scale}" fill="#FFFFFF" filter="url(#shadow)"/>`;
  body+=heart(w*.80-36*scale,(portrait?h*.66:h*.66)-33*scale,72*scale,C.blue);
  if(cta) {
    const y=portrait?1370:square?902:1170;
    body+=button('Wypróbuj za darmo',margin,y*scale,460*scale,86*scale);
    body+=`<rect x="${margin}" y="${(y+97)*scale}" width="${720*scale}" height="${60*scale}" rx="${30*scale}" fill="white" fill-opacity=".96"/>`;
    body+=txt('Do 3 ulubionych w planie darmowym.',margin+20*scale,(y+137)*scale,34*scale,C.ink,500);
    body+=`<rect x="${w-margin-222*scale}" y="${(y+14)*scale}" width="${222*scale}" height="${58*scale}" rx="${29*scale}" fill="white" fill-opacity=".96"/>`;
    body+=txt('diecik.com',w-margin-111*scale,(y+54)*scale,28*scale,C.ink,700,'text-anchor="middle"');
  }
  return body;
}
export async function proofPoster(w,h,file,{headline=['Ulubione posiłki.','Zawsze pod ręką.'], crop,step='ZAPISZ → WYBIERZ → DODAJ',dark=false}={}) {
  const scale=w/1080, portrait=h>w*1.5, square=w===h, m=68*scale, top=portrait?270:58*scale;
  let b=`<rect width="${w}" height="${h}" fill="url(#${dark?'night':'pastel'})"/>`;
  b+=brand(m,top,{dark,size:60*scale});
  b+=txt(step,m,top+138*scale,22*scale,dark?'#BDE9E7':C.blue,700,'letter-spacing="2"');
  b+=lines(headline,m,top+248*scale,82*scale,dark?C.white:C.ink,92*scale);
  const by=portrait?650*scale:square?450*scale:470*scale,bw=w-m*2,bh=portrait?680*scale:square?420*scale:620*scale;
  b+=`<rect x="${m}" y="${by}" width="${bw}" height="${bh}" rx="38" fill="white" filter="url(#shadow)"/>`;
  b+=await imageTag(file,m,by,bw,bh,{radius:38,crop,fit:'contain'});
  const ctaY=portrait?1400*scale:square?900*scale:1160*scale;
  b+=button('Wypróbuj za darmo',m,ctaY,460*scale,86*scale,{dark});
  b+=txt('Do 3 ulubionych w planie darmowym.',m,ctaY+127*scale,34*scale,dark?'#D3E9EC':C.muted,500);
  return b;
}
export async function b2bPoster(w,h,file,crop) {
  const square=w===h, wide=w>h, scale=w/(wide?1200:1080), m=wide?54:68, top=wide?34:h>w*1.5?270:55;
  let b=`<rect width="${w}" height="${h}" fill="url(#night)"/>`;
  b+=`<circle cx="${w*.95}" cy="${h*.08}" r="${w*.43}" fill="#2563EB" opacity=".09"/><circle cx="${w*.2}" cy="${h*.97}" r="${w*.53}" fill="#43A047" opacity=".06"/>`;
  b+=brand(m,top,{dark:true,size:wide?46:60});
  b+=txt('DLA DIETETYKÓW I TRENERÓW',m,top+(wide?105:138),wide?19:22,'#A7E0E1',700,'letter-spacing="2"');
  b+=lines(wide||square?['Od planu do','telefonu klienta.']:['Od planu','do telefonu','klienta.'],m,top+(wide?185:245),wide?65:94,C.white,wide?72:103);
  if(wide) {
    b+=`<rect x="658" y="99" width="482" height="385" rx="20" fill="white" filter="url(#shadow)"/>`;
    b+=await imageTag(file,658,99,482,385,{radius:20,crop,fit:'contain'});
    b+=txt('RZECZYWISTY PANEL · DEMO',680,515,16,'#BCE5E9',600,'letter-spacing="1"');
    b+=button('Zacznij bezpłatnie',m,470,460,78,{dark:true});
    b+=txt('Do 2 aktywnych klientów. Bez karty.',m,584,34,'#D3E9EC',500);
  } else {
    const by=square?470:top+505,bh=square?356:h>w*1.5?570:525;
    b+=`<rect x="${m}" y="${by}" width="${w-m*2}" height="${bh}" rx="30" fill="white" filter="url(#shadow)"/>`;
    b+=await imageTag(file,m,by,w-m*2,bh,{radius:30,crop,fit:'contain'});
    b+=txt('RZECZYWISTY PANEL · DEMO',m,by+bh+38,21,'#BCE5E9',600,'letter-spacing="1.5"');
    const cy=square?890:h>w*1.5?1400:1160;
    b+=button('Zacznij bezpłatnie',m,cy,460,86,{dark:true});
    b+=txt('Do 2 aktywnych klientów. Bez karty.',m,cy+130,34,'#D3E9EC',500);
  }
  return b;
}

async function main() {
  await saveSvg('meta/b2c-ulubione-feed-1080x1350.jpg',1080,1350,await foodHero(1080,1350));
  await saveSvg('meta/b2c-ulubione-story-1080x1920.jpg',1080,1920,await foodHero(1080,1920));
  await saveSvg('meta/b2c-ulubione-hook-b-feed-1080x1350.jpg',1080,1350,await foodHero(1080,1350,{variant:'secondary'}));
  await saveSvg('organic/b2c-ulubione-1080x1080.jpg',1080,1080,await foodHero(1080,1080));
  const panel=path.join(root,'sources/web/panel-dieta-185s.png');
  const panelCrop={left:238,top:246,width:1080,height:590};
  await saveSvg('meta/b2b-publikacja-feed-1080x1350.jpg',1080,1350,await b2bPoster(1080,1350,panel,panelCrop));
  await saveSvg('meta/b2b-publikacja-story-1080x1920.jpg',1080,1920,await b2bPoster(1080,1920,panel,panelCrop));
  await saveSvg('google/b2b-publikacja-1200x628.jpg',1200,628,await b2bPoster(1200,628,panel,panelCrop));
  await saveSvg('google/b2b-publikacja-1200x1200.jpg',1200,1200,await b2bPoster(1200,1200,panel,panelCrop));
  const fav=path.join(root,'sources/mobile/favorite-list.png');
  try {
    await fs.access(fav);
    const crop={left:42,top:756,width:1118,height:640};
    await saveSvg('meta/b2c-ulubione-proof-feed-1080x1350.jpg',1080,1350,await proofPoster(1080,1350,fav,{crop}));
    await saveSvg('meta/b2c-ulubione-proof-story-1080x1920.jpg',1080,1920,await proofPoster(1080,1920,fav,{crop}));
    await saveSvg('organic/carousel/01-ulubione-1080x1080.jpg',1080,1080,await foodHero(1080,1080,{variant:'secondary'}));
    await saveSvg('organic/carousel/02-zapisz-1080x1080.jpg',1080,1080,await proofPoster(1080,1080,path.join(root,'sources/mobile/favorite-save-actions.png'),{headline:['Zapisz swój','ulubiony posiłek.'],crop:{left:48,top:1892,width:1110,height:170},step:'01 · ZAPISZ',dark:true}));
    await saveSvg('organic/carousel/03-dodaj-1080x1080.jpg',1080,1080,await proofPoster(1080,1080,fav,{headline:['Wybierz.','Dodaj ponownie.'],crop,step:'02 · WYBIERZ I DODAJ'}));
  } catch(e) { if(e.code!=='ENOENT') throw e; }
  console.log('Rendered placement-specific stills and available native proof.');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await main();
