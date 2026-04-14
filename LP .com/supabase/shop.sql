-- Laptop Duhok — متجر: تصنيفات + منتجات (صور ونصوص) من لوحة الإدارة
-- نفّذ بعد schema.sql و admin-rls.sql و storage.sql (نفس bucket site-media)

create table if not exists public.shop_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon text not null default 'package',
  name_ar text not null default '',
  name_ckb text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.shop_categories (id) on delete restrict,
  name_ar text not null default '',
  name_ckb text not null default '',
  desc_ar text not null default '',
  desc_ckb text not null default '',
  price bigint not null default 0 check (price >= 0),
  badge_ar text,
  badge_ckb text,
  image_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_products_category_idx on public.shop_products (category_id, sort_order);
create index if not exists shop_products_published_idx on public.shop_products (is_published, sort_order);

alter table public.shop_categories enable row level security;
alter table public.shop_products enable row level security;

drop policy if exists "shop_categories_select_anon" on public.shop_categories;
create policy "shop_categories_select_anon"
  on public.shop_categories for select to anon
  using (is_active = true);

drop policy if exists "shop_categories_all_auth" on public.shop_categories;
create policy "shop_categories_all_auth"
  on public.shop_categories for all to authenticated
  using (true) with check (true);

drop policy if exists "shop_products_select_anon" on public.shop_products;
create policy "shop_products_select_anon"
  on public.shop_products for select to anon
  using (is_published = true);

drop policy if exists "shop_products_all_auth" on public.shop_products;
create policy "shop_products_all_auth"
  on public.shop_products for all to authenticated
  using (true) with check (true);

create or replace function public.shop_products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shop_products_updated_at on public.shop_products;
create trigger shop_products_updated_at
  before update on public.shop_products
  for each row execute procedure public.shop_products_set_updated_at();

-- تصنيفات أولية (يمكنك تعديلها من اللوحة). slug يطابق القيم القديمة في الكتالوج الافتراضي.
insert into public.shop_categories (slug, icon, name_ar, name_ckb, sort_order, is_active) values
  ('cashier', 'monitor', 'أجهزة الكاشير', 'ئامێرەکانی کاشێر', 10, true),
  ('laptops', 'laptop', 'اللابتوبات', 'لاپتۆپەکان', 20, true),
  ('paper', 'layers', 'الورق والمستلزمات', 'کاغەز و پێداویستی', 30, true),
  ('peripherals', 'keyboard', 'كيبورد وماوس', 'تەختە و ماوس', 40, true),
  ('accessories', 'package', 'إكسسوارات', 'ئەکسسوار', 50, true)
on conflict (slug) do nothing;
