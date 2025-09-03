-- Get the user ID for passnnoww@gmail.com and create profile/role manually
DO $$
DECLARE
    owner_user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO owner_user_id 
    FROM auth.users 
    WHERE email = 'passnnoww@gmail.com';
    
    -- Insert profile if user exists and profile doesn't exist
    IF owner_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, email, full_name, username)
        VALUES (
            owner_user_id,
            'passnnoww@gmail.com',
            'Owner',
            'owner'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            username = EXCLUDED.username;
        
        -- Insert owner role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (owner_user_id, 'owner'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Profile and role created for owner user';
    ELSE
        RAISE NOTICE 'Owner user not found';
    END IF;
END $$;