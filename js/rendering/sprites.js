// ============================================================
//  1-bit sprite definitions
//  '#' = white pixel, '.' = transparent
// ============================================================

import { FG } from "../constants.js";

/** Turn an array of strings into an offscreen canvas sprite. */
function makeSprite(lines) {
  const h = lines.length;
  const w = lines[0].length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d");
  cx.fillStyle = FG;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (lines[y][x] === "#") cx.fillRect(x, y, 1, 1);
  return c;
}

// Player facing right (8×8) — frame 0 (legs apart)
export const SPR_PLAYER_R = makeSprite([
  ".##.....",
  ".##.....",
  "####....",
  ".##.....",
  ".##.####",
  "####.#..",
  ".#.#....",
  ".#..#...",
]);

// Player facing right — frame 1 (legs together)
export const SPR_PLAYER_R2 = makeSprite([
  ".##.....",
  ".##.....",
  "####....",
  ".##.....",
  ".##.####",
  "####.#..",
  "..##....",
  "..##....",
]);

// Player facing left (8×8) — frame 0 (legs apart)
export const SPR_PLAYER_L = makeSprite([
  ".....##.",
  ".....##.",
  "....####",
  ".....##.",
  "####.##.",
  "..#.####",
  "....#.#.",
  "...#..#.",
]);

// Player facing left — frame 1 (legs together)
export const SPR_PLAYER_L2 = makeSprite([
  ".....##.",
  ".....##.",
  "....####",
  ".....##.",
  "####.##.",
  "..#.####",
  "....##..",
  "....##..",
]);

// Enemy (8×8) — frame 0 (legs apart)
export const SPR_ENEMY = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "...##...",
  "..####..",
  "..#..#..",
]);

// Enemy — frame 1 (legs together)
export const SPR_ENEMY2 = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "...##...",
  "..####..",
  "...##...",
]);

// Flag (8×8)
export const SPR_FLAG = makeSprite([
  ".#####..",
  ".##.##..",
  ".#####..",
  ".#......",
  ".#......",
  ".#......",
  ".#......",
  "###.....",
]);

// Bullet (2×2)
export const SPR_BULLET = makeSprite([
  "##",
  "##",
]);

// Ammo pickup (6×6)
export const SPR_AMMO = makeSprite([
  "..##..",
  ".####.",
  ".####.",
  ".####.",
  ".####.",
  ".####.",
]);

// Shooter enemy facing right (8×8) — frame 0
export const SPR_SHOOTER_R = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "...##.##",
  "..####..",
  "..#..#..",
]);

// Shooter enemy facing right — frame 1
export const SPR_SHOOTER_R2 = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "...##.##",
  "..####..",
  "...##...",
]);

// Shooter enemy facing left (8×8) — frame 0
export const SPR_SHOOTER_L = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "##.##...",
  "..####..",
  "..#..#..",
]);

// Shooter enemy facing left — frame 1
export const SPR_SHOOTER_L2 = makeSprite([
  "..####..",
  ".######.",
  ".#.##.#.",
  ".######.",
  "..####..",
  "##.##...",
  "..####..",
  "...##...",
]);

// Gate / locked wall (8×8) — a barred wall
export const SPR_GATE = makeSprite([
  "########",
  "#.#..#.#",
  "#.#..#.#",
  "########",
  "#.#..#.#",
  "#.#..#.#",
  "########",
  "........",
]);
