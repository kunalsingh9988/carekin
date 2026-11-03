-- Integration/security tests on the linked development project. All fixtures roll back.
begin;
create temp table ck_test (key text primary key, value jsonb);
grant all on ck_test to authenticated,anon;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$ begin if not coalesce(ok,false) then raise exception 'FAILED: %',label; end if; end $$;
insert into auth.users(id,aud,role,email,created_at,updated_at) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','family@carekin-test.invalid',now(),now()),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','provider@carekin-test.invalid',now(),now()),
 ('33333333-3333-4333-8333-333333333333','authenticated','authenticated','other@carekin-test.invalid',now(),now()),
 ('44444444-4444-4444-8444-444444444444','authenticated','authenticated','admin@carekin-test.invalid',now(),now());
insert into carekin.accounts(id,role) values('44444444-4444-4444-8444-444444444444','admin');
set local role anon;
select pg_temp.assert(public.carekin_api('providers.listApprovedProviders','[{"type":"caregiver","latitude":12.9,"longitude":77.6}]')='[]','empty public directory');
do $$ begin
 perform public.carekin_api('auth.enroll','["admin"]'); raise exception 'FAILED: anonymous enrollment';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select pg_temp.assert(public.carekin_api('auth.enroll','["family"]')->>'role'='family','real identity enrollment');
select pg_temp.assert(public.carekin_api('families.getFamilyProfile','["11111111-1111-4111-8111-111111111111"]') is null,'missing profile returns null for onboarding');
do $$ begin
 perform public.carekin_api('auth.enroll','["admin"]'); raise exception 'FAILED: self-appointed admin';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
insert into ck_test values('family',public.carekin_api('families.saveFamilyProfile','["spoofed-user",{"name":"Test family","address":"Private address","latitude":12.9,"longitude":77.6}]'));
insert into ck_test select 'recipient',public.carekin_api('families.addElderRecipient',jsonb_build_array(value->>'id',jsonb_build_object('name','Recipient','notes','Private medical notes'))) from ck_test where key='family';
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.assert(public.carekin_api('auth.enroll','["provider"]')->>'role'='provider','provider enrollment');
insert into storage.objects(bucket_id,name) values('carekin-documents','22222222-2222-4222-8222-222222222222/qa-test.pdf');
select pg_temp.assert((select count(*)=1 from storage.objects where bucket_id='carekin-documents' and name='22222222-2222-4222-8222-222222222222/qa-test.pdf'),'provider can access own private document');
insert into ck_test values('provider',public.carekin_api('providers.createProviderProfile','["spoof",{"type":"caregiver","name":"Test provider","phone":"+910000000000","bio":"Test","serviceRadiusKm":10,"latitude":12.91,"longitude":77.61}]'));
select public.carekin_api('workspace.saveAvailability',jsonb_build_array('spoof',value->>'id',(select jsonb_agg(jsonb_build_object('day',n,'enabled',true,'start','00:00','end','23:59')) from generate_series(0,6) n))) from ck_test where key='provider';
do $$ begin
 perform public.carekin_api('admin.approveProvider',jsonb_build_array((select value->>'id' from ck_test where key='provider'),'spoof')); raise exception 'FAILED: provider self approval';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
do $$ begin
 perform * from carekin.providers; raise exception 'FAILED: direct table bypass';
exception when insufficient_privilege then null; end $$;
reset role;
insert into carekin.documents(provider_id,type,filename,storage_key) select (value->>'id')::uuid,'id_proof','test.pdf','test/id.pdf' from ck_test where key='provider';
insert into carekin.documents(provider_id,type,filename,storage_key) select (value->>'id')::uuid,'address_proof','test.pdf','test/address.pdf' from ck_test where key='provider';
set local role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select pg_temp.assert(public.carekin_api('admin.approveProvider',jsonb_build_array(value->>'id','spoof'))->>'verification_status'='approved','admin approval') from ck_test where key='provider';
select pg_temp.assert(not(public.carekin_api('providers.getProviderPublic',jsonb_build_array(value->>'id')) ?| array['phone','latitude','longitude','user_id']),'public projection privacy') from ck_test where key='provider';
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select pg_temp.assert((select count(*)=0 from storage.objects where bucket_id='carekin-documents'),'family cannot read provider identity documents');
insert into ck_test select 'input',jsonb_build_array(jsonb_build_object('familyId',(select value->>'id' from ck_test where key='family'),'providerId',(select value->>'id' from ck_test where key='provider'),'careRecipientId',(select value->>'id' from ck_test where key='recipient'),'type','one_off','scheduledAt',date_trunc('day',now())+interval '2 days 5 hours','durationHours',2,'amountPaise',1));
insert into ck_test select 'booking',public.carekin_api('bookings.createBooking',value) from ck_test where key='input';
select pg_temp.assert((value->>'amount_paise')::integer=60000,'server price ignores client price') from ck_test where key='booking';
select pg_temp.assert(public.carekin_api('bookings.createBooking',value)->>'id'=(select value->>'id' from ck_test where key='booking'),'idempotent booking retry') from ck_test where key='input';
do $$ begin
 perform public.carekin_api('bookings.createBooking',jsonb_set((select value from ck_test where key='input'),'{0,requestKey}','"overlap"')); raise exception 'FAILED: overlapping booking';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
