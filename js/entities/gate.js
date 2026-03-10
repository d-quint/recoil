// ============================================================
//  Gate entity — locked flag that opens when all enemies killed
//  Renders as a solid wall with a kill counter; breaks apart
//  into particles when counter reaches 0, revealing the flag.
// ============================================================

import { TILE } from "../constants.js";
import { aabb } from "../engine/physics.js";
import { spawnParticles } from "../engine/particles.js";
import { sfxGateOpen } from "../engine/sfx.js";

let gates = [];

export function clearGates() {
  gates = [];
}

export function getGates() {
  return gates;
}

/**
 * Spawn a gate at (x, y).
 * @param {number} killsRequired — enemies to kill to unlock
 */
export function addGate(x, y, killsRequired) {
  gates.push({
    x, y,
    w: TILE, h: TILE,
    killsRequired,
    killsRemaining: killsRequired,
    open: false,       // true once broken
    breakTimer: 0,     // ticks for break animation
  });
}

/**
 * Notify all gates that an enemy was killed.
 */
export function notifyGateKill(count = 1) {
  for (const g of gates) {
    if (g.open) continue;
    g.killsRemaining = Math.max(0, g.killsRemaining - count);
    if (g.killsRemaining <= 0) {
      g.open = true;
      g.breakTimer = 20;  // 20 frames of debris
      // explosion of debris particles
      spawnParticles(g.x + TILE / 2, g.y + TILE / 2, 16, 3);
      sfxGateOpen();
    }
  }
}

/**
 * Update gates. Returns:
 *   { tiles, flags }
 * tiles — array of solid rects for closed gates (to be added to collision)
 * flags — array of flag rects for opened gates (to check player overlap)
 */
export function updateGates() {
  const tiles = [];
  const flags = [];
  for (const g of gates) {
    if (g.breakTimer > 0) g.breakTimer--;
    if (!g.open) {
      tiles.push(g);  // still solid
    } else {
      flags.push({ x: g.x, y: g.y, w: 8, h: 8 });
    }
  }
  return { tiles, flags };
}
