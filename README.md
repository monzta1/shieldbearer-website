# Shieldbearer — Official Website

Bold Christian metal. Christ proclaimed. Scripture spoken. No ambiguity.

---

## Project Structure

```
shieldbearer/
├── index.html          — Home page
├── music.html          — Music / Discography
├── about.html          — About Moncy Abraham / Shieldbearer
├── song-meanings.html  — Theology and intent behind each track
├── interviews.html     — Press, interviews, and open letter
├── contact.html        — Enquiries form and direct contact
│
├── css/
│   └── style.css       — Full design system (one file, well organised)
│
├── js/
│   ├── main.js             — Nav, mobile menu, form, accordion
│   ├── featured-merch.js   — Shopify-powered homepage merch card
│   ├── site-config.example.js — Template for local storefront config
│   └── site-config.js      — Local-only storefront config (gitignored)
│
├── images/             — All images go here
│   ├── logo.png            ← Your Shieldbearer logo (white/transparent PNG)
│   ├── favicon.ico         ← Browser favicon
│   ├── og-image.jpg        ← Social share preview image (1200x630)
│   ├── galilean-art.jpg    ← Galilean single artwork
│   ├── moncy-photo.jpg     ← Artist photo for About page
│   └── release-art.jpg     ← Generic release art for home page
│
├── audio/              — Audio files go here (MP3/WAV)
│   └── (add audio files here for future player)
│
└── README.md
```

---

## Analytics Setup

For GTM, GA4, Search Console, and Clarity setup and usage, see:

- `ANALYTICS_SETUP.md`

---

## How to Deploy on GitHub Pages

1. Create a GitHub account if you don't have one: github.com
2. Create a new repository called `shieldbearerusa` (or any name)
3. Upload all these files to the repository root
4. Go to repository Settings > Pages
5. Under "Source", select "Deploy from a branch"
6. Set branch to `main` (or `master`) and folder to `/ (root)`
7. Click Save
8. Your site will be live at: `https://yourusername.github.io/shieldbearerusa`

To update the site later, edit the files and push/upload the changes to GitHub.

---

## How to Connect Your GoDaddy Domain (shieldbearerusa.com)

### Step 1 — GitHub Pages custom domain
1. In your GitHub repo, go to Settings > Pages
2. Under "Custom domain", type: `shieldbearerusa.com`
3. Click Save
4. GitHub will create a `CNAME` file in your repo automatically

