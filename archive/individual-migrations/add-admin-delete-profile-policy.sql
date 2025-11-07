-- Adiciona política RLS para permitir que admins apaguem perfis
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Admins can delete profiles"
on public.profiles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));
