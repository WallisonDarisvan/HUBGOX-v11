
-- =====================================================
-- CORREÇÃO: Garantir acesso contínuo do admin aos perfis vinculados
-- =====================================================
-- Problema: Quando um convite é aceito, o admin pode perder acesso
-- aos dados do perfil vinculado devido à verificação has_admin_mode
-- combinada com a verificação de ownership.
-- 
-- Solução: Simplificar as políticas para que qualquer usuário que
-- criou um convite SEMPRE tenha acesso ao perfil e seus dados,
-- já que apenas usuários com admin mode podem criar convites.
-- =====================================================

-- =====================================================
-- CARDS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view cards of their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can update cards of their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can delete cards of their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can insert cards for their users" ON public.cards;

-- Permitir que criadores de convites SEMPRE vejam os cards
CREATE POLICY "Admins can view cards of their users"
ON public.cards FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update cards of their users"
ON public.cards FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete cards of their users"
ON public.cards FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert cards for their users"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- FORM_CONFIGS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view form configs of their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can update form configs of their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can delete form configs of their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can insert form configs for their users" ON public.form_configs;

CREATE POLICY "Admins can view form configs of their users"
ON public.form_configs FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update form configs of their users"
ON public.form_configs FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete form configs of their users"
ON public.form_configs FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert form configs for their users"
ON public.form_configs FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- LINK_LISTS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view lists of their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can update lists of their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can delete lists of their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can insert lists for their users" ON public.link_lists;

CREATE POLICY "Admins can view lists of their users"
ON public.link_lists FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update lists of their users"
ON public.link_lists FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete lists of their users"
ON public.link_lists FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert lists for their users"
ON public.link_lists FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- PROFILES: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can update profiles of their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles of their users" ON public.profiles;

CREATE POLICY "Admins can update profiles of their users"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (id = auth.uid()) 
  OR 
  (id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (id = auth.uid()) 
  OR 
  (id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete profiles of their users"
ON public.profiles FOR DELETE
TO authenticated
USING (
  id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- CARD_CLICKS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view card clicks of their users" ON public.card_clicks;
DROP POLICY IF EXISTS "Admins can delete card clicks of their users" ON public.card_clicks;

CREATE POLICY "Admins can view card clicks of their users"
ON public.card_clicks FOR SELECT
TO authenticated
USING (
  (card_id IN (
    SELECT c.id FROM cards c WHERE c.user_id = auth.uid()
  ))
  OR
  (card_id IN (
    SELECT c.id 
    FROM cards c
    JOIN user_invitations ui ON (
      c.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete card clicks of their users"
ON public.card_clicks FOR DELETE
TO authenticated
USING (
  (card_id IN (
    SELECT c.id FROM cards c WHERE c.user_id = auth.uid()
  ))
  OR
  (card_id IN (
    SELECT c.id 
    FROM cards c
    JOIN user_invitations ui ON (
      c.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- FORM_SUBMISSIONS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view form submissions of their users" ON public.form_submissions;

CREATE POLICY "Admins can view form submissions of their users"
ON public.form_submissions FOR SELECT
TO authenticated
USING (
  (form_config_id IN (
    SELECT fc.id FROM form_configs fc WHERE fc.user_id = auth.uid()
  ))
  OR
  (form_config_id IN (
    SELECT fc.id
    FROM form_configs fc
    JOIN user_invitations ui ON (
      fc.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- PROFILE_VIEWS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view profile views of their users" ON public.profile_views;
DROP POLICY IF EXISTS "Admins can delete profile views of their users" ON public.profile_views;

CREATE POLICY "Admins can view profile views of their users"
ON public.profile_views FOR SELECT
TO authenticated
USING (
  (profile_id = auth.uid())
  OR
  (profile_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete profile views of their users"
ON public.profile_views FOR DELETE
TO authenticated
USING (
  (profile_id = auth.uid())
  OR
  (profile_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- LIST_ITEMS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage items of their users' lists" ON public.list_items;

CREATE POLICY "Admins can manage items of their users' lists"
ON public.list_items FOR ALL
TO authenticated
USING (
  (list_id IN (
    SELECT ll.id FROM link_lists ll WHERE ll.user_id = auth.uid()
  ))
  OR
  (list_id IN (
    SELECT ll.id
    FROM link_lists ll
    JOIN user_invitations ui ON (
      ll.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (list_id IN (
    SELECT ll.id FROM link_lists ll WHERE ll.user_id = auth.uid()
  ))
  OR
  (list_id IN (
    SELECT ll.id
    FROM link_lists ll
    JOIN user_invitations ui ON (
      ll.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- FORM_FIELDS: Simplificar políticas de admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage form fields of their users" ON public.form_fields;

CREATE POLICY "Admins can manage form fields of their users"
ON public.form_fields FOR ALL
TO authenticated
USING (
  (form_config_id IN (
    SELECT fc.id FROM form_configs fc WHERE fc.user_id = auth.uid()
  ))
  OR
  (form_config_id IN (
    SELECT fc.id
    FROM form_configs fc
    JOIN user_invitations ui ON (
      fc.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (form_config_id IN (
    SELECT fc.id FROM form_configs fc WHERE fc.user_id = auth.uid()
  ))
  OR
  (form_config_id IN (
    SELECT fc.id
    FROM form_configs fc
    JOIN user_invitations ui ON (
      fc.user_id = COALESCE(ui.linked_profile_id, ui.profile_id)
    )
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

DO $$
DECLARE
  admin_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE '%Admins%their users%';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'CORREÇÃO APLICADA COM SUCESSO ✓';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Políticas de admin atualizadas: %', admin_policies;
  RAISE NOTICE 'Admins agora têm acesso permanente aos perfis vinculados';
  RAISE NOTICE '================================================';
END $$;
