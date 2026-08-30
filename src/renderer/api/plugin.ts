// SUNCORD Plugin API — the interface plugins use to hook into Discord

export interface SuncordPlugin {
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  settings?: Record<string, any>;

  // Lifecycle
  start?: () => void | Promise<void>;
  stop?: () => void | Promise<void>;

  // Settings definition
  settingsDefinition?: PluginSetting[];
}

export interface PluginSetting {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  default: any;
  options?: { label: string; value: any }[];
  description?: string;
}

// Plugin API exposed to plugins
export const PluginAPI = {
  // Get all loaded plugins
  getAll(): SuncordPlugin[] {
    return (window as any).Suncord?.pluginManager?.getAll() ?? [];
  },

  // Get a specific plugin
  get(name: string): SuncordPlugin | undefined {
    return (window as any).Suncord?.pluginManager?.get(name);
  },

  // Register a plugin programmatically
  register(plugin: SuncordPlugin): void {
    (window as any).Suncord?.pluginManager?.register(plugin);
  },

  // Find Discord modules (for plugin developers)
  findModule(filter: (m: any) => boolean): any {
    return findWebpackModule(filter);
  },

  findModules(filter: (m: any) => boolean): any[] {
    return findWebpackModules(filter);
  },

  // Patch a function
  patch(
    moduleName: string,
    functionName: string,
    callback: (args: any[], result: any) => any
  ): () => void {
    return patchFunction(moduleName, functionName, callback);
  },

  // Add a toolbar button
  addButton(id: string, label: string, icon: string, onClick: () => void): void {
    // Handled by the component system
    (window as any).Suncord?.components?.addButton?.(id, label, icon, onClick);
  },

  // Add a settings panel
  addSettingsPanel(id: string, title: string, component: React.ComponentType): void {
    (window as any).Suncord?.components?.addSettingsPanel?.(id, title, component);
  },

  // Show a notification
  showNotification(title: string, body: string, options?: NotificationOptions): void {
    // Use Discord's notification system if available
    try {
      const notif = new Notification(title, { body, ...options });
      return;
    } catch {
      console.log(`[SUNCORD] ${title}: ${body}`);
    }
  },

  // Logger
  logger: {
    info: (...args: any[]) => console.log("[SUNCORD:INFO]", ...args),
    warn: (...args: any[]) => console.warn("[SUNCORD:WARN]", ...args),
    error: (...args: any[]) => console.error("[SUNCORD:ERROR]", ...args),
    debug: (...args: any[]) => console.debug("[SUNCORD:DEBUG]", ...args),
  },
};

// Webpack module finder
function findWebpackModule(filter: (m: any) => boolean): any {
  const wp = (window as any).__SUNCORD_WEBPACK__;
  if (!wp) return null;

  for (const id of Object.keys(wp.modules)) {
    try {
      const m = wp.modules[id];
      if (filter(m.exports)) return m.exports;
    } catch {}
  }
  return null;
}

function findWebpackModules(filter: (m: any) => boolean): any[] {
  const wp = (window as any).__SUNCORD_WEBPACK__;
  if (!wp) return [];

  const results: any[] = [];
  for (const id of Object.keys(wp.modules)) {
    try {
      const m = wp.modules[id];
      if (filter(m.exports)) results.push(m.exports);
    } catch {}
  }
  return results;
}

function patchFunction(
  moduleName: string,
  functionName: string,
  callback: (args: any[], result: any) => any
): () => void {
  // Store patches for cleanup
  const patches: (() => void)[] = [];

  const check = setInterval(() => {
    const mod = findWebpackModule(
      (m) => m?.[functionName] && m?.constructor?.name !== "Object"
    );
    if (mod && mod[functionName]) {
      clearInterval(check);

      const original = mod[functionName];
      mod[functionName] = function (...args: any[]) {
        const result = original.apply(this, args);
        return callback(args, result);
      };

      patches.push(() => {
        mod[functionName] = original;
      });
    }
  }, 100);

  return () => {
    clearInterval(check);
    patches.forEach((unpatch) => unpatch());
  };
}
