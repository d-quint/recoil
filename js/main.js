// ============================================================
//  main.js — game loop, state machine, glue between modules
// ============================================================

import { NATIVE_W, NATIVE_H } from "./constants.js";
import { ctx } from "./engine/canvas.js";
import * as Input from "./engine/input.js";
import { updateParticles, spawnParticles } from "./engine/particles.js";
import { aabb } from "./engine/physics.js";

import { getPlayer, updatePlayer, addAmmo, didShootThisFrame, didDryFireThisFrame } from "./entities/player.js";
import { updateBullets } from "./entities/bullet.js";
import { getEnemies, updateEnemies } from "./entities/enemy.js";
import { updatePickups } from "./entities/pickup.js";
import { notifyGateKill, updateGates } from "./entities/gate.js";

import { drawTitleScreen, drawWinScreen, drawGameScene, drawHUDBar } from "./rendering/hud.js";

import { loadAllLevels, getLevels, getLevelCount, injectLevel } from "./levels/index.js";
import { loadLevel } from "./levels/loader.js";
import { sfxShoot, sfxKill, sfxDeath, sfxPickup, sfxVictory, sfxDryFire } from "./engine/sfx.js";

// ---------- playtest detection ----------
const PLAYTEST_KEY = "recoil_playtest";
const isPlaytest = new URLSearchParams(window.location.search).has("playtest");
let playtestDef = null;

// ---------- game state ----------
let gameState    = "title"; // "title" | "play" | "win"
let currentLevel = 0;
let tiles        = [];
let textLabels   = [];
let flag         = null;
let levelWon     = false;
let levelLost    = false;
let shakeTimer   = 0;
let shakeX       = 0;
let shakeY       = 0;

// victory animation
let victoryTimer = 0;     // counts up from 0 when flag touched
const VICTORY_DURATION = 40; // frames of celebration before showing text

// ---------- level management ----------

function startLevel(index) {
  currentLevel = index;
  const result = loadLevel(getLevels()[index]);
  tiles      = result.tiles;
  flag       = result.flag;
  textLabels = result.textLabels || [];
  levelWon  = false;
  levelLost = false;
  shakeTimer = 0;
  victoryTimer = 0;
}

function restartLevel() {
  if (gameState === "play") startLevel(currentLevel);
}

// ---------- wire up input callbacks ----------

Input.onRestart(restartLevel);

Input.onClick(() => {
  if (gameState === "title") {
    gameState = "play";
    startLevel(0);
    return;
  }
  if (gameState === "win") {
    if (isPlaytest) {
      // playtest complete — clean up and close
      localStorage.removeItem(PLAYTEST_KEY);
      window.close();
      return;
    }
    gameState = "title";
    return;
  }
  if (levelLost) {
    restartLevel();
    return;
  }
  if (levelWon && victoryTimer >= VICTORY_DURATION) {
    if (isPlaytest) {
      // playtest complete — clean up and close
      localStorage.removeItem(PLAYTEST_KEY);
      window.close();
      return;
    }
    currentLevel++;
    if (currentLevel >= getLevelCount()) {
      gameState = "win";
    } else {
      startLevel(currentLevel);
    }
  }
});

// ---------- update ----------

function update() {
  if (gameState !== "play") {
    Input.resetFrameInput();
    return;
  }
  if (levelLost) {
    updateParticles();
    Input.resetFrameInput();
    return;
  }

  // during victory animation, only run particles + timer
  if (levelWon) {
    victoryTimer++;
    const player = getPlayer();
    // periodic sparkle particles during celebration
    if (player && victoryTimer % 4 === 0) {
      spawnParticles(player.x + 4, player.y - 2, 3, 2);
    }
    updateParticles();
    Input.resetFrameInput();
    return;
  }

  const player = getPlayer();
  if (!player) { Input.resetFrameInput(); return; }

  // update gates — get solid gate tiles and revealed flags
  const gateResult = updateGates();
  const allTiles = tiles.concat(gateResult.tiles);

  // player physics + shooting (handles mouseJustPressed internally)
  updatePlayer(allTiles);
  if (didShootThisFrame()) { shakeTimer = 4; sfxShoot(); }
  if (didDryFireThisFrame()) sfxDryFire();

  // bullets vs tiles & enemies
  const bulletResult = updateBullets(allTiles, getEnemies(), player);
  if (bulletResult.killedEnemies.length > 0) {
    shakeTimer = 5;
    sfxKill();
    // notify gates about kills
    notifyGateKill(bulletResult.killedEnemies.length);
  }

  // enemies
  const enemyHitPlayer = updateEnemies(allTiles, player);
  if (enemyHitPlayer) {
    player.dead = true;
    levelLost = true;
    shakeTimer = 8;
    sfxDeath();
  }

  // ammo pickups
  const collected = updatePickups(player);
  if (collected > 0) { addAmmo(collected); sfxPickup(); }

  // flag check (normal flag)
  if (flag && !player.dead && aabb(player, flag)) {
    levelWon = true;
    victoryTimer = 0;
    shakeTimer = 0;
    sfxVictory();
    // big celebration burst
    spawnParticles(player.x + 4, player.y + 4, 20, 3);
  }

  // gate flags check (revealed after killing all enemies)
  if (!levelWon && !player.dead) {
    for (const gf of gateResult.flags) {
      if (aabb(player, gf)) {
        levelWon = true;
        victoryTimer = 0;
        shakeTimer = 0;
        sfxVictory();
        spawnParticles(player.x + 4, player.y + 4, 20, 3);
        break;
      }
    }
  }

  // death from falling
  if (player.dead && !levelLost) {
    levelLost = true;
    sfxDeath();
  }

  // particles
  updateParticles();

  // screen shake
  if (shakeTimer > 0) {
    shakeTimer--;
    shakeX = ((Math.random() - 0.5) * 3) | 0;
    shakeY = ((Math.random() - 0.5) * 3) | 0;
  } else {
    shakeX = shakeY = 0;
  }

  // consume one-shot input flags
  Input.resetFrameInput();
}

// ---------- draw ----------

function draw() {
  // HUD bar (below game area, never shakes)
  if (gameState === "play") {
    drawHUDBar(ctx, currentLevel);
  }

  // clip to game viewport so shake doesn't bleed into HUD
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, NATIVE_W, NATIVE_H);
  ctx.clip();
  ctx.translate(shakeX, shakeY);

  switch (gameState) {
    case "title":
      drawTitleScreen(ctx);
      break;
    case "win":
      drawWinScreen(ctx);
      break;
    case "play":
      drawGameScene(ctx, tiles, flag, currentLevel, levelWon && victoryTimer >= VICTORY_DURATION, levelLost, textLabels);
      break;
  }

  ctx.restore();
}

// ---------- game loop ----------

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// kick off — load levels then start
async function init() {
  await loadAllLevels();

  // playtest mode: inject editor level and skip title
  if (isPlaytest) {
    try {
      const raw = localStorage.getItem(PLAYTEST_KEY);
      if (raw) {
        playtestDef = JSON.parse(raw);
        const idx = injectLevel(playtestDef);
        gameState = "play";
        startLevel(idx);
      }
    } catch (e) {
      console.error("Failed to load playtest level:", e);
    }
  }

  loop();
}

init();
