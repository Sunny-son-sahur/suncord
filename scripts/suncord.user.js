// ==UserScript==
// @name         Suncord
// @namespace    https://github.com/Sunny-son-sahur/suncord
// @version      1.0.0
// @description  Discord client mod — plugins, themes, custom settings
// @author       SUNCORD Team
// @match        https://discord.com/*
// @match        https://*.discord.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const SUNCORD_VERSION = "1.0.0";
  const LOG_PREFIX = "[Suncord]";

  // ── Config Store ──

  const CONFIG_KEY = "suncord_config";

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function setConfig(key, value) {
    const cfg = getConfig();
    cfg[key] = value;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function getPlugins() {
    return getConfig().plugins || {};
  }

  function setPlugin(id, enabled) {
    const plugins = getPlugins();
    plugins[id] = enabled;
    setConfig("plugins", plugins);
  }

  // ── Theme Injection ──

  let themeStyleEl = null;

  function injectTheme(css) {
    if (!themeStyleEl) {
      themeStyleEl = document.createElement("style");
      themeStyleEl.id = "suncord-theme";
      document.head.appendChild(themeStyleEl);
    }
    themeStyleEl.textContent = css;
  }

  function removeTheme() {
    if (themeStyleEl) {
      themeStyleEl.remove();
      themeStyleEl = null;
    }
  }

  // ── Webpack Module Finder ──

  let webpackChunk = null;
  let moduleCache = {};

  function findWebpackModules() {
    // Discord stores modules in window.webpackChunkdiscord_app
    if (window.webpackChunkdiscord_app) {
      webpackChunk = window.webpackChunkdiscord_app;
      return true;
    }
    return false;
  }

  function getModulesByFilter(filter) {
    const results = [];
    try {
      const modules = Object.values(require.c || {});
      for (const m of modules) {
        if (m && m.exports && filter(m.exports)) {
          results.push(m.exports);
        }
      }
    } catch {}
    return results;
  }

  function getByProps(...props) {
    return getModulesByFilter((m) => props.every((p) => m[p] !== undefined));
  }

  function getByDisplayName(name) {
    return getModulesByFilter(
      (m) => m.displayName === name || m.default?.displayName === name
    );
  }

  // ── Plugin System ──

  const loadedPlugins = new Map();

  class PluginBase {
    constructor(info) {
      this.id = info.id;
      this.name = info.name;
      this.description = info.description;
      this.version = info.version;
      this.author = info.author;
    }

    log(...args) {
      console.log(LOG_PREFIX, `[${this.name}]`, ...args);
    }

    // Override these
    start() {}
    stop() {}
  }

  function registerPlugin(plugin) {
    loadedPlugins.set(plugin.id, plugin);
    const enabled = getPlugins()[plugin.id] !== false; // default on
    if (enabled) {
      try {
        plugin.start();
        plugin.log("Loaded");
      } catch (e) {
        console.error(LOG_PREFIX, `Failed to start ${plugin.name}:`, e);
      }
    }
  }

  function togglePlugin(id) {
    const plugin = loadedPlugins.get(id);
    if (!plugin) return;
    const enabled = getPlugins()[id] !== false;
    if (enabled) {
      plugin.stop();
      setPlugin(id, false);
      plugin.log("Disabled");
    } else {
      plugin.start();
      setPlugin(id, true);
      plugin.log("Enabled");
    }
  }

  // ── Settings Panel ──

  function createSettingsButton() {
    // We inject into Discord's settings sidebar once it loads
    const observer = new MutationObserver(() => {
      const settingsSidebar = document.querySelector(
        '[class*="sidebar"] [class*="panels"]'
      );
      if (
        settingsSidebar &&
        !settingsSidebar.querySelector("#suncord-settings-btn")
      ) {
        const btn = document.createElement("div");
        btn.id = "suncord-settings-btn";
        btn.style.cssText =
          "padding:10px 10px 10px 20px;cursor:pointer;color:#b9bbbe;font-size:15px;opacity:0.8;";
        btn.textContent = "☀️ Suncord";
        btn.addEventListener("mouseenter", () => (btn.style.opacity = "1"));
        btn.addEventListener("mouseleave", () => (btn.style.opacity = "0.8"));
        btn.addEventListener("click", () => showSuncordPanel());
        settingsSidebar.appendChild(btn);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function showSuncordPanel() {
    // Find the settings content area and show our panel
    const settingsContent = document.querySelector(
      '[class*="content"] [class*="sidebar"]'
    );
    if (!settingsContent) return;

    const panel = document.createElement("div");
    panel.style.cssText =
      "padding:20px;color:#dcddde;font-family:inherit;";

    const plugins = Array.from(loadedPlugins.values());

    panel.innerHTML = `
      <h2 style="margin-bottom:8px">☀️ Suncord v${SUNCORD_VERSION}</h2>
      <p style="color:#72767d;margin-bottom:24px;font-size:14px">Browser userscript — ${plugins.length} plugin(s) loaded</p>
      <h3 style="margin-bottom:12px;font-size:16px;color:#b9bbbe">Plugins</h3>
      <div id="suncord-plugin-list">
        ${
          plugins.length === 0
            ? '<p style="color:#72767d;font-size:14px">No plugins loaded. Edit the userscript to add them.</p>'
            : plugins
                .map((p) => {
                  const enabled = getPlugins()[p.id] !== false;
                  return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#2f3136;border-radius:8px;margin-bottom:8px;">
                    <div>
                      <div style="font-weight:600;font-size:14px;">${p.name}</div>
                      <div style="color:#72767d;font-size:12px;">${p.description || ""}</div>
                    </div>
                    <label style="position:relative;display:inline-block;width:40px;height:22px;">
                      <input type="checkbox" data-plugin-id="${p.id}" ${enabled ? "checked" : ""} style="opacity:0;width:0;height:0;">
                      <span style="position:absolute;cursor:pointer;inset:0;background:#4f545c;border-radius:11px;transition:0.3s;"></span>
                    </label>
                  </div>`;
                })
                .join("")
        }
      </div>
    `;

    // Toggle switch styling
    const style = document.createElement("style");
    style.textContent = `
      #suncord-settings-panel input:checked + span { background: #3ba55d; }
      #suncord-settings-panel input:checked + span::before { transform: translateX(18px); }
      #suncord-settings-panel input + span::before {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.3s;
      }
    `;
    panel.prepend(style);
    panel.id = "suncord-settings-panel";

    // Handle toggle
    panel.addEventListener("change", (e) => {
      if (e.target.dataset.pluginId) {
        togglePlugin(e.target.dataset.pluginId);
      }
    });

    // Replace settings content
    const contentArea = document.querySelector('[class*="content-"]');
    if (contentArea) {
      contentArea.innerHTML = "";
      contentArea.appendChild(panel);
    }
  }

  // ── Built-in Plugins ──

  // Example: Better Status
  class BetterStatusPlugin extends PluginBase {
    constructor() {
      super({
        id: "better-status",
        name: "Better Status",
        description: "Adds custom status options",
        version: "1.0.0",
        author: "Suncord",
      });
    }

    start() {
      this.log("Better Status active");
    }

    stop() {
      this.log("Better Status stopped");
    }
  }

  // Example: Message Utilities
  class MessageUtilitiesPlugin extends PluginBase {
    constructor() {
      super({
        id: "message-utils",
        name: "Message Utilities",
        description: "Extra message actions",
        version: "1.0.0",
        author: "Suncord",
      });
    }

    start() {
      this.log("Message Utilities active");
    }

    stop() {
      this.log("Message Utilities stopped");
    }
  }

  // ── Init ──

  function init() {
    console.log(LOG_PREFIX, `v${SUNCORD_VERSION} initializing...`);

    // Register built-in plugins
    registerPlugin(new BetterStatusPlugin());
    registerPlugin(new MessageUtilitiesPlugin());

    // Wait for Discord to load and inject settings button
    createSettingsButton();

    console.log(LOG_PREFIX, "Ready.");
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
