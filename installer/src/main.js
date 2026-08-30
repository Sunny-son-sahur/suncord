// Suncord Installer — Main Process
// Detects Discord installations and patches them (Vencord-style)

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");
const os = require("os");

let mainWindow;

// ── Discord Detection ──

function getDiscordPaths() {
  const paths = [];
  const platform = process.platform;
  const home = os.homedir();

  if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const candidates = [
      path.join(localAppData, "Discord"),
      path.join(localAppData, "DiscordPTB"),
      path.join(localAppData, "DiscordCanary"),
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const latest = findLatestAppDir(p);
      if (latest) {
        const name = p.includes("PTB") ? "Discord PTB" : p.includes("Canary") ? "Discord Canary" : "Discord";
        paths.push({ name, resources: path.join(latest, "resources") });
      }
    }
  } else if (platform === "linux") {
    const candidates = [
      path.join(home, ".config/discord"),
      "/usr/share/discord",
      "/usr/lib64/discord",
      "/opt/discord",
      path.join(home, ".local/share/discord"),
      path.join(home, ".var/app/com.discordapp.Discord/config/discord"),
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const latest = findLatestAppDir(p);
      if (latest) {
        const name = p.includes("ptb") ? "Discord PTB" : p.includes("canary") ? "Discord Canary" : "Discord";
        paths.push({ name, resources: path.join(latest, "resources") });
      }
    }
  } else if (platform === "darwin") {
    const candidates = [
      path.join(home, "Applications", "Discord.app", "Contents", "Resources"),
      "/Applications/Discord.app/Contents/Resources",
      path.join(home, "Library", "Application Support", "discord"),
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      // macOS: resources dir directly or app-X.Y.Z/resources
      if (fs.existsSync(path.join(p, "app.asar"))) {
        paths.push({ name: "Discord", resources: p });
      } else {
        const latest = findLatestAppDir(path.dirname(p));
        if (latest) paths.push({ name: "Discord", resources: path.join(latest, "resources") });
      }
    }
  }

  return paths;
}

function findLatestAppDir(basePath) {
  // Check app-X.Y.Z structure (Linux ~/.config/discord)
  if (fs.existsSync(basePath)) {
    const entries = fs.readdirSync(basePath);
    const appDirs = entries.filter(e => e.startsWith("app-")).sort().reverse();
    for (const dir of appDirs) {
      const full = path.join(basePath, dir);
      if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "resources", "app.asar"))) {
        return full;
      }
    }
  }
  // Check app/app-X.Y.Z structure (Windows)
  const appDir = path.join(basePath, "app");
  if (fs.existsSync(appDir)) {
    const entries = fs.readdirSync(appDir);
    entries.sort().reverse();
    for (const entry of entries) {
      const full = path.join(appDir, entry);
      if (fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, "resources", "app.asar"))) {
        return full;
      }
    }
  }
  return null;
}

// ── Patch Detection ──

function isPatched(resourcesDir) {
  return fs.existsSync(path.join(resourcesDir, "_app.asar"));
}

// ── Patching ──

function getSuncordDist() {
  // When packaged as app: resources/app.asar.asar.unpacked or similar
  // When running in dev: ../../dist
  const candidates = [
    path.join(process.resourcesPath, "suncord"),
    path.join(__dirname, "..", "..", "dist"),
    path.join(process.env.HOME || "", ".local/share/suncord"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "patcher.js"))) return p;
  }
  return null;
}

function patchDiscord(resourcesDir) {
  const asarPath = path.join(resourcesDir, "app.asar");
  const backupPath = path.join(resourcesDir, "_app.asar");

  if (!fs.existsSync(asarPath)) {
    return { success: false, error: "app.asar not found" };
  }

  // Already patched — restore first
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, asarPath);
  }

  // Backup original
  fs.copyFileSync(asarPath, backupPath);

  // Find dist files
  const distPath = getSuncordDist();
  if (!distPath) {
    return { success: false, error: "Suncord dist files not found" };
  }

  // Create stub asar
  const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "suncord-stub-"));
  try {
    fs.writeFileSync(path.join(stubDir, "package.json"), '{"name":"discord","main":"index.js"}');
    fs.writeFileSync(path.join(stubDir, "index.js"),
      `require(${JSON.stringify(path.join(distPath, "patcher.js"))});`
    );

    // Remove old asar, pack new stub
    fs.unlinkSync(asarPath);
    execSync(`npx @electron/asar pack "${stubDir}" "${asarPath}"`, { stdio: "ignore" });

    if (!fs.existsSync(asarPath)) {
      // Restore on failure
      fs.copyFileSync(backupPath, asarPath);
      return { success: false, error: "Failed to create stub asar" };
    }

    return { success: true };
  } finally {
    fs.rmSync(stubDir, { recursive: true, force: true });
  }
}

function unpatchDiscord(resourcesDir) {
  const asarPath = path.join(resourcesDir, "app.asar");
  const backupPath = path.join(resourcesDir, "_app.asar");

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, asarPath);
    fs.unlinkSync(backupPath);
    return { success: true };
  }

  return { success: false, error: "No Suncord backup found" };
}

// ── Helpers ──

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

function launchDiscord(entry) {
  try {
    if (process.platform === "win32") {
      const discordDir = path.dirname(entry.resources);
      const exe = path.join(discordDir, "Update.exe");
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

// ── Window ──

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
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

// ── IPC ──

ipcMain.handle("detect-discord", () => getDiscordPaths());

ipcMain.handle("check-patched", (_, resourcesDir) => {
  return { patched: isPatched(resourcesDir) };
});

ipcMain.handle("install-suncord", async (_, resourcesDir) => {
  killDiscord();
  await new Promise(r => setTimeout(r, 1500));
  return patchDiscord(resourcesDir);
});

ipcMain.handle("uninstall-suncord", async (_, resourcesDir) => {
  killDiscord();
  await new Promise(r => setTimeout(r, 1500));
  return unpatchDiscord(resourcesDir);
});

ipcMain.handle("launch-discord", (_, resourcesDir) => {
  const entry = getDiscordPaths().find(d => d.resources === resourcesDir);
  if (entry) launchDiscord(entry);
  return { success: true };
});

ipcMain.handle("open-url", (_, url) => shell.openExternal(url));
ipcMain.handle("get-platform", () => process.platform);
