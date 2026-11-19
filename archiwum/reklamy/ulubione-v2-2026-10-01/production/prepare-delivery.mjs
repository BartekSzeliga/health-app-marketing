import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const old=path.resolve(root,'../launch-2026-09-30');
const req=createRequire(import.meta.url);
const ffmpeg=req(path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js'));
await fs.mkdir(path.join(root,'kampanie'),{recursive:true});
await fs.mkdir(path.join(root,'plan'),{recursive:true});
await fs.mkdir(path.join(root,'okladki'),{recursive:true});
const spec=JSON.parse(await fs.readFile(path.join(old,'campaigns/meta/manual-campaign-spec.json'),'utf8'));
spec.created_at='2026-10-01';
spec.creative_revision='v2: JESZCZE RAZ + pełny ekran aplikacji przed zbliżeniem';
for(const campaign of spec.campaigns){
  if(campaign.ads[0].audience==='B2C'){
    campaign.experiment='Dwa filmy A/B z innym hookiem do 1.42 s. Następne ujęcia, montaż, pełne ekrany i CTA są identyczne. Jeden mały test kierunkowy; nie zakładamy przewagi przed pomiarem.';
    campaign.ads.forEach((ad,i)=>{
      const v=i===0?'a':'b';ad.hook=i===0?'Jeszcze raz?':'Lubisz ten smak?';
      ad.primary='Ulubiony smak wraca jutro. Zapisz gotowy posiłek w Dieciku i dodaj go ponownie do diety. Wypróbuj za darmo: 3 ulubione posiłki. Premium bez limitu.';
      ad.placements={'Reels / Stories':`filmy/diecik-ulubione-${v}-15s-story.mp4`,Feed:`filmy/diecik-ulubione-${v}-15s-feed.mp4`};
      ad.content=`ulubione_v2_video_${v}`;
      ad.url_parameters=ad.url_parameters.replace(`ulubione_video_${v}`,ad.content);
      ad.thumbnail=`okladki/diecik-ulubione-${v}-15s-story-hook.jpg`;
    });
  }else{
    campaign.placement_policy='Pilot: dwa nowe filmy lead 9:16 z CTA formularza. Rzeczywiste pełne ekrany i detale. Website jest alternatywą tej samej puli, z osobnymi filmami i innym CTA.';
    campaign.ads.forEach((ad,i)=>{
      const v=i===0?'a':'b';ad.hook=i===0?'Plan gotowy. Klient też.':'Od planu do aplikacji.';
      ad.placements={'Reels / Stories':`filmy/diecik-specjalista-lead-${v}-15s-story.mp4`};
      ad.content=`prezentacja_v2_video_${v}`;
    });
    campaign.website_alternative.assets=['filmy/diecik-specjalista-website-a-15s-story.mp4','filmy/diecik-specjalista-website-b-15s-story.mp4'];
  }
}
spec.creative_library={status:'DRAFT',purpose:'Nowe filmy, okładki i kadry CTA. Wide jest materiałem dodatkowym; nie jest wymagany w kampanii Search.',
  assets:['filmy/diecik-ulubione-a-6s-story.mp4','filmy/diecik-specjalista-website-a-15s-wide.mp4'],
  image_usage:'JPG hook są okładkami filmów. JPG CTA można użyć jako warianty statyczne po osobnym podglądzie placementu. Nie używać ich jako image assets Search.'};
await fs.writeFile(path.join(root,'kampanie/meta-konfiguracja-v2-PAUSED.json'),JSON.stringify(spec,null,2)+'\n');
for(const n of ['marketing-plan.pdf','marketing-plan.md'])await fs.copyFile(path.join(old,'strategy',n),path.join(root,'plan',n));
await fs.cp(path.join(old,'campaigns/google-editor'),path.join(root,'kampanie/google-editor'),{recursive:true});
await fs.copyFile(path.join(old,'campaigns/diecik-campaign-operations.xlsx'),path.join(root,'plan/budzet-i-KPI-baza-2026-09-30.xlsx'));
const files=(await fs.readdir(path.join(root,'filmy'))).filter(x=>x.endsWith('.mp4'));
const thumbs=[];
for(const file of files){
  const stem=file.slice(0,-4);
  for(const [name,time] of [['hook',file.includes('ulubione')?.65:1.3],['cta',file.includes('6s')?5.15:13.7]]){
    const target=path.join(root,`okladki/${stem}-${name}.jpg`);
    const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(time),'-i',path.join(root,'filmy',file),'-frames:v','1','-q:v','2',target],{encoding:'utf8'});
    if(r.status!==0)throw new Error(r.stderr);thumbs.push(path.relative(root,target));
  }
}
await fs.writeFile(path.join(root,'kampanie/teksty-meta-do-wklejenia.txt'),spec.campaigns.flatMap(c=>c.ads.map(a=>[
  a.id,`Status: ${a.status}`,`Hook filmu: ${a.hook}`,`Tekst: ${a.primary}`,`Nagłówek: ${a.headline}`,
  `Opis: ${a.description}`,`CTA filmu: ${a.cta}`,`Przycisk Meta: ${a.button}`,`Adres: ${a.url}`,
  ...Object.entries(a.placements).map(([k,v])=>`${k}: ${v}`),''].join('\n'))).join('\n'));
