#!/bin/bash
# One-Flow Mac/Linux Shortcut Generator

echo "Creating One-Flow Desktop Shortcut for Mac/Linux..."

# Get absolute path to index.html
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
FILE_PATH="$DIR/index.html"

# Desktop path
DESKTOP_PATH="$HOME/Desktop/One-Flow.url"

# Create a simple .url file (compatible with macOS Safari/Chrome)
echo "[InternetShortcut]" > "$DESKTOP_PATH"
echo "URL=file://$FILE_PATH" >> "$DESKTOP_PATH"

chmod +x "$DESKTOP_PATH"

echo "----------------------------------------------------"
echo "Success! One-Flow shortcut created on your Desktop."
echo "You can now double-click it to start your sessions."
echo "----------------------------------------------------"
