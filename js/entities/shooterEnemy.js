// ============================================================
//  ShooterEnemy — patrols, but stops and fires when player
//  is at approximately the same Y coordinate
// ============================================================

import Enemy from "./enemy.js";
import { aabb } from "../engine/physics.js";
import { drawText } from "../rendering/font.js";
import {
  SPR_SHOOTER_R, SPR_SHOOTER_R2, SPR_SHOOTER_L, SPR_SHOOTER_L2,
} from "../rendering/sprites.js";

/** How many frames between each shot while aiming. */
const SHOOT_INTERVAL = 60;
/** Y-distance tolerance (pixels) to consider "same row". */
const Y_TOLERANCE = 6;
/** Bullet speed for shooter enemies (slower than player bullets). */
const SHOOTER_BULLET_SPD = 3;
/** Frames the "!" shows before shooting begins. */
const ALERT_DURATION = 30;
/** Frames per breathing bob cycle. */
const BOB_PERIOD = 40;

export default class ShooterEnemy extends Enemy {
  /**
   * @param {import('../game.js').default} game
   */
  constructor(game, x, y) {
    super(game, x, y);
    /** true while the player is in our sights */
    this.aiming = false;
    /** facing direction while aiming: -1 = left, 1 = right */
    this.aimDir = 1;
    /** countdown timer between shots */
    this.shootTimer = SHOOT_INTERVAL;
    /** Is a ShooterEnemy (used by renderer to pick sprite). */
    this.isShooter = true;

    /** Counts down from ALERT_DURATION when first spotting the player. */
    this.alertTimer = 0;
    /** True only while the "!" should be visible. */
    this.showAlert = false;
    /** Breathing bob offset (pixels, 0 or 1). */
    this.bobOffset = 0;
    /** Internal counter for bob cycle. */
    this._bobTimer = 0;
  }

  /**
   * Override Enemy.update — patrol normally, but stop and shoot
   * when the player is on roughly the same Y.
   */
  update() {
    const { player } = this.game;

    if (!this.alive) return;

    const sameLine = player && !player.dead &&
      Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < Y_TOLERANCE;

    // --- aim mode ---  
    if (sameLine) {
      // --- entering aim mode for the first time? ---
      if (!this.aiming) {
        this.aiming = true;
        this.alertTimer = ALERT_DURATION;
        this.showAlert = true;
        this.shootTimer = SHOOT_INTERVAL;
        this._bobTimer = 0;
      }

      // face the player
      this.aimDir = player.cx < this.cx ? -1 : 1;

      // alert countdown ("!" phase — no shooting yet)
      if (this.alertTimer > 0) {
        this.alertTimer--;
        if (this.alertTimer <= 0) this.showAlert = false;
      }

      // breathing bob (1px up/down cycle)
      this._bobTimer++;
      this.bobOffset = (this._bobTimer % BOB_PERIOD) < (BOB_PERIOD / 2) ? 0 : 1;

      // shoot on interval (only after alert phase)
      if (!this.showAlert) {
        this.shootTimer--;
        if (this.shootTimer <= 0) {
          this.shootTimer = SHOOT_INTERVAL;
          this._fireBullet();
        }
      }

      // still check player collision (touching the shooter kills the player)
      super._checkCollision(player);

      return;
    }

    // --- patrol mode (inherited) ---
    this.aiming = false;
    this.showAlert = false;
    this.alertTimer = 0;
    this.bobOffset = 0;
    this.shootTimer = SHOOT_INTERVAL;
    
    super.update();
  }

  /** Fire an enemy bullet toward the player. */
  _fireBullet() {
    const { particles, sfx } = this.game;

    const bx = this.cx + this.aimDir * 5;
    const by = this.cy;

    // create an enemy bullet via game
    this.game.addEnemyBullet(bx - 1, by - 1, this.aimDir * SHOOTER_BULLET_SPD, 0);

    // muzzle flash particles
    particles.spawn(bx, by, 3, 1.5);
    sfx.shoot();
  }

  /** Draw the shooter enemy with directional sprite, bob, and alert. */
  draw(ctx) {
    if (!this.alive) return;

    const facingRight = this.aiming ? this.aimDir > 0 : this.vx > 0;
    let spr;
    if (facingRight) spr = this.animFrame ? SPR_SHOOTER_R2 : SPR_SHOOTER_R;
    else             spr = this.animFrame ? SPR_SHOOTER_L2 : SPR_SHOOTER_L;

    // breathing bob offset when aiming
    const drawY = this.aiming ? this.y + (this.bobOffset || 0) : this.y;
    ctx.drawImage(spr, this.x | 0, drawY | 0);

    // exclamation mark alert
    if (this.showAlert) {
      drawText(ctx, "!", this.x + 3, this.y - 6);
    }
  }
}
