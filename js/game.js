// ============================================================
//  Game — central orchestrator: state machine, update, draw
// ============================================================

import { NATIVE_W, NATIVE_H } from "./constants.js";
import { ctx } from "./engine/canvas.js";

import InputManager    from "./engine/input.js";
import ParticleSystem  from "./engine/particles.js";
import SFX             from "./engine/sfx.js";
import { aabb }        from "./engine/physics.js";

import Bullet         from "./entities/bullet.js";
import Renderer       from "./rendering/hud.js";
import LevelManager   from "./levels/index.js";
import ShooterEnemy   from "./entities/shooterEnemy.js";

export default class Game {
  constructor() {
    // --- subsystems ---
    this.input     = new InputManager();
    this.particles = new ParticleSystem();
    this.sfx       = new SFX();
    this.renderer  = new Renderer(ctx);
    this.levels    = new LevelManager();

    // --- state machine ---
    this.state        = "title"; // "title" | "play" | "win"
    this.currentLevel = 0;

    // --- level data ---
    /** @type {{ x:number, y:number, w:number, h:number }[]} */
    this.tiles      = [];
    /** @type {{ x:number, y:number, content:string }[]} */
    this.textLabels = [];
    /** @type {{ x:number, y:number, w:number, h:number }|null} */
    this.flag       = null;

    // --- entities ---
    /** @type {import('./entities/player.js').default|null} */
    this.player  = null;
    /** @type {import('./entities/bullet.js').default[]} */
    this.bullets = [];
    /** @type {import('./entities/enemy.js').default[]} */
    this.enemies = [];
    /** @type {import('./entities/pickup.js').default[]} */
    this.pickups = [];
    /** @type {import('./entities/gate.js').default[]} */
    this.gates   = [];
    /** @type {import('./entities/spikes.js').default[]} */
    this.spikes  = [];
    
    // --- game flags ---
    this.levelWon  = false;
    this.levelLost = false;

    // --- screen shake ---
    this.shakeTimer = 0;
    this.shakeX     = 0;
    this.shakeY     = 0;

    // --- victory animation ---
    this.victoryTimer    = 0;
    this.VICTORY_DURATION = 40;

    // --- playtest support ---
    this._playtestKey = "recoil_playtest";
    this._isPlaytest  = new URLSearchParams(window.location.search).has("playtest");

    // --- wire up input callbacks ---
    this.input.onRestart(() => this._restartLevel());
    this.input.onClick(() => this._handleClick());
  }

  // ==========================================================
  //  Initialization
  // ==========================================================

  async init() {
    await this.levels.loadAll();

    // playtest mode: inject editor level and skip title
    if (this._isPlaytest) {
      try {
        const raw = localStorage.getItem(this._playtestKey);
        if (raw) {
          const def = JSON.parse(raw);
          const idx = this.levels.inject(def);
          this.state = "play";
          this._startLevel(idx);
        }
      } catch (e) {
        console.error("Failed to load playtest level:", e);
      }
    }

    this._loop();
  }

  // ==========================================================
  //  Level management
  // ==========================================================

  _startLevel(index) {
    this.currentLevel = index;
    this.levels.loadLevel(this, index);
    this.levelWon    = false;
    this.levelLost   = false;
    this.shakeTimer  = 0;
    this.victoryTimer = 0;
  }

  _restartLevel() {
    if (this.state === "play") this._startLevel(this.currentLevel);
  }

  // ==========================================================
  //  Input callbacks
  // ==========================================================

  _handleClick() {
    if (this.state === "title") {
      this.state = "play";
      this._startLevel(0);
      return;
    }

    if (this.state === "win") {
      if (this._isPlaytest) {
        localStorage.removeItem(this._playtestKey);
        window.close();
        return;
      }
      this.state = "title";
      return;
    }

    if (this.levelLost) {
      this._restartLevel();
      return;
    }

    if (this.levelWon && this.victoryTimer >= this.VICTORY_DURATION) {
      if (this._isPlaytest) {
        localStorage.removeItem(this._playtestKey);
        window.close();
        return;
      }
      this.currentLevel++;
      if (this.currentLevel >= this.levels.count) {
        this.state = "win";
      } else {
        this._startLevel(this.currentLevel);
      }
    }
  }

  // ==========================================================
  //  Entity helpers
  // ==========================================================

  /** Spawn a new player bullet into the world. */
  addBullet(x, y, vx, vy) {
    this.bullets.push(new Bullet(this, x, y, vx, vy));
  }

  /** Spawn an enemy bullet (does not hit enemies, hurts player). */
  addEnemyBullet(x, y, vx, vy) {
    const b = new Bullet(this, x, y, vx, vy);
    b.fromPlayer = false;
    b.life = Infinity;    // only dies on wall hit or screen edge
    b.bounces = 999;      // enemy bullets don't bounce — shatter on wall
    this.bullets.push(b);
  }

