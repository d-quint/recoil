// ============================================================
//  Global constants shared across all modules
// ============================================================

export const NATIVE_W = 320;
export const NATIVE_H = 180;
export const SCALE    = 3;
export const TILE     = 8;
export const COLS     = NATIVE_W / TILE;  // 40
export const ROWS     = NATIVE_H / TILE;  // 22

// physics
export const GRAVITY       = 0.25;
export const MAX_FALL      = 4;
export const WALK_SPD      = 1.2;
export const FRICTION      = 0.82;
export const RECOIL_FORCE  = 5.5;
export const MAX_RECOIL_SPD = 7;   // hard cap on velocity from recoil stacking
export const BULLET_SPEED  = 6;
export const ENEMY_SPD     = 0.35;

// visual
export const MUZZLE_FLASH_FRAMES = 4;
export const PARTICLE_LIFE       = 20;

// HUD
export const HUD_H = 14;

// animation
export const ANIM_INTERVAL = 8;   // frames between walk-cycle toggles

// colors
export const BG = "#000";
export const FG = "#fff";
