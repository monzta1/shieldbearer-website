#!/usr/bin/env bash
# Bake a static data/merch.json from the public Shopify sitemap.
# Run this before deploy to refresh the homepage merch rotation pool.
# The /products.json endpoint is locked on this store, but the sitemap
# is public and exposes product URL, image, and title for every item.
set -euo pipefail

cd "$(dirname "$0")/.."

OUT="data/merch.json"
SITEMAP_INDEX="https://shop.shieldbearerusa.com/sitemap.xml"

mkdir -p data

PRODUCTS_URL=$(curl -sfL "$SITEMAP_INDEX" | grep -oE 'https://[^<]*sitemap_products[^<]*' | head -1 | sed 's/&amp;/\&/g')

if [[ -z "$PRODUCTS_URL" ]]; then
  echo "ERROR: could not locate products sitemap in $SITEMAP_INDEX" >&2
  exit 1
fi

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
curl -sfL "$PRODUCTS_URL" -o "$TMP"

python3 - "$TMP" "$OUT" <<'PY'
import sys, json, re
import xml.etree.ElementTree as ET
from urllib.request import urlopen, Request
from urllib.error import URLError

NS = {
    "s": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "image": "http://www.google.com/schemas/sitemap-image/1.1",
}

src_path, out_path = sys.argv[1], sys.argv[2]
root = ET.parse(src_path).getroot()

# Step 1: collect product entries from the sitemap (title, url, image).
items = []
for url in root.findall("s:url", NS):
    loc = url.find("s:loc", NS)
    img = url.find("image:image/image:loc", NS)
    title = url.find("image:image/image:title", NS)
    if loc is None or img is None:
        continue
    href = (loc.text or "").strip()
    if "/products/" not in href:
        continue
    items.append({
        "title": (title.text or "").strip() if title is not None else "",
        "url": href,
        "image": (img.text or "").strip(),
    })

# Step 2: scrape each product page's meta description so the rotator
# can show product-specific copy instead of the static "Clean black
# tee..." that ships in the homepage markup. ~14 extra HTTPS calls
# during deploy; trivial cost. Failures fall back to empty.
META_RE = re.compile(
    r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']',
    re.IGNORECASE
)

def trim(text, max_chars=200):
    """Keep things short. Prefer first sentence; cap at max_chars."""
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return ""
    # Cut at the first sentence ending if it's reasonably long.
    m = re.match(r"^(.+?[.!?])\s", text)
    if m and len(m.group(1)) >= 60:
        text = m.group(1)
    if len(text) > max_chars:
        text = text[:max_chars - 1].rstrip() + "..."
    return text

for item in items:
    desc = ""
    try:
        req = Request(item["url"], headers={"User-Agent": "shieldbearer-merch-baker/1.0"})
        with urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        m = META_RE.search(html)
        if m:
            desc = trim(m.group(1))
    except (URLError, TimeoutError, Exception) as error:
        print(f"  warn: could not fetch description for {item['title']}: {error}", file=sys.stderr)
    item["description"] = desc

with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"products": items}, f, indent=2, ensure_ascii=False)
    f.write("\n")

with_desc = sum(1 for i in items if i.get("description"))
print(f"Wrote {out_path} with {len(items)} products ({with_desc} with descriptions)", file=sys.stderr)
PY
