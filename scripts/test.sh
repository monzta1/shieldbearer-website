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

# 6. No internal href points to a missing file (legacy .html paths)
for page in *.html; do
  while IFS= read -r href; do
    file="${href%%#*}"
    file="${file%%\?*}"
    [ -z "$file" ] && continue
    [[ "$file" == http* ]] && continue
    check "Link target exists: $file (in $page)" "$([ -f "$file" ] && echo true || echo false)"
  done < <(grep -oP 'href="\K[^"]+\.html[^"]*' "$page" 2>/dev/null)
done

# 6b. Clean URL targets resolve. After the .html-extension cleanup,
# internal hrefs use absolute /paths. Each one should map to a
# folder/index.html on disk so GitHub Pages serves it without the
# .html suffix. Catches typos and missing folders.
CLEAN_PAGES="sentinelbot signal-room timeline creed gospel faq about story process manifesto music contact epk song-meanings for-ai-artists gatekeeping open-letter no-rulebook ai-and-creativity god-uses-tools artist-freedom interviews videos"
for cp in $CLEAN_PAGES; do
  check "Clean URL folder exists: /$cp" "$([ -f "$cp/index.html" ] && echo true || echo false)"
  check "Legacy .html still exists: $cp.html" "$([ -f "$cp.html" ] && echo true || echo false)"
done

# 6c. Every href="/path" in any .html file points to a known clean
# URL folder OR root. Uses awk to handle quoting cleanly.
for page in *.html; do
  awk 'match($0, /href="\/[a-zA-Z0-9_/-]*"/) { print substr($0, RSTART+6, RLENGTH-7) }' "$page" \
    | sort -u \
    | while IFS= read -r ref; do
        # Strip optional fragment
        target="${ref%%#*}"
        [ -z "$target" ] && continue
        [ "$target" = "/" ] && continue
        path="${target#/}"
        check "Clean href target resolves: $target (in $page)" \
          "$( [ -f "$path/index.html" ] || [ -f "$path.html" ] && echo true || echo false )"
      done
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

# 19b. No stale .html filename string literals in JS source. Catches
# the bug where addTimelineNavLink set href = 'timeline.html' which
# resolved relative to the current page (so on /contact it became
# /contact/timeline.html, broken). Anything that looks like
# 'name.html' or "name.html" in JS is suspect after the clean-URL
# move. Comment lines and bare '.html' fragments (used in active-
# link path comparisons) are intentionally allowed.
js_html_literals=$(grep -nE "['\"][a-zA-Z][a-zA-Z0-9_-]*\.html['\"]" js/*.js 2>/dev/null | grep -v "^[^:]*:[0-9]*:[[:space:]]*//" | head -10)
if [ -z "$js_html_literals" ]; then
  check "No stale .html filename literals in JS source" "true"
else
  check "No stale .html filename literals in JS source" "false"
  echo "  Found:"
  echo "$js_html_literals" | sed 's/^/    /'
fi

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

# 21. Em-dash guard. Hard project rule: no em dashes in prose,
#     identifiers, or comments. Catches three forms:
#       - literal — (U+2014)
#       - &mdash; HTML entity
#       - — escape (JS / JSON source)
#     Per-line whitelist sigil "em-dash-allow" lets us mark
#     legitimate uses (CSS pseudo-content separators, intentional
#     regex strips, typographic placeholders) without disabling the
#     check globally. Auto-generated data files (site.json, merch.json)
#     are excluded because they carry external strings we do not
#     control. Convention ported from the radio repo's check, extended
#     to scan all four file formats.
DASH=$(printf '\xe2\x80\x94')
EM_DASH_HITS=$(
  grep -rn -E "${DASH}|&mdash;|\\\\u2014" \
    --include='*.html' \
    --include='*.css' \
    --include='*.js' \
    --include='*.md' \
    --include='*.txt' \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    --exclude-dir=coverage \
    --exclude=site.json \
    --exclude=merch.json \
    . 2>/dev/null \
  | grep -v "em-dash-allow" \
  || true
)
if [ -n "$EM_DASH_HITS" ]; then
  check "No em dashes in source files" "false"
  echo "$EM_DASH_HITS" | sed 's/^/    /'
else
  check "No em dashes in source files" "true"
fi

echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "Fix failures before deploying."
  exit 1
fi
echo "All structural tests passed."

# Browser-side JS regression tests with coverage gate. Skipped if
# node_modules hasn't been installed (e.g. fresh clone): run
# `npm install` once, then this stays in the loop forever.
if [ -d node_modules/jsdom ]; then
  echo ""
  echo "Running browser-JS tests with coverage..."
  npx c8 node tests/run-tests.js
  if [ $? -ne 0 ]; then
    echo "Browser-JS tests or coverage gate failed."
    exit 1
  fi
else
  echo ""
  echo "(skipping browser-JS tests; run 'npm install' to enable)"
fi

echo "Safe to deploy."
exit 0
