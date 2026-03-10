// ============================================================
//  Entity — base class for all game entities
// ============================================================

export default class Entity {
  /**
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} w - Width
   * @param {number} h - Height
   */
  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
  }

  /** update and draw functions (mandatory) */
  update() {}
  draw() {}

  /** Center X coordinate. */
  get cx() { return this.x + this.w / 2; }

  /** Center Y coordinate. */
  get cy() { return this.y + this.h / 2; }
}
