// Suncord Installer — Preload Script
// Bridges main process and renderer securely

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("suncord", {
  detectDiscord: () => ipcRenderer.invoke("detect-discord"),
  checkPatched: (discordPath) => ipcRenderer.invoke("check-patched", discordPath),
  install: (discordPath) => ipcRenderer.invoke("install-suncord", discordPath),
  uninstall: (discordPath) => ipcRenderer.invoke("uninstall-suncord", discordPath),
  launchDiscord: (discordPath) => ipcRenderer.invoke("launch-discord", discordPath),
  openPath: (p) => ipcRenderer.invoke("open-path", p),
  openUrl: (url) => ipcRenderer.invoke("open-url", url),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
});
