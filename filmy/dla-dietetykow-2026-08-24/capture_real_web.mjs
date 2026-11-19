import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const playwrightRoot =
  process.env.DIECIK_PLAYWRIGHT_ROOT ?? "/private/tmp/diecik-playwright-core";
const { chromium } = await import(
  pathToFileURL(
    path.join(playwrightRoot, "node_modules/playwright-core/index.mjs"),
  ).href
);

const baseUrl = process.env.DIECIK_WEB_URL ?? "http://127.0.0.1:3000";
const demoEmail = process.env.DIECIK_DEMO_EMAIL ?? "demo@diecik.local";
const demoPassword = process.env.DIECIK_DEMO_PASSWORD;
const chromePath =
  process.env.DIECIK_CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDir = path.join(here, "real-web-capture");
const rawVideoDir = path.join(outputDir, "raw-video");
const screenshotsDir = path.join(outputDir, "screenshots");
const discovery = process.argv.includes("--discover");
const validation = process.argv.includes("--validate");
const blockedWrites = [];

if (!demoPassword) {
  throw new Error("DIECIK_DEMO_PASSWORD is required");
}

await Promise.all(
  [outputDir, rawVideoDir, screenshotsDir].map((dir) =>
    fs.mkdir(dir, { recursive: true }),
  ),
);

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-features=Translate,MediaRouter",
    "--disable-notifications",
    "--hide-scrollbars",
    "--no-first-run",
  ],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  locale: "pl-PL",
  timezoneId: "Europe/Warsaw",
  colorScheme: "light",
  reducedMotion: "reduce",
  recordVideo: discovery || validation
    ? undefined
    : { dir: rawVideoDir, size: { width: 1920, height: 1080 } },
});

await context.route(
  /http:\/\/(?:localhost|127\.0\.0\.1):8081\/.*/,
  async (route) => {
    const request = route.request();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      await route.continue();
      return;
    }
    blockedWrites.push(`${request.method()} ${request.url()}`);
    await route.abort("blockedbyclient");
  },
);

const page = await context.newPage();
page.setDefaultTimeout(15_000);

page.on("console", (message) => {
  if (message.type() === "error") {
    process.stderr.write(`browser-console-error: ${message.text()}\n`);
  }
});
page.on("pageerror", (error) => {
  process.stderr.write(`browser-page-error: ${error.message}\n`);
});

async function settle(milliseconds = 800) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(milliseconds);
}

async function screenshot(name) {
  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    animations: "disabled",
  });
}

async function visibleText(label) {
  const body = await page.locator("body").innerText();
  const normalized = body.replace(/\n{3,}/g, "\n\n").trim();
  process.stdout.write(
    `\n--- ${label} ---\nurl=${page.url()}\ntitle=${await page.title()}\n${normalized.slice(0, 7000)}\n`,
  );
}

async function clickFirst(candidates, label) {
  for (const candidate of candidates) {
    const locator = candidate();
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const match = locator.nth(index);
      if (await match.isVisible()) {
        await match.click();
        await settle();
        return;
      }
    }
  }
  throw new Error(`Visible action not found: ${label}`);
}

async function dismissCookieBanner() {
  const rejectOptional = page.getByRole("button", {
    name: /ODRZUĆ OPCJONALNE/i,
  });
  if (
    (await rejectOptional.count()) > 0 &&
    (await rejectOptional.first().isVisible())
  ) {
    await rejectOptional.first().click();
    await rejectOptional.first().waitFor({ state: "hidden" }).catch(() => {});
    await settle(400);
  }
}

async function gotoApp(pathname, waitFor) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
  await settle(1_500);
  await dismissCookieBanner();
  if (waitFor) {
    await waitFor();
  }
}

function assertReadOnly() {
  if (blockedWrites.length > 0) {
    throw new Error(`Blocked backend writes: ${blockedWrites.join(", ")}`);
  }
}

