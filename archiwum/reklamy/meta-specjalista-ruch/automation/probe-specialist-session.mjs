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
const playwrightEntry = path.join(
  legacyCapture,
  "node_modules",
  "playwright-core",
  "index.mjs",
);
const profile = path.join(legacyCapture, ".runtime", "trainer-profile");
const chrome =
  process.env.DIECIK_CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDir = path.join(campaignRoot, "work", "probe");
const clientPath =
  "/specjalista/klienci/e0a72ce5-fea7-558c-86a1-4821161f952a";
const demoEmail = process.env.DIECIK_DEMO_EMAIL ?? "demo@diecik.local";
const demoPassword = process.env.DIECIK_DEMO_PASSWORD;

await fs.mkdir(outputDir, { recursive: true });
const { chromium } = await import(pathToFileURL(playwrightEntry).href);
const context = await chromium.launchPersistentContext(profile, {
  executablePath: chrome,
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
    "--window-position=20,20",
    "--window-size=2560,1530",
  ],
});

const page = context.pages()[0] ?? (await context.newPage());
page.setDefaultTimeout(20_000);
const blockedWrites = [];
await context.route(/http:\/\/(?:localhost|127\.0\.0\.1):8081\/.*/, async (route) => {
  const method = route.request().method();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    await route.continue();
    return;
  }
  blockedWrites.push(`${method} ${new URL(route.request().url()).pathname}`);
  await route.abort("blockedbyclient");
});

try {
  process.stdout.write("probe: opening specialist client\n");
  await page.goto(`http://localhost:3000${clientPath}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForTimeout(1_500);

  if (new URL(page.url()).origin === "http://localhost:3000") {
    const login = page.getByRole("button", { name: "Zaloguj się", exact: true });
    if ((await login.count()) > 0 && (await login.first().isVisible())) {
      if (!demoPassword) {
        throw new Error("DIECIK_DEMO_PASSWORD is required to refresh the demo session");
      }
      process.stdout.write("probe: refreshing demo login\n");
      await login.first().click();
      await page.waitForURL(/:8080\/realms\//, { timeout: 20_000 });
    }
  }

  if (page.url().includes(":8080/") || page.url().includes("/realms/")) {
    if (!demoPassword) {
      throw new Error("DIECIK_DEMO_PASSWORD is required to refresh the demo session");
    }
    await page.locator("#username").fill(demoEmail);
    await page.locator("#password").fill(demoPassword);
    process.stdout.write("probe: submitting demo login\n");
    await page.locator("#kc-login").click();
    await page.waitForURL((url) => url.origin === "http://localhost:3000", {
      timeout: 30_000,
    });
    await page.goto(`http://localhost:3000${clientPath}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(1_500);
    process.stdout.write("probe: demo client loaded\n");
  }

  const cookieButton = page.getByRole("button", { name: /ODRZUĆ OPCJONALNE/i });
  if ((await cookieButton.count()) > 0 && (await cookieButton.first().isVisible())) {
    await cookieButton.first().click();
    await page.waitForTimeout(350);
  }

  const clientHeading = page.getByRole("heading", {
    name: "Joanna Wysocka (DEMO)",
    exact: true,
  });
  await clientHeading.waitFor({ state: "visible", timeout: 30_000 }).catch(() => {});

  const authenticated =
    new URL(page.url()).origin === "http://localhost:3000" &&
    (await clientHeading.count()) > 0 &&
    (await clientHeading.isVisible());

  await page.screenshot({
    path: path.join(outputDir, "specialist-session.png"),
    fullPage: false,
  });

  const report = {
    authenticated,
    url: page.url(),
    title: await page.title(),
    headings: (await page.getByRole("heading").allTextContents()).slice(0, 40),
    tabs: (await page.getByRole("tab").allTextContents()).slice(0, 40),
    buttons: (await page.getByRole("button").allTextContents())
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 80),
    blockedWrites,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!authenticated) process.exitCode = 2;
} finally {
  await context.close();
}
