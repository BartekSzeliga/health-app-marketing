import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from '../../meta-start-aplikacji/.tooling/node_modules/sharp/dist/index.mjs';
import ffmpeg from '../../meta-start-aplikacji/.tooling/node_modules/ffmpeg-static/index.js';
import {root,C,svg,txt,lines,brand,button,foodHero,imageTag,heart} from './build-creatives.mjs';

const work=path.join(root,'qa/.build/video');
await fs.mkdir(work,{recursive:true});
const FPS=30;
const ffprobe=path.resolve(root,'../meta-start-aplikacji/.tooling/node_modules/@ffprobe-installer/darwin-arm64/ffprobe');
const audio=path.resolve(root,'../meta-start-aplikacji/meta/audio/diecik-meta-launch-original.wav');
const web=path.resolve(root,'../Nagranie z ekranu 2026-09-29 o 15.59.18.mov');
const saved=[];
function run(args,label) {
  console.log(label);
  const p=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error',...args],{stdio:'inherit'});
  if(p.status!==0) throw new Error('ffmpeg failed: '+label);
}
function verifyVideoLength(file,duration,label) {
  const p=spawnSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=duration,nb_frames','-of','json',file],{encoding:'utf8'});
  if(p.status!==0) throw new Error('Cannot inspect '+label);
  const v=JSON.parse(p.stdout).streams[0];
  if(Number(v.nb_frames)!==Math.round(duration*FPS)||Math.abs(Number(v.duration)-duration)>0.04) {
    throw new Error(`Unexpected scene length: ${label}; ${v.nb_frames} frames, ${v.duration}s; expected ${duration}s.`);
  }
}
async function png(file,w,h,body) {await sharp(svg(w,h,body)).png().toFile(file);return file;}
async function imageScene(name,file,duration,w,h) {
  const out=path.join(work,name+'.mp4');
  run(['-loop','1','-i',file,'-vf',`scale=${w*2}:${h*2},zoompan=z='1.012+on*0.00013':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${Math.round(duration*FPS)}:s=${w}x${h}:fps=${FPS},fade=t=in:d=0.12,fade=t=out:st=${duration-.1}:d=0.1,format=yuv420p`,'-t',String(duration),'-an','-c:v','libx264','-preset','veryfast','-crf','17','-r',String(FPS),'-g','30','-keyint_min','30','-sc_threshold','0',out],name);
  verifyVideoLength(out,duration,name);
  return out;
}
async function proofScene(name,{media,still=false,start=0,duration=4,crop,heading,eyebrow='ULUBIONE POSIŁKI',caption='',dark=false,w=1080,h=1920,wide=false}) {
  const m=wide?100:76, top=wide?60:h===1350?50:275;
  const box=wide?{x:760,y:145,w:1060,h:720}:h===1350?{x:68,y:410,w:930,h:700}:{x:68,y:685,w:930,h:720};
  const base=await png(path.join(work,name+'-base.png'),w,h,`<rect width="${w}" height="${h}" fill="url(#${dark?'night':'pastel'})"/><circle cx="${w*.96}" cy="${h*.1}" r="${w*.4}" fill="#2563EB" opacity=".04"/><rect x="${box.x-5}" y="${box.y-5}" width="${box.w+10}" height="${box.h+10}" rx="24" fill="white" filter="url(#shadow)"/>`);
  let b=brand(m,top,{dark,size:wide?64:58})+txt(eyebrow,m,top+(wide?155:132),wide?26:23,dark?'#BCE5E9':C.blue,700,'letter-spacing="2"');
  const threeLines=heading.length>2;
  b+=lines(heading,m,top+(wide?300:threeLines?210:235),wide?75:threeLines?72:82,dark?C.white:C.ink,wide?88:threeLines?80:92);
  if(wide) {
    b+=txt(caption,m,850,28,dark?'#C7E9EB':C.muted,500);
    b+=txt('DEMO',m,950,23,dark?'#C7E9EB':C.muted,600,'letter-spacing="3"');
  } else {
    b+=txt(caption,m,box.y+box.h+58,30,dark?'#C7E9EB':C.muted,500);
    b+=txt('RZECZYWISTA APLIKACJA · DEMO',m,box.y+box.h+107,20,dark?'#C7E9EB':C.muted,600,'letter-spacing="1.5"');
  }
  const text=await png(path.join(work,name+'-type.png'),w,h,b);
  const out=path.join(work,name+'.mp4');
  const args=['-loop','1','-i',base];
  if(still) args.push('-loop','1','-i',media); else args.push('-ss',String(start),'-i',media);
  args.push('-loop','1','-i',text);
  const c=crop?`crop=${crop.width}:${crop.height}:${crop.left}:${crop.top},`:'';
  const filters=`[0:v]fps=30,format=yuv420p[base];[1:v]${c}scale=${box.w}:${box.h}:force_original_aspect_ratio=decrease,pad=${box.w}:${box.h}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=30,setpts=PTS-STARTPTS[ui];[2:v]format=rgba,fade=t=in:st=0:d=0.2:alpha=1[type];[base][ui]overlay=${box.x}:${box.y}:shortest=1[frame];[frame][type]overlay=0:0:shortest=1,format=yuv420p[out]`;
  args.push('-filter_complex',filters,'-map','[out]','-t',String(duration),'-an','-c:v','libx264','-preset','veryfast','-crf','17','-r','30','-g','30','-keyint_min','30','-sc_threshold','0',out);
  run(args,name);
  verifyVideoLength(out,duration,name);
  return out;
}
async function endCard(name,{w,h,duration,b2b=false,intro=false,leadForm=false}) {
  const wide=w>h, m=wide?140:76, top=wide?100:h===1350?60:285;
  let b=`<rect width="${w}" height="${h}" fill="url(#${b2b?'night':'pastel'})"/><circle cx="${w*.9}" cy="${h*.25}" r="${w*.5}" fill="${b2b?'#2563EB':'#155E75'}" opacity=".05"/>`;
  b+=brand(m,top,{dark:b2b,size:wide?90:72});
  b+=txt(b2b?'DLA DIETETYKÓW I TRENERÓW':'ULUBIONE POSIŁKI',m,top+(wide?235:190),wide?30:24,b2b?'#C7E9EB':C.blue,700,'letter-spacing="2"');
  b+=lines(b2b?['Od planu','do telefonu','klienta.']:['Zapisz raz.','Dodawaj','ponownie.'],m,top+(wide?360:360),wide?116:114,b2b?C.white:C.ink,wide?124:126);
  const y=wide?780:h===1350?1010:1310;
  if(!intro) {
    b+=button(leadForm?'Zobacz, jak to działa':b2b?'Zacznij bezpłatnie':'Wypróbuj za darmo',m,y,wide?590:570,wide?108:96,{dark:b2b});
    b+=txt(leadForm?'Umów prezentację panelu specjalisty.':b2b?'Do 2 aktywnych klientów. Bez karty.':'Do 3 ulubionych w planie darmowym.',m,y+150,34,b2b?'#C7E9EB':C.muted,500);
    b+=txt(b2b?'diecik.com/specjalista':'diecik.com',wide?1160:m,wide?900:y+215,wide?46:30,b2b?C.white:C.ink,700);
  }
  const im=await png(path.join(work,name+'.png'),w,h,b);
  return imageScene(name,im,duration,w,h);
}
async function assemble(name,segments,duration,cues,w,h) {
  const file=path.join(root,name), tmp=file.replace('.mp4','.rendering.mp4');
  await fs.mkdir(path.dirname(file),{recursive:true});
  const list=path.join(work,path.basename(file)+'.txt');
  await fs.writeFile(list,segments.map(p=>`file '${p.replaceAll("'","'\\''")}'`).join('\n'));
  run(['-f','concat','-safe','0','-i',list,'-stream_loop','-1','-i',audio,'-filter_complex',`[1:a]atrim=0:${duration},asetpts=PTS-STARTPTS,afade=t=in:d=0.28,afade=t=out:st=${duration-1.15}:d=1.15,loudnorm=I=-16:TP=-1.5:LRA=8[a]`,'-map','0:v','-map','[a]','-t',String(duration),'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',tmp], 'Final: '+name);
  verifyVideoLength(tmp,duration,name);
  await fs.rename(tmp,file);
  const time=t=>{const ms=Math.round(t*1000),sec=Math.floor(ms/1000);return `${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor(sec/60)%60).padStart(2,'0')}:${String(sec%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
  const srt=cues.map((c,i)=>`${i+1}\n${time(c[0])} --> ${time(c[1])}\n${c[2]}\n`).join('\n');
  await fs.writeFile(file.replace('.mp4','-pl.srt'),srt);
  saved.push({file:name,duration,width:w,height:h,fps:FPS,cues,embeddedText:true,srt:'optional transcription; do not overlay a duplicate subtitle track'});
}

const stage=process.argv[2]??'bumper';
if(stage==='bumper') {
  const hero=await png(path.join(work,'food-hook-6s.png'),1080,1920,await foodHero(1080,1920));
  const s=await imageScene('food-bumper',hero,6,1080,1920);
  await assemble('organic/b2c-ulubione-bumper-6s-1080x1920.mp4',[s],6,[[0,6,'Ulubione posiłki. Twój smak. Twój skrót. Zapisz raz. Dodawaj ponownie. Wypróbuj za darmo. Do 3 ulubionych w planie darmowym.']],1080,1920);
}
if(stage==='b2c') {
  const spec=JSON.parse(await fs.readFile(path.join(root,'sources/mobile/render-spec.json'),'utf8'));
  for(const [w,h,suffix] of [[1080,1920,'1080x1920'],[1080,1350,'1080x1350']]) {
    const first=await png(path.join(work,'b2c-hook-'+h+'.png'),w,h,await foodHero(w,h,{cta:false}));
    const seg=[await imageScene('b2c-hook-'+h,first,2.2,w,h)];
    seg.push(await proofScene('b2c-save-'+h,{...spec.save,media:path.join(root,spec.save.media),duration:3.4,heading:['1. Zapisz','posiłek.'],eyebrow:'ULUBIONE POSIŁKI',caption:'Twój zestaw produktów. Zachowane porcje.',w,h}));
    seg.push(await proofScene('b2c-list-'+h,{...spec.list,media:path.join(root,spec.list.media),duration:4.2,heading:['2. Wybierz','z ulubionych.'],eyebrow:'ULUBIONE POSIŁKI',caption:'Bez szukania produktów od początku.',w,h}));
    seg.push(await proofScene('b2c-added-'+h,{...spec.added,media:path.join(root,spec.added.media),duration:2.2,heading:['3. Dodaj','ponownie.'],eyebrow:'ULUBIONE POSIŁKI',caption:'Posiłek wraca do Twojego planu.',w,h}));
    seg.push(await endCard('b2c-end-'+h,{w,h,duration:3,b2b:false}));
    await assemble(`meta/b2c-ulubione-15s-${suffix}.mp4`,seg,15,[[0,2.2,'Ulubione posiłki. Twój smak. Twój skrót.'],[2.2,5.6,'1. Zapisz posiłek. Twój zestaw produktów. Zachowane porcje.'],[5.6,9.8,'2. Wybierz z ulubionych. Bez szukania produktów od początku.'],[9.8,12,'3. Dodaj ponownie. Posiłek wraca do Twojego planu.'],[12,15,'Zapisz raz. Dodawaj ponownie. Wypróbuj za darmo. Do 3 ulubionych w planie darmowym. diecik.com']],w,h);
    const firstB=await png(path.join(work,'b2c-hook-b-'+h+'.png'),w,h,await foodHero(w,h,{cta:false,variant:'secondary'}));
    const segB=[await imageScene('b2c-hook-b-'+h,firstB,2.2,w,h),...seg.slice(1)];
    await assemble(`meta/b2c-ulubione-hook-b-15s-${suffix}.mp4`,segB,15,[[0,2.2,'Ulubione posiłki. Lubisz ten posiłek? Zapisz raz. Dodawaj ponownie.'],[2.2,5.6,'1. Zapisz posiłek. Twój zestaw produktów. Zachowane porcje.'],[5.6,9.8,'2. Wybierz z ulubionych. Bez szukania produktów od początku.'],[9.8,12,'3. Dodaj ponownie. Posiłek wraca do Twojego planu.'],[12,15,'Zapisz raz. Dodawaj ponownie. Wypróbuj za darmo. Do 3 ulubionych w planie darmowym. diecik.com']],w,h);
  }
}
if(stage==='b2b') {
  const spec=JSON.parse(await fs.readFile(path.join(root,'sources/mobile/render-spec.json'),'utf8'));
  for(const [w,h,suffix,target] of [[1080,1920,'1080x1920','meta'],[1920,1080,'1920x1080','google']]) {
    const wide=w>h;
    const publishedCrop=wide?{left:210,top:160,width:1430,height:570}:{left:216,top:160,width:450,height:175};
    const hero=await endCard('b2b-hook-'+h,{w,h,duration:2.2,b2b:true,intro:true});
    const seg=[hero];
    seg.push(await proofScene('b2b-diet-'+h,{media:web,start:181,duration:5,heading:wide?['Przygotuj','plan diety.']:['Przygotuj','plan diety.'],eyebrow:'PANEL SPECJALISTY',caption:'Posiłki, porcje i wartości odżywcze.',crop:{left:238,top:246,width:1080,height:590},dark:true,w,h,wide}));
    seg.push(await proofScene('b2b-published-'+h,{media:path.join(root,'sources/web/panel-result-215s.png'),still:true,duration:3.4,heading:['Opublikuj','w aplikacji.'],eyebrow:'PANEL SPECJALISTY',caption:'Rzeczywisty status opublikowanego planu.',crop:publishedCrop,dark:true,w,h,wide}));
    seg.push(await proofScene('b2b-client-'+h,{...spec.specialist,media:path.join(root,spec.specialist.media),duration:5.4,heading:['Plan pod ręką','klienta.'],eyebrow:'APLIKACJA KLIENTA',caption:'DEMO · osobny przykład klienta',dark:true,w,h,wide}));
    seg.push(await endCard('b2b-end-'+h,{w,h,duration:4,b2b:true}));
    await assemble(`${target}/b2b-publikacja-20s-${suffix}.mp4`,seg,20,[[0,2.2,'Od planu do telefonu klienta.'],[2.2,7.2,'Przygotuj plan diety. Posiłki, porcje i wartości odżywcze.'],[7.2,10.6,'Opublikuj w aplikacji. Rzeczywisty status opublikowanego planu.'],[10.6,16,'Plan pod ręką klienta. Przykładowy widok klienta. DEMO.'],[16,20,'Zacznij bezpłatnie. Do 2 aktywnych klientów. Bez karty. diecik.com/specjalista']],w,h);
    if(!wide) {
      const hookB=await proofScene('b2b-hook-b-'+h,{media:path.join(root,'sources/web/panel-result-215s.png'),still:true,duration:2.2,heading:['Plan gotowy.','Klient ma go','pod ręką.'],eyebrow:'DLA DIETETYKÓW I TRENERÓW',caption:'Publikacja w aplikacji klienta.',crop:publishedCrop,dark:true,w,h});
      await assemble(`meta/b2b-publikacja-hook-b-20s-${suffix}.mp4`,[hookB,...seg.slice(1)],20,[[0,2.2,'Plan gotowy. Klient ma go pod ręką.'],[2.2,7.2,'Przygotuj plan diety. Posiłki, porcje i wartości odżywcze.'],[7.2,10.6,'Opublikuj w aplikacji. Rzeczywisty status opublikowanego planu.'],[10.6,16,'Plan pod ręką klienta. DEMO, osobny przykład klienta.'],[16,20,'Zacznij bezpłatnie. Do 2 aktywnych klientów. Bez karty. diecik.com/specjalista']],w,h);
      const leadEnd=await endCard('b2b-lead-end-'+h,{w,h,duration:4,b2b:true,leadForm:true});
      const leadCues=[[0,2.2,'Od planu do telefonu klienta.'],[2.2,7.2,'Przygotuj plan diety. Posiłki, porcje i wartości odżywcze.'],[7.2,10.6,'Opublikuj w aplikacji. Rzeczywisty status opublikowanego planu.'],[10.6,16,'Plan pod ręką klienta. DEMO, osobny przykład klienta.'],[16,20,'Zobacz, jak to działa. Umów prezentację panelu specjalisty. diecik.com/specjalista']];
      await assemble(`meta/b2b-prezentacja-20s-${suffix}.mp4`,[...seg.slice(0,-1),leadEnd],20,leadCues,w,h);
      await assemble(`meta/b2b-prezentacja-hook-b-20s-${suffix}.mp4`,[hookB,...seg.slice(1,-1),leadEnd],20,[[0,2.2,'Plan gotowy. Klient ma go pod ręką.'],...leadCues.slice(1)],w,h);
    }
  }
}
await fs.writeFile(path.join(root,'qa/video-'+stage+'-manifest.json'),JSON.stringify(saved,null,2));
console.log('Finished '+stage+'.');
