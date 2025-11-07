-- =====================================================
-- FIX: Sistema de Convites Completo
-- =====================================================
-- Corrige todos os bugs identificados:
-- 1. Bug de migração (user_id = user_id)
-- 2. Migração incompleta (faltavam link_lists e profile_views)
-- 3. Preserva profile_id para rastreamento do criador
-- 4. Adiciona proteções contra órfãos
-- 5. Adiciona expiração automática
-- =====================================================

-- 1. Função para verificar órfãos antes de deletar
CREATE OR REPLACE FUNCTION public.check_profile_orphans(p_profile_id UUID)
RETURNS TABLE (
    has_cards BOOLEAN,
    has_forms BOOLEAN,
    has_lists BOOLEAN,
    has_views BOOLEAN,
    total_items INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM cards WHERE user_id = p_profile_id) as has_cards,
        EXISTS(SELECT 1 FROM form_configs WHERE user_id = p_profile_id) as has_forms,
        EXISTS(SELECT 1 FROM link_lists WHERE user_id = p_profile_id) as has_lists,
        EXISTS(SELECT 1 FROM profile_views WHERE profile_id = p_profile_id) as has_views,
        (
            (SELECT COUNT(*) FROM cards WHERE user_id = p_profile_id)::INTEGER +
            (SELECT COUNT(*) FROM form_configs WHERE user_id = p_profile_id)::INTEGER +
            (SELECT COUNT(*) FROM link_lists WHERE user_id = p_profile_id)::INTEGER +
            (SELECT COUNT(*) FROM profile_views WHERE profile_id = p_profile_id)::INTEGER
        ) as total_items;
END;
$$;

-- 2. Função de expiração automática de convites
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_invitations
    SET status = 'expired'
    WHERE status = 'pending'
        AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RAISE NOTICE 'Expirados % convites', expired_count;
    
    RETURN expired_count;
END;
$$;

