# CareKin logo and branded imagery

The November 2026 refresh adds a CareKin embrace/CK mark and a coordinated
seven-scene photographic library. Existing page composition, typography,
themes, booking flows, safety behavior and semantic color tokens are preserved.

## Deliverables

- `public/images/brand/carekin-logo.png`: transparent 1680 × 360 wordmark.
- `public/images/brand/carekin-mark.png`: transparent 512 × 512 standalone mark.
- `src/app/icon.png`: 128 × 128 browser icon, with a light backing for legibility.
- `src/app/apple-icon.png`: 180 × 180 home-screen icon.
- `public/images/carekin/brand-v2/`: seven optimized WebP scenes: family care,
  elder check-in, caregiver arrival, family tea, storytime, playtime and a walk.
- [Exact generation prompts](brand-image-prompts.json), including logo reference
  use and the uniform requirement. All artwork used the built-in `image_gen`
  tool; no stock assets or API-key fallback were used.

Every depicted care professional wears a violet short-sleeved T-shirt with a
white CareKin mark/wordmark. Care recipients, children and family members wear
normal clothes. All people are AI-generated illustrative marketing subjects,
not actual staff or verified provider portraits. Existing initials avatars and
verification labels retain that distinction. Uniform branding is not a claim
of real employment or verified identity.

## Integration

`BrandLogo` is the shared, accessible lockup used in the global navigation,
footer, sign-in dialog and onboarding frame. Dark mode reverses the same
transparent artwork to white with CSS; no separate competing logo is used.
Native Next.js metadata conventions expose the browser and Apple icons.

Every website photographic image consumer uses the versioned `brand-v2` path,
including marketing, search cards, provider galleries, onboarding, authentication
and workspace banners. The versioned URLs prevent old optimized-photo caches
from concealing the change. Search rotates service-appropriate scenes; childcare
galleries include both reading and play. The old five images were removed from
the current asset library and are recoverable through Git history.

Photo prompts are embedded through Impeccable's provenance utility (WebP uses
its JSON-sidecar fallback). `scripts/prepare-brand-assets.mjs` reproduces format
and size conversion from generated originals; it does not create or retouch
artwork. Keep the existing 350KB-per-photo budget when replacing assets.

## Verification

The asset tests check all seven unique WebP files, provenance, image-size
budgets, logo/icon dimensions, transparency and absence of retired image URLs.
Visually inspect home, search (both care types), provider profile, sign-in and
onboarding at phone/tablet/desktop widths and in light/dark themes. Keep consent,
pricing, identity and Active Care behavior unchanged.
