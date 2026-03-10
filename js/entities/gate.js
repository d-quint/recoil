// ============================================================
//  Gate — locked flag that opens when all enemies are killed
// ============================================================

import Entity from "./entity.js";
import { TILE, BG } from "../constants.js";
import { drawText } from "../rendering/font.js";
import { SPR_GATE, SPR_FLAG } from "../rendering/sprites.js";

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

  /** Draw the gate (locked wall or revealed flag). */
  draw(ctx) {
    if (!this.open) {
      ctx.drawImage(SPR_GATE, this.x | 0, this.y | 0);
      drawText(ctx, String(this.killsRemaining), this.x + TILE / 2, this.y - 6, "center");
    } else if (this.breakTimer > 0) {
      if (this.breakTimer % 4 < 2) ctx.drawImage(SPR_FLAG, this.x | 0, this.y | 0);
    } else {
      ctx.drawImage(SPR_FLAG, this.x | 0, this.y | 0);
    }
  }
}
