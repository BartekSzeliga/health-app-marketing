import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const req = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tooling = path.resolve(root, '../meta-start-aplikacji/.tooling/node_modules');
const sharp = (await import(pathToFileURL(path.join(tooling,'sharp/dist/index.mjs')))).default;
const ffmpeg = req(path.join(tooling,'ffmpeg-static/index.js'));
let old = path.resolve(root, '../launch-2026-09-30/sources/mobile');
try { await fs.access(path.join(old,'favorite-list.png')); }
catch { old=path.join(root,'assets/context'); }
await fs.mkdir(path.join(root,'qa/build'), {recursive:true});
const crop = {left:42,top:756,width:1118,height:640};
await sharp(path.join(old,'favorite-list.png')).extract(crop)
  .png().toFile(path.join(root,'assets/ui-favorite-card.png'));
await sharp(path.join(old,'favorite-list.png')).extract({left:42,top:212,width:1118,height:1188})
  .png().toFile(path.join(root,'assets/ui-favorite-panel.png'));
const meta = await sharp(path.join(root,'assets/meal-cutout.png')).metadata();
if (!meta.hasAlpha) throw new Error('Food cutout has no alpha');
for (const name of ['save','add']) {
  const out = path.join(root,`qa/build/${name}-%02d.png`);
  const r = spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',
    '-i',path.join(root,`assets/ui-${name}-press.mp4`),'-vsync','0',out],{encoding:'utf8'});
  if (r.status !== 0) throw new Error(r.stderr);
}
await fs.writeFile(path.join(root,'assets/ui-favorite-card-provenance.json'), JSON.stringify({
  source:'../launch-2026-09-30/sources/mobile/favorite-list.png',crop,
  processing:'Rectangular crop only; original UI labels and pixels preserved.',
  foodCutout:{width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha}
},null,2)+'\n');
console.log('Prepared real favorite card, real press frames and verified food alpha.');