do $$ begin
 perform public.carekin_api('messages.sendMessage',jsonb_build_array((select value->>'id' from ck_test where key='booking'),'spoof','admin','Not confirmed')); raise exception 'FAILED: early messaging';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select public.carekin_api('auth.enroll','["family"]');
do $$ begin
 perform public.carekin_api('bookings.getBooking',jsonb_build_array((select value->>'id' from ck_test where key='booking'))); raise exception 'FAILED: other family booking read';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.assert(public.carekin_api('workspace.performBookingAction',jsonb_build_array('{}'::jsonb,value->>'id','accept'))->>'status'='confirmed','provider accepts development visit') from ck_test where key='booking';
select pg_temp.assert(public.carekin_api('care.getCareContext',jsonb_build_array('{}'::jsonb,value->>'id'))->>'address' is null,'address hidden until visit window') from ck_test where key='booking';
select pg_temp.assert(public.carekin_api('messages.sendMessage',jsonb_build_array(value->>'id','spoof','admin','Hello'))->>'sender_role'='provider','message sender derived from authenticated identity') from ck_test where key='booking';
reset role;
update carekin.bookings set scheduled_at=now()-interval '5 minutes',ends_at=now()+interval '115 minutes' where id=(select (value->>'id')::uuid from ck_test where key='booking');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.carekin_api('care.setArrivalPin',jsonb_build_array('{}'::jsonb,value->>'id',true)) from ck_test where key='booking';
insert into ck_test select 'pin',public.carekin_api('care.getCareContext',jsonb_build_array('{}'::jsonb,value->>'id'))->'visit'->'arrival_pin' from ck_test where key='booking';
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.assert(public.carekin_api('care.getCareContext',jsonb_build_array('{}'::jsonb,value->>'id'))->'visit'->>'arrival_pin' is null,'provider cannot read PIN') from ck_test where key='booking';
select pg_temp.assert(public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,value->>'id','checkin','wrong')) ? 'error','incorrect PIN rejected') from ck_test where key='booking';
select public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,value->>'id','checkin',(select value from ck_test where key='pin'))) from ck_test where key='booking';
select public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,value->>'id','checkout','')) from ck_test where key='booking';
do $$ begin
 perform public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,(select value->>'id' from ck_test where key='booking'),'confirm_checkout','')); raise exception 'FAILED: provider self checkout confirmation';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,value->>'id','confirm_checkout','')) from ck_test where key='booking';
select pg_temp.assert(public.carekin_api('bookings.getBooking',jsonb_build_array(value->>'id'))->>'status'='completed','family confirms completion') from ck_test where key='booking';
select public.carekin_api('reviews.submitReview',jsonb_build_array(value->>'id','spoof',5,'Test review')) from ck_test where key='booking';
select public.carekin_api('care.reportSafetyConcern',jsonb_build_array('{}'::jsonb,value->>'id',jsonb_build_object('category','I feel unsafe / possible abuse','severity','service','narrative','Integration test','interrupt',false))) from ck_test where key='booking';
do $$ begin
 perform public.carekin_api('messages.listMessages',jsonb_build_array((select value->>'id' from ck_test where key='booking'))); raise exception 'FAILED: restricted chat read';
exception when sqlstate 'P0001' then if sqlerrm like 'FAILED:%' then raise; end if; end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select pg_temp.assert(public.carekin_api('care.getCareContext',jsonb_build_array('{}'::jsonb,value->>'id'))->'myCases'='[]','other participant cannot read safety report') from ck_test where key='booking';
select public.carekin_api('care.careAction',jsonb_build_array('{}'::jsonb,value->>'id','safe_return','')) from ck_test where key='booking';
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select pg_temp.assert(public.carekin_api('payouts.listAllPayouts')='[]','unpaid visit has no payout');
select pg_temp.assert(public.carekin_api('care.listSafetyCases')->0->>'severity'='urgent','urgent category cannot be downgraded');
reset role;
select 'PASS: identity, access control, approval, privacy, availability, concurrency constraint, pricing, idempotency, chat, PIN, checkout, reviews, safety, unpaid payout guard' result;
rollback;
