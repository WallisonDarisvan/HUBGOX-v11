-- Fix multi-tenancy: Remove permissive policy that allows all authenticated users to view all profiles
-- This policy was breaking admin isolation, causing users created without admin invites to appear for all admins

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Remaining policies ensure proper access control:
-- 1. "Public profiles are viewable by everyone" - For anonymous/public access
-- 2. "Admins can view their invited profiles" - For admins to see only their invited users
-- 3. "Users can update own profile" - For users to edit their own profile
-- 4. "Admins can update profiles of their users" - For admins to manage their users
-- 5. "Admins can delete profiles of their users" - For admins to delete their users