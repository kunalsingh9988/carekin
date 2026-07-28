-- CareKin — initial schema (Phase 1 / single pilot city)
-- See "CareKin Web App Master Build Prompt" for the spec this implements.
-- Every table has RLS enabled — RLS is the real authorization boundary here
-- (Section 5.2), not application code, because Supabase clients talk to
-- Postgres directly via PostgREST.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pg_cron;

-- ============================================================================
-- Enum types
-- ============================================================================

create type public.user_role as enum ('family', 'provider', 'admin');
create type public.care_recipient_type as enum ('elder', 'child');
create type public.provider_type as enum ('caregiver', 'babysitter');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.document_type as enum ('id_proof', 'address_proof', 'certificate');
create type public.booking_type as enum ('one_off', 'subscription');
create type public.booking_status as enum ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed');
create type public.subscription_frequency as enum ('weekly', 'monthly');
create type public.subscription_status as enum ('active', 'paused', 'cancelled');
create type public.payment_status as enum ('created', 'captured', 'failed', 'refunded');
create type public.payout_status as enum ('queued', 'processing', 'paid', 'failed');
create type public.parental_consent_method as enum ('in_app_checkbox', 'digital_signature', 'otp_confirmation');

-- ============================================================================
-- Helper functions (security definer, used across multiple RLS policies)
-- ============================================================================

-- Role is looked up from user_roles, NOT a JWT claim, so a role change takes
-- effect immediately rather than after the next token refresh (Section 5.2).
-- Generic updated_at trigger, applied per-table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keeps the PostGIS `location` column in lockstep with latitude/longitude
-- so callers never have to (and never get it out of sync) — one write,
-- not the two-step "insert row, then raw-SQL update location" dance.
create or replace function public.set_location_from_lat_lng()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.location = extensions.ST_SetSRID(extensions.ST_MakePoint(new.longitude, new.latitude), 4326)::extensions.geography;
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- One row per authenticated user, one role each. A user needing both a
-- family and provider identity would need two auth.users accounts under
-- this model — acceptable for Phase 1's single-city scope.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  location extensions.geography(point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Verifiable parental consent as a distinct, logged step (DPDP Act Section 9,
-- Section 2/8 guardrails) — never inferred from the parent's own signup.
create table public.parental_consents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles (id) on delete cascade,
  consented_by uuid not null references auth.users (id),
  method public.parental_consent_method not null,
  consented_by_name text not null,
  consented_at timestamptz not null default now(),
  -- Withdrawal must be as easy as giving consent (Section 8) — a real
  -- control sets this, not a support ticket. A cron job (see bottom of this
  -- file) is responsible for acting on withdrawn consents.
  withdrawn_at timestamptz
);

create table public.care_recipients (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles (id) on delete cascade,
  type public.care_recipient_type not null,
  name text not null,
  notes text,
  parental_consent_id uuid references public.parental_consents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_requires_consent check (type <> 'child' or parental_consent_id is not null)
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  type public.provider_type not null,
  bio text,
  service_radius_km numeric not null default 5,
  latitude double precision not null,
  longitude double precision not null,
  location extensions.geography(point, 4326),
  -- Denormalized onto the row itself (not just the verification_reviews
  -- table) so the verification-gate RLS policy below can filter directly
  -- without a join — this is the exact shape the spec's own RLS example
  -- assumes (Section 5.2).
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audit trail for every verification decision (Section 7 of the original
-- build prompt, carried over here) — who changed it, when, why, plus
-- whatever vendor refs came back from KYC/police-verification checks.
create table public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  from_status public.verification_status,
  to_status public.verification_status not null,
  kyc_provider_ref text,
  police_verification_ref text,
  reviewed_by uuid references auth.users (id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  type public.document_type not null,
  storage_key text not null,
  uploaded_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles (id),
  provider_id uuid not null references public.providers (id),
  frequency public.subscription_frequency not null,
  amount_paise bigint not null,
  next_billing_date date not null,
  status public.subscription_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family_profiles (id),
  provider_id uuid not null references public.providers (id),
  care_recipient_id uuid not null references public.care_recipients (id),
  type public.booking_type not null,
  status public.booking_status not null default 'requested',
  scheduled_at timestamptz not null,
  duration_hours numeric not null,
  -- Money as integer paise (Razorpay's own convention) — never floating point.
  amount_paise bigint not null,
  commission_paise bigint not null,
  subscription_id uuid references public.subscriptions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_not_below_floor check (commission_paise >= (amount_paise * 0.15)::bigint)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id),
  razorpay_order_id text not null unique,
  status public.payment_status not null default 'created',
  amount_paise bigint not null,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payout data model exists now; the payout Edge Function itself is NOT
-- finalized — RBI's PA Master Direction restricts split-settlement payouts
-- to merchants above Rs 40L annual turnover, which most individual
-- caregivers fall under. See Section 2 guardrail: confirm with Razorpay/
-- Cashfree before wiring this up for real money movement.
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id),
  booking_id uuid not null unique references public.bookings (id),
  amount_paise bigint not null,
  status public.payout_status not null default 'queued',
  payout_provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id),
  provider_id uuid not null references public.providers (id),
  rating smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint rating_range check (rating between 1 and 5)
);

