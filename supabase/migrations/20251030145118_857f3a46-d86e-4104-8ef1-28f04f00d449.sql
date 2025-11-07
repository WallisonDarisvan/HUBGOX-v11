-- =====================================================
-- MIGRATION: Limpeza e Correção Completa do Sistema de Convites
-- =====================================================
-- Remove estrutura antiga (pending_profiles)
-- Adiciona constraints corretos
-- Atualiza funções SQL
-- Adiciona política RLS de DELETE
-- =====================================================

-- 1. LIMPEZA DA ESTRUTURA ANTIGA
-- Remover constraints obsoletas
ALTER TABLE public.user_invitations 
DROP CONSTRAINT IF EXISTS user_invitations_pending_profile_id_key;

ALTER TABLE public.user_invitations 
DROP CONSTRAINT IF EXISTS user_invitations_pending_profile_id_fkey;

-- Remover coluna obsoleta
ALTER TABLE public.user_invitations 
DROP COLUMN IF EXISTS pending_profile_id;

-- Remover tabela obsoleta
DROP TABLE IF EXISTS public.pending_profiles CASCADE;

-- 2. ADICIONAR CONSTRAINT CORRETO
-- Garantir apenas 1 convite PENDING por profile
-- (permite múltiplos históricos com status accepted/expired)
CREATE UNIQUE INDEX IF NOT EXISTS user_invitations_profile_id_pending_unique 
ON public.user_invitations (profile_id) 
WHERE status = 'pending';

-- Comentário explicativo
COMMENT ON INDEX user_invitations_profile_id_pending_unique IS 
'Garante que cada profile tenha apenas um convite com status pending por vez';

-- 3. ATUALIZAR FUNÇÃO validate_invitation_token
-- Busca direto em profiles (não mais em pending_profiles)
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token uuid)
RETURNS TABLE (
  invitation_id uuid,
  profile_id uuid,
  username text,
  display_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS invitation_id,
    i.profile_id,
    p.username,
    p.display_name,
    i.email
  FROM public.user_invitations i
  JOIN public.profiles p ON p.id = i.profile_id
  WHERE i.invitation_token = token
    AND i.status = 'pending'
    AND i.expires_at > now();
END;
$$;

-- 4. ATUALIZAR FUNÇÃO accept_invitation
-- Cria novo profile com user_id correto e migra dados
CREATE OR REPLACE FUNCTION public.accept_invitation(
  token uuid,
  new_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_invitation_id uuid;
  v_username text;
  v_display_name text;
  v_bio text;
  v_avatar_url text;
  v_cover_url text;
  v_custom_phrase text;
  v_instagram_url text;
  v_linkedin_url text;
  v_youtube_url text;
  v_spotify_url text;
  v_whatsapp_url text;
  v_show_verified_badge boolean;
  v_show_avatar boolean;
  v_footer_text_primary text;
  v_footer_text_secondary text;
  v_temp_username text;
BEGIN
  -- Buscar dados do profile e convite
  SELECT 
    i.profile_id,
    i.id,
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.cover_url,
    p.custom_phrase,
    p.instagram_url,
    p.linkedin_url,
    p.youtube_url,
    p.spotify_url,
    p.whatsapp_url,
    p.show_verified_badge,
    p.show_avatar,
    p.footer_text_primary,
    p.footer_text_secondary
  INTO 
    v_profile_id,
    v_invitation_id,
    v_username,
    v_display_name,
    v_bio,
    v_avatar_url,
    v_cover_url,
    v_custom_phrase,
    v_instagram_url,
    v_linkedin_url,
    v_youtube_url,
    v_spotify_url,
    v_whatsapp_url,
    v_show_verified_badge,
    v_show_avatar,
    v_footer_text_primary,
    v_footer_text_secondary
  FROM public.user_invitations i
  JOIN public.profiles p ON p.id = i.profile_id
  WHERE i.invitation_token = token
    AND i.status = 'pending'
    AND i.expires_at > now();
  
  IF v_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Criar username temporário para evitar conflito de UNIQUE
  v_temp_username := v_username || '_tmp_' || left(new_user_id::text, 8);
  
  -- Criar novo profile com todos os dados do profile pendente
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    bio,
    avatar_url,
    cover_url,
    custom_phrase,
    instagram_url,
    linkedin_url,
    youtube_url,
    spotify_url,
    whatsapp_url,
    show_verified_badge,
    show_avatar,
    footer_text_primary,
    footer_text_secondary,
    is_activated
  ) VALUES (
    new_user_id,
    v_temp_username,
    v_display_name,
    v_bio,
    v_avatar_url,
    v_cover_url,
    v_custom_phrase,
    v_instagram_url,
    v_linkedin_url,
    v_youtube_url,
    v_spotify_url,
    v_whatsapp_url,
    v_show_verified_badge,
    v_show_avatar,
    v_footer_text_primary,
    v_footer_text_secondary,
    true
  );
  
  -- MIGRAR dados relacionados para o novo profile
  UPDATE public.cards
  SET user_id = new_user_id
  WHERE user_id = v_profile_id;
  
  UPDATE public.form_configs
  SET user_id = new_user_id
  WHERE user_id = v_profile_id;

  UPDATE public.profile_views
  SET profile_id = new_user_id
  WHERE profile_id = v_profile_id;
  
  -- Marcar convite como aceito
  UPDATE public.user_invitations
  SET status = 'accepted',
      accepted_at = now(),
      linked_profile_id = new_user_id,
      profile_id = new_user_id
  WHERE id = v_invitation_id;
  
  -- Deletar profile antigo (pendente)
  DELETE FROM public.profiles WHERE id = v_profile_id;
  
  -- Restaurar username original (agora não há conflito)
  UPDATE public.profiles
  SET username = v_username
  WHERE id = new_user_id;
  
  RETURN true;
END;
$$;

-- 5. ADICIONAR POLÍTICA RLS DE DELETE
-- Permitir que admins deletem convites
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.user_invitations;

CREATE POLICY "Admins can delete invitations"
ON public.user_invitations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. ADICIONAR COMENTÁRIOS EXPLICATIVOS
COMMENT ON TABLE public.user_invitations IS 
'Gerencia convites de usuários - suporta histórico completo (pending, accepted, expired)';

COMMENT ON COLUMN public.user_invitations.profile_id IS 
'Referência ao profile em profiles table - usado para vincular convites a perfis pendentes ou ativos';

COMMENT ON COLUMN public.user_invitations.linked_profile_id IS 
'ID do profile após aceitação do convite (quando status = accepted) - coincide com auth.users.id';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ Estrutura limpa sem pending_profiles
-- ✅ Constraint UNIQUE parcial (1 convite pending por profile)
-- ✅ Funções SQL atualizadas para usar profiles diretamente
-- ✅ RLS completo (CREATE, READ, UPDATE, DELETE para admins)
-- ✅ Fluxo de renovação de convites funcionando corretamente
-- =====================================================