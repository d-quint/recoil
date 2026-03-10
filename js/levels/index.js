// ============================================================
//  Level registry — fetches JSON level files
// ============================================================

/** Resolve paths relative to this module (js/levels/) → ../../levels/ */
const LEVELS_BASE = new URL("../../levels/", import.meta.url).href;

let _levels = [];

/**
 * Fetch manifest then load all bundled levels from JSON files.
 * Call once at startup before the game loop.
 */
export async function loadAllLevels() {
  const manifest = await fetch(LEVELS_BASE + "manifest.json").then((r) => r.json());
  _levels = await Promise.all(
    manifest.map((name) => fetch(LEVELS_BASE + name).then((r) => r.json()))
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
