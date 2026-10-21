import puppeteer from 'puppeteer-core';
import path from 'path';

async function testLive() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Add timestamp cache buster
  await page.goto(`https://resqwavezz.vercel.app/dashboard?t=${Date.now()}`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 400));
  await new Promise(r => setTimeout(r, 600));

  const artifactDir = 'C:\\Users\\shara.DESKTOP-ERKJGV1\\.gemini\\antigravity-ide\\brain\\866b664b-9020-4f4d-80c6-7dc0cf51eef9';
  const helplineShot = path.join(artifactDir, 'vercel_live_now_helpline.png');
  await page.screenshot({ path: helplineShot });
  console.log('Saved vercel_live_now_helpline.png');

  // Also check innerHTML of helpline header
  const headerHtml = await page.evaluate(() => {
    const el = document.querySelector('h2');
    return el ? el.parentElement?.parentElement?.innerHTML : 'not found';
  });
  console.log('Header HTML snippet:', headerHtml?.substring(0, 300));

  await browser.close();
}

testLive().catch(err => console.error(err));
