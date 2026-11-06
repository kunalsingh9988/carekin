-- Account portraits are private, unlike public marketing illustrations.
-- Access is bound to the authenticated owner's folder for every user role.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('carekin-avatars','carekin-avatars',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy carekin_avatar_insert on storage.objects for insert to authenticated
with check(bucket_id='carekin-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy carekin_avatar_read on storage.objects for select to authenticated
using(bucket_id='carekin-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy carekin_avatar_delete on storage.objects for delete to authenticated
using(bucket_id='carekin-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
