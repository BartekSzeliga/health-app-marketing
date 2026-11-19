import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "../../../exports/app-store/ios-2026-07-17/.tooling/node_modules/sharp/dist/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "../../..");
const ffmpeg = path.join(
  workspace,
  "exports/app-store/ios-2026-07-17/.tooling/node_modules/ffmpeg-static/ffmpeg",
);
const logoPath = path.join(
  workspace,
  "marketing/reklamy/meta-start-aplikacji/sources/diecik-logo.png",
);
const mobileDietPath = path.join(
  workspace,
  "marketing/reklamy/meta-start-aplikacji/sources/mobile/diet-plan-ready.png",
);
const musicPath = path.join(
  workspace,
  "marketing/reklamy/meta-start-aplikacji/meta/audio/diecik-meta-launch-original.wav",
);
const out = path.join(here, "output");
const build = path.join(here, ".build");
const scenesDir = path.join(build, "scenes");
const clipsDir = path.join(build, "clips");
const W = 1920;
const H = 1080;
const FPS = 30;
const sceneDuration = 8;
const transition = 0.6;
const finalDuration = 8 * sceneDuration - 7 * transition;

const c = {
  ink: "#14213D",
  ocean: "#155E75",
  green: "#43A047",
  lime: "#8BC53F",
  mint: "#EAF6F3",
  blue: "#E8F4FB",
  white: "#FFFFFF",
  warm: "#EA580C",
  soft: "#607085",
  line: "#D9E5E8",
  bg: "#F7FBFA",
};

const narration = `Układanie planów dla klientów nie powinno oznaczać kolejnych arkuszy, wiadomości i ręcznego przepisywania. W Diecik prowadzisz cały proces w jednym panelu specjalisty. Dodajesz klienta i od razu widzisz jego cel, zapotrzebowanie oraz historię współpracy. Dla Joanny przygotowaliśmy demonstracyjny pakiet na siedem dni. Każdy dzień ma pięć posiłków, wyliczone kalorie i makroskładniki, a plan możesz edytować i budować z własnych przepisów, produktów oraz szablonów. Gotowy pakiet sprawdzasz w podglądzie, zapisujesz jako PDF albo publikujesz w aplikacji klienta. Kolejne wersje, notatki i cały kontekst pracy pozostają w jednym miejscu. Diecik pomaga uporządkować obsługę klientów i oszczędzić czas, bez odbierania Ci kontroli nad planem. Umów krótką prezentację Diecik dla specjalistów.`;

await Promise.all([out, scenesDir, clipsDir].map((dir) => fs.mkdir(dir, { recursive: true })));

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(lines, x, y, size, options = {}) {
  const {
    fill = c.ink,
    weight = 700,
    lineHeight = Math.round(size * 1.18),
    anchor = "start",
    letterSpacing = 0,
  } = options;
  return lines
    .map(
      (line, index) =>
        `<text class="sans" x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${fill}">${esc(line)}</text>`,
    )
    .join("");
}

function pill(x, y, width, label, fill = c.ocean, color = c.white) {
  return `<rect x="${x}" y="${y}" width="${width}" height="48" rx="24" fill="${fill}"/><text class="sans" x="${x + width / 2}" y="${y + 32}" text-anchor="middle" font-size="19" font-weight="800" letter-spacing="1.1" fill="${color}">${esc(label)}</text>`;
}

function card(x, y, width, height, body, options = {}) {
  return `<g><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${options.radius ?? 28}" fill="${options.fill ?? c.white}" stroke="${options.stroke ?? c.line}" stroke-width="${options.strokeWidth ?? 1}" filter="url(#shadow)"/>${body}</g>`;
}

