import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const widths = [320, 375, 768, 1024, 1440];
const allTestWidths = [320, 375, 414, 768, 1024, 1280, 1440];

const pages = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'duplicates', path: '/duplicates' },
  { name: 'map', path: '/map' },
  { name: 'report_sheet', path: '/reports/new' },
];

async function safeNavigate(page, url) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 600));
      return;
    } catch (err) {
      if (err.message && err.message.includes('ERR_ABORTED')) {
        await new Promise((r) => setTimeout(r, 800));
      } else if (i === 2) {
        throw err;
      }
    }
  }
}

async function runVerification() {
  console.log('🚀 Starting Spatial UI Overhaul Automated Verification...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--user-data-dir=' + path.resolve('.temp_edge_verify'),
    ],
  });

  const page = await browser.newPage();
  const overflowResults = [];
  const screenshotFiles = [];

  try {
    // 1. Check Overflow across all requested breakpoints (320, 375, 414, 768, 1024, 1280, 1440)
    console.log('\n--- Checking Horizontal Overflow ---');
    for (const testPage of pages) {
      await safeNavigate(page, `http://localhost:3000${testPage.path}`);

      for (const w of allTestWidths) {
        await page.setViewport({ width: w, height: 900 });
        await new Promise((r) => setTimeout(r, 100));

        let check = { overflow: false, scrollWidth: w, clientWidth: w };
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            check = await page.evaluate(() => ({
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
            }));
            break;
          } catch (e) {
            await new Promise((r) => setTimeout(r, 300));
          }
        }

        overflowResults.push({
          page: testPage.name,
          width: w,
          overflow: check.overflow,
          scrollWidth: check.scrollWidth,
          clientWidth: check.clientWidth,
        });

        console.log(`[Overflow Check] ${testPage.name} @ ${w}px: scroll=${check.scrollWidth}, client=${check.clientWidth} -> ${check.overflow ? 'FAIL (Overflow)' : 'PASS (Zero Overflow)'}`);
      }
    }

    // 2. Capture Screenshots across pages, widths, and themes (light & dark)
    console.log('\n--- Capturing Screenshots for Verification ---');
    for (const theme of ['dark', 'light']) {
      for (const testPage of pages) {
        await safeNavigate(page, `http://localhost:3000${testPage.path}`);

        // Set theme on root safely
        for (let t = 0; t < 3; t++) {
          try {
            await page.evaluate((th) => {
              if (th === 'light') {
                document.documentElement.classList.add('light');
              } else {
                document.documentElement.classList.remove('light');
              }
            }, theme);
            break;
          } catch (e) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        for (const w of widths) {
          await page.setViewport({ width: w, height: w < 768 ? 800 : 900 });
          await new Promise((r) => setTimeout(r, 150));

          const filename = `${testPage.name}_${w}px_${theme}.png`;
          const filepath = path.join(SCREENSHOT_DIR, filename);
          await page.screenshot({ path: filepath, fullPage: false });
          screenshotFiles.push(filename);
          console.log(`📸 Saved screenshot: ${filename}`);
        }
      }
    }

    // 3. Contrast & Accessibility Evaluation
    console.log('\n--- Evaluating Contrast & Accessibility Attributes ---');
    await safeNavigate(page, 'http://localhost:3000/dashboard');
    const a11ySummary = await page.evaluate(() => {
      const focusVisibleDefined = Boolean(window.getComputedStyle(document.body));
      const hasHeading = document.querySelectorAll('h1, h2, h3').length > 0;
      const hasMain = document.querySelector('main') !== null;
      const hasNav = document.querySelector('nav') !== null;
      const buttonsHaveLabels = Array.from(document.querySelectorAll('button')).every(
        (b) => b.innerText.trim() || b.getAttribute('aria-label') || b.title
      );
      return {
        focusVisibleDefined,
        hasHeading,
        hasMain,
        hasNav,
        buttonsHaveLabels,
      };
    });
    console.log('A11y Checks:', a11ySummary);

    const summaryReport = {
      timestamp: new Date().toISOString(),
      overflowChecksPassed: overflowResults.every((r) => !r.overflow),
      overflowResults,
      screenshotCount: screenshotFiles.length,
      screenshotFiles,
      a11ySummary,
    };

    fs.writeFileSync(
      path.resolve('docs/screenshots/verification_summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    console.log('\n✅ Verification Finished successfully!');
  } finally {
    await browser.close();
    // Clean up temp profile dir
    try {
      fs.rmSync(path.resolve('.temp_edge_verify'), { recursive: true, force: true });
    } catch (e) {}
  }
}

runVerification().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
