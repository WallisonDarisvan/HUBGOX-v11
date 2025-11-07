-- =====================================================
-- Correção Rápida: Adicionar DELETE Policy em user_invitations
-- =====================================================
-- Permite que usuários deletem convites que eles criaram

CREATE POLICY "Users can delete their own invitations"
ON public.user_invitations FOR DELETE
TO authenticated
USING (invited_by_admin_id = auth.uid());