// ============================================================
//  Level Editor — grid painting, save/load, playtest
// ============================================================

import { TILE, NATIVE_W, NATIVE_H, SCALE, FG, BG } from "../constants.js";

// ---- constants ----
const COLS = NATIVE_W / TILE;  // 40
const ROWS = 22;
const EDITOR_SCALE = 3;        // editor grid pixel scale
const CELL = TILE * EDITOR_SCALE;  // px per cell on-screen

const STORAGE_KEY = "recoil_editor_levels";

// ---- DOM refs ----
const editorCanvas  = document.getElementById("editor-canvas");
const ectx          = editorCanvas.getContext("2d");
const coordsEl      = document.getElementById("coords");
const levelNameEl   = document.getElementById("level-name");
const ammoCountEl   = document.getElementById("ammo-count");
const levelListEl   = document.getElementById("level-list");
const toastEl       = document.getElementById("toast");
const fileInput     = document.getElementById("file-input");

editorCanvas.width  = COLS * CELL;
editorCanvas.height = ROWS * CELL;
ectx.imageSmoothingEnabled = false;

const PLAYTEST_KEY = "recoil_playtest";

// ---- editor state ----
let currentTool  = "tile";
let painting     = false;
let erasing      = false;  // right-click erase

// grid: 2D array [row][col] of chars: '.', '1', 'P', 'F', 'E', 'A', 'G', 'T'
let grid = [];
let texts = {};         // key: "row,col" → content string
let savedLevels = [];   // array of { name, ammo, map, texts }
let activeLevelIndex = -1; // -1 = new unsaved

// ---- init grid ----
function createEmptyGrid() {
  grid = [];
  texts = {};
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array(COLS).fill("."));
  }
}

function gridToMap() {
  return grid.map((row) => row.join(""));
}

function mapToGrid(map) {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    const line = map[r] || "";
    for (let c = 0; c < COLS; c++) {
      row.push(line[c] || ".");
    }
    grid.push(row);
  }
}

function getLevelDef() {
  // build texts array from the texts map
  const textsArr = [];
  for (const key in texts) {
    const [r, c] = key.split(",").map(Number);
    textsArr.push({ row: r, col: c, content: texts[key] });
  }
  return {
    name: levelNameEl.value || "Untitled",
    ammo: parseInt(ammoCountEl.value) || 5,
    map: gridToMap(),
    texts: textsArr,
  };
}

function setLevelDef(def) {
  levelNameEl.value = def.name || "Untitled";
  ammoCountEl.value = def.ammo || 5;
  mapToGrid(def.map || []);
  // rebuild texts map
  texts = {};
  if (def.texts) {
    for (const t of def.texts) {
      texts[t.row + "," + t.col] = t.content;
    }
  }
}

// ---- storage ----
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    savedLevels = raw ? JSON.parse(raw) : [];
  } catch {
    savedLevels = [];
  }
}

function saveStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLevels));
}

// ---- toast ----
let toastTimeout;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

// ---- tool selection ----
document.querySelectorAll(".tool-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelector(".tool-btn.active")?.classList.remove("active");
    btn.classList.add("active");
    currentTool = btn.dataset.tool;
  });
});

// ---- grid rendering ----
const ENTITY_COLORS = {
  P: "#00cc66",
  F: "#ffcc00",
  E: "#ff4444",
  A: "#44aaff",
  G: "#aa44ff",
  T: "#88ccaa",
};

function drawEditor() {
  ectx.fillStyle = "#111";
  ectx.fillRect(0, 0, editorCanvas.width, editorCanvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      const x = c * CELL;
      const y = r * CELL;

      if (ch === "1") {
        ectx.fillStyle = "#fff";
        ectx.fillRect(x, y, CELL, CELL);
        // dither edge like the game
        ectx.fillStyle = "#111";
        ectx.fillRect(x + CELL - EDITOR_SCALE, y, EDITOR_SCALE, CELL);
        ectx.fillRect(x, y + CELL - EDITOR_SCALE, CELL, EDITOR_SCALE);
      } else if (ch === "T") {
        ectx.fillStyle = ENTITY_COLORS.T;
        ectx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        // show text content preview
        const key = r + "," + c;
        const content = texts[key] || "";
        ectx.fillStyle = "#fff";
        ectx.font = `${CELL * 0.35}px monospace`;
        ectx.textAlign = "center";
        ectx.textBaseline = "middle";
        const preview = content.length > 5 ? content.slice(0, 5) + ".." : content;
        ectx.fillText(preview || "T", x + CELL / 2, y + CELL / 2);
      } else if (ENTITY_COLORS[ch]) {
        ectx.fillStyle = ENTITY_COLORS[ch];
        ectx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        // label
        ectx.fillStyle = "#fff";
        ectx.font = `${CELL * 0.6}px monospace`;
        ectx.textAlign = "center";
        ectx.textBaseline = "middle";
        ectx.fillText(ch, x + CELL / 2, y + CELL / 2);
      }
    }
  }

  // grid lines
  ectx.strokeStyle = "rgba(255,255,255,0.07)";
  ectx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    ectx.beginPath();
    ectx.moveTo(0, r * CELL + 0.5);
    ectx.lineTo(editorCanvas.width, r * CELL + 0.5);
    ectx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ectx.beginPath();
    ectx.moveTo(c * CELL + 0.5, 0);
    ectx.lineTo(c * CELL + 0.5, editorCanvas.height);
    ectx.stroke();
  }
}

