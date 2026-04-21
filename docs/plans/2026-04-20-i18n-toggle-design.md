# i18n Language Toggle — Design Doc

**Date:** 2026-04-20  
**Status:** Approved

## Summary

Add a client-side Spanish/English language toggle to the Pet & Paint site. Spanish is the primary language; English is the secondary. User preference is persisted in `localStorage`. No URL changes, no page reloads.

## Approach

`data-i18n` attributes + central translations object (Option A). Every translatable text node gets a `data-i18n="key"` attribute. A script in `Layout.astro` applies translations on load and re-applies on toggle.

## Architecture

### New file: `src/i18n/translations.ts`
Central object with `en` and `es` keys covering all pages and components. This is the single source of truth — all text edits and translator handoffs happen here.

### `Layout.astro` — toggle script
Inline `<script>` that:
1. Reads `localStorage.getItem('lang')`, defaults to `'es'`
2. Walks all `[data-i18n]` elements, sets `textContent` from translations
3. On toggle click: flips lang, saves to `localStorage`, re-applies, dispatches a custom `languagechange` event for React components

### `Navbar.astro` — toggle button
Added to desktop nav and mobile menu:
```
🇨🇴 ES  |  🇺🇸 EN
```
Active language is bold, inactive is muted. Clicking inactive language switches.

### Astro components — `data-i18n` attributes
Each text node that needs translation gets `data-i18n="componentName.key"`:
- `Navbar.astro` — nav links
- `HeroSection.astro` — headline, subheadline, CTA
- `HowItWorks.astro` — section title, step titles and descriptions
- `MissionSection.astro` — title, body text
- `FeaturedCategories.astro` — section title, category labels
- `Footer.astro` — tagline, nav links, copyright

### `OrderForm.tsx` — React i18n
Reads `localStorage` on mount to set initial language. Listens for the custom `languagechange` event to update React state when the navbar toggle is clicked. All form labels, placeholders, error messages, and button text are driven by a local `t` object keyed by language.

### Pages — `data-i18n` on page-level text
`index.astro`, `shop.astro`, `order.astro` — any text not inside a component gets `data-i18n` attributes too.

## Trade-offs

| | This approach | Show/hide duplicates | React context |
|---|---|---|---|
| HTML size | Lean | ~2x | Lean |
| JS complexity | Low | Minimal | Medium |
| Maintainability | High (1 file) | Low (duplicated markup) | Medium |
| Works with Astro SSR | Yes | Yes | Requires conversion |

## Out of scope
- URL-based routing (`/es/`, `/en/`)
- SEO hreflang tags
- Automatic browser language detection (could be added later as enhancement)