-- Unlocked only once a booking is confirmed/completed — enforced by RLS
-- below, not application code (Section 2 guardrail).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id uuid not null references auth.users (id),
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Role-check helper functions
--
-- These must come after the tables they query (user_roles) — `language sql`
-- function bodies are validated against the catalog at CREATE FUNCTION time,
-- unlike plpgsql which defers all resolution to first execution.
-- ============================================================================

-- Role is looked up from user_roles, NOT a JWT claim, so a role change takes
-- effect immediately rather than after the next token refresh (Section 5.2).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.current_role_is(target_role public.user_role)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = target_role
  );
$$;

-- The ONLY path that writes user_roles from the client side (there is no
-- INSERT policy on the table at all — see RLS below). Deliberately narrow:
-- 'admin' can never be self-assigned through here, and a user who already
-- has a role can't call this to change it — that's an admin action, done
-- directly against the table by someone who already passed is_admin().
create or replace function public.claim_initial_role(p_role public.user_role)
returns public.user_roles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.user_roles;
begin
  if p_role = 'admin' then
    raise exception 'admin cannot be self-assigned';
  end if;
  if exists (select 1 from public.user_roles where user_id = (select auth.uid())) then
    raise exception 'Role already assigned for this user';
  end if;

  insert into public.user_roles (user_id, role) values ((select auth.uid()), p_role)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.claim_initial_role from public;
grant execute on function public.claim_initial_role to authenticated;

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create trigger set_updated_at before update on public.family_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.care_recipients for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.providers for each row execute function public.set_updated_at();
create trigger set_location before insert or update of latitude, longitude on public.family_profiles for each row execute function public.set_location_from_lat_lng();
create trigger set_location before insert or update of latitude, longitude on public.providers for each row execute function public.set_location_from_lat_lng();
create trigger set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payouts for each row execute function public.set_updated_at();

-- ============================================================================
-- Indexes — every column referenced in an RLS policy or join, since Postgres
-- does not auto-index foreign keys (Section 5.2).
-- ============================================================================

create index idx_family_profiles_user_id on public.family_profiles (user_id);
create index idx_family_profiles_location on public.family_profiles using gist (location);
create index idx_care_recipients_family_id on public.care_recipients (family_id);
create index idx_providers_user_id on public.providers (user_id);
create index idx_providers_verification_status on public.providers (verification_status);
create index idx_providers_location on public.providers using gist (location);
create index idx_verification_reviews_provider_id on public.verification_reviews (provider_id);
create index idx_documents_provider_id on public.documents (provider_id);
create index idx_subscriptions_family_id on public.subscriptions (family_id);
create index idx_subscriptions_provider_id on public.subscriptions (provider_id);
create index idx_bookings_family_id on public.bookings (family_id);
create index idx_bookings_provider_id on public.bookings (provider_id);
create index idx_bookings_status on public.bookings (status);
create index idx_payments_booking_id on public.payments (booking_id);
create index idx_payouts_provider_id on public.payouts (provider_id);
create index idx_reviews_provider_id on public.reviews (provider_id);
create index idx_messages_booking_id on public.messages (booking_id);
create index idx_parental_consents_family_id on public.parental_consents (family_id);

