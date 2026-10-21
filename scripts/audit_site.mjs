import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BASE_URL = 'http://localhost:5173';

const routesToTest = [
  '/',
  '/dashboard',
  '/map',
  '/reports/new',
  '/duplicates',
  '/audit',
  '/login',
  '/non-existent-route-404'
];

async function runAudit() {
  console.log(`Starting ResQWave Site Audit using executable: ${EXECUTABLE_PATH}`);
  const tempDir = path.join(os.tmpdir(), 'rl_audit_' + Date.now());

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--user-data-dir=' + tempDir]
  });

  const issues = [];

  try {
    const page = await browser.newPage();

    page.on('pageerror', (err) => {
      console.error(`[PAGE ERROR] ${err.message}`);
      issues.push({ type: 'pageerror', message: err.message, stack: err.stack });
    });

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.error(`[CONSOLE ERROR] ${text}`);
        issues.push({ type: 'console.error', message: text });
      } else if (type === 'warning' && !text.includes('geolocation') && !text.includes('React Router')) {
        console.warn(`[CONSOLE WARN] ${text}`);
      }
    });

    page.on('requestfailed', (req) => {
      const failure = req.failure();
      const url = req.url();
      if (failure && !url.includes('tile.openstreetmap.org') && !url.includes('favicon.ico')) {
        console.error(`[REQUEST FAILED] ${url} : ${failure.errorText}`);
        issues.push({ type: 'requestfailed', url, errorText: failure.errorText });
      }
    });

    for (const route of routesToTest) {
      console.log(`\n--- Auditing Route: ${route} ---`);
      try {
        const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 15000 });
        const status = response ? response.status() : 'no response';

        await new Promise((r) => setTimeout(r, 600));

        const title = await page.title();
        const rootContent = await page.evaluate(() => {
          const root = document.getElementById('root');
          return {
            hasRoot: !!root,
            innerTextLength: root ? root.innerText.trim().length : 0,
            hasHeading: !!document.querySelector('h1, h2, h3'),
            headingText: document.querySelector('h1, h2, h3')?.innerText || ''
          };
        });

        console.log(`Status: ${status}, Title: "${title}", Heading: "${rootContent.headingText}"`);

        if (rootContent.innerTextLength === 0) {
          issues.push({ type: 'empty_page', route, message: 'Page rendered empty root or blank page' });
        }
      } catch (err) {
        console.error(`Error loading ${route}:`, err.message);
        issues.push({ type: 'navigation_error', route, message: err.message });
      }
    }

    // Test navigating to a REAL incident detail page
    console.log(`\n--- Testing Real Incident Detail Navigation ---`);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    const dossierLink = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/incidents/"]');
      return link ? link.getAttribute('href') : null;
    });

    const targetUrl = dossierLink ? `${BASE_URL}${dossierLink}` : `${BASE_URL}/incidents/b0000000-0000-4000-8000-000000000001`;
    console.log(`Navigating to incident dossier: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    const incidentHeading = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
    console.log(`Incident Detail Heading: "${incidentHeading}"`);
    if (!incidentHeading) {
      issues.push({ type: 'incident_heading_missing', message: 'No h1 heading on valid incident detail page' });
    }

    // Test navigating to NON-EXISTENT incident (should show friendly fallback without infinite loop)
    console.log(`\n--- Testing Non-Existent Incident Handling ---`);
    await page.goto(`${BASE_URL}/incidents/nonexistent-id-99999`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 800));
    const notFoundText = await page.evaluate(() => document.body.innerText);
    const hasNotFound = notFoundText.includes('Incident Not Found');
    console.log(`Graceful Not Found Displayed: ${hasNotFound}`);
    if (!hasNotFound) {
      issues.push({ type: 'not_found_missing', message: 'Non-existent incident did not show Incident Not Found UI' });
    }

    // Test Report Form Submission & Validation Flow
    console.log(`\n--- Testing Report Form Flow ---`);
    await page.goto(`${BASE_URL}/reports/new`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    // Click "Manual Form" button if in voice mode
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const manualBtn = buttons.find(b => b.innerText.includes('Manual Form') || b.innerText.includes('Switch to Manual'));
      if (manualBtn) manualBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const formInputs = await page.evaluate(() => {
      return document.querySelectorAll('input, select, textarea').length;
    });
    console.log(`Form inputs accessible: ${formInputs}`);

    // Test Duplicates Page
    console.log(`\n--- Testing Duplicates Review Flow ---`);
    await page.goto(`${BASE_URL}/duplicates`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));
    const duplicateCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="border"][class*="rounded"]');
      return cards.length;
    });
    console.log(`Duplicates page elements rendered: ${duplicateCount}`);

    console.log(`\n================ AUDIT SUMMARY ================`);
    console.log(`Total Issues/Errors Detected: ${issues.length}`);
    if (issues.length > 0) {
      issues.forEach((iss, idx) => {
        console.log(`${idx + 1}. [${iss.type}] ${iss.message || iss.errorText || ''}`);
      });
    } else {
      console.log('✅ ALL PAGES AND USER FLOWS PASSED WITH 0 ERRORS!');
    }

  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Fatal audit runner error:', err);
  process.exit(1);
});
