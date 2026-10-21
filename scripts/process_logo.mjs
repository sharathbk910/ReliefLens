import puppeteer from 'puppeteer-core';
import fs from 'fs';

const generatedPath = 'C:/Users/shara.DESKTOP-ERKJGV1/.gemini/antigravity-ide/brain/866b664b-9020-4f4d-80c6-7dc0cf51eef9/resqwave_logo_mark_1792612809577.jpg';
const imgBase64 = fs.readFileSync(generatedPath).toString('base64');
const dataUri = 'data:image/jpeg;base64,' + imgBase64;

async function processLogo() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024 });

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:transparent;">
      <canvas id="c" width="1024" height="1024"></canvas>
      <script>
        const img = new Image();
        img.onload = () => {
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 1024, 1024);
          const imgData = ctx.getImageData(0, 0, 1024, 1024);
          const data = imgData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // If near white, feather transparency
            if (r > 242 && g > 242 && b > 242) {
              const diff = Math.min(255 - r, 255 - g, 255 - b);
              if (diff <= 5) {
                data[i+3] = 0;
              } else {
                data[i+3] = Math.round((diff / 13) * 255);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          window.__done = true;
        };
        img.src = '${dataUri}';
      </script>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForFunction('window.__done === true');

  const canvas = await page.$('#c');
  await canvas.screenshot({ path: 'public/logo.png', omitBackground: true });
  await canvas.screenshot({ path: 'public/resqwave-icon.png', omitBackground: true });
  console.log('✅ Generated transparent public/logo.png and public/resqwave-icon.png');

  // Favicon 64x64
  await page.setViewport({ width: 128, height: 128 });
  const htmlFav = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:transparent;">
      <canvas id="cf" width="128" height="128"></canvas>
      <script>
        const img = new Image();
        img.onload = () => {
          const canvas = document.getElementById('cf');
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 128, 128);
          const imgData = ctx.getImageData(0, 0, 128, 128);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            if (r > 242 && g > 242 && b > 242) {
              const diff = Math.min(255 - r, 255 - g, 255 - b);
              if (diff <= 5) {
                data[i+3] = 0;
              } else {
                data[i+3] = Math.round((diff / 13) * 255);
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
          window.__favDone = true;
        };
        img.src = '${dataUri}';
      </script>
    </body>
    </html>
  `;
  await page.setContent(htmlFav);
  await page.waitForFunction('window.__favDone === true');
  const favCanvas = await page.$('#cf');
  await favCanvas.screenshot({ path: 'public/favicon.png', omitBackground: true });
  console.log('✅ Generated public/favicon.png');

  await browser.close();
}

processLogo().catch(console.error);
