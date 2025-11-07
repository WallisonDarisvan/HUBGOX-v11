-- Criar policy para usuários autenticados verem todos os profiles
-- Isso resolve o problema da página de lista pública não carregar quando o usuário está logado
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);