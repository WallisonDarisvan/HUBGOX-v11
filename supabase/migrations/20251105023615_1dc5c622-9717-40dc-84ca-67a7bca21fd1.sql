-- =====================================================
-- FIX: Preservar created_by_admin_id durante aceitação de convite
-- =====================================================
-- Problema: A função accept_invitation não estava copiando
-- o invited_by_admin_id para o campo created_by_admin_id,
-- fazendo os perfis aceitos desaparecerem do Gerenciador.
-- Solução: Copiar invited_by_admin_id → created_by_admin_id
-- =====================================================

-- Dropar função existente
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

-- Recriar função com correção
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
    v_invitation_id UUID;
    v_profile_id UUID;
    v_invited_by_admin_id UUID;  -- ✅ ADICIONAR: capturar admin_id
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
    v_cards_migrated INTEGER := 0;
    v_forms_migrated INTEGER := 0;
    v_lists_migrated INTEGER := 0;
    v_views_migrated INTEGER := 0;
    v_profile_exists BOOLEAN;
    v_conflict_profile_id UUID;
    v_temp_username TEXT;
    v_final_username TEXT;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'accept_invitation: Iniciando';
    RAISE NOTICE 'Token: %', token;
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE '==========================================';

    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) INTO v_profile_exists;
    RAISE NOTICE 'Profile já existe para user_id=%: %', new_user_id, v_profile_exists;

    -- ✅ CORRIGIDO: Capturar invited_by_admin_id
    SELECT 
        i.id,
        i.profile_id,
        i.invited_by_admin_id,  -- ✅ Capturar
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
        v_invited_by_admin_id,  -- ✅ Armazenar
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

    IF v_profile_id IS NULL THEN
        RAISE NOTICE 'accept_invitation: Convite inválido ou expirado';
        RETURN false;
    END IF;

    RAISE NOTICE 'Convite válido encontrado:';
    RAISE NOTICE '  - Invitation ID: %', v_invitation_id;
    RAISE NOTICE '  - Profile ID temporário: %', v_profile_id;
    RAISE NOTICE '  - Username original: %', v_username;
    RAISE NOTICE '  - Admin ID: %', v_invited_by_admin_id;  -- ✅ Log

    SELECT COUNT(*) INTO v_cards_migrated FROM public.cards WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_forms_migrated FROM public.form_configs WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_lists_migrated FROM public.link_lists WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_views_migrated FROM public.profile_views WHERE profile_id = v_profile_id;
    
    RAISE NOTICE 'Dados a migrar:';
    RAISE NOTICE '  - Cards: %', v_cards_migrated;
    RAISE NOTICE '  - Formulários: %', v_forms_migrated;
    RAISE NOTICE '  - Listas: %', v_lists_migrated;
    RAISE NOTICE '  - Visualizações: %', v_views_migrated;

    v_final_username := v_username;
    SELECT id INTO v_conflict_profile_id
    FROM public.profiles
    WHERE username = v_final_username
    AND id <> new_user_id
    LIMIT 1;

    IF v_conflict_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Conflito de username detectado com profile %', v_conflict_profile_id;
        
        v_temp_username := v_username || '__pending__' || substr(token::text, 1, 8);
        UPDATE public.profiles
        SET username = v_temp_username,
            updated_at = NOW()
        WHERE id = v_conflict_profile_id;
        
        RAISE NOTICE 'Profile % renomeado para %', v_conflict_profile_id, v_temp_username;
    END IF;

    IF v_profile_exists THEN
        RAISE NOTICE 'Atualizando profile existente %', new_user_id;
        
        -- ✅ CORRIGIDO: Incluir created_by_admin_id no UPDATE
        UPDATE public.profiles
        SET 
            username = v_final_username,
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
            created_by_admin_id = v_invited_by_admin_id,  -- ✅ ADICIONAR
            updated_at = NOW()
        WHERE id = new_user_id;
    ELSE
        RAISE NOTICE 'Criando novo profile %', new_user_id;
        
        -- ✅ CORRIGIDO: Incluir created_by_admin_id no INSERT
        INSERT INTO public.profiles (
            id, username, display_name, bio, avatar_url, cover_image_url,
            cover_video_url, cover_type, theme, email, custom_phrase,
            instagram_url, linkedin_url, youtube_url, spotify_url, whatsapp_url,
            show_verified_badge, show_avatar, footer_text_primary, footer_text_secondary,
            is_activated, created_by_admin_id  -- ✅ ADICIONAR
        ) VALUES (
            new_user_id, v_final_username, v_display_name, v_bio, v_avatar_url,
            v_cover_image_url, v_cover_video_url, v_cover_type, v_theme, v_email,
            v_custom_phrase, v_instagram_url, v_linkedin_url, v_youtube_url,
            v_spotify_url, v_whatsapp_url, v_show_verified_badge, v_show_avatar,
            v_footer_text_primary, v_footer_text_secondary, true, v_invited_by_admin_id  -- ✅ ADICIONAR
        );
    END IF;

    RAISE NOTICE 'Profile final criado/atualizado. Iniciando migração de dados...';

    UPDATE public.cards SET user_id = new_user_id WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Cards migrados: %', v_cards_migrated;

    UPDATE public.form_configs SET user_id = new_user_id WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Formulários migrados: %', v_forms_migrated;

    UPDATE public.link_lists SET user_id = new_user_id WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Listas migradas: %', v_lists_migrated;

    UPDATE public.profile_views SET profile_id = new_user_id WHERE profile_id = v_profile_id;
    RAISE NOTICE '✓ Visualizações migradas: %', v_views_migrated;

    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = new_user_id
    WHERE id = v_invitation_id;
    
    RAISE NOTICE '✓ Convite atualizado: status=accepted, linked_profile_id=%', new_user_id;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_invitations
        WHERE id = v_invitation_id
        AND linked_profile_id = new_user_id
        AND invited_by_admin_id = v_invited_by_admin_id
        AND status = 'accepted'
    ) THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Vínculo admin-usuário não foi criado!';
    END IF;

    RAISE NOTICE '✓ Vínculo admin-usuário verificado: admin=% → user=%', v_invited_by_admin_id, new_user_id;

    IF v_profile_id <> new_user_id THEN
        DELETE FROM public.profiles WHERE id = v_profile_id;
        RAISE NOTICE '✓ Profile temporário % removido', v_profile_id;
    END IF;

    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO';
    RAISE NOTICE 'User ID final: %', new_user_id;
    RAISE NOTICE 'Username final: %', v_final_username;
    RAISE NOTICE 'Admin ID: %', v_invited_by_admin_id;
    RAISE NOTICE 'created_by_admin_id: %', v_invited_by_admin_id;  -- ✅ Confirmação
    RAISE NOTICE 'Vínculo mantido via invitation_id: %', v_invitation_id;
    RAISE NOTICE '==========================================';
    
    RETURN true;

EXCEPTION 
    WHEN unique_violation THEN
        RAISE NOTICE '==========================================';
        RAISE NOTICE '❌ ERRO: Violação de constraint UNIQUE';
        RAISE NOTICE 'Username tentado: %', v_final_username;
        RAISE NOTICE 'Token: %', token;
        RAISE NOTICE '==========================================';
        RETURN false;
    WHEN OTHERS THEN
        RAISE NOTICE '==========================================';
        RAISE NOTICE '❌ ERRO INESPERADO durante migração';
        RAISE NOTICE 'Erro: %', SQLERRM;
        RAISE NOTICE 'Token: %', token;
        RAISE NOTICE 'User ID: %', new_user_id;
        RAISE NOTICE 'Profile temporário: %', v_profile_id;
        RAISE NOTICE '==========================================';
        RAISE;
END;
$$;