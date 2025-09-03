-- Create app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('owner', 'moderator', 'user');
    END IF;
END $$;

-- Update profiles table to add required columns if they don't exist
DO $$ 
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username text;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END $$;

-- Make username and email NOT NULL and add constraints
UPDATE public.profiles SET username = 'user' || id::text WHERE username IS NULL;
UPDATE public.profiles SET email = user_id::text || '@temp.com' WHERE email IS NULL;

ALTER TABLE public.profiles 
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on username and email
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create moderation_requests table
CREATE TABLE IF NOT EXISTS public.moderation_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('ban', 'remove')),
    reason text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on moderation_requests
ALTER TABLE public.moderation_requests ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'owner'));

-- RLS policies for moderation_requests
CREATE POLICY "Users can view requests they made" 
ON public.moderation_requests 
FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Owners can view all moderation requests" 
ON public.moderation_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Moderators can create moderation requests" 
ON public.moderation_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id AND public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Owners can update moderation requests" 
ON public.moderation_requests 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'owner'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  
  -- Assign role (owner for passnnoww@gmail.com, user for others)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'passnnoww@gmail.com' THEN 'owner'::app_role
      ELSE 'user'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();