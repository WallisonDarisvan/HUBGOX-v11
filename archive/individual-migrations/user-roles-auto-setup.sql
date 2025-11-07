-- Função para adicionar role 'user' automaticamente após signup
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insere role 'user' para todo novo usuário
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$;

-- Trigger que executa após cada novo usuário ser criado
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute procedure public.handle_new_user_role();

-- Comentários úteis:
-- Para promover um usuário existente a admin, execute:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role
-- FROM auth.users
-- WHERE email = 'seu-email@exemplo.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
