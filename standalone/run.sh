#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js was not found."
  echo "Install Node.js 20 or later and run this script again."
  exit 1
fi

# Reinstall if the pinned dependency is missing or out of date.
if ! node -e "const expected = require('./package.json').dependencies['playwright-core']; const locked = require('./package-lock.json').packages['node_modules/playwright-core'].version; const installed = require('./node_modules/playwright-core/package.json').version; process.exit(expected === locked && locked === installed ? 0 : 1)" >/dev/null 2>&1; then
  echo "[SETUP] Installing the pinned local dependency..."
  npm ci --no-audit --no-fund
fi

exec node src/index.mjs "$@"
