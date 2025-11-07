-- =====================================================
-- FASES 1, 3, 4: Corrigir Função accept_invitation
-- =====================================================
-- Corrige accept_invitation para:
-- 1. Migrar link_lists
-- 2. Prevenir conflitos de username
-- 3. Adicionar logging detalhado
-- 4. Adicionar exception handling
-- 5. Garantir vínculo com criador
-- =====================================================

-- Dropar função antiga para permitir mudança de nome de parâmetro
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

-- Recriar função com correções
CREATE OR REPLACE FUNCTION public.accept_invitation(token uuid, new_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
    v_cards_migrated INTEGER := 0;
    v_forms_migrated INTEGER := 0;
    v_lists_migrated INTEGER := 0;
    v_views_migrated INTEGER := 0;
    v_profile_exists BOOLEAN;
    v_conflict_profile_id UUID;
    v_temp_username TEXT;
    v_final_username TEXT;
    v_username_counter INTEGER := 0;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'accept_invitation: Iniciando';
    RAISE NOTICE 'Token: %', token;
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE '==========================================';

    -- Check if a profile already exists for this auth user
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = new_user_id) INTO v_profile_exists;
    RAISE NOTICE 'Profile já existe para user_id=%: %', new_user_id, v_profile_exists;

    -- Fetch invitation and pending profile data
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

    IF v_profile_id IS NULL THEN
        RAISE NOTICE 'accept_invitation: Convite inválido ou expirado';
        RETURN false;
    END IF;

    RAISE NOTICE 'Convite válido encontrado:';
    RAISE NOTICE '  - Invitation ID: %', v_invitation_id;
    RAISE NOTICE '  - Profile ID temporário: %', v_profile_id;
    RAISE NOTICE '  - Username original: %', v_username;

    -- Preparar contadores para logging
    SELECT COUNT(*) INTO v_cards_migrated FROM public.cards WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_forms_migrated FROM public.form_configs WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_lists_migrated FROM public.link_lists WHERE user_id = v_profile_id;
    SELECT COUNT(*) INTO v_views_migrated FROM public.profile_views WHERE profile_id = v_profile_id;
    
    RAISE NOTICE 'Dados a migrar:';
    RAISE NOTICE '  - Cards: %', v_cards_migrated;
    RAISE NOTICE '  - Formulários: %', v_forms_migrated;
    RAISE NOTICE '  - Listas: %', v_lists_migrated;
    RAISE NOTICE '  - Visualizações: %', v_views_migrated;

    -- Verificar e resolver conflito de username
    v_final_username := v_username;
    SELECT id INTO v_conflict_profile_id
    FROM public.profiles
    WHERE username = v_final_username
    AND id <> new_user_id
    LIMIT 1;

    IF v_conflict_profile_id IS NOT NULL THEN
        RAISE NOTICE 'Conflito de username detectado com profile %', v_conflict_profile_id;
        
        -- Renomear profile conflitante temporariamente
        v_temp_username := v_username || '__pending__' || substr(token::text, 1, 8);
        UPDATE public.profiles
        SET username = v_temp_username,
            updated_at = NOW()
        WHERE id = v_conflict_profile_id;
        
        RAISE NOTICE 'Profile % renomeado para %', v_conflict_profile_id, v_temp_username;
    END IF;

    -- Create or update the final profile for this user
    IF v_profile_exists THEN
        RAISE NOTICE 'Atualizando profile existente %', new_user_id;
        
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
            updated_at = NOW()
        WHERE id = new_user_id;
    ELSE
        RAISE NOTICE 'Criando novo profile %', new_user_id;
        
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
            new_user_id,
            v_final_username,
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

    RAISE NOTICE 'Profile final criado/atualizado. Iniciando migração de dados...';

    -- Migrate related data from temporary profile to the final one
    -- 1. Cards
    UPDATE public.cards
    SET user_id = new_user_id
    WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Cards migrados: %', v_cards_migrated;

    -- 2. Form configs
    UPDATE public.form_configs
    SET user_id = new_user_id
    WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Formulários migrados: %', v_forms_migrated;

    -- 3. Link lists (CORREÇÃO CRÍTICA)
    UPDATE public.link_lists
    SET user_id = new_user_id
    WHERE user_id = v_profile_id;
    RAISE NOTICE '✓ Listas migradas: %', v_lists_migrated;

    -- 4. Profile views
    UPDATE public.profile_views
    SET profile_id = new_user_id
    WHERE profile_id = v_profile_id;
    RAISE NOTICE '✓ Visualizações migradas: %', v_views_migrated;

    -- Mark invite as accepted
    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = new_user_id
    WHERE id = v_invitation_id;
    
    RAISE NOTICE '✓ Convite marcado como aceito';

    -- Verificar que vínculo com criador foi mantido (FASE 3)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_invitations
        WHERE linked_profile_id = new_user_id
        AND invited_by_admin_id IS NOT NULL
    ) THEN
        RAISE WARNING 'ATENÇÃO: Vínculo com criador pode ter sido perdido para user_id=%', new_user_id;
    ELSE
        RAISE NOTICE '✓ Vínculo com criador verificado e mantido';
    END IF;

    -- Remove temporary profile after migration
    IF v_profile_id <> new_user_id THEN
        DELETE FROM public.profiles WHERE id = v_profile_id;
        RAISE NOTICE '✓ Profile temporário % removido', v_profile_id;
    END IF;

    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO';
    RAISE NOTICE 'User ID final: %', new_user_id;
    RAISE NOTICE 'Username final: %', v_final_username;
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
        RAISE; -- Re-lança erro para forçar rollback
END;
$function$;