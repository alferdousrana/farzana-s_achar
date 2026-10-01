# Farzana's Home Made Achar — Website

Static HTML/CSS/JS site (no build step). Works on GitHub Pages.

## Files
- `index.html` — storefront (home, product, cart, checkout, order tracking)
- `admin.html` — admin panel (login: `admin` / `farzana123` — change it in Settings)
- `js/store.js` — shared data store (localStorage). Replace with API calls for production.
- `js/app.js` — storefront logic · `js/admin*.js` — admin logic
- `css/` — styles · `images/` — product & banner images · `sw.js`, `manifest.json` — PWA

## Deploy to GitHub Pages
1. Create a repository and upload all files (keep the folder structure).
2. Settings → Pages → Source: "Deploy from a branch" → `main` / root → Save.
3. Open `https://<username>.github.io/<repo>/` (admin: `.../admin.html`).
4. After every update, change `VERSION` in `sw.js` so phones get the new files.

## Before going live
- Data is stored per browser. Connect a backend (Firebase / Supabase / own API) so orders from all customers reach admin.
- Payment screens are demo only. Integrate SSLCommerz / bKash PGW / Nagad for real payments.
- Admin login is client-side; real security needs server-side auth.
