-- =====================================================
-- CORREÇÃO: RLS POLICIES PARA ADMINS EDITAREM OUTROS USUÁRIOS
-- =====================================================
-- Problema: Admins não conseguiam inserir/atualizar dados para outros usuários
-- porque as policies WITH CHECK usavam auth.uid() em vez de permitir qualquer user_id para admins
-- Solução: Usar has_role(auth.uid(), 'admin') no WITH CHECK para permitir qualquer user_id

-- =========================
-- CARDS: Corrigir policies
-- =========================

DROP POLICY IF EXISTS "Admins can insert cards for any user" ON public.cards;
CREATE POLICY "Admins can insert cards for any user"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all cards" ON public.cards;
CREATE POLICY "Admins can update all cards"
ON public.cards FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =========================
-- PROFILES: Corrigir policy
-- =========================

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin') OR id = auth.uid());

-- =========================
-- FORM_CONFIGS: Corrigir policies
-- =========================

DROP POLICY IF EXISTS "Admins can insert form configs for any user" ON public.form_configs;
CREATE POLICY "Admins can insert form configs for any user"
ON public.form_configs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all form configs" ON public.form_configs;
CREATE POLICY "Admins can update all form configs"
ON public.form_configs FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));