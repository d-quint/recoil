// ============================================================
//  Gate — locked flag that opens when all enemies are killed
// ============================================================

import Entity from "./entity.js";
import { TILE } from "../constants.js";

export default class Gate extends Entity {
  /**
   * @param {import('../game.js').default} game
   * @param {number} x
   * @param {number} y
   * @param {number} killsRequired
   */
  constructor(game, x, y, killsRequired) {
    super(x, y, TILE, TILE);
    this.game = game;
    this.killsRequired = killsRequired;
    this.killsRemaining = killsRequired;
    this.open = false;
    this.breakTimer = 0;
  }

  /** Notify this gate that enemies were killed. */
  onKill(count = 1) {
    if (this.open) return;
    this.killsRemaining = Math.max(0, this.killsRemaining - count);
    if (this.killsRemaining <= 0) {
      this.open = true;
      this.breakTimer = 20;
      this.game.particles.spawn(this.x + TILE / 2, this.y + TILE / 2, 16, 3);
      this.game.sfx.gateOpen();
    }
  }

  update() {
    if (this.breakTimer > 0) this.breakTimer--;
  }

  /** Return this gate as a solid collision rect, or null if open. */
  getSolidRect() {
    return this.open ? null : this;
  }

  /** Return a flag rect for an opened gate, or null if still closed. */
  getFlagRect() {
    return this.open ? { x: this.x, y: this.y, w: 8, h: 8 } : null;
  }
}
