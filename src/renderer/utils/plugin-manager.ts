// SUNCORD Plugin Manager — handles loading, saving, and lifecycle of plugins

import { SuncordPlugin } from "../api/plugin";

interface PluginManifest {
  name: string;
  description: string;
  version: string;
  author: string;
  main: string;
  enabled: boolean;
}

class PluginManagerClass {
  private plugins: Map<string, SuncordPlugin> = new Map();
  private settings: Map<string, Record<string, any>> = new Map();

  async loadAll(): Promise<void> {
    try {
      // Load plugin settings from storage
      const saved = localStorage.getItem("suncord-plugin-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [name, settings] of Object.entries(parsed)) {
          this.settings.set(name, settings as Record<string, any>);
        }
      }

      // Load enabled plugins
      const enabled = localStorage.getItem("suncord-plugins-enabled");
      if (enabled) {
        const enabledList: string[] = JSON.parse(enabled);
        for (const name of enabledList) {
          console.log(`[SUNCORD] Plugin ${name} marked for loading`);
        }
      }
    } catch (e) {
      console.error("[SUNCORD] Failed to load plugins:", e);
    }
  }

  getAll(): SuncordPlugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): SuncordPlugin | undefined {
    return this.plugins.get(name);
  }

  register(plugin: SuncordPlugin): void {
    this.plugins.set(plugin.name, plugin);

    // Apply saved settings
    const saved = this.settings.get(plugin.name);
    if (saved && plugin.settings) {
      Object.assign(plugin.settings, saved);
    }

    console.log(`[SUNCORD] Registered plugin: ${plugin.name}`);

    // Auto-start if enabled
    if (plugin.enabled && plugin.start) {
      this.start(plugin.name);
    }
  }

  async start(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    try {
      await plugin.start?.();
      plugin.enabled = true;
      this.saveEnabled();
      console.log(`[SUNCORD] Started plugin: ${name}`);
    } catch (e) {
      console.error(`[SUNCORD] Failed to start plugin ${name}:`, e);
    }
  }

  async stop(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    try {
      await plugin.stop?.();
      plugin.enabled = false;
      this.saveEnabled();
      console.log(`[SUNCORD] Stopped plugin: ${name}`);
    } catch (e) {
      console.error(`[SUNCORD] Failed to stop plugin ${name}:`, e);
    }
  }

  toggle(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    if (plugin.enabled) {
      this.stop(name);
    } else {
      this.start(name);
    }
  }

  async uninstall(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    await this.stop(name);
    this.plugins.delete(name);
    this.settings.delete(name);
    this.saveEnabled();
    this.saveSettings();
    console.log(`[SUNCORD] Uninstalled plugin: ${name}`);
  }

  getSettings(name: string): Record<string, any> {
    return this.settings.get(name) || {};
  }

  setSettings(name: string, settings: Record<string, any>): void {
    this.settings.set(name, settings);
    this.saveSettings();
  }

  // Install from a zip ArrayBuffer
  async installFromZip(buffer: ArrayBuffer): Promise<string> {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    // Find manifest
    const manifestFile = zip.file("manifest.json") || zip.file("suncord-plugin.json");
    if (!manifestFile) {
      throw new Error("No manifest.json found in zip");
    }

    const manifest: PluginManifest = JSON.parse(
      await manifestFile.async("text")
    );

    // Find main JS file
    const mainFile = zip.file(manifest.main) || zip.file("index.js");
    if (!mainFile) {
      throw new Error(`Main file ${manifest.main} not found in zip`);
    }

    const mainCode = await mainFile.async("text");

    // Execute the plugin code in a sandbox
    const pluginExports: any = {};
    const module = { exports: pluginExports };
    const require = (name: string) => {
      if (name === "suncord") return window.Suncord?.plugins;
      throw new Error(`Cannot require ${name}`);
    };

    try {
      const fn = new Function("module", "exports", "require", mainCode);
      fn(module, pluginExports, require);
    } catch (e) {
      throw new Error(`Failed to execute plugin: ${e}`);
    }

    const plugin: SuncordPlugin = {
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      enabled: true,
      start: module.exports.start,
      stop: module.exports.stop,
      settings: module.exports.settings,
      settingsDefinition: module.exports.settingsDefinition,
    };

    this.register(plugin);
    this.saveEnabled();

    return manifest.name;
  }

  // Install from code string (for built-in plugins)
  installFromCode(name: string, code: string, manifest: Partial<PluginManifest>): void {
    const pluginExports: any = {};
    const module = { exports: pluginExports };

    try {
      const fn = new Function("module", "exports", code);
      fn(module, pluginExports, () => {});
    } catch (e) {
      console.error(`[SUNCORD] Failed to compile plugin ${name}:`, e);
      return;
    }

    const plugin: SuncordPlugin = {
      name: manifest.name || name,
      description: manifest.description || "",
      version: manifest.version || "1.0",
      author: manifest.author || "SUNCORD",
      enabled: manifest.enabled ?? true,
      start: module.exports.start,
      stop: module.exports.stop,
      settings: module.exports.settings,
      settingsDefinition: module.exports.settingsDefinition,
    };

    this.register(plugin);
  }

  private saveEnabled(): void {
    const enabled = this.getAll()
      .filter((p) => p.enabled)
      .map((p) => p.name);
    localStorage.setItem("suncord-plugins-enabled", JSON.stringify(enabled));
  }

  private saveSettings(): void {
    const obj: Record<string, any> = {};
    for (const [name, settings] of this.settings) {
      obj[name] = settings;
    }
    localStorage.setItem("suncord-plugin-settings", JSON.stringify(obj));
  }
}

export const PluginManager = new PluginManagerClass();
