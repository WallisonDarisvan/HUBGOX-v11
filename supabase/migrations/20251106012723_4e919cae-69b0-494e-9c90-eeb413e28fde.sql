-- Migration: Configure dev/user role system
-- Remove admin and moderator roles, keep only dev and user

-- Step 1: Migrate existing 'admin' or 'moderator' users to 'user' role
UPDATE public.user_roles 
SET role = 'user'
WHERE role IN ('admin', 'moderator');

-- Step 2: Drop old policies that reference 'admin' role
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Step 3: Drop storage policies that depend on app_role enum
DROP POLICY IF EXISTS "Admins can upload to avatars for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update in avatars for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from avatars for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to profile-covers for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update in profile-covers for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from profile-covers for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update in card-images for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from card-images for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to form-backgrounds for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update in form-backgrounds for their users" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from form-backgrounds for their users" ON storage.objects;

-- Step 4: Drop has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 5: Update the app_role enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('user', 'dev');

-- Update user_roles table to use new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING role::text::public.app_role;

-- Drop old enum
DROP TYPE public.app_role_old;

-- Step 6: Recreate has_role function with new enum
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

-- Step 7: Recreate storage policies for 'dev' role
-- Avatars bucket
CREATE POLICY "Devs can upload to avatars for their users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can update in avatars for their users"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can delete from avatars for their users"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Profile covers bucket
CREATE POLICY "Devs can upload to profile-covers for their users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can update in profile-covers for their users"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-covers' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can delete from profile-covers for their users"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-covers' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Card images bucket
CREATE POLICY "Devs can update in card-images for their users"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'card-images' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can delete from card-images for their users"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'card-images' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Form backgrounds bucket
CREATE POLICY "Devs can upload to form-backgrounds for their users"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'form-backgrounds' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can update in form-backgrounds for their users"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'form-backgrounds' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Devs can delete from form-backgrounds for their users"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'form-backgrounds' 
  AND (public.has_role(auth.uid(), 'dev') OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Step 8: Create new RLS policies for 'dev' role on main tables

-- Support messages: devs can view and update
CREATE POLICY "Devs can view all support messages"
ON public.support_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can update support messages"
ON public.support_messages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'dev'))
WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- User plans: devs can view all
CREATE POLICY "Devs can view all plans"
ON public.user_plans FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'dev'));

-- User roles: devs can manage
CREATE POLICY "Devs can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'dev'));

-- Plan definitions: devs can fully manage
CREATE POLICY "Devs can insert plan definitions"
ON public.plan_definitions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can update plan definitions"
ON public.plan_definitions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'dev'))
WITH CHECK (public.has_role(auth.uid(), 'dev'));

CREATE POLICY "Devs can delete plan definitions"
ON public.plan_definitions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'dev'));

-- Comment: Document the role system
COMMENT ON TYPE public.app_role IS 'Sistema de roles: user (usuários com planos) e dev (donos do sistema que gerenciam planos, roles e suporte)';