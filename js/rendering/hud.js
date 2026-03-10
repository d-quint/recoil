// ============================================================
//  Renderer — all drawing: title, win, gameplay scene, HUD
// ============================================================

import { NATIVE_W, NATIVE_H, FG, BG, TILE, HUD_H } from "../constants.js";
import { drawText } from "./font.js";
import {
  SPR_PLAYER_R, SPR_PLAYER_L, SPR_PLAYER_R2, SPR_PLAYER_L2,
  SPR_ENEMY, SPR_ENEMY2,
  SPR_FLAG, SPR_BULLET, SPR_AMMO, SPR_GATE,
} from "./sprites.js";

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
    drawText(ctx, "recoil is your jump!",   NATIVE_W / 2, 120, "center");
    drawText(ctx, "reach the flag",          NATIVE_W / 2, 135, "center");
    drawText(ctx, "click to start",          NATIVE_W / 2, 155, "center");
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
            particles, input, levelWon, levelLost, victoryTimer } = game;
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
    for (const a of pickups) {
      if (!a.alive) continue;
      const bob = Math.sin(performance.now() / 200) * 1.5;
      this._drawSprite(SPR_AMMO, a.x, a.y + bob);
    }

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
    for (const g of gates) {
      if (!g.open) {
        this._drawSprite(SPR_GATE, g.x, g.y);
        drawText(ctx, String(g.killsRemaining), g.x + TILE / 2, g.y + 2, "center", BG);
      } else if (g.breakTimer > 0) {
        if (g.breakTimer % 4 < 2) this._drawSprite(SPR_FLAG, g.x, g.y);
      } else {
        this._drawSprite(SPR_FLAG, g.x, g.y);
      }
    }

    // --- enemies ---
    for (const e of enemies) {
      if (!e.alive) continue;
      this._drawSprite(e.animFrame ? SPR_ENEMY2 : SPR_ENEMY, e.x, e.y);
    }

    // --- player ---
    if (player && !player.dead) {
      let spr;
      if (player.facingRight) spr = player.animFrame ? SPR_PLAYER_R2 : SPR_PLAYER_R;
      else                    spr = player.animFrame ? SPR_PLAYER_L2 : SPR_PLAYER_L;
      this._drawSprite(spr, player.x, player.y);

      // crosshair
      const cx = input.mouseX | 0;
      const cy = input.mouseY | 0;
      ctx.fillStyle = FG;
      ctx.fillRect(cx, cy - 2, 1, 5);
      ctx.fillRect(cx - 2, cy, 5, 1);
      ctx.fillStyle = BG;
      ctx.fillRect(cx, cy, 1, 1);
      ctx.fillStyle = FG;
    }

    // --- bullets ---
    for (const b of bullets) {
      this._drawSprite(SPR_BULLET, b.x, b.y);
    }

    // --- muzzle flash ---
    if (player && player.muzzleFlash > 0 && !player.dead) {
      const dx  = input.mouseX - player.cx;
      const dy  = input.mouseY - player.cy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      ctx.fillStyle = FG;
      ctx.beginPath();
      ctx.arc(player.cx + (dx / len) * 7, player.cy + (dy / len) * 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

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
