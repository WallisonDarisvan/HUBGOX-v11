-- =====================================================
-- FIX: Corrigir ambiguidade de user_id em accept_invitation
-- =====================================================

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

-- Recriar com parâmetro renomeado
CREATE FUNCTION public.accept_invitation(
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
  
  -- Evitar conflito de UNIQUE em username
  v_temp_username := v_username || '_tmp_' || left(new_user_id::text, 8);
  
  -- Criar novo profile com username temporário
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

  -- Migrar visualizações de perfil também
  UPDATE public.profile_views
  SET profile_id = new_user_id
  WHERE profile_id = v_profile_id;
  
  -- Marcar convite como aceito e vincular
  UPDATE public.user_invitations
  SET status = 'accepted',
      accepted_at = now(),
      linked_profile_id = new_user_id,
      profile_id = new_user_id
  WHERE id = v_invitation_id;
  
  -- Deletar o profile antigo
  DELETE FROM public.profiles WHERE id = v_profile_id;
  
  -- Restaurar o username original agora que não há conflito
  UPDATE public.profiles
  SET username = v_username
  WHERE id = new_user_id;
  
  RETURN true;
END;
$$;