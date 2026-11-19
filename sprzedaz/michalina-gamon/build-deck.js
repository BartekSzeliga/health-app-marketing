const pptxgen = require("./node_modules/pptxgenjs");
const { applyTheme } = require("/Users/bartoszszeliga/.claude/skills/synced/69f83318-c342-4f31-bad7-fc271b51f434_f22f5fc4-741e-4b81-800d-ae99de8db651/pptx/scripts/apply_theme.js");
const path = require("path");
const IMG = (f) => path.join(__dirname, "img", f);
const OUT = process.argv[2];

const THEME = {
  name: "Michalina Gamoń",
  headFontFace: "Georgia",
  bodyFontFace: "Arial",
  colors: {
    dk1: "12221B", lt1: "FFFFFF", dk2: "0A2A1F", lt2: "ECFDF5",
    accent1: "047857", accent2: "A7F3D0", accent3: "D1FAE5", accent4: "F59E0B",
    accent5: "065F46", accent6: "5B6B63", hlink: "047857", folHlink: "065F46",
  },
};
const HEX = { deep: "0A2A1F", green: "047857", mint: "D1FAE5", mint2: "A7F3D0", ink: "12221B", muted: "5B6B63", soft: "ECFDF5", amber: "F59E0B" };

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Diecik";
pres.title = "Michalina Gamoń – aplikacja pod Twoją marką";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "DARK",
  background: { color: C.text2 },
  objects: [{ image: { path: IMG("logo.png"), x: 0.6, y: 0.5, w: 0.55, h: 0.55 } }],
  slideNumber: { x: 12.4, y: 6.95, w: 0.5, h: 0.3, color: C.accent2, fontSize: 10 },
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { image: { path: IMG("logo.png"), x: 12.2, y: 0.45, w: 0.5, h: 0.5 } },
    { text: { text: "Michalina Gamoń · Dietetyk", options: { x: 0.6, y: 6.95, w: 6, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: 12.4, y: 6.95, w: 0.5, h: 0.3, color: C.accent6, fontSize: 10 },
});

function title(slide, text) {
  slide.addText(text, { x: 0.6, y: 0.45, w: 11.2, h: 0.9, fontFace: "Georgia", fontSize: 30, bold: true, color: C.text2, valign: "top", margin: 0, isTextBox: true, objectName: "title" });
}
function point(slide, n, x, y, w, head, body, dark = false) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: dark ? C.accent2 : C.accent1 }, objectName: `num-${n}` });
  slide.addText(String(n), { x, y, w: 0.5, h: 0.5, align: "center", valign: "middle", fontSize: 16, bold: true, color: dark ? C.text2 : C.background1, margin: 0, isTextBox: true });
  slide.addText(head, { x: x + 0.75, y: y - 0.02, w: w - 0.75, h: 0.4, fontSize: 18, bold: true, color: dark ? C.background1 : C.text2, margin: 0, isTextBox: true });
  slide.addText(body, { x: x + 0.75, y: y + 0.42, w: w - 0.75, h: 0.8, fontSize: 14, color: dark ? C.accent3 : C.accent6, margin: 0, valign: "top", isTextBox: true });
}
function phone(slide, file, x, y, h) { // mockup aspect 814x1570
  slide.addImage({ path: IMG(file), x, y, h, w: h * 814 / 1570 });
}

// 1. Title
pres.addSection({ title: "Wstęp" });
let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wstęp" });
s.addText("PROPOZYCJA DLA MICHALINY GAMOŃ", { x: 0.6, y: 1.6, w: 6.4, h: 0.4, fontSize: 13, bold: true, color: C.accent2, charSpacing: 3, margin: 0, isTextBox: true });
s.addText("Twoja poradnia w telefonie każdego pacjenta", { x: 0.6, y: 2.1, w: 6.4, h: 2.0, fontFace: "Georgia", fontSize: 40, bold: true, color: C.background1, valign: "top", margin: 0, isTextBox: true });
s.addText("Własna aplikacja z Twoim logo: jadłospis, przepisy, postępy, ankiety i kontakt z Tobą", { x: 0.6, y: 4.25, w: 6.0, h: 1.0, fontSize: 17, color: C.accent3, valign: "top", margin: 0, isTextBox: true });
s.addText("Ekrany z wersji demonstracyjnej w Twojej marce. Logo MG to nasza propozycja, podmienimy je na Twoje.", { x: 0.6, y: 5.5, w: 5.8, h: 0.7, fontSize: 12, color: C.accent2, valign: "top", margin: 0, isTextBox: true });
s.addText("Listopad 2026", { x: 0.6, y: 6.6, w: 3, h: 0.35, fontSize: 12, color: C.accent2, margin: 0, isTextBox: true });
s.addImage({ path: IMG("hero.png"), x: 6.5, y: 0.9, h: 5.7, w: 5.7 * 1790 / 1570 });
s.addNotes("Otwarcie: aplikacja z jej nazwiskiem i logo, którą pacjent ma codziennie w telefonie. Ekrany są prawdziwe, z wersji demonstracyjnej w jej marce.");

