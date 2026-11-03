// Disposable integration identity, never a production/demo login bypass.
// Requires the owner's authenticated Supabase CLI. No privileged key is read.
import { execFileSync } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const project='hjoektofktwvdlgptcrk';
const statePath=resolve('.impeccable/review/backend/qa-identity.json');
if(readFileSync('packages/supabase/.temp/project-ref','utf8').trim()!==project) throw new Error('Wrong linked project');
function query(sql) {
 const dir=mkdtempSync(join(tmpdir(),'carekin-qa-')); const file=join(dir,'query.sql');
 writeFileSync(file,sql,{mode:0o600});
 try { return JSON.parse(execFileSync('supabase',['db','query','--linked','--workdir','packages','--file',file],{encoding:'utf8',stdio:['ignore','pipe','pipe']})); }
 finally { unlinkSync(file); }
}
const mode=process.argv[2];
if(mode==='prepare') {
 const id=randomUUID(),password=randomBytes(24).toString('hex'),email=`qa-${id}@carekin-test.invalid`;
 query(`begin;
 insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('${id}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','${email}',extensions.crypt('${password}',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"carekin_qa":true}',now(),now(),'','','','');
 insert into auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at) values(gen_random_uuid(),'${id}','${id}','{"sub":"${id}","email":"${email}","email_verified":true}','email',now(),now()); commit;`);
 mkdirSync(resolve('.impeccable/review/backend'),{recursive:true}); writeFileSync(statePath,JSON.stringify({id,email,password}),{mode:0o600});
 console.log('Disposable QA identity created; credentials saved only to ignored local QA state.');
} else if(mode==='check') {
 const user=JSON.parse(readFileSync(statePath,'utf8'));
 const env=Object.fromEntries(readFileSync('apps/web/.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
 const base=env.NEXT_PUBLIC_SUPABASE_URL, key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const res=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})});
 const session=await res.json(); if(!res.ok) throw new Error('Auth sign-in failed: '+(session.msg||session.error_description||res.status));
 const rpc=await fetch(base+'/rest/v1/rpc/carekin_api',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({operation:'auth.me',args:[]})});
 if(!rpc.ok) throw new Error('Authenticated RPC failed: '+rpc.status);
 console.log('PASS: real Auth password sign-in and authenticated PostgREST RPC. No tokens logged.');
} else if(mode==='cleanup') {
 const {id}=JSON.parse(readFileSync(statePath,'utf8')); if(!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid QA id');
 query(`begin;
 do $$ begin if not exists(select 1 from auth.users where id='${id}' and raw_user_meta_data->>'carekin_qa'='true') then raise exception 'Not a QA identity'; end if; end $$;
 delete from carekin.notifications where user_id='${id}'; delete from carekin.support_tickets where user_id='${id}';
 delete from carekin.recipients where family_id in(select id from carekin.families where user_id='${id}');
 delete from carekin.consents where family_id in(select id from carekin.families where user_id='${id}');
 delete from carekin.families where user_id='${id}'; delete from carekin.accounts where id='${id}';
 delete from auth.users where id='${id}'; commit;`);
 unlinkSync(statePath); console.log('Removed the disposable QA identity, its test profile and local credential file.');
} else throw new Error('Choose prepare, check or cleanup');
