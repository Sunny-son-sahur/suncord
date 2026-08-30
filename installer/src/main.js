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
    const programFiles = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const programFilesAlt = process.env["PROGRAMFILES"] || "C:\\Program Files";

    const candidates = [
      path.join(localAppData, "Discord"),
      path.join(programFiles, "Discord"),
      path.join(programFilesAlt, "Discord"),
      path.join(localAppData, "DiscordPTB"),
      path.join(localAppData, "DiscordCanary"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        // Find the versioned app directory
        const appDir = findLatestAppDir(p);
        if (appDir) {
          const name = p.includes("PTB")
            ? "Discord PTB"
            : p.includes("Canary")
            ? "Discord Canary"
            : "Discord";
          paths.push({ name, path: p, appDir, version: path.basename(appDir) });
        }
      }
    }
  } else if (platform === "linux") {
    const candidates = [
      path.join(process.env.HOME || "", ".config/discord"),
      path.join(process.env.HOME || "", ".config/discordptb"),
      path.join(process.env.HOME || "", ".config/discord-canary"),
      "/usr/share/discord",
      "/opt/Discord",
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

    const versions = fs
      .readdirSync(appPath)
      .filter((v) => v.startsWith("modules"))
      .sort()
      .reverse();

    // Find the one with resources/app
    for (const v of versions) {
      const resourcesApp = path.join(appPath, v, "discord_desktop_core", "index.js");
      if (fs.existsSync(path.join(appPath, v))) {
        return path.join(appPath, v);
      }
    }

    // Fallback: just return latest modules dir
    if (versions.length > 0) {
      return path.join(appPath, versions[0]);
    }
  } catch (e) {}
  return null;
}

// ── Patching Logic ──

function getPatchedState(discordPath, appDir) {
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");
  try {
    if (!fs.existsSync(coreIndex)) return { patched: false };
    const content = fs.readFileSync(coreIndex, "utf-8");
    return {
      patched: content.includes("suncord") || content.includes("SUNCORD"),
      content,
    };
  } catch {
    return { patched: false };
  }
}

function patchDiscord(discordEntry) {
  const { appDir } = discordEntry;
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");

  if (!fs.existsSync(coreIndex)) {
    return { success: false, error: "discord_desktop_core/index.js not found" };
  }

  try {
    const original = fs.readFileSync(coreIndex, "utf-8");

    // Backup
    const backupPath = coreIndex + ".suncord-backup";
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, original, "utf-8");
    }

    // Find suncord dist path
    const suncordDist = path.join(__dirname, "..", "..", "dist");
    const altDist = path.join(
      process.env.LOCALAPPDATA || process.env.HOME || "",
      "Suncord",
      "dist"
    );

    let distPath = suncordDist;
    if (!fs.existsSync(suncordDist) && fs.existsSync(altDist)) {
      distPath = altDist;
    }

    // Inject Suncord loader
    const loader = `\n// SUNCORD INJECTED — DO NOT EDIT\ntry {\n  const suncordPath = ${JSON.stringify(distPath)};\n  require(path.join(suncordPath, 'index.js'));\n} catch (e) {\n  console.error('[Suncord] Failed to load:', e.message);\n}\n`;

    // Check if already patched
    if (original.includes("SUNCORD INJECTED")) {
      return { success: true, alreadyPatched: true };
    }

    fs.writeFileSync(coreIndex, original + loader, "utf-8");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function unpatchDiscord(discordEntry) {
  const { appDir } = discordEntry;
  const coreIndex = path.join(appDir, "discord_desktop_core", "index.js");
  const backupPath = coreIndex + ".suncord-backup";

  try {
    if (fs.existsSync(backupPath)) {
      const backup = fs.readFileSync(backupPath, "utf-8");
      fs.writeFileSync(coreIndex, backup, "utf-8");
      fs.unlinkSync(backupPath);
      return { success: true };
    } else {
      // Try removing the Suncord block manually
      const content = fs.readFileSync(coreIndex, "utf-8");
      const cleaned = content.replace(/\n\/\/ SUNCORD INJECTED[\s\S]*$/, "");
      fs.writeFileSync(coreIndex, cleaned, "utf-8");
      return { success: true };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
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
