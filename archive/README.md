# Archive

CareKin pivoted from a NestJS + Prisma + self-hosted Postgres/Redis backend to
a Next.js + Supabase architecture (Postgres RLS as the authorization layer,
Supabase Auth/Storage/Realtime/Edge Functions instead of a separate API
service). See the repo root README and the "Web App Master Build Prompt" for
the current architecture.

This directory preserves the earlier working implementation rather than
deleting it — it's not part of the pnpm workspace (excluded from
`apps/*`/`packages/*` globs) and isn't built, typechecked, or run by any
script.

- `api-nestjs/` — the NestJS backend (Auth, Verification with admin-approval
  gating, Users/Profiles, geo-Search), superseded by Supabase RLS +
  Edge Functions.
- `infra-prisma-docker/` — the Prisma schema and docker-compose setup for
  local Postgres+PostGIS/Redis, superseded by the Supabase CLI's local dev
  stack (`packages/supabase/`).

`apps/mobile` (Expo) is untouched and still lives at its original path — the
new spec's guardrail against building the mobile app applies to *new* work,
not to what already exists. Mobile development is simply paused until the
Supabase-backed web app is validated, per Section 9 step 12 of the new spec.
