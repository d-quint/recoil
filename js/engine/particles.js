// ============================================================
//  Particle system
// ============================================================

import { PARTICLE_LIFE, FG } from "../constants.js";

let particles = [];

/** Spawn a burst of particles at (x, y). */
export function spawnParticles(x, y, count, spread) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
      life: PARTICLE_LIFE + ((Math.random() * 10) | 0),
    });
  }
}

/** Advance all particles by one frame. */
export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/** Draw all particles. */
export function drawParticles(ctx) {
  ctx.fillStyle = FG;
  for (const p of particles) {
    ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
  }
}

/** Clear all particles (e.g. on level load). */
export function clearParticles() {
  particles = [];
}