// 3. Own brand vs someone else's app
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Wstęp" });
title(s, "Twoja marka zamiast cudzej aplikacji");
const cols = [
  ["Aplikacja z cudzym logo", C.background2, C.text2, [
    "Pacjent pobiera aplikację innej marki",
    "Na ekranie telefonu widzi logo dostawcy, nie Twoje",
    "Funkcje i wygląd ustala dostawca",
    "Dostęp do aplikacji bywa dla pacjenta dodatkowo płatny",
  ]],
  ["Aplikacja Michalina Gamoń", C.text2, C.background1, [
    "Twoja nazwa i ikona w App Store i Google Play",
    "Twoje logo i kolory codziennie na ekranie pacjenta",
    "Sama decydujesz, co pacjent widzi w aplikacji",
    "Pacjent nie płaci za aplikację",
  ]],
];
cols.forEach(([head, bg, fg, items], i) => {
  const x = 0.6 + i * 6.15;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: 5.9, h: 4.6, rectRadius: 0.2, fill: { color: bg }, line: { color: i ? C.text2 : C.accent3, width: 1 }, objectName: `col-${i}` });
  s.addText(head, { x: x + 0.45, y: 2.1, w: 5.0, h: 0.5, fontFace: "Georgia", fontSize: 22, bold: true, color: i ? C.accent2 : C.text2, margin: 0, isTextBox: true });
  s.addText(items.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < items.length - 1 } })), { x: x + 0.45, y: 2.8, w: 5.0, h: 3.3, fontSize: 16, color: fg, paraSpaceAfter: 12, valign: "top", margin: 0, isTextBox: true });
});
s.addNotes("Pacjenci już korzystają z aplikacji. Różnica: czyja marka jest na ekranie i kto decyduje o funkcjach.");

pres.addSection({ title: "Aplikacja" });
// 5. Diet
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Aplikacja" });
title(s, "Jadłospis od Ciebie zawsze pod ręką");
phone(s, "phone-diet.png", 0.7, 1.45, 5.4);
point(s, 1, 4.4, 2.0, 7.6, "Dieta dzień po dniu", "Posiłki, gramatury, kalorie i makro z Twojego planu, bez przepisywania z PDF.");
point(s, 2, 4.4, 3.45, 7.6, "Przepisy i lista zakupów", "Przepis krok po kroku przy każdym posiłku i lista zakupów z wybranych dni.");
point(s, 3, 4.4, 4.9, 7.6, "Dokładnie to, co ustaliłyście", "Pacjent widzi plan tylko do odczytu. Zmiany wprowadzasz Ty, a dla pary ułożysz wspólny jadłospis z osobnymi porcjami.");

// 6. Progress
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Aplikacja" });
title(s, "Efekty widać także między wizytami");
point(s, 1, 0.7, 2.0, 7.4, "Pomiary od pacjenta i z gabinetu", "Masa ciała, obwody i skład ciała w jednym miejscu, w kolorach Twojej marki.");
point(s, 2, 0.7, 3.45, 7.4, "Wykres zamiast domysłów", "Przed wizytą widzisz trend, a pacjent widzi swój postęp i ma motywację.");
point(s, 3, 0.7, 4.9, 7.4, "Pacjent decyduje o udostępnianiu", "Zgody na dane zdrowotne pacjent wyraża w aplikacji i może je w każdej chwili zmienić.");
phone(s, "phone-progress.png", 9.2, 1.45, 5.4);

