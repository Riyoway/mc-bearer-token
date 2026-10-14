#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js was not found."
  echo "Install Node.js 18 or later and run this script again."
  exit 1
fi

if [ ! -f "node_modules/playwright-core/package.json" ]; then
  echo "[SETUP] Installing the pinned local dependency..."
  npm ci --no-audit --no-fund
fi

exec node src/index.mjs "$@"
