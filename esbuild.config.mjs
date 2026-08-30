import { build, context } from "esbuild";
import { mkdirSync, cpSync, existsSync, writeFileSync } from "fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });
mkdirSync("dist/plugins", { recursive: true });
mkdirSync("dist/themes", { recursive: true });

const shared = {
  bundle: true,
  sourcemap: false,
  minify: false,
  logLevel: "info",
};

// 1. Patcher — runs in Electron main process (Node.js)
const patcherCtx = await build({
  ...shared,
  entryPoints: ["src/patcher/patcher.js"],
  outfile: "dist/patcher.js",
  format: "cjs",
  platform: "node",
  target: "node18",
  external: ["electron"],
});

// 2. Preload script
cpSync("src/injector/preload.cjs", "dist/preload.cjs");

// 3. Renderer — injected into Discord's renderer (browser context)
const rendererCtx = await build({
  ...shared,
  entryPoints: ["src/renderer/index.tsx"],
  outfile: "dist/renderer.js",
  format: "iife",
  target: "chrome120",
  platform: "browser",
  jsx: "automatic",
  define: {
    "process.env.SUNCORD_VERSION": JSON.stringify("1.0.0"),
  },
});

// 4. Copy plugin/theme assets
const pluginSrc = "src/plugins";
const themeSrc = "src/themes";
if (existsSync(pluginSrc)) cpSync(pluginSrc, "dist/plugins", { recursive: true });
if (existsSync(themeSrc)) cpSync(themeSrc, "dist/themes", { recursive: true });

console.log("☀ SUNCORD build complete");

if (watch) {
  console.log("Watching for changes...");
  await Promise.all([patcherCtx.watch(), rendererCtx.watch()]);
}
