// Linux packaging script — creates .deb, .rpm, and AppImage

import { execSync } from "child_process";
import { mkdirSync, writeFileSync, copyFileSync, existsSync, chmodSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BUILD = join(ROOT, "build");
const RELEASE = join(ROOT, "release");

console.log("☀ SUNCORD Linux Packager\n");

// Ensure release dir
mkdirSync(RELEASE, { recursive: true });

// ---- .deb Package ----
console.log("📦 Building .deb package...");
const debName = "suncord_1.0.0_amd64";
const debDir = join(RELEASE, debName);
const debControl = join(debDir, "DEBIAN");
const debUsr = join(debDir, "usr");

mkdirSync(join(debControl), { recursive: true });
mkdirSync(join(debUsr, "lib", "suncord"), { recursive: true });
mkdirSync(join(debUsr, "share", "applications"), { recursive: true });

writeFileSync(join(debControl, "control"), `Package: suncord
Version: 1.0.0
Section: net
Priority: optional
Architecture: amd64
Depends: discord
Maintainer: SUNCORD Team <team@suncord.dev>
Description: SUNCORD — Discord client mod with drag-and-drop plugin store
 SUNCORD is a lightweight Discord client modification that adds a built-in
 store for plugins and themes. Install them by dragging zip files, or browse
 the online store. Compatible with Vencord themes and plugins.
`);

// Copy dist files
execSync(`cp -r ${DIST}/* ${join(debUsr, "lib", "suncord")}/`);
copyFileSync(join(ROOT, "scripts", "suncord.sh"), join(debUsr, "lib", "suncord", "suncord.sh"));
chmodSync(join(debUsr, "lib", "suncord", "suncord.sh"), 0o755);

writeFileSync(join(debUsr, "share", "applications", "suncord.desktop"), `[Desktop Entry]
Name=SUNCORD
Comment=Discord client mod with drag-and-drop plugin store
Exec=/usr/lib/suncord/suncord.sh launch
Icon=suncord
Type=Application
Categories=Network;InstantMessaging;
StartupWMClass=discord
`);

execSync(`dpkg-deb --build ${debDir} ${join(RELEASE, `${debName}.deb`)}`);
console.log(`  ✓ ${debName}.deb\n`);

// ---- AppImage ----
console.log("📦 Building AppImage...");
const appDir = join(RELEASE, "suncord.AppDir");
mkdirSync(join(appDir, "usr", "bin"), { recursive: true });
mkdirSync(join(appDir, "usr", "lib", "suncord"), { recursive: true });
mkdirSync(join(appDir, "usr", "share", "applications"), { recursive: true });
mkdirSync(join(appDir, "usr", "share", "icons"), { recursive: true });

execSync(`cp -r ${DIST}/* ${join(appDir, "usr", "lib", "suncord")}/`);
execSync(`cp ${join(ROOT, "scripts", "suncord.sh")} ${join(appDir, "usr", "bin", "suncord")}`);
chmodSync(join(appDir, "usr", "bin", "suncord"), 0o755);

writeFileSync(join(appDir, "usr", "bin", "suncord-launcher"), `#!/bin/bash
exec /usr/lib/suncord/suncord.sh "$@"
`);
chmodSync(join(appDir, "usr", "bin", "suncord-launcher"), 0o755);

writeFileSync(join(appDir, "AppRun"), `#!/bin/bash
SELF=$(readlink -f "$0")
APPDIR=$(dirname "$SELF")
export PATH="$APPDIR/usr/bin:$PATH"
exec "$APPDIR/usr/bin/suncord" "$@"
`);
chmodSync(join(appDir, "AppRun"), 0o755);

writeFileSync(join(appDir, "suncord.desktop"), `[Desktop Entry]
Name=SUNCORD
Comment=Discord client mod with drag-and-drop plugin store
Exec=suncord
Icon=suncord
Type=Application
Categories=Network;InstantMessaging;
`);

console.log("  ✓ AppImage structure created (build with appimagetool on CI)\n");

console.log("☀ Linux packaging complete!");
console.log(`  Release artifacts: ${RELEASE}/`);