  /** Called when a bullet kills an enemy. */
  onEnemyKilled(enemy) {
    this.shakeTimer = 5;
    this.sfx.kill();
    this._notifyGateKill(1);
  }

  /** Call this to kill player.  */
  killPlayer() {
    this.particles.spawn(this.player.x + 4, this.player.y + 4, 15, 3);
    this.player.dead = true;
    this.levelLost = true;
    this.shakeTimer = 8;
    this.sfx.death();
  }

  /** Notify all gates that enemies were killed. */
  _notifyGateKill(count) {
    for (const gate of this.gates) {
      gate.onKill(count);
    }
  }

  // ==========================================================
  //  Update
  // ==========================================================

  update() {
    if (this.state !== "play") {
      this.input.resetFrame();
      return;
    }

    if (this.levelLost) {
      this.particles.update();
      this.input.resetFrame();
      return;
    }

    // victory celebration
    if (this.levelWon) {
      this.victoryTimer++;
      if (this.player && this.victoryTimer % 4 === 0) {
        this.particles.spawn(this.player.x + 4, this.player.y - 2, 3, 2);
      }
      this.particles.update();
      this.input.resetFrame();
      return;
    }

    if (!this.player) { this.input.resetFrame(); return; }

    // update gates — collect solid tiles and revealed flags
    const gateTiles = [];
    const gateFlags = [];
    for (const g of this.gates) {
      g.update();
      const solid = g.getSolidRect();
      if (solid) gateTiles.push(solid);
      const fl = g.getFlagRect();
      if (fl) gateFlags.push(fl);
    }
    const allTiles = this.tiles.concat(gateTiles);

    // player
    this.player.update(allTiles);
    if (this.player.shotFired) { this.shakeTimer = 4; this.sfx.shoot(); }
    if (this.player.dryFired)  this.sfx.dryFire();

    // bullets
    let killedCount = 0;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const result = this.bullets[i].update(allTiles, this.enemies, this.player);
      if (result === "hitPlayer") {
        // enemy bullet hit the player
        this.player.dead = true;
        this.levelLost = true;
        this.shakeTimer = 8;
        this.sfx.death();
      } else if (result) {
        // killed an enemy
        killedCount++;
        this.onEnemyKilled(result);
      }
      if (!this.bullets[i].alive) this.bullets.splice(i, 1);
    }

    // spikes
    for (const s of this.spikes) s.update(this.player);

    // enemies
    for (const e of this.enemies) {
      if (e.update(allTiles, this.player)) {
        this.player.dead = true;
        this.levelLost = true;
        this.shakeTimer = 8;
        this.sfx.death();
      }
    }

    // pickups
    for (const p of this.pickups) {
      const collected = p.checkCollection(this.player);
      if (collected > 0) {
        this.player.addAmmo(collected);
        this.sfx.pickup();
      }
    }

    // flag check
    if (this.flag && !this.player.dead && aabb(this.player, this.flag)) {
      this._triggerVictory();
    }

    // gate flags check
    if (!this.levelWon && !this.player.dead) {
      for (const gf of gateFlags) {
        if (aabb(this.player, gf)) {
          this._triggerVictory();
          break;
        }
      }
    }

    // death from falling
    if (this.player.dead && !this.levelLost) {
      this.levelLost = true;
      this.sfx.death();
    }

    // particles + shake
    this.particles.update();
    this._updateShake();
    this.input.resetFrame();
  }

  _triggerVictory() {
    this.levelWon     = true;
    this.victoryTimer = 0;
    this.shakeTimer   = 0;
    this.sfx.victory();
    this.particles.spawn(this.player.x + 4, this.player.y + 4, 20, 3);
  }

  _updateShake() {
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      this.shakeX = ((Math.random() - 0.5) * 3) | 0;
      this.shakeY = ((Math.random() - 0.5) * 3) | 0;
    } else {
      this.shakeX = this.shakeY = 0;
    }
  }

  // ==========================================================
  //  Draw
  // ==========================================================

  draw() {
    const c = ctx;

    // HUD bar (below game area, outside shake)
    if (this.state === "play") {
      this.renderer.drawHUDBar(this);
    }

    // title & win screens draw full canvas (including HUD area), no clip needed
    if (this.state === "title") {
      this.renderer.drawTitleScreen();
      return;
    }
    if (this.state === "win") {
      this.renderer.drawWinScreen();
      return;
    }

    // clip to game viewport so shake doesn't bleed into HUD
    c.save();
    c.beginPath();
    c.rect(0, 0, NATIVE_W, NATIVE_H);
    c.clip();
    c.translate(this.shakeX, this.shakeY);

    this.renderer.drawGameScene(this);

    c.restore();
  }

  // ==========================================================
  //  Game loop
  // ==========================================================

  _loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this._loop());
  }
}
