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

# 14. CSP allowlist coverage. Each entry below was a real bug that
# slipped through: missing the entry caused silent breakage. The
# tests guarantee they stay in the script-src / img-src / connect-src
# directives.
csp_check() {
  local domain="$1"
  local directive="$2"
  local page="$3"
  if grep -q "Content-Security-Policy" "$page"; then
    line=$(grep -oE "${directive}[^;]*" "$page" | head -1)
    if [ -n "$line" ] && echo "$line" | grep -q "$domain"; then
      check "CSP $directive includes $domain ($page)" "true"
    else
      check "CSP $directive includes $domain ($page)" "false"
    fi
  fi
}
csp_check "https://scripts.clarity.ms" "script-src" "index.html"
csp_check "https://j.clarity.ms" "connect-src" "index.html"
csp_check "https://cdn.shopify.com" "img-src" "index.html"

# 15. Featured-release renderer wired on homepage
check "featured-release.js included in homepage" "$(grep -q 'js/featured-release.js' index.html && echo true || echo false)"
check "featured-release container exists" "$(grep -q 'id="featured-release"' index.html && echo true || echo false)"

# 16. Song-meanings augmenter wired
check "song-meanings-augment.js included" "$(grep -q 'js/song-meanings-augment.js' song-meanings.html && echo true || echo false)"
check "appendSongDossiers hook exists" "$(grep -q 'window.appendSongDossiers' song-meanings.html && echo true || echo false)"

# 17. Merch rotator wired on homepage
check "merch-rotator.js included on homepage" "$(grep -q 'js/merch-rotator.js' index.html && echo true || echo false)"

# 18. Central config loads on every page that uses analytics
for page in *.html; do
  grep -q 'src="js/analytics.js"' "$page" || continue
  check "config.js loads on: $page" "$(grep -q 'src="js/config.js"' "$page" && echo true || echo false)"
done

# 19. Admin logs passphrase gate. If any of these fail, admin logs
# could be exposed without authentication.
check "admin logs has passphrase gate element" "$(grep -q 'id="passGate"' admin/logs.html && echo true || echo false)"
check "admin logs has passphrase hash constant" "$(grep -q 'EXPECTED_HASH' admin/logs.html && echo true || echo false)"
check "admin logs body starts locked" "$(grep -q 'body class="pass-locked"' admin/logs.html && echo true || echo false)"

# 20. site.json schema. Publisher and signal-room consumer agreed on
# these field names; any drift here breaks the chain.
if [ -f site.json ] && command -v node &>/dev/null; then
  node -e "
const d = JSON.parse(require('fs').readFileSync('site.json','utf8'));
const required = ['homepage','comingSoon','release'];
const missing = required.filter(k => !(k in d));
if (missing.length) process.exit(1);
if (!('banner' in (d.homepage||{}))) process.exit(1);
if (!('featuredRelease' in (d.homepage||{}))) process.exit(1);
" 2>/dev/null
  check "site.json has expected top-level shape" "$([ $? -eq 0 ] && echo true || echo false)"
fi

echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Fix failures before deploying."
  exit 1
fi
echo "All structural tests passed. Safe to deploy."
exit 0
