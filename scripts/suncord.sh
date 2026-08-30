#!/bin/bash
# SUNCORD Launcher — injects SUNCORD into Discord
# Works on: Ubuntu, Debian, Fedora, Nobara, Arch, Manjaro, Flatpak

set -e

SUNCORD_DIR="$(cd "$(dirname "$0")" && pwd)"

# All known Discord install paths
DISCORD_PATHS=(
  # Native package (Debian/Ubuntu)
  "/opt/discord"
  "/usr/lib/discord"
  # Native package (Fedora/Nobara/RHEL)
  "/usr/lib64/discord"
  "/usr/share/discord"
  # Manual install
  "$HOME/.local/share/discord"
  # Snap
  "/snap/discord/current/opt/Discord"
  # Flatpak — standard
  "$HOME/.var/app/com.discordapp.Discord"
  # Flatpak — newer naming
  "$HOME/.var/app/discord.Discord"
  # Arch
  "/opt/Discord"
)

# Find Discord installation
find_discord() {
  # Check each known path
  for p in "${DISCORD_PATHS[@]}"; do
    if [ -d "$p" ] && [ -d "$p/resources" ]; then
      echo "$p"
      return 0
    fi
  done

  # Try to find via which/command
  if command -v discord &> /dev/null; then
    local resolved
    resolved="$(readlink -f "$(which discord)" 2>/dev/null || true)"
    if [ -n "$resolved" ]; then
      local dir
      dir="$(dirname "$(dirname "$resolved")")"
      if [ -d "$dir/resources" ]; then
        echo "$dir"
        return 0
      fi
    fi
  fi

  # Flatpak — check runtime
  if command -v flatpak &> /dev/null; then
    local flatpak_dir
    flatpak_dir="$(flatpak info --show-location com.discordapp.Discord 2>/dev/null || true)"
    if [ -n "$flatpak_dir" ] && [ -d "$flatpak_dir" ]; then
      echo "$flatpak_dir"
      return 0
    fi
  fi

  return 1
}

# Patch Discord's app.asar to load SUNCORD
patch_discord() {
  local discord_dir="$1"
  local asar_path="$discord_dir/resources/app.asar"

  if [ ! -f "$asar_path" ]; then
    echo "Error: app.asar not found at $asar_path"
    exit 1
  fi

  # Backup original
  if [ ! -f "$asar_path.bak" ]; then
    cp "$asar_path" "$asar_path.bak"
    echo "✓ Backed up app.asar"
  fi

  # Check if already patched
  local tmp_check=$(mktemp -d)
  npx asar extract "$asar_path" "$tmp_check" 2>/dev/null
  local main_file
  main_file=$(find "$tmp_check" -name "*.js" -not -path "*/node_modules/*" | head -1)

  if [ -n "$main_file" ] && grep -q "SUNCORD" "$main_file" 2>/dev/null; then
    echo "Already patched! Launch Discord to use SUNCORD."
    rm -rf "$tmp_check"
    return 0
  fi
  rm -rf "$tmp_check"

  # Extract, patch, repackage
  local tmp_dir=$(mktemp -d)
  npx asar extract "$asar_path" "$tmp_dir"

  main_file=$(find "$tmp_dir" -name "*.js" -not -path "*/node_modules/*" | head -1)
  if [ -z "$main_file" ]; then
    # Fallback: any .js file
    main_file=$(find "$tmp_dir" -name "*.js" | head -1)
  fi

  if [ -n "$main_file" ]; then
    echo "require('$SUNCORD_DIR/dist/injector.js');" | cat - "$main_file" > "$main_file.tmp"
    mv "$main_file.tmp" "$main_file"
    npx asar pack "$tmp_dir" "$asar_path"
    echo "✓ SUNCORD patched into Discord!"
  else
    echo "Error: Could not find Discord's main JS file"
    rm -rf "$tmp_dir"
    exit 1
  fi

  rm -rf "$tmp_dir"
}

# Unpatch Discord
unpatch_discord() {
  local discord_dir="$1"
  local asar_path="$discord_dir/resources/app.asar"

  if [ -f "$asar_path.bak" ]; then
    mv "$asar_path.bak" "$asar_path"
    echo "✓ Discord restored to original state"
  else
    echo "No backup found. Cannot restore."
  fi
}

# Show status
show_status() {
  local discord_dir="$1"
  local asar_path="$discord_dir/resources/app.asar"

  if [ -f "$asar_path.bak" ]; then
    echo "Status: SUNCORD is installed"
  else
    echo "Status: SUNCORD is NOT installed"
  fi
}

# Main
case "${1:-install}" in
  install)
    echo "☀ SUNCORD Installer"
    echo "==================="
    discord_dir=$(find_discord)
    if [ -z "$discord_dir" ]; then
      echo "Error: Discord not found."
      echo ""
      echo "Install Discord first:"
      echo "  Ubuntu/Debian: sudo apt install discord"
      echo "  Fedora/Nobara: sudo dnf install discord"
      echo "  Arch: yay -S discord"
      echo "  Flatpak: flatpak install com.discordapp.Discord"
      exit 1
    fi
    echo "Found Discord at: $discord_dir"
    patch_discord "$discord_dir"
    echo ""
    echo "Done! Launch Discord to use SUNCORD."
    ;;
  uninstall)
    echo "☀ SUNCORD Uninstaller"
    discord_dir=$(find_discord)
    if [ -z "$discord_dir" ]; then
      echo "Error: Discord not found."
      exit 1
    fi
    unpatch_discord "$discord_dir"
    echo "Done! Discord has been restored."
    ;;
  launch)
    discord_dir=$(find_discord)
    if [ -z "$discord_dir" ]; then
      echo "Error: Discord not found."
      exit 1
    fi
    SUNCORD_ENABLED=1 "$discord_dir/Discord" "$@"
    ;;
  status)
    discord_dir=$(find_discord)
    if [ -z "$discord_dir" ]; then
      echo "Discord not found."
      exit 1
    fi
    echo "Discord: $discord_dir"
    show_status "$discord_dir"
    ;;
  *)
    echo "Usage: $0 {install|uninstall|launch|status}"
    exit 1
    ;;
esac
