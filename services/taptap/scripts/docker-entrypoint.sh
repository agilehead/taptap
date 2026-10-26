#!/bin/bash
set -e

echo "Starting TapTap Notification Server..."

# Ensure data directory exists for SQLite
mkdir -p "${TAPTAP_DATA_DIR:-/app/data}"

# Start the application
exec node services/taptap/node/apps/server/dist/bin/server.js
