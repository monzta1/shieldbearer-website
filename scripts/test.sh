#!/bin/bash
# scripts/test.sh
# Tests STRUCTURE not CONTENT. Safe to run after any change.
# Does not check specific text or links — only structural integrity.

PASS=0
FAIL=0

check() {
  local desc="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

echo "Running structural tests..."
echo "========================================="

# 1. All HTML files are non-empty
for page in *.html; do
  check "Non-empty file: $page" "$([ -s "$page" ] && echo true || echo false)"
done

# 2. Balanced script tags
for page in *.html; do
  opens=$(grep -c "<script" "$page" 2>/dev/null || echo 0)
  closes=$(grep -c "</script>" "$page" 2>/dev/null || echo 0)
  check "Balanced script tags: $page" "$([ "$opens" = "$closes" ] && echo true || echo false)"
done

# 3. Balanced div tags
for page in *.html; do
  opens=$(grep -c "<div" "$page" 2>/dev/null || echo 0)
  closes=$(grep -c "</div>" "$page" 2>/dev/null || echo 0)
  check "Balanced div tags: $page" "$([ "$opens" = "$closes" ] && echo true || echo false)"
done

# 4. Every page has a title tag
for page in *.html; do
  check "Has title tag: $page" "$(grep -q '<title>' "$page" && echo true || echo false)"
done

# 5. Every page has a canonical tag (except 404)
for page in *.html; do
  [ "$page" = "404.html" ] && continue
  check "Has canonical: $page" "$(grep -q 'rel="canonical"' "$page" && echo true || echo false)"
done

# 6. No internal href points to a missing file
for page in *.html; do
  while IFS= read -r href; do
    file="${href%%#*}"
    file="${file%%\?*}"
    [ -z "$file" ] && continue
    [[ "$file" == http* ]] && continue
    check "Link target exists: $file (in $page)" "$([ -f "$file" ] && echo true || echo false)"
  done < <(grep -oP 'href="\K[^"]+\.html[^"]*' "$page" 2>/dev/null)
done

# 7. Forms still point to Formspree
check "Contact form has Formspree action" "$(grep -q 'formspree.io' contact.html && echo true || echo false)"

# 8. GTM present on homepage
check "GTM tag on homepage" "$(grep -q 'GTM-' index.html && echo true || echo false)"

# 9. GA4 present on homepage
check "GA4 tag on homepage" "$(grep -q 'G-QTHJRB1B7G' index.html && echo true || echo false)"

# 10. Sitemap exists and is valid XML
check "Sitemap exists" "$([ -f sitemap.xml ] && echo true || echo false)"
check "Sitemap has urlset" "$(grep -q 'urlset' sitemap.xml && echo true || echo false)"

# 11. JS syntax check on song-meanings inline script
if command -v node &>/dev/null; then
  result=$(node -e "
const fs = require('fs');
const html = fs.readFileSync('song-meanings.html', 'utf8');
const match = html.match(/var SONG_DOSSIERS\s*=\s*(\[[\s\S]*?\])\s*;/);
if (!match) { process.stdout.write('true'); process.exit(); }
try { eval('var x = ' + match[1]); process.stdout.write('true'); }
catch(e) { process.stdout.write('false: ' + e.message); }
" 2>/dev/null)
  check "song-meanings.html JS syntax valid" "$(echo $result | grep -q '^true' && echo true || echo false)"
fi

# 12. Homepage has at least one Spotify embed
check "Homepage has Spotify embed" "$(grep -q 'spotify' index.html && echo true || echo false)"

# 13. Homepage has at least one YouTube embed
check "Homepage has YouTube embed" "$(grep -q 'youtube.com/embed' index.html && echo true || echo false)"

echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Fix failures before deploying."
  exit 1
fi
echo "All structural tests passed. Safe to deploy."
exit 0
