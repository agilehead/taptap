#!/bin/bash

# Stop all TapTap services (local processes and docker containers)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stopping all TapTap services..."

# Stop docker-compose services
echo "Stopping Docker Compose services..."
if [ -f "$ROOT_DIR/devenv/docker-compose.yml" ]; then
  docker compose -f "$ROOT_DIR/devenv/docker-compose.yml" down 2>/dev/null || true
fi

# Kill any local node processes related to taptap
echo "Stopping local Node.js processes..."
pkill -f "node.*taptap" 2>/dev/null || true

# Free up taptap port (5006) and test port (5016)
echo "Freeing ports 5006, 5016..."
for port in 5006 5016; do
  lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# Wait for processes to terminate
sleep 2

echo "All TapTap services stopped"
