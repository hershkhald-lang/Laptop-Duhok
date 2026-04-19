-- Laptop Duhok — مسؤولو الموقع (نفّذ أولاً قبل سياسات «المسؤول فقط»)
-- Supabase → SQL Editor
--
-- 1) أنشئ مستخدم الإدارة من: Authentication → Users → Add user (أو سجّل دخولاً مرة ثم انسخ UUID من الجدول).
-- 2) أضف صفاً هنا بمعرّف ذلك المستخدم:
--
--    insert into public.admin_users (user_id) values ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
--
-- 3) من Authentication → Providers: عطّل التسجيل العام (Disable sign ups) إن لم تكن بحاجة لحسابات جديدة.

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

-- لا توجد سياسات insert/update/delete لدور authenticated — لا يمكن لأحد إضافة نفسه كمسؤول عبر الـ API.
-- إضافة/حذف المسؤولين يتم من SQL Editor فقط (دور postgres).

comment on table public.admin_users is 'المستخدمون المصرّح لهم بإدارة المحتوى؛ الصلاحيات عبر RLS على باقي الجداول.';
