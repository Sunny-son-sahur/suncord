#!/bin/bash
# SUNCORD Launcher — injects SUNCORD into Discord

set -e

SUNCORD_DIR="$(cd "$(dirname "$0")" && pwd)"
DISCORD_PATHS=(
  "/opt/discord"
  "/usr/lib/discord"
  "$HOME/.local/share/discord"
  "/snap/discord/current/opt/Discord"
)

# Find Discord installation
find_discord() {
  for path in "${DISCORD_PATHS[@]}"; do
    if [ -d "$path" ]; then
      echo "$path"
      return 0
    fi
  done

  # Try to find via which
  if command -v discord &> /dev/null; then
    dirname "$(dirname "$(readlink -f "$(which discord)")")"
    return 0
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
    echo "Backed up original app.asar"
  fi

  # Extract, patch, repackage
  local tmp_dir=$(mktemp -d)
  npx asar extract "$asar_path" "$tmp_dir"

  # Add SUNCORD inject to the main entry
  local main_file=$(find "$tmp_dir" -name "*.js" | head -1)
  if [ -n "$main_file" ]; then
    # Prepend our injector
    echo "require('$SUNCORD_DIR/dist/injector.js');" | cat - "$main_file" > "$main_file.tmp"
    mv "$main_file.tmp" "$main_file"
    npx asar pack "$tmp_dir" "$asar_path"
    echo "SUNCORD patched into Discord!"
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
    echo "Discord restored to original state"
  else
    echo "No backup found. Cannot restore."
  fi
}

# Main
case "${1:-install}" in
  install)
    echo "☀ SUNCORD Installer"
    echo "==================="
    discord_dir=$(find_discord)
    if [ -z "$discord_dir" ]; then
      echo "Error: Discord not found. Install Discord first."
      exit 1
    fi
    echo "Found Discord at: $discord_dir"
    patch_discord "$discord_dir"
    echo ""
    echo "Done! Launch Discord to use SUNCORD."
    echo "The Store button will appear in the top-right of Discord."
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
    # Launch with SUNCORD env var
    SUNCORD_ENABLED=1 "$discord_dir/Discord" "$@"
    ;;
  *)
    echo "Usage: $0 {install|uninstall|launch}"
    exit 1
    ;;
esac
