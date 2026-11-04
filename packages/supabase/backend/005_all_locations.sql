begin;
-- Temporary development discovery expansion; does not change approval, roles,
-- private-field projection, provider service radius, booking or payment rules.
insert into carekin.settings(key,value) values('development_all_locations','true')
on conflict(key) do update set value=excluded.value;
do $$
declare
 definition text:=pg_get_functiondef('public.carekin_api(text,jsonb)'::regprocedure);
 old_filter text:='where km<=least(coalesce((a->>''radiusKm'')::numeric,10),50)';
 new_filter text:='where km<=least(coalesce((a->>''radiusKm'')::numeric,10),case when coalesce((select value::boolean from carekin.settings where key=''development_all_locations''),false) then 20040 else 50 end)';
begin
 if position(new_filter in definition)>0 then return; end if;
 if position(old_filter in definition)=0 then raise exception 'Unexpected search function definition; no changes applied'; end if;
 execute replace(definition,old_filter,new_filter);
end $$;
commit;
