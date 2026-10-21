import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BASE_URL = 'http://localhost:5173';

async function testSubmission() {
  console.log('Testing full end-to-end Report Submission Flow...');
  const tempDir = path.join(os.tmpdir(), 'rl_test_sub_' + Date.now());

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--user-data-dir=' + tempDir]
  });

  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/reports/new`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Open accordion
    console.log('Opening Scenario Templates accordion...');
    await page.evaluate(() => {
      const accordion = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Real Emergency Scenario Template'));
      if (accordion) accordion.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click on the first scenario template
    const templateClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Flash Flood & Trapped Elderly'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log(`Scenario template button clicked: ${templateClicked}`);
    await new Promise(r => setTimeout(r, 800));

    // Verify it transitioned to step 2 (Review)
    const activeStepText = await page.evaluate(() => {
      return document.querySelector('.bg-teal-600')?.innerText || '';
    });
    console.log(`Active step after template click: "${activeStepText}"`);

    // Verify form fields are pre-filled
    const descriptionValue = await page.evaluate(() => {
      const textarea = document.querySelector('textarea[name="description"]');
      return textarea ? textarea.value : '';
    });
    console.log(`Description length populated: ${descriptionValue.length} characters`);

    // Click Next Step to go from review -> location
    console.log('Navigating from Review to Location step...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next Step'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click Next Step to go from location -> confirm
    console.log('Navigating from Location to Confirm step...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next Step'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click Confirm & Submit
    console.log('Clicking Confirm & Submit button...');
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm & Submit'));
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check for success screen
    const successScreen = await page.evaluate(() => {
      return document.body.innerText.includes('Incident Report Confirmed & Ingested');
    });
    console.log(`Submission Success Screen displayed: ${successScreen}`);

    if (!successScreen) {
      throw new Error('Report submission success screen was not rendered!');
    }

    if (errors.length > 0) {
      console.error('Errors encountered during flow:', errors);
      throw new Error(`Encountered ${errors.length} browser errors during submission`);
    }

    console.log('🎉 Report Submission Flow completed with 100% SUCCESS!');
  } finally {
    await browser.close();
  }
}

testSubmission().catch(err => {
  console.error('Submission test failed:', err);
  process.exit(1);
});
