// SUNCORD Theme Manager — handles loading, saving, and CSS injection of themes

import { SuncordTheme } from "../api/theme";

class ThemeManagerClass {
  private themes: Map<string, SuncordTheme> = new Map();

  async loadAll(): Promise<void> {
    try {
      const saved = localStorage.getItem("suncord-themes");
      if (saved) {
        const list: SuncordTheme[] = JSON.parse(saved);
        for (const theme of list) {
          this.themes.set(theme.name, theme);

          // Re-inject enabled themes
          if (theme.enabled) {
            this.injectCSS(theme);
          }
        }
      }
    } catch (e) {
      console.error("[SUNCORD] Failed to load themes:", e);
    }
  }

  getAll(): SuncordTheme[] {
    return Array.from(this.themes.values());
  }

  get(name: string): SuncordTheme | undefined {
    return this.themes.get(name);
  }

  installFromCSS(
    name: string,
    css: string,
    meta?: Partial<SuncordTheme>
  ): void {
    const theme: SuncordTheme = {
      name: meta?.name || name,
      description: meta?.description || "",
      version: meta?.version || "1.0",
      author: meta?.author || "Unknown",
      enabled: true,
      css,
      authorId: meta?.authorId,
      invites: meta?.invites,
    };

    this.themes.set(theme.name, theme);
    this.injectCSS(theme);
    this.save();

    console.log(`[SUNCORD] Installed theme: ${theme.name}`);
  }

  installFromURL(name: string, url: string): void {
    // Fetch CSS from URL
    fetch(url)
      .then((r) => r.text())
      .then((css) => {
        const meta = parseThemeMetadata(css);
        this.installFromCSS(name, css, { ...meta, name });
      })
      .catch((e) => {
        console.error(`[SUNCORD] Failed to fetch theme from ${url}:`, e);
      });
  }

  toggle(name: string): void {
    const theme = this.themes.get(name);
    if (!theme) return;

    theme.enabled = !theme.enabled;

    if (theme.enabled) {
      this.injectCSS(theme);
    } else {
      this.removeCSS(theme.name);
    }

    this.save();
  }

  async uninstall(name: string): Promise<void> {
    const theme = this.themes.get(name);
    if (!theme) return;

    this.removeCSS(name);
    this.themes.delete(name);
    this.save();
    console.log(`[SUNCORD] Uninstalled theme: ${name}`);
  }

  // Install from zip
  async installFromZip(buffer: ArrayBuffer): Promise<string> {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);

    // Find CSS files
    const cssFiles = Object.keys(zip.files).filter(
      (f) => f.endsWith(".css") && !zip.files[f].dir
    );

    if (cssFiles.length === 0) {
      throw new Error("No .css files found in zip");
    }

    for (const file of cssFiles) {
      const css = await zip.file(file)!.async("text");
      const meta = parseThemeMetadata(css);
      const name = meta.name || file.replace(".css", "").split("/").pop() || "theme";
      this.installFromCSS(name, css, meta);
    }

    return cssFiles[0].replace(".css", "").split("/").pop() || "theme";
  }

  private injectCSS(theme: SuncordTheme): void {
    let style = document.getElementById(`suncord-theme-${theme.name}`);
    if (!style) {
      style = document.createElement("style");
      style.id = `suncord-theme-${theme.name}`;
      document.head.appendChild(style);
    }
    style.textContent = theme.css;
  }

  private removeCSS(name: string): void {
    const style = document.getElementById(`suncord-theme-${name}`);
    if (style) style.remove();
  }

  private save(): void {
    const list = Array.from(this.themes.values());
    localStorage.setItem("suncord-themes", JSON.stringify(list));
  }
}

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

export const ThemeManager = new ThemeManagerClass();
