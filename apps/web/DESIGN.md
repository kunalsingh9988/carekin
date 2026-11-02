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

- Radius: buttons **10px**, cards **14px**, chips **99px**; 8px grid.
- Service/provider card: 4:3 image well on Mist, name, ★ rating in
  Rating green, price + struck original together.
- Status chips: Mist/Slate neutral; confirmed → violet tint + violet
  deep; completed/paid → green; disputed/error → red.
- Focus ring: Violet, 2px, 2px offset. Selection: Violet tint.
- Buttons: violet fill + white label (primary), Paper + Line border
  (secondary), Alert red (danger), Slate text (ghost).
- Depth: single soft shadow on interactive cards; no border+shadow
  stacking, no hard offset shadows.

## Voice

Short, plain, reassuring. Sentence case. Lead with outcome and time.
Always show price + rating together. Honest demo labels stay.
