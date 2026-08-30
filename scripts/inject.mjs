# SUNCORD Injector Script — injects into Discord's app.asar
# Run this after npm install to patch your Discord client

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SUNCORD_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(SUNCORD_DIR, "dist");

// Common Discord install paths
const DISCORD_PATHS = [
  // Linux
  "/opt/discord",
  "/usr/lib/discord",
  path.join(process.env.HOME || "", ".local/share/discord"),
  // macOS
  "/Applications/Discord.app/Contents/Resources",
  // Windows
  path.join(process.env.APPDATA || "", "../Local/Discord"),
];

function findDiscord() {
  for (const p of DISCORD_PATHS) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "resources", "app.asar"))) {
      return p;
    }
  }
  return null;
}

function patchDiscord(discordPath) {
  const asarPath = path.join(discordPath, "resources", "app.asar");
  const backupPath = asarPath + ".suncord.bak";

  if (!fs.existsSync(asarPath)) {
    console.error("app.asar not found at", asarPath);
    process.exit(1);
  }

  // Backup
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(asarPath, backupPath);
    console.log("✓ Backed up app.asar");
  }

  // Extract
  const tmpDir = path.join(SUNCORD_DIR, ".tmp-patch");
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

  try {
    execSync(`npx asar extract "${asarPath}" "${tmpDir}"`, { stdio: "inherit" });

    // Find main entry
    const mainFile = findMainFile(tmpDir);
    if (!mainFile) {
      console.error("Could not find Discord's main JS file");
      process.exit(1);
    }

    // Prepend SUNCORD injector
    const injectorPath = path.join(DIST_DIR, "injector.js");
    if (!fs.existsSync(injectorPath)) {
      console.error("SUNCORD dist not found. Run 'npm run build' first.");
      process.exit(1);
    }

    const original = fs.readFileSync(mainFile, "utf-8");
    const injector = fs.readFileSync(injectorPath, "utf-8");
    fs.writeFileSync(mainFile, `// --- SUNCORD INJECT START ---\n${injector}\n// --- SUNCORD INJECT END ---\n${original}`);

    // Repack
    execSync(`npx asar pack "${tmpDir}" "${asarPath}"`, { stdio: "inherit" });
    console.log("✓ Patched app.asar with SUNCORD");
  } finally {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  }
}

function findMainFile(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  for (const f of files) {
    if (typeof f === "string" && f.endsWith(".js") && f.includes("main")) {
      return path.join(dir, f);
    }
  }
  // Fallback: find first .js in the root
  for (const f of files) {
    if (typeof f === "string" && f.endsWith(".js") && !f.includes("node_modules")) {
      return path.join(dir, f);
    }
  }
  return null;
}

function unpatchDiscord(discordPath) {
  const asarPath = path.join(discordPath, "resources", "app.asar");
  const backupPath = asarPath + ".suncord.bak";

  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, asarPath);
    fs.unlinkSync(backupPath);
    console.log("✓ Discord restored to original state");
  } else {
    console.log("No backup found. Discord was not patched by SUNCORD.");
  }
}

// Main
const action = process.argv[2] || "install";

if (action === "uninstall") {
  const discordPath = findDiscord();
  if (!discordPath) {
    console.error("Discord not found");
    process.exit(1);
  }
  unpatchDiscord(discordPath);
} else {
  const discordPath = findDiscord();
  if (!discordPath) {
    console.error("Discord not found. Install Discord first.");
    process.exit(1);
  }
  console.log(`Found Discord at: ${discordPath}`);
  patchDiscord(discordPath);
  console.log("");
  console.log("Done! Launch Discord to use SUNCORD.");
  console.log("The Store button will appear in the top-right corner.");
}
