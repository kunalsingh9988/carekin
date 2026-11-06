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
| Authentication | Real email/password sign-in and signup, Google OAuth with PKCE, confirmation resend, password recovery/reset UI, cookie-session refresh and logout. Google login, first enrollment and session persistence verified live on 6 November. Public email delivery still needs sender configuration and mailbox verification (see below). Demo login/role switching disabled in backend mode. |
| Authorization | Private account roles, protected routes, database-enforced ownership checks and role gates; no public administrator signup. |
| Families | Persistent profiles, elder/child recipients, recorded guardian checkbox consent and consent withdrawal with upcoming-visit cancellation/contact restriction. |
| Providers | Persistent applications, editable public profile, weekly availability, pending/approved/rejected state and verification history. |
| Documents | Actual private PDF/JPEG/PNG uploads, owner path restrictions, metadata tied to stored files, short-lived owner/admin viewing links. |
| Discovery | All locations open for development testing; approved-only directory and reviews across locations, with a 100-result limit. Public responses omit phone, exact coordinates and account IDs. No fake providers appear in backend mode. |
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

- Frontend/business/auth suite: 69 tests passed, including location validation,
  cross-continent discovery, callback exchange,
  cancellation/expiry/network errors, safe return URLs and public role hints.
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
   never authenticate arbitrary production accounts. Email/password and Google
   OAuth do not require an SMS provider.
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
2. The first administrator account has been assigned after email confirmation.
   Keep administrator credentials private and enable MFA before launch.
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

On 4 November, the owner approved replacing the public demo at
`https://carekin-web.vercel.app` with the Supabase-backed version. Production
uses the same existing Supabase project as the development preview; these
environments do not yet have isolated databases. Only public Supabase client
configuration is needed in Vercel. Demo login and demo provider records are
not available in backend mode. Payments remain disabled and the development
warning remains visible. Publishing on the main domain does not make the
service launch-ready; the requirements above still apply. See the task handoff
for the verified deployment result.

## Email and Google sign-in setup (4 November)

- Email and Google are enabled in the live Supabase project's public Auth
  settings; phone is disabled. Backend-mode login does not request phone OTP.
- The Google OAuth client was configured for the separate Fill-it-up project.
  Added CareKin's authorized redirect URI
  `https://hjoektofktwvdlgptcrk.supabase.co/auth/v1/callback` and JavaScript origin
  `https://carekin-web.vercel.app`, preserving the existing Fill-it-up entries.
  Google Cloud confirmed the save; the live Google button now reaches account
  selection instead of `redirect_uri_mismatch`.
- Corrected Supabase's Site URL from `http://localhost:3000` to
  `https://carekin-web.vercel.app` and added the production callback allowlist
  `https://carekin-web.vercel.app/auth/callback**`. Supabase confirmed both saves.
  Local development and Vercel previews need their own explicit callback entries
  before OAuth/email links are tested on those origins.
- Continuing the live Google flow exposed a second configuration fault. The
  Supabase Auth log at 23:05:53 India time reported
  `oauth2: "invalid_client" "The provided client secret is invalid."`.
  Google no longer allows retrieving this client's existing secret. The owner
  must add a secret and enter it directly in Supabase's Google provider settings;
  retain the old Google secret because another application shares this client.
  Never commit, log or send the replacement secret in chat.
- After the owner reported saving a new secret, the live retest at 23:39:15
  still returned Google's `invalid_client` / invalid client secret error
  (Supabase log `c6ca86a4-e443-461b-8170-e9db56aa5c4f`). Google login remains
  blocked; the credential must belong to the configured OAuth client, not
  another Google client/project. Provider errors now have a separate safe
  message instead of being mislabeled as expired email-confirmation links.
- New Google users choose family/provider after their first successful login;
  existing users retain their database role. A URL hint never grants admin.
- The callback preserves safe internal booking destinations and routes expired
  or cancelled links back to a recovery-capable sign-in screen. It is not cached.
- On 6 November, after the owner saved the matching Google client secret,
  live Google sign-in succeeded through the PKCE callback and a verified session.
  The first-time account was enrolled as family and reached `/family/onboarding`;
  a reload restored that session. No care profile/address was entered. The
  family session was redirected away from `/admin` to its own dashboard.
- The owner-provided screenshot exposed the newly saved Google secret. Rotate
  that new secret and update Supabase directly; preserve the older shared
  secret. Never store either value in the repository or status reports.
- Authentication hardening: logout now waits for Supabase and reports failures
  without pretending the user is signed out; password reset checks for a valid
  session before showing its form and provides a clear missing/expired-session
  recovery path. Automated session tests cover success, pending sign-out,
  sign-out failure, and unauthenticated access.
- Email signup/sign-in, resend and recovery implementations were reviewed;
  existing-password login no longer applies the new-signup minimum length
  before Supabase can validate an existing account's password.
  valid, cancelled and expired callback paths have automated coverage. This
  is not proof of real email delivery or a real password change. Arbitrary
  public email signup/confirmation/reset delivery still requires a configured
  sender and mailbox tests. Phone OTP remains disabled, not simulated or
  bypassed. Google sign-in does not use the SMTP service.
- Main-site promotion was explicitly approved by the owner, including replacing
  demo records with real Supabase records and keeping payments disabled.

## All-location development access (4 November)

Location request hardening (6 November): the shared family/provider picker
accepts a device fix cached for at most one minute, then retries a temporary
failure once with a fresh high-accuracy request (15 + 20 second acquisition
timeouts). Permission denial is never retried or bypassed. Errors distinguish
denied permission, unavailable services, timeout, unsupported browsers and
insecure contexts, with browser/device recovery instructions. Cancel and manual
selection invalidate pending results, and selecting a fallback clears stale
errors. No IP-location service, external geocoder or fixed-city fallback was
added. Automated device responses and rendered recovery states are tested;
physical device positioning and the owner's OS permissions remain unverified.

At the owner's request, the Bengaluru-only presentation and nearby discovery
limit have been removed for development. Arbitrary city/area searches and city
pages are accepted; suggested cities are shortcuts, not a whitelist. Approved
providers across locations can be browsed without granting geolocation access.
Distances are shown only for recognized city centres and labelled accordingly.
New family/provider profiles can use GPS anywhere, a suggested city centre, or
manually entered valid coordinates; denied GPS no longer assigns Koramangala.
The backend change is `005_all_locations.sql`, controlled by the private
`development_all_locations` setting. A global test directory does not guarantee
local provider availability. Payments and provider approval rules are unchanged.
