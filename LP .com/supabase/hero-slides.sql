-- Laptop Duhok — شرائح الـ Hero في الصفحة الرئيسية (عربي + کوردی)
-- نفّذ بعد schema.sql و admin-users.sql

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  is_published boolean not null default true,
  kicker_ar text not null default '',
  kicker_ckb text not null default '',
  title_ar text not null default '',
  title_ckb text not null default '',
  description_ar text not null default '',
  description_ckb text not null default '',
  primary_btn_text_ar text not null default '',
  primary_btn_text_ckb text not null default '',
  primary_btn_url text not null default '#contact',
  secondary_btn_text_ar text not null default '',
  secondary_btn_text_ckb text not null default '',
  secondary_btn_url text not null default '#portfolio',
  featured_image_url text,
  featured_label_ar text not null default 'Laptop Duhok',
  featured_label_ckb text not null default '',
  background_css text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_slides_order_idx on public.hero_slides (sort_order, id);

alter table public.hero_slides enable row level security;

drop policy if exists "hero_slides_select_anon" on public.hero_slides;
create policy "hero_slides_select_anon"
  on public.hero_slides for select to anon
  using (is_published = true);

drop policy if exists "hero_slides_select_admin" on public.hero_slides;
create policy "hero_slides_select_admin"
  on public.hero_slides for select to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "hero_slides_insert_admin" on public.hero_slides;
create policy "hero_slides_insert_admin"
  on public.hero_slides for insert to authenticated
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "hero_slides_update_admin" on public.hero_slides;
create policy "hero_slides_update_admin"
  on public.hero_slides for update to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "hero_slides_delete_admin" on public.hero_slides;
create policy "hero_slides_delete_admin"
  on public.hero_slides for delete to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create or replace function public.hero_slides_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hero_slides_updated_at on public.hero_slides;
create trigger hero_slides_updated_at
  before update on public.hero_slides
  for each row execute procedure public.hero_slides_set_updated_at();

-- بيانات أولية مرة واحدة فقط إن كان الجدول فارغاً
do $$
begin
  if exists (select 1 from public.hero_slides limit 1) then
    return;
  end if;
  insert into public.hero_slides (
    sort_order, is_published,
    kicker_ar, kicker_ckb,
    title_ar, title_ckb,
    description_ar, description_ckb,
    primary_btn_text_ar, primary_btn_text_ckb, primary_btn_url,
    secondary_btn_text_ar, secondary_btn_text_ckb, secondary_btn_url,
    featured_label_ar, featured_label_ckb
  ) values
    (
      0, true,
      'ستاف دهوك — حلول رقمية', 'ستاف دهۆک — چارەسەری دیجیتاڵی',
      'نبني مواقعكم وبرمجياتكم باحتراف', 'ماڵپەڕ و نەرمەکاڵاکانتان بە پیشەیی دروست دەکەین',
      'من دهوك إلى العالم — تصاميم عصرية، شفافية في الأسعار، ودعم يعزز ثقة عملائكم.',
      'لە دهۆکەوە بۆ جیهان — دیزاینی نوێ، نرخی ڕوون، پشتگیری بۆ متمانەی کڕیاران.',
      'اطلب استشارة', 'داوای ڕاوێژ بکە', '#contact',
      'تصفح الأعمال', 'پۆرتفۆلیۆ ببینە', '#portfolio',
      'Laptop Duhok', 'Laptop Duhok'
    ),
    (
      1, true,
      'ستاف دهوك — حلول رقمية', 'ستاف دهۆک — چارەسەری دیجیتاڵی',
      'تحول رقمي يعكس جودة فريقكم', 'گۆڕانی دیجیتاڵی کە کوالیتی تیمەکەتان دەردەخات',
      'معرض أعمال يبرز مهاراتكم، وهوية بصرية تواكب أهدافكم التسويقية.',
      'پۆرتفۆلیۆ کە لێهاتوویی دەردەخات و ناسنامەی بینراو هاوشێوەی ئامانجەکانی بازاڕکردن.',
      'اطلب استشارة', 'داوای ڕاوێژ بکە', '#contact',
      'تصفح الأعمال', 'پۆرتفۆلیۆ ببینە', '#portfolio',
      'Laptop Duhok', 'Laptop Duhok'
    ),
    (
      2, true,
      'ستاف دهوك — حلول رقمية', 'ستاف دهۆک — چارەسەری دیجیتاڵی',
      'مرجع تقني للباحثين عن الأفضل في دهوك', 'سەرچاوەی تەکنیکی بۆ ئەوانەی لە دهۆک باشترین دەگەڕێن',
      'محتوى واضح لمحركات البحث وللأسئلة الذكية — لنكون الخطوة الأولى عند سؤال العملاء.',
      'ناوەڕۆکی ڕوون بۆ گەڕان و زیرەکی دەستکرد — یەکەم هەنگاوین کاتێک کڕیاران دەپرسن.',
      'اطلب استشارة', 'داوای ڕاوێژ بکە', '#contact',
      'تصفح الأعمال', 'پۆرتفۆلیۆ ببینە', '#portfolio',
      'Laptop Duhok', 'Laptop Duhok'
    );
end $$;
