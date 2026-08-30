// Windows packaging script — builds portable zip + NSIS installer

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BUILD = join(ROOT, "build");
const RELEASE = join(ROOT, "release");

console.log("☀ SUNCORD Windows Packager\n");

mkdirSync(RELEASE, { recursive: true });

// ---- Portable ZIP ----
console.log("📦 Building portable ZIP...");
try {
  execSync(
    `cd ${DIST} && 7z a ${join(RELEASE, "suncord-windows-portable.zip")} * -mx=9`,
    { stdio: "inherit" }
  );
  console.log("  ✓ suncord-windows-portable.zip\n");
} catch {
  // Try zip instead
  try {
    execSync(`cd ${DIST} && zip -r ${join(RELEASE, "suncord-windows-portable.zip")} .`);
    console.log("  ✓ suncord-windows-portable.zip\n");
  } catch {
    console.log("  ⚠ Could not create ZIP (install 7zip or zip)\n");
  }
}

// ---- NSIS Installer ----
console.log("📦 Building NSIS installer...");
const nsisScript = join(BUILD, "installer.nsi");

if (existsSync(nsisScript)) {
  try {
    execSync(`makensis ${nsisScript}`, { stdio: "inherit" });
    console.log("  ✓ suncord-setup.exe\n");
  } catch {
    console.log("  ⚠ NSIS not found. Install it from https://nsis.sourceforge.io/");
    console.log("    Or download the installer from GitHub Releases\n");
  }
} else {
  console.log("  ⚠ installer.nsi not found\n");
}

console.log("☀ Windows packaging complete!");
console.log(`  Release artifacts: ${RELEASE}/`);
