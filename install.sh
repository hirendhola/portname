#!/bin/sh
set -e

REPO="hirendhola/portname"
INSTALL_DIR="/usr/local/bin"

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
    echo "Download manually: https://github.com/$REPO/releases"
    exit 1
    ;;
esac

echo "Detecting latest release..."
LATEST=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*$BINARY\"" \
  | cut -d '"' -f 4)

if [ -z "$LATEST" ]; then
  echo "✗ Could not find release binary."
  echo "  Download manually: https://github.com/$REPO/releases"
  exit 1
fi

echo "Downloading portname..."
curl -fL "$LATEST" -o /tmp/portname
chmod +x /tmp/portname

# try /usr/local/bin first, fallback to ~/.local/bin if no permission
if [ -w "$INSTALL_DIR" ]; then
  mv /tmp/portname "$INSTALL_DIR/portname"
  echo "✓ Installed to $INSTALL_DIR/portname"
else
  mkdir -p "$HOME/.local/bin"
  mv /tmp/portname "$HOME/.local/bin/portname"
  echo "✓ Installed to $HOME/.local/bin/portname"
  echo ""
  echo "  Add this to your shell config (~/.bashrc or ~/.zshrc):"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo ""
echo "  Run: portname --help"