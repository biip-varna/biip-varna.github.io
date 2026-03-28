#!/usr/bin/env bash
# bump-cache.sh — manage ?v= cache-busting on style.css and biip.js
#
# Usage:
#   ./bump-cache.sh              — increment version (after CSS/JS changes)
#   ./bump-cache.sh --normalize  — set all files to current max (after new HTML files added)

set -euo pipefail

NORMALIZE=false
[[ "${1:-}" == "--normalize" ]] && NORMALIZE=true

# Detect current highest version across all HTML files
CURRENT=$(grep -rho 'style\.css?v=[0-9]*' . --include="*.html" | grep -o '[0-9]*$' | sort -n | tail -1)

if $NORMALIZE; then
  NEXT=$CURRENT
  echo "Normalizing all HTML files to v=${CURRENT}"
else
  NEXT=$((CURRENT + 1))
  echo "Bumping asset version: v=${CURRENT} → v=${NEXT}"
fi

find . -name "*.html" -exec sed -i \
  "s/style\.css?v=[0-9]*/style.css?v=${NEXT}/g; \
   s/biip\.js?v=[0-9]*/biip.js?v=${NEXT}/g" {} +

echo "Done. All HTML files now reference v=${NEXT}."
