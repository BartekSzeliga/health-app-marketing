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
await context.route(/http:\/\/(?:localhost|127\.0\.0\.1):8081\/.*/, async (route) => {
  const request = route.request();
  const signature = `${request.method()} ${new URL(request.url()).pathname}`;
  if (["GET", "HEAD", "OPTIONS"].includes(request.method())) {
    await route.continue();
    return;
  }
  if (signature === "PUT /api/trainer/profile") {
    writes.push(signature);
    await route.continue();
    return;
  }
  throw new Error(`Unexpected write while enabling training: ${signature}`);
});

try {
  await page.goto("http://localhost:3000/specjalista/panel", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.getByRole("heading", { name: "Panel specjalisty", exact: true }).waitFor();

  const scope = page.getByRole("group", { name: "Zakres pracy specjalisty" });
  await scope.waitFor({ state: "visible" });
  const fullScope = scope.getByRole("button", {
    name: "Dieta i trening",
    exact: true,
  });
  await fullScope.scrollIntoViewIfNeeded();
  if ((await fullScope.getAttribute("aria-pressed")) !== "true") {
    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().endsWith("/api/trainer/profile"),
    );
    await fullScope.click();
    const response = await saved;
    if (!response.ok()) {
      throw new Error(`Profile scope update returned HTTP ${response.status()}`);
    }
    await page.getByText("Wszystkie zmiany zapisane.", { exact: true }).waitFor();
  }
  await page.screenshot({
    path: path.join(outputDir, "01-training-scope-enabled.png"),
    fullPage: false,
  });

  await page.goto(
    "http://localhost:3000/specjalista/klienci/e0a72ce5-fea7-558c-86a1-4821161f952a",
    { waitUntil: "domcontentloaded", timeout: 30_000 },
  );
  await page.getByRole("heading", { name: "Joanna Wysocka (DEMO)", exact: true }).waitFor();
  await page.screenshot({
    path: path.join(outputDir, "02-client-with-training-scope.png"),
    fullPage: false,
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        workScope: "DIET_AND_TRAINING",
        writes,
        tabs: await page.getByRole("tab").allTextContents(),
        buttons: (await page.getByRole("button").allTextContents())
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 80),
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await context.close();
}
