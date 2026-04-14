-- Laptop Duhok — سياسات لوحة الإدارة (بعد تشغيل schema.sql)
-- Supabase → SQL Editor → الصق وشغّل
-- يجب إنشاء مستخدم من: Authentication → Users → Add user (بريد + كلمة مرور)

-- قراءة وحذف رسائل التواصل للمستخدم المسجّل فقط
drop policy if exists "contact_messages_select_authenticated" on public.contact_messages;
create policy "contact_messages_select_authenticated"
  on public.contact_messages
  for select
  to authenticated
  using (true);

drop policy if exists "contact_messages_delete_authenticated" on public.contact_messages;
create policy "contact_messages_delete_authenticated"
  on public.contact_messages
  for delete
  to authenticated
  using (true);

-- تعديل وإضافة صفوف الإحصائيات (لوحة الإدارة)
drop policy if exists "site_stats_update_authenticated" on public.site_stats;
create policy "site_stats_update_authenticated"
  on public.site_stats
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "site_stats_insert_authenticated" on public.site_stats;
create policy "site_stats_insert_authenticated"
  on public.site_stats
  for insert
  to authenticated
  with check (true);
