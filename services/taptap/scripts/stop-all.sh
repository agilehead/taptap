#!/usr/bin/env bash
# Stop this checkout's selected application without killing other repositories.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT_DIR"
docker compose -f services/taptap/docker/development/docker-compose.yml stop taptap taptap-migrations

while read -r pid executable arguments; do
  [[ "$(readlink "/proc/$pid/cwd" 2>/dev/null || true)" == "$ROOT_DIR" ]] || continue
  case "$executable" in
    dotnet|*/dotnet)
      [[ "$arguments" == *"services/taptap/csharp/apps/TapTap.Server/"*"TapTap.Server.dll"* ]] || continue
      ;;
    */services/taptap/csharp/apps/TapTap.Server/*/TapTap.Server) ;;
    *) continue ;;
  esac
  kill -TERM "$pid" 2>/dev/null || true
done < <(ps -eo pid=,args=)
echo "Requested shutdown of this checkout's TapTap applications."
