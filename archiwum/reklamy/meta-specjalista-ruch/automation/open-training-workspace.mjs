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
  if (
    request.method() === "POST" &&
    new RegExp(`^/api/trainer/clients/${clientId}/snapshots/[^/]+/revisions$`).test(
      pathname,
    )
  ) {
    writes.push(signature);
    await route.continue();
    return;
  }
  unexpectedWrites.push(signature);
  await route.abort("blockedbyclient");
});

try {
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
        new RegExp(
          `/api/trainer/clients/${clientId}/snapshots/[^/]+/revisions$`,
        ).test(new URL(response.url()).pathname),
    );
    await create.click();
    const response = await created;
    if (!response.ok()) {
      throw new Error(`Correction draft returned HTTP ${response.status()}`);
    }
  }

  await dialog.waitFor({ state: "hidden", timeout: 20_000 });
  const trainingTab = page.getByRole("tab", { name: /^3\. Trening$/ });
  await trainingTab.waitFor({ state: "visible" });
  await trainingTab.click();
  await page.getByRole("heading", { name: "Trening klienta", exact: true }).waitFor();
  await page.screenshot({
    path: path.join(outputDir, "03-empty-training-workspace.png"),
    fullPage: false,
  });

  const templateHeading = page.getByRole("heading", {
    name: "Szablon aktywnego dnia",
    exact: true,
  });
  const templateSection = templateHeading.locator("xpath=ancestor::section[1]");
  await templateSection.getByRole("button", { name: "Pokaż", exact: true }).click();
  const templateSelect = templateSection.getByLabel("Szablon jednego dnia");
  await templateSelect.waitFor({ state: "visible" });
  await templateSelect.scrollIntoViewIfNeeded();
  await templateSelect.click();
  const templateOptions = await page.getByRole("option").allTextContents();
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: path.join(outputDir, "04-training-template-controls.png"),
    fullPage: false,
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        writes,
        unexpectedWrites,
        headings: (await page.getByRole("heading").allTextContents()).slice(0, 60),
        buttons: (await page.getByRole("button").allTextContents())
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 120),
        inputs: await page.locator("input").evaluateAll((elements) =>
          elements.slice(0, 80).map((element) => ({
            id: element.id,
            name: element.getAttribute("name"),
            type: element.getAttribute("type"),
            value: element.value,
            ariaLabel: element.getAttribute("aria-label"),
          })),
        ),
        templateOptions,
      },
      null,
      2,
    )}\n`,
  );
  if (unexpectedWrites.length) process.exitCode = 2;
} finally {
  await context.close();
}
