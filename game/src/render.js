// Canvas artwork only: warm stucco, long shadows, palms, traffic and a turquoise coast.
(function (G) {
  G.createRenderer = function (canvas) {
    const ctx = canvas.getContext('2d', { alpha: false });
    let width = 1280;
    let height = 720;
    const view = { scale: 0.92, x: 0, y: 0 };
    const C = { cream: '#f7e9c7', amber: '#ffc16c', asphalt: '#465553', line: '#d8cda1' };
    const texture = document.createElement('canvas');
    texture.width = 256;
    texture.height = 256;
    const tx = texture.getContext('2d');
    const rng = G.random(228);
    for (let i = 0; i < 1700; i++) {
      tx.fillStyle = i % 2 ? '#fff0bf09' : '#122c2a09';
      tx.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2, 1);
    }
    const grain = ctx.createPattern(texture, 'repeat');

    function resize() {
      width = innerWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      view.scale = Math.max(0.7, Math.min(1.15, width / 1380));
    }
    window.addEventListener('resize', resize);
    resize();

    function rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    }
    function polygon(points, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      ctx.fill();
    }
    function line(x, y, a, b, color, thickness = 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(a, b);
      ctx.stroke();
    }
    function circle(x, y, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    function label(text, x, y, size, color, align = 'left', weight = 600) {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Arial,sans-serif`;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    }
    function rounded(x, y, w, h, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
    }
    function visible(x, y, margin = 180) {
      const sx = (x - view.x) * view.scale + width / 2;
      const sy = (y - view.y) * view.scale * 0.72 + height / 2;
      return sx > -margin && sx < width + margin && sy > -margin && sy < height + margin;
    }

    function drawGround(s) {
      rect(0, 0, 3200, 2560, '#c8c3a0');
      // The sea, tide lines and the pedestrian promenade.
      const sea = ctx.createLinearGradient(2890, 0, 3350, 0);
      sea.addColorStop(0, '#71b9b1');
      sea.addColorStop(0.2, '#359b9e');
      sea.addColorStop(1, '#237881');
      rect(2910, 0, 500, 2560, sea);
      rect(2808, 0, 110, 2560, '#d9c69d');
      rect(2904, 0, 10, 2560, '#f5e6bd');
      for (let y = 25; y < 2560; y += 28) {
        const offset = Math.sin(y * 0.08 + s.time * 0.6) * 14;
        line(2925 + offset, y, 2980 + offset, y + 4, '#e3edcb38', 2);
        line(3020 - offset, y + 12, 3110 - offset, y + 15, '#e3edcb19', 2);
      }
      for (let y = 70; y < 2540; y += 75) {
        line(2838, y, 2860, y, '#b4aa86', 5);
        line(2838, y - 5, 2860, y - 5, '#f3d8a6', 4);
      }
      for (const x of G.X_ROADS) {
        rect(x - 91, 70, 182, 2440, '#e3cba5');
        rect(x - 71, 70, 142, 2440, '#a9ad92');
        rect(x - 66, 70, 132, 2440, C.asphalt);
      }
      for (const y of G.Y_ROADS) {
        rect(100, y - 91, 2710, 182, '#e3cba5');
        rect(100, y - 71, 2710, 142, '#a9ad92');
        rect(100, y - 66, 2710, 132, C.asphalt);
      }
      for (const x of G.X_ROADS) {
        for (let y = 85; y < 2500; y += 35) {
          if (G.Y_ROADS.some(v => Math.abs(y - v) < 95)) continue;
          rect(x - 3.5, y, 1.5, 20, '#e8bd68aa');
          rect(x + 2, y, 1.5, 20, '#e8bd68aa');
          rect(x - 48, y, 1, 15, '#d0d5b94d');
          rect(x + 48, y, 1, 15, '#d0d5b94d');
        }
      }
      for (const y of G.Y_ROADS) {
        for (let x = 110; x < 2810; x += 35) {
          if (G.X_ROADS.some(v => Math.abs(x - v) < 95)) continue;
          rect(x, y - 3.5, 20, 1.5, '#e8bd68aa');
          rect(x, y + 2, 20, 1.5, '#e8bd68aa');
          rect(x, y - 48, 15, 1, '#d0d5b94d');
          rect(x, y + 48, 15, 1, '#d0d5b94d');
        }
      }
      for (const x of G.X_ROADS) for (const y of G.Y_ROADS) {
        for (let a = -57; a < 60; a += 15) {
          rect(x + a, y - 91, 8, 26, '#e4dac080');
          rect(x + a, y + 65, 8, 26, '#e4dac080');
          rect(x - 91, y + a, 26, 8, '#e4dac080');
          rect(x + 65, y + a, 26, 8, '#e4dac080');
        }
        rect(x - 58, y - 106, 54, 3, '#e4dac0a0');
        rect(x + 5, y + 104, 54, 3, '#e4dac0a0');
        circle(x - 80, y - 80, 5, '#374a3a');
        circle(x - 80, y - 80, 2, '#e6bc59');
        circle(x + 80, y + 80, 5, '#374a3a');
        circle(x + 80, y + 80, 2, '#e6bc59');
      }
      const streetNames = ['SOL AVENUE', 'SEREIN BOULEVARD', 'SUNLINE DRIVE', 'OLD COAST ROAD'];
      G.Y_ROADS.slice(0, 4).forEach((y, i) => {
        label(streetNames[i], 1030, y - 43, 10, '#f5e5bb75', 'left');
        label(streetNames[i], 2240, y - 43, 10, '#f5e5bb75', 'left');
      });
      // Docks and open combat yard.
      rect(2240, 1550, 405, 365, '#b9b699');
      for (let x = 2270; x < 2620; x += 57) rect(x, 1580, 30, 2, '#e5d0a6');
      for (let i = 0; i < 4; i++) {
        const x = 2275 + i * 87;
        rect(x, 1845, 74, 42, i % 2 ? '#c98154' : '#6d9a92');
        rect(x, 1845, 74, 4, '#e4c49a');
        for (let t = 8; t < 72; t += 10) rect(x + t, 1852, 2, 30, '#243f3426');
      }
      label('WIRE YARD', 2410, 1610, 20, '#596a5777', 'center');
      for (let y = 570; y < 2180; y += 550) {
        rect(2910, y, 200, 45, '#947f60');
        rect(2910, y, 200, 5, '#f5dbad');
        for (let x = 2920; x < 3100; x += 15) line(x, y + 5, x, y + 45, '#716b543a', 1);
        drawBoat(3050, y - 46, 0.15);
        drawBoat(3015, y + 92, Math.PI + 0.1);
      }
      for (const prop of s.city.props) drawProp(prop);
      rect(0, 0, 3200, 2560, grain);
    }

    function drawBoat(x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#123d4340';
      ctx.beginPath(); ctx.ellipse(10, 9, 62, 20, 0, 0, Math.PI * 2); ctx.fill();
      polygon([[-53, -16], [25, -19], [63, 0], [25, 19], [-53, 16]], '#f5e7c7');
      rect(-35, -10, 56, 20, '#b2a990');
      rounded(-11, -12, 37, 24, 6, '#fff1d6');
      rect(-4, -8, 15, 16, '#385e63');
      rect(-45, -7, 12, 14, '#e1cba6');
      ctx.restore();
    }

    function drawProp(p) {
      if (p.kind === 'pool') {
        rect(p.x - 5, p.y - 5, p.w + 10, p.h + 10, '#eadbc0');
        rect(p.x, p.y, p.w, p.h, '#57a8a8');
        for (let x = 8; x < p.w; x += 17) line(p.x + x, p.y + 4, p.x + x + 10, p.y + p.h - 4, '#b6e2d438', 2);
      }
      if (p.kind === 'park') {
        rect(p.x, p.y, p.w, p.h, '#8f9d6b');
        rect(p.x + 165, p.y, 40, p.h, '#d6c7a1');
        rect(p.x, p.y + 150, p.w, 30, '#d6c7a1');
        circle(p.x + 185, p.y + 165, 56, '#e2d1a6');
        circle(p.x + 185, p.y + 165, 43, '#6dada7');
        circle(p.x + 185, p.y + 165, 16, '#cce5ce');
        circle(p.x + 185, p.y + 163, 6, '#f8edc9');
        // Tennis court.
        rect(p.x + 234, p.y + 204, 136, 112, '#4f8b77');
        ctx.strokeStyle = '#e8d8b5'; ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x + 242, p.y + 211, 120, 96);
        ctx.strokeRect(p.x + 252, p.y + 211, 100, 96);
        line(p.x + 242, p.y + 259, p.x + 362, p.y + 259, '#d6d5ba', 2);
        line(p.x + 302, p.y + 226, p.x + 302, p.y + 293, '#d6d5ba', 1);
      }
      if (p.kind === 'lamp') {
        line(p.x, p.y, p.x + 20, p.y + 14, '#34463c22', 4);
        line(p.x, p.y, p.x, p.y - 27, '#57665a', 3);
        line(p.x, p.y - 27, p.x + 14, p.y - 27, '#57665a', 3);
        circle(p.x + 14, p.y - 27, 4, '#f0d394');
      }
    }

    function drawBuilding(b) {
      const { x, y, w, h, z } = b;
      polygon([[x + 12, y + h], [x + w, y + h], [x + w + z * 0.8, y + h + z * 0.65], [x + z * 0.8, y + h + z * 0.65]], '#263e3840');
      polygon([[x + w, y - z], [x + w + 7, y - z + 8], [x + w + 7, y + h], [x + w, y + h]], '#977e65');
      rect(x, y + h - z, w, z, '#ae9275');
      rect(x, y + h - z + 2, w, 4, '#f2d1a2');
      for (let a = 13; a < w - 12; a += 27) {
        rect(x + a, y + h - z + 11, 13, Math.min(17, z - 14), '#526b64');
        rect(x + a, y + h - z + 11, 13, 2, '#dcc6a0');
        line(x + a + 6, y + h - z + 12, x + a + 6, y + h - z + 25, '#ddccb14d', 1);
      }
      rect(x - 2, y - z - 2, w + 4, h + 4, '#f2d5ab');
      rect(x + 4, y - z + 4, w - 8, h - 8, b.color);
      rect(x + 10, y - z + 10, w - 20, h - 20, '#b89c7c18');
      // Rooftop parapet, sunlit edge, drainage and mechanical equipment.
      line(x, y - z, x + w, y - z, '#fff0cf', 3);
      line(x + w - 3, y - z, x + w - 3, y + h - z, '#a98f7180', 3);
      for (let a = 0; a < 3; a++) {
        const rx = x + 20 + a * 28;
        const ry = y - z + 20;
        rect(rx + 5, ry + 5, 23, 21, '#263e382e');
        rect(rx, ry, 23, 17, '#b1b4a1');
        rect(rx, ry, 23, 3, '#e4dec4');
        circle(rx + 11, ry + 9, 6, '#758c7d');
        line(rx + 7, ry + 5, rx + 15, ry + 13, '#a9b5a0', 2);
        line(rx + 15, ry + 5, rx + 7, ry + 13, '#a9b5a0', 2);
      }
      if (b.style === 0) {
        rect(x + w - 61, y - z + h - 64, 44, 40, '#b1a17e');
        for (let a = 0; a < 4; a++) rect(x + w - 58 + a * 10, y - z + h - 61, 6, 33, '#476b6a');
      }
      if (b.style === 1) {
        rect(x + 19, y + h - z - 47, 53, 27, '#f2d7b1');
        rect(x + 22, y + h - z - 44, 47, 21, '#64aaa5');
        line(x + 24, y + h - z - 29, x + 63, y + h - z - 38, '#c8e7cf77', 2);
      }
      if (b.style === 2) {
        for (let i = 0; i < 3; i++) {
          circle(x + 30 + i * 40, y + h - z - 25, 12, '#da926d');
          polygon([[x + 18 + i * 40, y + h - z - 25], [x + 42 + i * 40, y + h - z - 25], [x + 30 + i * 40, y + h - z - 36]], '#efd4a7');
        }
      }
      if (b.name) {
        const signY = y + h - Math.min(20, z / 2);
        rect(x + 9, signY - 13, w - 18, 21, '#294b46');
        label(b.name, x + w / 2, signY + 1, b.name.length > 16 ? 9 : 11, '#f6db9f', 'center', 700);
        for (let i = 0; i < 7; i++) rect(x + 8 + i * (w - 16) / 7, y + h - 1, (w - 16) / 7 - 2, 7, i % 2 ? '#f1d1a6' : '#c47d55');
      }
      rect(x + 5, y + h - 12, 18, 12, '#516556');
    }

    function drawPalm(p) {
      const { x, y, size } = p;
      ctx.save();
      ctx.translate(x + 22, y + 14);
      ctx.scale(1.2, 0.5);
      circle(0, 0, size, '#2a49452b');
      ctx.restore();
      line(x, y, x - 8, y - 47, '#7c7852', 7);
      line(x - 2, y - 2, x - 10, y - 47, '#b9a16c', 3);
      const cx = x - 8;
      const cy = y - 48;
      for (let i = 0; i < 9; i++) {
        const a = i * Math.PI * 2 / 9 + x * 0.01;
        const lx = Math.cos(a) * size;
        const ly = Math.sin(a) * size * 0.72;
        ctx.fillStyle = i % 2 ? '#527b56' : '#3f6c52';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + lx * 0.7 - ly * 0.15, cy + ly * 0.4 - 9, cx + lx, cy + ly + 6);
        ctx.quadraticCurveTo(cx + lx * 0.45 + ly * 0.2, cy + ly * 0.85 + 5, cx, cy);
        ctx.fill();
        line(cx, cy, cx + lx * 0.85, cy + ly + 2, '#b4ba6b55', 1);
      }
      circle(cx, cy, 4, '#a4a965');
    }

    function drawCar(car, s, police = false) {
      const van = car.kind === 'courier';
      const length = van ? 73 : 59;
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      rounded(-length / 2 + 6, -13, length + 8, 34, 9, '#182c2a50');
      for (const x of [-19, 16]) {
        rounded(x - 4, -19, 12, 8, 2, '#263634');
        rounded(x - 4, 11, 12, 8, 2, '#263634');
      }
      rounded(-length / 2, -15, length, 30, van ? 5 : 9, police ? '#e9e3c8' : car.color);
      rounded(-length / 2 + 4, -13, length - 8, 26, 7, police ? '#253e3f' : '#ffffff15');
      rect(length / 2 - 14, -11, 8, 22, police ? '#ede8cd' : car.color);
      polygon([[5, -12], [14, -9], [14, 9], [5, 12]], '#244b51');
      polygon([[-17, -10], [-11, -12], [-11, 12], [-17, 10]], '#365c60');
      rounded(-11, -11, 16, 22, 2, van ? '#d4d9cc' : police ? '#f0edda' : car.color);
      line(-8, -8, 1, -8, '#fff0d655', 2);
      line(17, -12, length / 2 - 5, -11, '#fff0d644', 1);
      rect(length / 2 - 5, -12, 3, 7, '#fff2ba');
      rect(length / 2 - 5, 5, 3, 7, '#fff2ba');
      rect(-length / 2, -12, 3, 6, '#bc473b');
      rect(-length / 2, 6, 3, 6, '#bc473b');
      rect(1, -18, 8, 3, car.color ?? '#ddd9be');
      rect(1, 15, 8, 3, car.color ?? '#ddd9be');
      if (van) {
        rect(-30, -11, 18, 22, '#b6c3b5');
        line(-22, -10, -22, 10, '#7d95894d', 1);
        label('SOL', -20, 3, 8, '#4c6d63', 'center', 800);
      }
      if (police) {
        rect(-7, -13, 9, 26, '#e9e4cb');
        rect(-6, -10, 7, 9, Math.sin(s.time * 14) > 0 ? '#ff6d53' : '#a4473e');
        rect(-6, 1, 7, 9, Math.sin(s.time * 14) < 0 ? '#71d7f3' : '#38657d');
        label('SP', 22, 3, 7, '#254b4d', 'center');
        if (s.heat > 0) {
          ctx.globalAlpha = 0.13 + Math.sin(s.time * 14) * 0.06;
          circle(-2, 0, 45, Math.sin(s.time * 14) > 0 ? '#ff7450' : '#63c9f1');
          ctx.globalAlpha = 1;
        }
      }
      if (s.player.car === car.id) {
        ctx.globalAlpha = 0.18;
        polygon([[length / 2, -10], [length / 2 + 85, -34], [length / 2 + 85, 34], [length / 2, 10]], '#fff3bf');
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      if (car.hp <= 0) {
        circle(car.x + 5, car.y - 12, 15, '#38413d88');
        circle(car.x + 10, car.y - 27, 11, '#38413d55');
      }
    }

    function drawPerson(p, s, player = false, enemy = false) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.hp <= 0) {
        ctx.rotate(p.angle);
        rounded(-13, -5, 26, 10, 5, '#273e36a0');
        circle(15, 0, 5, '#c8a681');
        ctx.restore();
        return;
      }
      ctx.fillStyle = '#183f3540';
      ctx.beginPath(); ctx.ellipse(6, 5, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
      const move = player ? Math.sin(s.time * 15) * 2 : Math.sin(p.phase * 7) * 2;
      ctx.rotate(p.angle);
      rounded(-5, -8 + move, 7, 5, 2, '#334943');
      rounded(-5, 3 - move, 7, 5, 2, '#334943');
      rounded(-5, -9, 14, 18, 5, player ? '#f0dfb8' : enemy ? '#b55443' : p.color);
      line(7, -8, 16, -5, '#c8a17c', 4);
      line(7, 8, 14, 5, '#c8a17c', 4);
      if (player || enemy) {
        rect(14, -6, 16, 4, '#263d37');
        rect(15, -5, 4, 6, '#263d37');
      }
      if (player) rect(-7, -6, 5, 12, '#db8c4f');
      circle(3, -1, 6.5, '#dfb28a');
      circle(1, -2, 5, player ? '#353b30' : '#594d39');
      ctx.restore();
      if (enemy && p.hp > 0) {
        rect(p.x - 14, p.y - 30, 28, 3, '#112b2b88');
        rect(p.x - 14, p.y - 30, p.hp / 70 * 28, 3, '#ed815d');
      }
      if (player) {
        line(p.x - 13, p.y + 15, p.x + 13, p.y + 15, '#ffe0a0', 2);
        if (s.meleeFlash > 0) {
          ctx.strokeStyle = '#ffe3a1'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(p.x, p.y, 45, p.angle - 0.7, p.angle + 0.7); ctx.stroke();
        }
      }
    }

    function drawRouteAndMarkers(s) {
      const target = G.target(s);
      if (target) {
        const route = G.roadPath(s.player, target);
        ctx.strokeStyle = '#ffd17a60';
        ctx.lineWidth = 4;
        ctx.setLineDash([9, 10]);
        ctx.beginPath();
        ctx.moveTo(s.player.x, s.player.y);
        for (const p of route) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const pulse = 1 + Math.sin(s.time * 3) * 0.08;
        ctx.strokeStyle = '#ffd17a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(target.x, target.y, 44 * pulse, 32 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
        circle(target.x, target.y, 20, '#ffc36c25');
        line(target.x, target.y - 15, target.x, target.y - 90, '#ffd17a66', 2);
        polygon([[target.x, target.y - 115], [target.x + 12, target.y - 101], [target.x, target.y - 87], [target.x - 12, target.y - 101]], '#ffd17a');
        rounded(target.x - 76, target.y - 146, 152, 22, 2, '#163632df');
        label(target.label, target.x, target.y - 131, 9, '#f8e4ba', 'center');
      }
      for (const [name, place] of Object.entries(G.places)) {
        if (place === target || name === 'van' || name === 'crew') continue;
        if (name === 'safe') {
          circle(place.x, place.y, 27, '#c8e3af22');
          label('⌂', place.x, place.y - 6, 29, '#d1e4b0', 'center');
          label('THE LOW TIDE', place.x, place.y + 18, 9, '#375849', 'center');
        }
      }
      s.caches.forEach((p, i) => {
        if (s.collected.includes(i)) return;
        rounded(p.x - 8, p.y - 5, 16, 10, 2, '#43533a');
        label('$', p.x, p.y - 10, 13, '#ecd68c', 'center');
      });
    }

    function drawMinimap(s) {
      const large = s.mapOpen;
      const mw = large ? Math.min(width - 160, 790) : 210;
      const mh = large ? Math.min(height - 150, 540) : 181;
      const mx = large ? (width - mw) / 2 : width - 241;
      const my = large ? (height - mh) / 2 : 88;
      if (large) rect(0, 0, width, height, '#0c262ac9');
      rect(mx - 3, my - 3, mw + 6, mh + 6, '#102b2ce8');
      ctx.save();
      ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
      rect(mx, my, mw, mh, '#809079');
      const sx = mw / 3200;
      const sy = mh / 2560;
      const point = p => ({ x: mx + p.x * sx, y: my + p.y * sy });
      rect(mx + 2910 * sx, my, 290 * sx, mh, '#327c80');
      for (const b of s.city.buildings) rect(mx + b.x * sx, my + b.y * sy, b.w * sx, b.h * sy, '#c4baa0');
      for (const x of G.X_ROADS) rect(mx + (x - 66) * sx, my, 132 * sx, mh, '#425b55');
      for (const y of G.Y_ROADS) rect(mx, my + (y - 66) * sy, mw * 0.9, 132 * sy, '#425b55');
      const target = G.target(s);
      if (target) {
        const start = point(s.player);
        const route = G.roadPath(s.player, target);
        ctx.strokeStyle = '#ffcc77'; ctx.lineWidth = large ? 3 : 1.5;
        ctx.beginPath(); ctx.moveTo(start.x, start.y);
        for (const p of route) { const v = point(p); ctx.lineTo(v.x, v.y); }
        ctx.stroke();
        const end = point(target);
        circle(end.x, end.y, large ? 7 : 4, '#ffcd79');
      }
      const safe = point(G.places.safe);
      circle(safe.x, safe.y, large ? 5 : 2.5, '#d4e9b9');
      for (const cop of s.police) {
        const p = point(cop);
        circle(p.x, p.y, large ? 5 : 2.5, Math.sin(s.time * 8) > 0 ? '#ff8565' : '#8ed3e3');
      }
      const player = point(s.player);
      ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(s.player.angle);
      polygon([[7, 0], [-5, -4], [-3, 0], [-5, 4]], '#fff3d2'); ctx.restore();
      if (large) {
        label('LITTLE SOL', mx + mw * 0.26, my + mh * 0.19, 11, '#f0e5c2', 'center');
        label('PALM DISTRICT', mx + mw * 0.55, my + mh * 0.38, 11, '#f0e5c2', 'center');
        label('SUNLINE QUAY', mx + mw * 0.8, my + mh * 0.2, 11, '#f0e5c2', 'center');
        label('OLD SEREIN', mx + mw * 0.27, my + mh * 0.85, 11, '#f0e5c2', 'center');
        label('PORT SEREIN / CITY MAP', mx + 20, my + 30, 15, '#fff0ca');
      }
      ctx.restore();
      label('N ↑', mx + mw - 10, my + 16, 9, '#fbebc5', 'right');
      if (large) label('◈ OBJECTIVE     ● PATROL     ⌂ SAFEHOUSE                          M TO CLOSE', mx + 12, my + mh + 27, 10, C.cream);
    }

    function draw(s, dt) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect(0, 0, width, height, '#bcbf9e');
      const title = s.mode === 'title';
      const tx = title ? 2280 + Math.sin(s.time * 0.04) * 60 : s.player.x;
      const ty = title ? 1000 + Math.sin(s.time * 0.05) * 30 : s.player.y;
      const follow = title ? 1 : 1 - Math.exp(-dt * 5);
      s.camera.x += (tx - s.camera.x) * follow;
      s.camera.y += (ty - s.camera.y) * follow;
      view.x = s.camera.x;
      view.y = s.camera.y;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(view.scale, view.scale * 0.72);
      ctx.translate(-view.x, -view.y);
      drawGround(s);
      for (const track of s.tracks) {
        ctx.save(); ctx.translate(track.x, track.y); ctx.rotate(track.angle);
        rect(-7, -15, 16, 3, '#263d3644'); rect(-7, 12, 16, 3, '#263d3644'); ctx.restore();
      }
      if (!title) drawRouteAndMarkers(s);
      const objects = [];
      for (const b of s.city.buildings) if (visible(b.x + b.w / 2, b.y + b.h / 2, 260)) objects.push({ y: b.y + b.h, draw: () => drawBuilding(b) });
      for (const c of s.cars) if (visible(c.x, c.y)) objects.push({ y: c.y + 15, draw: () => drawCar(c, s) });
      for (const c of s.police) if (visible(c.x, c.y)) objects.push({ y: c.y + 15, draw: () => drawCar(c, s, true) });
      for (const p of s.pedestrians) if (visible(p.x, p.y)) objects.push({ y: p.y + 10, draw: () => drawPerson(p, s) });
      for (const p of s.enemies) if (visible(p.x, p.y)) objects.push({ y: p.y + 10, draw: () => drawPerson(p, s, false, true) });
      if (!title && !s.player.car) objects.push({ y: s.player.y + 10, draw: () => drawPerson(s.player, s, true) });
      if (title || s.mission === 0) objects.push({ y: 785, draw: () => drawPerson({ ...G.places.garage, hp: 100, color: '#d2a962', angle: Math.PI / 2, phase: s.time }, s) });
      for (const p of s.city.palms) if (visible(p.x, p.y)) objects.push({ y: p.y + 8, draw: () => drawPalm(p) });
      objects.sort((a, b) => a.y - b.y);
      for (const object of objects) object.draw();
      for (const bullet of s.bullets) line(bullet.x, bullet.y, bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025, bullet.enemy ? '#f8885f' : '#ffe8a5', 2);
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / p.max;
        circle(p.x, p.y, p.size * p.life / p.max, p.color);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // A warm photographic grade, drawn by the game on every frame.
      const sunlight = ctx.createLinearGradient(0, 0, width, height);
      sunlight.addColorStop(0, '#ffd59b12');
      sunlight.addColorStop(0.5, '#e8c99005');
      sunlight.addColorStop(1, '#173e3f16');
      rect(0, 0, width, height, sunlight);
      if (!title) {
        drawMinimap(s);
        if (!s.mapOpen && G.target(s)) {
          const t = G.target(s);
          let px = (t.x - view.x) * view.scale + width / 2;
          let py = (t.y - view.y) * view.scale * 0.72 + height / 2;
          if (px < 40 || px > width - 40 || py < 30 || py > height - 75) {
            px = G.clamp(px, 22, width - 22);
            py = G.clamp(py, 25, height - 78);
            circle(px, py, 16, '#153a35e8');
            label('◆', px, py + 5, 17, C.amber, 'center');
          }
        }
      }
      if (s.damageFlash > 0) {
        const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, width * 0.7);
        vignette.addColorStop(0, '#e7613d00');
        vignette.addColorStop(1, '#cf432d99');
        rect(0, 0, width, height, vignette);
      }
    }
    function screenToWorld(x, y) {
      return { x: (x - width / 2) / view.scale + view.x,
        y: (y - height / 2) / (view.scale * 0.72) + view.y };
    }
    return { draw, screenToWorld, view };
  };
})(window.Sundown);
