-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE CONVITES
-- =====================================================
-- Fase 1: Corrigir função accept_invitation
-- Fase 3: Ajustar RLS policies
-- Fase 4: Criar trigger handle_new_user
-- =====================================================

-- FASE 1: Corrigir a função accept_invitation
-- Problema: Tentava alterar PRIMARY KEY, agora cria novo profile e migra dados
CREATE OR REPLACE FUNCTION public.accept_invitation(
  token uuid,
  user_id uuid
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
  
  -- Criar novo profile com o user_id correto
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
    user_id,
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
    v_footer_text_secondary,
    true
  );
  
  -- MIGRAR todos os dados relacionados para o novo profile
  
  -- 1. Migrar cards
  UPDATE public.cards
  SET user_id = accept_invitation.user_id
  WHERE user_id = v_profile_id;
  
  -- 2. Migrar form_configs
  UPDATE public.form_configs
  SET user_id = accept_invitation.user_id
  WHERE user_id = v_profile_id;
  
  -- Marcar convite como aceito
  UPDATE public.user_invitations
  SET status = 'accepted',
      accepted_at = now(),
      linked_profile_id = accept_invitation.user_id,
      profile_id = accept_invitation.user_id
  WHERE id = v_invitation_id;
  
  -- Deletar o profile temporário DEPOIS de migrar tudo
  DELETE FROM public.profiles WHERE id = v_profile_id;
  
  RETURN true;
END;
$$;

-- FASE 3: Ajustar RLS Policies para permitir visualização de todos os perfis
DROP POLICY IF EXISTS "Public can view activated profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- FASE 4: Criar trigger para handle_new_user (cadastros diretos)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se já existe um profile para este usuário (ex: por convite)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, display_name, is_activated)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentário final
COMMENT ON FUNCTION public.accept_invitation IS 'Migra dados de profile temporário para profile real ao aceitar convite';
COMMENT ON FUNCTION public.handle_new_user IS 'Cria profile automaticamente quando usuário se cadastra diretamente';