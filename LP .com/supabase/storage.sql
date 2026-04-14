-- Laptop Duhok — تخزين الصور للوحة الإدارة
-- نفّذ في SQL Editor. ثم من واجهة Supabase: Storage → أنشئ الـ bucket يدوياً إن فشل الإدراج.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set public = excluded.public;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'site-media');

drop policy if exists "site_media_auth_insert" on storage.objects;
create policy "site_media_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media');

drop policy if exists "site_media_auth_update" on storage.objects;
create policy "site_media_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media')
  with check (bucket_id = 'site-media');

drop policy if exists "site_media_auth_delete" on storage.objects;
create policy "site_media_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media');
