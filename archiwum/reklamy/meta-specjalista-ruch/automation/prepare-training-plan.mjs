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
const outputDir = path.join(campaignRoot, "work", "preparation");
await fs.mkdir(outputDir, { recursive: true });

const clientId = "e0a72ce5-fea7-558c-86a1-4821161f952a";
const packageName = "Pakiet dieta + ruch — DEMO";
const trainingName = "Plan ruchu — lepsze samopoczucie";
const trainingGoal =
  "Regularny ruch wspierający energię, sprawność i codzienne funkcjonowanie.";
const plannedDays = [
  {
    date: "2026-08-31",
    template: "DEMO • Spacer po posiłku — obserwacja glikemii",
  },
  {
    date: "2026-09-02",
    template: "DEMO • Obwód funkcjonalny — siła do codzienności",
  },
  {
    date: "2026-09-05",
    template: "DEMO • Mobilność i przerwy od siedzenia",
  },
];

function formatPanelDate(date) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

const context = await chromium.launchPersistentContext(
  path.join(legacyCapture, ".runtime", "trainer-profile"),
  {
    executablePath:
      process.env.DIECIK_CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    viewport: { width: 2560, height: 1440 },
    screen: { width: 2560, height: 1530 },
    deviceScaleFactor: 1,
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
      "--window-size=2560,1530",
    ],
  },
);
const page = context.pages()[0] ?? (await context.newPage());
page.setDefaultTimeout(25_000);
const writes = [];
const unexpectedWrites = [];
await context.route(/http:\/\/(?:localhost|127\.0\.0\.1):8081\/.*/, async (route) => {
  const request = route.request();
  const pathname = new URL(request.url()).pathname;
  const signature = `${request.method()} ${pathname}`;
  if (["GET", "HEAD", "OPTIONS"].includes(request.method())) {
    await route.continue();
    return;
  }
  const allowedTrainingWrite =
    request.method() === "PUT" &&
    pathname === `/api/trainer/clients/${clientId}/training-snapshot`;
  const allowedRevisionWrite =
    request.method() === "POST" &&
    new RegExp(`^/api/trainer/clients/${clientId}/snapshots/[^/]+/revisions$`).test(
      pathname,
    );
  const allowedTitleWrite =
    request.method() === "PUT" &&
    new RegExp(`^/api/trainer/clients/${clientId}/snapshots/[^/]+/title$`).test(
      pathname,
    );
  if (allowedTrainingWrite || allowedRevisionWrite || allowedTitleWrite) {
    writes.push(signature);
    await route.continue();
    return;
  }
  unexpectedWrites.push(signature);
  await route.abort("blockedbyclient");
});

