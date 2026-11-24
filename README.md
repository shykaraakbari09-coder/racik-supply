# Racik Supply

Landing page + product catalog + admin dashboard for **Racik Supply**, a B2B supply marketplace for Indonesian warkop (coffee stalls). Buyers can browse, filter, and compare suppliers, quality tiers, and prices, then order via WhatsApp.

The storefront is a static page that loads its catalog from a serverless API backed by a Postgres database, so products can be managed from the admin dashboard without editing code.

## Live

- Production: https://racik-supply.vercel.app
- Admin: https://racik-supply.vercel.app/admin.html
- Repo: https://github.com/shykaraakbari09-coder/racik-supply

## Features

- Hero, product grid with search, sort, and category filters
- Three quality tiers (Essential / Standard / Select)
- Product detail specs and a working cart (quantity steppers, saved between visits)
- WhatsApp order/checkout and supplier registration form
- Responsive layout
- **Admin dashboard** (`/admin`) with role-based login, product CRUD, and CSV export

## Structure

```
index.html        # storefront markup + styles
admin.html        # admin dashboard markup + styles
css/
  site.css        #   storefront styles (tokens, hero receipt, cards, cart drawer)
  admin.css       #   dashboard styles
js/
  store.js        #   storefront logic (catalog, persistent cart, WhatsApp links)
  admin.js        #   dashboard logic (login, product CRUD, CSV export)
api/              # Vercel serverless functions
  products.js     #   GET (public) / PUT (admin+staff) / POST, DELETE (admin)
  login.js        #   role + password login (rate-limited), sets session cookie
  logout.js       #   clears the session cookie
  session.js      #   reports whether the caller is authenticated
lib/
  db.js           # Neon connection, schema, seeding, sanitization
  auth.js         # HMAC-signed session tokens, role password checks, cookie helpers
  sessions.js     # session create/lookup/delete + request auth resolution
  rate-limit.js   # per-IP login failure tracking
assets/           # product and hero images, self-hosted fonts (assets/fonts)
test/             # node:test suite (`npm test`)
vercel.json       # security headers / CSP / caching
robots.txt, sitemap.xml, 404.html
```

## Stack

- Static HTML/CSS/JS (no framework, no build step)
- Vercel serverless functions (Node.js, ESM)
- Neon Postgres via `@neondatabase/serverless`

## Admin dashboard

Visit `/admin.html`, pick a role, and log in. Changes appear on the storefront immediately.

| Role  | View | Edit | Create | Delete |
| ----- | :--: | :--: | :----: | :----: |
| Admin |  ✅  |  ✅  |   ✅   |   ✅   |
| Staff |  ✅  |  ✅  |   ❌   |   ❌   |

### Security

- Passwords are stored only as Vercel environment variables; comparisons are timing-safe.
- Login is rate-limited per IP (8 failures / 15 min → HTTP 429) using a DB-backed counter, so it holds across serverless instances.
- Sessions are server-side rows: the cookie holds an `HttpOnly`, `Secure`, `SameSite=Strict`, HMAC-signed token (4h expiry) referencing a session `sid`. Logout deletes the row, so sessions are truly revocable.
- A second, global throttle (60 failures / 15 min across all IPs) stops distributed password guessing.
- Password comparison hashes both sides first, so timing leaks neither content nor length.
- `ADMIN_SECRET` shorter than 32 characters is refused at runtime.
- Cross-origin writes are rejected (`Origin` / `Sec-Fetch-Site` check) on top of `SameSite=Strict`.
- Product images must be an `assets/...` path or an `https://` URL; anything else is stored empty. All rendered values are HTML-escaped.
- CSP forbids inline scripts (`script-src 'self'`); all JS lives in `js/`.
- All SQL is parameterized; errors return generic messages (details are logged server-side).

### Required environment variables

Set in the Vercel project (all environments):

| Variable         | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `DATABASE_URL`   | Neon connection string (set by the integration) |
| `ADMIN_PASSWORD` | Admin login password                            |
| `STAFF_PASSWORD` | Staff login password                            |
| `ADMIN_SECRET`   | Random secret used to sign session tokens       |

Generate a secret with `openssl rand -hex 32` (minimum 32 characters). To change a password:

```sh
vercel env rm ADMIN_PASSWORD production
vercel env add ADMIN_PASSWORD production
vercel deploy --prod
```

## Tests

```sh
npm install
npm test
```

Covers token signing/expiry, password checks, same-origin enforcement, image/XSS sanitising, and that every API module loads.

## Local development

Serve the static pages and run the API with the Vercel dev server:

```sh
npm install
vercel env pull .env.local
vercel dev
```

Then visit http://localhost:3000 (storefront) or http://localhost:3000/admin.html.

## Deploy

Hosted on Vercel. To redeploy:

```sh
vercel deploy --prod
```

Or connect the GitHub repo to auto-deploy on push with `vercel git connect`.

## Configuration

WhatsApp numbers live in the `<script>` in `index.html`:

- `WHATSAPP_NUMBER` — business/admin WhatsApp number (international format, no `+` or spaces)
- `AI_WHATSAPP_NUMBER` — number for the assistant chat

Product data is stored in the database and managed via the admin dashboard. The array in `index.html` is only a fallback used when the API is unreachable.

## Image credits

Product photos sourced from Wikimedia Commons:

- Matcha powder flat-lay — "Matcha layout with leaf, tea, and powder" by dungthuyvunguyen (CC0)
- Matcha scoop — "Matcha Scoop" by Evanhoever (CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0)
- Taro powder — "Purple sweet potato powder" by Fumikas Sagisavas (CC0)
- Vanilla syrup — "Various Monin syrups" by AgrisR (CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0)

## Notes

Prices and listings are illustrative demo data.
