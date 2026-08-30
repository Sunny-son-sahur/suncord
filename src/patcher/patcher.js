// SUNCORD Patcher — Vencord-style injection
// Replaces the stub app.asar, loads original Discord, injects our renderer

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const DIST = path.join(__dirname);
const RENDERER_PATH = path.join(DIST, "renderer.js");
const ORIGINAL_ASAR = path.join(
  path.dirname(require.main.filename),
  "_app.asar"
);

// Where Suncord stores its data
const SUNCORD_DATA = path.join(app.getPath("userData"), "..", "SUNCORD");

// Ensure Suncord directories exist
function ensureDirs() {
  for (const sub of ["plugins", "themes", "store"]) {
    const dir = path.join(SUNCORD_DATA, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

// Inject renderer.js into a window
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

// --- MAIN ---
// Set up so Discord loads from the original _app.asar
if (fs.existsSync(ORIGINAL_ASAR)) {
  require.main.filename = ORIGINAL_ASAR;
  require.main.paths = require("module")._nodeModulePaths(path.dirname(ORIGINAL_ASAR));
}

ensureDirs();

// Hook window creation
app.on("browser-window-created", (_, win) => injectRenderer(win));

// Hook already-created windows
app.on("ready", () => {
  setTimeout(() => {
    BrowserWindow.getAllWindows().forEach(injectRenderer);
  }, 1000);
});

console.log("[SUNCORD] Patcher loaded");
