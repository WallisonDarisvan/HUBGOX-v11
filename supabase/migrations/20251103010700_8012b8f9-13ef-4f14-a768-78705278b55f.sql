-- =====================================================
-- CORREÇÃO: Políticas RLS Recursivas na tabela user_roles
-- =====================================================
-- Remove a política recursiva problemática e cria uma nova
-- usando a função has_role() com SECURITY DEFINER
-- =====================================================

-- Remover política recursiva problemática
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Criar nova política usando a função has_role (que bypassa RLS)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- A política "Users can view their own roles" já está correta e será mantida

-- Verificação: Confirmar que as políticas foram aplicadas
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS corrigidas com sucesso!';
    RAISE NOTICE 'A função has_role() com SECURITY DEFINER quebra o ciclo de recursão.';
END $$;