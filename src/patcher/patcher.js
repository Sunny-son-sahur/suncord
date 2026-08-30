// SUNCORD Patcher — Vencord-style injection
// Runs from stub app.asar. require.main points to stub's index.js.

const { app, BrowserWindow } = require("electron");
const { dirname, join } = require("path");
const fs = require("fs");
const Module = require("module");

// --- Step 0: Suppress EPIPE errors (Linux desktop shortcut kills stdout pipe) ---
const origConsoleInfo = console.info;
const origConsoleLog = console.log;
const origConsoleWarn = console.warn;
const origConsoleError = console.error;

function suppressEpipe(fn) {
  return function (...args) {
    try { fn.apply(this, args); } catch (e) { if (e.code !== "EPIPE") throw e; }
  };
}
console.info = suppressEpipe(origConsoleInfo);
console.log = suppressEpipe(origConsoleLog);
console.warn = suppressEpipe(origConsoleWarn);
console.error = suppressEpipe(origConsoleError);

process.on("uncaughtException", (err) => {
  if (err.code === "EPIPE") return;
  console.error("[Suncord] Uncaught:", err.message);
});

// --- Step 1: Find the stub app.asar directory ---
// require.main.filename = .../resources/app.asar/index.js
// We need to find _app.asar in .../resources/
const stubDir = dirname(require.main.filename); // .../resources/app.asar
const resourcesDir = join(stubDir, "..");       // .../resources/

// --- Step 2: Find original Discord asar ---
const asarName = require.main.path.endsWith("app.asar") ? "_app.asar" : "app.asar";
const asarPath = join(resourcesDir, asarName);

if (!fs.existsSync(asarPath)) {
  console.error("[Suncord] Original Discord asar not found:", asarPath);
  process.exit(1);
}

// --- Step 3: Point Node at the original Discord entry ---
const discordPkg = require(join(asarPath, "package.json"));
require.main.filename = join(asarPath, discordPkg.main);
require.main.paths = Module._nodeModulePaths(dirname(require.main.filename));
app.setAppPath(asarPath);

// --- Step 4: Find renderer.js — check dist dir first, then INSTALL_DIR ---
const DIST = join(__dirname);
let RENDERER_PATH = join(DIST, "renderer.js");

// If renderer.js isn't next to patcher, check the resources dir
if (!fs.existsSync(RENDERER_PATH)) {
  const altPath = join(resourcesDir, "suncord", "renderer.js");
  if (fs.existsSync(altPath)) {
    RENDERER_PATH = altPath;
  }
}

// --- Step 5: Suncord data directory ---
const SUNCORD_DATA = join(app.getPath("userData"), "..", "SUNCORD");
for (const sub of ["plugins", "themes", "store"]) {
  const dir = join(SUNCORD_DATA, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Step 6: Hook window creation ---
function injectRenderer(win) {
  win.webContents.on("did-finish-load", () => {
    try {
      if (fs.existsSync(RENDERER_PATH)) {
        const code = fs.readFileSync(RENDERER_PATH, "utf-8");
        win.webContents.executeJavaScript(code).catch(() => {});
      }
    } catch (e) {
      console.error("[Suncord] Injection failed:", e.message);
    }
  });
}

app.on("browser-window-created", (_, win) => injectRenderer(win));

// --- Step 7: Load original Discord ---
console.log("[Suncord] Loading Discord from", asarPath);
require(require.main.filename);
