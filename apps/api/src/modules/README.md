# Module build order

Per Section 10 of the master build prompt: Auth → User/Profile → Verification → Booking → Payment → Chat → Notifications.

Built so far: `auth`, `verification`, `users` (family/provider profiles, care
recipients), `search` (search demonstrates verification-gating at the query
layer, ahead of full booking flow).

Not yet built — next up, in order:
- `bookings` — one-off + subscription booking flow
- `payments` — Razorpay/Cashfree order + webhook handling, commission split (Section 8)
- `chat` — Socket.io, unlocked only post-CONFIRMED booking (Section 7)
- `notifications` — FCM push + in-app notification records

Payments and chat need live vendor credentials (Section 12 checklist) to be
more than scaffolding, so they're deliberately left unbuilt rather than
half-implemented against fake keys.
