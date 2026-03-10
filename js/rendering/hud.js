// ============================================================
//  HUD + screen rendering (title, win, in-game overlay)
// ============================================================

import { NATIVE_W, NATIVE_H, FG, BG, TILE, HUD_H } from "../constants.js";
import { drawText } from "./font.js";
import {
  SPR_PLAYER_R, SPR_PLAYER_L, SPR_PLAYER_R2, SPR_PLAYER_L2,
  SPR_ENEMY, SPR_ENEMY2,
  SPR_FLAG, SPR_BULLET, SPR_AMMO, SPR_GATE,
} from "./sprites.js";
import * as Input from "../engine/input.js";
import { drawParticles } from "../engine/particles.js";
import { getPlayer, getAmmo, getMuzzleFlash, getAnimFrame } from "../entities/player.js";
import { getBullets } from "../entities/bullet.js";
import { getEnemies } from "../entities/enemy.js";
import { getPickups } from "../entities/pickup.js";
import { getGates } from "../entities/gate.js";

// ---------- helpers ----------

function drawSprite(ctx, spr, x, y) {
  ctx.drawImage(spr, x | 0, y | 0);
}

// ---------- title screen ----------

export function drawTitleScreen(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, NATIVE_W, NATIVE_H + HUD_H);

  drawText(ctx, "recoil", NATIVE_W / 2, 40, "center");

  // scaled player logo
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(SPR_PLAYER_R, NATIVE_W / 2 - 16, 55, 32, 32);
  ctx.restore();

  drawText(ctx, "a/d or arrows to walk",  NATIVE_W / 2, 100, "center");
  drawText(ctx, "aim + click to shoot",   NATIVE_W / 2, 110, "center");
  drawText(ctx, "recoil is your jump!",   NATIVE_W / 2, 120, "center");
  drawText(ctx, "reach the flag",          NATIVE_W / 2, 135, "center");
  drawText(ctx, "click to start",          NATIVE_W / 2, 155, "center");
}

// ---------- win screen ----------

export function drawWinScreen(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, NATIVE_W, NATIVE_H + HUD_H);

  drawText(ctx, "you win!",            NATIVE_W / 2, 60, "center");
  drawText(ctx, "all levels cleared!", NATIVE_W / 2, 75, "center");
  drawText(ctx, "thanks for playing",  NATIVE_W / 2, 95, "center");
  drawText(ctx, "click to replay",     NATIVE_W / 2, 120, "center");
}

// ---------- gameplay scene ----------

export function drawGameScene(ctx, tiles, flag, levelIndex, levelWon, levelLost, textLabels) {
  const player = getPlayer();

  ctx.fillStyle = BG;
  ctx.fillRect(-4, -4, NATIVE_W + 8, NATIVE_H + 8);

  ctx.fillStyle = FG;

  // --- tiles ---
  for (const t of tiles) {
    ctx.fillRect(t.x, t.y, t.w, t.h);
  }
  // dither edges for texture
  ctx.fillStyle = BG;
  for (const t of tiles) {
    for (let py = 0; py < TILE; py += 2)
      ctx.fillRect(t.x + TILE - 1, t.y + py, 1, 1);
    for (let px = 0; px < TILE; px += 2)
      ctx.fillRect(t.x + px, t.y + TILE - 1, 1, 1);
  }
  ctx.fillStyle = FG;

  // --- ammo pickups ---
  for (const a of getPickups()) {
    if (!a.alive) continue;
    const bob = Math.sin(performance.now() / 200) * 1.5;
    drawSprite(ctx, SPR_AMMO, a.x, a.y + bob);
  }

  // --- flag ---
  if (flag) drawSprite(ctx, SPR_FLAG, flag.x, flag.y);

  // --- text labels (tutorial text, bobs up and down) ---
  if (textLabels) {
    for (const tl of textLabels) {
      const bob = Math.sin(performance.now() / 400) * 1.5;
      drawText(ctx, tl.content, tl.x, (tl.y + bob) | 0);
    }
  }

  // --- gates ---
  for (const g of getGates()) {
    if (!g.open) {
      // draw gate sprite (barred wall)
      drawSprite(ctx, SPR_GATE, g.x, g.y);
      // draw kill counter number in black on top
      const num = String(g.killsRemaining);
      drawText(ctx, num, g.x + TILE / 2, g.y + 2, "center", BG);
    } else if (g.breakTimer > 0) {
      // briefly flash the flag as it appears
      if (g.breakTimer % 4 < 2) drawSprite(ctx, SPR_FLAG, g.x, g.y);
    } else {
      // revealed flag
      drawSprite(ctx, SPR_FLAG, g.x, g.y);
    }
  }

  // --- enemies ---
  for (const e of getEnemies()) {
    if (!e.alive) continue;
    const espr = e.animFrame ? SPR_ENEMY2 : SPR_ENEMY;
    drawSprite(ctx, espr, e.x, e.y);
  }

  // --- player ---
  if (!player.dead) {
    const pf = getAnimFrame();
    let spr;
    if (player.facingRight) spr = pf ? SPR_PLAYER_R2 : SPR_PLAYER_R;
    else                    spr = pf ? SPR_PLAYER_L2 : SPR_PLAYER_L;
    drawSprite(ctx, spr, player.x, player.y);

    // crosshair
    const cx = Input.mouseX | 0;
    const cy = Input.mouseY | 0;
    ctx.fillStyle = FG;
    ctx.fillRect(cx, cy - 2, 1, 5);
    ctx.fillRect(cx - 2, cy, 5, 1);
    ctx.fillStyle = BG;
    ctx.fillRect(cx, cy, 1, 1);
    ctx.fillStyle = FG;
  }

  // --- bullets ---
  for (const b of getBullets()) {
    drawSprite(ctx, SPR_BULLET, b.x, b.y);
  }

  // --- muzzle flash ---
  if (getMuzzleFlash() > 0 && !player.dead) {
    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;
    const dx  = Input.mouseX - pcx;
    const dy  = Input.mouseY - pcy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.fillStyle = FG;
    ctx.beginPath();
    ctx.arc(pcx + (dx / len) * 7, pcy + (dy / len) * 7, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- particles ---
  drawParticles(ctx);

  // --- overlay messages (dim the world first so text is readable) ---
  if (levelWon || levelLost) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
  }
  if (levelWon) {
    drawText(ctx, "level clear!",       NATIVE_W / 2, NATIVE_H / 2 - 10, "center");
    drawText(ctx, "click to continue",  NATIVE_W / 2, NATIVE_H / 2,      "center");
  }
  if (levelLost) {
    drawText(ctx, "you died!",          NATIVE_W / 2, NATIVE_H / 2 - 10, "center");
    drawText(ctx, "press r to retry",   NATIVE_W / 2, NATIVE_H / 2,      "center");
  }
}

// ---------- HUD bar (drawn outside game viewport, not affected by shake) ----------

export function drawHUDBar(ctx, levelIndex) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, NATIVE_H, NATIVE_W, HUD_H);
  ctx.fillStyle = FG;
  ctx.fillRect(0, NATIVE_H, NATIVE_W, 1);

  // bullet sprite + "x N"
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(SPR_AMMO, 1, NATIVE_H + 4, 6, 6);
  ctx.restore();
  drawText(ctx, "x" + getAmmo(), 8, NATIVE_H + 5);
  drawText(ctx, "level " + (levelIndex + 1), NATIVE_W / 2, NATIVE_H + 5, "center");
}
