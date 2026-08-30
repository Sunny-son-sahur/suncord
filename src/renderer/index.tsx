// SUNCORD Renderer — injected into Discord's renderer process
// This is the main entry point for the client mod

import { PluginAPI } from "./api/plugin";
import { ThemeAPI } from "./api/theme";
import { StoreAPI } from "./api/store";
import { PluginManager } from "./utils/plugin-manager";
import { ThemeManager } from "./utils/theme-manager";
import { injectStoreButton } from "./components/StoreButton";
import { injectSettingsPanel } from "./components/SettingsPanel";
import { waitForDiscord } from "./utils/discord";

// Global SUNCORD namespace
(window as any).Suncord = {
  version: "1.0.0",
  plugins: PluginAPI,
  themes: ThemeAPI,
  store: StoreAPI,
  pluginManager: PluginManager,
  themeManager: ThemeManager,
};

// Initialize everything
async function init() {
  console.log("[SUNCORD] Renderer starting...");

  // Wait for Discord to be ready
  await waitForDiscord();

  console.log("[SUNCORD] Discord detected, initializing...");

  // Load saved plugins
  await PluginManager.loadAll();

  // Load saved themes
  await ThemeManager.loadAll();

  // Inject the Store button into Discord's top bar
  injectStoreButton();

  // Inject settings panel
  injectSettingsPanel();

  console.log("[SUNCORD] All systems online ☀");
}

// Start when Discord is ready
if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init);
}

export {};
