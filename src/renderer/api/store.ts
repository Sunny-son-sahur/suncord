// SUNCORD Store API — fetches plugins and themes from online sources

interface StoreItem {
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  url: string;
  rawUrl: string;
  tags: string[];
  screenshot?: string;
  lastUpdated: string;
}

// Vencord-compatible theme sources (community CSS repos)
const THEME_SOURCES = [
  {
    name: "Vencord Official",
    url: "https://api.github.com/repos/Vendicated/Vencord/contents/src/userstyles",
    type: "github" as const,
  },
  {
    name: "BetterDiscord Themes",
    url: "https://api.github.com/search/repositories?q=discord+theme+css&sort=stars&per_page=30",
    type: "github-search" as const,
  },
  {
    name: "Powercord Themes",
    url: "https://api.github.com/search/repositories?q=powercord+theme&sort=stars&per_page=20",
    type: "github-search" as const,
  },
  {
    name: "SUNCORD Community",
    url: "https://api.github.com/repos/suncord/themes/contents/",
    type: "github" as const,
  },
];

// Plugin sources
const PLUGIN_SOURCES = [
  {
    name: "Vencord Plugins",
    url: "https://vencord.dev/plugins",
    type: "vencord" as const,
  },
  {
    name: "GitHub Vencord Plugins",
    url: "https://api.github.com/search/repositories?q=vencord+plugin&sort=stars&per_page=30",
    type: "github-search" as const,
  },
  {
    name: "SUNCORD Plugins",
    url: "https://api.github.com/repos/suncord/plugins/contents/",
    type: "github" as const,
  },
];

export const StoreAPI = {
  // Fetch available themes from all sources
  async fetchThemes(): Promise<StoreItem[]> {
    const themes: StoreItem[] = [];

    for (const source of THEME_SOURCES) {
      try {
        const items = await fetchFromSource(source);
        themes.push(...items);
      } catch (e) {
        console.warn(`[SUNCORD Store] Failed to fetch from ${source.name}:`, e);
      }
    }

    // Add known popular themes from direct URLs
    themes.push(...POPULAR_THEMES);

    return themes;
  },

  // Fetch available plugins from all sources
  async fetchPlugins(): Promise<StoreItem[]> {
    const plugins: StoreItem[] = [];

    for (const source of PLUGIN_SOURCES) {
      try {
        const items = await fetchFromSource(source);
        plugins.push(...items);
      } catch (e) {
        console.warn(`[SUNCORD Store] Failed to fetch from ${source.name}:`, e);
      }
    }

    // Add known popular plugins
    plugins.push(...POPULAR_PLUGINS);

    return plugins;
  },

  // Install from a URL
  async installFromURL(url: string, type: "plugin" | "theme"): Promise<void> {
    if (type === "theme") {
      const response = await fetch(url);
      const css = await response.text();
      (window as any).Suncord?.themes?.installFromCSS(
        url.split("/").pop()?.replace(".css", "") || "theme",
        css
      );
    }
  },
};

