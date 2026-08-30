"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../../../node_modules/electron/index.js
var require_electron = __commonJS({
  "../../../node_modules/electron/index.js"(exports2, module2) {
    var { spawnSync } = require("child_process");
    var fs2 = require("fs");
    var path2 = require("path");
    var pathFile = path2.join(__dirname, "path.txt");
    function downloadElectron() {
      console.log("Downloading Electron binary...");
      const result = spawnSync(process.execPath, [path2.join(__dirname, "install.js")], {
        stdio: "inherit"
      });
      if (result.status !== 0) {
        throw new Error(
          'Electron failed to install correctly. Please delete `node_modules/electron` and run "npx install-electron --no" manually.'
        );
      }
    }
    function getElectronPath() {
      let executablePath;
      if (fs2.existsSync(pathFile)) {
        executablePath = fs2.readFileSync(pathFile, "utf-8");
      }
      if (process.env.ELECTRON_OVERRIDE_DIST_PATH) {
        return path2.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath || "electron");
      }
      if (executablePath) {
        const fullPath = path2.join(__dirname, "dist", executablePath);
        if (!fs2.existsSync(fullPath)) {
          downloadElectron();
        }
        return fullPath;
      } else {
        try {
          downloadElectron();
        } catch {
          throw new Error(
            'Electron failed to install correctly. Please delete `node_modules/electron` and run "npx install-electron --no" manually.'
          );
        }
        executablePath = fs2.readFileSync(pathFile, "utf-8");
        return path2.join(__dirname, "dist", executablePath);
      }
    }
    module2.exports = getElectronPath();
  }
});

// src/injector/index.mjs
var { app, BrowserWindow, session } = require_electron();
var path = require("path");
var fs = require("fs");
var DIST = path.join(__dirname);
var RENDERER_PATH = path.join(DIST, "renderer.js");
var PRELOAD_PATH = path.join(DIST, "preload.cjs");
var SUNCORD_DATA = path.join(
  app.getPath("userData"),
  "..",
  "SUNCORD"
);
function ensureDirs() {
  const dirs = [
    SUNCORD_DATA,
    path.join(SUNCORD_DATA, "plugins"),
    path.join(SUNCORD_DATA, "themes"),
    path.join(SUNCORD_DATA, "store")
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir, { recursive: true });
  }
}
function setupWindow(win) {
  win.webContents.on("did-finish-load", () => {
    if (fs.existsSync(RENDERER_PATH)) {
      const code = fs.readFileSync(RENDERER_PATH, "utf-8");
      win.webContents.executeJavaScript(code).catch(() => {
      });
    }
  });
}
function patchSession() {
  const ses = session.defaultSession;
  const existingPreload = ses.webRequest.onBeforeRequest;
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({});
  });
}
var originalReady = app.whenReady;
app.whenReady = function() {
  ensureDirs();
  patchSession();
  const originalOn = app.on.bind(app);
  app.on = function(event, handler) {
    if (event === "ready") {
      return originalReady.call(app).then(() => {
        BrowserWindow.getAllWindows().forEach(setupWindow);
        const origCreate = BrowserWindow;
      });
    }
    return originalOn(event, handler);
  };
  return originalReady.call(app);
};
app.on("browser-window-created", (_, win) => {
  setupWindow(win);
});
app.on("ready", () => {
  ensureDirs();
  setTimeout(() => {
    BrowserWindow.getAllWindows().forEach(setupWindow);
  }, 1e3);
});
console.log("[SUNCORD] Injector loaded \u2014 waiting for Discord...");
