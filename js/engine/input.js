// ============================================================
//  Input manager — keyboard + mouse state
// ============================================================

import { SCALE } from "../constants.js";
import { canvas } from "./canvas.js";

export const keys = {};
export let mouseX = 0;
export let mouseY = 0;
export let mouseDown = false;
export let mouseJustPressed = false;

/** Call once per frame after processing input to reset one-shot flags. */
export function resetFrameInput() {
  mouseJustPressed = false;
}

/** Registers a callback that fires when R is pressed (for restart). */
let onRestartCallback = null;
export function onRestart(cb) {
  onRestartCallback = cb;
}

/** Registers a callback that fires on any canvas click (for menus). */
let onClickCallback = null;
export function onClick(cb) {
  onClickCallback = cb;
}

// --- listeners ---

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyR" && onRestartCallback) onRestartCallback();
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) / SCALE;
  mouseY = (e.clientY - r.top)  / SCALE;
});

canvas.addEventListener("mousedown", (e) => {
  if (e.button === 0) {
    mouseDown = true;
    mouseJustPressed = true;
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (e.button === 0) mouseDown = false;
});

canvas.addEventListener("click", () => {
  if (onClickCallback) onClickCallback();
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// We need to export mutable values via getters since ES module exports are live bindings
// But primitives are bound by value — so we use an object instead:
// Actually, `export let` bindings ARE live in ES modules. However the reassignment
// must happen in this module. So we keep the event handlers here.
