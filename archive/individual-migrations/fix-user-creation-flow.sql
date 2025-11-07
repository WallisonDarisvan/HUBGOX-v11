-- =====================================================
-- MIGRATION: Fix User Creation Flow with Pending Profiles
-- =====================================================
-- This migration fixes the user creation flow to use pending_profiles
-- Execute this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Create pending_profiles table for pre-created profiles
create table if not exists public.pending_profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text,
  created_at timestamptz default now(),
  created_by_admin_id uuid references auth.users(id) on delete set null
);

-- Enable RLS on pending_profiles
alter table public.pending_profiles enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Admins can manage pending profiles" on public.pending_profiles;

-- Only admins can manage pending profiles
create policy "Admins can manage pending profiles"
on public.pending_profiles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Step 2: Update user_invitations table structure
-- Check if pending_profile_id column exists, if not add it
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'user_invitations' 
    and column_name = 'pending_profile_id'
  ) then
    alter table public.user_invitations 
    add column pending_profile_id uuid references public.pending_profiles(id) on delete cascade;
  end if;
end $$;

-- Make sure we have the right constraint
alter table public.user_invitations 
drop constraint if exists user_invitations_pending_profile_id_key;

alter table public.user_invitations 
add constraint user_invitations_pending_profile_id_key unique(pending_profile_id);

-- If profile_id column exists and pending_profile_id doesn't have data, we can migrate
-- Note: This is safe only if you haven't created any users yet
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'user_invitations' 
    and column_name = 'profile_id'
  ) then
    -- You can uncomment the line below if you want to drop the old column
    -- alter table public.user_invitations drop column if exists profile_id;
    null; -- placeholder for the if block
  end if;
end $$;

-- Step 3: Update/Create validate_invitation_token function
create or replace function public.validate_invitation_token(token uuid)
returns table (
  invitation_id uuid,
  pending_profile_id uuid,
  username text,
  display_name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    i.id as invitation_id,
    i.pending_profile_id,
    pp.username,
    pp.display_name,
    i.email
  from public.user_invitations i
  join public.pending_profiles pp on pp.id = i.pending_profile_id
  where i.invitation_token = token
    and i.status = 'pending'
    and i.expires_at > now();
end;
$$;

-- Step 4: Update/Create accept_invitation function
create or replace function public.accept_invitation(
  token uuid,
  user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending_profile_id uuid;
  v_username text;
  v_display_name text;
begin
  -- Get pending profile data from invitation
  select 
    i.pending_profile_id,
    pp.username,
    pp.display_name
  into 
    v_pending_profile_id,
    v_username,
    v_display_name
  from public.user_invitations i
  join public.pending_profiles pp on pp.id = i.pending_profile_id
  where i.invitation_token = token
    and i.status = 'pending'
    and i.expires_at > now();
  
  if v_pending_profile_id is null then
    return false;
  end if;
  
  -- Create actual profile with the user_id
  insert into public.profiles (id, username, display_name)
  values (user_id, v_username, v_display_name)
  on conflict (id) do nothing; -- Avoid errors if profile already exists
  
  -- Mark invitation as accepted and link to real profile
  update public.user_invitations
  set status = 'accepted',
      accepted_at = now(),
      linked_profile_id = user_id
  where invitation_token = token;
  
  return true;
end;
$$;

-- Step 5: Create indexes for better performance
create index if not exists idx_pending_profiles_username on public.pending_profiles(username);
create index if not exists idx_user_invitations_token on public.user_invitations(invitation_token);
create index if not exists idx_user_invitations_pending_profile_id on public.user_invitations(pending_profile_id);
create index if not exists idx_user_invitations_status on public.user_invitations(status);

-- Step 6: Verify user_invitations RLS policies exist
-- Drop and recreate to ensure they're correct
drop policy if exists "Admins can view all invitations" on public.user_invitations;
drop policy if exists "Admins can create invitations" on public.user_invitations;
drop policy if exists "Admins can update invitations" on public.user_invitations;
drop policy if exists "Public can view invitation by token" on public.user_invitations;

create policy "Admins can view all invitations"
on public.user_invitations
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can create invitations"
on public.user_invitations
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update invitations"
on public.user_invitations
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Public can view invitation by token"
on public.user_invitations
for select
to anon
using (status = 'pending' and expires_at > now());

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next steps:
-- 1. Verify the migration ran successfully
-- 2. Test creating a new user from the admin panel
-- 3. Test accepting an invitation
-- =====================================================
