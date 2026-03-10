// ============================================================
//  Canvas setup — creates and configures the game canvas
// ============================================================

import { NATIVE_W, NATIVE_H, SCALE, HUD_H } from "../constants.js";

const canvas = document.getElementById("game");
canvas.width  = NATIVE_W;
canvas.height = NATIVE_H + HUD_H;
canvas.style.width  = NATIVE_W * SCALE + "px";
canvas.style.height = (NATIVE_H + HUD_H) * SCALE + "px";

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

export { canvas, ctx };
