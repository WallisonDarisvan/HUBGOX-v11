-- Fix user creation flow to distinguish between normal signup and invitation signup

-- 1. Correct handle_new_user() function to check for invitation_token instead of username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_invitation_signup boolean;
BEGIN
  -- Check if this is an invitation signup (has invitation_token in metadata)
  -- Invitations are handled by accept_invitation function
  is_invitation_signup := NEW.raw_user_meta_data ? 'invitation_token';
  
  -- If it's an invitation signup, let accept_invitation handle profile creation
  IF is_invitation_signup THEN
    RETURN NEW;
  END IF;
  
  -- For normal signups, create profile automatically
  -- Check if profile already exists (extra safety)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, display_name, is_activated)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create profiles for any existing users without profiles
INSERT INTO public.profiles (id, username, display_name, is_activated, created_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  true,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;