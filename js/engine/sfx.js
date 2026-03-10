// ============================================================
//  SFX — procedural sound effects using Web Audio API
//  All synth-generated, no audio files needed.
// ============================================================

export default class SFX {
  constructor() {
    /** @type {AudioContext|null} */
    this._audioCtx = null;
  }

  // ---------- internal helpers ----------

  /** Lazily create / resume AudioContext. */
  _ctx() {
    if (!this._audioCtx) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._audioCtx.state === "suspended") this._audioCtx.resume();
    return this._audioCtx;
  }

  _playTone(freq, duration, type = "square", volume = 0.15, ramp) {
    const ac = this._ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (ramp) osc.frequency.linearRampToValueAtTime(ramp, ac.currentTime + duration);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }

  _playNoise(duration, volume = 0.1) {
    const ac = this._ctx();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
    src.connect(gain).connect(ac.destination);
    src.start(ac.currentTime);
  }

  // ---------- public sound effects ----------

  /** Gun shot — sharp square wave blip + noise burst */
  shoot() {
    this._playTone(600, 0.06, "square", 0.12, 200);
    this._playNoise(0.05, 0.08);
  }

  /** Enemy killed — descending tone */
  kill() {
    this._playTone(800, 0.12, "square", 0.12, 200);
    this._playTone(400, 0.08, "square", 0.08, 100);
  }

  /** Player death — low rumble drop */
  death() {
    this._playTone(300, 0.3, "sawtooth", 0.12, 40);
    this._playNoise(0.25, 0.1);
  }

  /** Ammo pickup — quick rising chirp */
  pickup() {
    this._playTone(400, 0.08, "square", 0.1, 900);
  }

  /** Victory / flag touch — ascending arpeggio */
  victory() {
    const ac = this._ctx();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.15);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  /** Gate unlocked — chunky breaking sound */
  gateOpen() {
    this._playTone(200, 0.15, "square", 0.12, 80);
    this._playNoise(0.15, 0.12);
    this._playTone(150, 0.1, "sawtooth", 0.08, 50);
  }

  /** Bullet bounce — short metallic ping */
  bounce() {
    this._playTone(1200, 0.04, "square", 0.06, 800);
  }

  /** Bullet shatter — crunch on final break */
  shatter() {
    this._playNoise(0.08, 0.1);
    this._playTone(300, 0.06, "square", 0.07, 100);
  }

  /** Dry fire — empty click */
  dryFire() {
    this._playTone(150, 0.06, "square", 0.08, 80);
  }
}
