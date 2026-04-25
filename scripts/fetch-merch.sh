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
import sys, json
import xml.etree.ElementTree as ET

NS = {
    "s": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "image": "http://www.google.com/schemas/sitemap-image/1.1",
}

src_path, out_path = sys.argv[1], sys.argv[2]
root = ET.parse(src_path).getroot()
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

with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"products": items}, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"Wrote {out_path} with {len(items)} products", file=sys.stderr)
PY
