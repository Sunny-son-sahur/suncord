// SUNCORD Patcher — Vencord-style injection
// This runs from the stub app.asar. require.main points to our stub.

const { app, BrowserWindow } = require("electron");
const { dirname, join } = require("path");
const fs = require("fs");
const Module = require("module");

const DIST = join(__dirname);
const RENDERER_PATH = join(DIST, "renderer.js");

// --- Step 1: Find original Discord asar ---
// require.main.filename = resources/app.asar/index.js
// dirname = resources/app.asar
// .. goes to resources/ where _app.asar lives
console.log("[Suncord] require.main.filename:", require.main.filename);
console.log("[Suncord] require.main.path:", require.main.path);
const injectorDir = dirname(require.main.filename);
const asarName = require.main.path.endsWith("app.asar") ? "_app.asar" : "app.asar";
const asarPath = join(injectorDir, "..", asarName);
console.log("[Suncord] Looking for original at:", asarPath);

if (!fs.existsSync(asarPath)) {
  console.error("[Suncord] Original asar not found:", asarPath);
  process.exit(1);
}

// --- Step 2: Point Node at the original Discord entry ---
const discordPkg = require(join(asarPath, "package.json"));
require.main.filename = join(asarPath, discordPkg.main);
require.main.paths = Module._nodeModulePaths(dirname(require.main.filename));

// Tell Electron this is the app path
app.setAppPath(asarPath);

// --- Step 3: Suncord data directory ---
const SUNCORD_DATA = join(app.getPath("userData"), "..", "SUNCORD");
for (const sub of ["plugins", "themes", "store"]) {
  const dir = join(SUNCORD_DATA, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Step 4: Hook BrowserWindow to inject our renderer ---
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

// --- Step 5: Load original Discord ---
console.log("[Suncord] Loading Discord from", asarPath);
require(require.main.filename);
