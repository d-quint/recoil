// ============================================================
//  Ammo pickup entity
// ============================================================

import { aabb } from "../engine/physics.js";
import { spawnParticles } from "../engine/particles.js";

let pickups = [];

export function clearPickups() {
  pickups = [];
}

export function getPickups() {
  return pickups;
}

/** Spawn an ammo pickup at (x, y). */
export function addPickup(x, y) {
  pickups.push({ x, y, w: 6, h: 6, alive: true });
}

/**
 * Update pickups. Returns the number of ammo collected this frame.
 */
export function updatePickups(player) {
  let collected = 0;
  for (const a of pickups) {
    if (!a.alive) continue;
    if (aabb(player, a)) {
      a.alive = false;
      collected += 3;
      spawnParticles(a.x + 3, a.y + 3, 6, 2);
    }
  }
  return collected;
}
