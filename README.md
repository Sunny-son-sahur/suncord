# SUNCORD

**Drag. Drop. Done.**

A lightweight Discord client modification with a built-in store for plugins and themes. Install by dragging a `.zip` file, or browse the online store right from Discord.

---

## Features

- **Store Button** — appears in Discord's top-right corner, one click to open
- **Drag & Drop Install** — drop a `.zip` plugin or `.css` theme to install instantly
- **Online Store** — browse community plugins and themes (Vencord-compatible)
- **Theme Browser** — themes from Vencord, BetterDiscord, Powercord, and more
- **Plugin API** — build your own plugins with a clean JavaScript API
- **Settings Panel** — manage installed plugins and themes from Discord's settings
- **Auto-Save** — your plugins and themes persist across restarts

## Install

### Linux (Debian/Ubuntu)

```bash
# Download the latest .deb from Releases
sudo dpkg -i suncord_1.0.0_amd64.deb

# Or install from source
git clone https://github.com/suncord/suncord.git
cd suncord
npm install
npm run build
sudo npm run inject
```

### Linux (AppImage)

```bash
# Download the .AppImage from Releases
chmod +x suncord-x86_64.AppImage
./suncord-x86_64.AppImage
```

### Linux (RPM - Fedora/RHEL)

```bash
# Download the .rpm from Releases
sudo rpm -i suncord-1.0.0-1.x86_64.rpm
```

### Windows

```bash
# Download suncord-setup.exe from Releases
# Or build from source:
git clone https://github.com/suncord/suncord.git
cd suncord
npm install
npm run build
node scripts/inject.mjs
```

### macOS

```bash
git clone https://github.com/suncord/suncord.git
cd suncord
npm install
npm run build
node scripts/inject.mjs
```

## Usage

1. Launch Discord normally
2. Look for the **☀ Store** button in the top-right
3. Click it to browse plugins and themes
4. Or drag a `.zip` / `.css` file onto the drop zone

## Plugin Development

Create a file `my-plugin.js`:

```js
module.exports = {
  name: "My Plugin",
  description: "A custom plugin",
  version: "1.0",
  author: "You",

  settings: {
    option1: true,
  },

  start() {
    console.log("My plugin is running!");
    // Your code here
  },

  stop() {
    console.log("My plugin stopped!");
    // Cleanup here
  },
};
```

Then zip it with a `manifest.json`:

```json
{
  "name": "My Plugin",
  "description": "A custom plugin",
  "version": "1.0",
  "author": "You",
  "main": "my-plugin.js"
}
```

Drop the zip into the Store to install.

## Theme Development

Create a CSS file with metadata comments:

```css
/*
 * @name My Theme
 * @description A beautiful theme
 * @author You
 * @version 1.0
 */

:root {
  --my-color: #f59e0b;
}

[class*="sidebar"] {
  background-color: var(--my-color);
}
```

Zip it and drop it into the Store, or paste the URL into the Online Themes section.

## Compatible Sources

SUNCORD is compatible with themes and plugins from:

- **Vencord** — https://vencord.dev/plugins
- **BetterDiscord** — CSS themes work directly
- **Powercord** — Plugin structure supported
- **Community repos** — any GitHub-hosted CSS theme

## Building

```bash
# Install deps
npm install

# Build everything
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Package for Linux
npm run package:linux

# Package for Windows
npm run package:windows
```

## CI/CD

GitHub Actions automatically builds:
- `.deb` package (Debian/Ubuntu)
- `.rpm` package (Fedora/RHEL)
- `.AppImage` (universal Linux)
- `.exe` installer (Windows, via NSIS)
- Portable `.zip` (Windows)

Push a tag like `v1.0.0` to trigger a release with all packages.

## License

MIT — do whatever you want with it.

## Credits

- **Vencord** by Vendicated — inspired the plugin/theme ecosystem
- **BetterDiscord** — theme format compatibility
- **Powercord** — plugin structure reference

---

☀ **SUNCORD** — because installing plugins shouldn't be harder than using them.
