#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
exec node services/taptap/scripts/start.mjs "${1:-csharp}"