function base(body, dark = false) {
  return Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".58" stop-color="#F1FAF7"/><stop offset="1" stop-color="#E3F3F6"/></linearGradient>
    <linearGradient id="dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10213C"/><stop offset=".58" stop-color="#155E75"/><stop offset="1" stop-color="#318B82"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="17" flood-color="#14213D" flood-opacity=".12"/></filter>
  </defs>
  <style>.sans{font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif}</style>
  <rect width="${W}" height="${H}" fill="url(#${dark ? "dark" : "light"})"/>
  ${body}
  <text class="sans" x="1840" y="1034" text-anchor="end" font-size="18" font-weight="700" fill="${dark ? "#D6F6ED" : c.soft}">DEMO • DANE FIKCYJNE</text>
  </svg>`);
}

async function logo(size) {
  return sharp(logoPath).resize(size, size, { fit: "contain" }).png().toBuffer();
}

async function render(name, svgBuffer, composites = []) {
  const file = path.join(scenesDir, `${name}.png`);
  await sharp(svgBuffer).composite(composites).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

const brand = await logo(110);

const scenes = [];
scenes.push(
  await render(
    "01-intro",
    base(
      `<circle cx="1550" cy="140" r="440" fill="${c.lime}" opacity=".14"/><circle cx="260" cy="1030" r="420" fill="#72D4C0" opacity=".15"/>
      <rect x="150" y="164" width="134" height="134" rx="36" fill="#fff" opacity=".98"/>
      ${pill(150, 344, 362, "DIECIK DLA SPECJALISTÓW", c.lime, c.ink)}
      ${text(["Klient i cały tydzień", "w jednym procesie."], 150, 500, 78, { fill: c.white, weight: 900, lineHeight: 92 })}
      ${text(["Dieta • szablony • PDF • historia współpracy"], 154, 720, 30, { fill: "#DDF7EF", weight: 600 })}
      <rect x="150" y="782" width="430" height="9" rx="5" fill="${c.lime}"/>`,
      true,
    ),
    [{ input: brand, left: 162, top: 176 }],
  ),
);

const nav = `<rect x="90" y="72" width="300" height="936" rx="34" fill="#F1F8F6"/><circle cx="155" cy="145" r="38" fill="#fff"/><text class="sans" x="215" y="158" font-size="28" font-weight="850" fill="${c.ink}">Diecik</text>
${["Panel", "Klienci", "Pakiety", "Szablony diet", "Przepisy", "Produkty"].map((item, i) => `<rect x="122" y="${240 + i * 92}" width="236" height="62" rx="18" fill="${i === 0 ? c.ocean : "transparent"}"/><text class="sans" x="154" y="${280 + i * 92}" font-size="22" font-weight="${i === 0 ? 800 : 650}" fill="${i === 0 ? c.white : c.ink}">${item}</text>`).join("")}`;
scenes.push(
  await render(
    "02-panel",
    base(`${nav}${pill(450, 92, 270, "PANEL SPECJALISTY")}${text(["Wszystko, czego potrzebujesz", "do prowadzenia klienta."], 450, 220, 52, { weight: 900, lineHeight: 62 })}
    ${card(450, 390, 360, 200, `${text(["1 / 2"], 490, 475, 58, { fill: c.ocean, weight: 900 })}${text(["aktywnych klientów"], 490, 530, 23, { fill: c.soft, weight: 650 })}`)}
    ${card(840, 390, 360, 200, `${text(["17"], 880, 475, 58, { fill: c.green, weight: 900 })}${text(["szablonów planów"], 880, 530, 23, { fill: c.soft, weight: 650 })}`)}
    ${card(1230, 390, 360, 200, `${text(["7 dni"], 1270, 475, 58, { fill: c.warm, weight: 900 })}${text(["gotowego pakietu"], 1270, 530, 23, { fill: c.soft, weight: 650 })}`)}
    ${card(450, 640, 1140, 245, `<circle cx="530" cy="730" r="48" fill="${c.mint}"/><text class="sans" x="530" y="742" text-anchor="middle" font-size="28" font-weight="850" fill="${c.ocean}">JW</text>${text(["Joanna Wysocka (DEMO)"], 610, 710, 30, { weight: 850 })}${text(["Cel: regularność posiłków i obserwacja glikemii"], 610, 754, 21, { fill: c.soft, weight: 600 })}${pill(610, 795, 136, "7 DNI", c.mint, c.ocean)}${pill(765, 795, 170, "5 POSIŁKÓW", c.blue, c.ocean)}<rect x="1380" y="720" width="150" height="54" rx="18" fill="${c.ocean}"/><text class="sans" x="1455" y="755" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">Otwórz</text>`)} `),
  ),
);

scenes.push(
  await render(
    "03-klient",
    base(`${pill(120, 90, 208, "KARTA KLIENTA")}${text(["Kontekst przed planowaniem."], 120, 218, 56, { weight: 900 })}
    ${card(120, 320, 650, 610, `${text(["Joanna Wysocka (DEMO)"], 170, 405, 35, { weight: 880 })}${text(["Fikcyjny profil demonstracyjny"], 170, 448, 20, { fill: c.soft, weight: 600 })}
      ${[["46 lat", "wiek"], ["78,4 kg", "masa ciała"], ["168 cm", "wzrost"], ["Lekka", "aktywność"]].map(([value, label], i) => `<rect x="${170 + (i % 2) * 280}" y="${510 + Math.floor(i / 2) * 145}" width="250" height="116" rx="22" fill="${i % 2 ? c.blue : c.mint}"/><text class="sans" x="${195 + (i % 2) * 280}" y="${558 + Math.floor(i / 2) * 145}" font-size="29" font-weight="850" fill="${c.ink}">${value}</text><text class="sans" x="${195 + (i % 2) * 280}" y="${592 + Math.floor(i / 2) * 145}" font-size="18" font-weight="650" fill="${c.soft}">${label}</text>`).join("")}
      ${pill(170, 810, 220, "DANE FIKCYJNE", c.lime, c.ink)}`)}
    ${card(820, 320, 970, 280, `${text(["Cel dzienny"], 875, 390, 24, { fill: c.soft, weight: 700 })}${text(["1800 kcal"], 875, 468, 58, { fill: c.ocean, weight: 900 })}${text(["Białko 100 g   •   Węglowodany 200 g   •   Tłuszcze 67 g"], 875, 530, 23, { weight: 720 })}`)}
    ${card(820, 640, 970, 290, `${text(["Historia współpracy"], 875, 710, 27, { weight: 850 })}${["Konsultacja wstępna", "Omówienie dzienniczka", "Pakiet 7-dniowy gotowy do podglądu"].map((item, i) => `<circle cx="895" cy="${770 + i * 58}" r="8" fill="${i === 2 ? c.green : c.ocean}"/><text class="sans" x="925" y="${778 + i * 58}" font-size="21" font-weight="650" fill="${c.ink}">${item}</text>`).join("")}`)}`),
  ),
);

const dayNames = ["Start", "Błonnik", "Białko", "Warzywa", "Zboża", "Ryba", "Roślinne"];
scenes.push(
  await render(
    "04-tydzien",
    base(`${pill(110, 88, 268, "PAKIET 7-DNIOWY")}${text(["Cały tydzień. Jeden czytelny widok."], 110, 208, 54, { weight: 900 })}
    ${dayNames.map((name, i) => card(110 + i * 245, 330, 215, 425, `<rect x="${110 + i * 245}" y="330" width="215" height="86" rx="28" fill="${i === 0 ? c.ocean : i === 6 ? c.green : c.mint}"/><text class="sans" x="${217.5 + i * 245}" y="375" text-anchor="middle" font-size="18" font-weight="800" fill="${i === 0 || i === 6 ? c.white : c.ocean}">DZIEŃ ${i + 1}</text><text class="sans" x="${217.5 + i * 245}" y="455" text-anchor="middle" font-size="24" font-weight="850" fill="${c.ink}">${name}</text>${[0, 1, 2, 3, 4].map((m) => `<rect x="${140 + i * 245}" y="${500 + m * 45}" width="155" height="18" rx="9" fill="${m === 2 ? c.lime : c.blue}"/>`).join("")}<text class="sans" x="${217.5 + i * 245}" y="715" text-anchor="middle" font-size="18" font-weight="700" fill="${c.soft}">5 posiłków</text>`, { radius: 28 })).join("")}
    ${card(110, 810, 1685, 120, `${text(["Poniedziałek — niedziela"], 160, 872, 25, { weight: 850 })}${text(["35 uporządkowanych posiłków • gotowe do dalszej edycji"], 700, 872, 25, { fill: c.soft, weight: 650 })}${pill(1570, 846, 165, "GOTOWE", c.green)}`)}`),
  ),
);

scenes.push(
  await render(
    "05-dzien",
    base(`${pill(110, 86, 320, "DZIEŃ W SZCZEGÓŁACH")}${text(["Posiłki i makro pod kontrolą."], 110, 205, 56, { weight: 900 })}
    ${card(110, 310, 1030, 620, `${text(["Dzień 1 — regularny start"], 160, 382, 31, { weight: 880 })}${["Śniadanie — Szakszuka z białą fasolą", "Drugie śniadanie — Jogurt z owocami", "Obiad — Łosoś, kasza i brokuł", "Podwieczorek — Jabłko z masłem orzechowym", "Kolacja — Sałatka z tuńczykiem i ryżem"].map((item, i) => `<rect x="160" y="${430 + i * 88}" width="930" height="68" rx="18" fill="${i === 2 ? c.mint : "#F7FAFB"}"/><circle cx="195" cy="${464 + i * 88}" r="12" fill="${i === 2 ? c.green : c.ocean}"/><text class="sans" x="225" y="${472 + i * 88}" font-size="20" font-weight="680" fill="${c.ink}">${esc(item)}</text>`).join("")}`)}
    ${card(1190, 310, 605, 620, `${text(["Cel klienta"], 1240, 380, 23, { fill: c.soft, weight: 700 })}${text(["1800 kcal"], 1240, 455, 52, { fill: c.ocean, weight: 900 })}${[["Białko", "100 g", .78, c.green], ["Węglowodany", "200 g", .68, c.ocean], ["Tłuszcze", "67 g", .72, c.warm], ["Błonnik", "30 g", .84, c.lime]].map(([label, value, width, color], i) => `${text([label], 1240, 540 + i * 92, 19, { fill: c.soft, weight: 650 })}${text([value], 1715, 540 + i * 92, 19, { fill: c.ink, weight: 800, anchor: "end" })}<rect x="1240" y="${560 + i * 92}" width="475" height="14" rx="7" fill="#E7EEF0"/><rect x="1240" y="${560 + i * 92}" width="${Math.round(475 * width)}" height="14" rx="7" fill="${color}"/>`).join("")}`)}`),
  ),
);

const templateNames = ["Sercowo-metaboliczna", "Stabilna glikemia", "Łagodna organizacja", "Wsparcie jelit", "Bezglutenowa", "Ochrona mięśni"];
scenes.push(
  await render(
    "06-szablony",
    base(`${pill(110, 86, 310, "SZABLONY 7-DNIOWE")}${text(["Gotowy punkt wyjścia. Pełna kontrola specjalisty."], 110, 205, 51, { weight: 900 })}
    ${templateNames.map((name, i) => card(110 + (i % 3) * 570, 325 + Math.floor(i / 3) * 290, 530, 250, `<rect x="${110 + (i % 3) * 570}" y="${325 + Math.floor(i / 3) * 290}" width="14" height="250" rx="7" fill="${[c.ocean, c.green, c.warm, c.lime, "#6D5ACF", "#C44F75"][i]}"/>${text([name], 155 + (i % 3) * 570, 402 + Math.floor(i / 3) * 290, 27, { weight: 860 })}${text(["7 dni • 35 posiłków"], 155 + (i % 3) * 570, 455 + Math.floor(i / 3) * 290, 20, { fill: c.soft, weight: 680 })}${pill(155 + (i % 3) * 570, 492 + Math.floor(i / 3) * 290, 158, "DEMO • RANGE", c.mint, c.ocean)}${text(["Edytowalny plan"], 350 + (i % 3) * 570, 525 + Math.floor(i / 3) * 290, 18, { fill: c.soft, weight: 650 })}`)).join("")}`),
  ),
);

const phone = await sharp(mobileDietPath).resize(310, 675, { fit: "cover", position: "top" }).png().toBuffer();
scenes.push(
  await render(
    "07-publikacja",
    base(`${pill(110, 86, 330, "OD PLANU DO KLIENTA")}${text(["Sprawdź. Zapisz. Przekaż."], 110, 205, 56, { weight: 900 })}
    ${["Podgląd pakietu", "PDF z planem", "Publikacja", "Historia wersji"].map((item, i) => `<circle cx="210" cy="${390 + i * 132}" r="34" fill="${i === 3 ? c.green : c.ocean}"/><text class="sans" x="210" y="${400 + i * 132}" text-anchor="middle" font-size="22" font-weight="850" fill="#fff">${i + 1}</text><line x1="210" y1="${424 + i * 132}" x2="210" y2="${488 + i * 132}" stroke="${c.line}" stroke-width="6"/><text class="sans" x="275" y="${399 + i * 132}" font-size="28" font-weight="850" fill="${c.ink}">${item}</text><text class="sans" x="275" y="${435 + i * 132}" font-size="19" font-weight="600" fill="${c.soft}">${["Weryfikacja 7 dni przed przekazaniem", "Czytelny dokument dla klienta", "Plan dostępny w aplikacji", "Kontekst kolejnych zmian"][i]}</text>`).join("")}
    <rect x="1190" y="265" width="390" height="760" rx="62" fill="#fff" filter="url(#shadow)"/><rect x="1208" y="283" width="354" height="724" rx="48" fill="#14213D"/>${text(["Czytelny plan", "po stronie klienta"], 1080, 520, 38, { anchor: "end", weight: 880 })}${text(["Ten sam tydzień.", "Bez przepisywania."], 1080, 642, 25, { anchor: "end", fill: c.soft, weight: 650 })}`),
    [{ input: phone, left: 1230, top: 310 }],
  ),
);

scenes.push(
  await render(
    "08-cta",
    base(`<circle cx="1540" cy="170" r="460" fill="${c.lime}" opacity=".16"/><circle cx="260" cy="1030" r="430" fill="#7DE1CB" opacity=".13"/>
      <rect x="150" y="140" width="134" height="134" rx="36" fill="#fff"/>
      ${pill(150, 330, 318, "DIECIK DLA DIETETYKÓW", c.lime, c.ink)}
      ${text(["Mniej powtarzalnej pracy.", "Więcej czasu dla klienta."], 150, 490, 68, { fill: c.white, weight: 900, lineHeight: 82 })}
      <rect x="150" y="720" width="720" height="88" rx="28" fill="#fff"/><text class="sans" x="510" y="776" text-anchor="middle" font-size="29" font-weight="880" fill="${c.ocean}">Umów krótką prezentację Diecik</text>
      ${text(["diecik.pl"], 154, 890, 30, { fill: "#DDF7EF", weight: 750 })}`,
      true,
    ),
    [{ input: brand, left: 162, top: 152 }],
  ),
);

for (let index = 0; index < scenes.length; index += 1) {
  const clip = path.join(clipsDir, `${String(index + 1).padStart(2, "0")}.mp4`);
  execFileSync(ffmpeg, [
    "-y", "-loop", "1", "-i", scenes[index], "-t", String(sceneDuration),
    "-vf", `scale=2304:1296,zoompan=z='min(zoom+0.00010,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${sceneDuration * FPS}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
    "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-r", String(FPS), clip,
  ], { stdio: "inherit" });
}

