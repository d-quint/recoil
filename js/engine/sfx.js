// ============================================================
//  SFX — procedural sound effects using Web Audio API
//  All synth-generated, no audio files needed.
// ============================================================

let audioCtx = null;

/**
 * Lazily create AudioContext on first user interaction.
 * Browsers require a user gesture before playing audio.
 */
function ctx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// ---------- helpers ----------

function playTone(freq, duration, type = "square", volume = 0.15, ramp) {
  const ac = ctx();
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

function playNoise(duration, volume = 0.1) {
  const ac = ctx();
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

// ---------- sound effects ----------

/** Gun shot — sharp square wave blip + noise burst */
export function sfxShoot() {
  playTone(600, 0.06, "square", 0.12, 200);
  playNoise(0.05, 0.08);
}

/** Enemy killed — descending tone */
export function sfxKill() {
  playTone(800, 0.12, "square", 0.12, 200);
  playTone(400, 0.08, "square", 0.08, 100);
}

/** Player death — low rumble drop */
export function sfxDeath() {
  playTone(300, 0.3, "sawtooth", 0.12, 40);
  playNoise(0.25, 0.1);
}

/** Ammo pickup — quick rising chirp */
export function sfxPickup() {
  playTone(400, 0.08, "square", 0.1, 900);
}

/** Victory / flag touch — ascending arpeggio */
export function sfxVictory() {
  const ac = ctx();
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
export function sfxGateOpen() {
  playTone(200, 0.15, "square", 0.12, 80);
  playNoise(0.15, 0.12);
  playTone(150, 0.1, "sawtooth", 0.08, 50);
}

/** Bullet bounce — short metallic ping */
export function sfxBounce() {
  playTone(1200, 0.04, "square", 0.06, 800);
}

/** Bullet shatter — crunch on final break */
export function sfxShatter() {
  playNoise(0.08, 0.1);
  playTone(300, 0.06, "square", 0.07, 100);
}

/** Dry fire — empty click */
export function sfxDryFire() {
  playTone(150, 0.06, "square", 0.08, 80);
}