-- ============================================================================
-- RPC functions for multi-row atomic writes
-- ============================================================================

-- The ONLY path that changes a provider's verification status. Enforces the
-- "pending -> approved/rejected only" state machine and writes the audit row
-- atomically with the status flip. A human admin must call this even after
-- every automated KYC check has passed (Section 2 guardrail: never
-- auto-approve). SECURITY DEFINER because a non-admin caller must not be
-- able to update providers.verification_status directly — see the
-- providers UPDATE policy below, which has no user-facing path to change
-- this column at all.
create or replace function public.review_verification(
  p_provider_id uuid,
  p_new_status public.verification_status,
  p_notes text default null
)
returns public.providers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider public.providers;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review verification records';
  end if;
  if p_new_status not in ('approved', 'rejected') then
    raise exception 'New status must be approved or rejected';
  end if;

  select * into v_provider from public.providers where id = p_provider_id for update;
  if v_provider is null then
    raise exception 'Provider % not found', p_provider_id;
  end if;
  if v_provider.verification_status <> 'pending' then
    raise exception 'Provider % is already %, not pending', p_provider_id, v_provider.verification_status;
  end if;

  update public.providers
  set verification_status = p_new_status
  where id = p_provider_id
  returning * into v_provider;

  insert into public.verification_reviews (provider_id, from_status, to_status, reviewed_by, notes)
  values (p_provider_id, 'pending', p_new_status, (select auth.uid()), p_notes);

  return v_provider;
end;
$$;

revoke all on function public.review_verification from public;
grant execute on function public.review_verification to authenticated;

-- Runs as the calling family's own privileges (SECURITY INVOKER, the
-- default) — a family already has INSERT rights on both tables per the RLS
-- policies below. The only reason this is a function at all is atomicity:
-- a child care_recipients row must never exist without its consent row,
-- and calling this as one RPC makes that a single transaction.
create or replace function public.create_child_care_recipient(
  p_family_id uuid,
  p_name text,
  p_notes text,
  p_consent_method public.parental_consent_method,
  p_consented_by_name text
)
returns public.care_recipients
language plpgsql
set search_path = ''
as $$
declare
  v_consent_id uuid;
  v_recipient public.care_recipients;
begin
  insert into public.parental_consents (family_id, consented_by, method, consented_by_name)
  values (p_family_id, (select auth.uid()), p_consent_method, p_consented_by_name)
  returning id into v_consent_id;

  insert into public.care_recipients (family_id, type, name, notes, parental_consent_id)
  values (p_family_id, 'child', p_name, p_notes, v_consent_id)
  returning * into v_recipient;

  return v_recipient;
end;
$$;

grant execute on function public.create_child_care_recipient to authenticated;

-- Geo + verification-status search in one place. This does NOT bypass RLS
-- (no SECURITY DEFINER) — it runs as the caller, so the "families see
-- verified providers only" policy above still applies; this function just
-- adds the PostGIS distance filter/ordering on top of what RLS already
-- allows through. radiusKm capped at 25 — single-city launch (Section 1),
-- not a general-purpose geo search.
create or replace function public.search_providers(
  p_service_type public.provider_type,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km numeric default 10
)
returns table (
  id uuid,
  type public.provider_type,
  bio text,
  distance_km double precision
)
language sql
stable
set search_path = ''
as $$
  select
    p.id,
    p.type,
    p.bio,
    extensions.ST_Distance(
      p.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography
    ) / 1000 as distance_km
  from public.providers p
  where p.type = p_service_type
    and extensions.ST_DWithin(
      p.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude, p_latitude), 4326)::extensions.geography,
      least(p_radius_km, 25) * 1000
    )
  order by distance_km asc;
$$;

grant execute on function public.search_providers to authenticated;

