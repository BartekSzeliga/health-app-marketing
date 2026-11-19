import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const req=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const edit=JSON.parse(await fs.readFile(path.join(root,'production/edit.json'),'utf8'));
const dir=path.join(root,'qa/work');await fs.mkdir(dir,{recursive:true});
const prepared=[];
async function run(args){
  const p=spawn(ffmpeg,['-hide_banner','-loglevel','warning','-y',...args],{stdio:['ignore','ignore','pipe']});
  let err='';p.stderr.on('data',d=>err+=d);const[code]=await once(p,'close');if(code)throw new Error(err);
}
for(let i=0;i<edit.scenes.length;i++){
  const s=edit.scenes[i],out=path.join(dir,`scene-${i}.mp4`),duration=s.to-s.from;
  const input=s.file?['-ss',String(s.source_start??0),'-i',path.join(root,s.file)]:['-f','lavfi','-i','color=c=0x153630:s=1080x1920:r=30'];
  // Crop only the licensed cinematic footage. The actual application is never cropped.
  const crop=s.crop?`crop=${s.crop.w}:${s.crop.h}:${s.crop.x}:${s.crop.y},`:'';
  const grade='eq=saturation=0.96:contrast=1.025:brightness=0.005,colorbalance=rs=0.016:gs=0.003:bs=-0.008';
  const filter=`${crop}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,${grade}${s.blur?',gblur=sigma=18':''},format=yuv420p`;
  await run([...input,'-an','-vf',filter,'-t',String(duration),'-c:v','libx264','-preset','fast','-crf','18','-r','30','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',out]);
  prepared.push(out);console.log(`scene ${i+1}/${edit.scenes.length}: ${s.from}–${s.to}s`);
}
const list=path.join(dir,'concat.txt');
await fs.writeFile(list,prepared.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n')+'\n');
await run(['-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',path.join(dir,'film-background.mp4')]);
console.log('Prepared film-background.mp4');
