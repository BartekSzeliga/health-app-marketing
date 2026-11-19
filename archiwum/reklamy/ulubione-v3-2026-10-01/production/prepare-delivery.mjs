import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const planSource=path.resolve(root,'../launch-2026-09-30');
const configName='meta-konfiguracja-v3-PAUSED.json';
const b2cFiles=[
  'diecik-ulubione-a-20s-story.mp4','diecik-ulubione-b-20s-story.mp4',
  'diecik-ulubione-a-20s-feed.mp4','diecik-ulubione-b-20s-feed.mp4',
  'diecik-ulubione-a-10s-story.mp4'
];
const b2bFiles=[
  'diecik-specjalista-lead-a-15s-story.mp4','diecik-specjalista-lead-b-15s-story.mp4',
  'diecik-specjalista-website-a-15s-story.mp4','diecik-specjalista-website-b-15s-story.mp4',
  'diecik-specjalista-website-a-15s-wide.mp4'
];
const files=[...b2cFiles,...b2bFiles];
function requireContract(pass,message){if(!pass)throw new Error(message);}
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');

// The local v3 JSON is canonical. Never rebuild creatives from an older launch spec.
// Preflight reads only: no covers/config are changed until every current film exists.
requireContract(path.basename(root)==='ulubione-v3-2026-10-01','This script belongs only to the v3 delivery directory.');
const spec=JSON.parse(await fs.readFile(path.join(root,'kampanie',configName),'utf8'));
requireContract(spec.creative_revision_version===3,'Expected the current manual v3 campaign specification.');
requireContract(spec.default_status==='PAUSED'&&spec.account_id===null&&spec.page_id===null&&spec.instagram_id===null,'Manual local configuration must remain PAUSED with account/page/Instagram IDs null.');
for(const campaign of spec.campaigns){
  requireContract(campaign.status==='PAUSED','Campaign must remain PAUSED: '+campaign.name);
  for(const ad of campaign.ads)requireContract(ad.status==='PAUSED','Ad must remain PAUSED: '+ad.id);
  if(campaign.website_alternative)requireContract(campaign.website_alternative.status==='PAUSED','Website alternative must remain PAUSED.');
}
requireContract(spec.creative_contract?.hero_duration_seconds===20&&spec.creative_contract?.short_duration_seconds===10,'Expected hero 20s and short 10s.');
requireContract(spec.creative_contract.favourite_limit_disclosure.video_footer_visible===false,'The video finale must omit the limit footer; the offer remains in copy/spec.');
const references=[
  ...spec.campaigns.flatMap(c=>c.ads.flatMap(a=>Object.values(a.placements))),
  ...spec.campaigns.flatMap(c=>c.website_alternative?.assets??[]),
  ...spec.creative_library.assets
];
requireContract(references.every(file=>files.some(name=>file==='filmy/'+name)),'Configuration references a film outside the current v3 delivery.');
requireContract(!/diecik-ulubione-[ab]-(15s|6s)-/.test(JSON.stringify(spec)),'Old B2C film names must not appear in the current configuration.');
const present=(await fs.readdir(path.join(root,'filmy'))).filter(name=>name.endsWith('.mp4')).sort();
requireContract(JSON.stringify(present)===JSON.stringify([...files].sort()),'Finish all five new B2C renders before running delivery. Expected exactly the current ten MP4 files; found: '+present.join(', '));
for(const file of files)requireContract((await fs.stat(path.join(root,'filmy',file))).size>0,'Empty render: '+file);

// Preserve the financial/strategy base and all six Search CSV byte for byte.
const copiedReviewPath=path.join(root,'qa/copied-plan-validation.json');
const priorCopies=JSON.parse(await fs.readFile(copiedReviewPath,'utf8'));
const planCopies=[
  ['strategy/marketing-plan.pdf','plan/marketing-plan.pdf'],
  ['strategy/marketing-plan.md','plan/marketing-plan.md'],
  ['campaigns/diecik-campaign-operations.xlsx','plan/budzet-i-KPI-baza-2026-09-30.xlsx']
];
const csvFiles=(await fs.readdir(path.join(planSource,'campaigns/google-editor'))).filter(name=>name.endsWith('.csv')).sort();
requireContract(csvFiles.length===6,'Expected the six unchanged Google Search CSV exports.');
for(const name of csvFiles)planCopies.push(['campaigns/google-editor/'+name,'kampanie/google-editor/'+name]);
const copyRows=[];
for(const [source,dest] of planCopies){
  const original=await fs.readFile(path.join(planSource,source));
  const previous=priorCopies.files.find(row=>row.file===dest);
  requireContract(previous?.sha256===sha(original),'Frozen plan/export source changed: '+source);
  const target=path.join(root,dest);
  let existing;
  try{existing=await fs.readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;}
  requireContract(existing===undefined||existing.equals(original),'Existing v3 plan/export is not byte identical: '+dest);
  if(existing===undefined){await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(planSource,source),target);}
  const copied=await fs.readFile(target);
  copyRows.push({file:dest,source:path.relative(path.resolve(root,'../../..'),path.join(planSource,source)),byte_identical_copy:copied.equals(original),sha256:sha(copied)});
}

const req=createRequire(import.meta.url);
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
await fs.mkdir(path.join(root,'okladki'),{recursive:true});
const thumbs=[];
for(const file of files){
  const stem=file.slice(0,-4),b2c=b2cFiles.includes(file),short=file==='diecik-ulubione-a-10s-story.mp4';
  const times=b2c?[['hook',.65],['cta',short?8.5:18.7]]:[['hook',1.3],['cta',13.7]];
  for(const [role,time] of times){
    const target=path.join(root,'okladki',stem+'-'+role+'.jpg');
    const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',path.join(root,'filmy',file),'-frames:v','1','-q:v','2',target],{encoding:'utf8'});
    if(result.status!==0)throw new Error(result.stderr||'Cover extraction failed: '+file);
    requireContract((await fs.stat(target)).size>0,'Empty cover: '+target);
    thumbs.push({file:path.relative(root,target),source:'filmy/'+file,at_seconds:time});
  }
}
const texts=spec.campaigns.flatMap(c=>c.ads.map(a=>[
  a.id,'Status: '+a.status,'Hook filmu: '+a.hook,'Tekst: '+a.primary,'Nagłówek: '+a.headline,
  'Opis: '+a.description,'CTA filmu: '+a.cta,'Przycisk Meta: '+a.button,'Adres: '+a.url,
  ...Object.entries(a.placements).map(([placement,file])=>placement+': '+file),''
].join('\n'))).join('\n');
await fs.writeFile(path.join(root,'kampanie/teksty-meta-do-wklejenia.txt'),texts+'\n');
await fs.writeFile(copiedReviewPath,JSON.stringify({
  status:copyRows.every(row=>row.byte_identical_copy)?'PASS':'FAIL',revision:'v3',
  scope:'Unchanged strategy PDF/MD, financial XLSX and six Google Editor CSV; byte comparison with frozen 2026-09-30 originals, not a platform import or performance test.',
  google_csv_count:csvFiles.length,files:copyRows
},null,2)+'\n');
console.log(JSON.stringify({revision:'v3',movies:files.length,b2c_movies:b2cFiles.length,b2b_movies:b2bFiles.length,covers:thumbs.length,cover_sources:thumbs,meta_status:spec.default_status,account_id:spec.account_id,platform_campaigns_created:false}));