async function openCorrectionTraining() {
  await page.goto(`http://localhost:3000/specjalista/klienci/${clientId}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.getByRole("heading", { name: "Joanna Wysocka (DEMO)", exact: true }).waitFor();
  const createCorrection = page
    .getByRole("button", { name: /^Utwórz korektę:/ })
    .first();
  await createCorrection.scrollIntoViewIfNeeded();
  await createCorrection.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  const openExisting = dialog.getByRole("button", {
    name: "Otwórz istniejący szkic",
    exact: true,
  });
  if ((await openExisting.count()) > 0 && (await openExisting.isVisible())) {
    await openExisting.click();
  } else {
    const create = dialog.getByRole("button", {
      name: "Utwórz szkic korekty",
      exact: true,
    });
    const created = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        /\/revisions$/.test(new URL(response.url()).pathname),
    );
    await create.click();
    const response = await created;
    if (!response.ok()) throw new Error(`Correction returned HTTP ${response.status()}`);
  }
  await dialog.waitFor({ state: "hidden", timeout: 20_000 });
  const trainingTab = page.getByRole("tab", { name: /^3\. Trening$/ });
  await trainingTab.waitFor({ state: "visible" });
  await trainingTab.click();
  await page.getByRole("heading", { name: "Trening klienta", exact: true }).waitFor();
}

async function templateControls() {
  const heading = page.getByRole("heading", {
    name: "Szablon aktywnego dnia",
    exact: true,
  });
  const section = heading.locator("xpath=ancestor::section[1]");
  const show = section.getByRole("button", { name: "Pokaż", exact: true });
  if ((await show.count()) > 0 && (await show.isVisible())) await show.click();
  return section;
}

async function loadTemplate(templateName, date) {
  const existingTemplateHeading = page.getByRole("heading", {
    name: templateName,
    exact: true,
  });
  if (
    (await existingTemplateHeading.count()) > 0 &&
    (await existingTemplateHeading.isVisible())
  ) {
    return;
  }
  const section = await templateControls();
  const selector = section.getByLabel("Szablon jednego dnia");
  await selector.click();
  await page.getByRole("option", { name: templateName, exact: true }).click();
  const loadButton = section.getByRole("button", {
    name: "Wczytaj wybrany szablon",
    exact: true,
  });
  const enabledDeadline = Date.now() + 15_000;
  while (!(await loadButton.isEnabled()) && Date.now() < enabledDeadline) {
    await page.waitForTimeout(200);
  }
  if (!(await loadButton.isEnabled())) {
    const diagnostic = {
      date,
      templateName,
      selectorText: await selector.textContent(),
      selectorHtml: (await selector.evaluate((element) => element.outerHTML)).slice(
        0,
        2_000,
      ),
      alerts: await page.locator('[role="alert"]').allTextContents(),
      status: await page.locator('[role="status"]').allTextContents(),
      writes,
      unexpectedWrites,
    };
    await page.screenshot({
      path: path.join(outputDir, `diagnostic-disabled-${date}.png`),
      fullPage: false,
    });
    throw new Error(`Template load disabled: ${JSON.stringify(diagnostic)}`);
  }
  await loadButton.click();

  const replaceDialog = page.getByRole("dialog", {
    name: "Zastąpić aktywny dzień treningu?",
  });
  await replaceDialog
    .waitFor({ state: "visible", timeout: 3_000 })
    .catch(() => undefined);
  if (await replaceDialog.isVisible()) {
    await replaceDialog
      .getByRole("button", { name: "Zastąp aktywny dzień", exact: true })
      .click();
  }
  const formattedDate = formatPanelDate(date);
  await page.getByText(`Wczytano szablon do dnia ${formattedDate}. Pozostałe dni nie zostały zmienione.`, {
    exact: true,
  }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function updateTrainingSettings() {
  const trainingNameField = page.getByLabel("Nazwa treningu", { exact: true });
  const trainingGoalField = page.getByLabel("Cel", { exact: true });
  if (
    (await trainingNameField.inputValue()) === trainingName &&
    (await trainingGoalField.inputValue()) === trainingGoal
  ) {
    return;
  }
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname ===
        `/api/trainer/clients/${clientId}/training-snapshot`,
    { timeout: 30_000 },
  );
  await trainingNameField.fill(trainingName);
  await trainingGoalField.fill(trainingGoal);
  const response = await saved;
  if (!response.ok()) {
    throw new Error(`Training settings returned HTTP ${response.status()}`);
  }
  await page.getByText("Zapisano", { exact: true }).waitFor({
    state: "visible",
    timeout: 15_000,
  });
}

async function updatePackageName() {
  const packageNameField = page.getByLabel("Nazwa pakietu", { exact: true });
  if ((await packageNameField.inputValue()) === packageName) {
    return;
  }
  const renamed = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new RegExp(
        `^/api/trainer/clients/${clientId}/snapshots/[^/]+/title$`,
      ).test(new URL(response.url()).pathname),
    { timeout: 30_000 },
  );
  await packageNameField.fill(packageName);
  const response = await renamed;
  if (!response.ok()) {
    throw new Error(`Package rename returned HTTP ${response.status()}`);
  }
}

async function selectOrAddDay(index, date) {
  const days = page.getByRole("list", { name: "Wybór dnia treningu" });
  const buttons = days.getByRole("button");
  const count = await buttons.count();
  if (count > plannedDays.length) {
    throw new Error(`Unexpected training day count: ${count}`);
  }
  const formattedDate = formatPanelDate(date);
  const targetDay = days.getByRole("button", {
    name: new RegExp(`: ${formattedDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`),
  });
  if ((await targetDay.count()) > 0) {
    await targetDay.first().click();
    return;
  }

  let emptyDay = days.getByRole("button", { name: /Pusty/ }).first();
  if ((await emptyDay.count()) === 0) {
    await page
      .getByRole("button", { name: "Uzupełnij brakujący dzień", exact: true })
      .click();
    emptyDay = days
      .getByRole("button", { name: /Pusty\. Aktywny dzień\.$/ })
      .first();
    await emptyDay.waitFor({ state: "visible" });
  }
  await emptyDay.click();
  const visibleDate = page.locator('input[type="date"]:visible');
  await visibleDate.waitFor({ state: "visible" });
  if ((await visibleDate.inputValue()) !== date) await visibleDate.fill(date);
  await days
    .getByRole("button", {
      name: new RegExp(
        `: ${formattedDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\..*Aktywny dzień\\.$`,
      ),
    })
    .waitFor({ state: "visible", timeout: 10_000 });
}

try {
  await openCorrectionTraining();

  for (let index = 0; index < plannedDays.length; index += 1) {
    const plan = plannedDays[index];
    await selectOrAddDay(index, plan.date);
    await loadTemplate(plan.template, plan.date);
    if (index === 0) {
      await updateTrainingSettings();
      await updatePackageName();
    }
  }

  const daySelector = page.getByRole("list", { name: "Wybór dnia treningu" });
  await daySelector.getByRole("button").nth(1).click();
  const trainingHeading = page.getByRole("heading", {
    name: "Trening klienta",
    exact: true,
  });
  await trainingHeading.evaluate((element) => {
    window.scrollTo({
      top: Math.max(0, window.scrollY + element.getBoundingClientRect().top - 180),
      behavior: "instant",
    });
  });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(outputDir, "05-ready-three-day-training.png"),
    fullPage: false,
  });

  const deliveryTab = page.getByRole("tab", { name: /^4\. Sprawdź i wyślij$/ });
  await deliveryTab.click();
  await page.getByText("Akcje pakietu", { exact: true }).waitFor();
  await page.screenshot({
    path: path.join(outputDir, "06-diet-and-training-delivery.png"),
    fullPage: false,
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        writes,
        unexpectedWrites,
        packageName,
        trainingName,
        plannedDays,
        deliveryHeadings: (await page.getByRole("heading").allTextContents()).slice(
          0,
          60,
        ),
        deliveryButtons: (await page.getByRole("button").allTextContents())
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 100),
        visibleText: (await page.locator("body").innerText()).slice(0, 7_000),
      },
      null,
      2,
    )}\n`,
  );
  if (unexpectedWrites.length) process.exitCode = 2;
} finally {
  await context.close();
}
