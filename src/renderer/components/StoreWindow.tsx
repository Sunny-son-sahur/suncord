// SUNCORD Store Window — the full store UI with plugins, themes, and drag-and-drop

import { StoreAPI } from "../api/store";
import { ThemeAPI } from "../api/theme";
import { PluginManager } from "../utils/plugin-manager";

interface StoreItem {
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  url: string;
  rawUrl: string;
  tags: string[];
  lastUpdated: string;
  screenshot?: string;
}

let currentTab: "plugins" | "themes" = "plugins";

export const StoreWindow = {
  open(): void {
    const overlay = document.createElement("div");
    overlay.id = "suncord-store-overlay";
    overlay.innerHTML = getStoreHTML();
    document.body.appendChild(overlay);

    // Inject styles
    const style = document.createElement("style");
    style.textContent = getStoreStyles();
    document.head.appendChild(style);

    // Set up event listeners
    setupStoreEvents(overlay);

    // Load content
    loadTab("plugins");
  },
};

function getStoreHTML(): string {
  return `
    <div class="sc-store-backdrop" id="sc-store-backdrop">
      <div class="sc-store-modal">
        <!-- Header -->
        <div class="sc-store-header">
          <div class="sc-store-title">
            <span class="sc-store-logo">☀</span>
            <span>SUNCORD Store</span>
          </div>
          <div class="sc-store-close" id="sc-store-close">✕</div>
        </div>

        <!-- Tabs -->
        <div class="sc-store-tabs">
          <button class="sc-store-tab active" data-tab="plugins">🔌 Plugins</button>
          <button class="sc-store-tab" data-tab="themes">🎨 Themes</button>
        </div>

        <!-- Search -->
        <div class="sc-store-search">
          <input type="text" placeholder="Search plugins and themes..." id="sc-store-search" />
        </div>

        <!-- Drop Zone -->
        <div class="sc-store-dropzone" id="sc-store-dropzone">
          <div class="sc-store-dropzone-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <p>Drop a <strong>.zip</strong> plugin or theme here to install</p>
            <span>or click to browse</span>
          </div>
          <input type="file" accept=".zip,.css" id="sc-store-file-input" style="display:none" />
        </div>

        <!-- Content Grid -->
        <div class="sc-store-content" id="sc-store-content">
          <div class="sc-store-loading">Loading...</div>
        </div>
      </div>
    </div>
  `;
}

