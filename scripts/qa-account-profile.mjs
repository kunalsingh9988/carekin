// Disposable account/photo integration test. Never edits a real user's profile.
import { execFileSync } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

if (readFileSync('packages/supabase/.temp/project-ref', 'utf8').trim() !== 'hjoektofktwvdlgptcrk') throw new Error('Wrong CareKin project');
const env = Object.fromEntries(readFileSync('apps/web/.env.local', 'utf8').split('\n').filter(line => line.includes('=')).map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const base = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
function query(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'carekin-profile-qa-')), file = join(dir, 'query.sql');
  writeFileSync(file, sql, { mode: 0o600 });
  try { return JSON.parse(execFileSync('supabase', ['db', 'query', '--linked', '--workdir', 'packages', '--file', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })); }
  finally { unlinkSync(file); }
}
const people = [0, 1].map(() => ({ id: randomUUID(), password: randomBytes(24).toString('hex') }));
const photoPath = `${people[0].id}/${randomUUID()}.png`;
let created = false, uploaded = false;
async function request(path, person, method = 'GET', body, extra = {}) {
  return fetch(base + path, { method, headers: { apikey: key, ...(person?.token ? { Authorization: `Bearer ${person.token}` } : {}), ...extra }, ...(body ? { body } : {}) });
}
function assert(condition, text) { if (!condition) throw new Error(text); }
try {
  query(`begin; ${people.map(person => {
    person.email = `profile-qa-${person.id}@carekin-test.invalid`;
    return `insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    values('${person.id}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','${person.email}',extensions.crypt('${person.password}',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"carekin_profile_qa":true}',now(),now(),'','','','');
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at) values(gen_random_uuid(),'${person.id}','${person.id}','{"sub":"${person.id}","email":"${person.email}","email_verified":true}','email',now(),now());
    insert into carekin.accounts(id,role) values('${person.id}','family');`;
  }).join('\n')} commit;`);
  created = true;
  for (const person of people) {
    const result = await request('/auth/v1/token?grant_type=password', null, 'POST', JSON.stringify({ email: person.email, password: person.password }), { 'Content-Type': 'application/json' });
    assert(result.ok, 'Disposable sign-in failed'); person.token = (await result.json()).access_token;
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4z8AAAAASUVORK5CYII=', 'base64');
  assert((await request(`/storage/v1/object/carekin-avatars/${photoPath}`, people[0], 'POST', png, { 'Content-Type': 'image/png' })).ok, 'Owner upload failed'); uploaded = true;
  const signed = await request(`/storage/v1/object/sign/carekin-avatars/${photoPath}`, people[0], 'POST', JSON.stringify({ expiresIn: 60 }), { 'Content-Type': 'application/json' });
  assert(signed.ok, 'Owner signed read failed');
  assert(!(await request(`/storage/v1/object/sign/carekin-avatars/${photoPath}`, people[1], 'POST', JSON.stringify({ expiresIn: 60 }), { 'Content-Type': 'application/json' })).ok, 'Another account could read a private photo');
  assert(!(await request(`/storage/v1/object/public/carekin-avatars/${photoPath}`, null)).ok, 'Private photo was publicly readable');
  const updated = await request('/auth/v1/user', people[0], 'PUT', JSON.stringify({ data: { display_name: 'Profile QA Person', contact_phone: '+919876543210', avatar_path: photoPath, role: 'admin' } }), { 'Content-Type': 'application/json' });
  assert(updated.ok, 'Account detail save failed');
  const profile = await updated.json();
  assert(profile.user_metadata.display_name === 'Profile QA Person' && profile.user_metadata.avatar_path === photoPath, 'Profile did not persist');
  const me = await request('/rest/v1/rpc/carekin_api', people[0], 'POST', JSON.stringify({ operation: 'auth.me', args: [] }), { 'Content-Type': 'application/json' });
  assert(me.ok && (await me.json()).role === 'family', 'User metadata changed the protected account role');
  console.log('PASS: owner upload/read, cross-account denial, public denial, account metadata persistence, and server-owned role protection.');
} finally {
  if (uploaded) {
    const result = await request('/storage/v1/object/carekin-avatars', people[0], 'DELETE', JSON.stringify({ prefixes: [photoPath] }), { 'Content-Type': 'application/json' });
    assert(result.ok, 'Disposable photo cleanup failed');
  }
  if (created) query(`begin; ${people.map(person => `delete from carekin.accounts where id='${person.id}'; delete from auth.users where id='${person.id}' and raw_user_meta_data->>'carekin_profile_qa'='true';`).join('\n')} commit;`);
  console.log('Removed only this run’s disposable accounts and synthetic photo. No real profile was changed.');
}
