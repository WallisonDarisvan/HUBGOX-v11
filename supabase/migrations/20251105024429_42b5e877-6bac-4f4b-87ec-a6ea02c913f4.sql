-- =====================================================
-- FIX: RLS policy para admins visualizarem perfis via created_by_admin_id
-- =====================================================
-- Problema: Policy "Admins can view their invited profiles" 
-- usa apenas user_invitations, mas perfis aceitos podem 
-- não ter invitation ativa após migração.
-- Solução: Adicionar created_by_admin_id na policy SELECT
-- =====================================================

-- Dropar policy antiga
DROP POLICY IF EXISTS "Admins can view their invited profiles" ON public.profiles;

-- Recriar policy com suporte a created_by_admin_id
CREATE POLICY "Admins can view their managed profiles"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() 
  OR created_by_admin_id = auth.uid()
  OR id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);