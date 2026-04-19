-- Laptop Duhok — تخزين الصور للوحة الإدارة
-- يعتمد على جدول public.admin_users؛ يُنشأ هنا تلقائياً إن لم يكن موجوداً.
-- بعد التشغيل: أضف مسؤولك — insert into public.admin_users (user_id) values ('…uuid…');
-- ثم من واجهة Supabase: Storage → أنشئ الـ bucket يدوياً إن فشل الإدراج أدناه.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.admin_users is 'المستخدمون المصرّح لهم بإدارة المحتوى؛ الصلاحيات عبر RLS على باقي الجداول.';

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
drop policy if exists "site_media_admin_insert" on storage.objects;
create policy "site_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

drop policy if exists "site_media_auth_update" on storage.objects;
drop policy if exists "site_media_admin_update" on storage.objects;
create policy "site_media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  )
  with check (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );

drop policy if exists "site_media_auth_delete" on storage.objects;
drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
  );
