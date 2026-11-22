// Synthesized WebAudio sounds and a low ambient drone — no audio files, no
// network. Every sound is built from oscillators, so the game stays offline.
// Audio starts only after the first user gesture (browser autoplay policy).
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.droneNodes = null;
    this.lastStep = 0;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startDrone();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  startDrone() {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    gain.connect(this.master);
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle'; osc2.frequency.value = 82.5;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    osc1.connect(gain); osc2.connect(gain);
    osc1.start(); osc2.start(); lfo.start();
    this.droneNodes = { osc1, osc2, lfo };
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  step(sneaking) {
    const now = performance.now();
    if (now - this.lastStep < (sneaking ? 420 : 300)) return;
    this.lastStep = now;
    this.tone(90, 0.07, 'sine', sneaking ? 0.03 : 0.06);
  }

  pebble() { this.tone(1400, 0.08, 'square', 0.08, 900); this.tone(900, 0.12, 'square', 0.06, 500); }
  clatter() { this.tone(700, 0.05, 'square', 0.07); setTimeout(() => this.tone(520, 0.06, 'square', 0.06), 90); }
  spotted() { this.tone(660, 0.18, 'sawtooth', 0.14, 880); this.tone(880, 0.22, 'sawtooth', 0.12, 1100); }
  alarmTick() { this.tone(1200, 0.09, 'square', 0.09, 1200); }
  emp() { this.tone(300, 0.5, 'sawtooth', 0.12, 60); this.tone(1800, 0.3, 'sine', 0.06, 200); }
  pickup() { this.tone(523, 0.12, 'sine', 0.16); setTimeout(() => this.tone(784, 0.14, 'sine', 0.16), 110); setTimeout(() => this.tone(1047, 0.22, 'sine', 0.16), 220); }
  lockpickTick() { this.tone(2000, 0.04, 'square', 0.05); }
  caught() { this.tone(220, 0.7, 'sawtooth', 0.16, 55); this.tone(110, 0.9, 'square', 0.1, 40); }
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.3, 'triangle', 0.16), i * 140));
  }
}
