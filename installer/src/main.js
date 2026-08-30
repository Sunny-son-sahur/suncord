// Suncord Installer — Main Process
// Detects Discord installations and patches them

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 520,
    resizable: false,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.png"),
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => app.quit());

// ── Discord Detection ──

function getDiscordPaths() {
  const paths = [];
  const platform = process.platform;

  if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const appData = process.env.APPDATA || "";
    const programFiles = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const programFilesAlt = process.env["PROGRAMFILES"] || "C:\\Program Files";

    const candidates = [
      path.join(localAppData, "Discord"),
      path.join(appData, "Discord"),
      path.join(programFiles, "Discord"),
      path.join(programFilesAlt, "Discord"),
      path.join(localAppData, "DiscordPTB"),
      path.join(appData, "DiscordPTB"),
      path.join(localAppData, "DiscordCanary"),
      path.join(appData, "DiscordCanary"),
      path.join(localAppData, "DiscordDevelopment"),
      // Check if discord_desktop_core exists directly in app/ (no version dir)
      path.join(localAppData, "Discord", "app"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        // If path points directly to app/ dir (no version subdir)
        if (p.endsWith(path.join("Discord", "app"))) {
          const coreIndex = path.join(p, "discord_desktop_core", "index.js");
          if (fs.existsSync(coreIndex)) {
            const name = p.includes("PTB") ? "Discord PTB" : p.includes("Canary") ? "Discord Canary" : "Discord";
            paths.push({ name, path: path.dirname(p), appDir: p, version: "direct" });
            continue;
          }
        }

        const appDir = findLatestAppDir(p);
        if (appDir) {
          const name = p.includes("PTB") ? "Discord PTB" : p.includes("Canary") ? "Discord Canary" : "Discord";
          paths.push({ name, path: p, appDir, version: path.basename(appDir) });
        }
      }
    }
  } else if (platform === "linux") {
    const home = process.env.HOME || "";
    const candidates = [
      path.join(home, ".config/discord"),
      path.join(home, ".config/discordptb"),
      path.join(home, ".config/discord-canary"),
      "/usr/share/discord",
      "/usr/lib/discord",
      "/usr/lib64/discord",
      "/opt/Discord",
    ];

    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;

      // Try findLatestAppDir (for app/ wrapper structure)
      const appDir = findLatestAppDir(p);
      if (appDir) {
        const name = p.includes("ptb") ? "Discord PTB" : p.includes("canary") ? "Discord Canary" : "Discord";
        paths.push({ name, path: p, appDir, version: path.basename(appDir) });
        continue;
      }

      // Direct structure: ~/.config/discord/app-X.Y.Z/resources/app.asar
      // Look for app-* directories directly
      try {
        const entries = fs.readdirSync(p);
        const appDirs = entries
          .filter((e) => e.startsWith("app-") || e.startsWith("discord-"))
          .sort()
          .reverse();

        for (const dir of appDirs) {
          const fullPath = path.join(p, dir);
          if (!fs.statSync(fullPath).isDirectory()) continue;

          const asarPath = path.join(fullPath, "resources", "app.asar");
          const coreIndex = path.join(fullPath, "discord_desktop_core", "index.js");
          if (fs.existsSync(asarPath) || fs.existsSync(coreIndex)) {
            const name = p.includes("ptb") ? "Discord PTB" : p.includes("canary") ? "Discord Canary" : "Discord";
            paths.push({ name, path: p, appDir: fullPath, version: dir });
            break;
          }
        }
      } catch (e) {}
    }
  } else if (platform === "darwin") {
    const home = process.env.HOME || "";
    const candidates = [
      path.join(home, "Library", "Application Support", "discord"),
      path.join(home, "Library", "Application Support", "discordptb"),
      path.join(home, "Library", "Application Support", "discord-canary"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const appDir = findLatestAppDir(p);
        if (appDir) {
          const name = p.includes("ptb")
            ? "Discord PTB"
            : p.includes("canary")
            ? "Discord Canary"
            : "Discord";
          paths.push({ name, path: p, appDir, version: path.basename(appDir) });
        }
      }
    }
  }

  return paths;
}

