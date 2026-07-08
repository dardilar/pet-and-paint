# Pet & Paint

Custom pet hoodies and paint-by-number kits — a minimal e-commerce site that takes orders via a custom form and follows up with a manual payment link. Spanish-only for now (the ES/EN toggle was removed in the 2026-07 revamp; it can be restored from git history).

## Tech stack

| Layer            | Tool                                                    |
| ---------------- | ------------------------------------------------------- |
| Framework        | [Astro 5](https://astro.build) (static + islands)       |
| Interactive UI   | React 19 (only in `OrderForm`)                          |
| Styling          | Tailwind CSS 4                                          |
| Language         | TypeScript                                              |
| Photo uploads    | [Cloudinary](https://cloudinary.com) (unsigned preset)  |
| Form submissions | [Web3Forms](https://web3forms.com) (free tier)          |
| Hosting          | Vercel                                                  |

## Pages

| Route         | Content                                                              |
| ------------- | -------------------------------------------------------------------- |
| `/`           | Home: announcement bar, hero, categories, mission, how-it-works      |
| `/productos`  | Editorial product pages: "El Buzo" + "El Kit de Pintura" + buy flow  |
| `/pedido`     | 3-step custom order form                                             |

`/shop` and `/order` redirect to `/productos` and `/pedido` (see `astro.config.mjs`).

## Catalog

Two products × three styles, defined in `src/data/products.ts` (single source of truth for names, emoji, and COP prices):

|               | Cara de Mascota | Huella de Mascota | Ambas       |
| ------------- | --------------- | ----------------- | ----------- |
| Sudadera      | 89.990 COP      | 89.990 COP        | 99.990 COP  |
| Kit de Pintura| 49.990 COP      | 49.990 COP        | 59.990 COP  |

Hoodies also require a size (S–2XL). The "Ambas" style asks for two photos (face + paw).

## Project structure

```
src/
├── pages/
│   ├── index.astro       # home
│   ├── productos.astro   # product detail sections + payment flow explainer
│   └── pedido.astro      # mounts <OrderForm>
├── components/
│   ├── OrderForm.tsx     # 3-step React form (product → photo → details)
│   ├── HeroSection.astro
│   ├── HowItWorks.astro
│   ├── FeaturedCategories.astro
│   ├── MissionSection.astro
│   ├── Navbar.astro
│   └── Footer.astro
├── data/products.ts      # catalog + COP price formatter
├── layouts/Layout.astro  # head, fonts, reveal-on-scroll observer
└── styles/global.css     # Tailwind theme (brand palette) + animations
```

## Setup

```sh
npm install
cp .env.example .env   # then fill in the keys below
npm run dev
```

### Required environment variables

| Variable                    | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| `PUBLIC_WEB3FORMS_KEY`      | Web3Forms access key (form submissions)                |
| `PUBLIC_CLOUDINARY_CLOUD`   | Cloudinary cloud name                                  |
| `PUBLIC_CLOUDINARY_PRESET`  | Cloudinary **unsigned** upload preset                  |

The `PUBLIC_` prefix exposes them to the browser — required because uploads happen client-side. Do not put any secret keys here.

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build production site to `./dist/`           |
| `npm run preview` | Preview the production build locally         |

## How orders work

1. Customer fills the 3-step form: **Elegir Producto → Subir Foto → Tus Datos**.
2. Photos are uploaded directly from the browser to Cloudinary (folder: `pet-and-paint-orders`).
3. Order details + Cloudinary URL(s) are sent to Web3Forms, which emails the merchant. A hidden honeypot (`botcheck`) drops bot submissions.
4. Email subject includes a generated order reference like `PP-A3K7QM`. The same reference is shown to the customer on the success screen.
5. Merchant manually replies with a payment link (Nequi / Bancolombia / PSE / etc.) — no payment is taken until the photo is approved.

## Pending tasks

### Content

- [ ] Real product gallery photos for `/productos` (thumbnails currently reuse marketing images)
- [ ] Footer social links are dead (`href="#"`): Instagram / Facebook / TikTok
- [ ] Mission CTA ("Conoce nuestra misión") — point to a real shelter partner page
- [ ] Confirm final pricing in `src/data/products.ts`

### Conversion / trust

- [ ] Customer auto-confirmation email (Web3Forms Auto Response is Pro-only — use **EmailJS** or **Resend** instead)
- [ ] WhatsApp ordering button (sticky float + after submit) — high impact in LATAM
- [ ] Sizing chart (modal / accordion in step 1)
- [ ] Payment methods preview near submit ("Nequi · Bancolombia · PSE · Tarjeta")
- [ ] Social proof: testimonials, "+N pets created" counter
- [ ] Portfolio / gallery of past work

### Post-MVP

- [ ] Restore the EN language toggle (removed in revamp; see git history before 2026-07)
- [ ] Real shopping cart + Stripe Checkout / Mercado Pago
- [ ] Per-design example galleries (mini carousel on design select)
- [ ] OG images for product/order share previews
- [ ] Order tracking page (lookup by reference)
