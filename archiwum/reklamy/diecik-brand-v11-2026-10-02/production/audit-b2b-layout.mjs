import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const production=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(production,'..');
for(const audience of ['dietetyk','trener']){
  let source=(await fs.readFile(path.join(production,`render-${audience}.mjs`),'utf8')).split('const temp=')[0];
  source=source.replace("const audience=process.argv[2]??'dietetyk';", "const audience='dietetyk';")
    .replace("const audience=process.argv[2]??'trener';", "const audience='trener';");
  source=source.replace('function smooth(v)', `
const bounds=[],zone={left:70,top:288,right:1010,bottom:1230};let currentTime=0;
function record(label,left,top,right,bottom){
  if(ctx.globalAlpha>.05)bounds.push({time:currentTime,label,left,top,right,bottom});
}
function smooth(v)`);
  source=source.replace('ctx.fillText(value,x,y);ctx.restore();', `
  const m=ctx.measureText(value);
  record(value,x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent);
  ctx.fillText(value,x,y);ctx.restore();`);
  source=source.replace('ctx.drawImage(icon,start,y-iconSize/2,iconSize,iconSize);', `
  record('Diecik icon',start,y-iconSize/2,start+iconSize,y+iconSize/2);
  ctx.drawImage(icon,start,y-iconSize/2,iconSize,iconSize);`);
  source=source.replace("ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText('Diecik',start+iconSize+gap,y+size*0.035);ctx.restore();", `
  ctx.textBaseline='middle';ctx.fillStyle=color;
  const bx=start+iconSize+gap,by=y+size*.035,m=ctx.measureText('Diecik');
  record('Diecik wordmark',bx-m.actualBoundingBoxLeft,by-m.actualBoundingBoxAscent,bx+m.actualBoundingBoxRight,by+m.actualBoundingBoxDescent);
  ctx.fillText('Diecik',bx,by);ctx.restore();`);
  source=source.replace('function round(x,y,w,h,r){ctx.beginPath();', `function round(x,y,w,h,r){
  if(w===820&&h===136)record('CTA button',x,y,x+w,y+h);
  ctx.beginPath();`);
  source+=`
for(let n=0;n<600;n++){currentTime=n/30;draw(currentTime);}
const violations=bounds.filter(b=>b.left<zone.left||b.top<zone.top||b.right>zone.right||b.bottom>zone.bottom);
const extents={left:Math.min(...bounds.map(b=>b.left)),top:Math.min(...bounds.map(b=>b.top)),right:Math.max(...bounds.map(b=>b.right)),bottom:Math.max(...bounds.map(b=>b.bottom))};
const result={audience,frames_evaluated:600,method:'Actual Canvas glyph and icon bounds for marketing overlays with opacity > 0.05; native UI and imagery are not clipped to this zone',zone,extents,visible_draws:bounds.length,violations,status:violations.length?'FAIL':'PASS',source:'https://www.facebook.com/business/ads-guide/update/video/instagram-reels/outcome-engagement',platform_preview_tested:false};
await fs.writeFile(path.join(root,'qa','layout-'+audience+'.json'),JSON.stringify(result,null,2)+'\\n');
console.log(JSON.stringify(result,null,2));
if(violations.length)throw new Error('Marketing overlays outside shared safe zone');
`;
  const auditFile=path.join(production,`.layout-${audience}.audit.mjs`);
  await fs.writeFile(auditFile,source);
  try{await import(pathToFileURL(auditFile).href);}finally{await fs.unlink(auditFile);}
}
