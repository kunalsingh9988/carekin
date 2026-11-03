# CareKin backend completion report

Date: 4 November 2026. Scope: implement as much as safely possible with the
existing Supabase project, without buying SMS, payments or other services.

## Overall status

**A real development backend is implemented and applied to Supabase. The
website is not yet ready to accept real care bookings or payments.**

No real customers, caregivers, identity documents or payment transactions were
seeded. Existing localStorage demo data is not migrated; it must never become
real provider verification, review or financial history.

## Completed

| Area | Implemented behavior |
| --- | --- |
| Authentication | Real email/password sign-in and signup, confirmation callback, password recovery/reset UI, cookie-session refresh and logout. Demo login/role switching disabled in backend mode. |
| Authorization | Private account roles, protected routes, database-enforced ownership checks and role gates; no public administrator signup. |
| Families | Persistent profiles, elder/child recipients, recorded guardian checkbox consent and consent withdrawal with upcoming-visit cancellation/contact restriction. |
| Providers | Persistent applications, editable public profile, weekly availability, pending/approved/rejected state and verification history. |
| Documents | Actual private PDF/JPEG/PNG uploads, owner path restrictions, metadata tied to stored files, short-lived owner/admin viewing links. |
| Discovery | Approved-only provider directory and reviews; public responses omit phone, exact coordinates and account IDs. No fake providers appear in backend mode. |
| Booking | Single-visit development requests, server-owned quotes, availability checks in India time, duplicate protection, database overlap exclusion, provider accept/decline, cancellation and rescheduling. |
| Chat | Shared persisted messages for authorized participants; sender derived from session, contact restrictions enforced on reads/writes, basic send-rate limit. UI uses polling, not WebSocket Realtime. |
| Active Care | Server-side visit phases/timestamps, family-owned arrival PIN, failed-PIN lockout, provider check-in, checklist, care brief/address windows, checkout request/family confirmation and safe return. |
| Safety | Private reports, evidence snapshot, severity escalation, visit interruption/contact restriction and operations assignment/review audit. No emergency dispatch. |
| Reviews | One real review per completed booking, authored by its family; rating aggregation. |
| Operations | Provider review, booking/user views, dispute queues/resolution, persistent support queue/resolve and private safety-case handling. |
| Notifications/referrals | Persisted in-app notifications and referral attribution. No SMS/email delivery or automatic monetary referral credit. |
| Financial safeguards | Payment/payout storage and authorized reads; no browser payment capture or fake payout run. Unpaid development visits cannot create payout balances. |
| Data security | RLS on all application tables, no direct browser table grants, restricted RPC gateway and private Storage policies; no privileged key in app code. |

## Validation and limitations of evidence

- Existing frontend/business suite: 40 tests passed.
- TypeScript checking, ESLint and the optimized Next.js production build passed.
- Transactional SQL integration/security suite passed against the actual linked
  project, including cross-account denial and private upload metadata RLS.
- Real Supabase Auth password login and authenticated PostgREST RPC passed with
  a disposable QA identity; no session token was logged.
- Browser tested family enrollment/onboarding and cloud-persisted profile and
  recipient display. A family account attempting `/admin` was redirected to
  its own dashboard. This is browser QA, not physical-device validation or a
  comprehensive three-role end-to-end launch certification.
- No real confirmation email, SMS, payment, refund, payout, emergency response
  or third-party background check has been performed.
- Security Advisor retains three warnings: two intentional SECURITY DEFINER
  gateway exposures and disabled leaked-password protection. The gateway is a
  deliberate authorization boundary but still needs independent review.
- Database scripts are versioned, but CLI migration-history reconciliation and
  automated schema deployment are pending. Historical schema/config is not used.

## Remaining engineering before launch

1. **Payments and payouts:** provider choice, server-created orders, signed and
   idempotent webhooks, capture/refund reconciliation, cancellation fees,
   payout/KYC onboarding, retries, audit trail and test-to-live controls.
2. **Recurring care:** subscription billing, scheduled visit generation,
   provider conflicts, pause/cancel effects, renewal failures and notifications.
3. **Phone OTP:** select/configure a delivery provider and integrate the real
   sign-in/verification flow, including abuse protection. Fixed test codes must
   never authenticate arbitrary production accounts. Current mode uses email.
4. **Email deliverability:** configure SMTP and exact auth redirect URLs; test
   real signup confirmation, recovery and transactional messages. Built-in
   Supabase mail is restricted and low-volume, not a public launch sender.
5. **Operations and safety:** background-check vendor/manual evidence standards,
   real staff admin accounts, support response process, escalation ownership,
   emergency procedures, masked calling and trusted-contact notifications.
6. **Security/privacy hardening:** administrator MFA, comprehensive abuse/CAPTCHA
   controls, upload malware scanning, retention/deletion/export workflows,
   signed URL review, data-region suitability, independent authorization audit
   and resolved/accepted security advisories.
7. **Reliability:** production monitoring/error reporting, backups and restore
   drill, scheduled jobs, orphan-upload cleanup, pagination/load testing,
   concurrent booking tests and failure/retry handling across integrations.
8. **Product readiness:** finalize commercial prices/service hours/refund policy,
   remove unsupported marketing claims, onboard genuine providers, complete
   multi-user/device/accessibility testing and separate staging from production.

These are a mix of unfinished implementation and owner/business decisions.
Supplying API keys alone does not complete them.

## What the owner needs to provide/do

1. Rotate/revoke the privileged Supabase keys previously posted in chat. Do not
   paste replacements into messages; this application does not need them.
2. Confirm the email address for the first operations administrator and create
   that account yourself. Admin privileges will be assigned privately afterward.
3. Add the chosen development callback URLs in Supabase Authentication and
   provide/configure a sender for reliable email testing. No Twilio upgrade is
   required to keep developing with email/password.
4. Decide launch city, service radius, operating hours, actual prices/commission,
   cancellation/refund rules and guardian-consent/privacy requirements.
5. When ready for paid services, connect payment/SMS providers through their
   dashboards or secret environment settings, and complete their required
   account/business verification. Do not share passwords or OTPs in chat.
6. Supply genuine provider applications and decide who reviews them and responds
   to safety reports. Software cannot substitute for that operational work.

## Release boundary

This backend is prepared on `codex/supabase-backend` for a development preview.
It must not be promoted as launch-ready production. Keep the existing public
site unchanged until testing, owner setup and remaining launch requirements
are completed. See the task handoff for the verified commit and preview URL.
