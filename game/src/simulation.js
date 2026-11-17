// Fixed-step simulation: walking, cars, road traffic, pursuit, combat, saves and recovery.
(function (G) {
  const SAVE_KEY = 'sundown-debt.save.v1';
  G.SAVE_KEY = SAVE_KEY;

  G.createState = function () {
    const s = {
      city: G.createCity(), mode: 'title', time: 0, cash: 180, heat: 0, seen: false,
      unseen: 0, mission: 0, stage: 0, completed: [], freeRoam: false,
      player: { x: 730, y: 875, angle: -Math.PI / 2, hp: 100, car: null, cooldown: 0, invulnerable: 0 },
      cars: [], police: [], pedestrians: [], enemies: [], bullets: [], particles: [], tracks: [],
      camera: { x: 1300, y: 950 }, mapOpen: false, toast: '', toastTime: 0, saveClock: 0,
      policeClock: 0, collected: [], totalDistance: 0, shots: 0, result: null,
    };
    const rand = G.random(295);
    const colors = ['#ed8b50', '#ead8af', '#569392', '#a54540', '#d5b551', '#647c96'];
    const makeCar = (x, y, angle, color, kind, id) => ({
      id, x, y, angle, color, kind, speed: 0, hp: 100, ai: false, stolen: false,
    });
    s.cars.push(makeCar(805, 905, 0, '#ee9255', 'coupe', 'sunrunner'));
    s.cars.push(makeCar(1130, 902, 0, '#d2d8cb', 'courier', 'courier'));
    for (let i = 0; i < 23; i++) {
      const c = i % 4;
      const r = Math.floor(i / 4) % 4;
      const x1 = G.X_ROADS[c] + 27;
      const x2 = G.X_ROADS[c + 1] - 27;
      const y1 = G.Y_ROADS[r] + 27;
      const y2 = G.Y_ROADS[r + 1] - 27;
      const route = [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }];
      const part = i % 4;
      const next = (part + 1) % 4;
      const t = 0.1 + rand() * 0.7;
      const a = route[part];
      const b = route[next];
      const car = makeCar(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t,
        Math.atan2(b.y - a.y, b.x - a.x), colors[i % colors.length], i % 6 === 0 ? 'wagon' : 'sedan', 'traffic-' + i);
      Object.assign(car, { ai: true, route, next, cruise: 65 + rand() * 40 });
      s.cars.push(car);
    }
    for (let i = 0; i < 10; i++) {
      s.cars.push(makeCar(490 + (i % 4) * 600, 812 + Math.floor(i / 4) * 560, 0,
        colors[(i + 2) % colors.length], 'coupe', 'parked-' + i));
    }
    for (let i = 0; i < 70; i++) {
      const x = G.X_ROADS[i % 5] + (i % 2 ? 84 : -84);
      const y = 180 + rand() * 2200;
      s.pedestrians.push({ x, y, originX: x, originY: y, phase: rand() * 6,
        angle: Math.PI / 2, color: colors[i % colors.length], hp: 40, panic: 0 });
    }
    s.caches = [
      { x: 840, y: 1200 }, { x: 1340, y: 740 }, { x: 1750, y: 1280 },
      { x: 2320, y: 740 }, { x: 2820, y: 1160 }, { x: 1820, y: 2160 },
      { x: 780, y: 2240 }, { x: 2520, y: 2100 },
    ];
    return s;
  };

  G.notify = function (s, text) {
    s.toast = text;
    s.toastTime = 5;
  };

  G.save = function (s) {
    const data = {
      version: 1, player: { ...s.player, hp: Math.max(35, s.player.hp) },
      cash: s.cash, mission: s.mission, stage: s.stage, completed: s.completed,
      heat: s.heat, freeRoam: s.freeRoam, cars: s.cars, enemies: s.enemies,
      collected: s.collected, totalDistance: s.totalDistance, shots: s.shots,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      s.saved = true;
    } catch {
      s.saved = false;
      G.notify(s, 'Storage unavailable. Your progress lasts for this visit.');
    }
  };

  G.readSave = function () {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (d?.version !== 1 || !Number.isFinite(d.player?.x) || !Number.isFinite(d.player?.y)
        || !Number.isFinite(d.player?.hp) || !Number.isFinite(d.cash)
        || !Number.isInteger(d.mission) || d.mission < 0 || d.mission > 3
        || !Array.isArray(d.cars) || !Array.isArray(d.enemies) || !Array.isArray(d.completed)) return null;
      return d;
    } catch {
      return null;
    }
  };

  G.restore = function (s, data) {
    for (const key of ['player', 'cash', 'mission', 'stage', 'completed', 'heat', 'freeRoam',
      'cars', 'enemies', 'collected', 'totalDistance', 'shots']) {
      if (data[key] !== undefined) s[key] = data[key];
    }
    s.player.hp = G.clamp(s.player.hp, 35, 100);
    s.player.cooldown = 0;
    s.player.invulnerable = 2;
    s.mode = 'play';
    s.camera = { x: s.player.x, y: s.player.y };
    G.notify(s, 'Welcome back to Port Serein. Your story continues.');
  };

  G.addHeat = function (s, amount) {
    s.heat = G.clamp(s.heat + amount, 0, 5);
    s.unseen = 0;
  };

  G.lineClear = function (s, a, b) {
    const n = Math.ceil(G.distance(a, b) / 35);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (G.blocked(s.city, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0)) return false;
    }
    return true;
  };

  G.nearestCar = s => s.cars.filter(c => G.distance(c, s.player) < 76)
    .sort((a, b) => G.distance(a, s.player) - G.distance(b, s.player))[0];

  G.interact = function (s) {
    if (G.interactStory(s)) return;
    const p = s.player;
    if (p.car) {
      const car = s.cars.find(v => v.id === p.car);
      if (Math.abs(car.speed) > 90) {
        G.notify(s, 'Slow down before leaving the vehicle.');
        return;
      }
      let exit = null;
      for (const side of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
        const point = { x: car.x + Math.cos(car.angle + side) * 46, y: car.y + Math.sin(car.angle + side) * 46 };
        if (!G.blocked(s.city, point.x, point.y, 10)) { exit = point; break; }
      }
      if (!exit) return G.notify(s, 'The doors are blocked. Move the vehicle.');
      Object.assign(p, exit);
      p.car = null;
      car.speed = 0;
      G.audio.cue('enter');
      return;
    }
    const car = G.nearestCar(s);
    if (car) {
      p.car = car.id;
      p.x = car.x;
      p.y = car.y;
      car.ai = false;
      car.speed *= 0.3;
      if (!car.stolen) {
        car.stolen = true;
        G.addHeat(s, 0.95);
        G.notify(s, 'VEHICLE REPORTED STOLEN / Break sight to lose the patrols.');
      }
      G.audio.cue('enter');
      return;
    }
    G.notify(s, 'Find a vehicle or follow the amber objective marker.');
  };

  G.fire = function (s, aim) {
    const p = s.player;
    if (p.cooldown > 0) return;
    p.cooldown = 0.22;
    s.shots++;
    const angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    if (!p.car) p.angle = angle;
    s.bullets.push({ x: p.x + Math.cos(angle) * 24, y: p.y + Math.sin(angle) * 24,
      vx: Math.cos(angle) * 920, vy: Math.sin(angle) * 920, life: 0.8, enemy: false });
    s.particles.push({ x: p.x + Math.cos(angle) * 24, y: p.y + Math.sin(angle) * 24,
      life: 0.1, max: 0.1, color: '#ffe4a0', size: 12 });
    G.addHeat(s, 0.08);
    G.audio.cue('shot');
  };

  G.melee = function (s) {
    if (s.player.cooldown > 0 || s.player.car) return;
    s.player.cooldown = 0.4;
    s.meleeFlash = 0.2;
    for (const e of s.enemies) {
      if (e.hp > 0 && G.distance(e, s.player) < 78) {
        e.hp -= 40;
        G.audio.cue('hit');
        G.addHeat(s, 0.2);
      }
    }
  };

  G.hurt = function (s, amount) {
    if (s.player.invulnerable > 0) return;
    s.player.hp = Math.max(0, s.player.hp - amount);
    s.player.invulnerable = 0.4;
    s.damageFlash = 0.25;
    G.audio.cue('hit');
    if (s.player.hp === 0) {
      s.mode = 'lost';
      if (s.player.car) s.cars.find(v => v.id === s.player.car).speed = 0;
    }
  };

  function updateTraffic(s, dt) {
    for (const car of s.cars) {
      if (!car.ai) continue;
      const target = car.route[car.next];
      const d = G.distance(car, target);
      if (d < 8) car.next = (car.next + 1) % car.route.length;
      const next = car.route[car.next];
      const angle = Math.atan2(next.y - car.y, next.x - car.x);
      car.angle += G.clamp(G.angleDelta(car.angle, angle), -3 * dt, 3 * dt);
      const close = s.cars.some(c => c !== car && G.distance(c, car) < 64
        && Math.abs(G.angleDelta(car.angle, Math.atan2(c.y - car.y, c.x - car.x))) < 0.65);
      car.speed += ((close ? 0 : car.cruise) - car.speed) * dt * 3;
      car.x += Math.cos(angle) * car.speed * dt;
      car.y += Math.sin(angle) * car.speed * dt;
    }
  }

  function updatePlayer(s, dt, input) {
    const p = s.player;
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    const oldX = p.x;
    const oldY = p.y;
    if (p.car) {
      const car = s.cars.find(v => v.id === p.car);
      const throttle = Number(input.keys.has('KeyW') || input.keys.has('ArrowUp'))
        - Number(input.keys.has('KeyS') || input.keys.has('ArrowDown'));
      const steer = Number(input.keys.has('KeyD') || input.keys.has('ArrowRight'))
        - Number(input.keys.has('KeyA') || input.keys.has('ArrowLeft'));
      const brake = input.keys.has('Space');
      const max = car.kind === 'courier' ? 330 : 430;
      car.speed += throttle * (car.speed * throttle < 0 ? 460 : 210) * dt;
      car.speed *= Math.exp(-dt * (brake ? 4.4 : throttle ? 0.25 : 1.1));
      car.speed = G.clamp(car.speed, -125, max);
      const turn = Math.min(1, Math.abs(car.speed) / 65);
      car.angle += steer * turn * (car.speed < 0 ? -1 : 1) * dt * (brake ? 3.1 : 1.85);
      const hit = G.slide(s, car, Math.cos(car.angle) * car.speed * dt, Math.sin(car.angle) * car.speed * dt, 20);
      if (hit && Math.abs(car.speed) > 100) {
        G.hurt(s, Math.min(14, Math.abs(car.speed) / 32));
        car.hp = Math.max(0, car.hp - 12);
        car.speed *= -0.25;
        G.audio.cue('hit');
      }
      if (brake && Math.abs(car.speed) > 100) {
        s.tracks.push({ x: car.x, y: car.y, angle: car.angle, life: 8 });
      }
      for (const other of s.cars) {
        if (other === car || G.distance(car, other) > 42) continue;
        if (Math.abs(car.speed) > 90) {
          G.addHeat(s, 0.07);
          G.hurt(s, 3);
          other.x += Math.cos(car.angle) * 6;
          other.y += Math.sin(car.angle) * 6;
          car.speed *= 0.85;
        }
      }
      for (const e of s.enemies) {
        if (e.hp > 0 && G.distance(car, e) < 45 && Math.abs(car.speed) > 80) e.hp = 0;
      }
      for (const person of s.pedestrians) {
        if (person.hp > 0 && G.distance(car, person) < 28 && Math.abs(car.speed) > 75) {
          person.hp = 0;
          G.addHeat(s, 0.7);
        }
      }
      p.x = car.x;
      p.y = car.y;
      p.angle = car.angle;
    } else {
      let dx = Number(input.keys.has('KeyD') || input.keys.has('ArrowRight'))
        - Number(input.keys.has('KeyA') || input.keys.has('ArrowLeft'));
      let dy = Number(input.keys.has('KeyS') || input.keys.has('ArrowDown'))
        - Number(input.keys.has('KeyW') || input.keys.has('ArrowUp'));
      const length = Math.hypot(dx, dy);
      if (length) {
        dx /= length;
        dy /= length;
        const speed = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') ? 245 : 155;
        G.slide(s, p, dx * speed * dt, dy * speed * dt, 10);
        if (!input.fire) p.angle = Math.atan2(dy, dx);
      }
    }
    s.totalDistance += Math.hypot(p.x - oldX, p.y - oldY);
    if (input.fire || input.keys.has('KeyF')) G.fire(s, input.aim);
    if (input.keys.has('Space') && !p.car) G.melee(s);
  }

  // Police use the street grid when a building blocks direct pursuit.
  G.roadPath = function (from, to) {
    const nearest = (array, v) => array.reduce((best, n) => Math.abs(n - v) < Math.abs(best - v) ? n : best);
    const ax = nearest(G.X_ROADS, from.x);
    const ay = nearest(G.Y_ROADS, from.y);
    const bx = nearest(G.X_ROADS, to.x);
    const by = nearest(G.Y_ROADS, to.y);
    const points = [];
    if (Math.abs(from.x - ax) < Math.abs(from.y - ay)) points.push({ x: ax, y: from.y });
    else points.push({ x: from.x, y: ay });
    points.push({ x: ax, y: ay });
    const ix = G.X_ROADS.indexOf(ax);
    const jx = G.X_ROADS.indexOf(bx);
    for (let i = ix; i !== jx;) {
      i += Math.sign(jx - i);
      points.push({ x: G.X_ROADS[i], y: ay });
    }
    const iy = G.Y_ROADS.indexOf(ay);
    const jy = G.Y_ROADS.indexOf(by);
    for (let i = iy; i !== jy;) {
      i += Math.sign(jy - i);
      points.push({ x: bx, y: G.Y_ROADS[i] });
    }
    points.push({ x: to.x, y: to.y });
    return points;
  };

  function spawnPolice(s) {
    const choices = [];
    for (const x of G.X_ROADS) for (const y of G.Y_ROADS) {
      const p = { x, y };
      const d = G.distance(p, s.player);
      if (d > 380 && d < 900) choices.push(p);
    }
    const place = choices[Math.floor((s.time * 31) % choices.length)];
    if (!place) return;
    s.police.push({ x: place.x + 24, y: place.y + (s.police.length % 2 ? -25 : 25),
      angle: 0, speed: 0, hp: 150, cooldown: 2, path: [], repath: 0 });
  }

  function updatePolice(s, dt) {
    const safe = G.distance(s.player, G.places.safe) < 100;
    s.policeClock -= dt;
    if (s.heat > 0 && s.policeClock <= 0 && s.police.length < Math.min(6, Math.ceil(s.heat) + 1)) {
      spawnPolice(s);
      s.policeClock = 2.2;
    }
    s.seen = false;
    for (const cop of s.police) {
      if (cop.hp <= 0) continue;
      const d = G.distance(cop, s.player);
      const visible = d < 510 && G.lineClear(s, cop, s.player) && !safe;
      if (visible) s.seen = true;
      cop.repath -= dt;
      if (cop.repath <= 0) {
        cop.path = G.roadPath(cop, s.player);
        cop.repath = 1.8;
      }
      while (cop.path.length > 1 && G.distance(cop, cop.path[0]) < 45) cop.path.shift();
      const target = visible ? s.player : cop.path[0] ?? s.player;
      const angle = Math.atan2(target.y - cop.y, target.x - cop.x);
      cop.angle += G.clamp(G.angleDelta(cop.angle, angle), -dt * 3.2, dt * 3.2);
      const standoff = s.player.car ? 68 : 145;
      const desired = s.heat === 0 ? 0 : Math.min(290 + s.heat * 10, Math.max(0, d - standoff) * 1.6);
      cop.speed += (desired - cop.speed) * dt * 2;
      G.slide(s, cop, Math.cos(cop.angle) * cop.speed * dt, Math.sin(cop.angle) * cop.speed * dt, 18);
      // Patrols occupy separate space instead of piling up on one point.
      for (const other of s.police) {
        if (other === cop) continue;
        const separation = G.distance(cop, other);
        if (separation > 0 && separation < 58) {
          const force = (58 - separation) * dt * 2;
          G.slide(s, cop, (cop.x - other.x) / separation * force,
            (cop.y - other.y) / separation * force, 18);
        }
      }
      if (d < 44 && s.heat > 0 && !safe) G.hurt(s, s.player.car ? 4 : 7);
      cop.cooldown -= dt;
      if (visible && d < 240 && cop.cooldown <= 0 && s.heat >= 2) {
        fireEnemy(s, cop, 4);
        cop.cooldown = 2.8;
      }
    }
    if (s.heat > 0) {
      s.unseen = s.seen ? 0 : s.unseen + dt;
      if (safe) s.heat = Math.max(0, s.heat - dt * 0.65);
      else if (s.unseen > 5) s.heat = Math.max(0, s.heat - dt * 0.16);
      if (s.heat === 0) {
        s.police = [];
        G.notify(s, 'PURSUIT EVADED / You’re off the radar.');
        G.save(s);
      }
    }
  }

  function fireEnemy(s, enemy, damage = 8) {
    const angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
    s.bullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 420,
      vy: Math.sin(angle) * 420, life: 1.2, enemy: true, damage });
  }

  function updateCombat(s, dt) {
    for (const enemy of s.enemies) {
      if (enemy.hp <= 0) continue;
      const d = G.distance(enemy, s.player);
      if (d > 600) continue;
      enemy.angle = Math.atan2(s.player.y - enemy.y, s.player.x - enemy.x);
      if (d > 170) G.slide(s, enemy, Math.cos(enemy.angle) * 55 * dt, Math.sin(enemy.angle) * 55 * dt, 10);
      enemy.cooldown -= dt;
      if (enemy.cooldown <= 0 && d < 420 && G.lineClear(s, enemy, s.player)) {
        fireEnemy(s, enemy);
        enemy.cooldown = 1.7;
      }
    }
    for (const bullet of s.bullets) {
      const dx = bullet.vx * dt;
      const dy = bullet.vy * dt;
      bullet.x += dx;
      bullet.y += dy;
      bullet.life -= dt;
      if (G.blocked(s.city, bullet.x, bullet.y, 0)) bullet.life = 0;
      if (bullet.enemy) {
        if (G.distance(bullet, s.player) < (s.player.car ? 28 : 18)) {
          G.hurt(s, bullet.damage * (s.player.car ? 0.5 : 1));
          bullet.life = 0;
        }
      } else {
        for (const enemy of [...s.enemies, ...s.police, ...s.pedestrians]) {
          if (bullet.life <= 0 || enemy.hp <= 0 || G.distance(bullet, enemy) > (s.police.includes(enemy) ? 28 : 19)) continue;
          enemy.hp -= 36;
          bullet.life = 0;
          s.particles.push({ x: bullet.x, y: bullet.y, life: 0.25, max: 0.25, color: '#f7bd62', size: 13 });
          G.audio.cue('hit');
          if (s.pedestrians.includes(enemy)) G.addHeat(s, 0.6);
          if (s.police.includes(enemy)) G.addHeat(s, 0.4);
        }
      }
    }
    s.bullets = s.bullets.filter(b => b.life > 0);
  }

  G.update = function (s, dt, input) {
    s.time += dt;
    if (s.mode !== 'play' && s.mode !== 'title') return;
    updateTraffic(s, dt);
    for (const person of s.pedestrians) {
      if (person.hp <= 0) continue;
      person.phase += dt;
      const d = G.distance(person, s.player);
      person.panic = s.heat > 0 && d < 200 ? 2 : Math.max(0, person.panic - dt);
      const old = person.y;
      if (person.panic) {
        const angle = Math.atan2(person.y - s.player.y, person.x - s.player.x);
        G.slide(s, person, Math.cos(angle) * 80 * dt, Math.sin(angle) * 80 * dt, 7);
      } else {
        G.slide(s, person, 0, Math.cos(person.phase * 0.15) * 22 * dt, 7);
      }
      person.angle = person.y > old ? Math.PI / 2 : -Math.PI / 2;
    }
    if (s.mode === 'title') return;
    updatePlayer(s, dt, input);
    updatePolice(s, dt);
    updateCombat(s, dt);
    if (s.mode !== 'play') return;
    G.updateStory(s);
    s.caches.forEach((cache, i) => {
      if (!s.collected.includes(i) && G.distance(cache, s.player) < 32) {
        s.collected.push(i);
        s.cash += 200;
        G.notify(s, `STASH FOUND / +$200 · ${s.collected.length}/8 recovered`);
        G.audio.cue('complete');
        G.save(s);
      }
    });
    for (const p of s.particles) p.life -= dt;
    s.particles = s.particles.filter(p => p.life > 0);
    for (const t of s.tracks) t.life -= dt;
    s.tracks = s.tracks.filter(t => t.life > 0);
    s.damageFlash = Math.max(0, (s.damageFlash ?? 0) - dt);
    s.meleeFlash = Math.max(0, (s.meleeFlash ?? 0) - dt);
    s.toastTime = Math.max(0, s.toastTime - dt);
    if (!s.toastTime) s.toast = '';
    s.saveClock += dt;
    if (s.saveClock > 8) {
      s.saveClock = 0;
      G.save(s);
    }
  };
})(window.Sundown);
