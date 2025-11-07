-- =====================================================
-- MULTI-TENANCY: Restringir Admins aos Seus Usuários
-- =====================================================
-- Este script implementa isolamento completo entre admins.
-- Cada admin só pode gerenciar usuários que ele convidou.
-- =====================================================

-- =====================================================
-- PARTE 1: REMOVER POLÍTICAS "ALL" (Acesso Total)
-- =====================================================

-- ===== CARDS =====
DROP POLICY IF EXISTS "Admins can delete all cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can update all cards" ON public.cards;
DROP POLICY IF EXISTS "Admins can insert cards for any user" ON public.cards;

-- ===== FORM_CONFIGS =====
DROP POLICY IF EXISTS "Admins can delete all form configs" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can update all form configs" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can insert form configs for any user" ON public.form_configs;

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- ===== FORM_FIELDS =====
DROP POLICY IF EXISTS "Admins can view all form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Admins can insert form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Admins can update all form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Admins can delete all form fields" ON public.form_fields;

RAISE NOTICE 'Políticas "all" removidas ✓';

-- =====================================================
-- PARTE 2: CORRIGIR/CRIAR POLÍTICAS "THEIR USERS"
-- =====================================================

-- ===== FORM_FIELDS =====
-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins can manage their own form fields" ON public.form_fields;
DROP POLICY IF EXISTS "Users can manage their own form fields" ON public.form_fields;

-- Criar política completa para admins gerenciarem form_fields de seus usuários
CREATE POLICY "Admins can manage form fields of their users"
ON public.form_fields FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  AND form_config_id IN (
    SELECT fc.id 
    FROM form_configs fc
    JOIN user_invitations ui ON (ui.profile_id = fc.user_id OR ui.linked_profile_id = fc.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- ===== FORM_SUBMISSIONS =====
-- Já existe "Admins can view form submissions of their users" - verificar se está correta
DROP POLICY IF EXISTS "Admins can view form submissions of their users" ON public.form_submissions;

CREATE POLICY "Admins can view form submissions of their users"
ON public.form_submissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  AND form_config_id IN (
    SELECT fc.id 
    FROM form_configs fc
    JOIN user_invitations ui ON (ui.profile_id = fc.user_id OR ui.linked_profile_id = fc.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- ===== CARD_CLICKS =====
-- Já existe "Admins can view card clicks of their users" - verificar se está correta
DROP POLICY IF EXISTS "Admins can view card clicks of their users" ON public.card_clicks;

CREATE POLICY "Admins can view card clicks of their users"
ON public.card_clicks FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  AND card_id IN (
    SELECT c.id 
    FROM cards c
    JOIN user_invitations ui ON (ui.profile_id = c.user_id OR ui.linked_profile_id = c.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- ===== PROFILE_VIEWS =====
-- Já existe "Admins can view profile views of their users" - verificar se está correta
DROP POLICY IF EXISTS "Admins can view profile views of their users" ON public.profile_views;

CREATE POLICY "Admins can view profile views of their users"
ON public.profile_views FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  AND profile_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- ===== USER_INVITATIONS =====
-- Corrigir política para garantir que admin só vê seus convites
DROP POLICY IF EXISTS "Admins can view their own invitations" ON public.user_invitations;

CREATE POLICY "Admins can view their own invitations"
ON public.user_invitations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') 
  AND invited_by_admin_id = auth.uid()
);

RAISE NOTICE 'Políticas "their users" criadas/corrigidas ✓';

-- =====================================================
-- PARTE 3: ATUALIZAR FUNÇÃO admin_delete_user
-- =====================================================
-- Garantir que admin só pode deletar usuários que ele convidou

CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Acesso negado: apenas admins podem remover usuários';
    END IF;
    
    -- Verificar se o usuário a ser deletado pertence a este admin
    IF NOT EXISTS (
        SELECT 1 
        FROM user_invitations 
        WHERE invited_by_admin_id = auth.uid() 
        AND (profile_id = user_id OR linked_profile_id = user_id)
    ) THEN
        RAISE EXCEPTION 'Acesso negado: você só pode remover usuários que você convidou';
    END IF;
    
    -- Remover o usuário do auth.users (cascade irá remover profile e dados relacionados)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

RAISE NOTICE 'Função admin_delete_user atualizada com validação de ownership ✓';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    all_policies INTEGER;
    their_users_policies INTEGER;
BEGIN
    -- Contar políticas "all" restantes (deveria ser 0)
    SELECT COUNT(*) INTO all_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%all%'
    AND policyname LIKE '%Admin%';
    
    -- Contar políticas "their users" (deveria ser > 0)
    SELECT COUNT(*) INTO their_users_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%their users%';
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'MULTI-TENANCY CONFIGURADO ✓';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Políticas "all" restantes: % (deveria ser 0)', all_policies;
    RAISE NOTICE 'Políticas "their users": % (deveria ser > 10)', their_users_policies;
    RAISE NOTICE '================================================';
    
    IF all_policies > 0 THEN
        RAISE WARNING 'Atenção: Ainda existem políticas "all" que dão acesso total!';
    END IF;
    
    IF their_users_policies < 10 THEN
        RAISE WARNING 'Atenção: Menos políticas "their users" do que esperado!';
    END IF;
    
    RAISE NOTICE 'PRÓXIMO PASSO: Configurar Storage RLS via Dashboard';
    RAISE NOTICE 'Consulte: storage-admin-multi-tenancy-policies.md';
    RAISE NOTICE '================================================';
END $$;
