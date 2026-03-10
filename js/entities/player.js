// ============================================================
//  Player entity — movement, recoil shooting, state
// ============================================================

import {
  GRAVITY, MAX_FALL, FRICTION, RECOIL_FORCE, MAX_RECOIL_SPD, BULLET_SPEED,
  MUZZLE_FLASH_FRAMES, NATIVE_W, NATIVE_H, ANIM_INTERVAL,
} from "../constants.js";
import * as Input from "../engine/input.js";
import { resolveTileCollisions } from "../engine/physics.js";
import { spawnParticles } from "../engine/particles.js";
import { addBullet } from "./bullet.js";

let player = null;
let ammo   = 0;
let muzzleFlash = 0;
let animFrame = 0;
let animTimer = 0;

let shotFiredThisFrame = false;
let dryFireThisFrame = false;

/** Create / reset the player at a given position with starting ammo. */
export function createPlayer(x, y, startingAmmo) {
  player = {
    x, y,
    w: 8, h: 8,
    vx: 0, vy: 0,
    grounded: false,
    facingRight: true,
    dead: false,
  };
  ammo = startingAmmo;
  muzzleFlash = 0;
  animFrame = 0;
  animTimer = 0;
}

export function getPlayer()      { return player; }
export function getAmmo()        { return ammo; }
export function addAmmo(n)       { ammo += n; }
export function didShootThisFrame() { return shotFiredThisFrame; }
export function didDryFireThisFrame() { return dryFireThisFrame; }
export function getMuzzleFlash() { return muzzleFlash; }
export function getAnimFrame()   { return animFrame; }

/** Fire a bullet toward the mouse and apply recoil. Returns true if fired. */
export function shoot() {
  if (ammo <= 0 || player.dead) return false;
  ammo--;
  muzzleFlash = MUZZLE_FLASH_FRAMES;

  const pcx = player.x + player.w / 2;
  const pcy = player.y + player.h / 2;
  const dx  = Input.mouseX - pcx;
  const dy  = Input.mouseY - pcy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx  = dx / len;
  const ny  = dy / len;

  // spawn bullet
  addBullet(pcx - 1 + nx * 6, pcy - 1 + ny * 6, nx * BULLET_SPEED, ny * BULLET_SPEED);

  // recoil (clamped so rapid shots don't stack infinitely)
  player.vx -= nx * RECOIL_FORCE;
  player.vy -= ny * RECOIL_FORCE;
  const spd = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (spd > MAX_RECOIL_SPD) {
    const scale = MAX_RECOIL_SPD / spd;
    player.vx *= scale;
    player.vy *= scale;
  }
  player.grounded = false;

  // muzzle particles
  spawnParticles(pcx + nx * 6, pcy + ny * 6, 5, 2);
  return true;
}

/** Update player physics + input for one frame. */
export function updatePlayer(tiles) {
  if (player.dead) return;

  // walk input
  const walking = !!(Input.keys["KeyA"] || Input.keys["ArrowLeft"] || Input.keys["KeyD"] || Input.keys["ArrowRight"]);
  if (Input.keys["KeyA"] || Input.keys["ArrowLeft"])  { player.vx -= 0.3; player.facingRight = false; }
  if (Input.keys["KeyD"] || Input.keys["ArrowRight"]) { player.vx += 0.3; player.facingRight = true; }

  // walk animation
  if (walking && player.grounded) {
    animTimer++;
    if (animTimer >= ANIM_INTERVAL) { animTimer = 0; animFrame = animFrame ? 0 : 1; }
  } else {
    animFrame = 0;
    animTimer = 0;
  }

  // shoot input
  shotFiredThisFrame = false;
  dryFireThisFrame = false;
  if (Input.mouseJustPressed) {
    shotFiredThisFrame = shoot();
    if (!shotFiredThisFrame && !player.dead) dryFireThisFrame = true;
  }

  // physics
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;
  player.vx *= FRICTION;

  player.grounded = false;
  player.x += player.vx;
  resolveTileCollisions(player, tiles, "x");
  player.y += player.vy;
  resolveTileCollisions(player, tiles, "y");

  // world bounds
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x + player.w > NATIVE_W) { player.x = NATIVE_W - player.w; player.vx = 0; }
  if (player.y < 0) { player.y = 0; player.vy = 0; }

  // fell off bottom
  if (player.y > NATIVE_H + 20) {
    player.dead = true;
  }

  // muzzle flash countdown
  if (muzzleFlash > 0) muzzleFlash--;
}
