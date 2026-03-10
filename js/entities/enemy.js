// ============================================================
//  Enemy — patrol AI with player collision
// ============================================================

import Entity from "./entity.js";
import { ENEMY_SPD, ANIM_INTERVAL } from "../constants.js";
import { aabb } from "../engine/physics.js";

export default class Enemy extends Entity {
  /**
   * @param {import('../game.js').default} game
   */
  constructor(game, x, y) {
    super(x, y, 8, 8);
    this.game = game;
    this.vx = ENEMY_SPD;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  /**
   * Advance enemy AI by one frame.
   * Returns true if the enemy collided with the player.
   */
  update(tiles, player) {
    if (!this.alive) return false;

    this.x += this.vx;

    // walk animation
    this.animTimer++;
    if (this.animTimer >= ANIM_INTERVAL) {
      this.animTimer = 0;
      this.animFrame = this.animFrame ? 0 : 1;
    }

    // wall check
    let hitWall = false;
    for (const t of tiles) {
      if (aabb(this, t)) {
        hitWall = true;
        this.vx *= -1;
        this.x += this.vx * 2;
        break;
      }
    }

    // ground check — probe below the leading edge
    if (!hitWall) {
      const probeX = this.vx > 0 ? this.x + this.w : this.x;
      let onGround = false;
      for (const t of tiles) {
        if (aabb({ x: probeX - 1, y: this.y + this.h, w: 2, h: 2 }, t)) {
          onGround = true;
          break;
        }
      }
      if (!onGround) {
        this.vx *= -1;
        this.x += this.vx * 2;
      }
    }

    // player collision
    if (!player.dead && aabb(player, this)) {
      this.game.particles.spawn(player.x + 4, player.y + 4, 15, 3);
      return true;
    }
    return false;
  }
}
