# CareKin — Design system

Visual world pinned by the supplied **Urban Company brand guidelines
v1.0** (calm monochrome surfaces, one confident violet, photography
doing the emotional work — "a marketplace that sells trust"). Pairing B
type system. This file records the durable decisions; the JSON tokens
are the source of truth for values.

## Modes per surface

- `/`, `/how-it-works`, `/pricing`, `/cities/*`, `/search`,
  `/providers/[id]`, `/book/*` — **Persuade**: conversion surfaces;
  the UC card/price/rating grammar carries them.
- `/family/*`, `/provider/*`, `/admin/*` — **Operate**: working
  screens; brand lives in precise details (status chips, violet single
  action, calm neutrals).

## Colour

Light is the default regardless of the device appearance. The header theme
switch selects Light or Dark; the saved browser preference is applied before
the first paint and persists across navigation and reloads. Native form
controls follow the selected color scheme. Homepage hero bands use semantic
surfaces so they switch along with the rest of the application.

Field values, placeholders, carets, native options and autofill use paired
theme colors. Button hover fills use `accentHover`, never the lightened
dark-mode `accentText` token. Disabled actions retain opaque, readable labels.
Light-mode success green is contrast-adjusted to `#116E40` for small tinted
status badges. Token contrast regression tests enforce 4.5:1 for these pairs.

| Role | Value | Rule |
|---|---|---|
| Paper | `#FFFFFF` | page + card ground (55%) |
| Mist | `#F4F4F5` | section bands, image wells, chips (20%) |
| Ink | `#0F0F0F` | headings, primary text, hero surfaces (15%) |
| Slate | `#6B6B72` | secondary text, struck prices — never below 14px |
| Line | `#E4E4E7` | borders, dividers |
| Violet | `#6E42E5` | the only action colour: CTAs, links, focus, selection (8%) |
| Violet deep | `#4F2BB8` | hover/pressed |
| Violet tint | `#EFE9FF` | selected states, promo strips |
| Rating green | `#14804A` | ratings, "Instant"/speed claims, success, verified (2%) |
| Alert red | `#C62828` | errors only — never promos or discounts |

Rules honored: one violet action per view; ink-on-white body text;
green only beside a rating or speed claim; no gradients, no extra
hues; photography supplies colour (providers have no photos in this
prototype — initials monograms sit on Mist 4:3 image wells as the
documented stand-in).

## Typography

- Display: **Bricolage Grotesque** 800 — headings ≥28px only.
- Body/UI: **Figtree** — prices and ratings use tabular figures.
- Hindi: **Noto Sans Devanagari**, same weights, +0.1 line-height.
- Scale: Caption 14/20·500 · Body 16/24 · Title 18/26·600 · H2 28/34·700 · H1 40/44·700 · Display 56/58·800.
- Sentence case everywhere; no all-caps except tiny labels; max 2
  weights per component.

## Components

- Brand lockup: CareKin's violet embrace/CK mark and wordmark, shared through
  `BrandLogo` in navigation, footer, authentication and onboarding. Transparent
  master artwork reverses to white in dark mode. The standalone mark supplies
  browser and home-screen icons. See `docs/brand-refresh.md` for assets/prompts.
- Photography: the versioned seven-scene `images/carekin/brand-v2` library uses
  violet CareKin T-shirts for every depicted care professional. All scenes are
  AI-generated and illustrative, not provider identity evidence; initials
  avatars remain the stand-in for missing actual provider portraits.

- Radius: buttons **10px**, cards **14px**, chips **99px**; 8px grid.
- Service/provider card: 4:3 image well on Mist, name, ★ rating in
  Rating green, price + struck original together.
- Status chips: Mist/Slate neutral; confirmed → violet tint + violet
  deep; completed/paid → green; disputed/error → red.
- Focus styling is disabled at the user's explicit request. Keyboard navigation
  remains enabled, but there is no visible focus indicator; this reduces
  keyboard accessibility. Selection retains the violet tint.
- Buttons: violet fill + white label (primary), Paper + Line border
  (secondary), Alert red (danger), Slate text (ghost).
- Depth: single soft shadow on interactive cards; no border+shadow
  stacking, no hard offset shadows.

## Voice

Short, plain, reassuring. Sentence case. Lead with outcome and time.
Always show price + rating together. Honest demo labels stay.

## Responsive behavior

- Phone layouts use 16px gutters, full-width forms and 48px action targets; tablet layouts give content room before splitting compact cards.
- Onboarding uses a compact image introduction on phones and a two-column layout from tablet widths.
- Navigation and notifications stay within the viewport; chat uses dynamic viewport height and scrolls messages independently.
- Fixed booking controls respect safe areas. Native zoom remains enabled and touch-device form fields use at least 16px text.
- Check at 320, 390, 768 and 1024px. Physical iOS/Android keyboard, notch and browser-chrome behavior still requires device testing.
