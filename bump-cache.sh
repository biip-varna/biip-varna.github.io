#!/usr/bin/env bash
# bump-cache.sh — increment ?v= query string on style.css and biip.js
# Usage: ./bump-cache.sh
# Run this whenever you change style.css or biip.js

set -euo pipefail

# Detect current version (take the highest number found)
CURRENT=$(grep -rho 'style\.css?v=[0-9]*' . --include="*.html" | grep -o '[0-9]*$' | sort -n | tail -1)
NEXT=$((CURRENT + 1))

echo "Bumping asset version: v=${CURRENT} → v=${NEXT}"

# Update all HTML files (handles both ../ and ./ relative paths)
find . -name "*.html" -exec sed -i \
  "s/style\.css?v=[0-9]*/style.css?v=${NEXT}/g; \
   s/biip\.js?v=[0-9]*/biip.js?v=${NEXT}/g" {} +

echo "Done. All HTML files now reference v=${NEXT}."
echo "Commit with: git add -u && git commit -m 'chore: bump asset cache version to v${NEXT}'"
