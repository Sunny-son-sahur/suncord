// SUNCORD Preload — runs in the preload context, bridges main and renderer

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("SUNCORD", {
  version: "1.0.0",

  // Plugin management
  plugins: {
    list: () => ipcRenderer.invoke("suncord:plugins:list"),
    install: (zipBuffer) => ipcRenderer.invoke("suncord:plugins:install", zipBuffer),
    uninstall: (name) => ipcRenderer.invoke("suncord:plugins:uninstall", name),
    enable: (name) => ipcRenderer.invoke("suncord:plugins:enable", name),
    disable: (name) => ipcRenderer.invoke("suncord:plugins:disable", name),
    getSettings: (name) => ipcRenderer.invoke("suncord:plugins:settings:get", name),
    setSettings: (name, settings) =>
      ipcRenderer.invoke("suncord:plugins:settings:set", name, settings),
  },

  // Theme management
  themes: {
    list: () => ipcRenderer.invoke("suncord:themes:list"),
    install: (zipBuffer) => ipcRenderer.invoke("suncord:themes:install", zipBuffer),
    uninstall: (name) => ipcRenderer.invoke("suncord:themes:uninstall", name),
    enable: (name) => ipcRenderer.invoke("suncord:themes:enable", name),
    disable: (name) => ipcRenderer.invoke("suncord:themes:disable", name),
  },

  // Store
  store: {
    fetchPlugins: () => ipcRenderer.invoke("suncord:store:fetch-plugins"),
    fetchThemes: () => ipcRenderer.invoke("suncord:store:fetch-themes"),
  },

  // File system helpers for drag-and-drop
  fs: {
    readFile: (filePath) => ipcRenderer.invoke("suncord:fs:read-file", filePath),
    writeFile: (filePath, data) =>
      ipcRenderer.invoke("suncord:fs:write-file", filePath, data),
  },

  // Open external links
  openExternal: (url) => ipcRenderer.invoke("suncord:open-external", url),

  // Get paths
  getPath: (name) => ipcRenderer.invoke("suncord:get-path", name),
});

console.log("[SUNCORD] Preload bridge ready");
