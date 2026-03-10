// ============================================================
//  Pickup — ammo collectible
// ============================================================

import Entity from "./entity.js";
import { aabb } from "../engine/physics.js";

export default class Pickup extends Entity {
  /**
   * @param {import('../game.js').default} game
   */
  constructor(game, x, y) {
    super(x, y, 6, 6);
    this.game = game;
  }

  /**
   * Check if the player collected this pickup.
   * @returns {number} Amount of ammo collected (0 if not collected)
   */
  checkCollection(player) {
    if (!this.alive) return 0;
    if (aabb(player, this)) {
      this.alive = false;
      this.game.particles.spawn(this.x + 3, this.y + 3, 6, 2);
      return 3;
    }
    return 0;
  }
}
