-- Laptop Duhok — معرض أعمال ديناميكي (نصوص + صور + مواصفات)
-- نفّذ بعد schema.sql و admin-rls.sql

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  category text not null check (category in ('web', 'app', 'brand')),
  image_url text,
  title_ar text not null default '',
  title_ckb text not null default '',
  meta_ar text not null default '',
  meta_ckb text not null default '',
  description_ar text not null default '',
  description_ckb text not null default '',
  specs_ar text,
  specs_ckb text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_items_sort_idx on public.portfolio_items (sort_order, id);

alter table public.portfolio_items enable row level security;

drop policy if exists "portfolio_select_public" on public.portfolio_items;
drop policy if exists "portfolio_select_anon" on public.portfolio_items;
drop policy if exists "portfolio_select_auth" on public.portfolio_items;
drop policy if exists "portfolio_all_authenticated" on public.portfolio_items;
drop policy if exists "portfolio_insert_auth" on public.portfolio_items;
drop policy if exists "portfolio_update_auth" on public.portfolio_items;
drop policy if exists "portfolio_delete_auth" on public.portfolio_items;

create policy "portfolio_select_anon"
  on public.portfolio_items for select to anon
  using (is_published = true);

create policy "portfolio_select_auth"
  on public.portfolio_items for select to authenticated
  using (true);

create policy "portfolio_insert_auth"
  on public.portfolio_items for insert to authenticated
  with check (true);

create policy "portfolio_update_auth"
  on public.portfolio_items for update to authenticated
  using (true)
  with check (true);

create policy "portfolio_delete_auth"
  on public.portfolio_items for delete to authenticated
  using (true);
