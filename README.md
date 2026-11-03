# CareKin

## Current backend development build — November 2026

`apps/web` now supports a real Supabase development backend with email/password
authentication, private database records, authorization, document storage,
booking requests, chat, Active Care, and operations queues. It is **not launch
ready**: payments, SMS, recurring billing, emergency dispatch and staffed
provider verification are not connected.

- [Completed work, validation and remaining launch work](apps/web/docs/backend-status.md)
- [Database installation, security model and administrator setup](packages/supabase/backend/README.md)
- Frontend: Next.js 16.2.10 / React 19, in `apps/web`.
- Backend: `packages/supabase/backend/001_core.sql` through `004_hardening.sql`.
- Set `NEXT_PUBLIC_BACKEND_MODE=supabase` and the project URL/publishable key
  in ignored `apps/web/.env.local`, using `apps/web/.env.example` as a template.
- No service-role or secret key is needed by this application.
- Omitting backend mode preserves the older browser-local demo. Never mistake
  that demo for authenticated production functionality.
- Do **not** run the historical `supabase/migrations` or push its local config
  onto the connected project; they belong to a different archived architecture.

Run `pnpm install`, then `pnpm --filter @carekin/web dev`. The backend directory
does not seed providers or customer data. An empty search is expected until a
provider completes onboarding and an authorized administrator approves them.

## Historical prototype documentation

The following describes the preceding browser-only implementation, not the
Supabase mode above. Its payment tests were simulations, not real transactions.

Two-sided marketplace connecting families with verified elder caregivers and
babysitters. Single-city launch; the verification-gating rule (a pending or
rejected provider is never visible to families, guest or authenticated) is
the one thing that has survived every architecture pivot below unchanged.

**Previous build: frontend-only prototype**, per the "CareKin Full Website
Build Prompt" — guest browsing → signup-at-commitment funnel, no backend, no
real auth, no real payments. Every "write" persists to browser
`localStorage` through a typed data-access layer
(`apps/web/src/lib/storage/`), structured so swapping it for the
Supabase-backed build below is a data-layer change later, not a rewrite.
See [apps/web/README.md](apps/web/README.md) for what's simulated and how.

**History**, newest first:
1. **Frontend-only localStorage prototype, guest-funnel IA** (current) —
   `apps/web` restructured around public search/provider pages and a
   deferred-signup booking funnel (`/book/[providerId]/...`), replacing an
   earlier account-first version of the same prototype.
2. Frontend-only localStorage prototype, account-first IA — the first pass
   at the no-backend prototype; superseded by (1) within the same phase,
   not separately archived (small enough diff to just rewrite in place).
3. Next.js + Supabase (Postgres RLS as the real authorization boundary) —
   archived, not deleted, see [archive/README.md](archive/README.md) and
   [archive/web-supabase/README.md](archive/web-supabase/README.md). The
   Postgres schema/RLS/RPCs in `packages/supabase/` are untouched and still
   the plan for when this prototype's flows are validated.
4. NestJS + Prisma + self-hosted Postgres/Redis — archived at
   `archive/api-nestjs/`, `archive/infra-prisma-docker/`.

`apps/mobile` (Expo) is paused throughout all of the above, not migrated,
and still works against its own frozen type package
(`packages/shared-types/`).

## Structure

```
apps/
  web/                 Next.js 15 App Router — the frontend-only prototype (current)
  mobile/              Expo (paused — see archive/README.md)
packages/
  core/                Framework-agnostic business logic — used by the Supabase-backed build
  types/               Supabase-generated Database types — used by the Supabase-backed build
  validation/          Zod schemas mirroring the Postgres schema — used by the Supabase-backed build
  ui-tokens/           Design tokens as portable JSON + generated CSS + Tailwind mapping — used by BOTH builds
  shared-types/        Frozen, mobile-only — do not use for new work (see its own README)
  supabase/            Supabase CLI project: migrations/, seed.sql (not an npm package) — dormant, not wired up right now
archive/
  web-supabase/        Superseded: apps/web as it was under the Supabase-backed build
  api-nestjs/          Superseded: NestJS backend
  infra-prisma-docker/ Superseded: Prisma schema + docker-compose
```

## Getting started

```bash
pnpm install
pnpm --filter @carekin/web dev
```

That's it — no `.env`, no database, no Docker. Open the app and it seeds
itself with demo data on first load.

## Status

Built: all ~32 routes from the full build prompt's IA (Section 5.1) —
public marketing (home, how-it-works, pricing, cities + dynamic city
pages), public `/search` and `/providers/[id]` (guest-safe fields only,
enforced in the data layer), the full guest-to-signup booking funnel
(`/book/[providerId]` → `/signup` → `/profile` → conditional `/consent` →
`/pay` with a one-time weekly upsell → `/confirmed` with cross-sell and
referral nudge), `/family` dashboard, bookings/chat/review, one-tap
`/rebook`, `/family/referrals`, `/provider/apply`, the full provider app,
and the full admin console.

Verified end-to-end in-browser: guest reaches the booking-option screen
with zero login prompts, the plan selection (provider, weekly/one-off,
price) survives the signup step unchanged, payment failed on the first
real attempt and the retry path worked, and the confirmed booking showed
up correctly in My Bookings with a live notification. One real bug found
and fixed during that pass: an `&amp;` HTML entity directly adjacent to a
JSX expression was silently eating the preceding space in the rendered
button text (a Turbopack JSX-whitespace quirk) — replaced with a plain
template-literal string.

**Deviation from the spec:** login for *returning* users is the navbar's
popup modal, not a standalone `/login` page — carried forward from an
earlier explicit UX request in this project rather than reverted. The
*new-user* conversion step (`/book/[providerId]/signup`) is a real
dedicated page, per spec — only the returning-user shortcut is a popup.

Not yet built: nothing from this spec's page list — it's complete. Next
phase (not started): wire `apps/web`'s data layer to the Supabase backend
already sitting in `packages/supabase/`, once the prototype's flows are
validated.
