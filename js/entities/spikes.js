// ============================================================
//  Gate — locked flag that opens when all enemies are killed
// ============================================================

import Entity from "./entity.js";
import { TILE } from "../constants.js";
import { aabb } from "../engine/physics.js";
import { SPR_SPIKES } from "../rendering/sprites.js";

export default class Spikes extends Entity {
  /**
   * @param {import('../game.js').default} game
   * @param {number} x
   * @param {number} y
   */
  constructor(game, x, y) {
    super(x, y, TILE, TILE);
    this.game = game;
  }

  update(player) {
    // player collision
    if (!player.dead && aabb(player, this)) {
        this.game.killPlayer();
    }
  }

  /** Draw the spikes sprite. */
  draw(ctx) {
    ctx.drawImage(SPR_SPIKES, this.x | 0, this.y | 0);
  }
}
