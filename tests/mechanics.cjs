// Isolated browser fixtures exercise branches that the story playthrough does not take.
// Fixtures modify simulation state; they are never used for the submitted screenshots.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const checks = [];
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS', name); };
  try {
    await page.goto('http://127.0.0.1:8080/');
    await page.click('#roam');
    check('Free roam available from title', await page.evaluate(() => Sundown.app.state.freeRoam));
    check('Web Audio starts after interaction', await page.evaluate(() => Sundown.audio.context.state === 'running'));
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.enemies = [{ x: s.player.x + 45, y: s.player.y, hp: 70, angle: Math.PI, cooldown: 30 }];
    });
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    check('Space melee damages a nearby hostile', await page.evaluate(() => Sundown.app.state.enemies[0].hp === 30));
    await page.waitForTimeout(450);
    await page.mouse.click(640, 360, { button: 'right' });
    check('Right click melee defeats hostile', await page.evaluate(() => Sundown.app.state.enemies[0].hp <= 0));
    await page.keyboard.press('q');
    check('Sound toggle works', await page.evaluate(() => Sundown.audio.muted));
    await page.keyboard.press('q');
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.heat = 2;
      s.player.x = 550;
      s.player.y = 2000;
      s.player.hp = 50;
    });
    await page.waitForTimeout(1200);
    check('Hiding at safehouse passively lowers heat', await page.evaluate(() => Sundown.app.state.heat < 1.5));
    await page.keyboard.press('e');
    check('Safehouse interaction heals player', await page.evaluate(() => Sundown.app.state.player.hp >= 75));
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.heat = 0.2;
      s.player.x = 710;
      s.player.y = 850;
      s.police = [];
      s.unseen = 6;
      s.policeClock = 100;
    });
    await page.waitForTimeout(1700);
    check('Breaking sight naturally clears wanted level', await page.evaluate(() => Sundown.app.state.heat === 0));
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.player.hp = 5;
      s.player.invulnerable = 0;
      s.bullets.push({ x: s.player.x, y: s.player.y, vx: 0, vy: 0, enemy: true, damage: 10, life: 1 });
    });
    await page.waitForTimeout(150);
    check('Lethal enemy fire opens failure screen', await page.getByRole('heading', { name: 'Out of luck.' }).isVisible());
    await page.getByRole('button', { name: 'BACK ON YOUR FEET →' }).click();
    check('Failure recovery restores player and keeps progress', await page.evaluate(() => {
      const s = Sundown.app.state;
      return s.mode === 'play' && s.player.hp === 100 && s.heat === 0 && s.player.x === 550;
    }));
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.player.x = 410;
      s.player.y = 500;
    });
    await page.keyboard.down('d');
    await page.waitForTimeout(600);
    await page.keyboard.up('d');
    check('Building collision blocks walking', await page.evaluate(() => Sundown.app.state.player.x < 435));
    await page.evaluate(() => {
      const s = Sundown.app.state;
      s.player.x = s.caches[0].x;
      s.player.y = s.caches[0].y;
    });
    await page.waitForTimeout(100);
    check('Collectible stash rewards cash', await page.evaluate(() => Sundown.app.state.collected.includes(0)));
    const beforeOffline = await page.evaluate(() => Sundown.app.state.player.y);
    await page.context().setOffline(true);
    await page.keyboard.down('s');
    await page.waitForTimeout(300);
    await page.keyboard.up('s');
    check('Gameplay continues fully offline after loading', await page.evaluate(() => Sundown.app.state.player.y) > beforeOffline);
    await page.context().setOffline(false);
    await page.evaluate(() => {
      // Avoid pagehide's normal autosave repairing the deliberately corrupted fixture.
      Sundown.app.state.mode = 'title';
      localStorage.setItem(Sundown.SAVE_KEY, '{invalid json');
    });
    await page.reload();
    check('Corrupt save safely falls back to title', await page.locator('#continue').isHidden());
    await page.goto('file://' + process.cwd() + '/game/index.html');
    await page.waitForFunction(() => window.Sundown?.app);
    await page.click('#start');
    check('Static game also opens directly from file', await page.evaluate(() => Sundown.app.state.mode === 'play'));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(100);
    check('Canvas adapts to desktop viewport resize', await page.evaluate(() => document.querySelector('canvas').width === 1440));
    check('No browser exceptions in edge cases', errors.length === 0);
    fs.writeFileSync('mechanics-validation.json', JSON.stringify({ status: 'passed', method: 'Isolated browser fixtures plus real input; no screenshot staging', checks, errors }, null, 2) + '\n');
  } catch (error) {
    console.error(error);
    fs.writeFileSync('mechanics-validation.json', JSON.stringify({ status: 'failed', checks, errors, failure: error.stack }, null, 2) + '\n');
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
