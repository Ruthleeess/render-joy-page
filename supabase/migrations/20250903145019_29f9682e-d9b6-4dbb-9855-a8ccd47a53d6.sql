-- Reset the existing user and create fresh
-- First, delete the existing user data
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'passnnoww@gmail.com');
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'passnnoww@gmail.com');

-- Delete the auth user (this will cascade)
DELETE FROM auth.users WHERE email = 'passnnoww@gmail.com';