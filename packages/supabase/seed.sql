-- CareKin local dev seed data (Section 9 build order step 3).
--
-- NOTE: this has been checked for internal consistency and against the
-- migration's constraints/RLS logic (see packages/supabase/migrations), but
-- NOT yet run against a live `supabase start` stack — this sandbox doesn't
-- have Docker available. Before relying on it, run `pnpm db:reset` once
-- Docker is installed and fix anything the real `auth.users` schema is
-- pickier about than assumed here (its exact required columns vary slightly
-- across Supabase Auth versions).
--
-- Fixed UUIDs throughout so this is reproducible and referenceable in
-- manual RLS smoke tests (Section 5.2: "write a test for every gate").

-- ============================================================================
-- auth.users — normally created via the Auth API on real signup; inserted
-- directly here only because this is local seed data for a phone-only auth
-- flow with no real MSG91 account to send OTPs through yet.
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) values
  -- Families
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '+919810000001', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '+919810000002', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '+919810000003', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  -- Providers: 2 approved, 2 pending, 1 rejected
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', '+919820000011', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', '+919820000012', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', '+919820000013', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', '+919820000014', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000015', 'authenticated', 'authenticated', '+919820000015', now(), now(), now(), '{"provider":"phone"}', '{}', false, false),
  -- Admin
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000099', 'authenticated', 'authenticated', '+919830000099', now(), now(), now(), '{"provider":"phone"}', '{}', false, false)
on conflict (id) do nothing;

-- ============================================================================
-- Roles
-- ============================================================================

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-000000000001', 'family'),
  ('00000000-0000-0000-0000-000000000002', 'family'),
  ('00000000-0000-0000-0000-000000000003', 'family'),
  ('00000000-0000-0000-0000-000000000011', 'provider'),
  ('00000000-0000-0000-0000-000000000012', 'provider'),
  ('00000000-0000-0000-0000-000000000013', 'provider'),
  ('00000000-0000-0000-0000-000000000014', 'provider'),
  ('00000000-0000-0000-0000-000000000015', 'provider'),
  ('00000000-0000-0000-0000-000000000099', 'admin')
on conflict (user_id) do nothing;

-- ============================================================================
-- Family profiles — all in the same pilot neighborhood (Section 1: one
-- city, one or two neighborhoods; coordinates are Koramangala, Bengaluru,
-- picked only as a plausible pilot-neighborhood cluster).
-- ============================================================================

insert into public.family_profiles (id, user_id, name, address, latitude, longitude) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Priya Sharma', '4th Block, Koramangala, Bengaluru', 12.9352, 77.6146),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Arjun Mehta', '5th Block, Koramangala, Bengaluru', 12.9345, 77.6224),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Lakshmi Iyer', '6th Block, Koramangala, Bengaluru', 12.9279, 77.6271)
on conflict (id) do nothing;

-- ============================================================================
-- Care recipients — one elder (direct insert, no consent needed), one child
-- (via the atomic RPC, exercising the parental-consent path for real).
-- ============================================================================

insert into public.care_recipients (id, family_id, type, name, notes) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'elder', 'Priya''s mother, Kamala', 'Needs help with mobility, morning walks preferred'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'elder', 'Arjun''s father, Ramesh', 'Diabetic, medicine reminder at 8am and 8pm')
on conflict (id) do nothing;

-- Not using create_child_care_recipient() here: that RPC reads
-- auth.uid() for `consented_by`, which is null when this script runs as
-- the Postgres superuser (no session JWT) rather than through PostgREST.
-- Direct inserts are fine for seed data — RLS is bypassed by the seeding
-- connection anyway, same as every other table above.
insert into public.parental_consents (id, family_id, consented_by, method, consented_by_name) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'in_app_checkbox', 'Lakshmi Iyer')
on conflict (id) do nothing;

insert into public.care_recipients (id, family_id, type, name, notes, parental_consent_id) values
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'child', 'Lakshmi''s son, Karthik', 'Age 6, allergic to peanuts', '60000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- ============================================================================
-- Providers — 2 approved, 2 pending, 1 rejected (Section 9 build order step 3)
-- ============================================================================

