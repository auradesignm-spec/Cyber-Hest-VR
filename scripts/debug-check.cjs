const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 200)); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + String(err).slice(0, 200)));
  page.on('requestfailed', (r) => errors.push('REQFAIL: ' + r.url().slice(0, 120)));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    const buttons = Array.from(document.querySelectorAll('button')).map(b => (b.textContent || '').trim()).filter(Boolean);
    return {
      rootChildren: root ? root.children.length : -1,
      rootHTMLLen: root ? root.innerHTML.length : -1,
      bodyTextLen: document.body.innerText.length,
      buttons: buttons.slice(0, 25),
      hasCanvas: !!document.querySelector('canvas'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('=== errors ===');
  errors.slice(0, 8).forEach(e => console.log(' -', e));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
