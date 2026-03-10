// ============================================================
//  Enemy entity — patrol AI + player collision
// ============================================================

import { ENEMY_SPD, ANIM_INTERVAL } from "../constants.js";
import { aabb } from "../engine/physics.js";
import { spawnParticles } from "../engine/particles.js";

let enemies = [];

export function clearEnemies() {
  enemies = [];
}

export function getEnemies() {
  return enemies;
}

/** Spawn an enemy at (x, y). */
export function addEnemy(x, y) {
  enemies.push({ x, y, w: 8, h: 8, vx: ENEMY_SPD, alive: true, animFrame: 0, animTimer: 0 });
}

/**
 * Update all enemies.
 * Returns true if any living enemy is overlapping the player.
 */
export function updateEnemies(tiles, player) {
  let hitPlayer = false;

  for (const e of enemies) {
    if (!e.alive) continue;

    e.x += e.vx;

    // walk animation
    e.animTimer++;
    if (e.animTimer >= ANIM_INTERVAL) { e.animTimer = 0; e.animFrame = e.animFrame ? 0 : 1; }

    // wall check — if overlapping any tile after moving, reverse
    let hitWall = false;
    for (const t of tiles) {
      if (aabb(e, t)) {
        hitWall = true;
        e.vx *= -1;
        e.x += e.vx * 2;
        break;
      }
    }

    // ground check — probe below the leading edge
    if (!hitWall) {
      const probeX = e.vx > 0 ? e.x + e.w : e.x;
      let onGround = false;
      for (const t of tiles) {
        if (aabb({ x: probeX - 1, y: e.y + e.h, w: 2, h: 2 }, t)) {
          onGround = true;
          break;
        }
      }
      if (!onGround) {
        e.vx *= -1;
        e.x += e.vx * 2;
      }
    }

    // player collision
    if (!player.dead && aabb(player, e)) {
      hitPlayer = true;
      spawnParticles(player.x + 4, player.y + 4, 15, 3);
    }
  }

  return hitPlayer;
}
