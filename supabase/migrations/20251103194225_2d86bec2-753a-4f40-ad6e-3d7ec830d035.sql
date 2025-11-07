-- =====================================================
-- MIGRAÇÃO: Substituir has_role() por has_admin_mode()
-- =====================================================
-- Descrição: Substituir verificação baseada em user_roles
--            por verificação baseada em planos (allow_admin_mode)
-- =====================================================

-- =====================================================
-- ETAPA 1: Criar função has_admin_mode()
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_admin_mode(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_plans up
    JOIN public.plan_definitions pd ON pd.plan_id = up.plan_id
    WHERE up.user_id = _user_id
      AND pd.allow_admin_mode = true
  )
$$;

-- =====================================================
-- ETAPA 2: Atualizar políticas RLS - PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view their invited profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles of their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles of their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles for their users" ON public.profiles;

CREATE POLICY "Admins can view their invited profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (id = auth.uid()) 
  OR 
  (id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update profiles of their users"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete profiles of their users"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can create profiles for their users"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_mode(auth.uid()));

-- =====================================================
-- ETAPA 3: Atualizar políticas RLS - CARDS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view cards of their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can insert cards for their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can update cards of their users" ON public.cards;
DROP POLICY IF EXISTS "Admins can delete cards of their users" ON public.cards;

CREATE POLICY "Admins can view cards of their users"
ON public.cards
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert cards for their users"
ON public.cards
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update cards of their users"
ON public.cards
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete cards of their users"
ON public.cards
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- ETAPA 4: Atualizar políticas RLS - FORM_CONFIGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view form configs of their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can insert form configs for their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can update form configs of their users" ON public.form_configs;
DROP POLICY IF EXISTS "Admins can delete form configs of their users" ON public.form_configs;

CREATE POLICY "Admins can view form configs of their users"
ON public.form_configs
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert form configs for their users"
ON public.form_configs
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update form configs of their users"
ON public.form_configs
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete form configs of their users"
ON public.form_configs
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- ETAPA 5: Atualizar políticas RLS - FORM_FIELDS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage form fields of their users" ON public.form_fields;

CREATE POLICY "Admins can manage form fields of their users"
ON public.form_fields
FOR ALL
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND form_config_id IN (
    SELECT fc.id
    FROM form_configs fc
    JOIN user_invitations ui ON (ui.profile_id = fc.user_id OR ui.linked_profile_id = fc.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- ETAPA 6: Atualizar políticas RLS - FORM_SUBMISSIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view form submissions of their users" ON public.form_submissions;

CREATE POLICY "Admins can view form submissions of their users"
ON public.form_submissions
FOR SELECT
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND form_config_id IN (
    SELECT fc.id
    FROM form_configs fc
    JOIN user_invitations ui ON (ui.profile_id = fc.user_id OR ui.linked_profile_id = fc.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- ETAPA 7: Atualizar políticas RLS - LINK_LISTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view lists of their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can insert lists for their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can update lists of their users" ON public.link_lists;
DROP POLICY IF EXISTS "Admins can delete lists of their users" ON public.link_lists;

CREATE POLICY "Admins can view lists of their users"
ON public.link_lists
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can insert lists for their users"
ON public.link_lists
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can update lists of their users"
ON public.link_lists
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
)
WITH CHECK (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

CREATE POLICY "Admins can delete lists of their users"
ON public.link_lists
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) 
  OR 
  (public.has_admin_mode(auth.uid()) AND user_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  ))
);

-- =====================================================
-- ETAPA 8: Atualizar políticas RLS - LIST_ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage items of their users' lists" ON public.list_items;

CREATE POLICY "Admins can manage items of their users' lists"
ON public.list_items
FOR ALL
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND list_id IN (
    SELECT ll.id
    FROM link_lists ll
    JOIN user_invitations ui ON (ui.profile_id = ll.user_id OR ui.linked_profile_id = ll.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
)
WITH CHECK (
  public.has_admin_mode(auth.uid()) 
  AND list_id IN (
    SELECT ll.id
    FROM link_lists ll
    JOIN user_invitations ui ON (ui.profile_id = ll.user_id OR ui.linked_profile_id = ll.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- ETAPA 9: Atualizar políticas RLS - CARD_CLICKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view card clicks of their users" ON public.card_clicks;
DROP POLICY IF EXISTS "Admins can delete card clicks of their users" ON public.card_clicks;

CREATE POLICY "Admins can view card clicks of their users"
ON public.card_clicks
FOR SELECT
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND card_id IN (
    SELECT c.id
    FROM cards c
    JOIN user_invitations ui ON (ui.profile_id = c.user_id OR ui.linked_profile_id = c.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete card clicks of their users"
ON public.card_clicks
FOR DELETE
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND card_id IN (
    SELECT c.id
    FROM cards c
    JOIN user_invitations ui ON (ui.profile_id = c.user_id OR ui.linked_profile_id = c.user_id)
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- ETAPA 10: Atualizar políticas RLS - PROFILE_VIEWS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view profile views of their users" ON public.profile_views;
DROP POLICY IF EXISTS "Admins can delete profile views of their users" ON public.profile_views;

CREATE POLICY "Admins can view profile views of their users"
ON public.profile_views
FOR SELECT
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND profile_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete profile views of their users"
ON public.profile_views
FOR DELETE
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND profile_id IN (
    SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
    FROM user_invitations ui
    WHERE ui.invited_by_admin_id = auth.uid()
  )
);

-- =====================================================
-- ETAPA 11: Atualizar políticas RLS - USER_INVITATIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can view their own invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.user_invitations;

CREATE POLICY "Admins can create invitations"
ON public.user_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_mode(auth.uid()));

CREATE POLICY "Admins can view their own invitations"
ON public.user_invitations
FOR SELECT
TO authenticated
USING (
  public.has_admin_mode(auth.uid()) 
  AND invited_by_admin_id = auth.uid()
);

CREATE POLICY "Admins can update invitations"
ON public.user_invitations
FOR UPDATE
TO authenticated
USING (public.has_admin_mode(auth.uid()));

-- =====================================================
-- ETAPA 12: Atualizar função admin_delete_user()
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificar se o usuário atual tem modo admin habilitado no plano
    IF NOT public.has_admin_mode(auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado: apenas usuários com modo admin podem remover usuários';
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

-- =====================================================
-- ETAPA 13: Desabilitar trigger de auto-role (opcional)
-- =====================================================

-- Desabilita o trigger que adiciona role 'user' automaticamente
-- Mantém a tabela user_roles caso seja usada em outro lugar
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================