### Step 2 — GoDaddy DNS settings
1. Log in to GoDaddy and go to your domain's DNS settings
2. Delete any existing A records pointing to GoDaddy's servers
3. Add these four A records (GitHub's IPs):
   - Type: A | Name: @ | Value: 185.199.108.153
   - Type: A | Name: @ | Value: 185.199.109.153
   - Type: A | Name: @ | Value: 185.199.110.153
   - Type: A | Name: @ | Value: 185.199.111.153
4. Add this CNAME record:
   - Type: CNAME | Name: www | Value: yourusername.github.io
5. Wait 10-30 minutes for DNS to propagate
6. Back in GitHub Pages settings, check "Enforce HTTPS"

---

## Where to Update Content

### Logo
- Replace `images/logo.png` with your logo file
- The logo is displayed as white (CSS `filter: invert(1)`) so a black PNG works perfectly

### Artist Photo
- Add your photo to `images/moncy-photo.jpg`
- It shows on `about.html`

### Album / Release Art
- Add artwork to `images/galilean-art.jpg` (or change the filename in music.html)
- Used on `music.html` and `index.html`

### Merch Store URL
- Search the project for `shop.shieldbearerusa.com`
- Replace with your actual Shopify store URL
- It appears in: nav, footer, index.html, contact.html

### Featured Shopify Merch
- Homepage featured merch now pulls one random item from a curated Shopify collection
- Copy `js/site-config.example.js` to `js/site-config.js`
- `js/site-config.js` is gitignored and should stay local-only
- Configure storefront settings in `js/site-config.js`
- Required public config keys:
  - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
  - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
  - `NEXT_PUBLIC_SHOPIFY_FEATURED_COLLECTION_HANDLE`
- Recommended collection handle: `featured-homepage`
- Only public Storefront API values belong here. Never paste an Admin API token or any private Shopify credential into this repo.
- If the storefront token is present, the homepage tries token mode first
- If the token is missing, the homepage tries a tokenless Storefront GraphQL request for testing
- If config is missing, the request fails, times out, or the collection has no valid in-stock products with images, the homepage automatically falls back to the static merch card and store link.

Example `js/site-config.js` values:
```js
window.SHOPIFY_CONFIG = {
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: 'shop.shieldbearerusa.com',
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN: 'your-public-storefront-token',
  NEXT_PUBLIC_SHOPIFY_FEATURED_COLLECTION_HANDLE: 'featured-homepage'
};
```

Minimal browser-console test for token validity:
```js
fetch('https://shop.shieldbearerusa.com/api/2025-01/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': 'YOUR_STOREFRONT_TOKEN'
  },
  body: JSON.stringify({
    query: 'query { shop { name } }'
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Minimal browser-console test for tokenless mode:
```js
fetch('https://shop.shieldbearerusa.com/api/2025-01/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'query { shop { name } }'
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If that works, test the featured collection handle:
```js
fetch('https://shop.shieldbearerusa.com/api/2025-01/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': 'YOUR_STOREFRONT_TOKEN'
  },
  body: JSON.stringify({
    query: 'query($handle: String!) { collection(handle: $handle) { handle title } }',
    variables: { handle: 'featured-homepage' }
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Production-safe options for this static site:
- Best option: generate `js/site-config.js` during deployment from environment variables, and never commit the real file
- Simple manual option: after deployment, upload a local `js/site-config.js` with the public storefront config to the site root `js/` directory
- If production config is missing or invalid, the homepage will keep showing the static merch fallback

If tokenless mode also fails:
- Next best Shopify-native path: create or reconfigure a custom app that exposes a real Storefront API access token with storefront product and collection read access
- If that still proves unreliable, the simplest code-side fallback is a tiny serverless proxy that keeps the storefront token in an environment variable and returns only the curated featured merch payload to the homepage

### Social Links
- Search for `https://www.instagram.com/shieldbearerusa/` etc.
- All social links are already set to your real profiles from your Linktree

### Streaming Links (Spotify, Apple Music etc.)
- In `music.html` and `index.html`, find the `.stream-pill` links
- Replace `href="#"` with the real URLs for each platform

### Email Address
- Already set to `shieldbearerusa@gmail.com` throughout

### Adding New Tracks
- In `music.html`, copy a `.track-card` block and fill in the new track details
- In `song-meanings.html`, copy a `.meaning-card` block and fill in the meaning

### Adding Gig Dates
- Currently there is a "Next gig coming soon" message on `index.html`
- To add a real gig, add a section to `index.html` with the date, venue, and location

---

## How to Connect the Contact Form (Formspree)

1. Go to formspree.io and create a free account
2. Click "New Form" and give it a name
3. Copy your form endpoint URL (looks like: `https://formspree.io/f/abcd1234`)
4. Open `contact.html`
5. Find the `<form id="enquiryForm" action="#">` line
6. Change `action="#"` to `action="https://formspree.io/f/YOUR_FORM_ID"`
7. Add `method="POST"` to the form tag
8. Open `js/main.js` and follow the instructions in the FORMSPREE INTEGRATION comment block
9. Test by submitting the form — you will receive an email at shieldbearerusa@gmail.com

Until Formspree is connected, the form opens the user's mail app as a fallback.

---

## How to Add Future Embeds

### Spotify track embed
In `music.html`, find the comment block labelled `SPOTIFY EMBED PLACEHOLDER`.
Replace the `.embed-placeholder` div with your Spotify iframe embed code.

### YouTube video embed
Add an iframe anywhere in `music.html`:
```html
<iframe width="100%" height="400"
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

### Custom audio player
In `music.html`, find `FUTURE AUDIO PLAYER EMBED PLACEHOLDER` and replace with:
```html
<audio controls style="width:100%">
  <source src="audio/your-track.mp3" type="audio/mpeg">
</audio>
```

### Adding images / gallery
- Add images to the `images/` folder
- Reference them in HTML: `<img src="images/your-image.jpg" alt="Description">`
- The `about.html` artist photo area is already set up for this

---

## Theme Colours (for reference)

| Variable       | Value     | Use                    |
|----------------|-----------|------------------------|
| `--red`        | `#c0392b` | Primary accent         |
| `--red-bright` | `#e74c3c` | Hover / eyebrow text   |
| `--red-dark`   | `#6b1b13` | Gradient dark end      |
| `--white`      | `#f0ebe0` | Headings / emphasis    |
| `--off-white`  | `#a8a29a` | Body text              |
| `--muted`      | `#525252` | Placeholder / dim text |
| `--black`      | `#040404` | Page background        |

All variables are in `css/style.css` at the top under `:root`.

---

## Contact

shieldbearerusa@gmail.com
+1 571 201 5166
linktr.ee/shieldbearerusa
