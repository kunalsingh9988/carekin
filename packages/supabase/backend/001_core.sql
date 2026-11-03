-- CareKin backend v1. Separate from the dormant, incompatible prototype migration.
-- Apply in numeric order. No demo people or credentials are seeded.
begin;
create schema if not exists carekin;
revoke all on schema carekin from public, anon, authenticated;
create extension if not exists btree_gist with schema extensions;

create table carekin.accounts (
 id uuid primary key references auth.users(id), role text not null check(role in ('family','provider','admin')),
 created_at timestamptz not null default now()
);
create table carekin.families (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references carekin.accounts(id),
 name text not null check(length(trim(name)) between 1 and 100), address text not null check(length(address) between 1 and 1000),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table carekin.providers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references carekin.accounts(id),
 type text not null check(type in ('caregiver','babysitter')), name text not null check(length(trim(name)) between 1 and 100),
 phone text not null default '', bio text check(length(bio)<=1200), service_radius_km numeric not null check(service_radius_km between 1 and 50),
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 verification_status text not null default 'pending' check(verification_status in ('pending','approved','rejected')),
 photo_seed text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table carekin.consents (
 id uuid primary key default gen_random_uuid(), family_id uuid not null references carekin.families(id),
 consented_by uuid not null references carekin.accounts(id), method text not null check(method in ('in_app_checkbox','digital_signature','otp_confirmation')),
 consented_by_name text not null check(length(trim(consented_by_name)) between 1 and 100), consented_at timestamptz not null default now(), withdrawn_at timestamptz
);
create table carekin.recipients (
 id uuid primary key default gen_random_uuid(), family_id uuid not null references carekin.families(id),
 type text not null check(type in ('elder','child')), name text not null check(length(trim(name)) between 1 and 100), notes text check(length(notes)<=2000),
 parental_consent_id uuid references carekin.consents(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(type<>'child' or parental_consent_id is not null)
);
create table carekin.availability (
 provider_id uuid not null references carekin.providers(id), day smallint not null check(day between 0 and 6),
 enabled boolean not null, start time not null, "end" time not null, primary key(provider_id,day), check(not enabled or start<"end")
);
create table carekin.verifications (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references carekin.providers(id),
 from_status text, to_status text not null, reviewed_by uuid references carekin.accounts(id), reason text, created_at timestamptz not null default now()
);
create table carekin.documents (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references carekin.providers(id),
 type text not null check(type in ('id_proof','address_proof','certificate')), filename text not null check(length(filename)<=250),
 storage_key text not null unique, status text not null default 'pending' check(status in ('pending','verified')), uploaded_at timestamptz not null default now()
);
create table carekin.bookings (
 id uuid primary key default gen_random_uuid(), family_id uuid not null references carekin.families(id), provider_id uuid not null references carekin.providers(id),
 care_recipient_id uuid not null references carekin.recipients(id), type text not null default 'one_off' check(type='one_off'),
 status text not null default 'requested' check(status in ('requested','confirmed','in_progress','completed','cancelled','disputed')),
 scheduled_at timestamptz not null, duration_hours numeric not null check(duration_hours between 1 and 12 and mod(duration_hours,0.5)=0),
 ends_at timestamptz not null, amount_paise integer not null check(amount_paise>0), commission_paise integer not null check(commission_paise>=0 and commission_paise<=amount_paise),
 subscription_id uuid, request_key text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(family_id,request_key), check(ends_at>scheduled_at),
 exclude using gist (provider_id with =, tstzrange(scheduled_at,ends_at,'[)') with &&) where(status in ('requested','confirmed','in_progress'))
);
create table carekin.payments (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references carekin.bookings(id),
 status text not null check(status in ('created','captured','failed','refunded')), amount_paise integer not null check(amount_paise>0),
 external_reference text unique, captured_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table carekin.payouts (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references carekin.providers(id), booking_id uuid not null unique references carekin.bookings(id),
 amount_paise integer not null check(amount_paise>=0), status text not null default 'pending' check(status in ('pending','paid')), created_at timestamptz not null default now(), paid_at timestamptz
);
create table carekin.reviews (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references carekin.bookings(id), provider_id uuid not null references carekin.providers(id),
 rating smallint not null check(rating between 1 and 5), comment text check(length(comment)<=2000), created_at timestamptz not null default now()
);
create table carekin.messages (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references carekin.bookings(id), sender_id uuid not null references carekin.accounts(id),
 sender_role text not null, content text not null check(length(trim(content)) between 1 and 2000), created_at timestamptz not null default now()
);
create index on carekin.messages(booking_id,created_at);
create table carekin.visits (
 booking_id uuid primary key references carekin.bookings(id), phase text not null default 'scheduled' check(phase in ('scheduled','arriving','active','checkout_pending','checked_out','interrupted')),
 checkin_at timestamptz, checkout_at timestamptz, safe_return_at timestamptz, last_safe_at timestamptz, contact_restricted boolean not null default false,
 arrival_pin text, pin_failures integer not null default 0, tasks jsonb not null default '[]', timeline jsonb not null default '[]', brief jsonb
);
create table carekin.safety_cases (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references carekin.bookings(id), reporter_id uuid not null references carekin.accounts(id), reporter_role text not null,
 severity text not null check(severity in ('emergency','urgent','service')), category text not null check(length(category) between 1 and 150), narrative text not null check(length(narrative)<=2000),
 status text not null default 'new' check(status in ('new','triaged','investigating','resolved')), owner uuid references carekin.accounts(id),
 created_at timestamptz not null default now(), audit jsonb not null default '[]', evidence jsonb not null
);
create table carekin.disputes (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references carekin.bookings(id), raised_by uuid not null references carekin.accounts(id),
 reason text not null check(length(trim(reason)) between 1 and 2000), status text not null default 'open' check(status in ('open','resolved')),
 resolution_notes text, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table carekin.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references carekin.accounts(id), type text not null, message text not null,
 read boolean not null default false, created_at timestamptz not null default now()
);
create index on carekin.notifications(user_id,created_at);
create table carekin.support_tickets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references carekin.accounts(id), name text not null check(length(trim(name)) between 1 and 100),
 email text not null check(length(email)<=254 and email like '%@%.%'), topic text not null check(length(topic)<=100), message text not null check(length(trim(message)) between 10 and 2000),
 status text not null default 'open' check(status in ('open','resolved')), created_at timestamptz not null default now()
);
create table carekin.referrals (
 id uuid primary key default gen_random_uuid(), referrer_family_id uuid not null references carekin.families(id), referred_family_id uuid not null unique references carekin.families(id),
 created_at timestamptz not null default now(), check(referrer_family_id<>referred_family_id)
);
create table carekin.settings (key text primary key, value jsonb not null);
insert into carekin.settings values ('hourly_rate_paise','30000'),('commission_percent','15'),('development_bookings','true');
-- No browser role can change settings, financial records, roles or verification directly.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='carekin' loop
  execute format('alter table carekin.%I enable row level security',t.tablename);
  execute format('revoke all on carekin.%I from public, anon, authenticated',t.tablename);
 end loop;
end $$;

create function carekin.role() returns text language sql stable security definer set search_path='' as $$
 select role from carekin.accounts where id=auth.uid();
$$;
create function carekin.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(carekin.role()='admin',false);
$$;
create function carekin.family_owned(fid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from carekin.families where id=fid and user_id=auth.uid());
$$;
create function carekin.provider_owned(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from carekin.providers where id=pid and user_id=auth.uid());
$$;
create function carekin.can_visit(bid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from carekin.bookings where id=bid and (carekin.family_owned(family_id) or carekin.provider_owned(provider_id) or carekin.is_admin()));
$$;
create function carekin.require(ok boolean, message text) returns void language plpgsql set search_path='' as $$
 begin if not coalesce(ok,false) then raise exception '%',message using errcode='P0001'; end if; end;
$$;
create function carekin.notify(uid uuid, kind text, body text) returns void language sql set search_path='' as $$
 insert into carekin.notifications(user_id,type,message) values(uid,kind,body);
$$;
create function carekin.public_provider(p carekin.providers) returns jsonb language sql immutable set search_path='' as $$
 select to_jsonb(p)-'phone'-'latitude'-'longitude'-'user_id';
$$;
create function carekin.assert_slot(pid uuid, start_at timestamptz, hours numeric) returns void language plpgsql set search_path='' as $$
 declare local_start timestamp := start_at at time zone 'Asia/Kolkata'; local_end timestamp := (start_at+hours*interval '1 hour') at time zone 'Asia/Kolkata';
 begin
 perform carekin.require(start_at>now() and start_at<now()+interval '180 days' and hours between 1 and 12 and mod(hours,0.5)=0,'Choose a future visit of 1–12 hours, within 180 days.');
 perform carekin.require(local_start::date=local_end::date and exists(select 1 from carekin.availability where provider_id=pid and day=extract(dow from local_start) and enabled and start<=local_start::time and "end">=local_end::time),'This visit is outside the provider availability (India time).');
 end;
$$;
-- Private uploads; only owner and assigned operations admins can read them.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('carekin-documents','carekin-documents',false,5242880,array['image/jpeg','image/png','application/pdf']) on conflict(id) do nothing;
grant usage on schema carekin to authenticated;
grant execute on function carekin.is_admin() to authenticated;
create policy carekin_document_insert on storage.objects for insert to authenticated with check(bucket_id='carekin-documents' and (storage.foldername(name))[1]=auth.uid()::text and carekin.role()='provider');
create policy carekin_document_read on storage.objects for select to authenticated using(bucket_id='carekin-documents' and ((storage.foldername(name))[1]=auth.uid()::text or carekin.is_admin()));
revoke execute on all functions in schema carekin from public,anon,authenticated;
grant execute on function carekin.role(),carekin.is_admin() to authenticated;
commit;
