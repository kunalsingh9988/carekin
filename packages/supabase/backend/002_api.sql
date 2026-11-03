begin;
create or replace function public.carekin_api(operation text, args jsonb default '[]') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid := auth.uid(); role_name text := carekin.role(); a jsonb := args->0; x jsonb; result jsonb;
 fid uuid; pid uuid; cid uuid; bid uuid; target text; new_status text;
 f carekin.families; p carekin.providers; r carekin.recipients; b carekin.bookings; d carekin.disputes;
begin
 perform carekin.require(jsonb_typeof(args)='array' and octet_length(args::text)<32000,'Invalid request.');
 -- Public reads return a deliberately limited projection, never raw provider records.
 if operation='providers.listApprovedProviders' then
  perform carekin.require((a->>'latitude')::numeric between -90 and 90 and (a->>'longitude')::numeric between -180 and 180,'Invalid search location.');
  select coalesce(jsonb_agg(data order by km),'[]') into result from (
   select carekin.public_provider(q)||jsonb_build_object('distance_km',round(km::numeric,1)) data, km from (
    select pp, 6371*2*asin(sqrt(least(1.0,power(sin(radians(pp.latitude-(a->>'latitude')::float)/2),2)+cos(radians(pp.latitude))*cos(radians((a->>'latitude')::float))*power(sin(radians(pp.longitude-(a->>'longitude')::float)/2),2)))) km
    from carekin.providers pp where verification_status='approved' and type=a->>'type'
   ) dist(q,km) where km<=least(coalesce((a->>'radiusKm')::numeric,10),50) order by km limit 100
  ) found; return result;
 elsif operation='providers.getProviderPublic' then
  select carekin.public_provider(pp) into result from carekin.providers pp where pp.id=(args->>0)::uuid and verification_status='approved'; return result;
 elsif operation in ('reviews.getReviewsForProvider','reviews.getRatingSummary') then
  pid:=(args->>0)::uuid;
  if operation='reviews.getRatingSummary' then
   select jsonb_build_object('avg',coalesce(avg(rating),0),'count',count(*)) into result from carekin.reviews rr where provider_id=pid and exists(select 1 from carekin.providers where id=pid and verification_status='approved');
  else
   select coalesce(jsonb_agg(jsonb_build_object('id',rr.id,'provider_id',rr.provider_id,'rating',rr.rating,'comment',rr.comment,'created_at',rr.created_at) order by created_at desc),'[]') into result from carekin.reviews rr where provider_id=pid and exists(select 1 from carekin.providers where id=pid and verification_status='approved');
  end if; return result;
 end if;
 perform carekin.require(uid is not null,'Sign in to continue.');
 if operation='auth.me' then
  if role_name is null then return null; end if;
  select jsonb_build_object('id',u.id,'role',role_name,'phone',coalesce(u.phone,u.email,''),'created_at',u.created_at) into result from auth.users u where u.id=uid; return result;
 elsif operation='auth.enroll' then
  perform carekin.require(args->>0 in ('family','provider'),'Choose family or provider. Admin access is assigned privately.');
  insert into carekin.accounts(id,role) values(uid,args->>0) on conflict(id) do nothing;
  return public.carekin_api('auth.me');
 end if;
 perform carekin.require(role_name is not null,'Finish account setup first.');

 if operation like 'families.%' then
  if operation='families.saveFamilyProfile' then
   perform carekin.require(role_name='family','Family account required.'); x:=args->1;
   insert into carekin.families(user_id,name,address,latitude,longitude) values(uid,trim(x->>'name'),x->>'address',(x->>'latitude')::float,(x->>'longitude')::float)
   on conflict(user_id) do update set name=excluded.name,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,updated_at=now() returning * into f;
   return to_jsonb(f);
  elsif operation in ('families.getFamilyProfile','families.getFamilyProfileById') then
   select * into f from carekin.families where (operation='families.getFamilyProfile' and user_id=(args->>0)::uuid) or (operation='families.getFamilyProfileById' and id=(args->>0)::uuid);
   if f.id is null then return null; end if;
   if operation='families.getFamilyProfileById' and role_name='provider' and exists(select 1 from carekin.bookings where family_id=f.id and carekin.provider_owned(provider_id)) then
    return jsonb_build_object('id',f.id,'name',split_part(f.name,' ',1));
   end if;
   perform carekin.require(f.id is null or f.user_id=uid or carekin.is_admin(),'Family unavailable.'); return to_jsonb(f);
  elsif operation='families.getCareRecipients' then
   fid:=(args->>0)::uuid; perform carekin.require(carekin.family_owned(fid) or carekin.is_admin(),'Family unavailable.');
   select coalesce(jsonb_agg(to_jsonb(rr) order by created_at),'[]') into result from carekin.recipients rr where family_id=fid; return result;
  elsif operation='families.getCareRecipient' then
   select * into r from carekin.recipients where id=(args->>0)::uuid;
   if r.id is null then return null; end if;
   if role_name='provider' and exists(select 1 from carekin.bookings where care_recipient_id=r.id and carekin.provider_owned(provider_id)) then
    return jsonb_build_object('id',r.id,'name',split_part(r.name,' ',1),'type',r.type,'family_id',r.family_id,'notes',null);
   end if;
   perform carekin.require(r.id is null or carekin.family_owned(r.family_id) or carekin.is_admin(),'Recipient unavailable.'); return to_jsonb(r);
  elsif operation in ('families.addElderRecipient','families.addChildRecipientWithConsent') then
   fid:=(args->>0)::uuid; perform carekin.require(carekin.family_owned(fid),'Family unavailable.'); x:=args->1;
   if operation='families.addChildRecipientWithConsent' then
    perform carekin.require(args->2->>'method'='in_app_checkbox','Only recorded checkbox consent is supported.');
    insert into carekin.consents(family_id,consented_by,method,consented_by_name) values(fid,uid,'in_app_checkbox',args->2->>'consentedByName') returning id into cid;
   end if;
   insert into carekin.recipients(family_id,type,name,notes,parental_consent_id) values(fid,case when cid is null then 'elder' else 'child' end,trim(x->>'name'),x->>'notes',cid) returning * into r; return to_jsonb(r);
  elsif operation='families.withdrawConsent' then
   select * into r from carekin.recipients where id=(args->>0)::uuid;
   perform carekin.require(carekin.family_owned(r.family_id),'Recipient unavailable.');
   update carekin.consents set withdrawn_at=now() where id=r.parental_consent_id;
   update carekin.bookings set status='cancelled',updated_at=now() where care_recipient_id=r.id and status in ('requested','confirmed');
   update carekin.visits set contact_restricted=true,brief=null where booking_id in(select id from carekin.bookings where care_recipient_id=r.id);
   return null;
  end if;
 elsif operation like 'providers.%' then
  if operation='providers.createProviderProfile' then
   perform carekin.require(role_name='provider','Provider account required.'); x:=args->1;
   insert into carekin.providers(user_id,type,name,phone,bio,service_radius_km,latitude,longitude,photo_seed)
   values(uid,x->>'type',trim(x->>'name'),coalesce(x->>'phone',''),x->>'bio',(x->>'serviceRadiusKm')::numeric,(x->>'latitude')::float,(x->>'longitude')::float,x->>'name') returning * into p;
   insert into carekin.verifications(provider_id,to_status,reason) values(p.id,'pending','Application submitted'); return to_jsonb(p);
  elsif operation in ('providers.getProvider','providers.getMyProvider') then
   select * into p from carekin.providers where (operation='providers.getProvider' and id=(args->>0)::uuid) or (operation='providers.getMyProvider' and user_id=(args->>0)::uuid);
   if p.id is null then return null; end if;
   if p.user_id=uid or carekin.is_admin() then return to_jsonb(p); end if;
   perform carekin.require(p.verification_status='approved','Provider unavailable.');
   return carekin.public_provider(p);
  elsif operation in ('providers.getDocuments','providers.getVerificationStatus','providers.submitDocuments') then
   pid:=(args->>0)::uuid;
   perform carekin.require(carekin.provider_owned(pid) or carekin.is_admin(),'Provider unavailable.');
   if operation='providers.getVerificationStatus' then
    select jsonb_build_object('status',pp.verification_status,'reviews',(select coalesce(jsonb_agg(to_jsonb(v) order by created_at),'[]') from carekin.verifications v where provider_id=pid)) into result from carekin.providers pp where id=pid;
   elsif operation='providers.getDocuments' then
    select coalesce(jsonb_agg(to_jsonb(doc) order by uploaded_at),'[]') into result from carekin.documents doc where provider_id=pid;
   else
    perform carekin.require(carekin.provider_owned(pid) and jsonb_array_length(args->1) between 1 and 10,'Invalid document submission.');
    update carekin.providers set verification_status='pending',updated_at=now() where id=pid;
    result:='[]';
    for x in select value from jsonb_array_elements(args->1) loop
     perform carekin.require(exists(select 1 from storage.objects where bucket_id='carekin-documents' and name=x->>'storage_key' and (storage.foldername(name))[1]=uid::text),'Upload the document file first.');
     insert into carekin.documents(provider_id,type,filename,storage_key) values(pid,x->>'type',x->>'filename',x->>'storage_key') returning to_jsonb(carekin.documents.*) into a;
     result:=result||jsonb_build_array(a);
    end loop;
   end if; return result;
  end if;
 elsif operation like 'bookings.%' then
  if operation='bookings.createBooking' then
   fid:=(a->>'familyId')::uuid; pid:=(a->>'providerId')::uuid;
   perform carekin.require(carekin.family_owned(fid),'Family unavailable.');
   perform carekin.require(a->>'type'='one_off','Recurring billing is not enabled. Choose a single visit.');
   select * into p from carekin.providers where id=pid for update;
   perform carekin.require(p.verification_status='approved','Only approved providers can be booked.');
   select * into r from carekin.recipients where id=(a->>'careRecipientId')::uuid;
   perform carekin.require(r.family_id=fid and ((r.type='elder' and p.type='caregiver') or (r.type='child' and p.type='babysitter')),'Choose a matching care recipient.');
   perform carekin.require(r.type<>'child' or exists(select 1 from carekin.consents where id=r.parental_consent_id and family_id=fid and withdrawn_at is null),'Guardian consent is required.');
   target:=coalesce(a->>'requestKey',md5(pid::text||r.id::text||(a->>'scheduledAt')||(a->>'durationHours')));
   select * into b from carekin.bookings where family_id=fid and request_key=target;
   if b.id is not null then return to_jsonb(b); end if;
   perform 1 from carekin.families where id=fid for update;
   perform carekin.require((select count(*) from carekin.bookings where family_id=fid and created_at>now()-interval '1 hour')<5 and (select count(*) from carekin.bookings where family_id=fid and status='requested')<10,'Too many outstanding requests. Review your existing bookings before creating another.');
   perform carekin.assert_slot(pid,(a->>'scheduledAt')::timestamptz,(a->>'durationHours')::numeric);
   insert into carekin.bookings(family_id,provider_id,care_recipient_id,scheduled_at,ends_at,duration_hours,amount_paise,commission_paise,request_key)
   values(fid,pid,r.id,(a->>'scheduledAt')::timestamptz,(a->>'scheduledAt')::timestamptz+(a->>'durationHours')::numeric*interval '1 hour',(a->>'durationHours')::numeric,
    round((select value::numeric from carekin.settings where key='hourly_rate_paise')*(a->>'durationHours')::numeric),
    round((select value::numeric from carekin.settings where key='hourly_rate_paise')*(a->>'durationHours')::numeric*(select value::numeric from carekin.settings where key='commission_percent')/100),target) returning * into b;
   insert into carekin.visits(booking_id) values(b.id);
   perform carekin.notify(p.user_id,'booking_confirmed','A new visit request is waiting for your response.'); return to_jsonb(b);
  elsif operation in ('bookings.listBookingsForFamily','bookings.listBookingsForProvider','bookings.listAllBookings') then
   if operation='bookings.listAllBookings' then perform carekin.require(carekin.is_admin(),'Admin access required.');
   elsif operation='bookings.listBookingsForFamily' then perform carekin.require(carekin.family_owned((args->>0)::uuid) or carekin.is_admin(),'Family unavailable.');
   else perform carekin.require(carekin.provider_owned((args->>0)::uuid) or carekin.is_admin(),'Provider unavailable.'); end if;
   select coalesce(jsonb_agg(to_jsonb(bb) order by scheduled_at desc),'[]') into result from carekin.bookings bb where
    operation='bookings.listAllBookings' or (operation='bookings.listBookingsForFamily' and family_id=(args->>0)::uuid) or (operation='bookings.listBookingsForProvider' and provider_id=(args->>0)::uuid); return result;
  elsif operation='bookings.getBooking' then
   bid:=(args->>0)::uuid; perform carekin.require(carekin.can_visit(bid),'Booking unavailable.'); select to_jsonb(bb) into result from carekin.bookings bb where id=bid; return result;
  elsif operation='bookings.updateBookingStatus' then
   bid:=(args->>0)::uuid; select * into b from carekin.bookings where id=bid for update;
   perform carekin.require(args->>1='cancelled' and (carekin.family_owned(b.family_id) or carekin.is_admin()) and b.status in ('requested','confirmed'),'Use the authorized visit workflow for this action.');
   update carekin.bookings set status='cancelled',updated_at=now() where id=bid returning * into b;
   update carekin.visits set phase='interrupted' where booking_id=bid;
   perform carekin.notify((select user_id from carekin.providers where id=b.provider_id),'booking_cancelled','A visit was cancelled.'); return to_jsonb(b);
  end if;
 elsif operation like 'workspace.%' then
  if operation='workspace.getAvailability' then
   pid:=(args->>0)::uuid;
   perform carekin.require(carekin.provider_owned(pid) or carekin.is_admin() or exists(select 1 from carekin.providers where id=pid and verification_status='approved'),'Provider unavailable.');
   select jsonb_agg(jsonb_build_object('day',n,'enabled',coalesce(v.enabled,false),'start',coalesce(to_char(v.start,'HH24:MI'),'09:00'),'end',coalesce(to_char(v."end",'HH24:MI'),'17:00')) order by n) into result from generate_series(0,6) n left join carekin.availability v on v.provider_id=pid and v.day=n; return result;
  elsif operation='workspace.saveAvailability' then
   pid:=(args->>1)::uuid; perform carekin.require(carekin.provider_owned(pid),'Provider unavailable.');
   perform carekin.require(jsonb_array_length(args->2)=7 and (select count(distinct value->>'day') from jsonb_array_elements(args->2))=7,'Choose seven unique days.');
   delete from carekin.availability where provider_id=pid;
   for x in select value from jsonb_array_elements(args->2) loop
    insert into carekin.availability values(pid,(x->>'day')::smallint,(x->>'enabled')::boolean,(x->>'start')::time,(x->>'end')::time);
   end loop; return null;
  elsif operation='workspace.updatePublicProfile' then
   x:=args->1; update carekin.providers set name=trim(x->>'name'),bio=x->>'bio',service_radius_km=(x->>'radius')::numeric,updated_at=now() where user_id=uid returning * into p;
   perform carekin.require(p.id is not null,'Create your provider profile first.'); return to_jsonb(p);
  elsif operation='workspace.rescheduleBooking' then
   bid:=(args->>1)::uuid; select * into b from carekin.bookings where id=bid for update;
   perform carekin.require(carekin.family_owned(b.family_id) and b.status in ('requested','confirmed') and b.scheduled_at>now(),'Only your upcoming visits can be rescheduled.');
   perform carekin.assert_slot(b.provider_id,(args->>2)::timestamptz,b.duration_hours);
   update carekin.bookings set scheduled_at=(args->>2)::timestamptz,ends_at=(args->>2)::timestamptz+duration_hours*interval '1 hour',status='requested',updated_at=now() where id=bid returning * into b;
   update carekin.visits set phase='scheduled',arrival_pin=null where booking_id=bid;
   perform carekin.notify((select user_id from carekin.providers where id=b.provider_id),'booking_confirmed','A visit was rescheduled. Please review the new time.'); return to_jsonb(b);
  elsif operation='workspace.performBookingAction' then
   bid:=(args->>1)::uuid; target:=args->>2; select * into b from carekin.bookings where id=bid for update;
   perform carekin.require(carekin.provider_owned(b.provider_id) or carekin.is_admin(),'Booking unavailable.');
   perform carekin.require(target in ('accept','decline','cancel'),'Use Active Care to start or complete the visit.');
   perform carekin.require((target in ('accept','decline') and b.status='requested') or (target='cancel' and carekin.is_admin() and b.status in ('requested','confirmed')),'This action is not available.');
   if target='accept' then
    perform carekin.require(exists(select 1 from carekin.providers where id=b.provider_id and verification_status='approved'),'Provider approval required.');
    perform carekin.require((select value='true'::jsonb from carekin.settings where key='development_bookings') or exists(select 1 from carekin.payments where booking_id=bid and status='captured'),'Payment required before confirmation.');
   end if;
   update carekin.bookings set status=case when target='accept' then 'confirmed' else 'cancelled' end,updated_at=now() where id=bid returning * into b;
   if b.status='cancelled' then update carekin.visits set phase='interrupted' where booking_id=bid; end if;
   perform carekin.notify((select user_id from carekin.families where id=b.family_id),case when b.status='confirmed' then 'booking_confirmed' else 'booking_cancelled' end,'Your visit request was '||b.status||'.'); return to_jsonb(b);
  elsif operation='workspace.saveSupportDraft' then
   perform carekin.require((select count(*) from carekin.support_tickets where user_id=uid and created_at>now()-interval '1 hour')<5,'Please wait before opening another support ticket.');
   insert into carekin.support_tickets(user_id,name,email,topic,message) values(uid,a->>'name',a->>'email',a->>'topic',a->>'message') returning to_jsonb(carekin.support_tickets.*) into result; return result;
  elsif operation='workspace.listWorkspaceUsers' then
   perform carekin.require(carekin.is_admin(),'Admin access required.');
   select coalesce(jsonb_agg(jsonb_build_object('id',ac.id,'role',ac.role,'name',coalesce(ff.name,pp.name,'Profile not completed'),'detail',coalesce(pp.verification_status,ac.role),'href',case when pp.id is not null then '/admin/providers/'||pp.id end)),'[]') into result
   from carekin.accounts ac left join carekin.families ff on ff.user_id=ac.id left join carekin.providers pp on pp.user_id=ac.id; return result;
  end if;
 elsif operation like 'messages.%' then
  bid:=(args->>0)::uuid; perform carekin.require(carekin.can_visit(bid),'Booking unavailable.');
  select * into b from carekin.bookings where id=bid for update;
  perform carekin.require(b.status in ('confirmed','in_progress','completed') and not exists(select 1 from carekin.visits where booking_id=bid and contact_restricted),'Messaging is unavailable for this visit.');
  if operation='messages.listMessages' then
   select coalesce(jsonb_agg(to_jsonb(mm) order by created_at),'[]') into result from (select * from carekin.messages where booking_id=bid order by created_at desc limit 200) mm; return result;
  elsif operation='messages.sendMessage' then
   perform carekin.require(role_name in ('family','provider'),'Only participants can send messages.');
   perform carekin.require((select count(*) from carekin.messages where sender_id=uid and created_at>now()-interval '1 minute')<30,'Please wait before sending more messages.');
   insert into carekin.messages(booking_id,sender_id,sender_role,content) values(bid,uid,role_name,trim(args->>3)) returning to_jsonb(carekin.messages.*) into result;
   perform carekin.notify(case when role_name='family' then (select user_id from carekin.providers where id=b.provider_id) else (select user_id from carekin.families where id=b.family_id) end,'new_message','You have a new visit message.'); return result;
  end if;
 elsif operation like 'reviews.%' then
  bid:=(args->>0)::uuid; perform carekin.require(carekin.can_visit(bid),'Booking unavailable.');
  if operation='reviews.getReviewForBooking' then select to_jsonb(rr) into result from carekin.reviews rr where booking_id=bid; return result;
  elsif operation='reviews.submitReview' then
   select * into b from carekin.bookings where id=bid;
   perform carekin.require(carekin.family_owned(b.family_id) and b.status='completed','Only completed visits can be reviewed by their family.');
   insert into carekin.reviews(booking_id,provider_id,rating,comment) values(bid,b.provider_id,(args->>2)::smallint,nullif(trim(args->>3),'')) returning to_jsonb(carekin.reviews.*) into result; return result;
  end if;
 elsif operation like 'notifications.%' then
  if operation='notifications.listNotifications' then select coalesce(jsonb_agg(to_jsonb(nn) order by created_at desc),'[]') into result from (select * from carekin.notifications where user_id=uid order by created_at desc limit 100) nn; return result;
  elsif operation='notifications.markAllRead' then update carekin.notifications set read=true where user_id=uid; return null;
  elsif operation='notifications.addNotification' then return null; -- generated transactionally by trusted workflows
  end if;
 elsif operation like 'admin.%' then
  if operation='admin.raiseDispute' then
   bid:=(args->>0)::uuid; perform carekin.require(carekin.can_visit(bid) and role_name in ('family','provider'),'Booking unavailable.');
   select * into b from carekin.bookings where id=bid for update;
   perform carekin.require(b.status in ('confirmed','in_progress','completed'),'Only confirmed or completed visits can be disputed.');
   insert into carekin.disputes(booking_id,raised_by,reason) values(bid,uid,args->>2) returning * into d;
   update carekin.bookings set status='disputed',updated_at=now() where id=bid;
   update carekin.visits set contact_restricted=true,phase='interrupted' where booking_id=bid; return to_jsonb(d);
  end if;
  perform carekin.require(carekin.is_admin(),'Admin access required.');
  if operation='admin.listPendingVerifications' then select coalesce(jsonb_agg(to_jsonb(pp) order by created_at),'[]') into result from carekin.providers pp where verification_status='pending'; return result;
  elsif operation in ('admin.approveProvider','admin.rejectProvider') then
   pid:=(args->>0)::uuid; select * into p from carekin.providers where id=pid for update;
   perform carekin.require(p.verification_status='pending','Application is no longer pending.');
   if operation='admin.approveProvider' then
    perform carekin.require(exists(select 1 from carekin.documents where provider_id=pid and type='id_proof') and exists(select 1 from carekin.documents where provider_id=pid and type='address_proof'),'Review uploaded ID and address documents before approval.');
   end if;
   new_status:=case when operation='admin.approveProvider' then 'approved' else 'rejected' end;
   insert into carekin.verifications(provider_id,from_status,to_status,reviewed_by,reason) values(pid,p.verification_status,new_status,uid,case when new_status='rejected' then args->>1 else 'Approved by operations after review' end);
   update carekin.providers set verification_status=new_status,updated_at=now() where id=pid returning * into p;
   if new_status='approved' then update carekin.documents set status='verified' where provider_id=pid; end if;
   perform carekin.notify(p.user_id,'verification_update','Your provider application is '||new_status||'.'); return to_jsonb(p);
  elsif operation='admin.listDisputes' then select coalesce(jsonb_agg(to_jsonb(dd) order by created_at desc),'[]') into result from carekin.disputes dd; return result;
  elsif operation='admin.resolveDispute' then
   perform carekin.require(length(trim(args->>1)) between 1 and 2000,'Add resolution notes.');
   update carekin.disputes set status='resolved',resolution_notes=args->>1,resolved_at=now() where id=(args->>0)::uuid returning * into d; return to_jsonb(d);
  elsif operation='admin.listSupportTickets' then select coalesce(jsonb_agg(to_jsonb(tt) order by created_at desc),'[]') into result from carekin.support_tickets tt; return result;
  elsif operation='admin.resolveSupportTicket' then update carekin.support_tickets set status='resolved' where id=(args->>0)::uuid; return null;
  end if;
 elsif operation like 'referrals.%' then
  if operation='referrals.findFamilyIdByReferralCode' then select id into fid from carekin.families where upper(substr(replace(id::text,'-',''),1,8))=upper(args->>1) limit 1; return to_jsonb(fid);
  elsif operation='referrals.recordReferral' then
   fid:=(args->>1)::uuid; perform carekin.require(carekin.family_owned(fid),'Family unavailable.');
   insert into carekin.referrals(referrer_family_id,referred_family_id) values((args->>0)::uuid,fid) on conflict(referred_family_id) do nothing returning to_jsonb(carekin.referrals.*) into result; return result;
  elsif operation='referrals.listReferralStats' then
   fid:=(args->>0)::uuid; perform carekin.require(carekin.family_owned(fid),'Family unavailable.');
   select jsonb_build_object('referredCount',count(*),'completedCount',0,'earnedPaise',0) into result from carekin.referrals where referrer_family_id=fid; return result;
  end if;
 elsif operation='payments.getPaymentForBooking' then
  bid:=(args->>0)::uuid; perform carekin.require(carekin.can_visit(bid),'Booking unavailable.'); select to_jsonb(pp) into result from carekin.payments pp where booking_id=bid; return result;
 elsif operation in ('payouts.listPayoutsForProvider','payouts.listAllPayouts') then
  perform carekin.require(carekin.is_admin() or (operation='payouts.listPayoutsForProvider' and carekin.provider_owned((args->>0)::uuid)),'Payouts unavailable.');
  select coalesce(jsonb_agg(to_jsonb(pp) order by created_at desc),'[]') into result from carekin.payouts pp where operation='payouts.listAllPayouts' or provider_id=(args->>0)::uuid; return result;
 elsif operation in ('payouts.backfillPayoutsFromCompletedBookings','payouts.ensurePayoutForCompletedBooking') then return null;
 elsif operation='subscriptions.listSubscriptionsForFamily' then
  perform carekin.require(carekin.family_owned((args->>0)::uuid) or carekin.is_admin(),'Family unavailable.'); return '[]';
 elsif operation='subscriptions.getSubscription' then return null;
 elsif operation like 'care.%' then return carekin.care_api(operation,args);
 end if;
 raise exception 'This feature is not enabled yet: %',operation using errcode='P0001';
exception when exclusion_violation then raise exception 'That time overlaps another visit. Please choose a different time.' using errcode='P0001';
end;
$$;
revoke all on function public.carekin_api(text,jsonb) from public;
grant execute on function public.carekin_api(text,jsonb) to anon,authenticated;
commit;
