begin;
-- Self-service role switching: a family account may become a provider account
-- and back. Family/provider profiles are separate tables keyed by user_id, so
-- switching preserves each side's records. Admin accounts can never switch,
-- and no account can switch INTO admin.
do $$
declare
 definition text:=pg_get_functiondef('public.carekin_api(text,jsonb)'::regprocedure);
 old_block text:='  return public.carekin_api(''auth.me'');'||chr(10)||' end if;';
 new_block text:='  return public.carekin_api(''auth.me'');'||chr(10)||' elsif operation=''auth.switchRole'' then'||chr(10)||'  perform carekin.require(args->>0 in (''family'',''provider''),''Choose family or provider. Admin roles cannot be switched.'');'||chr(10)||'  update carekin.accounts set role=args->>0 where id=uid and role in (''family'',''provider'');'||chr(10)||'  perform carekin.require(found,''Role switching is only available to family and provider accounts.'');'||chr(10)||'  return public.carekin_api(''auth.me'');'||chr(10)||' end if;';
begin
 if position('auth.switchRole' in definition)>0 then return; end if;
 if position(old_block in definition)=0 then raise exception 'Unexpected carekin_api definition; no changes applied'; end if;
 execute replace(definition,old_block,new_block);
end $$;
commit;
