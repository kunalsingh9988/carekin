# CareKin

Two-sided marketplace connecting families with verified elder caregivers and
babysitters. Single-city launch, verification-gated visibility enforced by
Postgres Row Level Security. See the "CareKin Web App Master Build Prompt"
for the full spec.

**Architecture pivot (2026-07-28):** moved from a NestJS + Prisma + self-hosted
Postgres/Redis backend to Next.js + Supabase (Postgres RLS as the real
authorization boundary, Supabase Auth/Storage/Realtime/Edge Functions instead
of a separate API service). The old implementation is preserved, not deleted
— see [archive/README.md](archive/README.md). `apps/mobile` (Expo) is paused,
not migrated, and still works against its own frozen type package.

## Structure

```
apps/
  web/                Next.js 15 App Router — marketing, auth, admin (family/provider next)
  mobile/              Expo (paused — see archive/README.md)
packages/
  core/                Framework-agnostic business logic (commission, verification-state, booking-eligibility)
  types/                Supabase-generated Database types (hand-written placeholder — see below)
  validation/          Zod schemas mirroring the Postgres schema, lowercase enum values
  ui-tokens/            Design tokens as portable JSON + generated CSS + Tailwind mapping
  shared-types/        Frozen, mobile-only — do not use for new work (see its own README)
infra:
  packages/supabase/    Supabase CLI project: migrations/, seed.sql, functions/ (not an npm package)
archive/
  api-nestjs/           Superseded NestJS backend
  infra-prisma-docker/  Superseded Prisma schema + docker-compose
```

## Getting started

```bash
cp apps/web/.env.example apps/web/.env.local   # fill in real Supabase project values
pnpm install
pnpm db:start   # supabase start — requires Docker Desktop, not available in this sandbox
pnpm db:reset   # applies migrations + seed.sql
pnpm db:types   # regenerates packages/types/src/supabase.ts for real
pnpm --filter @carekin/web dev
```

**This sandbox has no Docker**, so `packages/supabase`'s migration and seed
were validated a different way: against a real vanilla Postgres 17 +
PostGIS install (via Homebrew) with hand-stubbed `auth`/`storage` schemas
standing in for what Supabase's platform normally provides. Every
table/policy/RPC function was created successfully, and `review_verification`,
`create_child_care_recipient`, `search_providers`, `list_pending_providers`,
and `claim_initial_role` were all exercised directly and behaved correctly
(including rejecting the exact bypass attempts they exist to prevent). Once
Docker is available, run `pnpm db:start && pnpm db:reset` for the real thing.

`apps/web` itself builds and runs today — verified in-browser (login page,
role toggle, OTP form, dark-mode tokens, tap-target sizing, and the admin
queue's auth-redirect all confirmed working) — it just can't complete a real
sign-in without a live Supabase project's URL/anon key in `.env.local`.

## Status

Built: Turborepo skeleton, full Postgres schema + RLS (Section 5.2's
verification gate implemented and tested), `packages/core` /`validation`/
`ui-tokens`, phone-OTP auth pages, and the admin verification queue
(Server Actions calling `review_verification` / `list_pending_providers`).

Not yet built, in build-order sequence: `(provider)` onboarding + KYC
upload, `(family)` search/booking/payment collection, chat, notifications,
and the payout Edge Function (blocked on an RBI Payment Aggregator
confirmation from Razorpay/Cashfree — see the spec's Section 2 guardrail).
`carekin-design-system.html` (referenced in Section 6) wasn't found
anywhere on this machine — `packages/ui-tokens/tokens.json` marks which
values are copied verbatim from the spec vs. reasonable placeholders;
replace the placeholders once that file exists.