-- 3. CORRIGIR a função accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
    token UUID,
    user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation_id UUID;
    v_profile_id UUID;
    v_username TEXT;
    v_display_name TEXT;
    v_bio TEXT;
    v_avatar_url TEXT;
    v_cover_image_url TEXT;
    v_cover_video_url TEXT;
    v_cover_type TEXT;
    v_theme TEXT;
    v_email TEXT;
    v_custom_phrase TEXT;
    v_instagram_url TEXT;
    v_linkedin_url TEXT;
    v_youtube_url TEXT;
    v_spotify_url TEXT;
    v_whatsapp_url TEXT;
    v_show_verified_badge BOOLEAN;
    v_show_avatar BOOLEAN;
    v_footer_text_primary TEXT;
    v_footer_text_secondary TEXT;
    v_cards_migrated INTEGER;
    v_forms_migrated INTEGER;
    v_lists_migrated INTEGER;
    v_views_migrated INTEGER;
    v_profile_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'accept_invitation: Iniciando para token=% user_id=%', token, user_id;
    
    -- Verificar se user_id já possui profile
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) INTO v_profile_exists;
    
    -- Buscar dados do convite e profile pendente
    SELECT 
        i.id,
        i.profile_id,
        p.username,
        p.display_name,
        p.bio,
        p.avatar_url,
        p.cover_image_url,
        p.cover_video_url,
        p.cover_type,
        p.theme,
        i.email,
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
        v_invitation_id,
        v_profile_id,
        v_username,
        v_display_name,
        v_bio,
        v_avatar_url,
        v_cover_image_url,
        v_cover_video_url,
        v_cover_type,
        v_theme,
        v_email,
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
        AND i.expires_at > NOW();
    
    -- Validar se encontrou o convite
    IF v_profile_id IS NULL THEN
        RAISE NOTICE 'accept_invitation: Convite inválido ou expirado para token=%', token;
        RETURN false;
    END IF;
    
    RAISE NOTICE 'accept_invitation: Convite válido encontrado. profile_id=% username=%', v_profile_id, v_username;
    
    -- Se profile já existe (criado pelo trigger), fazer UPDATE ao invés de INSERT
    IF v_profile_exists THEN
        RAISE NOTICE 'accept_invitation: Profile já existe para user_id=%, atualizando dados', user_id;
        
        UPDATE public.profiles
        SET 
            username = v_username,
            display_name = v_display_name,
            bio = v_bio,
            avatar_url = v_avatar_url,
            cover_image_url = v_cover_image_url,
            cover_video_url = v_cover_video_url,
            cover_type = v_cover_type,
            theme = v_theme,
            email = v_email,
            custom_phrase = v_custom_phrase,
            instagram_url = v_instagram_url,
            linkedin_url = v_linkedin_url,
            youtube_url = v_youtube_url,
            spotify_url = v_spotify_url,
            whatsapp_url = v_whatsapp_url,
            show_verified_badge = v_show_verified_badge,
            show_avatar = v_show_avatar,
            footer_text_primary = v_footer_text_primary,
            footer_text_secondary = v_footer_text_secondary,
            is_activated = true,
            updated_at = NOW()
        WHERE id = user_id;
    ELSE
        -- Criar novo profile com o user_id correto
        RAISE NOTICE 'accept_invitation: Criando novo profile para user_id=%', user_id;
        
        INSERT INTO public.profiles (
            id, 
            username, 
            display_name, 
            bio,
            avatar_url,
            cover_image_url,
            cover_video_url,
            cover_type,
            theme,
            email,
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
            v_cover_image_url,
            v_cover_video_url,
            v_cover_type,
            v_theme,
            v_email,
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
    END IF;
    
    RAISE NOTICE 'accept_invitation: Profile configurado com sucesso para user_id=%', user_id;
    
    -- MIGRAR CARDS do profile temporário para o novo profile (CORRIGIDO!)
    UPDATE public.cards
    SET user_id = accept_invitation.user_id  -- ✅ Usar o parâmetro da função!
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_cards_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % cards migrados', v_cards_migrated;
    
    -- MIGRAR FORM_CONFIGS do profile temporário para o novo profile (CORRIGIDO!)
    UPDATE public.form_configs
    SET user_id = accept_invitation.user_id  -- ✅ Usar o parâmetro da função!
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_forms_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % form_configs migrados', v_forms_migrated;
    
    -- MIGRAR LINK_LISTS do profile temporário para o novo profile (NOVO!)
    UPDATE public.link_lists
    SET user_id = accept_invitation.user_id  -- ✅ Usar o parâmetro da função!
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_lists_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % link_lists migrados', v_lists_migrated;
    
    -- MIGRAR PROFILE_VIEWS do profile temporário para o novo profile (NOVO!)
    UPDATE public.profile_views
    SET profile_id = accept_invitation.user_id  -- ✅ Usar o parâmetro da função!
    WHERE profile_id = v_profile_id;
    
    GET DIAGNOSTICS v_views_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % profile_views migrados', v_views_migrated;
    
    -- Marcar convite como aceito (NÃO alterar profile_id, apenas preencher linked_profile_id!)
    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = accept_invitation.user_id  -- ✅ Apenas preencher linked_profile_id
        -- NÃO alterar profile_id para manter rastreamento do criador!
    WHERE id = v_invitation_id;
    
    RAISE NOTICE 'accept_invitation: Convite marcado como aceito';
    
    -- Deletar profile temporário (pendente) DEPOIS de migrar tudo
    -- Só deletar se for diferente do user_id (evitar deletar o profile que acabamos de criar/atualizar)
    IF v_profile_id != accept_invitation.user_id THEN
        DELETE FROM public.profiles
        WHERE id = v_profile_id;
        RAISE NOTICE 'accept_invitation: Profile temporário deletado';
    END IF;
    
    RAISE NOTICE 'accept_invitation: Processo concluído com sucesso!';
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'accept_invitation: ERRO - %', SQLERRM;
        RAISE;
END;
$$;

-- Comentários sobre as correções:
COMMENT ON FUNCTION public.accept_invitation IS 'Aceita convite e migra TODOS os dados (cards, forms, lists, views) do profile temporário para o profile definitivo. Preserva profile_id no convite para rastreamento do criador.';
COMMENT ON FUNCTION public.check_profile_orphans IS 'Verifica se um profile tem dados órfãos antes de deletar.';
COMMENT ON FUNCTION public.expire_old_invitations IS 'Expira convites pendentes com mais de 7 dias.';