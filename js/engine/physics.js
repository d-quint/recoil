// ============================================================
//  Physics helpers — AABB and tile collision resolution
// ============================================================

/**
 * Axis-aligned bounding box overlap test.
 * Each object must have { x, y, w, h }.
 */
export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * Resolve an entity's overlap with an array of solid tiles
 * along a single axis. Call once after X movement with axis="x",
 * then again after Y movement with axis="y".
 *
 * @param {"x"|"y"} axis — which axis to resolve
 */
export function resolveTileCollisions(entity, tiles, axis) {
  for (const t of tiles) {
    if (!aabb(entity, t)) continue;

    if (axis === "x") {
      // determine push direction from center relationship
      const entityCenterX = entity.x + entity.w / 2;
      const tileCenterX   = t.x + t.w / 2;
      if (entityCenterX < tileCenterX) {
        // push left
        entity.x = t.x - entity.w;
      } else {
        // push right
        entity.x = t.x + t.w;
      }
      entity.vx = 0;
    } else {
      const entityCenterY = entity.y + entity.h / 2;
      const tileCenterY   = t.y + t.h / 2;
      if (entityCenterY < tileCenterY) {
        // push up (landing)
        entity.y = t.y - entity.h;
        entity.grounded = true;
      } else {
        // push down (hit ceiling)
        entity.y = t.y + t.h;
      }
      entity.vy = 0;
    }
  }
}
