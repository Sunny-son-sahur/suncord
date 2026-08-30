// SUNCORD Injector — hooks into Discord's Electron main process
// This patches the app to load our renderer script

const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const fs = require("fs");

const DIST = path.join(__dirname);
const RENDERER_PATH = path.join(DIST, "renderer.js");
const PRELOAD_PATH = path.join(DIST, "preload.cjs");

// The SUNCORD data directory
const SUNCORD_DATA = path.join(
  app.getPath("userData"),
  "..",
  "SUNCORD"
);

// Ensure data dirs exist
function ensureDirs() {
  const dirs = [
    SUNCORD_DATA,
    path.join(SUNCORD_DATA, "plugins"),
    path.join(SUNCORD_DATA, "themes"),
    path.join(SUNCORD_DATA, "store"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

// Inject renderer.js into every Discord window
function setupWindow(win) {
  win.webContents.on("did-finish-load", () => {
    if (fs.existsSync(RENDERER_PATH)) {
      const code = fs.readFileSync(RENDERER_PATH, "utf-8");
      win.webContents.executeJavaScript(code).catch(() => {});
    }
  });
}

// Patch the default session to serve our preload
function patchSession() {
  const ses = session.defaultSession;
  const existingPreload = ses.webRequest.onBeforeRequest;

  // Intercept and modify if needed
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({});
  });
}

// Main hook — runs before Discord's own code
const originalReady = app.whenReady;

app.whenReady = function () {
  ensureDirs();
  patchSession();

  // Hook into window creation
  const originalOn = app.on.bind(app);
  app.on = function (event, handler) {
    if (event === "ready") {
      return originalReady.call(app).then(() => {
        // After Discord is ready, patch existing windows
        BrowserWindow.getAllWindows().forEach(setupWindow);

        // Patch future windows
        const origCreate = BrowserWindow;
        // We'll use webContents events instead
      });
    }
    return originalOn(event, handler);
  };

  return originalReady.call(app);
};

// Direct patch: intercept Discord's preload and renderer loading
app.on("browser-window-created", (_, win) => {
  setupWindow(win);
});

// Also handle the main window specifically
app.on("ready", () => {
  ensureDirs();

  // Small delay to let Discord create its window
  setTimeout(() => {
    BrowserWindow.getAllWindows().forEach(setupWindow);
  }, 1000);
});

console.log("[SUNCORD] Injector loaded — waiting for Discord...");
