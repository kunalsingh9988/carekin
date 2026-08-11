# CareKin — frontend-only prototype

Per the "CareKin Frontend-Only Build Prompt": every screen from the PRD's
Screen Inventory, no backend, no real auth, no real payments. Every "write"
persists to browser `localStorage` through a typed data-access layer
(`src/lib/storage/`), structured so swapping it for Supabase later is a
data-layer change, not a rewrite.

```bash
pnpm --filter @carekin/web dev
```

First load seeds `localStorage` with demo data automatically (4 families,
16 providers mixed across pending/approved/rejected, bookings in every
status). To reset: clear the `carekin:*` keys in your browser's
localStorage (devtools → Application → Local Storage), or open an
incognito window.

## What's simulated, on purpose

- **OTP**: any 6-digit code is accepted, with an on-screen "Demo mode" note.
- **Payment**: `simulatePayment()` resolves after a fake delay, ~90%
  success / ~10% failure — reachable during a normal demo, not just
  theoretical.
- **KYC documents**: "upload" stores a filename + timestamp, no real file.
- **Payouts**: a simple pending → paid ledger, flipped by an admin's
  "Simulate payout run" button.

The one rule that is **not** simulated: verification gating. Only
`verification_status === 'approved'` providers are ever returned by
`listApprovedProviders()` — filtered inside the data layer, not hidden by
the UI — mirroring the real backend's RLS policy.

## Deviations worth knowing about

- **Login is a popup, not a page.** `/login` from the original page list
  doesn't exist as a route — it's the `AuthModal` component, opened from
  the navbar, per an explicit later UX request in this project's history.
- Money is stored as integer paise, matching the real Supabase-backed
  schema's convention (`packages/supabase/migrations/`).