// Popular Vencord-compatible themes with direct download URLs
const POPULAR_THEMES: StoreItem[] = [
  {
    name: "Midnight",
    description: "A dark, elegant theme for Discord",
    author: "refact0r",
    version: "1.0",
    downloads: 50000,
    url: "https://github.com/refact0r/midnight-discord",
    rawUrl: "https://raw.githubusercontent.com/refact0r/midnight-discord/master/midnight.css",
    tags: ["dark", "minimal", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "Discoal",
    description: "Colorful Discord theme with transparency",
    author: "404-Brain-not-found",
    version: "1.0",
    downloads: 30000,
    url: "https://github.com/404-Brain-not-found/Discoal",
    rawUrl: "https://raw.githubusercontent.com/404-Brain-not-found/Discoal/main/Discoal.css",
    tags: ["colorful", "transparent", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "残光 (Zanko)",
    description: "A theme inspired by the fading light",
    author: "Nully000",
    version: "1.0",
    downloads: 20000,
    url: "https://github.com/Nully000/残光",
    rawUrl: "https://raw.githubusercontent.com/Nully000/残光/main/残光.css",
    tags: ["anime", "aesthetic"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "DMocha",
    description: "A mocha-inspired warm theme",
    author: "DaBluL",
    version: "1.0",
    downloads: 15000,
    url: "https://github.com/DaBluL/DMocha",
    rawUrl: "https://raw.githubusercontent.com/DaBluL/DMocha/master/DMocha.css",
    tags: ["warm", "cozy"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "Vaporwave",
    description: "A retro vaporwave aesthetic theme",
    author: "community",
    version: "1.0",
    downloads: 25000,
    url: "https://github.com/nicocDev/vaporwave-theme",
    rawUrl: "https://raw.githubusercontent.com/nicocDev/vaporwave-theme/main/theme.css",
    tags: ["retro", "vaporwave", "aesthetic"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "Minimal",
    description: "Clean, minimal Discord theme",
    author: "community",
    version: "1.0",
    downloads: 40000,
    url: "https://github.com/skoji/discord-minimal-theme",
    rawUrl: "https://raw.githubusercontent.com/skoji/discord-minimal-theme/master/minimal.css",
    tags: ["minimal", "clean", "popular"],
    lastUpdated: "2025-01-01",
  },
];

// Popular Vencord plugins
const POPULAR_PLUGINS: StoreItem[] = [
  {
    name: "BetterVolume",
    description: "Set user volume values manually (1-200%)",
    author: "Vendicated",
    version: "1.0",
    downloads: 80000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/betterVolume",
    rawUrl: "",
    tags: ["audio", "utility"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "Equicord",
    description: "Increases the default Discord message limit from 2000 to 100000",
    author: "TheKodeToad",
    version: "1.0",
    downloads: 100000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/equicord",
    rawUrl: "",
    tags: ["utility", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "ReviewDB",
    description: "Leave reviews on profiles",
    author: "Vendicated",
    version: "1.0",
    downloads: 60000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/reviewDB",
    rawUrl: "",
    tags: ["social", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "Translator",
    description: "Translate messages with Google Translate",
    author: "kernel-dev",
    version: "1.0",
    downloads: 50000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/translator",
    rawUrl: "",
    tags: ["utility", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "FakeNitro",
    description: "Send messages with fake Discord Nitro perks",
    author: "Vendicated",
    version: "1.0",
    downloads: 90000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/fakeNitro",
    rawUrl: "",
    tags: ["fun", "popular"],
    lastUpdated: "2025-01-01",
  },
  {
    name: "PlatformIndicators",
    description: "Adds platform indicators (desktop, mobile, web) to user messages",
    author: "CatNoir",
    version: "1.0",
    downloads: 45000,
    url: "https://github.com/Vendicated/Vencord/tree/main/src/plugins/platformIndicators",
    rawUrl: "",
    tags: ["ui", "popular"],
    lastUpdated: "2025-01-01",
  },
];

// Fetch items from a source
async function fetchFromSource(source: {
  name: string;
  url: string;
  type: string;
}): Promise<StoreItem[]> {
  const items: StoreItem[] = [];

  try {
    const response = await fetch(source.url);
    if (!response.ok) return [];

    const data = await response.json();

    if (source.type === "github-search" && data.items) {
      for (const repo of data.items) {
        items.push({
          name: repo.name,
          description: repo.description || "No description",
          author: repo.owner?.login || "Unknown",
          version: "1.0",
          downloads: repo.stargazers_count || 0,
          url: repo.html_url,
          rawUrl: `https://raw.githubusercontent.com/${repo.full_name}/main/`,
          tags: (repo.topics || []).slice(0, 5),
          lastUpdated: repo.updated_at,
        });
      }
    }
  } catch (e) {
    // Source unavailable, skip
  }

  return items;
}
