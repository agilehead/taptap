#!/usr/bin/env bash
# -------------------------------------------------------------------
# format-all.sh – Run prettier across all TypeScript and JavaScript files
# -------------------------------------------------------------------
set -euo pipefail

# Change to the project root directory
cd "$(dirname "$0")/.."

echo "=== Formatting TapTap ==="

# Source and tests follow the product's implementation owner.
./node_modules/.bin/prettier --write --ignore-unknown --no-error-on-unmatched-pattern \
  "*.json" "scripts/*.mjs" \
  "services/taptap/node/packages/*/src/**/*.ts" \
  "services/taptap/node/packages/*/package.json" \
  "services/taptap/node/packages/*/tests/**/*.ts" \
  "services/taptap/database/taptap/sqlite/schema.d.ts" \
  "services/taptap/**/*.mjs"

echo "=== Formatting completed ==="
