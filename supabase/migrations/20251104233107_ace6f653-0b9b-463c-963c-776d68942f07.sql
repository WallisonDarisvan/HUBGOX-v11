-- =====================================================
-- FASE 2: Adicionar Foreign Key Constraint em link_lists
-- =====================================================
-- Garante integridade referencial para link_lists
-- =====================================================

-- Limpar registros órfãos existentes (se houver)
DELETE FROM public.link_lists
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Adicionar foreign key constraint
ALTER TABLE public.link_lists
ADD CONSTRAINT link_lists_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT link_lists_user_id_fkey ON public.link_lists IS
'Garante que link_lists sempre pertence a um profile válido. CASCADE deleta listas quando profile é deletado.';