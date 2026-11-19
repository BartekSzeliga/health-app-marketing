import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const campaignRoot = path.resolve(here, "..");
const projectRoot = path.resolve(campaignRoot, "..", "..", "..");
const legacyCapture = path.join(
  projectRoot,
  "tmp",
  "promo trener dane",
  "video",
  "capture",
);
const { chromium } = await import(
  pathToFileURL(
    path.join(legacyCapture, "node_modules", "playwright-core", "index.mjs"),
  ).href
);

const clientId = "e0a72ce5-fea7-558c-86a1-4821161f952a";
const outputDir = path.join(campaignRoot, "sources", "panel");
const captureManifest = path.join(campaignRoot, "qa", "capture-manifest.json");
await Promise.all([
  fs.mkdir(outputDir, { recursive: true }),
  fs.mkdir(path.dirname(captureManifest), { recursive: true }),
]);

const context = await chromium.launchPersistentContext(
  path.join(legacyCapture, ".runtime", "trainer-profile"),
  {
    executablePath:
      process.env.DIECIK_CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    viewport: { width: 1600, height: 1100 },
    screen: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    reducedMotion: "reduce",
    args: [
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-features=Translate,MediaRouter",
      "--disable-notifications",
      "--hide-scrollbars",
      "--no-first-run",
      "--window-size=1600,1200",
    ],
  },
);
const page = context.pages()[0] ?? (await context.newPage());
page.setDefaultTimeout(25_000);

const unexpectedWrites = [];
await context.route(/http:\/\/(?:localhost|127\.0\.0\.1):8081\/.*/, async (route) => {
  const request = route.request();
  if (["GET", "HEAD", "OPTIONS"].includes(request.method())) {
    await route.continue();
    return;
  }
  unexpectedWrites.push(
    `${request.method()} ${new URL(request.url()).pathname}`,
  );
  await route.abort("blockedbyclient");
});

async function openCorrection() {
  await page.goto(`http://localhost:3000/specjalista/klienci/${clientId}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page
    .getByRole("heading", { name: "Joanna Wysocka (DEMO)", exact: true })
    .waitFor();
  const correction = page
    .getByRole("button", { name: /^Utwórz korektę:/ })
    .first();
  await correction.scrollIntoViewIfNeeded();
  await correction.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  await dialog
    .getByRole("button", { name: "Otwórz istniejący szkic", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: /^2\. Dieta$/ }).waitFor();
}

async function cleanPage() {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      footer { display: none !important; }
      [role="tooltip"] { display: none !important; }
    `,
  });
  await page.evaluate(() => {
    for (const element of document.querySelectorAll("button, [role='button']")) {
      if (!element.textContent?.includes("Czat")) continue;
      let candidate = element;
      while (candidate && getComputedStyle(candidate).position !== "fixed") {
        candidate = candidate.parentElement;
      }
      (candidate ?? element).style.display = "none";
    }
  });
}

async function viewportShot(filename, anchor, topOffset = 120) {
  await anchor.waitFor({ state: "visible" });
  await anchor.evaluate(
    (element, offset) => {
      const top = window.scrollY + element.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "instant" });
    },
    topOffset,
  );
  await page.waitForTimeout(350);
  await cleanPage();
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: false,
    animations: "disabled",
  });
}

try {
  await openCorrection();
  await cleanPage();

  const workflowHeading = page.getByRole("heading", {
    name: "Przygotuj pakiet i wyślij go klientowi",
    exact: true,
  });
  await viewportShot("01-workflow-dieta-trening.png", workflowHeading, 190);

  const trainingTab = page.getByRole("tab", { name: /^3\. Trening$/ });
  await trainingTab.click();
  const trainingHeading = page.getByRole("heading", {
    name: "Trening klienta",
    exact: true,
  });
  await trainingHeading.waitFor();
  const daySelector = page.getByRole("list", {
    name: "Wybór dnia treningu",
  });
  await daySelector
    .getByRole("button", { name: /2 wrz 2026/ })
    .click();
  await viewportShot("02-training-plan-three-days.png", trainingHeading, 120);

  const templateHeading = page.getByRole("heading", {
    name: "Szablon aktywnego dnia",
    exact: true,
  });
  const templateSection = templateHeading.locator("xpath=ancestor::section[1]");
  const showTemplates = templateSection.getByRole("button", {
    name: "Pokaż",
    exact: true,
  });
  if ((await showTemplates.count()) > 0 && (await showTemplates.isVisible())) {
    await showTemplates.click();
  }
  const templateSelect = templateSection.getByLabel("Szablon jednego dnia");
  await templateSelect.click();
  await page
    .getByRole("option", {
      name: "DEMO • Obwód funkcjonalny — siła do codzienności",
      exact: true,
    })
    .click();
  await viewportShot(
    "03-training-template-functional.png",
    templateHeading,
    260,
  );

  const activeDayHeading = page.getByRole("heading", {
    name: "DEMO • Obwód funkcjonalny — siła do codzienności",
    exact: true,
  });
  await viewportShot("04-functional-day-details.png", activeDayHeading, 220);

  const deliveryTab = page.getByRole("tab", {
    name: /^4\. Sprawdź i wyślij$/,
  });
  await deliveryTab.click();
  const packageHeading = page.getByRole("heading", {
    name: /Pakiet 4: Pakiet dieta \+ ruch — DEMO/,
  });
  await viewportShot("05-package-ready-dieta-training.png", packageHeading, 210);

  await page
    .getByRole("button", { name: "Podgląd pakietu", exact: true })
    .click();
  const previewDialog = page.getByRole("dialog");
  await previewDialog.waitFor({ state: "visible" });
  await previewDialog.screenshot({
    path: path.join(outputDir, "06-package-preview.png"),
    animations: "disabled",
  });
  await previewDialog
    .getByRole("tab", { name: "Trening", exact: true })
    .click();
  await previewDialog.getByText("Plan ruchu — lepsze samopoczucie").waitFor();
  await previewDialog.screenshot({
    path: path.join(outputDir, "07-package-preview-training.png"),
    animations: "disabled",
  });

  const result = {
    generatedAt: new Date().toISOString(),
    viewport: { width: 1600, height: 1100, deviceScaleFactor: 2 },
    demoClient: "Joanna Wysocka (DEMO)",
    readOnlyCapture: true,
    files: (await fs.readdir(outputDir)).sort(),
    unexpectedWrites,
  };
  await fs.writeFile(captureManifest, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (unexpectedWrites.length) process.exitCode = 2;
} finally {
  await context.close();
}
