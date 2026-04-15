#!/bin/bash
# scripts/verify-live.sh
# Run after every deploy. Checks live site returns 200 for all pages.

BASE="https://shieldbearerusa.com"
PASS=0
FAIL=0

check_status() {
  local desc="$1"
  local url="$2"
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✓ 200: $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $status: $desc"
    FAIL=$((FAIL + 1))
  fi
}

check_content() {
  local desc="$1"
  local url="$2"
  local pattern="$3"
  local count=$(curl -s "$url" | grep -c "$pattern")
  if [ "$count" -gt 0 ]; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc — not found"
    FAIL=$((FAIL + 1))
  fi
}

echo "Verifying live site: $BASE"
echo "========================================="

# All pages return 200
pages=(
  "" index.html music.html videos.html about.html story.html
  process.html song-meanings.html interviews.html epk.html
  manifesto.html open-letter.html gatekeeping.html for-ai-artists.html
  no-rulebook.html ai-and-creativity.html god-uses-tools.html
  artist-freedom.html faq.html contact.html 404.html
  sitemap.xml robots.txt
)
for page in "${pages[@]}"; do
  check_status "$page" "$BASE/$page"
done

# Spotify embed on homepage
check_content "Homepage has Spotify embed" "$BASE/" "spotify"

# YouTube embed on homepage
check_content "Homepage has YouTube embed" "$BASE/" "youtube.com/embed"

# song-meanings JS not broken
check_content "song-meanings SONG_DOSSIERS present" "$BASE/song-meanings.html" "SONG_DOSSIERS"

# Sitemap has key pages
check_content "Sitemap has for-ai-artists" "$BASE/sitemap.xml" "for-ai-artists"
check_content "Sitemap has artist-freedom" "$BASE/sitemap.xml" "artist-freedom"

echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
if [ $FAIL -gt 0 ]; then
  echo "LIVE ISSUES DETECTED. Fix immediately."
  exit 1
fi
echo "Live site verified clean."
exit 0
