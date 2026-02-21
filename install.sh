#!/bin/sh
set -e

REPO="hirendhola/portname"
INSTALL_DIR="/usr/local/bin"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)
    BINARY="portname-linux"
    ;;
  Darwin*)
    if [ "$ARCH" = "arm64" ]; then
      BINARY="portname-macos-arm64"
    else
      BINARY="portname-macos"
    fi
    ;;
  *)
    echo "Unsupported OS: $OS"
    echo "Download manually from https://github.com/$REPO/releases"
    exit 1
    ;;
esac

# Get latest release URL
LATEST=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*$BINARY" \
  | cut -d '"' -f 4)

if [ -z "$LATEST" ]; then
  echo "Could not find release. Check https://github.com/$REPO/releases"
  exit 1
fi

echo "Downloading portname..."
curl -L "$LATEST" -o /tmp/portname
chmod +x /tmp/portname
mv /tmp/portname "$INSTALL_DIR/portname"

echo "✓ portname installed to $INSTALL_DIR/portname"
echo "  Run: portname --help"
