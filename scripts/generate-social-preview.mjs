// Generates the GitHub social-preview card (1280 x 640) for INDEX ORGANICA.
//
// The card uses the real application screenshot (docs/images/project-preview.png)
// as its visual foundation and layers restrained typography on top — it is not
// an AI-generated image, only the live capture plus a text overlay.
//
// Usage:
//   npm run generate:social

import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, "../docs/images/project-preview.png");
const OUT = path.resolve(__dirname, "../docs/images/github-social-preview.png");
const W = 1280;
const H = 640;

function resolveExecutablePath() {
  return process.env.CHROMIUM_PATH || undefined;
}

async function main() {
  const base64 = (await readFile(BASE)).toString("base64");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: "DejaVu Sans Mono", ui-monospace, Menlo, monospace;
    color: #c6ff4d;
    background: #050705;
  }
  .bg {
    position: absolute; inset: 0;
    background: url(data:image/png;base64,${base64}) center / cover no-repeat;
  }
  .scrim {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(5,7,5,0.94) 0%, rgba(5,7,5,0.72) 42%, rgba(5,7,5,0.15) 70%, rgba(5,7,5,0) 100%),
      linear-gradient(0deg, rgba(5,7,5,0.85) 0%, rgba(5,7,5,0) 40%);
  }
  .frame {
    position: absolute; inset: 30px;
    border: 1px solid rgba(198,255,77,0.35);
    pointer-events: none;
  }
  .copy {
    position: absolute; left: 64px; top: 50%; transform: translateY(-46%);
    max-width: 760px;
  }
  .kicker {
    font-size: 22px; letter-spacing: 0.5em; text-transform: uppercase;
    color: #aaff00; opacity: 0.9;
  }
  .title {
    margin-top: 14px;
    font-size: 76px; font-weight: 700; letter-spacing: 0.12em;
    color: #c6ff4d;
    text-shadow: 0 0 24px rgba(170,255,0,0.55);
    line-height: 1.02;
  }
  .rule {
    margin: 26px 0;
    width: 240px; height: 1px;
    background: linear-gradient(90deg, #aaff00, transparent);
  }
  .desc {
    font-size: 23px; line-height: 1.5; letter-spacing: 0.02em;
    color: #d9ff8e; opacity: 0.92;
  }
  .credit {
    position: absolute; left: 64px; bottom: 62px;
    font-size: 18px; letter-spacing: 0.34em; text-transform: uppercase;
    color: #aaff00; opacity: 0.85;
  }
  .mark {
    position: absolute; right: 64px; bottom: 60px;
    font-size: 40px; color: #c6ff4d; text-shadow: 0 0 18px rgba(170,255,0,0.5);
  }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="scrim"></div>
  <div class="frame"></div>
  <div class="copy">
    <div class="kicker">&#8855; Living Archive</div>
    <div class="title">INDEX<br/>ORGANICA</div>
    <div class="rule"></div>
    <div class="desc">An endlessly scrolling archive of procedural specimens,<br/>spatial relics and anomalies &mdash; generated live from a single seed.</div>
  </div>
  <div class="credit">Created by Zazie Productions</div>
  <div class="mark">&#8855;</div>
</body>
</html>`;

  await mkdir(path.dirname(OUT), { recursive: true });
  const executablePath = await resolveExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: OUT });
  } finally {
    await browser.close();
  }
  console.log("Social preview written to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
