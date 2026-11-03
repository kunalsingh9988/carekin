# CareKin development backend

## Target and installation

Project: `hjoektofktwvdlgptcrk`, URL `https://hjoektofktwvdlgptcrk.supabase.co`.
Region: eu-west-1. This project is a development environment, not a launch-ready
care service. Use synthetic information only until privacy, security and
operational reviews are complete.

The project was inspected before installation: no CareKin application tables
were present. The old `../migrations/20260728084712_initial_schema.sql` is a
different architecture and was deliberately not applied. These numbered SQL
files are the authoritative backend release; they are not recorded in the
Supabase CLI migration-history table. Do not run `supabase db push/reset` against
this project until migration history is explicitly reconciled.

From the repository root, with the owner's authenticated Supabase CLI:

```sh
supabase link --project-ref hjoektofktwvdlgptcrk --workdir packages
# Fresh project only; 001 creates tables and must not be rerun:
supabase db query --linked --workdir packages --file supabase/backend/001_core.sql
supabase db query --linked --workdir packages --file supabase/backend/002_api.sql
supabase db query --linked --workdir packages --file supabase/backend/003_care.sql
supabase db query --linked --workdir packages --file supabase/backend/004_hardening.sql
```

All four files have already been applied to the target above. Subsequent
function-only fixes may reapply 002/003. Introduce separately numbered,
reviewed migrations for future schema changes. Take a backup before changes
to a populated database. Do not push the historical `../config.toml`: it has
local-only assumptions and test OTP configuration.

## Web configuration

Use these non-secret variables in `apps/web/.env.local` and the selected Vercel
Preview environment, at both build and runtime:

```dotenv
NEXT_PUBLIC_BACKEND_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://hjoektofktwvdlgptcrk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_project_publishable_key
```

The browser uses its own authenticated session to call RPCs. Never put a
`sb_secret_…` key or legacy service-role JWT in a `NEXT_PUBLIC_` variable,
source code, a committed file, or a browser. Privileged credentials supplied
in chat must be rotated/revoked by the owner; they were not embedded in this app.

## Authentication and the first administrator

1. In Supabase Authentication → URL Configuration, add the intended development
   origins' `/auth/callback` URLs, including the password-reset callback query
   if using exact URLs. For local development this is
   `http://localhost:3100/auth/callback` and
   `http://localhost:3100/auth/callback?next=/reset-password` (adjust the port if
   running elsewhere). Add the exact chosen Vercel preview equivalent.
2. Keep email confirmations enabled. Configure a custom SMTP sender for testers
   outside the Supabase project team. The built-in mail service is restricted
   and low-volume; real confirmation/reset delivery has not been verified.
3. The owner signs up and confirms their own email. Do not send their password
   or a confirmation code to an assistant. Family/provider accounts can enroll
   themselves; administrator enrollment is intentionally impossible in the UI.
4. After confirming the exact owner email, an authorized project operator may
   execute the SQL below in the SQL editor. Replace the placeholder deliberately
   and inspect the returned ID. No first admin was guessed or provisioned.

```sql
insert into carekin.accounts (id, role)
select id, 'admin' from auth.users
where lower(email) = lower('OWNER_EMAIL_HERE') and email_confirmed_at is not null
on conflict (id) do update set role = 'admin'
returning id, role;
```

Sign out/in after assignment. Use `/admin` to review real provider submissions,
`/admin/support` for support and the safety queue for reports. Manual approval
is not identity verification or an external background check.

## Authorization design

- All 20 application tables live in the private `carekin` schema with RLS
  enabled and direct browser table privileges revoked.
- A single allowlisted `public.carekin_api(operation,args)` SECURITY DEFINER
  function exposes safe public provider/review reads and authenticated workflows.
- Its fixed empty search path prevents object shadowing. Account identity is
  `auth.uid()`; roles are private database records, never user metadata or
  localStorage. Every operation checks ownership/role. The function intentionally
  bypasses table RLS under its owner; its checks are therefore security-critical.
- Helpers are not exposed as public RPCs. Only role/admin helpers needed by
  Storage RLS are callable by authenticated users.
- Private uploads are restricted to provider-owned paths. Owner/admin reads
  generate short-lived URLs. The bucket enforces 5 MB and PDF/JPEG/PNG types.
  MIME allowlisting is not malware scanning; scanning and retention are pending.
- Quotes come from server settings. A database exclusion constraint rejects
  overlapping requested/confirmed/active visits. Availability uses India time.
- Development settings are ₹300/hour, 15% commission, unpaid visit acceptance
  enabled. These are test configuration, not approved commercial terms. Browser
  users cannot change them. Confirm launch prices and reconcile marketing copy.
- Chat author identity and notifications are server-generated. Basic booking,
  chat and support limits exist; this is not comprehensive anti-abuse protection.
- PIN failures commit even when validation fails. Five failures lock check-in
  until the family regenerates a PIN. Providers cannot fetch the PIN.
- Safety reports are private to reporter/operations; staff audit/evidence are
  not returned to the reporter. Escalation interrupts contact access, notifies
  no emergency service, and has no staffed-response guarantee.

## Validation

```sh
supabase db query --linked --workdir packages --file supabase/tests/backend.sql
supabase db advisors --linked --workdir packages --type security --level warn
pnpm --filter @carekin/web test
pnpm --filter @carekin/web typecheck
pnpm --filter @carekin/web lint
pnpm --filter @carekin/web build
```

The SQL test uses synthetic accounts inside a transaction and rolls everything
back. It covers identity spoofing, role escalation, direct table denial,
cross-account isolation, Storage metadata RLS, approval gates, public-field
privacy, server prices, duplicate requests, overlap constraints, chat, PIN,
checkout, reviews, safety visibility and unpaid-payout prevention. It is not a
load test or a full independent penetration test.

`scripts/qa-backend.mjs prepare/check/cleanup` additionally exercises real Auth
and PostgREST using a disposable synthetic identity. Its random credentials are
stored only in ignored `.impeccable/review/backend/qa-identity.json`. Always run
cleanup after the browser check; never use this mechanism for customer accounts.

Advisor warnings currently include the intentionally executable gateway (anon
and authenticated) and disabled leaked-password protection. The first two
require continuing review of every authorization branch, not blanket dismissal.
Leaked-password protection must be assessed against plan availability before
launch; no paid upgrade was purchased.
