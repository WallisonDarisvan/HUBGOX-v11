-- Adiciona política RLS para permitir que admins apaguem perfis (se ainda não existir)
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Admins can delete profiles"
on public.profiles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Cria função para permitir que admins removam usuários da autenticação
create or replace function public.admin_delete_user(user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar se o usuário atual é admin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso negado: apenas admins podem remover usuários';
  end if;
  
  -- Remover o usuário do auth.users
  delete from auth.users where id = user_id;
end;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
grant execute on function public.admin_delete_user(uuid) to authenticated;
