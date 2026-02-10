#!/bin/bash

# Start script for TapTap server
# Get the script's directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check if we're in Docker (entrypoint copies this to /app)
if [ -f "/app/node/packages/taptap-server/dist/bin/server.js" ]; then
    cd /app/node/packages/taptap-server
elif [ -d "$SCRIPT_DIR/../node/packages/taptap-server" ]; then
    cd "$SCRIPT_DIR/../node/packages/taptap-server"
else
    echo "Error: Cannot find taptap-server package"
    exit 1
fi

# Start the server
node dist/bin/server.js
