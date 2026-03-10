// ============================================================
//  Bullet pool
// ============================================================

import { aabb } from "../engine/physics.js";
import { spawnParticles } from "../engine/particles.js";
import { NATIVE_W, NATIVE_H } from "../constants.js";
import { sfxBounce, sfxShatter } from "../engine/sfx.js";

const MAX_BOUNCES = 3;

let bullets = [];

export function clearBullets() {
  bullets = [];
}

export function getBullets() {
  return bullets;
}

/** Spawn a new bullet. */
export function addBullet(x, y, vx, vy) {
  bullets.push({ x, y, w: 2, h: 2, vx, vy, life: 60, fromPlayer: true, bounces: 0 });
}

/**
 * Update all bullets. Returns an object with arrays of events:
 *   { killedEnemies: Enemy[], hitPlayer: boolean }
 */
export function updateBullets(tiles, enemies, player) {
  const killedEnemies = [];

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    // hit tiles — bounce or shatter
    let hitTile = null;
    for (const t of tiles) {
      if (aabb(b, t)) {
        hitTile = t;
        break;
      }
    }

    if (hitTile) {
      if (b.bounces >= MAX_BOUNCES) {
        // shatter
        spawnParticles(b.x, b.y, 4, 2);
        sfxShatter();
        bullets.splice(i, 1);
        continue;
      }
      // reflect — determine which axis to flip
      // step back, test each axis against ALL tiles
      b.x -= b.vx;
      b.y -= b.vy;

      const testX = { x: b.x + b.vx, y: b.y, w: b.w, h: b.h };
      const testY = { x: b.x, y: b.y + b.vy, w: b.w, h: b.h };

      let hitX = false, hitY = false;
      for (const t of tiles) {
        if (!hitX && aabb(testX, t)) hitX = true;
        if (!hitY && aabb(testY, t)) hitY = true;
        if (hitX && hitY) break;
      }

      if (hitX) b.vx = -b.vx;
      if (hitY) b.vy = -b.vy;
      if (!hitX && !hitY) { b.vx = -b.vx; b.vy = -b.vy; } // true corner

      // move with reflected velocity
      b.x += b.vx;
      b.y += b.vy;
      b.bounces++;
      spawnParticles(b.x, b.y, 2, 1);
      sfxBounce();

      // bounced bullet absorbed by player (no damage)
      if (player && !player.dead && aabb(b, player)) {
        spawnParticles(b.x, b.y, 2, 1);
        bullets.splice(i, 1);
      }
      continue;
    }

    if (b.life <= 0 || b.x < -10 || b.x > NATIVE_W + 10 || b.y < -10 || b.y > NATIVE_H + 10) {
      bullets.splice(i, 1);
      continue;
    }

    // hit enemies
    if (b.fromPlayer) {
      for (const e of enemies) {
        if (e.alive && aabb(b, e)) {
          e.alive = false;
          killedEnemies.push(e);
          bullets.splice(i, 1);
          spawnParticles(e.x + 4, e.y + 4, 10, 3);
          break;
        }
      }
    }
  }

  return { killedEnemies };
}
