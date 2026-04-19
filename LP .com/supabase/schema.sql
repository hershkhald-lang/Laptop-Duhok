-- Laptop Duhok — شغّل هذا الملف في Supabase: SQL Editor → New query → Run
-- الجداول + سياسات RLS للواجهة العامة (مفتاح anon/publishable)
--
-- ترتيب التنفيذ الكامل: schema → admin-users (ثم insert لمسؤولك) → admin-rls → rpc-increment-stats → cms → hero-slides → portfolio → storage → cashier-videos → shop → rls-hardening

-- رسائل نموذج التواصل
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text,
  message text not null,
  locale text not null default 'ar'
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_messages_insert_anon" on public.contact_messages;
create policy "contact_messages_insert_anon"
  on public.contact_messages
  for insert
  to anon
  with check (true);

-- إحصائيات المعروضة في الموقع (قراءة عامة، تعديل من لوحة التحكم فقط)
create table if not exists public.site_stats (
  key text primary key,
  value bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.site_stats enable row level security;

drop policy if exists "site_stats_select_anon" on public.site_stats;
create policy "site_stats_select_anon"
  on public.site_stats
  for select
  to anon
  using (true);

-- قيم افتراضية (عدّل الأرقام من Table Editor عند الحاجة)
insert into public.site_stats (key, value) values
  ('digital_interactions', 30335),
  ('stat_projects', 20),
  ('stat_years', 15),
  ('stat_visits', 30427),
  ('stat_clients', 120)
on conflict (key) do nothing;

-- المسؤولون فقط (صلاحية التعديل): نفّذ admin-users.sql ثم أضف صفاً بمعرّف حسابك
-- لوحة الإدارة (قراءة الرسائل، تعديل الإحصائيات): نفّذ admin-rls.sql بعد admin-users.sql
-- تشديد RLS (FORCE): نفّذ rls-hardening.sql بعد كل الجداول والسياسات
-- عدّاد زيارات/تفاعلات تلقائي من الموقع: نفّذ rpc-increment-stats.sql
-- محتوى الصفحة الرئيسية من لوحة الإدارة: نفّذ cms.sql
-- معرض + صور: portfolio.sql و storage.sql
-- فيديوهات شروحات الكاشير: cashier-videos.sql
-- متجر (تصنيفات + منتجات من لوحة الإدارة): shop.sql
-- شرائح الـ Hero: hero-slides.sql (بعد admin-users.sql)