function findLatestAppDir(basePath) {
  try {
    const appPath = path.join(basePath, "app");
    if (!fs.existsSync(appPath)) return null;

    // List all version directories inside app/
    const entries = fs.readdirSync(appPath);
    if (entries.length === 0) return null;

    // Sort newest first
    entries.sort().reverse();

    for (const entry of entries) {
      const fullPath = path.join(appPath, entry);
      const stat = fs.statSync(fullPath);
      if (!stat.isDirectory()) continue;

      // Check for discord_desktop_core/index.js (newer Discord)
      const coreIndex = path.join(fullPath, "discord_desktop_core", "index.js");
      if (fs.existsSync(coreIndex)) return fullPath;

      // Check for resources/app.asar (Linux/macOS Discord)
      const resourcesAsar = path.join(fullPath, "resources", "app.asar");
      if (fs.existsSync(resourcesAsar)) return fullPath;

      // Check for resources/app (older Discord)
      const resourcesApp = path.join(fullPath, "resources", "app");
      if (fs.existsSync(resourcesApp)) return fullPath;
    }

    // Fallback: return the first directory we found
    for (const entry of entries) {
      const fullPath = path.join(appPath, entry);
      if (fs.statSync(fullPath).isDirectory()) return fullPath;
    }
  } catch (e) {}
  return null;
}

// ── Patching Logic ──

function getPatchedState(discordPath, appDir) {
  // Method 1: discord_desktop_core/index.js (Windows)
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");
  if (fs.existsSync(coreIndex)) {
    try {
      const content = fs.readFileSync(coreIndex, "utf-8");
      return { patched: content.includes("suncord") || content.includes("SUNCORD") };
    } catch { return { patched: false }; }
  }

  // Method 2: resources/app.asar (Linux/macOS) — check if we backed it up
  const asarPath = path.join(appDir, "resources", "app.asar");
  if (fs.existsSync(asarPath)) {
    const backupPath = asarPath + ".suncord-backup";
    return { patched: fs.existsSync(backupPath) };
  }

  return { patched: false };
}

function patchDiscord(discordEntry) {
  const { appDir } = discordEntry;

  // Method 1: discord_desktop_core/index.js (Windows)
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");
  if (fs.existsSync(coreIndex)) {
    return patchCoreIndex(coreIndex);
  }

  // Method 2: resources/app.asar (Linux/macOS)
  const asarPath = path.join(appDir, "resources", "app.asar");
  if (fs.existsSync(asarPath)) {
    return patchAsar(asarPath);
  }

  return { success: false, error: "No patchable Discord file found (tried discord_desktop_core/index.js and resources/app.asar)" };
}

function patchCoreIndex(coreIndex) {
  try {
    const original = fs.readFileSync(coreIndex, "utf-8");

    // Backup
    const backupPath = coreIndex + ".suncord-backup";
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original, "utf-8");
    }

    // Find suncord dist path
    const distPath = findSuncordDist();

    // Check if already patched
    if (original.includes("SUNCORD INJECTED")) {
      return { success: true, alreadyPatched: true };
    }

    const loader = `\n// SUNCORD INJECTED — DO NOT EDIT\ntry {\n  const suncordPath = ${JSON.stringify(distPath)};\n  require(require('path').join(suncordPath, 'index.js'));\n} catch (e) {\n  console.error('[Suncord] Failed to load:', e.message);\n}\n`;

    fs.writeFileSync(coreIndex, original + loader, "utf-8");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function patchAsar(asarPath) {
  const backupPath = asarPath + ".suncord-backup";

  // Backup original
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(asarPath, backupPath);
  }

  // Check if already patched (by looking at backup existence)
  // We use a marker file instead
  const markerPath = asarPath + ".suncord-patched";
  if (fs.existsSync(markerPath)) {
    return { success: true, alreadyPatched: true };
  }

  try {
    // Extract asar
    const tmpDir = path.join(require("os").tmpdir(), "suncord-patch-" + Date.now());
    execSync(`npx asar extract "${asarPath}" "${tmpDir}"`, { stdio: "pipe" });

    // Find main JS file
    const files = fs.readdirSync(tmpDir);
    const mainFile = files.find((f) => f.endsWith(".js") && !f.includes("node_modules"));

    if (!mainFile) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return { success: false, error: "Could not find main JS file in app.asar" };
    }

    // Find suncord dist path
    const distPath = findSuncordDist();
    const mainPath = path.join(tmpDir, mainFile);
    const original = fs.readFileSync(mainPath, "utf-8");

    // Prepend injector
    const loader = `// SUNCORD INJECTED — DO NOT EDIT\ntry {\n  const suncordPath = ${JSON.stringify(distPath)};\n  require(require('path').join(suncordPath, 'index.js'));\n} catch (e) {\n  console.error('[Suncord] Failed to load:', e.message);\n}\n`;
    fs.writeFileSync(mainPath, loader + original, "utf-8");

    // Repack
    execSync(`npx asar pack "${tmpDir}" "${asarPath}"`, { stdio: "pipe" });

    // Mark as patched
    fs.writeFileSync(markerPath, new Date().toISOString(), "utf-8");

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function unpatchDiscord(discordEntry) {
  const { appDir } = discordEntry;

  // Method 1: discord_desktop_core/index.js
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");
  const coreBackup = coreIndex + ".suncord-backup";
  if (fs.existsSync(coreBackup)) {
    fs.copyFileSync(coreBackup, coreIndex);
    fs.unlinkSync(coreBackup);
    return { success: true };
  }

  // Method 2: resources/app.asar
  const asarPath = path.join(appDir, "resources", "app.asar");
  const asarBackup = asarPath + ".suncord-backup";
  const markerPath = asarPath + ".suncord-patched";
  if (fs.existsSync(asarBackup)) {
    fs.copyFileSync(asarBackup, asarPath);
    fs.unlinkSync(asarBackup);
    if (fs.existsSync(markerPath)) fs.unlinkSync(markerPath);
    return { success: true };
  }

  return { success: false, error: "No Suncord backup found" };
}

