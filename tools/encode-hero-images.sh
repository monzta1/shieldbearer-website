#!/bin/bash
# =============================================================
# Hero image WebP/AVIF upgrade.
#
# The committed fix uses optimized JPEG variants (sips, the only
# encoder available in the build environment that produced this
# commit). That already took the mobile hero LCP image from
# 2.7 MB to ~104 KB and hit every size target.
#
# WebP/AVIF would shave more (typically 25-45 percent vs JPEG at
# equal quality) but no WebP/AVIF encoder was available then.
# Run this where cwebp and avifenc exist (brew install webp
# libavif, or use squoosh-cli) to generate the better formats,
# then uncomment the image-set() block printed at the end and
# paste it over the --hero-img / --hcs-img declarations in
# index.html. image-set() falls back to the JPEG automatically,
# so this is a safe progressive upgrade.
# =============================================================
set -euo pipefail
cd "$(dirname "$0")/../images"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1 (brew install webp libavif)"; exit 1; }; }
need cwebp
need avifenc

for base in "galilean-art:galilean-art.png" "over-the-skies:over-the-skies-of-hell-art.jpg"; do
  name="${base%%:*}"
  src="${base##*:}"
  for w in 820 1536; do
    tag=$([ "$w" = 820 ] && echo 768 || echo 1536)
    # Resize source first if you have ImageMagick; otherwise these
    # encode at source resolution. The JPEG variants already in the
    # repo (${name}-${tag}.jpg) are the resized references.
    cwebp -q 72 -resize "$w" 0 "$src" -o "${name}-${tag}.webp"
    avifenc --min 24 --max 34 "${name}-${tag}.jpg" "${name}-${tag}.avif" >/dev/null
    echo "made ${name}-${tag}.webp ${name}-${tag}.avif"
  done
done

cat <<'CSS'

Drop-in CSS once the .webp/.avif files exist. Replace the
--hero-img and --hcs-img declarations (base + the min-width:1024
override) with type-negotiated image-set():

  .hero-bg {
    --hero-img: image-set(
      url('images/galilean-art-768.avif') type('image/avif'),
      url('images/galilean-art-768.webp') type('image/webp'),
      url('images/galilean-art-768.jpg')  type('image/jpeg'));
  }
  @media (min-width: 1024px) {
    .hero-bg {
      --hero-img: image-set(
        url('images/galilean-art-1536.avif') type('image/avif'),
        url('images/galilean-art-1536.webp') type('image/webp'),
        url('images/galilean-art-1536.jpg')  type('image/jpeg'));
    }
  }

Same pattern for .hero-content-section with the over-the-skies
files and --hcs-img. Keep the JPEG entry last as the fallback.
CSS