// ---- grid interaction ----
function getCellFromEvent(e) {
  const rect = editorCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / CELL);
  const row = Math.floor(y / CELL);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { row, col };
}

function placeTool(row, col) {
  const ch = grid[row][col];

  switch (currentTool) {
    case "tile":
      grid[row][col] = "1";
      break;
    case "erase":
      grid[row][col] = ".";
      break;
    case "player":
      // only one allowed — clear previous
      clearAllOf("P");
      grid[row][col] = "P";
      break;
    case "flag":
      clearAllOf("F");
      grid[row][col] = "F";
      break;
    case "enemy":
      grid[row][col] = "E";
      break;
    case "ammo":
      grid[row][col] = "A";
      break;
    case "gate":
      grid[row][col] = "G";
      break;
    case "text": {
      const content = prompt("Enter tutorial text:");
      if (content == null || content.trim() === "") return; // cancelled
      grid[row][col] = "T";
      texts[row + "," + col] = content.trim();
      break;
    }
  }
}

function clearAllOf(ch) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c] === ch) {
        grid[r][c] = ".";
        if (ch === "T") delete texts[r + "," + c];
      }
}

editorCanvas.addEventListener("mousedown", (e) => {
  e.preventDefault();
  if (e.button === 2) {
    erasing = true;
  } else if (e.button === 0) {
    // text tool uses single-click only (prompt), no drag-painting
    if (currentTool !== "text") painting = true;
  }
  const cell = getCellFromEvent(e);
  if (cell) {
    if (erasing) {
      // clean up text content if erasing a T cell
      if (grid[cell.row][cell.col] === "T") delete texts[cell.row + "," + cell.col];
      grid[cell.row][cell.col] = ".";
    } else {
      placeTool(cell.row, cell.col);
    }
    drawEditor();
  }
});

editorCanvas.addEventListener("mousemove", (e) => {
  const cell = getCellFromEvent(e);
  if (cell) {
    coordsEl.textContent = `${cell.col}:${cell.row}`;
    if (painting && currentTool !== "text") {
      placeTool(cell.row, cell.col);
      drawEditor();
    } else if (erasing) {
      if (grid[cell.row][cell.col] === "T") delete texts[cell.row + "," + cell.col];
      grid[cell.row][cell.col] = ".";
      drawEditor();
    }
  } else {
    coordsEl.textContent = "--:--";
  }
});

window.addEventListener("mouseup", () => {
  painting = false;
  erasing = false;
});

editorCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

// ---- level list ----
function refreshLevelList() {
  levelListEl.innerHTML = "";
  savedLevels.forEach((lvl, i) => {
    const el = document.createElement("div");
    el.className = "level-item" + (i === activeLevelIndex ? " active" : "");
    el.innerHTML = `<span>${lvl.name || "Untitled"}</span><button class="del-btn" data-i="${i}">✕</button>`;
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("del-btn")) return;
      activeLevelIndex = i;
      setLevelDef(savedLevels[i]);
      refreshLevelList();
      drawEditor();
      toast("Loaded: " + (savedLevels[i].name || "Untitled"));
    });
    el.querySelector(".del-btn").addEventListener("click", () => {
      if (!confirm("Delete \"" + (savedLevels[i].name || "Untitled") + "\"?")) return;
      savedLevels.splice(i, 1);
      saveStorage();
      if (activeLevelIndex === i) activeLevelIndex = -1;
      else if (activeLevelIndex > i) activeLevelIndex--;
      refreshLevelList();
      toast("Deleted");
    });
    levelListEl.appendChild(el);
  });
}

// ---- action buttons ----

