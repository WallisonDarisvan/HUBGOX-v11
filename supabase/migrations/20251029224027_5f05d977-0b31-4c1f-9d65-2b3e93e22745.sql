-- Políticas RLS para Admins visualizarem e editarem todos os dados

-- CARDS: Admins podem ver, inserir, atualizar e deletar todos os cards
CREATE POLICY "Admins can view all cards"
ON public.cards FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert cards for any user"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all cards"
ON public.cards FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all cards"
ON public.cards FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES: Admins podem ver e atualizar todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- CARD_CLICKS: Admins podem ver todos os clicks
CREATE POLICY "Admins can view all card clicks"
ON public.card_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- PROFILE_VIEWS: Admins podem ver todas as visualizações
CREATE POLICY "Admins can view all profile views"
ON public.profile_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FORM_CONFIGS: Admins podem ver, inserir, atualizar e deletar todas as configurações
CREATE POLICY "Admins can view all form configs"
ON public.form_configs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert form configs for any user"
ON public.form_configs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all form configs"
ON public.form_configs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all form configs"
ON public.form_configs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- FORM_SUBMISSIONS: Admins podem ver todas as submissões
CREATE POLICY "Admins can view all form submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));