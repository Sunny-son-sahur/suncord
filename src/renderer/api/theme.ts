// SUNCORD Theme API — manages CSS themes for Discord

export interface SuncordTheme {
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  css: string;
  authorId?: string;
  invites?: string[];
}

export const ThemeAPI = {
  // Get all loaded themes
  getAll(): SuncordTheme[] {
    return (window as any).Suncord?.themeManager?.getAll() ?? [];
  },

  // Get a specific theme
  get(name: string): SuncordTheme | undefined {
    return (window as any).Suncord?.themeManager?.get(name);
  },

  // Install a theme from CSS text
  installFromCSS(name: string, css: string, meta?: Partial<SuncordTheme>): void {
    (window as any).Suncord?.themeManager?.installFromCSS(name, css, meta);
  },

  // Install from a URL (fetches the CSS)
  async installFromURL(url: string): Promise<void> {
    const response = await fetch(url);
    const css = await response.text();

    // Parse metadata from CSS comments
    const meta = parseThemeMetadata(css);
    const name = meta.name || url.split("/").pop()?.replace(".css", "") || "Unknown";

    (window as any).Suncord?.themeManager?.installFromCSS(name, css, meta);
  },

  // Toggle a theme on/off
  toggle(name: string): void {
    (window as any).Suncord?.themeManager?.toggle(name);
  },

  // Inject CSS into the page
  injectCSS(id: string, css: string): void {
    let style = document.getElementById(`suncord-theme-${id}`);
    if (!style) {
      style = document.createElement("style");
      style.id = `suncord-theme-${id}`;
      document.head.appendChild(style);
    }
    style.textContent = css;
  },

  // Remove injected CSS
  removeCSS(id: string): void {
    const style = document.getElementById(`suncord-theme-${id}`);
    if (style) style.remove();
  },
};

// Parse @name, @description, @author, @version from CSS comment block
function parseThemeMetadata(css: string): Partial<SuncordTheme> {
  const meta: Partial<SuncordTheme> = {};

  const patterns: [RegExp, keyof SuncordTheme][] = [
    [/@name\s+(.+)/, "name"],
    [/@description\s+(.+)/, "description"],
    [/@author\s+(.+)/, "author"],
    [/@version\s+(.+)/, "version"],
    [/@authorId\s+(.+)/, "authorId"],
  ];

  for (const [pattern, key] of patterns) {
    const match = css.match(pattern);
    if (match) (meta as any)[key] = match[1].trim();
  }

  return meta;
}
