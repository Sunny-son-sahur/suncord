import { build, context } from "esbuild";
import { mkdirSync, cpSync, existsSync } from "fs";

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

// 1. Injector — runs in Electron main process (Node.js)
const injectorCtx = await build({
  ...shared,
  entryPoints: ["src/injector/index.mjs"],
  outfile: "dist/injector.js",
  format: "cjs",
  platform: "node",
  target: "node18",
  external: ["electron"], // electron is provided at runtime by Discord
});

// 2. Preload script — runs in preload context
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
  await Promise.all([injectorCtx.watch(), rendererCtx.watch()]);
}
