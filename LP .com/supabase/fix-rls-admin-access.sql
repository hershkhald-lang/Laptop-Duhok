-- Laptop Duhok — عند ظهور: "new row violates row-level security policy"
-- السبب الأكثر شيوعاً: حساب تسجيل الدخول غير مضاف إلى public.admin_users
-- Supabase → SQL Editor → شغّل بالترتيب

-- 1) من يستطيع الإدارة حالياً؟ (يجب أن يظهر صف واحد على الأقل بمعرّفك)
select * from public.admin_users;

-- 2) معرّفات المستخدمين في المشروع (لنسخ UUID الصحيح)
select id, email, created_at from auth.users order by created_at desc;

-- 3) أضف نفسك كمسؤول (استبدل النص بالـ UUID من الخطوة 2 — نفس البريد الذي تدخل به للوحة)
-- insert into public.admin_users (user_id) values ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- إذا أخطأت المستخدم وكررت الإدراج:
-- on conflict do nothing — الجدول له primary key على user_id
-- insert into public.admin_users (user_id) values ('...')
-- on conflict (user_id) do nothing;
