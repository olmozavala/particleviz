#!/usr/bin/env bash
# Build and serve docs with the same /particleviz/ URLs as GitHub Pages.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

uv run python docs/build_site.py

PORT="${1:-4000}"
PREVIEW_LINK="docs"
if [[ ! -e particleviz ]] || [[ -L particleviz ]]; then
  ln -sfn docs particleviz
else
  echo "Warning: ./particleviz exists and is not a symlink; using it for /particleviz/ URLs." >&2
  PREVIEW_LINK="particleviz"
fi

REDIRECT_FILE="$ROOT/.docs_preview_index.html"
cat > "$REDIRECT_FILE" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/particleviz/">
  <title>Particle Viz docs</title>
</head>
<body>
  <p><a href="/particleviz/">Open Particle Viz documentation</a></p>
</body>
</html>
EOF
ln -sfn "$REDIRECT_FILE" "$ROOT/index.html"
cleanup() {
  rm -f "$ROOT/index.html" "$REDIRECT_FILE"
}
trap cleanup EXIT INT TERM

echo "Serving at http://localhost:${PORT}/ (redirects to /particleviz/)"
exec python -m http.server "$PORT"
