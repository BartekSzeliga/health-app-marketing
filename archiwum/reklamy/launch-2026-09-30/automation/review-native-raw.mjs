import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';
import ffmpeg from '../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import {root,svg,txt} from './build-creatives.mjs';
const cases=[['favorite-save-raw.mov',[0.5,1.3,2.1,2.9,3.7,4.5,5.3,6.1,6.9]],['favorite-reuse-nextday-raw.mov',[0.3,0.8,1.3,1.8,2.3,3.3,4.3,5.3,6.3]]];
const out=path.join(root,'qa/mobile/raw-review');await fs.mkdir(out,{recursive:true});
for(const [name,times] of cases) {
 const tiles=[];let captions='';
 for(let i=0;i<times.length;i++) {
  const f=path.join(out,name+'-'+i+'.jpg');
  const p=spawnSync(ffmpeg,['-hide_banner','-v','error','-y','-ss',String(times[i]),'-i',path.join(root,'sources/mobile',name),'-frames:v','1','-q:v','2',f],{encoding:'utf8'});
  if(p.status) throw new Error(p.stderr);
  const left=(i%3)*320,top=Math.floor(i/3)*730;
  captions+=txt(times[i]+' s',left+10,top+26,22);
  tiles.push({input:await sharp(f).resize(300,652).jpeg().toBuffer(),left:left+10,top:top+42});
 }
 const base=await sharp(svg(960,2190,'<rect width="960" height="2190" fill="#E8F4FB"/>'+captions)).png().toBuffer();
 await sharp(base).composite(tiles).jpeg({quality:92}).toFile(path.join(out,name+'-contact.jpg'));
}
