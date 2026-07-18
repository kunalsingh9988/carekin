# CareKin

Two-sided marketplace connecting families with verified elder caregivers and
babysitters. Single-city launch, verification-gated visibility. See the
master build prompt for full product/technical spec.

## Structure

```
apps/
  mobile/   Expo (React Native) — Family + Provider flows
  web/      Next.js — marketing site, booking flow, admin dashboard
  api/      NestJS — backend, Prisma-backed
packages/
  shared-types/  Zod schemas + TS types shared across all apps
infra/
  docker-compose.yml   local Postgres+PostGIS and Redis
  prisma/schema.prisma core data model
```

## Getting started

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
pnpm install
pnpm db:up                 # start local Postgres+PostGIS and Redis
pnpm --filter @carekin/api exec prisma migrate dev --schema=../../infra/prisma/schema.prisma
pnpm dev                    # runs all apps via turbo
```

For the mobile app on a physical device, set `EXPO_PUBLIC_API_URL` in
`apps/mobile/.env` to your machine's LAN IP (not `localhost`), then
`pnpm --filter @carekin/mobile start`.

## Status

Scaffolded: monorepo, Prisma schema, Auth (OTP + JWT), Verification (with
admin-approval gating and audit log), Users/Profile (incl. care recipients),
geo-gated Search, a minimal admin verification queue UI (web), and a full
Expo navigation shell for both Family and Provider flows — phone OTP login,
role-based onboarding (profile + geo + care recipient / document checklist),
Family search + provider detail, and a Provider home screen showing live
verification status.

Not yet built: Booking, Payment, Chat, Notifications modules — see
[apps/api/src/modules/README.md](apps/api/src/modules/README.md). The mobile
Booking/Chat/Payouts screens exist as UI shells with clear "not wired up yet"
messaging rather than fake functionality, since Payment/Chat need real
Razorpay/KYC-vendor credentials (Section 12 of the build prompt) to be more
than scaffolding.
