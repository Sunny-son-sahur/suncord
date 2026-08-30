// SUNCORD Store Button — injected into Discord's top bar

import { StoreWindow } from "./StoreWindow";

let storeButtonInjected = false;

export function injectStoreButton(): void {
  if (storeButtonInjected) return;

  const observer = new MutationObserver(() => {
    // Find Discord's toolbar/title bar area
    const toolbar =
      document.querySelector('[class*="titleBar"]') ||
      document.querySelector('[class*="toolbar"]') ||
      document.querySelector('[aria-label="Toolbar"]') ||
      document.querySelector('[class*="title-"]')?.parentElement;

    if (!toolbar) return;

    // Check if our button already exists
    if (document.getElementById("suncord-store-btn")) return;

    // Find the right insertion point (before the user avatar / settings gear)
    const settingsBtn =
      toolbar.querySelector('[aria-label="User Settings"]') ||
      toolbar.querySelector('[class*="accountInfo"]') ||
      toolbar.querySelector('[class*="toolbar-"]')?.lastElementChild;

    if (!settingsBtn) return;

    // Create the Store button
    const btn = document.createElement("div");
    btn.id = "suncord-store-btn";
    btn.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        margin-right: 8px;
        border-radius: 16px;
        background: linear-gradient(135deg, #f59e0b, #f97316);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        white-space: nowrap;
        z-index: 100;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.2 8 12 11.8 4.8 8 12 4.2zM4 9.6l7 3.5v7.3l-7-3.5V9.6zm9 10.8v-7.3l7-3.5v7.3l-7 3.5z"/>
        </svg>
        Store
      </div>
    `;

    btn.addEventListener("mouseenter", () => {
      btn.firstElementChild!.setAttribute(
        "style",
        `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        margin-right: 8px;
        border-radius: 16px;
        background: linear-gradient(135deg, #f97316, #ef4444);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        white-space: nowrap;
        z-index: 100;
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      `
      );
    });

    btn.addEventListener("mouseleave", () => {
      btn.firstElementChild!.setAttribute(
        "style",
        `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        margin-right: 8px;
        border-radius: 16px;
        background: linear-gradient(135deg, #f59e0b, #f97316);
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        white-space: nowrap;
        z-index: 100;
      `
      );
    });

    btn.addEventListener("click", () => {
      openStoreWindow();
    });

    // Insert before settings button
    settingsBtn.parentElement?.insertBefore(btn, settingsBtn);
    storeButtonInjected = true;
    observer.disconnect();
    console.log("[SUNCORD] Store button injected");
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also try immediately
  setTimeout(() => {
    if (!storeButtonInjected) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }, 3000);
}

function openStoreWindow(): void {
  // Check if already open
  if (document.getElementById("suncord-store-overlay")) return;

  StoreWindow.open();
}