// 7. Questionnaires
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Aplikacja" });
title(s, "Wywiad przed wizytą, check-in po niej");
phone(s, "phone-questionnaires.png", 0.7, 1.45, 5.4);
point(s, 1, 4.4, 2.0, 7.6, "Wywiad żywieniowy w aplikacji", "Pacjent wypełnia ankietę przed pierwszą konsultacją, a Ty zaczynasz wizytę z kompletem informacji.");
point(s, 2, 4.4, 3.45, 7.6, "Cotygodniowy check-in", "Krótkie pytania o samopoczucie, głód, energię i trudności, szczególnie ważne przy insulinooporności.");
point(s, 3, 4.4, 4.9, 7.6, "Własne szablony ankiet", "Raz przygotowane ankiety wysyłasz kolejnym pacjentom jednym kliknięciem.");

// 7b. What the patient sees
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Aplikacja" });
title(s, "Ty decydujesz, co widzi pacjent");
s.addImage({ path: IMG("panel-features-card.png"), x: 0.45, y: 1.4, h: 4.95, w: 4.95 * 840 / 595 });
s.addText("Prawdziwy panel: Firma → Aplikacja mobilna", { x: 0.6, y: 6.4, w: 7.3, h: 0.3, fontSize: 11, color: C.accent6, margin: 0, isTextBox: true });
const decide = [
  ["Moduły dla całej poradni", "Dieta, przepisy, zakupy, postępy, ankiety, czat, wizyty. Czego nie prowadzisz, np. treningów, pacjent nie zobaczy."],
  ["Wyjątki dla jednego pacjenta", "Na karcie pacjenta zmienisz ustawienia tylko dla niego, np. ukryjesz kalorie."],
  ["Twój pasek zakładek", "Do 4 zakładek w Twojej kolejności, np. Dieta, Postępy, Ankiety, Czat."],
];
decide.forEach(([h, b], i) => {
  const y = 1.6 + i * 1.6;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.35, y, w: 4.35, h: 1.42, rectRadius: 0.15, fill: { color: i === 0 ? C.text2 : C.background2 }, line: { color: C.accent3, width: 1 }, objectName: `decide-${i}` });
  s.addText(h, { x: 8.6, y: y + 0.15, w: 3.9, h: 0.4, fontSize: 16, bold: true, color: i === 0 ? C.accent2 : C.text2, margin: 0, isTextBox: true });
  s.addText(b, { x: 8.6, y: y + 0.55, w: 3.9, h: 0.8, fontSize: 14, color: i === 0 ? C.background1 : C.accent6, valign: "top", margin: 0, isTextBox: true });
});
s.addNotes("Kluczowa przewaga: dietetyczka sama ustala, co pacjent widzi. Wyłączone moduły (np. treningi) znikają z aplikacji.");

// 8. Panel
pres.addSection({ title: "Praca dietetyka" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Praca dietetyka" });
title(s, "Ty w panelu, pacjent od razu widzi efekt");
s.addImage({ path: IMG("specialist-meal-planning-20261109.png"), x: 0.6, y: 1.6, w: 7.2, h: 5.0, rounding: false });
const panel = [
  ["Jadłospis z kontrolą wartości", "Makro i mikroskładniki obok układanego dnia, własne produkty i przepisy."],
  ["Szablony diet", "Np. pod insulinooporność: raz przygotowany schemat dopasowujesz do kolejnego pacjenta."],
  ["Jedna karta pacjenta", "Wywiad, wizyty, pomiary, ankiety i wpłaty w jednej historii."],
];
panel.forEach(([h, b], i) => {
  const y = 1.6 + i * 1.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.2, y, w: 4.5, h: 1.5, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.accent3, width: 1 }, objectName: `panel-${i}` });
  s.addText(h, { x: 8.45, y: y + 0.18, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: C.text2, margin: 0, isTextBox: true });
  s.addText(b, { x: 8.45, y: y + 0.6, w: 4.0, h: 0.8, fontSize: 13, color: C.accent6, valign: "top", margin: 0, isTextBox: true });
});

