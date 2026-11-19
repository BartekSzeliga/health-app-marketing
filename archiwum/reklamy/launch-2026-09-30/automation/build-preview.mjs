import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';
import {root,C,svg,txt,brand} from './build-creatives.mjs';

const tileW=360,gap=32,margin=54;
const row1=[
 ['B2C · wariant A','meta/b2c-ulubione-feed-1080x1350.jpg'],
 ['B2C · wariant B','meta/b2c-ulubione-hook-b-feed-1080x1350.jpg'],
 ['B2C · rzeczywista aplikacja','meta/b2c-ulubione-proof-feed-1080x1350.jpg'],
 ['B2B · darmowy start','meta/b2b-publikacja-feed-1080x1350.jpg']
];
const row2=[
 ['Karuzela · ulubione','organic/carousel/01-ulubione-1080x1080.jpg'],
 ['Karuzela · zapisz','organic/carousel/02-zapisz-1080x1080.jpg'],
 ['Karuzela · dodaj ponownie','organic/carousel/03-dodaj-1080x1080.jpg'],
 ['Świeże UI · posiłek 1.10','sources/mobile/favorite-added-day.png']
];
const w=margin*2+tileW*4+gap*3,h=1180;
let body=`<rect width="${w}" height="${h}" fill="url(#pastel)"/>`;
body+=brand(margin,36,{size:48});
body+=txt('Ulubione posiłki. Zapisz raz. Dodawaj ponownie.',margin,135,40,C.ink,800);
body+=txt('Gotowe kreacje Meta, materiały organiczne i osobny przekaz dla specjalistów.',margin,181,23,C.muted,500);
const layers=[];
for(const [row,data,y,tileH] of [[0,row1,248,450],[1,row2,762,360]]) {
 for(let i=0;i<data.length;i++) {
  const x=margin+i*(tileW+gap);
  body+=txt(data[i][0],x,y-20,20,C.blue,700);
  layers.push({input:await sharp(path.join(root,data[i][1])).resize(tileW,tileH,{fit:'contain',background:'#FFFFFF'}).jpeg({quality:94}).toBuffer(),left:x,top:y});
 }
}
body+=txt('Zdjęcia potraw: ilustracje imagegen. Interfejs: autentyczne ujęcia lokalnej aplikacji DEMO.',margin,1160,20,C.muted,500);
const buffer=await sharp(svg(w,h,body)).png().toBuffer();
await sharp(buffer).composite(layers).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(path.join(root,'podglad-kampanii.jpg'));
console.log('Campaign preview saved.');
