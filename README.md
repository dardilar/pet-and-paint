# Pet & Paint

Custom pet hoodies and paint-by-number kits — a minimal e-commerce site that takes orders via a custom form and follows up with a manual payment link. Bilingual (Spanish / English).

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
| i18n             | Custom client-side toggle (ES default / EN)             |

## Project structure

```
src/
├── pages/
│   ├── index.astro       # home: hero, categories, mission, how-it-works
│   ├── shop.astro        # product grids
│   └── order.astro       # mounts <OrderForm>
├── components/
│   ├── OrderForm.tsx     # 3-step React form (product → photo → details)
│   ├── HeroSection.astro
│   ├── HowItWorks.astro
│   ├── FeaturedCategories.astro
│   ├── MissionSection.astro
│   ├── Navbar.astro
│   └── Footer.astro
├── data/products.ts      # hoodie + paint-kit catalog, COP price formatter
├── i18n/translations.ts  # ES + EN dictionaries
├── layouts/Layout.astro  # head, fonts, i18n runtime
└── styles/global.css
```

## Setup

```sh
npm install
cp .env.example .env   # if you have one — otherwise create .env (see below)
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

1. Customer fills the 3-step form: **Choose Product → Upload Photo(s) → Details**.
2. Photos are uploaded directly from the browser to Cloudinary (folder: `pet-and-paint-orders`).
3. Order details + Cloudinary URL(s) are sent to Web3Forms, which emails the merchant.
4. Email subject includes a generated order reference like `PP-A3K7QM`. The same reference is shown to the customer on the success screen.
5. Merchant manually replies with a payment link (Nequi / Bancolombia / PSE / etc.).

## Pending tasks

### Content

- [ ] Add real product images at `public/products/*.png`
  - `hoodie-face.png`, `hoodie-fingerprint.png`, `hoodie-both.png`
  - `kit-numbers.png`, `kit-canvas.png`
- [ ] Replace footer dead links (currently `href="#"`):
  - Custom Hoodies / Paint Kits / About Us / Mission / Contact / Instagram / Facebook / TikTok
- [ ] Mission section "Saber Más" button — point to a real shelter partner page
- [ ] Final pricing values (currently placeholder COP amounts in `src/data/products.ts`)

### Conversion / trust

- [ ] Customer auto-confirmation email (Web3Forms Auto Response is Pro-only — use **EmailJS** or **Resend** instead)
- [ ] WhatsApp ordering button (sticky float + after submit) — high impact in LATAM
- [ ] Sizing chart (modal / accordion in step 1)
- [ ] Production + shipping time copy ("Ready in 7-10 days, ships in 2-3")
- [ ] Payment methods preview near submit ("Nequi · Bancolombia · PSE · Tarjeta")
- [ ] Social proof: testimonials, "+N pets created" counter
- [ ] Portfolio / gallery of past work

### Polish

- [ ] Decide currency display (COP vs USD) — current format is `89.990 COP`
- [ ] Resolve `🎨` emoji collision (used both for paint-kit type and `kit-numbers` design)
- [ ] Better hero alt text for SEO/accessibility
- [ ] Pick a non-cart icon for "Choose Product" step (no cart yet)
- [ ] Add honeypot/botcheck field to OrderForm

### Post-MVP

- [ ] Real shopping cart + Stripe Checkout / Mercado Pago
- [ ] Per-design example galleries (mini carousel on design select)
- [ ] OG images for product/order share previews
- [ ] Order tracking page (lookup by reference)
