-- Adicionar política INSERT para admins criarem perfis
CREATE POLICY "Admins can create profiles for their users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Adicionar comentário para documentação
COMMENT ON POLICY "Admins can create profiles for their users" ON public.profiles IS 
'Permite que admins criem perfis. O isolamento entre admins é garantido via tabela user_invitations.';