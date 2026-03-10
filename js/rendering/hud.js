// ============================================================
//  Renderer — all drawing: title, win, gameplay scene, HUD
// ============================================================

import { NATIVE_W, NATIVE_H, FG, BG, TILE, HUD_H } from "../constants.js";
import { drawText } from "./font.js";
import { SPR_PLAYER_R, SPR_FLAG, SPR_AMMO } from "./sprites.js";

export default class Renderer {
  /** @param {CanvasRenderingContext2D} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  // ---------- helpers ----------

  _drawSprite(spr, x, y) {
    this.ctx.drawImage(spr, x | 0, y | 0);
  }

  // ---------- title screen ----------

  drawTitleScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H + HUD_H);

    drawText(ctx, "recoil", NATIVE_W / 2, 40, "center");

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(SPR_PLAYER_R, NATIVE_W / 2 - 16, 55, 32, 32);
    ctx.restore();

    drawText(ctx, "a/d or arrows to walk",  NATIVE_W / 2, 100, "center");
    drawText(ctx, "aim + click to shoot",   NATIVE_W / 2, 110, "center");
    drawText(ctx, "press r to restart lvl",   NATIVE_W / 2, 120, "center");
    drawText(ctx, "recoil is your jump!",   NATIVE_W / 2, 130, "center");
    drawText(ctx, "reach the flag",          NATIVE_W / 2, 145, "center");
    drawText(ctx, "click to start",          NATIVE_W / 2, 165, "center");
  }

  // ---------- win screen ----------

  drawWinScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H + HUD_H);

    drawText(ctx, "you win!",            NATIVE_W / 2, 60, "center");
    drawText(ctx, "all levels cleared!", NATIVE_W / 2, 75, "center");
    drawText(ctx, "thanks for playing",  NATIVE_W / 2, 95, "center");
    drawText(ctx, "click to replay",     NATIVE_W / 2, 120, "center");
  }

  // ---------- gameplay scene ----------

  /**
   * Draw the full game scene.
   * @param {import('../game.js').default} game
   */
  drawGameScene(game) {
    const ctx = this.ctx;
    const { player, tiles, flag, textLabels, enemies, pickups, gates, bullets,
            particles, levelWon, levelLost, victoryTimer } = game;
    const VICTORY_DURATION = game.VICTORY_DURATION;

    ctx.fillStyle = BG;
    ctx.fillRect(-4, -4, NATIVE_W + 8, NATIVE_H + 8);

    // --- tiles ---
    ctx.fillStyle = FG;
    for (const t of tiles) {
      ctx.fillRect(t.x, t.y, t.w, t.h);
    }
    // dither edges
    ctx.fillStyle = BG;
    for (const t of tiles) {
      for (let py = 0; py < TILE; py += 2)
        ctx.fillRect(t.x + TILE - 1, t.y + py, 1, 1);
      for (let px = 0; px < TILE; px += 2)
        ctx.fillRect(t.x + px, t.y + TILE - 1, 1, 1);
    }
    ctx.fillStyle = FG;

    // --- ammo pickups ---
    for (const a of pickups) a.draw(ctx);

    // --- flag ---
    if (flag) this._drawSprite(SPR_FLAG, flag.x, flag.y);

    // --- text labels ---
    if (textLabels) {
      for (const tl of textLabels) {
        const bob = Math.sin(performance.now() / 400) * 1.5;
        drawText(ctx, tl.content, tl.x, (tl.y + bob) | 0);
      }
    }

    // --- gates ---
    for (const g of gates) g.draw(ctx);

    // --- enemies ---
    for (const e of enemies) e.draw(ctx);

    // --- player (sprite, crosshair, muzzle flash) ---
    if (player) player.draw(ctx);

    // --- bullets ---
    for (const b of bullets) b.draw(ctx);

    // --- particles ---
    particles.draw(ctx);

    // --- overlay messages ---
    const showWin = levelWon && victoryTimer >= VICTORY_DURATION;
    if (showWin || levelLost) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);
    }
    if (showWin) {
      drawText(ctx, "level clear!",       NATIVE_W / 2, NATIVE_H / 2 - 10, "center");
      drawText(ctx, "click to continue",  NATIVE_W / 2, NATIVE_H / 2,      "center");
    }
    if (levelLost) {
      drawText(ctx, "you died!",          NATIVE_W / 2, NATIVE_H / 2 - 10, "center");
      drawText(ctx, "press r to retry",   NATIVE_W / 2, NATIVE_H / 2,      "center");
    }
  }

  // ---------- HUD bar ----------

  /**
   * @param {import('../game.js').default} game
   */
  drawHUDBar(game) {
    const ctx = this.ctx;
    ctx.fillStyle = BG;
    ctx.fillRect(0, NATIVE_H, NATIVE_W, HUD_H);
    ctx.fillStyle = FG;
    ctx.fillRect(0, NATIVE_H, NATIVE_W, 1);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(SPR_AMMO, 1, NATIVE_H + 4, 6, 6);
    ctx.restore();

    const ammo = game.player ? game.player.ammo : 0;
    drawText(ctx, "x" + ammo, 8, NATIVE_H + 5);
    drawText(ctx, "level " + (game.currentLevel + 1), NATIVE_W / 2, NATIVE_H + 5, "center");
  }
}
