import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const req=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
const audience=process.argv[2]??'dietetyk';
if(audience!=='dietetyk')throw new Error('v10 is the dietitian revision only');
const edit=JSON.parse(await fs.readFile(path.join(root,`production/edit-${audience}.json`),'utf8'));
const dir=path.join(root,'qa/work',audience);await fs.mkdir(dir,{recursive:true});
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
  let filters=['-vf',filter];
  if(s.fit_context){
    const foregroundHeight=Math.round(1080*s.crop.h/s.crop.w),top=Math.round((1920-foregroundHeight)/2);
    const feather="geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*min(1,min(Y/42,(H-1-Y)/42))'";
    const complex=`[0:v]split=2[b0][f0];[b0]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=28[b];[f0]${crop}scale=1080:${foregroundHeight},format=rgba,${feather}[f];[b][f]overlay=0:${top}:format=auto,setsar=1,fps=30,${grade}${s.blur?',gblur=sigma=18':''},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[out]`;
    filters=['-filter_complex',complex,'-map','[out]'];
  }
  await run([...input,'-an',...filters,'-t',String(duration),'-c:v','libx264','-preset','fast','-crf','18','-r','30','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',out]);
  prepared.push(out);console.log(`scene ${i+1}/${edit.scenes.length}: ${s.from}–${s.to}s`);
}
const list=path.join(dir,'concat.txt');
await fs.writeFile(list,prepared.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n')+'\n');
await run(['-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',path.join(dir,'film-background.mp4')]);
console.log('Prepared film-background.mp4');
