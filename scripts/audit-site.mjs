import puppeteer from 'puppeteer-core';

async function runAudit() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const errors = [];
  const warnings = [];
  const failedRequests = [];

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('http://localhost:3000', ['geolocation']);

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setGeolocation({ latitude: 12.9716, longitude: 77.5946, accuracy: 15 });

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push({ source: 'console.error', url: page.url(), text });
    } else if (type === 'warning' && !text.includes('geolocation') && !text.includes('React Router')) {
      warnings.push({ source: 'console.warn', url: page.url(), text });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({ source: 'pageerror', url: page.url(), text: err.toString(), stack: err.stack });
  });

  page.on('requestfailed', (req) => {
    // Ignore aborted requests or benign tile failures if any
    failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText
    });
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('tile.openstreetmap.org')) {
      errors.push({
        source: 'http_error',
        url: res.url(),
        status: res.status()
      });
    }
  });

  const routes = [
    '/',
    '/dashboard',
    '/login',
    '/map',
    '/reports/new',
    '/duplicates',
    '/audit',
    '/404'
  ];

  console.log('--- Starting Route Audit ---');
  for (const route of routes) {
    console.log(`Checking ${route}...`);
    try {
      const res = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise((r) => setTimeout(r, 1200));

      // Also check if any buttons or links throw errors on click
      // e.g. check for broken links
      const brokenLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]:not(.leaflet-control-zoom-in):not(.leaflet-control-zoom-out):not(.leaflet-control a)'));
        return links
          .map((a) => a.getAttribute('href'))
          .filter((href) => href === '' || href === '#' || href === 'undefined' || href === 'null');
      });
      if (brokenLinks.length > 0) {
        warnings.push({ source: 'broken_href', route, brokenLinks });
      }

      // Check incident links from dashboard if we are on dashboard
      if (route === '/dashboard') {
        const incidentLink = await page.$('a[href^="/incidents/"]');
        if (incidentLink) {
          const href = await page.evaluate(el => el.getAttribute('href'), incidentLink);
          console.log(`Found incident link: ${href}, visiting...`);
          await incidentLink.click();
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    } catch (e) {
      errors.push({ source: 'navigation_exception', route, text: e.toString() });
    }
  }

  // Mobile viewport audit
  console.log('--- Checking Mobile Viewport (375x667) ---');
  await page.setViewport({ width: 375, height: 667 });
  for (const route of ['/dashboard', '/login', '/map', '/reports/new']) {
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle2', timeout: 8000 });
      await new Promise((r) => setTimeout(r, 800));

      // Check for horizontal overflow (causing unwanted horizontal scroll)
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      if (hasHorizontalOverflow) {
        warnings.push({
          source: 'horizontal_overflow',
          route,
          scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
          innerWidth: 375
        });
      }
    } catch (e) {
      errors.push({ source: 'mobile_navigation_exception', route, text: e.toString() });
    }
  }

  await browser.close();

  console.log('\n================ AUDIT REPORT ================');
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  console.log(`Total Failed Requests: ${failedRequests.length}`);

  if (errors.length > 0) {
    console.log('\n--- ERRORS ---');
    console.log(JSON.stringify(errors, null, 2));
  }

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    console.log(JSON.stringify(warnings, null, 2));
  }

  if (failedRequests.length > 0) {
    console.log('\n--- FAILED REQUESTS ---');
    console.log(JSON.stringify(failedRequests, null, 2));
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
