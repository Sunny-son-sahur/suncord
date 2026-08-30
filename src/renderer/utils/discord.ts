// Discord utility — waits for Discord's internal modules to be ready

const MAX_WAIT = 30000; // 30 seconds
const CHECK_INTERVAL = 500;

export async function waitForDiscord(): Promise<void> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      // Check for Discord's webpack modules
      const hasWebpack =
        (window as any).webpackChunkdiscord_app ||
        (window as any).__SUNCORD_WEBPACK__;

      // Check for Discord's React
      const hasReact = document.getElementById("app-mount") ||
        document.querySelector('[class*="appMount"]');

      // Check for Discord's guild list (indicates full load)
      const hasGuilds =
        document.querySelector('[class*="guilds"]') ||
        document.querySelector('[aria-label*="Guilds"]') ||
        document.querySelector('[data-guild-id]');

      if (hasWebpack || (hasReact && hasGuilds)) {
        // Patch webpack if not already patched
        if (!(window as any).__SUNCORD_WEBPACK__) {
          patchWebpack();
        }
        resolve();
        return;
      }

      if (Date.now() - start > MAX_WAIT) {
        // Discord might be in a different state, resolve anyway
        console.warn("[SUNCORD] Discord detection timed out, continuing anyway");
        patchWebpack();
        resolve();
        return;
      }

      setTimeout(check, CHECK_INTERVAL);
    };

    check();
  });
}

function patchWebpack(): void {
  if ((window as any).__SUNCORD_WEBPATCHED__) return;
  (window as any).__SUNCORD_WEBPATCHED__ = true;

  // Try to intercept webpack module loading
  try {
    const wpChunk = (window as any).webpackChunkdiscord_app;
    if (wpChunk) {
      const modules: Record<string, any> = {};

      // Intercept push
      const origPush = wpChunk.push.bind(wpChunk);
      wpChunk.push = function (...args: any[]) {
        const result = origPush(...args);

        // Try to extract modules from the chunk
        try {
          if (args[0] && args[0][1]) {
            const chunkModules = args[0][1];
            for (const [id, moduleFactory] of Object.entries(chunkModules)) {
              try {
                const m = { exports: {} };
                (moduleFactory as any)(m, m.exports, (id: string) => ({}));
                modules[id] = { exports: m.exports };
              } catch {}
            }
          }
        } catch {}

        return result;
      };

      (window as any).__SUNCORD_WEBPACK__ = { modules };
      console.log("[SUNCORD] Webpack patched");
    }
  } catch (e) {
    console.warn("[SUNCORD] Failed to patch webpack:", e);
  }
}
