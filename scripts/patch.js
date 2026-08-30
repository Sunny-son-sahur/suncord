#!/usr/bin/env node
// Suncord patcher — renames app.asar, creates stub, builds asar
// Based on Vencord's proven approach

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const DIST = path.resolve(__dirname, "../dist");

// Platform-specific Discord paths
function findDiscordResources() {
  const platform = process.platform;
  const home = os.homedir();
  const paths = [];

  if (platform === "linux") {
    const configBase = `${home}/.config/discord`;
    // Scan app-VERSION directories
    if (fs.existsSync(configBase)) {
      for (const d of fs.readdirSync(configBase)) {
        if (d.startsWith("app-")) {
          paths.push(path.join(configBase, d, "resources"));
        }
      }
    }
    paths.push(
      "/usr/share/discord/resources",
      "/usr/lib64/discord/resources",
      "/opt/discord/resources",
      `${home}/.local/share/discord/resources`
    );
    // Flatpak
    const flatpak = `${home}/.var/app/com.discordapp.Discord/config/discord`;
    if (fs.existsSync(flatpak)) {
      for (const d of fs.readdirSync(flatpak)) {
        if (d.startsWith("app-")) {
          paths.push(path.join(flatpak, d, "resources"));
        }
      }
    }
  } else if (platform === "darwin") {
    paths.push(
      "/Applications/Discord.app/Contents/Resources",
      `${home}/Applications/Discord.app/Contents/Resources`
    );
  } else if (platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || `${home}/AppData/Local`;
    for (const variant of ["Discord", "DiscordPTB", "DiscordCanary"]) {
      const base = path.join(localAppData, variant, "resources");
      if (fs.existsSync(base)) {
        // Find latest app-X.Y.Z
        const dirs = fs.readdirSync(base)
          .filter(d => d.startsWith("app-"))
          .sort()
          .reverse();
        if (dirs.length > 0) {
          paths.push(path.join(base, dirs[0]));
        }
      }
    }
  }

  // Find first path that has an app.asar
  for (const p of paths) {
    const asar = path.join(p, "app.asar");
    if (fs.existsSync(asar)) return p;
  }

  return null;
}

// Create a minimal asar stub using the @electron/asar CLI
function createStubAsar(stubDir, patcherPath, outAsar) {
  // Write package.json
  fs.writeFileSync(
    path.join(stubDir, "package.json"),
    JSON.stringify({ name: "discord", main: "index.js" })
  );

  // Write index.js — requires the patcher from dist
  fs.writeFileSync(
    path.join(stubDir, "index.js"),
    `require(${JSON.stringify(patcherPath)});\n`
  );

  // Pack into asar
  execSync(`npx @electron/asar pack "${stubDir}" "${outAsar}"`, {
    stdio: "inherit",
  });
}

// --- MAIN ---
const resourcesDir = findDiscordResources();
if (!resourcesDir) {
  console.error("Could not find Discord installation");
  process.exit(1);
}

const asarPath = path.join(resourcesDir, "app.asar");
const backupPath = path.join(resourcesDir, "_app.asar");

// Backup original
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(asarPath, backupPath);
  console.log("Backed up original app.asar → _app.asar");
} else {
  console.log("Backup already exists (_app.asar)");
}

// Patch: remove old app.asar if exists
if (fs.existsSync(asarPath)) {
  fs.unlinkSync(asarPath);
}

// Create stub
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "suncord-stub-"));
const patcherPath = path.join(DIST, "patcher.js");

if (!fs.existsSync(patcherPath)) {
  console.error("patcher.js not found in dist. Run build first.");
  process.exit(1);
}

createStubAsar(stubDir, patcherPath, asarPath);
fs.rmSync(stubDir, { recursive: true, force: true });

console.log("Patch complete! app.asar → stub requiring", patcherPath);
console.log("Original saved as _app.asar");
console.log(`Size: ${fs.statSync(asarPath).size} bytes`);
