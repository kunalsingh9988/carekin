begin;
create or replace function carekin.care_api(operation text,args jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); role_name text:=carekin.role(); bid uuid; b carekin.bookings; v carekin.visits; f carekin.families; p carekin.providers; r carekin.recipients;
 x jsonb; result jsonb; action text; entry text; terminal boolean; active boolean; consent boolean; severity text; case_row carekin.safety_cases;
begin
 if operation in ('care.listSafetyCases','care.updateSafetyCase','care.getSafeReturnFollowups') then
  perform carekin.require(carekin.is_admin(),'Admin access required.');
  if operation='care.listSafetyCases' then select coalesce(jsonb_agg(to_jsonb(s) order by created_at desc),'[]') into result from carekin.safety_cases s; return result;
  elsif operation='care.updateSafetyCase' then
   perform carekin.require(args->>2 in ('new','triaged','investigating','resolved') and length(trim(args->>3)) between 1 and 1000,'Choose a status and add a case note.');
   update carekin.safety_cases set status=args->>2,owner=uid,audit=audit||jsonb_build_array(jsonb_build_object('at',now(),'actor',uid,'note',args->>3)) where id=(args->>1)::uuid;
   return null;
  else
   select coalesce(jsonb_agg(jsonb_build_object('booking',to_jsonb(bb),'visit',to_jsonb(vv)-'arrival_pin'-'brief'-'pin_failures')),'[]') into result from carekin.bookings bb join carekin.visits vv on vv.booking_id=bb.id where vv.checkin_at is not null and vv.safe_return_at is null and bb.ends_at<now(); return result;
  end if;
 end if;
 bid:=(args->>1)::uuid; perform carekin.require(carekin.can_visit(bid),'Visit unavailable.');
 -- All booking, care and chat mutations serialize on this booking row.
 select * into b from carekin.bookings where id=bid for update;
 select * into v from carekin.visits where booking_id=bid for update;
 select * into f from carekin.families where id=b.family_id;
 select * into p from carekin.providers where id=b.provider_id;
 select * into r from carekin.recipients where id=b.care_recipient_id;
 consent:=r.type<>'child' or exists(select 1 from carekin.consents where id=r.parental_consent_id and family_id=f.id and withdrawn_at is null);
 terminal:=v.phase in ('checked_out','interrupted'); active:=v.phase in ('active','checkout_pending') and now()<=b.ends_at+interval '2 hours';
 if operation='care.getCareContext' then
  select coalesce(jsonb_agg((to_jsonb(s)-'evidence'-'audit')||jsonb_build_object('preserved_event_count',jsonb_array_length(s.evidence->'timeline'),'preserved_message_count',jsonb_array_length(s.evidence->'messages'))),'[]') into result from carekin.safety_cases s where booking_id=bid and reporter_id=uid;
  return jsonb_build_object('booking',to_jsonb(b),'visit',(to_jsonb(v)-'brief'-'pin_failures')||jsonb_build_object('arrival_pin',case when f.user_id=uid then v.arrival_pin end,'pin_required',v.arrival_pin is not null),
   'provider',jsonb_build_object('name',p.name,'type',p.type,'approved',p.verification_status='approved'),
   'familyName',split_part(f.name,' ',1),'recipientName',split_part(r.name,' ',1),'recipientType',r.type,
   'address',case when f.user_id=uid or carekin.is_admin() or (not v.contact_restricted and not terminal and b.status in ('confirmed','in_progress') and now()>=b.scheduled_at-interval '2 hours' and now()<=b.ends_at+interval '2 hours') then f.address end,
   'careNotes',case when f.user_id=uid or carekin.is_admin() or (not v.contact_restricted and active and consent and coalesce((v.brief->>'share_with_provider')::boolean,false)) then r.notes end,
   'brief',case when f.user_id=uid or carekin.is_admin() or (not v.contact_restricted and active and consent and coalesce((v.brief->>'share_with_provider')::boolean,false)) then v.brief end,'myCases',result);
 elsif operation='care.saveCareBrief' then
  x:=args->2; perform carekin.require(f.user_id=uid,'Only the booking family can edit the brief.');
  perform carekin.require(jsonb_typeof(x)='object' and jsonb_typeof(x->'contacts')='array' and jsonb_array_length(x->'contacts')<=3 and length(coalesce(x->>'access',''))<=1000 and length(coalesce(x->>'medical',''))<=1000 and length(coalesce(x->>'needs',''))<=1000 and length(coalesce(x->>'present',''))<=1000,'Invalid brief.');
  perform carekin.require(not exists(select 1 from jsonb_array_elements(x->'contacts') c where length(trim(c->>'name')) not between 1 and 100 or not coalesce(c->>'phone' ~ '^\+?[0-9 ()-]{7,20}$',false)),'Enter valid emergency contacts.');
  perform carekin.require(r.type<>'child' or not (x->>'share_with_provider')::boolean or (consent and (x->>'guardian_acknowledged')::boolean),'Guardian consent is required before sharing.');
  update carekin.visits set brief=x where booking_id=bid; return null;
 elsif operation='care.setArrivalPin' then
  perform carekin.require(f.user_id=uid and b.status='confirmed' and v.phase in ('scheduled','arriving'),'PIN can only be changed before your confirmed visit starts.');
  update carekin.visits set arrival_pin=case when (args->>2)::boolean then lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6,'0') end,pin_failures=0 where booking_id=bid; return null;
 elsif operation='care.careAction' then
  action:=args->>2;
  perform carekin.require(role_name in ('family','provider'),'Only visit participants can do this.');
  perform carekin.require(action in ('arriving','checkin','safe','checkout','confirm_checkout','safe_return','task'),'Unknown visit action.');
  perform carekin.require(not v.contact_restricted or action not in ('arriving','checkin','task'),'This visit needs operations review.');
  if action='safe_return' then
   perform carekin.require(p.user_id=uid and v.phase in ('checkout_pending','checked_out','interrupted'),'Safe return is available after departure.');
   v.safe_return_at:=now(); entry:='Provider safe return confirmed';
  else
   perform carekin.require(not terminal,'This visit has ended.');
   if action='arriving' then
    perform carekin.require(p.user_id=uid and b.status='confirmed' and v.phase='scheduled','Arrival is unavailable.');
    v.phase:='arriving'; entry:='Provider marked on the way';
   elsif action='checkin' then
    perform carekin.require(p.user_id=uid and p.verification_status='approved' and b.status='confirmed' and v.phase in ('scheduled','arriving') and consent,'Approved provider, confirmed visit and valid consent required.');
    perform carekin.require(now()>=b.scheduled_at-interval '30 minutes' and now()<=b.ends_at,'Check-in opens 30 minutes before the visit.');
    perform carekin.require(v.pin_failures<5,'PIN attempts exhausted. Ask the family to reset the PIN.');
    if v.arrival_pin is not null and coalesce(args->>3,'')<>v.arrival_pin then
     update carekin.visits set pin_failures=pin_failures+1 where booking_id=bid;
     return jsonb_build_object('error','Arrival PIN does not match.');
    end if;
    v.phase:='active'; v.checkin_at:=now(); v.last_safe_at:=now(); entry:='Check-in confirmed · care started';
    update carekin.bookings set status='in_progress',updated_at=now() where id=bid;
    perform carekin.notify(f.user_id,'booking_confirmed','Your visit has started.');
   elsif action in ('safe','task') then
    perform carekin.require(p.user_id=uid and v.phase='active','An active visit is required.');
    if action='safe' then v.last_safe_at:=now(); entry:='Provider safety check-in recorded';
    else
     perform carekin.require(args->>3 in ('0','1','2'),'Unknown checklist item.');
     if v.tasks @> jsonb_build_array((args->>3)::integer) then select coalesce(jsonb_agg(value),'[]') into v.tasks from jsonb_array_elements(v.tasks) where value<>to_jsonb((args->>3)::integer);
     else v.tasks:=v.tasks||jsonb_build_array((args->>3)::integer); end if; entry:='Care checklist updated';
    end if;
   elsif action='checkout' then
    perform carekin.require(p.user_id=uid and v.phase='active','Only the active provider can request check-out.');
    v.phase:='checkout_pending'; entry:='Provider requested check-out';
    perform carekin.notify(f.user_id,'booking_confirmed','Please review and confirm your visit check-out.');
   elsif action='confirm_checkout' then
    perform carekin.require(f.user_id=uid and v.phase='checkout_pending','The booking family must confirm check-out.');
    v.phase:='checked_out'; v.checkout_at:=now(); entry:='Family confirmed check-out';
    update carekin.bookings set status='completed',updated_at=now() where id=bid;
    -- Unpaid development bookings NEVER create payable money.
    insert into carekin.payouts(provider_id,booking_id,amount_paise) select b.provider_id,b.id,b.amount_paise-b.commission_paise where exists(select 1 from carekin.payments where booking_id=bid and status='captured') on conflict(booking_id) do nothing;
    perform carekin.notify(p.user_id,'booking_confirmed','The family confirmed visit completion.');
   end if;
  end if;
  v.timeline:=v.timeline||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',now(),'label',entry,'actor_role',role_name));
  update carekin.visits set phase=v.phase,checkin_at=v.checkin_at,checkout_at=v.checkout_at,safe_return_at=v.safe_return_at,last_safe_at=v.last_safe_at,tasks=v.tasks,timeline=v.timeline where booking_id=bid; return null;
 elsif operation='care.reportSafetyConcern' then
  x:=args->2; perform carekin.require(role_name in ('family','provider'),'Only participants can report a concern.');
  perform carekin.require((select count(*) from carekin.safety_cases where reporter_id=uid and created_at>now()-interval '1 hour')<20,'Report limit reached. Call emergency services if in immediate danger.');
  severity:=x->>'severity';
  if severity='service' and x->>'category' in ('I feel unsafe / possible abuse','Care recipient is unwell or injured','Provider has not arrived / left unexpectedly','Inappropriate behaviour or harassment','Medication / care-plan concern','I feel unsafe in this home','Threat, harassment, or discrimination','Someone present is making me uncomfortable','Unsafe home condition','Care recipient needs urgent medical help','I cannot continue this visit') then severity:='urgent'; end if;
  if coalesce((x->>'interrupt')::boolean,false) then
   perform carekin.require(not terminal,'Visit already ended; submit a concern without interrupting.');
   v.phase:='interrupted'; v.checkout_at:=now();
   v.timeline:=v.timeline||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',now(),'label','Visit interrupted · operations review required','actor_role',role_name));
   update carekin.bookings set status='disputed',updated_at=now() where id=bid;
  end if;
  if severity<>'service' or coalesce((x->>'interrupt')::boolean,false) then v.contact_restricted:=true; end if;
  update carekin.visits set phase=v.phase,checkout_at=v.checkout_at,timeline=v.timeline,contact_restricted=v.contact_restricted where booking_id=bid;
  insert into carekin.safety_cases(booking_id,reporter_id,reporter_role,severity,category,narrative,audit,evidence)
  values(bid,uid,role_name,severity,x->>'category',trim(x->>'narrative'),jsonb_build_array(jsonb_build_object('at',now(),'actor',uid,'note','Case recorded. No emergency dispatch or staffed response is connected.')),
   jsonb_build_object('timeline',v.timeline,'messages',(select coalesce(jsonb_agg(to_jsonb(mm) order by created_at),'[]') from carekin.messages mm where booking_id=bid))) returning * into case_row;
  insert into carekin.notifications(user_id,type,message) select id,'verification_update','A safety case needs review. No emergency service was dispatched.' from carekin.accounts where role='admin';
  return to_jsonb(case_row)-'evidence'-'audit';
 end if;
 raise exception 'Unknown care operation';
end;
$$;
revoke all on function carekin.care_api(text,jsonb) from public,anon,authenticated;
commit;
