// ============================================================
//  Bullet — projectile with bounce physics
// ============================================================

import Entity from "./entity.js";
import { aabb } from "../engine/physics.js";
import { NATIVE_W, NATIVE_H } from "../constants.js";
import { SPR_BULLET } from "../rendering/sprites.js";

const MAX_BOUNCES = 3;

export default class Bullet extends Entity {
  /**
   * @param {import('../game.js').default} game
   */
  constructor(game, x, y, vx, vy) {
    super(x, y, 2, 2);
    this.game = game;
    this.vx = vx;
    this.vy = vy;
    this.life = 60;
    this.fromPlayer = true;
    this.bounces = 0;
  }

  /**
   * Advance bullet by one frame.
   * Returns an enemy if one was killed this frame, otherwise null.
   */
  update(tiles, enemies, player) {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;

    const { particles, sfx } = this.game;

    // --- tile collision: bounce or shatter ---
    let hitTile = null;
    for (const t of tiles) {
      if (aabb(this, t)) { hitTile = t; break; }
    }

    if (hitTile) {
      if (this.bounces >= MAX_BOUNCES) {
        particles.spawn(this.x, this.y, 4, 2);
        sfx.shatter();
        this.alive = false;
        return null;
      }

      // step back, test each axis
      this.x -= this.vx;
      this.y -= this.vy;

      const testX = { x: this.x + this.vx, y: this.y, w: this.w, h: this.h };
      const testY = { x: this.x, y: this.y + this.vy, w: this.w, h: this.h };

      let hitX = false, hitY = false;
      for (const t of tiles) {
        if (!hitX && aabb(testX, t)) hitX = true;
        if (!hitY && aabb(testY, t)) hitY = true;
        if (hitX && hitY) break;
      }

      if (hitX) this.vx = -this.vx;
      if (hitY) this.vy = -this.vy;
      if (!hitX && !hitY) { this.vx = -this.vx; this.vy = -this.vy; } // corner

      this.x += this.vx;
      this.y += this.vy;
      this.bounces++;
      particles.spawn(this.x, this.y, 2, 1);
      sfx.bounce();

      // bounced bullet absorbed by player (no damage)
      if (player && !player.dead && aabb(this, player)) {
        particles.spawn(this.x, this.y, 2, 1);
        this.alive = false;
      }
      return null;
    }

    // --- off-screen / expired ---
    if (this.life <= 0 || this.x < -10 || this.x > NATIVE_W + 10 ||
        this.y < -10 || this.y > NATIVE_H + 10) {
      this.alive = false;
      return null;
    }

    // --- hit enemies (player bullets only) ---
    if (this.fromPlayer) {
      for (const e of enemies) {
        if (e.alive && aabb(this, e)) {
          e.alive = false;
          this.alive = false;
          particles.spawn(e.x + 4, e.y + 4, 10, 3);
          return e; // killed this enemy
        }
      }
    }

    // --- enemy bullets hit player ---
    if (!this.fromPlayer && player && !player.dead && aabb(this, player)) {
      this.alive = false;
      particles.spawn(player.x + 4, player.y + 4, 10, 3);
      return "hitPlayer";
    }

    return null;
  }

  /** Draw the bullet sprite. */
  draw(ctx) {
    ctx.drawImage(SPR_BULLET, this.x | 0, this.y | 0);
  }
}
