-- Fix the trigger function to handle existing users and ensure it doesn't fail
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile only if it doesn't exist
  INSERT INTO public.profiles (user_id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign role only if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    'user'::app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also add unique constraints to prevent duplicate users
ALTER TABLE public.profiles ADD CONSTRAINT IF NOT EXISTS profiles_user_id_unique UNIQUE (user_id);
ALTER TABLE public.profiles ADD CONSTRAINT IF NOT EXISTS profiles_username_unique UNIQUE (username);
ALTER TABLE public.profiles ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email);