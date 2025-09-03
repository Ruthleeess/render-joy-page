-- Remove the problematic user completely
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'passnnoww@gmail.com');
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'passnnoww@gmail.com');
DELETE FROM auth.users WHERE email = 'passnnoww@gmail.com';