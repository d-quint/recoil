// ============================================================
//  InputManager — keyboard + mouse state (class-based)
// ============================================================

import { SCALE } from "../constants.js";
import { canvas } from "./canvas.js";

export default class InputManager {
  constructor() {
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.mouseJustPressed = false;

    this._onRestartCb = null;
    this._onClickCb = null;

    this._bindEvents();
  }

  /** Reset one-shot flags. Call once per frame after processing input. */
  resetFrame() {
    this.mouseJustPressed = false;
  }

  /** Register a callback for the restart key (R). */
  onRestart(cb) { this._onRestartCb = cb; }

  /** Register a callback for canvas clicks (menus). */
  onClick(cb) { this._onClickCb = cb; }

  // ---- internal ----

  _bindEvents() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "KeyR" && this._onRestartCb) this._onRestartCb();
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) / SCALE;
      this.mouseY = (e.clientY - r.top) / SCALE;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.mouseJustPressed = true;
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    canvas.addEventListener("click", () => {
      if (this._onClickCb) this._onClickCb();
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
