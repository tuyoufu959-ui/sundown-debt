// Three linked contracts. All objectives are reached through the same interaction rules.
(function (G) {
  G.contracts = [
    { name: 'A debt in daylight', chapter: '01 / THE CALL', reward: 250 },
    { name: 'Borrowed time', chapter: '02 / THE COURIER', reward: 1500 },
    { name: 'Cut the wire', chapter: '03 / THE LAST FAVOR', reward: 3200 },
  ];

  G.target = function (s) {
    if (s.freeRoam || s.mission >= 3) return null;
    if (s.mission === 0) return G.places.garage;
    if (s.mission === 1) return s.stage === 0 ? G.places.van : G.places.pier;
    if (s.stage === 0) return G.places.crew;
    return G.places.safe;
  };

  G.objective = function (s) {
    if (s.freeRoam || s.mission >= 3) return 'The city is yours. Find cash caches, take a drive, or return to The Low Tide to clear your heat.';
    if (s.mission === 0) return 'Meet Lena Quill at Quill Motor Works. She has a way to settle your debt.';
    if (s.mission === 1 && s.stage === 0) return 'Steal the silver courier van on Sol Avenue. Keep it in one piece.';
    if (s.mission === 1) return 'Deliver the courier van to Dock 04. The patrols are onto you.';
    if (s.stage === 0) return `Take down the Wire Crew and recover the ledger. ${s.enemies.filter(e => e.hp <= 0).length} / 4 neutralized.`;
    if (s.heat > 0) return 'The ledger is yours. Lose the police, or hide at The Low Tide in Old Serein.';
    return 'Bring the ledger to The Low Tide safehouse. End this debt for good.';
  };

  G.completeContract = function (s) {
    const contract = G.contracts[s.mission];
    s.cash += contract.reward;
    s.completed.push(contract.name);
    s.mission++;
    s.stage = 0;
    s.player.hp = 100;
    G.audio.cue('complete');
    if (s.mission === 2) {
      s.enemies = [
        { x: 2370, y: 1660, hp: 70, angle: 0, cooldown: 1 },
        { x: 2530, y: 1685, hp: 70, angle: 0, cooldown: 2 },
        { x: 2420, y: 1790, hp: 70, angle: 0, cooldown: 3 },
        { x: 2580, y: 1800, hp: 70, angle: 0, cooldown: 4 },
      ];
    }
    s.result = { name: contract.name, reward: contract.reward, final: s.mission === 3 };
    s.mode = 'result';
    G.save(s);
  };

  G.interactStory = function (s) {
    const p = s.player;
    const at = place => G.distance(p, place) < 95;
    if (s.mission === 0 && !s.freeRoam && at(G.places.garage)) {
      s.dialogue = {
        speaker: 'LENA QUILL / MECHANIC & FIXER',
        title: 'One last favor.',
        body: '“You owe the Wire Crew. I know. A silver van on Sol Avenue carries their payment ledger. Bring it to Dock 04 and we can turn the tables.\n\nNico, this is a delivery job. Try to keep it that way.”',
      };
      s.mode = 'dialogue';
      return true;
    }
    if (s.mission === 1 && s.stage === 1 && at(G.places.pier)) {
      const car = s.cars.find(v => v.id === p.car);
      if (car?.kind !== 'courier') {
        G.notify(s, 'LENA: Bring the silver courier van. That’s our leverage.');
      } else if (Math.abs(car.speed) > 45) {
        G.notify(s, 'Slow down to deliver the van.');
      } else {
        car.speed = 0;
        G.completeContract(s);
      }
      return true;
    }
    if (at(G.places.safe)) {
      s.heat = Math.max(0, s.heat - 1.4);
      s.player.hp = Math.min(100, s.player.hp + 25);
      G.notify(s, 'THE LOW TIDE / Lie low. Health restored, heat reduced.');
      G.save(s);
      if (s.mission === 2 && s.stage === 1 && s.heat === 0) G.completeContract(s);
      return true;
    }
    return false;
  };

  G.updateStory = function (s) {
    if (s.mission === 1 && s.stage === 0) {
      const car = s.cars.find(v => v.id === s.player.car);
      if (car?.kind === 'courier') {
        s.stage = 1;
        G.addHeat(s, 1.5);
        G.notify(s, 'LENA: That’s the van. Get to Dock 04. Don’t stop for the lights.');
        G.save(s);
      }
    }
    if (s.mission === 2 && s.stage === 0 && s.enemies.length === 4 && s.enemies.every(e => e.hp <= 0)) {
      s.stage = 1;
      G.addHeat(s, 2);
      G.notify(s, 'LEDGER SECURED / Get to The Low Tide. The crew called the police.');
      G.audio.cue('complete');
      G.save(s);
    }
  };
})(window.Sundown);
