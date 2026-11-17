// Port Serein is generated entirely from this fixed city plan. No assets are loaded.
window.Sundown = {};
(function (G) {
  G.WIDTH = 3200;
  G.HEIGHT = 2560;
  G.ROAD = 132;
  G.X_ROADS = [340, 940, 1540, 2140, 2740];
  G.Y_ROADS = [320, 880, 1440, 2000, 2440];
  G.places = {
    garage: { x: 745, y: 775, label: 'QUILL MOTOR WORKS' },
    van: { x: 1130, y: 902, label: 'SILVER COURIER' },
    pier: { x: 2490, y: 1440, label: 'DOCK 04' },
    crew: { x: 2470, y: 1730, label: 'WIRE YARD' },
    safe: { x: 550, y: 2000, label: 'THE LOW TIDE' },
  };
  G.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  G.distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  G.angleDelta = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  G.random = function (seed) {
    let n = seed;
    return () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
  };
  G.isRoad = (x, y) => G.X_ROADS.some(v => Math.abs(x - v) < 75)
    || G.Y_ROADS.some(v => Math.abs(y - v) < 75);

  G.createCity = function () {
    const rand = G.random(7421);
    const buildings = [];
    const palms = [];
    const props = [];
    const rooftops = ['#e8c5a0', '#dfb194', '#dbbc92', '#d6d2b4', '#b7c7be', '#e6c9b5'];
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        const left = G.X_ROADS[col] + 104;
        const top = G.Y_ROADS[row] + 105;
        if (col === 3 && row === 2) continue;
        if (col === 2 && row === 1) {
          props.push({ kind: 'park', x: left, y: top, w: 390, h: 340 });
          for (let k = 0; k < 12; k++) {
            palms.push({ x: left + rand() * 390, y: top + rand() * 340, size: 26 + rand() * 10 });
          }
          continue;
        }
        for (let a = 0; a < 2; a++) {
          for (let b = 0; b < 2; b++) {
            const x = left + a * 206;
            const y = top + b * (row === 3 ? 143 : 185);
            const w = 158 + rand() * 28;
            const h = row === 3 ? 112 : 131 + rand() * 20;
            let name = '';
            if (col === 0 && row === 0 && a === 1 && b === 1) name = 'QUILL MOTOR WORKS';
            if (col === 1 && row === 0 && a === 0 && b === 0) name = 'HOTEL SOLARA';
            if (col === 0 && row === 2 && a === 0 && b === 1) name = 'LOW TIDE';
            if (col === 3 && row === 0 && a === 0 && b === 0) name = 'SEREIN SOCIAL';
            buildings.push({ x, y, w, h, z: 22 + rand() * 54, color: rooftops[Math.floor(rand() * rooftops.length)], name, style: Math.floor(rand() * 4) });
          }
        }
        // Small courtyard details help each neighborhood feel lived in.
        props.push({ kind: 'pool', x: left + 150, y: top + 148, w: 95, h: 34 });
      }
    }
    for (const x of G.X_ROADS) {
      for (let y = 170; y < 2490; y += 145) {
        if (G.Y_ROADS.some(v => Math.abs(y - v) < 100)) continue;
        palms.push({ x: x - 92, y, size: 29 + rand() * 7 });
        palms.push({ x: x + 92, y: y + 30, size: 30 + rand() * 9 });
      }
    }
    for (const y of G.Y_ROADS.slice(0, 4)) {
      for (let x = 490; x < 2790; x += 150) {
        if (G.X_ROADS.some(v => Math.abs(x - v) < 105)) continue;
        palms.push({ x, y: y + 90, size: 29 + rand() * 7 });
        props.push({ kind: 'lamp', x: x + 50, y: y - 81 });
      }
    }
    for (let y = 170; y < 2510; y += 170) palms.push({ x: 2875, y, size: 42 });
    return { buildings, palms, props, rand };
  };

  G.blocked = function (city, x, y, radius = 10) {
    if (x < 110 || x > 2910 || y < 100 || y > 2500) return true;
    return city.buildings.some(b => x > b.x - radius && x < b.x + b.w + radius
      && y > b.y - radius && y < b.y + b.h + radius);
  };

  G.slide = function (state, entity, dx, dy, radius = 10) {
    let hit = false;
    if (!G.blocked(state.city, entity.x + dx, entity.y, radius)) entity.x += dx;
    else hit = true;
    if (!G.blocked(state.city, entity.x, entity.y + dy, radius)) entity.y += dy;
    else hit = true;
    return hit;
  };

  G.district = function (x, y) {
    if (x > 2320) return y > 1450 ? 'THE WIRE YARD' : 'SUNLINE QUAY';
    if (y > 1760) return 'OLD SEREIN';
    if (x > 1450) return 'PALM DISTRICT';
    return 'LITTLE SOL';
  };
})(window.Sundown);
