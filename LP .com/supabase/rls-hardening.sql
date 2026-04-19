-- Laptop Duhok — تشديد RLS (نفّذ بعد جميع ملفات الجداول والسياسات)
-- يفرض تطبيق سياسات RLS حتى على مالك الجدول (FORCE ROW LEVEL SECURITY)
-- Supabase → SQL Editor → Run

alter table if exists public.contact_messages force row level security;
alter table if exists public.site_stats force row level security;
alter table if exists public.site_cms force row level security;
alter table if exists public.portfolio_items force row level security;
alter table if exists public.cashier_videos force row level security;
alter table if exists public.shop_categories force row level security;
alter table if exists public.shop_products force row level security;
alter table if exists public.hero_slides force row level security;
alter table if exists public.admin_users force row level security;

-- storage.objects: لا تشغّل FORCE هنا — الجدول مملوك لدور النظام في Supabase ويُرفض
-- التعديل (42501 must be owner). سياسات التخزين في storage.sql تبقى سارية على RLS العادي.

comment on table public.contact_messages is 'RLS: anon insert فقط؛ لا select للزائر.';
comment on table public.site_stats is 'RLS: anon select؛ تعديل عبر authenticated فقط.';
