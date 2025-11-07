-- =====================================================
-- AUTO PROFILE CREATION ON USER SIGNUP
-- =====================================================
-- Cria automaticamente um perfil quando um usuário
-- se registra através do signup normal (não por convite)
-- =====================================================

-- Função para criar perfil automaticamente após signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_invitation_exists boolean;
begin
  -- Verificar se existe um convite pendente para este usuário
  select exists (
    select 1 
    from public.user_invitations 
    where email = new.email 
      and status = 'pending'
      and expires_at > now()
  ) into v_invitation_exists;
  
  -- Se existe convite pendente, não criar perfil automaticamente
  -- O perfil será associado quando o convite for aceito
  if v_invitation_exists then
    return new;
  end if;
  
  -- Gerar username a partir do email (parte antes do @)
  v_username := split_part(new.email, '@', 1);
  
  -- Garantir que o username é único adicionando sufixo se necessário
  while exists (select 1 from public.profiles where username = v_username) loop
    v_username := v_username || floor(random() * 1000)::text;
  end loop;
  
  -- Criar perfil para o novo usuário
  insert into public.profiles (
    id, 
    username, 
    display_name,
    is_activated
  ) values (
    new.id,
    v_username,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    true
  );
  
  return new;
end;
$$;

-- Criar trigger para executar após cada novo usuário ser criado
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- OBSERVAÇÕES
-- =====================================================
-- 1. Este trigger NÃO interfere com o fluxo de convites
-- 2. Se o usuário tem convite pendente, o perfil não é criado aqui
-- 3. O perfil será criado via accept_invitation() quando aceitar o convite
-- 4. Para signups normais (sem convite), cria perfil automaticamente
-- =====================================================
