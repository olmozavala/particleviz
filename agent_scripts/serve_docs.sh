#!/usr/bin/env bash
# Build the docs site and serve locally from docs/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

uv run python docs/build_site.py --local

PORT="${1:-4000}"
echo "Serving at http://localhost:${PORT}/"
exec python -m http.server "$PORT" --directory docs
