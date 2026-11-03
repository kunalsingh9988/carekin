# CareKin — frontend-only prototype

## Frontend completion extension

The web app now contains 52 page templates, including searchable help, local
support drafts, clearly marked policy drafts, family plan management and visit
rescheduling, provider availability/profile editing and booking details, plus
admin people/provider/booking detail screens. See
[the route inventory and functional boundaries](docs/frontend-completion.md).
These additions remain demo-only; they do not implement real support delivery,
recurring billing, real availability, account administration or verification.

Per the "CareKin Full Website Build Prompt": guest browsing → signup-at-
commitment funnel. No backend, no real auth, no real payments — every
"write" persists to browser `localStorage` through a typed data-access
layer (`src/lib/storage/`), structured so swapping it for Supabase later
is a data-layer change, not a rewrite.

```bash
pnpm --filter @carekin/web dev
```

First load seeds `localStorage` with demo data automatically (4 families,
16 providers mixed across pending/approved/rejected, bookings in every
status). To reset: clear the `carekin:*` keys in your browser's
localStorage (devtools → Application → Local Storage), or open an
incognito window.

## The funnel (the point of this build)

`/search` and `/providers/[id]` are fully public — no login wall before a
first-time visitor sees real, trust-primed content. The AOV decision
(weekly plan vs. one-off) happens at `/book/[providerId]`, still as a
guest — that selection is held in `lib/storage/session.ts`
(`pendingBooking`, ~24h expiry) and survives the signup gate at
`/book/[providerId]/signup` unchanged. It's only consumed for real —
creating an actual `bookings` record — at `/book/[providerId]/pay`, on a
successful payment.

Guest-safe fields only on public routes: `listApprovedProviders()` and
`getProviderPublic()` strip phone number and exact coordinates before
the data ever reaches a public page — enforced in the data layer, not the
UI.

## What's simulated, on purpose

- **OTP**: any 6-digit code is accepted, with an on-screen "Demo mode" note.
- **Payment**: `simulatePayment()` resolves after a fake delay, ~90%
  success / ~10% failure — reachable during a normal demo, not just
  theoretical (confirmed live during testing — hit the failure branch on
  the first real attempt).
- **KYC documents**: "upload" stores a filename + timestamp, no real file.
- **Payouts**: a simple pending → paid ledger, flipped by an admin's
  "Simulate payout run" button.
- **Referrals**: a code derived from the family id, and credit is granted
  the moment a referred signup completes (not gated on that family's first
  *paid* booking, which the real backend would need to check).

The one rule that is **not** simulated: verification gating. Only
`verification_status === 'approved'` providers are ever returned by
`listApprovedProviders()` / `getProviderPublic()` — filtered inside the
data layer, not hidden by the UI — mirroring the real backend's RLS
policy, guest or authenticated.

## Guided account setup

`/get-started` introduces the family, care-provider, and demo-admin journeys.
Families set up a private profile, optionally add an elder or child recipient
(guardian consent is required for children), then continue to care discovery.
Providers choose elder care or babysitting, create a profile, submit simulated
documents, and track application review. Admins get a three-step operations
tour with a demo acknowledgement before opening the dashboard. Returning
users resume incomplete family/provider setup or continue to their workspace.
The existing booking signup and profile steps retain the selected visit.

Shared responsive photo panels use original generated lifestyle imagery,
labelled as illustrative scenes rather than provider portraits. Accounts,
document submissions, and admin access remain browser-local simulations.

## Deviations worth knowing about

- **Login is a popup, not a page**, for *returning* users — `/login` from
  the spec's route list doesn't exist as a standalone route; it's the
  `AuthModal` component opened from the navbar, per an explicit earlier UX
  request in this project's history. The *new-user* conversion path
  (`/book/[providerId]/signup`) is a real dedicated page, per spec.
- Money is stored as integer paise, matching the real Supabase-backed
  schema's convention (`packages/supabase/migrations/`).
