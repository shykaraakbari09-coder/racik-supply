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
- Product detail specs and a working cart
- WhatsApp order/checkout and supplier registration form
- Responsive layout
- **Admin dashboard** (`/admin.html`) with password login and product CRUD

## Structure

```
index.html        # storefront: markup, styles, JS (cart, filtering, WhatsApp links)
admin.html        # admin dashboard: login + product management UI
api/              # Vercel serverless functions
  products.js     #   GET (public) / POST / PUT / DELETE (admin)
  login.js        #   password login, sets signed session cookie
  logout.js       #   clears the session cookie
  session.js      #   reports whether the caller is authenticated
lib/
  db.js           # Neon connection, schema, seeding, sanitization
  auth.js         # HMAC-signed session tokens + cookie helpers
assets/           # product and hero images
vercel.json       # security headers / CSP
```

## Stack

- Static HTML/CSS/JS (no framework, no build step)
- Vercel serverless functions (Node.js, ESM)
- Neon Postgres via `@neondatabase/serverless`

## Admin dashboard

Visit `/admin.html` and log in with the admin password. From there you can add, edit, and delete products; changes appear on the storefront immediately.

Auth uses an `HttpOnly`, `Secure`, `SameSite=Strict` cookie holding an HMAC-signed token (12h expiry). All write endpoints require a valid session.

### Required environment variables

Set in the Vercel project (all environments):

| Variable         | Purpose                                        |
| ---------------- | ---------------------------------------------- |
| `DATABASE_URL`   | Neon connection string (set by the integration) |
| `ADMIN_PASSWORD` | Dashboard login password                        |
| `ADMIN_SECRET`   | Random secret used to sign session tokens       |

Generate a secret with `openssl rand -hex 32`. To change the password:

```sh
vercel env rm ADMIN_PASSWORD production
vercel env add ADMIN_PASSWORD production
vercel deploy --prod
```

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

Product photos for the powders sourced from Wikimedia Commons:

- Matcha powder flat-lay — "Matcha layout with leaf, tea, and powder" by dungthuyvunguyen (CC0)
- Matcha scoop — "Matcha Scoop" by Evanhoever (CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0)
- Taro powder — "Purple sweet potato powder" by Fumikas Sagisavas (CC0)

## Notes

Prices and listings are illustrative demo data.
