#!/bin/sh
# Suncord Installer for Linux
# Usage: sh -c "$(curl -sS https://sunny-son-sahur.github.io/suncord/install.sh)"
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="Sunny-son-sahur/suncord"
INSTALL_DIR="$HOME/.local/share/suncord"

echo -e "${CYAN}╔═══════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ☀ SUNCORD Installer        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════╝${NC}"
echo ""

# Reject root
if [ "$(id -u)" = "0" ]; then
    echo -e "${RED}Error: Don't run as root. If Discord needs sudo, re-run with sudo.${NC}"
    exit 1
fi

# Find Discord
echo -e "${YELLOW}Looking for Discord...${NC}"
DISCORD_RESOURCES=""

for candidate in \
    "$HOME/.config/discord" \
    "$HOME/.local/share/discord" \
    "/usr/share/discord" \
    "/usr/lib64/discord" \
    "/opt/discord" \
    "$HOME/.var/app/com.discordapp.Discord/config/discord"; do

    if [ -d "$candidate" ]; then
        LATEST=$(ls -d "$candidate"/app-* 2>/dev/null | sort -V | tail -1)
        if [ -n "$LATEST" ] && [ -f "$LATEST/resources/app.asar" ]; then
            DISCORD_RESOURCES="$LATEST/resources"
            break
        fi
    fi
done

if [ -z "$DISCORD_RESOURCES" ]; then
    echo -e "${RED}Could not find Discord.${NC}"
    echo "Searched: ~/.config/discord, ~/.local/share/discord, /usr/share/discord, /usr/lib64/discord, /opt/discord, Flatpak"
    exit 1
fi

echo -e "${GREEN}Found: $DISCORD_RESOURCES${NC}"

# If already patched, restore first
if [ -f "$DISCORD_RESOURCES/_app.asar" ]; then
    echo -e "${YELLOW}Previous install detected. Updating...${NC}"
    cp "$DISCORD_RESOURCES/_app.asar" "$DISCORD_RESOURCES/app.asar"
fi

# Download dist files
echo -e "${YELLOW}Downloading Suncord...${NC}"
mkdir -p "$INSTALL_DIR"

for file in patcher.js renderer.js preload.cjs; do
    curl -sSL -o "$INSTALL_DIR/$file" \
        "https://github.com/$REPO/releases/latest/download/$file" || {
        echo -e "${RED}Failed to download $file${NC}"
        exit 1
    }
done

echo -e "${GREEN}Files downloaded to $INSTALL_DIR${NC}"

# Backup original
cp "$DISCORD_RESOURCES/app.asar" "$DISCORD_RESOURCES/_app.asar"

# Create stub asar
STUB_DIR=$(mktemp -d)
trap "rm -rf $STUB_DIR" EXIT

cat > "$STUB_DIR/package.json" << 'EOF'
{"name":"discord","main":"index.js"}
EOF

cat > "$STUB_DIR/index.js" << EOF
require("${INSTALL_DIR}/patcher.js");
EOF

rm -f "$DISCORD_RESOURCES/app.asar"
npx @electron/asar pack "$STUB_DIR" "$DISCORD_RESOURCES/app.asar" 2>/dev/null

if [ ! -f "$DISCORD_RESOURCES/app.asar" ]; then
    echo -e "${RED}Failed to create stub. Restoring original...${NC}"
    cp "$DISCORD_RESOURCES/_app.asar" "$DISCORD_RESOURCES/app.asar"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Suncord installed! Restart      ║${NC}"
echo -e "${GREEN}║         Discord to apply.         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════╝${NC}"
echo ""
echo -e "Uninstall: ${CYAN}curl -sS https://sunny-son-sahur.github.io/suncord/uninstall.sh | sh${NC}"