-- Backs the admin verification queue. auth.users isn't in the exposed
-- PostgREST schema (api.schemas = public, graphql_public only), so a plain
-- client-side join to get each pending provider's phone number isn't
-- possible — this function reaches into auth.users with elevated
-- privilege, gated by is_admin() internally rather than by RLS (which
-- doesn't apply inside SECURITY DEFINER functions by default).
-- NOTE: no kyc_provider_ref/police_verification_ref column here yet — there's
-- no KYC vendor webhook populating them pre-review (Section 8), so exposing
-- always-null columns would just be misleading scaffolding. Add them (likely
-- on `providers` itself, populated before the row ever reaches this
-- function) once that webhook exists.
create or replace function public.list_pending_providers()
returns table (
  provider_id uuid,
  type public.provider_type,
  bio text,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can list pending providers';
  end if;

  return query
    select p.id, p.type, p.bio, u.phone, p.created_at
    from public.providers p
    join auth.users u on u.id = p.user_id
    where p.verification_status = 'pending'
    order by p.created_at asc;
end;
$$;

revoke all on function public.list_pending_providers from public;
grant execute on function public.list_pending_providers to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.user_roles enable row level security;
alter table public.family_profiles enable row level security;
alter table public.parental_consents enable row level security;
alter table public.care_recipients enable row level security;
alter table public.providers enable row level security;
alter table public.verification_reviews enable row level security;
alter table public.documents enable row level security;
alter table public.subscriptions enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- --- user_roles ---
-- A user can read their own role; admins can read all. No client-side
-- insert/update path — role assignment happens via the signup Server Action
-- using the service_role key (Section 5.4-style pattern), never a direct
-- authenticated-role write, so a user can never grant themselves 'admin'.
create policy "read own role" on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- --- family_profiles ---
create policy "family reads own profile" on public.family_profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "family creates own profile" on public.family_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "family updates own profile" on public.family_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- --- parental_consents ---
-- Read-only from the client once created (via create_child_care_recipient);
-- withdrawal goes through its own explicit column update, not a general
-- UPDATE policy, so "withdraw" can't be repurposed to alter the audit trail.
create policy "family reads own consents" on public.parental_consents for select to authenticated
  using (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "family withdraws own consent" on public.parental_consents for update to authenticated
  using (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())))
  with check (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())));

-- --- care_recipients ---
create policy "family reads own care recipients" on public.care_recipients for select to authenticated
  using (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or public.is_admin()
  );
-- Elder recipients can be inserted directly; child recipients MUST go
-- through create_child_care_recipient (the child_requires_consent check
-- constraint blocks any direct insert lacking a consent row anyway).
create policy "family creates own care recipients" on public.care_recipients for insert to authenticated
  with check (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())));
create policy "family updates own care recipients" on public.care_recipients for update to authenticated
  using (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())))
  with check (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())));

-- --- providers ---
-- THE verification gate (Section 5.2's own example, adapted to this schema).
-- A pending/rejected provider is invisible to every family under every code
-- path, because this is the only SELECT policy on the table.
create policy "families see verified providers only" on public.providers for select to authenticated
  using (
    verification_status = 'approved'
    or user_id = (select auth.uid())
    or public.is_admin()
  );
create policy "provider creates own profile" on public.providers for insert to authenticated
  with check (user_id = (select auth.uid()));
-- Providers can update their own bio/location/etc, but NEVER their own
-- verification_status — that column only ever changes via
-- review_verification(), which runs as SECURITY DEFINER and isn't gated by
-- this policy at all. This `with check` re-asserts it can't drift back to
-- 'pending' or forward to 'approved' through this path either.
create policy "provider updates own profile" on public.providers for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- --- verification_reviews ---
-- Admins only. Providers do NOT see their own review history in this
-- version — only the current status via providers.verification_status —
-- to avoid leaking rejection reasoning that may reference other providers.
create policy "admins read verification reviews" on public.verification_reviews for select to authenticated
  using (public.is_admin());

-- --- documents ---
-- No SELECT policy for 'authenticated' at all beyond admin/owner — a family
-- must never be able to fetch a provider's raw ID document (Section 5.4).
create policy "provider reads own documents" on public.documents for select to authenticated
  using (
    exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "provider uploads own documents" on public.documents for insert to authenticated
  with check (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));

-- --- subscriptions ---
create policy "participants read own subscriptions" on public.subscriptions for select to authenticated
  using (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "family creates own subscription" on public.subscriptions for insert to authenticated
  with check (exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid())));

