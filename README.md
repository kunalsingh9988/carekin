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
pnpm install
pnpm db:up                 # start local Postgres+PostGIS and Redis
pnpm --filter @carekin/api exec prisma migrate dev --schema=../../infra/prisma/schema.prisma
pnpm dev                    # runs all apps via turbo
```

## Status

Scaffolded: monorepo, Prisma schema, Auth (OTP + JWT), Verification (with
admin-approval gating and audit log), Users/Profile, geo-gated Search, and a
minimal admin verification queue UI.

Not yet built: Booking, Payment, Chat, Notifications modules, and the Family/
Provider mobile flows — see [apps/api/src/modules/README.md](apps/api/src/modules/README.md)
for what's next and why Payment/Chat are blocked on real vendor credentials
(Section 12 of the build prompt).
