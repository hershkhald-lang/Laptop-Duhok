-- Laptop Duhok — فيديوهات شروحات نظام الكاشير (يوتيوب)
-- نفّذ بعد schema.sql و admin-users.sql و admin-rls.sql

create table if not exists public.cashier_videos (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  youtube_id text not null,
  title_ar text not null default '',
  title_ckb text not null default '',
  description_ar text not null default '',
  description_ckb text not null default '',
  category text not null check (category in ('basics', 'sales', 'reports', 'settings', 'hardware')),
  duration text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cashier_videos_sort_idx on public.cashier_videos (sort_order, id);

alter table public.cashier_videos enable row level security;

drop policy if exists "cashier_select_anon" on public.cashier_videos;
drop policy if exists "cashier_select_auth" on public.cashier_videos;
drop policy if exists "cashier_insert_auth" on public.cashier_videos;
drop policy if exists "cashier_update_auth" on public.cashier_videos;
drop policy if exists "cashier_delete_auth" on public.cashier_videos;

create policy "cashier_select_anon"
  on public.cashier_videos for select to anon
  using (is_published = true);

create policy "cashier_select_auth"
  on public.cashier_videos for select to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "cashier_insert_auth"
  on public.cashier_videos for insert to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "cashier_update_auth"
  on public.cashier_videos for update to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create policy "cashier_delete_auth"
  on public.cashier_videos for delete to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