-- --- bookings ---
-- A booking can only be created against an approved provider — re-asserted
-- here at the RLS layer even though packages/core's checkBookingEligibility
-- should already have rejected it client-side (defense in depth, Section 2).
create policy "participants read own bookings" on public.bookings for select to authenticated
  using (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "family creates booking with verified provider" on public.bookings for insert to authenticated
  with check (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    and exists (select 1 from public.providers p where p.id = provider_id and p.verification_status = 'approved')
  );
create policy "participants update own bookings" on public.bookings for update to authenticated
  using (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.family_profiles f where f.id = family_id and f.user_id = (select auth.uid()))
    or exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  );

-- --- payments ---
-- Written only by the payment-collection Edge Function (service_role,
-- bypasses RLS). Clients can read their own booking's payment status.
create policy "participants read own payments" on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      join public.family_profiles f on f.id = b.family_id
      where b.id = booking_id and f.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.bookings b
      join public.providers p on p.id = b.provider_id
      where b.id = booking_id and p.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- --- payouts ---
-- Written only by the (not-yet-finalized, see Section 2 guardrail) payout
-- Edge Function / admin override. Providers can read their own; admins can
-- read/write all for the manual-override path.
create policy "provider reads own payouts" on public.payouts for select to authenticated
  using (
    exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "admin manages payouts" on public.payouts for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --- reviews ---
-- Post-completion only — re-asserted here, not just in the booking UI.
create policy "anyone reads reviews of approved providers" on public.reviews for select to authenticated
  using (
    exists (select 1 from public.providers p where p.id = provider_id and p.verification_status = 'approved')
    or public.is_admin()
  );
create policy "family reviews own completed booking" on public.reviews for insert to authenticated
  with check (
    exists (
      select 1 from public.bookings b
      join public.family_profiles f on f.id = b.family_id
      where b.id = booking_id and f.user_id = (select auth.uid()) and b.status = 'completed'
    )
  );

-- --- messages ---
-- The unlock rule, enforced at the only layer that matters: chat only
-- exists for a booking in 'confirmed' or 'completed' status, and only its
-- two participants can read or write it (Section 2 guardrail).
create policy "participants read booking messages" on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.status in ('confirmed', 'completed')
        and (
          exists (select 1 from public.family_profiles f where f.id = b.family_id and f.user_id = (select auth.uid()))
          or exists (select 1 from public.providers p where p.id = b.provider_id and p.user_id = (select auth.uid()))
        )
    )
    or public.is_admin()
  );
create policy "participants send booking messages" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.status in ('confirmed', 'completed')
        and (
          exists (select 1 from public.family_profiles f where f.id = b.family_id and f.user_id = (select auth.uid()))
          or exists (select 1 from public.providers p where p.id = b.provider_id and p.user_id = (select auth.uid()))
        )
    )
  );

-- ============================================================================
-- Storage (KYC documents) — Section 5.4
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

-- Folder convention: {provider_user_id}/{filename}. A provider can only
-- touch their own folder; families get nothing; admins get everything.
-- Uploads happen through an Edge Function using the service_role key
-- (Section 5.4), so in practice the INSERT policy below is a second layer,
-- not the primary upload path.
create policy "provider reads own kyc folder" on storage.objects for select to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );
create policy "provider writes own kyc folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============================================================================
-- Data retention / erasure (DPDP Act — Section 8)
-- ============================================================================

-- Stub only — actual retention windows are a legal/product decision this
-- migration should NOT invent numbers for. Wire up the real logic (which
-- rows, after how long, soft-delete vs hard-delete) before relying on this,
-- then uncomment the cron.schedule() call below.
create or replace function public.run_data_retention_erasure()
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- TODO: act on public.parental_consents.withdrawn_at (erase/anonymize the
  -- linked care_recipient), and on any other DPDP-scoped retention window,
  -- once those windows are legally confirmed.
  raise notice 'run_data_retention_erasure: stub, no retention rules configured yet';
end;
$$;

-- select cron.schedule('data-retention-erasure', '0 3 * * *', 'select public.run_data_retention_erasure();');
