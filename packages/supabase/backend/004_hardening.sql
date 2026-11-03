begin;
-- This pre-existing hosted-project DDL trigger is not a public API.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end $$;
-- Avoid a future accidental grant when adding private helper functions.
alter default privileges in schema carekin revoke execute on functions from public;
alter default privileges in schema carekin revoke all on tables from anon,authenticated;
create index if not exists bookings_family_schedule on carekin.bookings(family_id,scheduled_at desc);
create index if not exists bookings_provider_schedule on carekin.bookings(provider_id,scheduled_at desc);
create index if not exists recipients_family on carekin.recipients(family_id);
create index if not exists documents_provider on carekin.documents(provider_id);
create index if not exists safety_booking_reporter on carekin.safety_cases(booking_id,reporter_id);
create index if not exists verifications_provider on carekin.verifications(provider_id,created_at);
create index if not exists reviews_provider on carekin.reviews(provider_id);
commit;
