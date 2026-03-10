// ============================================================
//  Player — movement, recoil shooting, animation state
// ============================================================

import Entity from "./entity.js";
import {
  GRAVITY, MAX_FALL, FRICTION, RECOIL_FORCE, MAX_RECOIL_SPD,
  BULLET_SPEED, MUZZLE_FLASH_FRAMES, NATIVE_W, NATIVE_H, ANIM_INTERVAL, FG, BG,
} from "../constants.js";
import { resolveTileCollisions } from "../engine/physics.js";
import {
  SPR_PLAYER_R, SPR_PLAYER_L, SPR_PLAYER_R2, SPR_PLAYER_L2,
} from "../rendering/sprites.js";

export default class Player extends Entity {
  /**
   * @param {import('../game.js').default} game
   * @param {number} x
   * @param {number} y
   * @param {number} ammo — starting ammo
   */
  constructor(game, x, y, ammo) {
    super(x, y, 8, 8);
    this.game = game;
    this.ammo = ammo;
    this.grounded = false;
    this.facingRight = true;
    this.dead = false;
    this.muzzleFlash = 0;
    this.animFrame = 0;
    this.animTimer = 0;

    /** Set to true the frame a bullet was successfully fired. */
    this.shotFired = false;
    /** Set to true the frame the player clicked but had no ammo. */
    this.dryFired = false;
  }

  addAmmo(n) { this.ammo += n; }

  /** Fire a bullet toward the mouse and apply recoil. Returns true if fired. */
  shoot() {
    if (this.ammo <= 0 || this.dead) return false;
    this.ammo--;
    this.muzzleFlash = MUZZLE_FLASH_FRAMES;

    const { input, particles } = this.game;
    const dx  = input.mouseX - this.cx;
    const dy  = input.mouseY - this.cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx  = dx / len;
    const ny  = dy / len;

    // spawn bullet
    this.game.addBullet(
      this.cx - 1 + nx * 6,
      this.cy - 1 + ny * 6,
      nx * BULLET_SPEED,
      ny * BULLET_SPEED,
    );

    // recoil (clamped)
    this.vx -= nx * RECOIL_FORCE;
    this.vy -= ny * RECOIL_FORCE;
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > MAX_RECOIL_SPD) {
      const scale = MAX_RECOIL_SPD / spd;
      this.vx *= scale;
      this.vy *= scale;
    }
    this.grounded = false;

    // muzzle particles
    particles.spawn(this.cx + nx * 6, this.cy + ny * 6, 5, 2);
    return true;
  }

  /** Advance player physics + input for one frame. */
  update() {
    const currentTiles = this.game.currentTiles;

    if (this.dead) return;

    const { input } = this.game;

    // walk input
    const walking = !!(
      input.keys["KeyA"] || input.keys["ArrowLeft"] ||
      input.keys["KeyD"] || input.keys["ArrowRight"]
    );
    if (input.keys["KeyA"] || input.keys["ArrowLeft"])  { this.vx -= 0.3; this.facingRight = false; }
    if (input.keys["KeyD"] || input.keys["ArrowRight"]) { this.vx += 0.3; this.facingRight = true; }

    // walk animation
    if (walking && this.grounded) {
      this.animTimer++;
      if (this.animTimer >= ANIM_INTERVAL) {
        this.animTimer = 0;
        this.animFrame = this.animFrame ? 0 : 1;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    // shoot input
    this.shotFired = false;
    this.dryFired = false;
    if (input.mouseJustPressed) {
      this.shotFired = this.shoot();
      if (!this.shotFired && !this.dead) this.dryFired = true;
    }

    // physics
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.vx *= FRICTION;

    this.grounded = false;
    this.x += this.vx;
    resolveTileCollisions(this, currentTiles, "x");
    this.y += this.vy;
    resolveTileCollisions(this, currentTiles, "y");

    // world bounds
    if (this.x < 0)                { this.x = 0;               this.vx = 0; }
    if (this.x + this.w > NATIVE_W) { this.x = NATIVE_W - this.w; this.vx = 0; }
    if (this.y < 0)                { this.y = 0;               this.vy = 0; }

    // fell off bottom
    if (this.y > NATIVE_H + 20) this.dead = true;

    // muzzle flash countdown
    if (this.muzzleFlash > 0) this.muzzleFlash--;

    if (this.game.player.shotFired) { this.game.shakeTimer = 4; this.game.sfx.shoot(); }
    if (this.game.player.dryFired)  this.game.sfx.dryFire();
  }

  /** Draw the player sprite, crosshair, and muzzle flash. */
  draw(ctx) {
    if (this.dead) return;

    const { input } = this.game;

    // sprite
    let spr;
    if (this.facingRight) spr = this.animFrame ? SPR_PLAYER_R2 : SPR_PLAYER_R;
    else                  spr = this.animFrame ? SPR_PLAYER_L2 : SPR_PLAYER_L;
    ctx.drawImage(spr, this.x | 0, this.y | 0);

    // crosshair
    const cx = input.mouseX | 0;
    const cy = input.mouseY | 0;
    ctx.fillStyle = FG;
    ctx.fillRect(cx, cy - 2, 1, 5);
    ctx.fillRect(cx - 2, cy, 5, 1);
    ctx.fillStyle = BG;
    ctx.fillRect(cx, cy, 1, 1);

    // muzzle flash
    if (this.muzzleFlash > 0) {
      const dx  = input.mouseX - this.cx;
      const dy  = input.mouseY - this.cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      ctx.fillStyle = FG;
      ctx.beginPath();
      ctx.arc(this.cx + (dx / len) * 7, this.cy + (dy / len) * 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