insert into public.providers (id, user_id, type, bio, service_radius_km, latitude, longitude, verification_status) values
  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'caregiver', '8 years experience with elder care, trained in mobility assistance.', 5, 12.9340, 77.6180, 'approved'),
  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'babysitter', 'Early childhood educator, comfortable with infants and toddlers.', 6, 12.9300, 77.6200, 'approved'),
  ('30000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'caregiver', 'Recently completed caregiver certification, awaiting background check.', 4, 12.9360, 77.6150, 'pending'),
  ('30000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'babysitter', 'Part-time babysitter, evenings and weekends.', 5, 12.9250, 77.6300, 'pending'),
  ('30000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', 'caregiver', 'Applied but police verification came back with unresolved flags.', 5, 12.9400, 77.6100, 'rejected')
on conflict (id) do nothing;

-- Audit trail entries matching the two non-pending providers above.
insert into public.verification_reviews (provider_id, from_status, to_status, reviewed_by, notes) values
  ('30000000-0000-0000-0000-000000000011', 'pending', 'approved', '00000000-0000-0000-0000-000000000099', 'KYC and police verification clear.'),
  ('30000000-0000-0000-0000-000000000012', 'pending', 'approved', '00000000-0000-0000-0000-000000000099', 'KYC and police verification clear, references checked.'),
  ('30000000-0000-0000-0000-000000000015', 'pending', 'rejected', '00000000-0000-0000-0000-000000000099', 'Police verification flagged an unresolved case; provider notified.')
on conflict do nothing;

-- ============================================================================
-- Documents (storage_key values are placeholders — no real files exist in
-- the local storage bucket for this seed; Section 5.4 upload flow isn't
-- wired to a real KYC vendor yet).
-- ============================================================================

insert into public.documents (provider_id, type, storage_key) values
  ('30000000-0000-0000-0000-000000000011', 'id_proof', '00000000-0000-0000-0000-000000000011/aadhaar.pdf'),
  ('30000000-0000-0000-0000-000000000011', 'address_proof', '00000000-0000-0000-0000-000000000011/address-proof.pdf'),
  ('30000000-0000-0000-0000-000000000013', 'id_proof', '00000000-0000-0000-0000-000000000013/aadhaar.pdf')
on conflict do nothing;

-- ============================================================================
-- Bookings — one completed (with a review), one confirmed/upcoming, one
-- requested (not yet confirmed, so chat stays locked on it).
-- ============================================================================

insert into public.bookings (id, family_id, provider_id, care_recipient_id, type, status, scheduled_at, duration_hours, amount_paise, commission_paise) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001', 'one_off', 'completed', now() - interval '3 days', 4, 200000, 36000),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'one_off', 'confirmed', now() + interval '2 days', 3, 150000, 27000)
on conflict (id) do nothing;

insert into public.reviews (booking_id, provider_id, rating, comment) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000011', 5, 'Very patient with my mother, showed up on time.')
on conflict (booking_id) do nothing;

insert into public.payments (booking_id, razorpay_order_id, status, amount_paise, captured_at) values
  ('40000000-0000-0000-0000-000000000001', 'order_seed_completed_001', 'captured', 200000, now() - interval '3 days'),
  ('40000000-0000-0000-0000-000000000002', 'order_seed_confirmed_002', 'captured', 150000, now() - interval '1 hour')
on conflict (booking_id) do nothing;

insert into public.payouts (provider_id, booking_id, amount_paise, status) values
  ('30000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000001', 164000, 'paid')
on conflict (booking_id) do nothing;

-- Chat only exists meaningfully on the confirmed/completed bookings above.
insert into public.messages (booking_id, sender_id, content) values
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Hi, looking forward to Thursday — please come to the gate, not the lobby.'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', 'Sounds good, see you then!');

-- ============================================================================
-- A subscription (recurring babysitting) — not yet linked to a booking.
-- ============================================================================

insert into public.subscriptions (id, family_id, provider_id, frequency, amount_paise, next_billing_date, status) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000012', 'weekly', 350000, current_date + interval '7 days', 'active')
on conflict (id) do nothing;
