// ==UserScript==
// @name         Suncord
// @namespace    https://github.com/Sunny-son-sahur/suncord
// @version      1.0.0
// @description  Discord client mod — plugins, themes, custom settings
// @author       SUNCORD Team
// @match        https://discord.com/*
// @match        https://*.discord.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const SUNCORD_VERSION = "1.0.0";
  const LOG_PREFIX = "[Suncord]";

  console.log(LOG_PREFIX, "v" + SUNCORD_VERSION + " — script loaded");

  // ── Config Store ──

  const CONFIG_KEY = "suncord_config";

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    } catch (e) {
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

    log() {
      var args = [LOG_PREFIX, "[" + this.name + "]"];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      console.log.apply(console, args);
    }

    start() {}
    stop() {}
  }

  function registerPlugin(plugin) {
    loadedPlugins.set(plugin.id, plugin);
    var enabled = getPlugins()[plugin.id] !== false;
    if (enabled) {
      try {
        plugin.start();
        plugin.log("Loaded");
      } catch (e) {
        console.error(LOG_PREFIX, "Failed to start " + plugin.name + ":", e);
      }
    }
  }

  function togglePlugin(id) {
    var plugin = loadedPlugins.get(id);
    if (!plugin) return;
    var enabled = getPlugins()[id] !== false;
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

  // ── Toast Notification (visual proof it works) ──

  function showToast(msg, duration) {
    duration = duration || 3000;
    var toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:999999;" +
      "background:#2f3136;color:#dcddde;padding:12px 20px;border-radius:8px;" +
      "font-family:sans-serif;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,0.4);" +
      "border-left:4px solid #e94560;transition:opacity 0.3s;";
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, duration);
  }

  // ── Settings Button (in Discord sidebar) ──

  function injectSettingsButton() {
    var observer = new MutationObserver(function () {
      // Look for Discord's settings sidebar — the left panel with User Settings, Nitro, etc.
      var panels = document.querySelector('[class*="sidePanel"]') ||
                   document.querySelector('[aria-label="Servers"]') ||
                   document.querySelector('[class*="guilds"]');

      // Also try to find the settings area specifically
      var settingsNav = document.querySelector('[class*="settings"] [class*="list"]') ||
                        document.querySelector('[class*="sidebar"] [class*="list"]');

      var target = settingsNav || panels;
      if (!target) return;

      // Don't inject twice
      if (document.getElementById("suncord-nav-btn")) return;

      var btn = document.createElement("div");
      btn.id = "suncord-nav-btn";
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.style.cssText =
        "padding:6px 10px;margin:2px 8px;cursor:pointer;color:#b9bbbe;font-size:13px;" +
        "border-radius:4px;display:flex;align-items:center;gap:8px;transition:background 0.15s;";
      btn.innerHTML = "☀️ <span>Suncord</span>";

      btn.addEventListener("mouseenter", function () {
        btn.style.background = "rgba(79,84,92,0.4)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.background = "transparent";
      });
      btn.addEventListener("click", function () {
        showSuncordPanel();
      });

      target.appendChild(btn);
      console.log(LOG_PREFIX, "Settings button injected");
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Suncord Settings Panel ──

  function showSuncordPanel() {
    // Try multiple selectors to find Discord's content area
    var contentArea =
      document.querySelector('[class*="content-"]') ||
      document.querySelector('[class*="settings"] [class*="content"]') ||
      document.querySelector('[class*="tier"]') ||
      document.querySelector('[class*="panels"]');

    if (!contentArea) {
      console.warn(LOG_PREFIX, "Could not find settings content area");
      return;
    }

    var panel = document.createElement("div");
    panel.style.cssText =
      "padding:20px;color:#dcddde;font-family:inherit;height:100%;overflow-y:auto;";

    var plugins = Array.from(loadedPlugins.values());

    var pluginListHTML = "";
    if (plugins.length === 0) {
      pluginListHTML = '<p style="color:#72767d;font-size:14px">No plugins loaded yet.</p>';
    } else {
      for (var i = 0; i < plugins.length; i++) {
        var p = plugins[i];
        var enabled = getPlugins()[p.id] !== false;
        pluginListHTML +=
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#2f3136;border-radius:8px;margin-bottom:8px;">' +
          '<div><div style="font-weight:600;font-size:14px;">' + p.name + "</div>" +
          '<div style="color:#72767d;font-size:12px;">' + (p.description || "") + "</div></div>" +
          '<label style="position:relative;display:inline-block;width:40px;height:22px;">' +
          '<input type="checkbox" data-plugin-id="' + p.id + '" ' + (enabled ? "checked" : "") +
          ' style="opacity:0;width:0;height:0;position:absolute;">' +
          '<span style="position:absolute;cursor:pointer;inset:0;background:' +
          (enabled ? "#3ba55d" : "#4f545c") +
          ';border-radius:11px;transition:0.3s;"></span></label></div>';
      }
    }

    panel.innerHTML =
      '<h2 style="margin:0 0 4px">☀️ Suncord v' + SUNCORD_VERSION + "</h2>" +
      '<p style="color:#72767d;margin:0 0 24px;font-size:13px">Browser userscript — ' +
      plugins.length + " plugin(s) loaded</p>" +
      '<h3 style="margin:0 0 12px;font-size:15px;color:#b9bbbe">Plugins</h3>' +
      '<div id="suncord-plugin-list">' + pluginListHTML + "</div>" +
      '<div style="margin-top:24px;padding-top:16px;border-top:1px solid #4f545c;">' +
      '<p style="color:#72767d;font-size:12px;margin:0">Suncord is open source. ' +
      '<a href="https://github.com/Sunny-son-sahur/suncord" target="_blank" ' +
      'style="color:#00aff4;">GitHub</a></p></div>';

    panel.id = "suncord-settings-panel";

    // Toggle handler
    panel.addEventListener("change", function (e) {
      if (e.target.dataset.pluginId) {
        togglePlugin(e.target.dataset.pluginId);
        // Update toggle color
        var span = e.target.nextElementSibling;
        if (span) {
          span.style.background = e.target.checked ? "#3ba55d" : "#4f545c";
        }
      }
    });

    contentArea.innerHTML = "";
    contentArea.appendChild(panel);
  }

  // ── Built-in Plugins ──

  function BetterStatusPlugin() {
    PluginBase.call(this, {
      id: "better-status",
      name: "Better Status",
      description: "Adds custom status options",
      version: "1.0.0",
      author: "Suncord",
    });
  }
  BetterStatusPlugin.prototype = Object.create(PluginBase.prototype);
  BetterStatusPlugin.prototype.constructor = BetterStatusPlugin;
  BetterStatusPlugin.prototype.start = function () {
    this.log("active");
  };
  BetterStatusPlugin.prototype.stop = function () {
    this.log("stopped");
  };

  function MessageUtilsPlugin() {
    PluginBase.call(this, {
      id: "message-utils",
      name: "Message Utilities",
      description: "Extra message actions",
      version: "1.0.0",
      author: "Suncord",
    });
  }
  MessageUtilsPlugin.prototype = Object.create(PluginBase.prototype);
  MessageUtilsPlugin.prototype.constructor = MessageUtilsPlugin;
  MessageUtilsPlugin.prototype.start = function () {
    this.log("active");
  };
  MessageUtilsPlugin.prototype.stop = function () {
    this.log("stopped");
  };

  // ── Init ──

  function init() {
    console.log(LOG_PREFIX, "v" + SUNCORD_VERSION + " — initializing");

    // Register plugins
    registerPlugin(new BetterStatusPlugin());
    registerPlugin(new MessageUtilsPlugin());

    // Inject settings button
    injectSettingsButton();

    // Show toast as visual proof
    showToast("☀️ Suncord v" + SUNCORD_VERSION + " loaded!", 4000);

    console.log(LOG_PREFIX, "Ready. " + loadedPlugins.size + " plugin(s) loaded.");
  }

  // Wait for page to be fully ready
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
