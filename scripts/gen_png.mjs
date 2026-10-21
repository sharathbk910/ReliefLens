import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function generatePng() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  const svg = fs.readFileSync('public/favicon.svg', 'utf8');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;height:100vh;background:transparent;">${svg}</body></html>`);
  const svgElement = await page.$('svg');
  if (svgElement) {
    await svgElement.screenshot({ path: 'public/logo.png', omitBackground: true });
    console.log('✅ Successfully created 512x512 public/logo.png for ResQWave');
  }
  await browser.close();
}

generatePng().catch(console.error);
