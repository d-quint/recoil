// ============================================================
//  Level loader — parses a level definition into game objects
// ============================================================

import { TILE } from "../constants.js";
import { createPlayer } from "../entities/player.js";
import { clearBullets } from "../entities/bullet.js";
import { clearEnemies, addEnemy } from "../entities/enemy.js";
import { clearPickups, addPickup } from "../entities/pickup.js";
import { clearGates, addGate } from "../entities/gate.js";
import { clearParticles } from "../engine/particles.js";

/**
 * Parse a level definition and populate all entity pools.
 * Returns { tiles, flag, textLabels } for the loaded level.
 */
export function loadLevel(levelDef) {
  const { ammo, map } = levelDef;
  const tiles = [];
  const textLabels = [];
  let flag = null;

  // build a lookup for text content by "row,col"
  const textMap = {};
  if (levelDef.texts) {
    for (const t of levelDef.texts) {
      textMap[t.row + "," + t.col] = t.content;
    }
  }

  // reset pools
  clearBullets();
  clearEnemies();
  clearPickups();
  clearGates();
  clearParticles();

  // first pass: count enemies so gates know their kill requirement
  let enemyCount = 0;
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === "E") enemyCount++;
    }
  }

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      const ch = map[r][c];
      const x = c * TILE;
      const y = r * TILE;

      switch (ch) {
        case "1":
          tiles.push({ x, y, w: TILE, h: TILE });
          break;
        case "P":
          createPlayer(x, y, ammo);
          break;
        case "F":
          flag = { x, y, w: 8, h: 8 };
          break;
        case "E":
          addEnemy(x, y);
          break;
        case "A":
          addPickup(x, y);
          break;
        case "G":
          addGate(x, y, enemyCount);
          break;
        case "T": {
          const content = textMap[r + "," + c] || "";
          if (content) textLabels.push({ x, y, content });
          break;
        }
      }
    }
  }

  return { tiles, flag, textLabels };
}
