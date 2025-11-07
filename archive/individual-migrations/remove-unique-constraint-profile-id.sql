-- =====================================================
-- FIX: Remover constraint UNIQUE de profile_id
-- =====================================================
-- Permite múltiplos convites históricos por profile
-- Mantém apenas o mais recente como ativo
-- =====================================================

-- Remover constraint UNIQUE existente
ALTER TABLE public.user_invitations 
DROP CONSTRAINT IF EXISTS user_invitations_profile_id_key;

-- Criar constraint UNIQUE condicional (apenas para convites pending)
-- PostgreSQL suporta partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS user_invitations_profile_id_pending_unique 
ON public.user_invitations(profile_id) 
WHERE status = 'pending';

-- Adicionar comentário explicativo
COMMENT ON INDEX user_invitations_profile_id_pending_unique IS 
'Garante que cada profile tenha apenas um convite com status pending por vez';
