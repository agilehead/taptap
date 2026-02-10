#!/bin/bash
set -e

echo "Starting TapTap Notification Server..."

# Ensure data directory exists for SQLite
mkdir -p "${TAPTAP_DATA_DIR:-/app/data}"

# Start the application
exec ./scripts/start.sh
