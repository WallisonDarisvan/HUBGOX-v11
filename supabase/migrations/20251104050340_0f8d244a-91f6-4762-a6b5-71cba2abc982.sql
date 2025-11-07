-- =====================================================
-- FIX: Corrigir fluxo de aceitação de convite
-- =====================================================
-- Problema: handle_new_user cria profile antes de accept_invitation
-- Solução: Verificar token nos metadados + UPSERT em accept_invitation
-- =====================================================

-- 1. Atualizar handle_new_user para verificar token nos metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_username TEXT;
    final_username TEXT;
    counter INTEGER := 0;
    username_exists BOOLEAN;
    display_name TEXT;
    invitation_token_meta TEXT;
BEGIN
    -- Verificar se há invitation_token nos metadados
    invitation_token_meta := new.raw_user_meta_data->>'invitation_token';
    
    -- Se tem token de convite, não criar profile (será criado via accept_invitation)
    IF invitation_token_meta IS NOT NULL THEN
        -- Verificar se o token existe e está válido
        IF EXISTS (
            SELECT 1 FROM public.user_invitations 
            WHERE invitation_token::text = invitation_token_meta
            AND status = 'pending'
            AND expires_at > NOW()
        ) THEN
            RAISE NOTICE 'Signup via convite detectado, pulando criação de profile';
            RETURN new;
        END IF;
    END IF;
    
    -- Verificar se há convite pendente para este email (fallback)
    IF EXISTS (
        SELECT 1 FROM public.user_invitations 
        WHERE email = new.email 
        AND status = 'pending'
        AND expires_at > NOW()
    ) THEN
        RAISE NOTICE 'Convite pendente encontrado por email, pulando criação de profile';
        RETURN new;
    END IF;
    
    -- Gerar username base do email
    base_username := split_part(new.email, '@', 1);
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
    base_username := lower(base_username);
    
    -- Garantir username único
    final_username := base_username;
    LOOP
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) 
        INTO username_exists;
        
        EXIT WHEN NOT username_exists;
        
        counter := counter + 1;
        final_username := base_username || counter;
    END LOOP;
    
    -- Definir display_name
    IF new.raw_user_meta_data->>'display_name' IS NOT NULL THEN
        display_name := new.raw_user_meta_data->>'display_name';
    ELSIF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        display_name := new.raw_user_meta_data->>'full_name';
    ELSE
        display_name := split_part(new.email, '@', 1);
    END IF;
    
    -- Criar profile ativado (signup normal sem convite)
    INSERT INTO public.profiles (
        id, 
        username, 
        display_name,
        email,
        is_activated
    ) VALUES (
        new.id,
        final_username,
        display_name,
        new.email,
        true
    );
    
    RAISE NOTICE 'Profile criado via signup normal para user %', new.id;
    RETURN new;
END;
$$;

-- 2. Atualizar accept_invitation para fazer UPSERT ao invés de dar erro
CREATE OR REPLACE FUNCTION public.accept_invitation(token uuid, user_id uuid)
RETURNS boolean
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
    v_theme TEXT;
    v_email TEXT;
    v_cards_migrated INTEGER;
    v_forms_migrated INTEGER;
    v_lists_migrated INTEGER;
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
        p.theme,
        i.email
    INTO 
        v_invitation_id,
        v_profile_id,
        v_username,
        v_display_name,
        v_bio,
        v_avatar_url,
        v_cover_image_url,
        v_theme,
        v_email
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
            theme = v_theme,
            email = v_email,
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
            theme,
            email,
            is_activated
        ) VALUES (
            user_id,
            v_username,
            v_display_name,
            v_bio,
            v_avatar_url,
            v_cover_image_url,
            v_theme,
            v_email,
            true
        );
    END IF;
    
    RAISE NOTICE 'accept_invitation: Profile configurado com sucesso para user_id=%', user_id;
    
    -- MIGRAR CARDS do profile temporário para o novo profile
    UPDATE public.cards
    SET user_id = accept_invitation.user_id
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_cards_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % cards migrados', v_cards_migrated;
    
    -- MIGRAR FORM_CONFIGS do profile temporário para o novo profile
    UPDATE public.form_configs
    SET user_id = accept_invitation.user_id
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_forms_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % form_configs migrados', v_forms_migrated;
    
    -- MIGRAR LINK_LISTS do profile temporário para o novo profile
    UPDATE public.link_lists
    SET user_id = accept_invitation.user_id
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_lists_migrated = ROW_COUNT;
    RAISE NOTICE 'accept_invitation: % link_lists migrados', v_lists_migrated;
    
    -- Marcar convite como aceito
    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = user_id,
        profile_id = user_id
    WHERE id = v_invitation_id;
    
    RAISE NOTICE 'accept_invitation: Convite marcado como aceito';
    
    -- Deletar profile temporário (pendente) DEPOIS de migrar tudo
    -- Só deletar se for diferente do user_id (evitar deletar o profile que acabamos de criar/atualizar)
    IF v_profile_id != user_id THEN
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