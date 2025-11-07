-- =====================================================
-- MIGRATION: Remove Foreign Key Constraint from Profiles
-- =====================================================
-- Remove a constraint profiles_id_fkey para permitir
-- criação de perfis pendentes (is_activated = false)
-- que ainda não têm usuário autenticado associado
-- =====================================================

-- Remover a foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar comentário explicativo na coluna
COMMENT ON COLUMN public.profiles.id IS 
'User ID - pode ser auth.users.id (usuário ativado) ou UUID aleatório (perfil pendente)';

-- Comentário explicativo na tabela
COMMENT ON TABLE public.profiles IS 
'Perfis de usuários - suporta perfis ativados (com conta) e pendentes (aguardando aceitação de convite)';
