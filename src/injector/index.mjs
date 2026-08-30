// SUNCORD Injector — hooks into Discord's Electron main process
// Minimal: just inject renderer.js into every window, nothing else

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const DIST = path.join(__dirname);
const RENDERER_PATH = path.join(DIST, "renderer.js");

function injectRenderer(win) {
  win.webContents.on("did-finish-load", () => {
    try {
      if (fs.existsSync(RENDERER_PATH)) {
        const code = fs.readFileSync(RENDERER_PATH, "utf-8");
        win.webContents.executeJavaScript(code).catch(() => {});
      }
    } catch (e) {
      console.error("[Suncord] Failed to inject:", e.message);
    }
  });
}

// Hook every new window
app.on("browser-window-created", (_, win) => {
  injectRenderer(win);
});

// Also patch already-created windows (in case we load after ready)
app.on("ready", () => {
  setTimeout(() => {
    BrowserWindow.getAllWindows().forEach(injectRenderer);
  }, 1000);
});

console.log("[SUNCORD] Injector loaded");
