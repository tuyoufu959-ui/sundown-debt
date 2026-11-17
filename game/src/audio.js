// Local oscillators provide an engine, percussion, UI chimes, shots and a police siren.
(function (G) {
  G.audio = {
    context: null,
    muted: false,
    start() {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        this.context = new Audio();
        const engine = this.context.createOscillator();
        this.engineGain = this.context.createGain();
        engine.type = 'sawtooth';
        this.engineGain.gain.value = 0;
        engine.connect(this.engineGain).connect(this.context.destination);
        engine.start();
        this.engine = engine;
        this.siren = this.context.createOscillator();
        this.sirenGain = this.context.createGain();
        this.sirenGain.gain.value = 0;
        this.siren.connect(this.sirenGain).connect(this.context.destination);
        this.siren.start();
      }
      this.context.resume();
    },
    tone(frequency, duration = 0.12, type = 'sine', volume = 0.08, end = frequency) {
      if (!this.context || this.muted) return;
      const ctx = this.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    cue(name) {
      if (name === 'shot') this.tone(160, 0.09, 'sawtooth', 0.11, 30);
      if (name === 'hit') this.tone(85, 0.17, 'triangle', 0.14, 25);
      if (name === 'enter') this.tone(340, 0.15, 'square', 0.035, 560);
      if (name === 'complete') {
        [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sine', 0.07), i * 110));
      }
      if (name === 'ui') this.tone(600, 0.08, 'sine', 0.04, 900);
    },
    update(state) {
      if (!this.context) return;
      const ctx = this.context;
      const live = state.mode === 'play' && !this.muted;
      const car = state.cars.find(v => v.id === state.player.car);
      this.engine.frequency.setTargetAtTime(42 + Math.abs(car?.speed ?? 0) * 0.4, ctx.currentTime, 0.1);
      this.engineGain.gain.setTargetAtTime(live && car ? 0.018 : 0, ctx.currentTime, 0.1);
      this.siren.frequency.setTargetAtTime(650 + Math.sin(state.time * 6) * 230, ctx.currentTime, 0.05);
      this.sirenGain.gain.setTargetAtTime(live && state.heat > 0 && state.seen ? 0.012 : 0, ctx.currentTime, 0.1);
    },
  };
})(window.Sundown);