function getStoreStyles(): string {
  return `
    .sc-store-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: sc fadeIn 0.2s ease;
    }

    @keyframes sc fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sc-store-modal {
      width: 90%;
      max-width: 900px;
      height: 80vh;
      max-height: 700px;
      background: #1e1f22;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      border: 1px solid #333;
    }

    .sc-store-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
    }

    .sc-store-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
      font-weight: 700;
    }

    .sc-store-logo {
      font-size: 24px;
    }

    .sc-store-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 18px;
    }

    .sc-store-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sc-store-tabs {
      display: flex;
      padding: 0 20px;
      background: #2b2d31;
      border-bottom: 1px solid #333;
    }

    .sc-store-tab {
      padding: 12px 20px;
      background: none;
      border: none;
      color: #b5bac1;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .sc-store-tab:hover {
      color: #dbdee1;
    }

    .sc-store-tab.active {
      color: #f59e0b;
      border-bottom-color: #f59e0b;
    }

    .sc-store-search {
      padding: 12px 20px;
      background: #2b2d31;
    }

    .sc-store-search input {
      width: 100%;
      padding: 10px 16px;
      background: #1e1f22;
      border: 1px solid #333;
      border-radius: 8px;
      color: #dbdee1;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .sc-store-search input:focus {
      border-color: #f59e0b;
    }

    .sc-store-dropzone {
      margin: 12px 20px;
      padding: 24px;
      border: 2px dashed #444;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #b5bac1;
    }

    .sc-store-dropzone:hover,
    .sc-store-dropzone.drag-over {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .sc-store-dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .sc-store-dropzone p {
      margin: 0;
      font-size: 14px;
    }

    .sc-store-dropzone span {
      font-size: 12px;
      color: #888;
    }

    .sc-store-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 20px;
    }

    .sc-store-loading {
      text-align: center;
      padding: 40px;
      color: #b5bac1;
    }

    .sc-store-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }

    .sc-store-item {
      background: #2b2d31;
      border-radius: 10px;
      padding: 16px;
      border: 1px solid #333;
      transition: all 0.2s;
      cursor: pointer;
    }

    .sc-store-item:hover {
      border-color: #f59e0b;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .sc-store-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .sc-store-item-name {
      font-size: 15px;
      font-weight: 600;
      color: #dbdee1;
    }

    .sc-store-item-version {
      font-size: 11px;
      color: #888;
      background: #1e1f22;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .sc-store-item-desc {
      font-size: 13px;
      color: #b5bac1;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .sc-store-item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sc-store-item-author {
      font-size: 12px;
      color: #888;
    }

    .sc-store-item-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .sc-store-item-tag {
      font-size: 10px;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .sc-store-item-btn {
      padding: 6px 14px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sc-store-item-btn.install {
      background: #23a55a;
      color: white;
    }

    .sc-store-item-btn.install:hover {
      background: #1a8b47;
    }

    .sc-store-item-btn.installed {
      background: #444;
      color: #b5bac1;
    }

    .sc-store-item-btn.remove {
      background: #da373c;
      color: white;
    }

    .sc-store-empty {
      text-align: center;
      padding: 40px;
      color: #888;
    }

    /* Scrollbar */
    .sc-store-content::-webkit-scrollbar {
      width: 8px;
    }

    .sc-store-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .sc-store-content::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 4px;
    }

    .sc-store-content::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
}

function setupStoreEvents(overlay: HTMLElement): void {
  // Close button
  overlay.querySelector("#sc-store-close")?.addEventListener("click", () => {
    overlay.remove();
  });

  // Backdrop click to close
  overlay.querySelector("#sc-store-backdrop")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "sc-store-backdrop") {
      overlay.remove();
    }
  });

  // Tab switching
  overlay.querySelectorAll(".sc-store-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      overlay.querySelectorAll(".sc-store-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = (tab as HTMLElement).dataset.tab as "plugins" | "themes";
      loadTab(currentTab);
    });
  });

  // Search
  overlay.querySelector("#sc-store-search")?.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    filterItems(query);
  });

  // Drag and drop
  const dropzone = overlay.querySelector("#sc-store-dropzone") as HTMLElement;
  const fileInput = overlay.querySelector("#sc-store-file-input") as HTMLInputElement;

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("drag-over");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    handleFiles(e.dataTransfer?.files);
  });

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    handleFiles(fileInput.files);
  });

  // Escape to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("sc-store-backdrop")) {
      overlay.remove();
    }
  });
}

async function handleFiles(files?: FileList | null): Promise<void> {
  if (!files) return;

  for (const file of Array.from(files)) {
    try {
      if (file.name.endsWith(".zip")) {
        const buffer = await file.arrayBuffer();
        await PluginManager.installFromZip(buffer);
        showNotification(`Installed plugin from ${file.name}`);
      } else if (file.name.endsWith(".css")) {
        const css = await file.text();
        const name = file.name.replace(".css", "");
        ThemeAPI.installFromCSS(name, css);
        showNotification(`Installed theme: ${name}`);
      }
    } catch (e: any) {
      showNotification(`Failed to install ${file.name}: ${e.message}`, true);
    }
  }

  // Refresh the current tab
  loadTab(currentTab);
}

async function loadTab(tab: "plugins" | "themes"): Promise<void> {
  const content = document.getElementById("sc-store-content");
  if (!content) return;

  content.innerHTML = '<div class="sc-store-loading">Loading from store...</div>';

  try {
    const items =
      tab === "plugins"
        ? await StoreAPI.fetchPlugins()
        : await StoreAPI.fetchThemes();

    if (items.length === 0) {
      content.innerHTML = '<div class="sc-store-empty">No items found</div>';
      return;
    }

    const grid = document.createElement("div");
    grid.className = "sc-store-grid";

    for (const item of items) {
      grid.appendChild(createItemCard(item, tab));
    }

    content.innerHTML = "";
    content.appendChild(grid);
  } catch (e) {
    content.innerHTML = '<div class="sc-store-empty">Failed to load items</div>';
  }
}

function createItemCard(item: StoreItem, type: "plugins" | "themes"): HTMLElement {
  const card = document.createElement("div");
  card.className = "sc-store-item";
  card.dataset.name = item.name.toLowerCase();
  card.dataset.tags = item.tags.join(" ").toLowerCase();

  const isInstalled =
    type === "plugins"
      ? PluginManager.get(item.name) != null
      : (window as any).Suncord?.themes?.get(item.name) != null;

  card.innerHTML = `
    <div class="sc-store-item-header">
      <span class="sc-store-item-name">${escapeHtml(item.name)}</span>
      <span class="sc-store-item-version">${escapeHtml(item.version)}</span>
    </div>
    <div class="sc-store-item-desc">${escapeHtml(item.description)}</div>
    <div class="sc-store-item-footer">
      <span class="sc-store-item-author">by ${escapeHtml(item.author)}</span>
      <div class="sc-store-item-tags">
        ${item.tags
          .slice(0, 3)
          .map((t) => `<span class="sc-store-item-tag">${escapeHtml(t)}</span>`)
          .join("")}
      </div>
      <button class="sc-store-item-btn ${isInstalled ? "installed" : "install"}">
        ${isInstalled ? "✓ Installed" : "Install"}
      </button>
    </div>
  `;

  // Install button click
  const btn = card.querySelector(".sc-store-item-btn") as HTMLButtonElement;
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (isInstalled) return;

    try {
      btn.textContent = "Installing...";
      btn.disabled = true;

      if (type === "themes" && item.rawUrl) {
        ThemeAPI.installFromURL(item.name, item.rawUrl);
      } else if (item.url) {
        // Open the URL for plugins (users need to follow install instructions)
        (window as any).SUNCORD?.openExternal?.(item.url);
      }

      btn.textContent = "✓ Installed";
      btn.classList.add("installed");
    } catch (e: any) {
      btn.textContent = "Install";
      btn.disabled = false;
      showNotification(`Failed to install ${item.name}: ${e.message}`, true);
    }
  });

  // Click card to open URL
  card.addEventListener("click", () => {
    if (item.url) {
      (window as any).SUNCORD?.openExternal?.(item.url);
    }
  });

  return card;
}

function filterItems(query: string): void {
  const items = document.querySelectorAll(".sc-store-item");
  items.forEach((item) => {
    const name = (item as HTMLElement).dataset.name || "";
    const tags = (item as HTMLElement).dataset.tags || "";
    const visible =
      name.includes(query) || tags.includes(query);
    (item as HTMLElement).style.display = visible ? "" : "none";
  });
}

function showNotification(message: string, isError = false): void {
  const notif = document.createElement("div");
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? "#da373c" : "#23a55a"};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 999999;
    animation: sc fadeIn 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
