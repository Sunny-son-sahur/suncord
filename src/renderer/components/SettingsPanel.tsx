// SUNCORD Settings Panel — injected into Discord's User Settings

export function injectSettingsPanel(): void {
  // Wait for Discord settings to be available
  const observer = new MutationObserver(() => {
    const settingsList =
      document.querySelector('[class*="settings"]') ||
      document.querySelector('[aria-label="User Settings"]');

    if (settingsList && !document.getElementById("suncord-settings-link")) {
      addSettingsLink(settingsList);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function addSettingsLink(settingsList: Element): void {
  // Find the settings sidebar items
  const items = settingsList.querySelectorAll('[class*="item"]');
  if (items.length === 0) return;

  // Create SUNCORD settings link
  const suncordItem = document.createElement("div");
  suncordItem.id = "suncord-settings-link";
  suncordItem.className = "suncord-settings-item";
  suncordItem.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin: 2px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #b5bac1;
      transition: background 0.2s;
    ">
      <span style="font-size: 18px;">☀</span>
      <span style="font-weight: 500;">SUNCORD</span>
    </div>
  `;

  suncordItem.addEventListener("mouseenter", () => {
    suncordItem.firstElementChild?.setAttribute(
      "style",
      `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin: 2px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #dbdee1;
      background: #35373c;
      transition: background 0.2s;
    `
    );
  });

  suncordItem.addEventListener("mouseleave", () => {
    suncordItem.firstElementChild?.setAttribute(
      "style",
      `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin: 2px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #b5bac1;
      transition: background 0.2s;
    `
    );
  });

  suncordItem.addEventListener("click", () => {
    openSuncordSettings();
  });

  // Find a good insertion point (after the "Appearance" or similar setting)
  let inserted = false;
  for (const item of items) {
    const text = item.textContent?.toLowerCase() || "";
    if (
      text.includes("appearance") ||
      text.includes("accessibility") ||
      text.includes("voice")
    ) {
      item.parentElement?.insertBefore(suncordItem, item);
      inserted = true;
      break;
    }
  }

  if (!inserted && items.length > 0) {
    // Insert at the end
    const lastItem = items[items.length - 1];
    lastItem.parentElement?.insertBefore(suncordItem, lastItem.nextSibling);
  }
}

function openSuncordSettings(): void {
  const overlay = document.createElement("div");
  overlay.id = "suncord-settings-overlay";
  overlay.innerHTML = getSettingsHTML();
  document.body.appendChild(overlay);

  const style = document.createElement("style");
  style.textContent = getSettingsStyles();
  document.head.appendChild(style);

  setupSettingsEvents(overlay);
}

function getSettingsHTML(): string {
  const plugins = (window as any).Suncord?.pluginManager?.getAll() || [];
  const themes = (window as any).Suncord?.themeManager?.getAll() || [];

  return `
    <div class="sc-settings-backdrop" id="sc-settings-backdrop">
      <div class="sc-settings-modal">
        <div class="sc-settings-header">
          <span class="sc-settings-logo">☀</span>
          <span>SUNCORD Settings</span>
          <div class="sc-settings-close" id="sc-settings-close">✕</div>
        </div>

        <div class="sc-settings-body">
          <!-- Version Info -->
          <div class="sc-settings-section">
            <div class="sc-settings-info">
              <span class="sc-settings-version">SUNCORD v1.0.0</span>
              <span class="sc-settings-tagline">Drag. Drop. Done.</span>
            </div>
          </div>

          <!-- Plugins Section -->
          <div class="sc-settings-section">
            <h3 class="sc-settings-section-title">🔌 Installed Plugins</h3>
            <div class="sc-settings-list" id="sc-plugins-list">
              ${
                plugins.length === 0
                  ? '<div class="sc-settings-empty">No plugins installed. Open the Store to get some!</div>'
                  : plugins
                      .map(
                        (p: any) => `
                <div class="sc-settings-list-item">
                  <div class="sc-settings-list-info">
                    <span class="sc-settings-list-name">${escapeHtml(p.name)}</span>
                    <span class="sc-settings-list-desc">${escapeHtml(p.description)}</span>
                  </div>
                  <label class="sc-settings-toggle">
                    <input type="checkbox" ${p.enabled ? "checked" : ""} data-plugin="${escapeHtml(p.name)}" />
                    <span class="sc-settings-toggle-slider"></span>
                  </label>
                </div>
              `
                      )
                      .join("")
              }
            </div>
          </div>

          <!-- Themes Section -->
          <div class="sc-settings-section">
            <h3 class="sc-settings-section-title">🎨 Installed Themes</h3>
            <div class="sc-settings-list" id="sc-themes-list">
              ${
                themes.length === 0
                  ? '<div class="sc-settings-empty">No themes installed. Open the Store to get some!</div>'
                  : themes
                      .map(
                        (t: any) => `
                <div class="sc-settings-list-item">
                  <div class="sc-settings-list-info">
                    <span class="sc-settings-list-name">${escapeHtml(t.name)}</span>
                    <span class="sc-settings-list-desc">${escapeHtml(t.description)} — by ${escapeHtml(t.author)}</span>
                  </div>
                  <label class="sc-settings-toggle">
                    <input type="checkbox" ${t.enabled ? "checked" : ""} data-theme="${escapeHtml(t.name)}" />
                    <span class="sc-settings-toggle-slider"></span>
                  </label>
                </div>
              `
                      )
                      .join("")
              }
            </div>
          </div>

          <!-- Open Store Button -->
          <div class="sc-settings-section" style="text-align: center;">
            <button class="sc-settings-store-btn" id="sc-open-store">☀ Open Store</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getSettingsStyles(): string {
  return `
    .sc-settings-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    }

    .sc-settings-modal {
      width: 90%;
      max-width: 600px;
      max-height: 70vh;
      background: #1e1f22;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #333;
    }

    .sc-settings-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      font-weight: 700;
      font-size: 18px;
    }

    .sc-settings-logo {
      font-size: 22px;
    }

    .sc-settings-close {
      margin-left: auto;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;
    }

    .sc-settings-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .sc-settings-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .sc-settings-section {
      margin-bottom: 20px;
    }

    .sc-settings-info {
      text-align: center;
      padding: 10px;
    }

    .sc-settings-version {
      font-size: 16px;
      font-weight: 600;
      color: #f59e0b;
      display: block;
    }

    .sc-settings-tagline {
      font-size: 13px;
      color: #888;
    }

    .sc-settings-section-title {
      font-size: 14px;
      font-weight: 600;
      color: #dbdee1;
      margin-bottom: 10px;
    }

    .sc-settings-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sc-settings-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #2b2d31;
      border-radius: 8px;
    }

    .sc-settings-list-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sc-settings-list-name {
      font-size: 14px;
      font-weight: 500;
      color: #dbdee1;
    }

    .sc-settings-list-desc {
      font-size: 12px;
      color: #888;
    }

    .sc-settings-empty {
      padding: 16px;
      text-align: center;
      color: #888;
      font-size: 13px;
    }

    /* Toggle switch */
    .sc-settings-toggle {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 22px;
      flex-shrink: 0;
    }

    .sc-settings-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .sc-settings-toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: #444;
      border-radius: 22px;
      transition: 0.2s;
    }

    .sc-settings-toggle-slider::before {
      content: "";
      position: absolute;
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.2s;
    }

    .sc-settings-toggle input:checked + .sc-settings-toggle-slider {
      background: #23a55a;
    }

    .sc-settings-toggle input:checked + .sc-settings-toggle-slider::before {
      transform: translateX(18px);
    }

    .sc-settings-store-btn {
      padding: 10px 24px;
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sc-settings-store-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
  `;
}

function setupSettingsEvents(overlay: HTMLElement): void {
  // Close
  overlay.querySelector("#sc-settings-close")?.addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector("#sc-settings-backdrop")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "sc-settings-backdrop") {
      overlay.remove();
    }
  });

  // Plugin toggles
  overlay.querySelectorAll("[data-plugin]").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const name = (e.target as HTMLInputElement).dataset.plugin!;
      (window as any).Suncord?.pluginManager?.toggle(name);
    });
  });

  // Theme toggles
  overlay.querySelectorAll("[data-theme]").forEach((toggle) => {
    toggle.addEventListener("change", (e) => {
      const name = (e.target as HTMLInputElement).dataset.theme!;
      (window as any).Suncord?.themeManager?.toggle(name);
    });
  });

  // Open Store button
  overlay.querySelector("#sc-open-store")?.addEventListener("click", () => {
    overlay.remove();
    // Lazy import to avoid circular deps
    import("./StoreWindow").then(({ StoreWindow }) => StoreWindow.open());
  });

  // Escape to close
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && document.getElementById("sc-settings-backdrop")) {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
