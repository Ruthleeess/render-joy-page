-- Delete specific user and all related data by email
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'passnnoww@gmail.com';

  IF uid IS NOT NULL THEN
    -- Remove app data first
    DELETE FROM public.moderation_requests WHERE requester_id = uid OR target_user_id = uid;
    DELETE FROM public.user_roles WHERE user_id = uid;
    DELETE FROM public.profiles WHERE user_id = uid;

    -- Finally remove the auth user (cascades to auth-related tables)
    DELETE FROM auth.users WHERE id = uid;
  END IF;
END $$;