#!/bin/bash
# scripts/verify-live.sh
# Run after every deploy. Hits the live site and asserts every clean
# URL serves 200, then crawls the rendered HTML for hrefs and follows
# each to confirm there are no dead links. Catches the class of bug
# where a JS-injected href is relative and 404s on a subfolder page.

BASE="https://shieldbearerusa.com"
PASS=0
FAIL=0

check_status() {
  local desc="$1"
  local url="$2"
  local code=$(curl -sI -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "200" ]; then
    echo "PASS 200: $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL $code: $desc ($url)"
    FAIL=$((FAIL + 1))
  fi
}

check_content() {
  local desc="$1"
  local url="$2"
  local pattern="$3"
  local count=$(curl -s "$url" | grep -c "$pattern")
  if [ "$count" -gt 0 ]; then
    echo "PASS $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL $desc (pattern '$pattern' not found)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Verifying live site: $BASE"
echo "========================================="

# Clean URLs (the canonical paths post-cleanup).
clean_paths=(
  "" about ai-and-creativity artist-freedom contact creed epk faq
  for-ai-artists gatekeeping god-uses-tools gospel interviews manifesto
  music no-rulebook open-letter process sentinelbot signal-room
  song-meanings story timeline videos
)
for path in "${clean_paths[@]}"; do
  check_status "/$path" "$BASE/$path"
done

# Legacy .html paths must still resolve — Google has these indexed.
legacy_paths=(
  index.html sentinelbot.html signal-room.html timeline.html
  faq.html manifesto.html song-meanings.html music.html
)
for page in "${legacy_paths[@]}"; do
  check_status "$page (legacy)" "$BASE/$page"
done

# Other artifacts that must serve 200.
check_status "404.html" "$BASE/404.html"
check_status "sitemap.xml" "$BASE/sitemap.xml"
check_status "robots.txt" "$BASE/robots.txt"
check_status "site.json" "$BASE/site.json"

# Embeds and key markers that, if missing, signal a deploy regression.
check_content "Homepage has Spotify embed" "$BASE/" "spotify"
check_content "Homepage has YouTube embed" "$BASE/" "youtube.com/embed"
check_content "song-meanings still hand-curated" "$BASE/song-meanings" "SONG_DOSSIERS"
check_content "Sitemap has clean URLs" "$BASE/sitemap.xml" ">https://shieldbearerusa.com/sentinelbot<"

# Crawler: visit a representative subset of pages, extract hrefs, and
# confirm each absolute /path responds with 2xx or 3xx. This catches
# "relative href on a subfolder page becomes a 404" regressions.
echo ""
echo "Crawling internal hrefs..."
crawl_pages=("" "contact" "manifesto" "song-meanings" "signal-room" "sentinelbot")
crawled=0
for crawl in "${crawl_pages[@]}"; do
  body=$(curl -s "$BASE/$crawl")
  while IFS= read -r href; do
    [ -z "$href" ] && continue
    [[ "$href" == http* ]] && continue
    [[ "$href" == mailto:* ]] && continue
    [[ "$href" == tel:* ]] && continue
    [[ "$href" == "#"* ]] && continue
    [[ "$href" == javascript:* ]] && continue
    target="${href%%#*}"
    [ -z "$target" ] && continue
    # If a page renders a relative href (no leading /), that's the
    # bug — flag it and resolve so we still verify reachability.
    if [[ "$target" != /* ]]; then
      echo "FAIL relative href on /$crawl: '$href' (will fail when crawled from a subfolder)"
      FAIL=$((FAIL + 1))
      target="/$crawl/$target"
    fi
    code=$(curl -sI -o /dev/null -w "%{http_code}" "$BASE$target")
    case "$code" in
      2*|3*)
        PASS=$((PASS + 1))
        crawled=$((crawled + 1))
        ;;
      *)
        echo "FAIL link $code: $target (referenced from /$crawl)"
        FAIL=$((FAIL + 1))
        ;;
    esac
  done < <(
    echo "$body" \
      | python3 -c "
import sys, re
html = sys.stdin.read()
# Strip <script>...</script> blocks so JS template-string href= patterns
# don't surface as real hrefs to crawl.
html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
for m in re.finditer(r'href=\"([^\"]+)\"', html):
    print(m.group(1))
"
  )
done
echo "(crawled $crawled internal hrefs across ${#crawl_pages[@]} pages)"

echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "LIVE ISSUES DETECTED. Fix immediately."
  exit 1
fi
echo "Live site verified clean."
exit 0
