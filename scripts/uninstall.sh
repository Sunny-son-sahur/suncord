#!/bin/sh
# Suncord Uninstaller for Linux
# Usage: curl -sS https://sunny-son-sahur.github.io/suncord/uninstall.sh | sh
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="$HOME/.local/share/suncord"

echo -e "${CYAN}╔═══════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ☀ SUNCORD Uninstaller        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════╝${NC}"
echo ""

# Find Discord
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
        if [ -n "$LATEST" ]; then
            # Check for either patched or original
            if [ -f "$LATEST/resources/_app.asar" ] || [ -f "$LATEST/resources/app.asar" ]; then
                DISCORD_RESOURCES="$LATEST/resources"
                break
            fi
        fi
    fi
done

if [ -z "$DISCORD_RESOURCES" ]; then
    echo -e "${RED}Could not find Discord.${NC}"
    exit 1
fi

# Restore original
if [ -f "$DISCORD_RESOURCES/_app.asar" ]; then
    rm -f "$DISCORD_RESOURCES/app.asar"
    cp "$DISCORD_RESOURCES/_app.asar" "$DISCORD_RESOURCES/app.asar"
    rm -f "$DISCORD_RESOURCES/_app.asar"
    echo -e "${GREEN}Restored original Discord app.asar${NC}"
else
    echo -e "${YELLOW}Discord doesn't appear to be patched.${NC}"
fi

# Remove downloaded files
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}Removed $INSTALL_DIR${NC}"
fi

echo ""
echo -e "${GREEN}Suncord uninstalled. Restart Discord.${NC}"
