# Racik Supply

Landing page + product catalog for **Racik Supply**, a B2B supply marketplace for Indonesian warkop (coffee stalls). Buyers can browse, filter, and compare suppliers, quality tiers, and prices, then order via WhatsApp.

Static site — one `index.html` plus local images. No build step.

## Live

- Production: https://racik-supply.vercel.app
- Repo: https://github.com/shykaraakbari09-coder/racik-supply

## Features

- Hero, product grid with search, sort, and category filters
- Three quality tiers (Essential / Standard / Select)
- Product detail specs and a working cart
- WhatsApp order/checkout and supplier registration form
- Responsive layout

## Structure

```
index.html   # markup, styles, and JS (products, cart, filtering, WhatsApp links)
assets/      # product and hero images
```

## Local preview

Open `index.html` in a browser, or serve it:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Configuration

Edit these constants in the `<script>` in `index.html`:

- `WHATSAPP_NUMBER` — business/admin WhatsApp number (international format, no `+` or spaces)
- `AI_WHATSAPP_NUMBER` — number for the assistant chat
- `products` array — product data (name, supplier, tier, price, specs, image)

## Deploy

Hosted on Vercel. To redeploy:

```sh
vercel deploy --prod
```

Or connect the GitHub repo to auto-deploy on push with `vercel git connect`.

## Notes

Prices and listings are illustrative demo data.
