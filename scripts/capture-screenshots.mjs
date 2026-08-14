// Automated screenshot capture for INDEX ORGANICA (⊛ LIVING ARCHIVE).
//
// Launches the local app in a headless Chromium browser, waits for the boot
// sequence to finish, triggers a few representative interactions, and writes
// three real screenshots into docs/images/:
//
//   project-preview.png   — the full interface, freshly booted
//   project-active.png    — the interface mid-interaction (chromatic lab open,
//                           a spatial relic spinning, field scrolled)
//   project-detail.png    — a close crop of the most technically interesting
//                           element (the hand-rolled 3D spatial relic)
//
// Usage:
//   npm run capture:screenshots
//
// Environment overrides:
//   BASE_URL         — where the app is served (default http://localhost:5173/)
//   CHROMIUM_PATH    — optional custom Chromium/Chrome executable path. When
//                      unset, Playwright's managed Chromium is used (install it
//                      once with `npx playwright install chromium`).

import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:5173/";
const OUT_DIR = path.resolve(__dirname, "../docs/images");
const VIEWPORT = { width: 1440, height: 900 };

/** Pick a usable Chromium executable. */
function resolveExecutablePath() {
  return process.env.CHROMIUM_PATH || undefined;
}

/** True once the given URL answers an HTTP 200. */
async function isReachable(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

/** Ensure a dev server is running, starting one if necessary. */
async function ensureServer(url) {
  if (await isReachable(url)) return null;
  const port = new URL(url).port || "5173";
  const child = spawn("npm", ["run", "dev", "--", "--port", port, "--host"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "ignore",
    detached: false,
  });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isReachable(url)) return child;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url} to become reachable.`);
}

/** Wait for the terminal boot overlay to finish and unmount. */
async function waitForBoot(page) {
  const marker = "text=the archive is now watching.";
  await page.waitForSelector(marker, { state: "visible", timeout: 20_000 });
  await page.waitForSelector(marker, { state: "detached", timeout: 20_000 });
  // Give the post-boot auto-windows (micro-feed, notice) a moment to appear.
  await page.waitForTimeout(1600);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const server = await ensureServer(BASE_URL);

  const executablePath = await resolveExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await waitForBoot(page);

    // 1 ── Main preview: the freshly booted interface, complete with HUD,
    //     the procedural field, and the two auto-opened diagnostic windows.
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT_DIR, "project-preview.png") });

    // 2 ── Active view: open the chromatic lab, spin up a spatial relic,
    //     and scroll deeper into the archive so a live, animated scene is on
    //     screen while the shot is taken.
    await page.keyboard.press("c"); // chromatic lab
    await page.waitForTimeout(350);
    await page.keyboard.press("g"); // spatial relic window
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollBy(0, 720));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT_DIR, "project-active.png") });

    // 3 ── Detail: crop tightly around the spatial-relic window (the
    //     hand-rolled 3D wireframe projection) for a close, crisp view.
    const relic = page.locator("text=/SPATIAL RELIC/").first();
    await relic.waitFor({ state: "visible", timeout: 5000 });
    const box = await relic.locator("xpath=ancestor::div[contains(@class,'absolute')]").first().boundingBox();
    if (box) {
      const pad = 26;
      const clip = {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(VIEWPORT.width, box.width + pad * 2),
        height: Math.min(VIEWPORT.height, box.height + pad * 2),
      };
      await page.screenshot({ path: path.join(OUT_DIR, "project-detail.png"), clip });
    } else {
      await page.screenshot({ path: path.join(OUT_DIR, "project-detail.png") });
    }
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }

  console.log("Screenshots written to", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
