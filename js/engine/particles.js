// ============================================================
//  ParticleSystem — spawns and manages visual particles
// ============================================================

import { PARTICLE_LIFE, FG } from "../constants.js";

export default class ParticleSystem {
  constructor() {
    /** @type {{ x:number, y:number, vx:number, vy:number, life:number }[]} */
    this.particles = [];
  }

  /** Spawn a burst of particles at (x, y). */
  spawn(x, y, count, spread) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life: PARTICLE_LIFE + ((Math.random() * 10) | 0),
      });
    }
  }

  /** Advance all particles by one frame. */
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  /** Draw all particles. */
  draw(ctx) {
    ctx.fillStyle = FG;
    for (const p of this.particles) {
      ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
    }
  }

  /** Remove all particles. */
  clear() {
    this.particles.length = 0;
  }
}