// 9. Styles
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Praca dietetyka" });
title(s, "Wygląd aplikacji wybierasz sama");
[["phone-classic.png", "Klasyczny"], ["phone-sport.png", "Sportowy"], ["phone-wellness.png", "Wellness"]].forEach(([f, label], i) => {
  const x = 0.9 + i * 2.75;
  phone(s, f, x, 1.4, 4.6);
  s.addText(label, { x, y: 6.05, w: 4.6 * 814 / 1570, h: 0.4, align: "center", fontSize: 15, bold: true, color: C.text2, margin: 0, isTextBox: true });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: 1.6, w: 3.5, h: 4.6, rectRadius: 0.2, fill: { color: C.text2 }, objectName: "styles-card" });
s.addText([
  { text: "3 style i 8 palet kolorów", options: { bold: true, fontSize: 18, color: C.accent2, breakLine: true } },
  { text: " ", options: { fontSize: 8, breakLine: true } },
  { text: "Zmieniasz je w panelu, a pacjenci widzą nowy wygląd przy następnym otwarciu aplikacji, bez aktualizacji w sklepie.", options: { fontSize: 14, color: C.background1, breakLine: true } },
  { text: " ", options: { fontSize: 8, breakLine: true } },
  { text: "Dla dietetyka polecamy Wellness: ciepłe tło i miękkie kształty.", options: { fontSize: 14, color: C.accent3 } },
], { x: 9.5, y: 1.9, w: 2.9, h: 4.0, valign: "top", margin: 0, isTextBox: true });

// 10. Patient journey
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Praca dietetyka" });
title(s, "Od wywiadu do efektu w czterech krokach");
const steps = [
  ["Wywiad", "Pacjent wypełnia ankietę w aplikacji przed pierwszą wizytą."],
  ["Jadłospis", "Układasz plan w panelu i publikujesz go pacjentowi."],
  ["Realizacja", "Pacjent gotuje z planem w telefonie, a pytania wysyła na czacie."],
  ["Kontrola", "Pomiary i check-in między wizytami. Korygujesz plan na bieżąco."],
];
steps.forEach(([h, b], i) => {
  const x = 0.6 + i * 3.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.1, w: 2.85, h: 3.6, rectRadius: 0.18, fill: { color: i === 3 ? C.text2 : C.background2 }, line: { color: C.accent3, width: 1 }, objectName: `step-${i}` });
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.4, w: 0.7, h: 0.7, fill: { color: i === 3 ? C.accent2 : C.accent1 }, objectName: `step-num-${i}` });
  s.addText(String(i + 1), { x: x + 0.3, y: 2.4, w: 0.7, h: 0.7, align: "center", valign: "middle", fontSize: 20, bold: true, color: i === 3 ? C.text2 : C.background1, margin: 0, isTextBox: true });
  s.addText(h, { x: x + 0.3, y: 3.35, w: 2.3, h: 0.5, fontFace: "Georgia", fontSize: 20, bold: true, color: i === 3 ? C.background1 : C.text2, margin: 0, isTextBox: true });
  s.addText(b, { x: x + 0.3, y: 3.95, w: 2.3, h: 1.6, fontSize: 14, color: i === 3 ? C.accent3 : C.accent6, valign: "top", margin: 0, isTextBox: true });
});

