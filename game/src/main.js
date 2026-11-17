// Browser entrypoint, input, accessible menus and the fixed 60 Hz loop.
(function (G) {
  const canvas = document.getElementById('game');
  const renderer = G.createRenderer(canvas);
  let state = G.createState();
  const input = { keys: new Set(), fire: false, aim: { x: 800, y: 800 }, mouseX: 640, mouseY: 360 };
  const $ = id => document.getElementById(id);
  let lastMode = '';
  let last = performance.now();
  let accumulator = 0;
  let hudClock = 0;
  let lastToast = '';

  function clearInput() {
    input.keys.clear();
    input.fire = false;
  }
  function fresh(freeRoam = false) {
    clearInput();
    G.audio.start();
    state = G.createState();
    state.mode = 'play';
    state.freeRoam = freeRoam;
    state.camera = { x: state.player.x, y: state.player.y };
    G.notify(state, freeRoam ? 'PORT SEREIN / Find your own trouble. Stashes pay $200 each.'
      : 'LENA: I’m at the garage, Nico. Follow the amber marker.');
    G.save(state);
    updateScreen();
  }
  function continueSave() {
    const data = G.readSave();
    if (!data) return fresh();
    G.audio.start();
    clearInput();
    state = G.createState();
    G.restore(state, data);
    updateScreen();
  }
  function pause() {
    if (state.mode === 'play') {
      state.mode = 'paused';
      G.save(state);
    } else if (state.mode === 'paused') state.mode = 'play';
    clearInput();
    G.audio.cue('ui');
    updateScreen();
  }
  function resumeResult() {
    state.mode = 'play';
    if (state.mission >= 3) state.freeRoam = true;
    if (state.mission === 1) G.notify(state, 'LENA: Silver courier. Sol Avenue. Bring it to Dock 04.');
    if (state.mission === 2) G.notify(state, 'LENA: They saw the handoff. Clear the Wire Yard and get their ledger.');
    updateScreen();
  }
  function modal(kicker, title, body, stats, actions) {
    $('modal-kicker').textContent = kicker;
    $('modal-title').textContent = title;
    $('modal-body').textContent = body;
    $('modal-stats').textContent = stats;
    $('modal-actions').replaceChildren();
    for (const [text, action, secondary] of actions) {
      const button = document.createElement('button');
      button.textContent = text;
      if (secondary) button.className = 'secondary';
      button.addEventListener('click', () => {
        G.audio.cue('ui');
        clearInput();
        action();
        updateScreen();
      });
      $('modal-actions').append(button);
    }
    $('modal-actions').firstChild?.focus({ preventScroll: true });
  }
  function updateScreen() {
    const mode = state.mode;
    $('title').hidden = mode !== 'title';
    $('hud').hidden = mode === 'title';
    $('overlay').hidden = ['title', 'play'].includes(mode);
    $('continue').hidden = !G.readSave();
    if (mode === lastMode) return;
    lastMode = mode;
    if (mode === 'dialogue') {
      modal(state.dialogue.speaker, state.dialogue.title, state.dialogue.body,
        'THE JOB / Steal a courier van. Uncover a debt ledger.',
        [['TAKE THE JOB →', () => G.completeContract(state)]]);
    }
    if (mode === 'result') {
      const r = state.result;
      modal(r.final ? 'STORY COMPLETE / ALL DEBTS SETTLED' : `CONTRACT COMPLETE / ${state.completed.length} OF 3`,
        r.final ? 'A clean slate.' : r.name,
        r.final ? 'The ledger is safe. The Wire Crew is finished. Lena’s garage is still standing.\n\nFor the first time in years, Port Serein owes you nothing. And you owe it even less.'
          : state.mission === 1 ? 'Lena has a plan. The courier van is waiting on Sol Avenue.\nA quiet job, if the city lets it be.'
            : 'The van is delivered. But the Wire Crew saw the handoff.\nClear their yard, take the real ledger, and get out.',
        `+$${r.reward.toLocaleString()}  /  $${state.cash.toLocaleString()} TOTAL  /  PROGRESS SAVED`,
        [[r.final ? 'THE CITY IS YOURS →' : 'NEXT CONTRACT →', resumeResult]]);
    }
    if (mode === 'paused') {
      modal('PORT SEREIN / TAKE A BREATH', 'Off the clock.',
        'WASD: walk / throttle & steer · Shift: sprint\nE: talk / steal / exit / deliver · Mouse: aim\nClick or F: shoot · Space: melee / handbrake\nM: map · P / Esc: pause · Q: sound',
        'Your story is saved on this browser.', [
          ['BACK TO THE CITY →', () => { state.mode = 'play'; }],
          ['SAVE & TITLE', () => { G.save(state); state.mode = 'title'; }, true],
          ['RESTART STORY', () => fresh(), true],
        ]);
    }
    if (mode === 'lost') {
      modal('THE CITY ALWAYS COLLECTS', 'Out of luck.',
        'Port Serein got the better of you. Recover at The Low Tide and try the job again.',
        'YOUR CONTRACT PROGRESS IS KEPT', [
          ['BACK ON YOUR FEET →', () => {
            state.player.hp = 100;
            state.player.car = null;
            Object.assign(state.player, { x: G.places.safe.x, y: G.places.safe.y });
            state.heat = 0;
            state.police = [];
            state.bullets = [];
            state.cash = Math.max(0, state.cash - 100);
            state.mode = 'play';
            G.notify(state, 'RECOVERED / $100 recovery fee. Your contract is still active.');
            G.save(state);
          }],
          ['RESTART STORY', () => fresh(), true],
        ]);
    }
  }

  function updateHud() {
    const s = state;
    if (s.mode === 'title') return;
    const contract = G.contracts[s.mission];
    $('chapter').textContent = s.freeRoam ? 'AFTER HOURS / FREE ROAM' : contract?.chapter ?? 'ALL DEBTS SETTLED';
    $('mission-name').textContent = s.freeRoam ? 'Make your own trouble.' : contract?.name ?? 'The city is yours.';
    $('objective-text').textContent = G.objective(s);
    $('health-bar').style.width = s.player.hp + '%';
    $('health-number').textContent = Math.ceil(s.player.hp);
    $('cash').textContent = '$' + s.cash.toLocaleString();
    const stars = Math.ceil(s.heat);
    $('stars').textContent = Array.from({ length: 5 }, (_, i) => i < stars ? '★' : '☆').join(' ');
    $('heat-status').textContent = stars ? s.seen ? 'ACTIVE PURSUIT / BREAK SIGHT' : 'SEARCHING / LIE LOW' : 'OFF THE RADAR';
    $('district-name').textContent = G.district(s.player.x, s.player.y);
    const target = G.target(s);
    $('distance').textContent = target ? Math.round(G.distance(s.player, target)) + ' M' : `${s.collected.length}/8 STASHES`;
    const car = s.cars.find(v => v.id === s.player.car);
    $('speed').textContent = car ? Math.round(Math.abs(car.speed) * 0.42).toString().padStart(3, '0') : 'ON';
    $('vehicle-name').textContent = car ? car.kind === 'courier' ? 'SOL / COURIER VAN' : 'SUNRUNNER / ' + car.kind.toUpperCase() : 'NICO VALE';
    $('speed').style.fontSize = car ? '' : '40px';
    $('speed').nextElementSibling.firstChild.textContent = car ? 'KM/H' : 'FOOT';
    let hint = '';
    if (target && G.distance(s.player, target) < 95) {
      hint = s.mission === 2 && s.stage === 0 ? 'AIM WITH MOUSE · CLICK TO FIRE · SPACE TO STRIKE' : 'E / ' + (s.mission === 0 ? 'TALK TO LENA' : s.mission === 1 && s.stage === 1 ? 'DELIVER COURIER VAN' : s.mission === 2 ? 'ENTER THE LOW TIDE' : 'STEAL COURIER VAN');
    }
    if (!hint && car) hint = 'E / EXIT VEHICLE · SPACE / HANDBRAKE';
    if (!hint && G.nearestCar(s)) hint = 'E / ' + (G.nearestCar(s).stolen ? 'ENTER VEHICLE' : 'STEAL VEHICLE');
    if (G.distance(s.player, G.places.safe) < 95) hint = 'E / LIE LOW & RECOVER';
    $('hint').textContent = hint;
    $('save-status').textContent = s.saved === false ? 'LOCAL SAVE UNAVAILABLE' : '◈  ALL PROGRESS SAVED LOCALLY';
    if (s.toast !== lastToast) {
      $('toast').textContent = s.toast;
      lastToast = s.toast;
    }
  }

  $('start').addEventListener('click', () => fresh());
  $('roam').addEventListener('click', () => fresh(true));
  $('continue').addEventListener('click', continueSave);
  window.addEventListener('keydown', event => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.code) && event.code !== 'Tab') event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'KeyQ') {
      G.audio.muted = !G.audio.muted;
      G.notify(state, G.audio.muted ? 'SOUND OFF' : 'SOUND ON');
    }
    if (event.code === 'KeyP' || event.code === 'Escape') {
      pause();
      return;
    }
    if (event.code === 'Enter') {
      event.preventDefault();
      if (state.mode === 'title') fresh();
      else if (state.mode !== 'play') $('modal-actions').firstChild?.click();
      return;
    }
    if (state.mode !== 'play') return;
    input.keys.add(event.code);
    if (event.code === 'KeyE') G.interact(state);
    if (event.code === 'KeyM') state.mapOpen = !state.mapOpen;
    updateScreen();
  });
  window.addEventListener('keyup', event => input.keys.delete(event.code));
  canvas.addEventListener('pointermove', event => {
    input.mouseX = event.clientX;
    input.mouseY = event.clientY;
  });
  canvas.addEventListener('pointerdown', event => {
    if (state.mode !== 'play') return;
    if (event.button === 0) input.fire = true;
    if (event.button === 2) G.melee(state);
  });
  window.addEventListener('pointerup', () => { input.fire = false; });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('blur', () => {
    clearInput();
    if (state.mode === 'play') pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'play') pause();
  });
  window.addEventListener('pagehide', () => {
    if (state.mode !== 'title') G.save(state);
  });

  // Readable telemetry lets browser tests inspect actual play without a scene staging API.
  G.app = {
    get state() { return state; },
    get renderer() { return renderer; },
    inspect() {
      const p = state.player;
      const car = state.cars.find(c => c.id === p.car);
      return { mode: state.mode, x: p.x, y: p.y, angle: p.angle, hp: p.hp,
        car: p.car, speed: car?.speed ?? 0, heat: state.heat, seen: state.seen,
        mission: state.mission, stage: state.stage, cash: state.cash,
        police: state.police.map(c => ({ x: c.x, y: c.y, hp: c.hp })),
        enemies: state.enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp })),
        target: G.target(state), saved: !!G.readSave(), mapOpen: state.mapOpen,
        completed: [...state.completed], shots: state.shots };
    },
  };

  function frame(now) {
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    accumulator += delta;
    input.aim = renderer.screenToWorld(input.mouseX, input.mouseY);
    while (accumulator >= 1 / 60) {
      G.update(state, 1 / 60, input);
      accumulator -= 1 / 60;
    }
    renderer.draw(state, delta);
    G.audio.update(state);
    if (state.mode !== lastMode) updateScreen();
    hudClock += delta;
    if (hudClock > 0.1) {
      hudClock = 0;
      updateHud();
    }
    requestAnimationFrame(frame);
  }
  updateScreen();
  requestAnimationFrame(frame);
})(window.Sundown);
