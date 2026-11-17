// Real Chromium input playthrough. No scene staging, teleports or state edits.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const report = { checks: [], errors: [], externalRequests: [], screenshots: [], telemetry: {} };
const executablePath = process.env.CHROMIUM_PATH || '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
(async () => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:8080/') && !r.url().startsWith('data:')) report.externalRequests.push(r.url()); });
  const inspect = () => page.evaluate(() => Sundown.app.inspect());
  const check = (name, valid) => { assert.ok(valid, name); report.checks.push(name); console.log('PASS', name); };
  const sleep = n => page.waitForTimeout(n);
  const held = new Set();
  let chaseCaptured = false;
  async function keys(...wanted) {
    const target = new Set(wanted.filter(Boolean));
    for (const k of held) if (!target.has(k)) { await page.keyboard.up(k); held.delete(k); }
    for (const k of target) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
  }
  async function walk(x, y, tolerance = 14) {
    let lastDistance = Infinity;
    let stuck = 0;
    for (let i = 0; i < 700; i++) {
      const p = await inspect();
      if (p.mode !== 'play') throw new Error('Walking interrupted: ' + JSON.stringify(p));
      const dx = x - p.x;
      const dy = y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < tolerance) { await keys(); return; }
      if (Math.abs(d - lastDistance) < 0.2) stuck++; else stuck = 0;
      if (stuck > 35) throw new Error('Walking stuck: ' + JSON.stringify({ p, x, y }));
      lastDistance = d;
      await keys(Math.abs(dx) > 10 ? dx > 0 ? 'd' : 'a' : null,
        Math.abs(dy) > 10 ? dy > 0 ? 's' : 'w' : null, 'Shift');
      await sleep(65);
    }
    throw new Error('Walking timeout');
  }
  async function drive(points) {
    let index = 0;
    for (let i = 0; i < 1800; i++) {
      const p = await inspect();
      if (p.mode !== 'play') throw new Error('Driving interrupted: ' + JSON.stringify(p));
      const goal = points[index];
      const dx = goal.x - p.x;
      const dy = goal.y - p.y;
      const distance = Math.hypot(dx, dy);
      if (!chaseCaptured && index === 2 && p.x > 2330 && p.speed > 100 && p.heat > 0 && p.police.length) {
        await shot('screenshots/2-play.jpg');
        report.telemetry.chase = p;
        chaseCaptured = true;
      }
      if (distance < (index === points.length - 1 ? 50 : 50)) {
        index++;
        if (index >= points.length) {
          await keys('Space');
          await sleep(700);
          await keys();
          return;
        }
        continue;
      }
      const angle = Math.atan2(dy, dx);
      const diff = Math.atan2(Math.sin(angle - p.angle), Math.cos(angle - p.angle));
      const targetSpeed = Math.abs(diff) > 0.5 ? 65 : distance < 160 ? 105 : 220;
      await keys(Math.abs(diff) > 0.055 ? diff > 0 ? 'd' : 'a' : null,
        p.speed < targetSpeed - 8 ? 'w' : p.speed > targetSpeed + 12 ? 's' : null);
      await sleep(65);
      if (i % 90 === 0) console.log('drive', index, Math.round(p.x), Math.round(p.y), Math.round(p.hp));
    }
    throw new Error('Driving timeout: ' + JSON.stringify(await inspect()));
  }
  async function shot(path) {
    await page.screenshot({ path, type: 'jpeg', quality: 88 });
    report.screenshots.push({ path, bytes: fs.statSync(path).size });
  }
  try {
    await page.goto('http://127.0.0.1:8080/');
    await page.waitForFunction(() => window.Sundown?.app);
    await sleep(300);
    check('Title renders', await page.locator('#title').isVisible());
    await shot('screenshots/1-start.jpg');
    await page.click('#start');
    check('Start enters play', (await inspect()).mode === 'play');
    const trafficBefore = await page.evaluate(() => Sundown.app.state.cars.find(c => c.ai).x);
    const pedestrianBefore = await page.evaluate(() => Sundown.app.state.pedestrians[0].y);
    await walk(745, 790);
    check('WASD walking', (await inspect()).y < 810);
    check('Traffic moves', trafficBefore !== await page.evaluate(() => Sundown.app.state.cars.find(c => c.ai).x));
    check('Pedestrians move', pedestrianBefore !== await page.evaluate(() => Sundown.app.state.pedestrians[0].y));
    await page.keyboard.press('e');
    check('Contact dialogue', (await inspect()).mode === 'dialogue');
    await page.keyboard.press('Enter');
    check('Contract one complete', (await inspect()).mission === 1 && (await inspect()).mode === 'result');
    await page.keyboard.press('Enter');
    await walk(745, 885);
    await walk(1100, 885);
    await page.keyboard.press('e');
    await sleep(200);
    check('E steals courier van', (await inspect()).car === 'courier');
    check('Theft raises wanted level', (await inspect()).heat >= 1.5);
    await sleep(500);
    check('Police respond', (await inspect()).police.length > 0);
    const before = await inspect();
    await keys('w');
    await sleep(1400);
    await keys();
    check('Driving moves vehicle', (await inspect()).x > before.x + 80);
    await drive([{ x: 2140, y: 902 }, { x: 2140, y: 1440 }, { x: 2490, y: 1440 }]);
    await sleep(300);
    if (!chaseCaptured) throw new Error('Moving pursuit screenshot was not captured');
    check('Active pursuit remains', (await inspect()).heat > 0 && (await inspect()).police.length > 0);
    await page.keyboard.press('e');
    check('Courier delivered', (await inspect()).mode === 'result' && (await inspect()).mission === 2);
    await page.keyboard.press('Enter');
    await page.keyboard.press('e');
    check('E exits vehicle', !(await inspect()).car);
    await page.keyboard.press('e');
    check('E reenters vehicle', (await inspect()).car === 'courier');
    await page.keyboard.press('e');
    await walk(2480, 1530);
    await walk(2460, 1570);
    // Fire from outside the yard; aiming follows the actual rendered enemy positions.
    for (let i = 0; i < 160; i++) {
      const p = await inspect();
      if (p.stage === 1) break;
      if (p.mode !== 'play') throw new Error('Combat interrupted: ' + JSON.stringify(p));
      const enemy = p.enemies.filter(e => e.hp > 0).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (!enemy) break;
      const pos = await page.evaluate(e => {
        const r = Sundown.app.renderer;
        return { x: (e.x - r.view.x) * r.view.scale + innerWidth / 2,
          y: (e.y - r.view.y) * r.view.scale * 0.72 + innerHeight / 2 };
      }, enemy);
      await page.mouse.move(pos.x, pos.y);
      await page.mouse.down();
      await sleep(220);
      await page.mouse.up();
      if (i % 10 === 0) console.log('combat', (await inspect()).hp, (await inspect()).enemies.map(e => e.hp));
    }
    check('Shooting defeats four enemies and secures ledger', (await inspect()).stage === 1);
    report.telemetry.combat = await inspect();
    await walk(2460, 1440);
    await walk(2140, 1440);
    await walk(2140, 2000);
    await walk(550, 2000);
    await sleep(1000);
    for (let i = 0; i < 5 && (await inspect()).mode === 'play'; i++) {
      await page.keyboard.press('e');
      await sleep(150);
    }
    check('Safehouse clears wanted level', (await inspect()).heat === 0);
    check('All three contracts complete', (await inspect()).mission === 3 && (await inspect()).mode === 'result');
    await sleep(200);
    await shot('screenshots/3-end.jpg');
    report.telemetry.ending = await inspect();
    await page.keyboard.press('Enter');
    check('Ending opens free roam', (await inspect()).mode === 'play');
    await page.keyboard.press('m');
    check('M enlarges map', (await inspect()).mapOpen);
    await page.keyboard.press('m');
    await page.keyboard.press('p');
    check('P pauses', (await inspect()).mode === 'paused');
    const paused = await inspect();
    await page.keyboard.down('d');
    await sleep(350);
    await page.keyboard.up('d');
    check('Pause freezes movement', (await inspect()).x === paused.x);
    await page.keyboard.press('Escape');
    check('Escape resumes', (await inspect()).mode === 'play');
    await page.keyboard.press('p');
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem(Sundown.SAVE_KEY)));
    check('localStorage save writes full progress', saved.mission === 3 && saved.completed.length === 3);
    await page.reload();
    await page.waitForFunction(() => window.Sundown?.app);
    await page.click('#continue');
    check('Save reads after page reload', (await inspect()).mission === 3 && (await inspect()).cash === saved.cash);
    const context2 = await browser.newContext({ storageState: await context.storageState(), viewport: { width: 1280, height: 720 } });
    const page2 = await context2.newPage();
    await page2.goto('http://127.0.0.1:8080/');
    await page2.click('#continue');
    check('Save restores in a fresh browser context', await page2.evaluate(() => Sundown.app.inspect().mission) === 3);
    await context2.close();
    await page.bringToFront();
    await page.keyboard.press('p');
    await page.getByRole('button', { name: 'RESTART STORY', exact: true }).click();
    check('Restart resets story and health', (await inspect()).mission === 0 && (await inspect()).hp === 100);
    check('Zero JavaScript errors', report.errors.length === 0);
    check('No external network requests', report.externalRequests.length === 0);
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.failure = error.stack;
    report.telemetry.failure = await inspect().catch(() => null);
    await page.screenshot({ path: '/tmp/sundown-failure.jpg', type: 'jpeg', quality: 85 });
    console.error(error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync('browser-validation.json', JSON.stringify(report, null, 2) + '\n');
    console.log('RESULT', report.status, report.checks.length, 'checks');
    await browser.close();
  }
})();