// 11. Rollout
pres.addSection({ title: "Współpraca" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Współpraca" });
title(s, "Wdrożenie w 1–3 tygodnie");
const roll = [
  ["Tydzień 1", "Marka i konta", "Akceptujesz logo i kolory. Zakładasz konta Apple i Google na swoją działalność z naszą instrukcją (ok. godziny). Strona WWW nie jest potrzebna."],
  ["Tydzień 1–2", "Panel i szablony", "Pomagamy przenieść Twoje schematy diet i ankiety do panelu, konfigurujemy aplikację."],
  ["Tydzień 2", "Pilotaż", "Testujesz aplikację z kilkoma pacjentami. Poprawiamy, co trzeba."],
  ["Tydzień 2–3", "Publikacja", "Publikujemy aplikację na Twoich kontach w App Store i Google Play. Aktualizacje są po naszej stronie."],
];
roll.forEach(([when, h, b], i) => {
  const y = 1.65 + i * 1.25;
  s.addText(when, { x: 0.6, y, w: 2.0, h: 0.45, fontSize: 15, bold: true, color: C.accent1, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 2.7, y: y - 0.1, w: 10.0, h: 1.05, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.accent3, width: 1 }, objectName: `roll-${i}` });
  s.addText(h, { x: 2.95, y: y, w: 2.6, h: 0.85, fontSize: 17, bold: true, color: C.text2, valign: "middle", margin: 0, isTextBox: true });
  s.addText(b, { x: 5.6, y: y, w: 6.9, h: 0.85, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
});

// 12. Model & price
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Współpraca" });
title(s, "Dwa warianty, jedna platforma");
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.65, w: 5.7, h: 4.7, rectRadius: 0.2, fill: { color: C.background2 }, line: { color: C.accent3, width: 1 }, objectName: "variant-start" });
s.addText("Start od razu", { x: 1.0, y: 1.95, w: 5.0, h: 0.5, fontFace: "Georgia", fontSize: 22, bold: true, color: C.text2, margin: 0, isTextBox: true });
s.addText([
  { text: "Panel Diecik dla Ciebie, pacjenci w aplikacji Diecik", options: { bullet: true, breakLine: true } },
  { text: "Jadłospisy, przepisy, ankiety, czat i pomiary od pierwszego dnia", options: { bullet: true, breakLine: true } },
  { text: "Plan Studio: bez limitu pacjentów, 199 zł brutto miesięcznie", options: { bullet: true } },
], { x: 1.0, y: 2.7, w: 5.0, h: 3.0, fontSize: 15, color: C.text1, paraSpaceAfter: 12, valign: "top", margin: 0, isTextBox: true });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.6, y: 1.65, w: 6.1, h: 4.7, rectRadius: 0.2, fill: { color: C.text2 }, objectName: "variant-own" });
s.addText("Własna aplikacja z Twoim logo", { x: 7.0, y: 1.95, w: 5.4, h: 0.5, fontFace: "Georgia", fontSize: 22, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText("od 600 zł brutto miesięcznie", { x: 7.0, y: 2.55, w: 5.4, h: 0.6, fontSize: 26, bold: true, color: C.background1, margin: 0, isTextBox: true });
s.addText([
  { text: "Prowadzenie pacjentów w panelu i aplikacja z Twoim logo w App Store i Google Play", options: { bullet: true, breakLine: true } },
  { text: "Publikacja, aktualizacje i wymagania sklepów po naszej stronie", options: { bullet: true, breakLine: true } },
  { text: "Pacjenci nie płacą za aplikację", options: { bullet: true, breakLine: true } },
  { text: "Opłaty sklepów na Twoim koncie: Apple 99 USD rocznie, Google 25 USD jednorazowo", options: { bullet: true } },
], { x: 7.0, y: 3.3, w: 5.4, h: 2.9, fontSize: 14, color: C.accent3, paraSpaceAfter: 8, valign: "top", margin: 0, isTextBox: true });
s.addText("Możesz zacząć od wariantu Start, a o własnej aplikacji zdecydować po pilotażu.", { x: 0.6, y: 6.5, w: 12.0, h: 0.35, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true });

// 13. Close
s = pres.addSlide({ masterName: "DARK", sectionTitle: "Współpraca" });
s.addText("Dziękuję", { x: 0.6, y: 2.0, w: 7, h: 1.0, fontFace: "Georgia", fontSize: 48, bold: true, color: C.background1, margin: 0, isTextBox: true });
s.addText("Porozmawiajmy o pilotażu z kilkoma Twoimi pacjentami", { x: 0.6, y: 3.1, w: 6.5, h: 1.0, fontSize: 22, color: C.accent2, valign: "top", margin: 0, isTextBox: true });
s.addText([
  { text: "Bartosz Szeliga · kontakt@diecik.com", options: { breakLine: true } },
  { text: "diecik.com/aplikacja-dla-firmy" },
], { x: 0.6, y: 4.6, w: 6.5, h: 0.8, fontSize: 15, color: C.accent3, margin: 0, isTextBox: true });
s.addImage({ path: IMG("phone-wellness.png"), x: 8.6, y: 0.7, h: 6.1, w: 6.1 * 814 / 1570 });

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})();
