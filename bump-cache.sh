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

# Keep sw.js in sync — update pre-cached asset versions and bump cache version
SW_CACHE_CURRENT=$(grep -o "biip-v[0-9]*'" sw.js | grep -o '[0-9]*' | tail -1)
SW_CACHE_NEXT=$((SW_CACHE_CURRENT + 1))
sed -i \
  "s/style\.css?v=[0-9]*/style.css?v=${NEXT}/g; \
   s/biip\.js?v=[0-9]*/biip.js?v=${NEXT}/g; \
   s/biip-v[0-9]*/biip-v${SW_CACHE_NEXT}/g" sw.js

echo "Done. All HTML files and sw.js now reference v=${NEXT} (sw cache: biip-v${SW_CACHE_NEXT})."