// Save
document.getElementById("btn-save").addEventListener("click", () => {
  const def = getLevelDef();
  if (activeLevelIndex >= 0) {
    savedLevels[activeLevelIndex] = def;
  } else {
    savedLevels.push(def);
    activeLevelIndex = savedLevels.length - 1;
  }
  saveStorage();
  refreshLevelList();
  toast("Saved!");
});

// New
document.getElementById("btn-new").addEventListener("click", () => {
  activeLevelIndex = -1;
  levelNameEl.value = "Untitled";
  ammoCountEl.value = 5;
  createEmptyGrid();
  refreshLevelList();
  drawEditor();
  toast("New level");
});

// Clear
document.getElementById("btn-clear").addEventListener("click", () => {
  if (!confirm("Clear the entire grid?")) return;
  createEmptyGrid();
  drawEditor();
  toast("Cleared");
});

// Export
document.getElementById("btn-export").addEventListener("click", () => {
  const def = getLevelDef();
  const blob = new Blob([JSON.stringify(def, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (def.name || "level").replace(/\s+/g, "_").toLowerCase() + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Exported!");
});

// Copy JSON
document.getElementById("btn-copy").addEventListener("click", () => {
  const def = getLevelDef();
  const json = JSON.stringify(def, null, 2);
  navigator.clipboard.writeText(json).then(
    () => toast("Copied to clipboard!"),
    () => toast("Copy failed")
  );
});

// Import
document.getElementById("btn-import").addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const def = JSON.parse(reader.result);
      if (!def.map || !Array.isArray(def.map)) throw new Error("Invalid level JSON");
      setLevelDef(def);
      activeLevelIndex = -1;
      refreshLevelList();
      drawEditor();
      toast("Imported: " + (def.name || "Untitled"));
    } catch (err) {
      toast("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
  fileInput.value = "";
});

// ============================================================
//  PLAYTEST — opens the real game engine with the current level
// ============================================================

document.getElementById("btn-playtest").addEventListener("click", startPlaytest);

function startPlaytest() {
  const def = getLevelDef();
  if (!def.map.some((row) => row.includes("P"))) {
    toast("Place a Player spawn first!");
    return;
  }
  if (!def.map.some((row) => row.includes("F")) && !def.map.some((row) => row.includes("G"))) {
    toast("Place a Flag or Gate first!");
    return;
  }

  // store level for the game to pick up
  localStorage.setItem(PLAYTEST_KEY, JSON.stringify(def));
  // open game in playtest mode
  window.open("index.html?playtest", "_blank");
  toast("Playtest launched!");
}

// ---- keyboard shortcuts ----
window.addEventListener("keydown", (e) => {
  if (e.code === "Digit1") setToolByName("tile");
  if (e.code === "Digit2") setToolByName("erase");
  if (e.code === "Digit3") setToolByName("player");
  if (e.code === "Digit4") setToolByName("flag");
  if (e.code === "Digit5") setToolByName("enemy");
  if (e.code === "Digit6") setToolByName("ammo");
  if (e.code === "Digit7") setToolByName("gate");
  if (e.code === "Digit8") setToolByName("text");
});

function setToolByName(name) {
  currentTool = name;
  document.querySelector(".tool-btn.active")?.classList.remove("active");
  document.querySelector(`.tool-btn[data-tool="${name}"]`)?.classList.add("active");
}

// ---- bundled levels (loaded from manifest.json) ----
const LEVELS_BASE = new URL("../../levels/", import.meta.url).href;

async function loadBundledLevels() {
  try {
    const manifestRes = await fetch(LEVELS_BASE + "manifest.json");
    if (!manifestRes.ok) return;
    const manifest = await manifestRes.json();

    const fetched = await Promise.all(
      manifest.map((name) =>
        fetch(LEVELS_BASE + name).then((r) => {
          if (!r.ok) return null;
          return r.json();
        }).catch(() => null)
      )
    );
    // merge into savedLevels — skip duplicates by name
    const existingNames = new Set(savedLevels.map((l) => l.name));
    let added = 0;
    for (const def of fetched) {
      if (!def || !def.map) continue;
      if (!existingNames.has(def.name)) {
        savedLevels.push(def);
        existingNames.add(def.name);
        added++;
      }
    }
    if (added > 0) {
      saveStorage();
      refreshLevelList();
      toast("Loaded " + added + " bundled level" + (added > 1 ? "s" : ""));
    }
  } catch (e) {
    console.error("Failed to load bundled levels:", e);
  }
}

// ---- init ----
createEmptyGrid();
loadStorage();
refreshLevelList();
drawEditor();
loadBundledLevels();
