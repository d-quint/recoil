// ============================================================
//  LevelManager — loads level JSON files and parses them
// ============================================================

import { TILE } from "../constants.js";
import Player       from "../entities/player.js";
import Enemy        from "../entities/enemy.js";
import ShooterEnemy from "../entities/shooterEnemy.js";
import Pickup       from "../entities/pickup.js";
import Gate         from "../entities/gate.js";
import Spikes       from "../entities/spikes.js";

/** Resolve paths relative to this module (js/levels/) → ../../levels/ */
const LEVELS_BASE = new URL("../../levels/", import.meta.url).href;

export default class LevelManager {
  constructor() {
    /** @type {object[]} Raw level definition objects. */
    this._levels = [];
  }

  /** Fetch manifest then load all bundled levels. Call once at startup. */
  async loadAll() {
    const manifest = await fetch(LEVELS_BASE + "manifest.json").then(r => r.json());
    this._levels = await Promise.all(
      manifest.map(name => fetch(LEVELS_BASE + name).then(r => r.json())),
    );
  }

  /** @returns {object[]} */
  get levels() { return this._levels; }

  /** @returns {number} */
  get count() { return this._levels.length; }

  /**
   * Inject a level at runtime (editor playtesting).
   * @returns {number} The index it was inserted at.
   */
  inject(levelDef) {
    this._levels.push(levelDef);
    return this._levels.length - 1;
  }

  /** Remove the last injected level. */
  pop() { this._levels.pop(); }

  // ---------- level parsing ----------

  /**
   * Parse a level definition and populate the Game's entity arrays.
   * @param {import('../game.js').default} game
   * @param {number} index — level index to load
   */
  loadLevel(game, index) {
    const def = this._levels[index];
    const { ammo, map } = def;

    // build text lookup
    const textMap = {};
    if (def.texts) {
      for (const t of def.texts) {
        textMap[t.row + "," + t.col] = t.content;
      }
    }

    // reset game entity arrays
    game.tiles      = [];
    game.textLabels = [];
    game.flag       = null;
    game.bullets.length  = 0;
    game.spikes.length = 0;
    game.enemies.length  = 0;
    game.pickups.length  = 0;
    game.gates.length    = 0;
    game.particles.clear();

    // count enemies so gates know their kill requirement
    let enemyCount = 0;
    for (let r = 0; r < map.length; r++)
      for (let c = 0; c < map[r].length; c++)
        if (map[r][c] === "E" || map[r][c] === "S") enemyCount++;

    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const ch = map[r][c];
        const x  = c * TILE;
        const y  = r * TILE;

        switch (ch) {
          case "1":
            game.tiles.push({ x, y, w: TILE, h: TILE });
            break;
          case "P":
            game.player = new Player(game, x, y, ammo);
            break;
          case "F":
            game.flag = { x, y, w: 8, h: 8 };
            break;
          case "E":
            game.enemies.push(new Enemy(game, x, y));
            break;
          case "S":
            game.enemies.push(new ShooterEnemy(game, x, y));
            break;
          case "A":
            game.pickups.push(new Pickup(game, x, y));
            break;
          case "G":
            game.gates.push(new Gate(game, x, y, enemyCount));
            break;
          case "T": {
            const content = textMap[r + "," + c] || "";
            if (content) game.textLabels.push({ x, y, content });
            break;
          }
          case "X":
            game.spikes.push(new Spikes(game, x, y));
            break;
        }
      }
    }
  }
}