const xfadeInputs = scenes.flatMap((_, index) => ["-i", path.join(clipsDir, `${String(index + 1).padStart(2, "0")}.mp4`)]);
let filter = "";
for (let index = 1; index < scenes.length; index += 1) {
  const left = index === 1 ? "[0:v]" : `[v${index - 1}]`;
  const offset = (sceneDuration - transition) * index;
  filter += `${left}[${index}:v]xfade=transition=fade:duration=${transition}:offset=${offset.toFixed(1)}[v${index}]${index === scenes.length - 1 ? "" : ";"}`;
}
const silentVideo = path.join(build, "promo-silent.mp4");
execFileSync(ffmpeg, ["-y", ...xfadeInputs, "-filter_complex", filter, "-map", `[v${scenes.length - 1}]`, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS), silentVideo], { stdio: "inherit" });

const narrationAiff = path.join(build, "narration.aiff");
execFileSync("/usr/bin/say", ["-v", "Zosia", "-r", "165", "-o", narrationAiff, narration]);

const master = path.join(out, "diecik-dla-dietetykow-youtube-60s.mp4");
execFileSync(ffmpeg, [
  "-y", "-i", silentVideo, "-i", narrationAiff, "-stream_loop", "-1", "-i", musicPath,
  "-filter_complex", `[1:a]adelay=1200|1200,volume=1.15[n];[2:a]volume=0.075,afade=t=out:st=56:d=3[m];[n][m]amix=inputs=2:duration=longest:dropout_transition=2,loudnorm=I=-14:TP=-1.5:LRA=9[a]`,
  "-map", "0:v:0", "-map", "[a]", "-t", finalDuration.toFixed(1),
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", master,
], { stdio: "inherit" });

const thumbnail = path.join(out, "diecik-dla-dietetykow-thumbnail-1280x720.jpg");
await sharp(scenes[0]).resize(1280, 720).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(thumbnail);

const contact = await sharp({
  create: { width: 960, height: 1080, channels: 4, background: "#F7FBFA" },
}).composite(await Promise.all(scenes.map(async (scene, index) => ({
  input: await sharp(scene).resize(480, 270).png().toBuffer(),
  left: (index % 2) * 480,
  top: Math.floor(index / 2) * 270,
})))).png().toBuffer();
await fs.writeFile(path.join(out, "contact-sheet.png"), contact);

console.log(JSON.stringify({ master, thumbnail, duration: finalDuration, scenes: scenes.length }, null, 2));
