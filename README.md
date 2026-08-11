# CareKin

Two-sided marketplace connecting families with verified elder caregivers and
babysitters. Single-city launch; the verification-gating rule (a pending or
rejected provider is never visible to families) is the one thing that has
survived every architecture pivot below unchanged.

**Current build: frontend-only prototype**, per the "CareKin Frontend-Only
Build Prompt" — no backend, no real auth, no real payments. Every "write"
persists to browser `localStorage` through a typed data-access layer
(`apps/web/src/lib/storage/`), structured so swapping it for the
Supabase-backed build below is a data-layer change later, not a rewrite.
See [apps/web/README.md](apps/web/README.md) for what's simulated and how.

**History**, newest first:
1. **Frontend-only localStorage prototype** (current) — `apps/web` rebuilt
   as a full click-through demo of every screen, no backend, per the
   frontend-only build prompt's own framing as the phase that should
   precede real backend work.
2. Next.js + Supabase (Postgres RLS as the real authorization boundary) —
   archived, not deleted, see [archive/README.md](archive/README.md) and
   [archive/web-supabase/README.md](archive/web-supabase/README.md). The
   Postgres schema/RLS/RPCs in `packages/supabase/` are untouched and still
   the plan for when this prototype's flows are validated.
3. NestJS + Prisma + self-hosted Postgres/Redis — archived at
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

Built: all ~25 pages from the frontend-only prompt's Screen Inventory —
marketing (4), mock phone-OTP login (as a popup, not a page — see below),
family onboarding + guardian consent, search → provider profile → booking
→ simulated payment (with a real ~10%-of-attempts failure/retry path), My
Bookings, in-app chat, reviews, family settings, the full provider app
(onboarding, KYC upload, verification-status tracker, booking
accept/decline, payouts), and the full admin console (verification queue,
all bookings, disputes, payout runs). Verified end-to-end in-browser,
including a real payment failure hit on the first attempt during testing.

**Deviation from the frontend-only spec:** login is the navbar's popup
modal, not a standalone `/login` page — this project had already moved to
a popup-based auth flow (an explicit UX request) before this prototype
phase started, and that stuck.

Not yet built: nothing from the frontend-only prompt's page list — it's
complete. Next phase (not started): wire `apps/web`'s data layer to the
Supabase backend already sitting in `packages/supabase/`, once the
prototype's flows are validated.
