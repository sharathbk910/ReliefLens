import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const widths = [320, 375, 768, 1024, 1440];
const pages = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'duplicates', path: '/duplicates' },
  { name: 'map', path: '/map' },
  { name: 'report_sheet', path: '/reports/new' },
];

async function main() {
  console.log('📸 Capturing Spatial UI Screenshots...');

  const tempDir = path.join(os.tmpdir(), 'edge_shots_' + Date.now());

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--user-data-dir=' + tempDir,
    ],
  });

  const capturedFiles = [];

  try {
    for (const theme of ['dark', 'light']) {
      for (const p of pages) {
        const page = await browser.newPage();
        await page.goto(`http://localhost:3000${p.path}`);
        await page.waitForSelector('body');
        await new Promise((r) => setTimeout(r, 1200));

        try {
          await page.evaluate((th) => {
            if (th === 'light') {
              document.documentElement.classList.add('light');
            } else {
              document.documentElement.classList.remove('light');
            }
          }, theme);
        } catch (e) {
          await new Promise((r) => setTimeout(r, 800));
          await page.evaluate((th) => {
            if (th === 'light') {
              document.documentElement.classList.add('light');
            } else {
              document.documentElement.classList.remove('light');
            }
          }, theme);
        }

        for (const w of widths) {
          await page.setViewport({ width: w, height: w < 768 ? 800 : 900 });
          await new Promise((r) => setTimeout(r, 150));

          const filename = `${p.name}_${w}px_${theme}.png`;
          const filepath = path.join(SCREENSHOT_DIR, filename);
          await page.screenshot({ path: filepath });
          capturedFiles.push(filename);
          console.log(`✅ [${theme}] ${p.name} @ ${w}px -> ${filename}`);
        }

        await page.close();
      }
    }

    console.log(`\n🎉 Successfully captured ${capturedFiles.length} screenshots!`);
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'manifest.json'),
      JSON.stringify({ capturedFiles, total: capturedFiles.length, timestamp: new Date().toISOString() }, null, 2)
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