function findSuncordDist() {
  // Check common locations for suncord dist
  const candidates = [
    path.join(__dirname, "..", "..", "dist"),
    path.join(__dirname, "..", "dist"),
    "/usr/lib/suncord",
    "/usr/share/suncord",
    path.join(process.env.HOME || "", ".local/share/suncord"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "index.js"))) return p;
  }

  // Fallback: use __dirname relative
  return path.join(__dirname, "..", "..", "dist");
}

function killDiscord() {
  try {
    if (process.platform === "win32") {
      execSync("taskkill /F /IM discord.exe 2>nul", { stdio: "ignore" });
      execSync("taskkill /F /IM Discord.exe 2>nul", { stdio: "ignore" });
    } else if (process.platform === "linux") {
      execSync("killall discord 2>/dev/null || true", { stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execSync("killall Discord 2>/dev/null || true", { stdio: "ignore" });
    }
  } catch {}
}

function launchDiscord(discordEntry) {
  try {
    const { path: discordPath } = discordEntry;
    if (process.platform === "win32") {
      const exe = path.join(discordPath, "Update.exe");
      if (fs.existsSync(exe)) {
        spawn(exe, ["--processStart", "Discord.exe"], { detached: true, stdio: "ignore" }).unref();
      }
    } else if (process.platform === "linux") {
      spawn("discord", [], { detached: true, stdio: "ignore" }).unref();
    } else if (process.platform === "darwin") {
      spawn("open", ["-a", "Discord"], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {}
}

// ── IPC Handlers ──

ipcMain.handle("detect-discord", () => {
  return getDiscordPaths();
});

ipcMain.handle("check-patched", (_, discordPath) => {
  const entry = getDiscordPaths().find((d) => d.path === discordPath);
  if (!entry) return { patched: false, error: "Discord not found" };
  return getPatchedState(entry.path, entry.appDir);
});

ipcMain.handle("install-suncord", async (_, discordPath) => {
  const entry = getDiscordPaths().find((d) => d.path === discordPath);
  if (!entry) return { success: false, error: "Discord not found" };

  // Kill Discord first
  killDiscord();

  // Small delay for process to die
  await new Promise((r) => setTimeout(r, 1000));

  const result = patchDiscord(entry);
  return result;
});

ipcMain.handle("uninstall-suncord", async (_, discordPath) => {
  const entry = getDiscordPaths().find((d) => d.path === discordPath);
  if (!entry) return { success: false, error: "Discord not found" };

  killDiscord();
  await new Promise((r) => setTimeout(r, 1000));

  return unpatchDiscord(entry);
});

ipcMain.handle("launch-discord", (_, discordPath) => {
  const entry = getDiscordPaths().find((d) => d.path === discordPath);
  if (!entry) return { success: false };
  launchDiscord(entry);
  return { success: true };
});

ipcMain.handle("open-path", (_, p) => {
  shell.showItemInFolder(p);
});

ipcMain.handle("open-url", (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle("get-platform", () => {
  return process.platform;
});