await fs.writeFile(path.join(root,'kampanie/instrukcja-v2.txt'),[
  'Diecik — nowe materiały v2, 01.10.2026. Wyłącznie lokalna konfiguracja, bez emisji.',
  '',
  'Meta: meta-konfiguracja-v2-PAUSED.json to spec ręczny, nie payload API ani format importu.',
  'Teksty i finalne ścieżki filmów są w teksty-meta-do-wklejenia.txt i JSON.',
  'Lead B2B: filmy lead, CTA Zobacz, jak to działa. Website B2B: filmy website, CTA Zacznij bezpłatnie.',
  'Dwa warianty B2B wykorzystują alternatywnie tę samą pulę 1000 zł. Nie dodawać budżetów.',
  'B2C: A Jeszcze raz? / B Lubisz ten smak?, identyczny montaż po 1.42 s. Limit darmowy 3 ulubione.',
  'Wybierz jeden zestaw i dwa filmy do pierwszego testu. Okładki hook nie są dodatkowymi reklamami.',
  '',
  'Plan finansowy pozostaje propozycją 3000 zł/30 dni: Search B2B 1500 zł, Meta B2B 1000 zł, Meta B2C 500 zł warunkowo.',
  'Plan PDF i arkusz budżetu/KPI pochodzą z 30.09.2026. Arkusz jest bazą kalkulacji; aktualne przypisanie',
  'nowych filmów i nowe hooki bierz z niniejszego JSON/TXT, a nie z historycznych opisów kreacji w arkuszu.',
  'Google Search: kopia wcześniej sprawdzonych CSV. Search nie potrzebuje filmu; wide jest zapasem.',
  'Nazwy kampanii/datę startu/identyfikatory kont i źródło pomiaru trzeba uzupełnić na właściwym koncie.',
  'Budżet pozostaje propozycją. Nie utworzono kampanii na koncie i nie wydano pieniędzy.',
  '',
  'Weryfikacja: główny hero ma niezależny przegląd klatek 360px i ciągłości pełnego UI.',
  'Kontrola parametrów/dekodowania nie jest testem skuteczności reklamy.',
  '',
  'Źródła UI: autentyczne materiały aplikacji. B2B pokazuje osobne konta DEMO, jawnie opisane w filmie.',
  'Fotografia: oryginalna miska z przepisu; wycięcie tła wbudowanym ImageGen, prompt w assets/imagegen-prompts.json.',
  'Audio: własna synteza i kompozycja; żadne Apple Loops nie są używane.',
  ''].join('\n'));
await fs.writeFile(path.join(root,'assets/context/provenance.json'),JSON.stringify({
  source:'../launch-2026-09-30/sources/mobile/',files:['own-meal.png','favorite-save-actions.png','favorite-added-day.png','favorite-list.png'],
  processing:'Byte-identical copies; camera framing and cropping only in the renderer.',
  purpose:'Full-screen context before saving and after adding, as requested in user feedback.',
  ui_days:['2026-09-30','2026-10-01'],save_tap_s:3.28125,add_tap_s:7.5
},null,2)+'\n');
console.log(JSON.stringify({movies:files.length,covers:thumbs.length,metaStatus:spec.default_status}));
