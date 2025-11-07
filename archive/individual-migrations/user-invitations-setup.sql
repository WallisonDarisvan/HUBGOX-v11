-- Create pending_profiles table for pre-created profiles (before user signup)
create table if not exists public.pending_profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text,
  created_at timestamptz default now(),
  created_by_admin_id uuid references auth.users(id) on delete set null
);

-- Enable RLS on pending_profiles
alter table public.pending_profiles enable row level security;

-- Only admins can manage pending profiles
create policy "Admins can manage pending profiles"
on public.pending_profiles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Create user_invitations table
create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  invited_by_admin_id uuid references auth.users(id) on delete set null,
  pending_profile_id uuid references public.pending_profiles(id) on delete cascade not null,
  invitation_token uuid unique not null default gen_random_uuid(),
  email text,
  status text check (status in ('pending', 'accepted', 'expired')) default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now(),
  accepted_at timestamptz,
  linked_profile_id uuid references public.profiles(id) on delete set null,
  unique(pending_profile_id)
);

-- Enable RLS
alter table public.user_invitations enable row level security;

-- RLS Policies for user_invitations
-- Only admins can view invitations
create policy "Admins can view all invitations"
on public.user_invitations
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Only admins can create invitations
create policy "Admins can create invitations"
on public.user_invitations
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- Only admins can update invitations
create policy "Admins can update invitations"
on public.user_invitations
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Anyone can view their own invitation (by token, checked in app)
create policy "Public can view invitation by token"
on public.user_invitations
for select
to anon
using (status = 'pending' and expires_at > now());

-- Function to check if invitation token is valid
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

-- Function to accept invitation and create actual profile
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
  values (user_id, v_username, v_display_name);
  
  -- Mark invitation as accepted and link to real profile
  update public.user_invitations
  set status = 'accepted',
      accepted_at = now(),
      linked_profile_id = user_id
  where invitation_token = token;
  
  return true;
end;
$$;

-- Create indexes for faster lookups
create index if not exists idx_pending_profiles_username on public.pending_profiles(username);
create index if not exists idx_user_invitations_token on public.user_invitations(invitation_token);
create index if not exists idx_user_invitations_pending_profile_id on public.user_invitations(pending_profile_id);
create index if not exists idx_user_invitations_status on public.user_invitations(status);
