-- Função para verificar se admin pode criar mais perfis
CREATE OR REPLACE FUNCTION public.check_profile_creation_limit(p_admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limit integer;
  v_current_count integer;
BEGIN
  -- Buscar limite do plano do admin
  SELECT pd.limit_profiles INTO v_limit
  FROM user_plans up
  JOIN plan_definitions pd ON pd.plan_id = up.plan_id
  WHERE up.user_id = p_admin_id;
  
  -- Se não encontrou plano, retornar false (não pode criar)
  IF v_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- Contar perfis existentes (Meu Perfil + convites com profile_id ou linked_profile_id)
  WITH profile_ids AS (
    SELECT p_admin_id AS profile_id
    UNION
    SELECT ui.profile_id
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = p_admin_id AND ui.profile_id IS NOT NULL
    UNION
    SELECT ui.linked_profile_id
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = p_admin_id AND ui.linked_profile_id IS NOT NULL
  )
  SELECT COUNT(DISTINCT profile_id) INTO v_current_count FROM profile_ids;
  
  -- Retornar se ainda tem slots disponíveis
  RETURN v_current_count < v_limit;
END;
$$;

-- Policy na tabela user_invitations para bloquear criação de convites acima do limite
DROP POLICY IF EXISTS "Cannot create invitation if limit reached" ON public.user_invitations;
CREATE POLICY "Cannot create invitation if limit reached" ON public.user_invitations
FOR INSERT
WITH CHECK (
  check_profile_creation_limit(invited_by_admin_id)
);

-- Policy na tabela profiles para bloquear criação de perfis por admins acima do limite
DROP POLICY IF EXISTS "Admins cannot exceed profile limit on insert" ON public.profiles;
CREATE POLICY "Admins cannot exceed profile limit on insert" ON public.profiles
FOR INSERT
WITH CHECK (
  -- Permitir se for o próprio usuário criando seu perfil (signup normal)
  (id = auth.uid())
  OR
  -- Ou se for admin criando e ainda não atingiu o limite
  (has_admin_mode(auth.uid()) AND check_profile_creation_limit(auth.uid()))
);