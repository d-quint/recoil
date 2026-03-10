// ============================================================
//  Level registry — fetches JSON level files
// ============================================================

/** Manifest of bundled level file paths (order matters). */
const LEVEL_FILES = [
  "levels/level1.json",
  "levels/level2.json",
  "levels/level3.json",
  "levels/level4.json",
  "levels/level5.json",
];

let _levels = [];

/**
 * Fetch all bundled levels from JSON files.
 * Call once at startup before the game loop.
 */
export async function loadAllLevels() {
  _levels = await Promise.all(
    LEVEL_FILES.map((path) => fetch(path).then((r) => r.json()))
  );
}

/** Get the loaded levels array. */
export function getLevels() {
  return _levels;
}

/** Get total number of levels. */
export function getLevelCount() {
  return _levels.length;
}

/**
 * Inject a level object at runtime (used by the editor for playtesting).
 * Returns the index it was inserted at.
 */
export function injectLevel(levelDef) {
  _levels.push(levelDef);
  return _levels.length - 1;
}

/**
 * Remove the last injected level (cleanup after playtest). */
export function popLevel() {
  _levels.pop();
}
