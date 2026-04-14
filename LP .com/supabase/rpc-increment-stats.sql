-- Laptop Duhok — عدّادات دقيقة (زيارات + تفاعلات الشريط الرقمي)
-- نفّذ في Supabase → SQL Editor بعد تشغيل schema.sql
-- يسمح للزوار (anon) بزيادة مفتاحين فقط عبر دالة آمنة

create or replace function public.increment_site_stat(stat_key text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_val bigint;
begin
  if stat_key is null or stat_key not in ('stat_visits', 'digital_interactions') then
    raise exception 'invalid stat key';
  end if;

  update public.site_stats
  set value = value + 1,
      updated_at = now()
  where key = stat_key
  returning value into new_val;

  if new_val is null then
    insert into public.site_stats (key, value)
    values (stat_key, 1)
    on conflict (key) do update
      set value = public.site_stats.value + 1,
          updated_at = now()
    returning value into new_val;
  end if;

  return new_val;
end;
$$;

grant execute on function public.increment_site_stat(text) to anon, authenticated;
