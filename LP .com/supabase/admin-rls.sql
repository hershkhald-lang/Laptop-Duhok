-- Laptop Duhok — سياسات لوحة الإدارة (بعد تشغيل schema.sql و admin-users.sql)
-- Supabase → SQL Editor → الصق وشغّل
-- أضف معرّفك إلى public.admin_users ثم سجّل الدخول من لوحة الإدارة فقط.

-- قراءة وحذف رسائل التواصل — المسؤولون المسجّلون في admin_users فقط
drop policy if exists "contact_messages_select_authenticated" on public.contact_messages;
drop policy if exists "contact_messages_select_admin" on public.contact_messages;
create policy "contact_messages_select_admin"
  on public.contact_messages
  for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "contact_messages_delete_authenticated" on public.contact_messages;
drop policy if exists "contact_messages_delete_admin" on public.contact_messages;
create policy "contact_messages_delete_admin"
  on public.contact_messages
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- تعديل وإضافة الإحصائيات — المسؤولون فقط
drop policy if exists "site_stats_update_authenticated" on public.site_stats;
drop policy if exists "site_stats_update_admin" on public.site_stats;
create policy "site_stats_update_admin"
  on public.site_stats
  for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "site_stats_insert_authenticated" on public.site_stats;
drop policy if exists "site_stats_insert_admin" on public.site_stats;
create policy "site_stats_insert_admin"
  on public.site_stats
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
