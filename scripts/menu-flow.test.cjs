/* فحص مؤتمت: تدفق القوائم الكامل (splash → scenario → difficulty → playing) + الإطلاق أثناء اللعب */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 300)); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + String(err).slice(0, 300)));

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // 1) splash: بطاقة INITIALIZE DEFENSE (HTML)
  const initBtn = page.locator('text=/INITIALIZE DEFENSE|بدء الدفاع/').first();
  console.log('INITIALIZE visible:', await initBtn.count());
  await page.screenshot({ path: 'artifacts/01-splash.png' });
  if (await initBtn.count()) {
    await initBtn.click({ timeout: 4000 });
    await page.waitForTimeout(1200);
  }

  // 2) scenario_select: بطاقة سيناريو + زر ENGAGE
  const txtAfterInit = await page.evaluate(() => document.body.innerText);
  console.log('scenario screen visible:', /CHOOSE INCIDENT VECTOR|CHOOSE INCIDENT/i.test(txtAfterInit) || /اختيار/i.test(txtAfterInit));
  await page.screenshot({ path: 'artifacts/02-scenario.png' });

  const engBtn = page.locator('text=/ENGAGE SCENARIO|اختيار ومتابعة/').first();
  console.log('ENGAGE SCENARIO count:', await engBtn.count());
  if (await engBtn.count()) {
    await engBtn.click({ timeout: 4000 });
    await page.waitForTimeout(1200);
  }

  // 3) difficulty_select: بطاقة صعوبة + زر ENGAGE MISSION
  const txtAfterEngage = await page.evaluate(() => document.body.innerText);
  console.log('difficulty screen visible:', /TRAINING PACING|DIFFICULTY/i.test(txtAfterEngage));
  await page.screenshot({ path: 'artifacts/03-difficulty.png' });

  const launchBtn = page.locator('text=/ENGAGE MISSION|بدء المهمة/').first();
  console.log('ENGAGE MISSION count:', await launchBtn.count());
  if (await launchBtn.count()) {
    await launchBtn.click({ timeout: 4000 });
    await page.waitForTimeout(3000);
  }

  // 4) playing: تحقق اختفاء القائمات ووجود HUD + الإطلاق بالنقر على canvas
  const txtPlaying = await page.evaluate(() => document.body.innerText);
  const menuGone = !/STEP 1 \/\/|STEP 2 \/\/|INITIALIZE DEFENSE/i.test(txtPlaying);
  console.log('menu gone after launch:', menuGone);
  await page.screenshot({ path: 'artifacts/04-playing-before-shot.png' });

  // نقرة إطلاق في منتصف الشاشة على بطاقة الإجابة الوسطى
  await page.mouse.click(640, 460);
  await page.waitForTimeout(1500);
 	await page.screenshot({ path: 'artifacts/05-after-shot.png' });
  const txtAfterShot = await page.evaluate(() => document.body.innerText);
  console.log('still in playing (HUD alive):', !/STEP 1 \/\/ INITIALIZE/i.test(txtAfterShot));

  console.log('=== console errors (first 8) ===');
  errors.slice(0, 8).forEach((e) => console.log(' -', e));
  await browser.close();
})().catch((e) => { console.error('TEST FAILED:', e); process.exit(1); });
