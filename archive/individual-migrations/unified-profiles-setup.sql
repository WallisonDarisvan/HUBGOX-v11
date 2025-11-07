-- =====================================================
-- MIGRATION: Unified Profiles System
-- =====================================================
-- Permite que perfis criados pelo admin já tenham
-- funcionalidades completas (página pública, cards, etc)
-- mesmo antes do usuário aceitar o convite
-- =====================================================

-- Passo 1: Adicionar coluna is_activated na tabela profiles
-- Esta coluna indica se o usuário já aceitou o convite e criou conta
alter table public.profiles 
add column if not exists is_activated boolean default true;

-- Passo 2: Migrar dados existentes de pending_profiles para profiles
-- (se houver pending_profiles, converte para profiles não ativados)
do $$
declare
  pending_rec record;
begin
  for pending_rec in 
    select pp.*, ui.id as invitation_id, ui.invitation_token
    from public.pending_profiles pp
    left join public.user_invitations ui on ui.pending_profile_id = pp.id
  loop
    -- Inserir profile não ativado
    insert into public.profiles (
      id, 
      username, 
      display_name, 
      is_activated,
      created_at
    ) values (
      pending_rec.id,
      pending_rec.username,
      pending_rec.display_name,
      false,
      pending_rec.created_at
    )
    on conflict (id) do nothing;
    
    -- Atualizar user_invitation para apontar para o profile
    if pending_rec.invitation_id is not null then
      update public.user_invitations
      set profile_id = pending_rec.id,
          pending_profile_id = null
      where id = pending_rec.invitation_id;
    end if;
  end loop;
end $$;

-- Passo 3: Atualizar estrutura de user_invitations
-- Adicionar profile_id se não existir
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'user_invitations' 
    and column_name = 'profile_id'
  ) then
    alter table public.user_invitations 
    add column profile_id uuid references public.profiles(id) on delete cascade;
  end if;
end $$;

-- Passo 4: Atualizar função accept_invitation
-- Agora apenas ativa o profile existente em vez de criar um novo
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
  v_profile_id uuid;
  v_invitation_id uuid;
begin
  -- Buscar profile_id do convite
  select 
    i.profile_id,
    i.id
  into 
    v_profile_id,
    v_invitation_id
  from public.user_invitations i
  where i.invitation_token = token
    and i.status = 'pending'
    and i.expires_at > now();
  
  if v_profile_id is null then
    return false;
  end if;
  
  -- Atualizar o profile existente com o user_id e marcar como ativado
  update public.profiles
  set id = user_id,
      is_activated = true
  where id = v_profile_id;
  
  -- Marcar convite como aceito
  update public.user_invitations
  set status = 'accepted',
      accepted_at = now(),
      linked_profile_id = user_id,
      profile_id = user_id
  where id = v_invitation_id;
  
  return true;
end;
$$;

-- Passo 5: Atualizar função validate_invitation_token
create or replace function public.validate_invitation_token(token uuid)
returns table (
  invitation_id uuid,
  profile_id uuid,
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
    i.profile_id,
    p.username,
    p.display_name,
    i.email
  from public.user_invitations i
  join public.profiles p on p.id = i.profile_id
  where i.invitation_token = token
    and i.status = 'pending'
    and i.expires_at > now();
end;
$$;

-- Passo 6: Criar índices
create index if not exists idx_profiles_is_activated on public.profiles(is_activated);
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_user_invitations_profile_id on public.user_invitations(profile_id);

-- Passo 7: Atualizar RLS policies em profiles
-- Permitir que admins vejam e gerenciem todos os profiles (incluindo não ativados)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin') or id = auth.uid()
);

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
on public.profiles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin') or id = auth.uid());

-- Perfis públicos podem ser vistos por todos (mesmo não ativados)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
on public.profiles
for select
to anon
using (true);

-- =====================================================
-- OBSERVAÇÃO IMPORTANTE
-- =====================================================
-- Após executar esta migração:
-- 1. pending_profiles ainda existe mas não será mais usado
-- 2. Todos os perfis (ativados e não ativados) estarão em profiles
-- 3. Perfis não ativados (is_activated = false) são aqueles
--    aguardando que o usuário aceite o convite
-- 4. Cards, formulários e página pública funcionam para
--    todos os profiles, independente de is_activated
-- =====================================================
