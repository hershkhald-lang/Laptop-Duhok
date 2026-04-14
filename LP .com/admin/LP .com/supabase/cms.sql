-- Laptop Duhok — محتوى الموقع (نصوص ثنائية اللغة من لوحة الإدارة)
-- نفّذ بعد schema.sql

create table if not exists public.site_cms (
  id int primary key default 1,
  strings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_cms_singleton check (id = 1)
);

insert into public.site_cms (id, strings) values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_cms enable row level security;

drop policy if exists "site_cms_select_anon" on public.site_cms;
create policy "site_cms_select_anon"
  on public.site_cms for select to anon using (true);

drop policy if exists "site_cms_authenticated_all" on public.site_cms;
create policy "site_cms_authenticated_all"
  on public.site_cms for all to authenticated using (true) with check (true);
