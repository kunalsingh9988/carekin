# archive/web-supabase

The Supabase-backed `apps/web` (real Postgres RLS auth, `signInWithOtp`/
`verifyOtp`, an admin queue calling live RPC functions) — superseded when
the project stepped back to build a frontend-only localStorage prototype
first, per the "CareKin Frontend-Only Build Prompt". `apps/web` now holds
that prototype instead.

This was fully working (verified in-browser: login modal, dark-mode
tokens, tap-target sizing, admin-queue auth-redirect) before being
archived — not abandoned mid-build. See `packages/supabase/` for the
Postgres schema/RLS/RPCs this frontend talked to; that's untouched and
still the plan for when the prototype's flows are validated and it's time
to wire up a real backend again.