async function login() {
  await page.goto(`${baseUrl}/specjalista/panel`, {
    waitUntil: "domcontentloaded",
  });
  await settle();

  if (page.url().startsWith(baseUrl)) {
    const loginText = page.getByText("Zaloguj się", { exact: true });
    if ((await loginText.count()) > 0 && (await loginText.first().isVisible())) {
      await loginText.first().click();
      await settle();
    }
  }

  if (page.url().includes(":8080/")) {
    await page.locator("#username").fill(demoEmail);
    await page.locator("#password").fill(demoPassword);
    await page.locator("#kc-login").click();
    await page.waitForURL((url) => url.origin === new URL(baseUrl).origin, {
      timeout: 30_000,
    });
  }

  await page.goto(`${baseUrl}/specjalista/panel`, {
    waitUntil: "domcontentloaded",
  });
  await settle(1_200);
  await dismissCookieBanner();
}

async function runDiscovery() {
  await visibleText("panel");
  await screenshot("01-panel");

  await clickFirst(
    [
      () => page.getByRole("link", { name: /Szablony diet/i }),
      () => page.getByText("Szablony diet", { exact: true }),
    ],
    "Szablony diet",
  );
  await page.waitForURL(/\/specjalista\/szablony/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(1_500);
  await dismissCookieBanner();
  await visibleText("szablony diet");
  await screenshot("02-szablony-diet");

  await page.goto(`${baseUrl}/specjalista/klienci`, {
    waitUntil: "domcontentloaded",
  });
  await settle(1_500);
  await dismissCookieBanner();
  await visibleText("klienci");
  await screenshot("03-klienci");
}

async function runCapture() {
  await screenshot("capture-start-panel");
  await page.waitForTimeout(4_000);
}

async function runValidation() {
  await page.getByRole("heading", { name: "Panel specjalisty" }).waitFor();
  assertReadOnly();

  await gotoApp("/specjalista/szablony?typ=dieta", () =>
    page.getByRole("heading", { name: "Szablony diet" }).waitFor(),
  );
  const search = page.locator("#trainer-diet-template-search");
  await search.fill("7 dni");
  const template = page.locator(
    "#trainer-diet-template-item-223407ab-0658-5d6d-ba22-4ccd8d7f73b5",
  );
  await template.click();
  await page
    .getByRole("list", { name: "Wybierz dzień szablonu" })
    .waitFor();
  await screenshot("04-szablon-7-dni");
  await page
    .getByRole("list", { name: "Wybierz dzień szablonu" })
    .getByRole("button")
    .nth(2)
    .click();
  await page
    .getByRole("list", { name: "Posiłki dnia szablonu" })
    .getByRole("button")
    .first()
    .click();
  await settle(700);
  await screenshot("05-szablon-dzien-3-posilek");
  assertReadOnly();

  await gotoApp("/specjalista/klienci", () =>
    page.getByRole("heading", { name: "Klienci", exact: true }).waitFor(),
  );
  await screenshot("06-klienci-demo");
  await page
    .getByRole("link", { name: "Przygotuj plan", exact: true })
    .click();
  await page.waitForURL(/\/specjalista\/klienci\/[0-9a-f-]+$/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(1_800);
  await page
    .getByRole("heading", { name: "Joanna Wysocka (DEMO)" })
    .waitFor();
  await screenshot("07-klient-pakiety");

  await page.getByText("Edytuj pakiet", { exact: true }).click();
  await settle(1_500);
  await screenshot("08-edycja-pakietu");
  await page
    .getByRole("tab", { name: "4. Sprawdź i wyślij", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Podgląd pakietu", exact: true })
    .waitFor();
  await screenshot("09-sprawdz-i-wyslij");
  await page
    .getByRole("button", { name: "Podgląd pakietu", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("heading", {
      name: "Podgląd: DEMO • 7 dni stabilnej glikemii",
    })
    .waitFor();
  await dialog
    .locator('[role="tablist"][aria-label="Dni diety w podglądzie"]')
    .getByRole("tab")
    .nth(2)
    .click();
  await settle(500);
  await screenshot("10-podglad-dzien-3");
  assertReadOnly();
  process.stdout.write("validation=PASS\nblocked-writes=0\n");
}

try {
  await login();
  if (discovery) {
    await runDiscovery();
  } else if (validation) {
    await runValidation();
  } else {
    await runCapture();
  }
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    process.stdout.write(`raw-video=${await video.path()}\n`);
  }
}
