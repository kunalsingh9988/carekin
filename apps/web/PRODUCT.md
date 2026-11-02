# CareKin — Product truth

## What it is

A two-sided care marketplace for Indian families: verified elder caregivers
and babysitters, browsable by guests, bookable after a deferred-signup
funnel. Families find, book, pay, chat, review, and rebook; providers
apply, submit documents, get verified by a human admin, then receive
bookings and payouts; admins run a verification queue, disputes, and
payouts.

## Stage

Frontend-only prototype. localStorage persistence, simulated OTP,
payments, uploads, and payouts — all labeled demo-mode on screen. The
repository layer is the seam for a future Supabase backend (RLS schema
exists dormant in `packages/supabase`).

## Non-negotiable product rules

- Only `verification_status === "approved"` providers are visible to
  families, enforced in the data layer (`listApprovedProviders`,
  `getProviderPublic`), never by hiding in UI.
- Guest-safe projection strips `phone`, `latitude`, `longitude` before
  data reaches public routes.
- Deferred signup: a guest chooses provider + plan + date before any
  auth; `pendingBooking` session state carries it; booking rows are only
  created at payment time; retries reuse one row.
- Child care recipients require explicit guardian consent
  (`addChildRecipientWithConsent` is the only path); consent UI uses no
  persuasive patterns.
- Money in integer paise; commission floor 15%, default 18%.
- Honest demo labeling everywhere simulation exists.

## Audience and voice

Families in Indian metros arranging care for parents or children —
anxious, time-poor, trust-first. Voice: short, plain, reassuring,
sentence case, service-first nouns, concrete prices and times. Numbers
do the persuading (ratings, verified counts, response times).

## Brand commitment

Visual system follows the supplied Urban Company brand guidelines v1.0:
calm monochrome surfaces, one confident violet, green reserved for
ratings/success, pairing-B typography (Bricolage Grotesque display /
Figtree body / Noto Sans Devanagari for Hindi), 10px buttons, 14px
cards, 99px chips, 8px grid.
