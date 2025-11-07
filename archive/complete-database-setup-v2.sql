-- =====================================================
-- COMPLETE DATABASE SETUP - CONSOLIDATED MIGRATIONS v2.1
-- =====================================================
-- Versão: 2.1.0
-- Data: 2025-11-04
-- Descrição: Setup completo e atualizado do banco de dados
--            Inclui TODAS as funcionalidades das migrações
-- =====================================================
-- IMPORTANTE: Execute este arquivo em um banco limpo
--             Totalmente idempotente (pode rodar múltiplas vezes)
-- =====================================================
-- NOVIDADES v2.1 (🔥 CRÍTICO - CORREÇÃO DO SISTEMA DE CONVITES):
--   ✅ accept_invitation() corrigida - migração de dados funcional
--   ✅ Migração de cards, forms, profile_views preservada
--   ✅ Vínculo admin-profile preservado via linked_profile_id
--   ✅ form_configs.user_id agora referencia profiles(id) (permite forms em perfis temporários)
--   ✅ Logs detalhados para debugging do fluxo de convite
--   ✅ Tratamento de erro robusto com EXCEPTION handler
-- =====================================================
-- NOVIDADES v2.0:
--   ✅ Coluna email em profiles + sincronização automática
--   ✅ Schema corrigido de form_fields
--   ✅ Múltiplos forms por usuário (removido UNIQUE constraint)
--   ✅ Sistema de navegação entre forms
--   ✅ Posicionamento customizável de forms
--   ✅ RLS policies completas para admins
--   ✅ Funções auxiliares adicionais
-- =====================================================

-- =====================================================
-- PARTE 1: ROLES E PERMISSÕES (BASE DO SISTEMA)
-- =====================================================

-- Criar enum de roles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
        RAISE NOTICE 'Enum app_role criado com sucesso';
    END IF;
END $$;

-- Criar tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role = 'admin'
    )
);

-- Função has_role com SECURITY DEFINER (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para adicionar role 'user' automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere role 'user' para todo novo usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$;

-- Trigger que executa após cada novo usuário ser criado
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

RAISE NOTICE 'PARTE 1: Roles e permissões configurados ✓';

-- =====================================================
-- PARTE 2: SISTEMA DE PERFIS UNIFICADO (ATUALIZADO v2.0)
-- =====================================================

-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    theme TEXT DEFAULT 'light',
    email TEXT, -- ✅ NOVO v2.0: sincronizado com auth.users
    is_activated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna email se não existir (para migrations incrementais)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Coluna email adicionada à tabela profiles';
    END IF;
END $$;

-- Remover foreign key constraint (permitir perfis pendentes)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.profiles.id IS 
'User ID - pode ser auth.users.id (usuário ativado) ou UUID aleatório (perfil pendente)';

COMMENT ON COLUMN public.profiles.email IS 
'Email sincronizado com auth.users - atualizado automaticamente via trigger';

COMMENT ON TABLE public.profiles IS 
'Perfis de usuários - suporta perfis ativados (com conta) e pendentes (aguardando aceitação de convite)';

-- ✅ NOVO v2.0: Função para sincronizar email do auth.users com profiles
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Atualizar email no profile quando email mudar no auth.users
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- ✅ NOVO v2.0: Trigger para sincronizar email automaticamente
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER INSERT OR UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (NEW.email IS NOT NULL)
    EXECUTE FUNCTION public.sync_profile_email();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_activated ON public.profiles(is_activated);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

RAISE NOTICE 'PARTE 2: Sistema de perfis configurado ✓';

-- =====================================================
-- PARTE 3: SISTEMA DE CONVITES
-- =====================================================

-- Criar tabela user_invitations
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invited_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitation_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email TEXT,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Remover constraint UNIQUE normal de profile_id
ALTER TABLE public.user_invitations 
DROP CONSTRAINT IF EXISTS user_invitations_profile_id_key;

-- Criar constraint UNIQUE condicional (apenas para convites pending)
DROP INDEX IF EXISTS user_invitations_profile_id_pending_unique;
CREATE UNIQUE INDEX user_invitations_profile_id_pending_unique 
ON public.user_invitations(profile_id) 
WHERE status = 'pending';

COMMENT ON INDEX user_invitations_profile_id_pending_unique IS 
'Garante que cada profile tenha apenas um convite com status pending por vez';

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para user_invitations
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.user_invitations;
CREATE POLICY "Admins can view all invitations"
ON public.user_invitations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create invitations" ON public.user_invitations;
CREATE POLICY "Admins can create invitations"
ON public.user_invitations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update invitations" ON public.user_invitations;
CREATE POLICY "Admins can update invitations"
ON public.user_invitations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view invitation by token" ON public.user_invitations;
CREATE POLICY "Public can view invitation by token"
ON public.user_invitations FOR SELECT
TO anon
USING (status = 'pending' AND expires_at > NOW());

-- Função validate_invitation_token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token UUID)
RETURNS TABLE (
    invitation_id UUID,
    profile_id UUID,
    username TEXT,
    display_name TEXT,
    email TEXT
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
        AND i.expires_at > NOW();
END;
$$;

-- Função accept_invitation (versão corrigida v2.1 - com migração completa)
CREATE OR REPLACE FUNCTION public.accept_invitation(
    token UUID,
    user_id UUID  -- ✅ Mantém nome original para compatibilidade da API
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    p_user_id ALIAS FOR user_id;  -- ✅ Alias para evitar ambiguidade interna
    v_invitation_id UUID;
    v_profile_id UUID;
    v_username TEXT;
    v_display_name TEXT;
    v_bio TEXT;
    v_avatar_url TEXT;
    v_cover_image_url TEXT;
    v_theme TEXT;
    v_email TEXT;
    v_cards_migrated INTEGER := 0;
    v_forms_migrated INTEGER := 0;
    v_views_migrated INTEGER := 0;
BEGIN
    RAISE NOTICE '========== INÍCIO accept_invitation ==========';
    RAISE NOTICE 'Token recebido: %', token;
    RAISE NOTICE 'User ID destino: %', p_user_id;
    
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
    
    IF v_profile_id IS NULL THEN
        RAISE NOTICE '❌ Convite não encontrado, expirado ou já aceito';
        RETURN false;
    END IF;
    
    RAISE NOTICE '✅ Convite encontrado! Profile temporário: %', v_profile_id;
    RAISE NOTICE 'Username: %, Display name: %', v_username, v_display_name;
    
    -- Criar novo profile permanente com o user_id correto
    BEGIN
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
            p_user_id,
            v_username,
            v_display_name,
            v_bio,
            v_avatar_url,
            v_cover_image_url,
            v_theme,
            v_email,
            true
        );
        RAISE NOTICE '✅ Profile permanente criado: %', p_user_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao criar profile permanente: %', SQLERRM;
    END;
    
    -- ==========================================
    -- MIGRAÇÃO DE DADOS
    -- ==========================================
    
    -- 1️⃣ Migrar cards do profile temporário para o permanente
    UPDATE public.cards
    SET user_id = p_user_id  -- ✅ Agora usa o parâmetro corretamente
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_cards_migrated = ROW_COUNT;
    RAISE NOTICE '✅ Cards migrados: %', v_cards_migrated;
    
    -- 2️⃣ Migrar form_configs (se houver - teoricamente não deveria)
    UPDATE public.form_configs
    SET user_id = p_user_id  -- ✅ Agora usa o parâmetro corretamente
    WHERE user_id = v_profile_id;
    
    GET DIAGNOSTICS v_forms_migrated = ROW_COUNT;
    IF v_forms_migrated > 0 THEN
        RAISE NOTICE '⚠️ Forms migrados: % (inesperado - forms deveriam estar em auth.users)', v_forms_migrated;
    ELSE
        RAISE NOTICE '✅ Forms migrados: 0 (esperado)';
    END IF;
    
    -- 3️⃣ Migrar profile_views (analytics)
    UPDATE public.profile_views
    SET profile_id = p_user_id  -- ✅ Nova migração adicionada
    WHERE profile_id = v_profile_id;
    
    GET DIAGNOSTICS v_views_migrated = ROW_COUNT;
    RAISE NOTICE '✅ Profile views migradas: %', v_views_migrated;
    
    -- 4️⃣ Migrar card_clicks (via relacionamento com cards)
    -- Não precisa migrar diretamente pois card_clicks.card_id já aponta para os cards corretos
    RAISE NOTICE '✅ Card clicks: sem migração necessária (mantém vínculo via cards)';
    
    -- 5️⃣ Migrar form_submissions (via relacionamento com form_configs)
    -- Não precisa migrar diretamente pois form_submissions.form_config_id já aponta correto
    RAISE NOTICE '✅ Form submissions: sem migração necessária (mantém vínculo via form_configs)';
    
    -- ==========================================
    -- ATUALIZAR CONVITE E LIMPAR
    -- ==========================================
    
    -- Marcar convite como aceito e vincular ao profile permanente
    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = p_user_id,  -- ✅ Agora usa o parâmetro correto
        profile_id = p_user_id           -- ✅ Atualiza para o profile permanente
    WHERE id = v_invitation_id;
    
    RAISE NOTICE '✅ Convite marcado como aceito (ID: %)', v_invitation_id;
    RAISE NOTICE '✅ Vínculo creator-profile preservado via linked_profile_id';
    
    -- Deletar profile temporário (CASCADE cuida de referências restantes)
    DELETE FROM public.profiles
    WHERE id = v_profile_id;
    
    RAISE NOTICE '✅ Profile temporário deletado: %', v_profile_id;
    RAISE NOTICE '========== SUCESSO: Migração completa ==========';
    
    RETURN true;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ ERRO NA MIGRAÇÃO: %', SQLERRM;
    RAISE WARNING 'Estado: token=%, profile_temp=%, user_dest=%', token, v_profile_id, p_user_id;
    RETURN false;
END;
$$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_profile_id ON public.user_invitations(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

RAISE NOTICE 'PARTE 3: Sistema de convites configurado ✓';

-- =====================================================
-- PARTE 4: AUTO-CRIAÇÃO DE PERFIS (SIGNUP NORMAL)
-- =====================================================

-- Função para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
BEGIN
    -- Verificar se há convite pendente para este email
    IF EXISTS (
        SELECT 1 FROM public.user_invitations 
        WHERE email = new.email 
        AND status = 'pending'
        AND expires_at > NOW()
    ) THEN
        -- Se há convite, não criar profile (será criado via accept_invitation)
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
    
    -- Criar profile ativado
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
    
    RETURN new;
END;
$$;

-- Trigger para auto-criação de profile
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

RAISE NOTICE 'PARTE 4: Auto-criação de perfis configurado ✓';

-- =====================================================
-- PARTE 5: PERMISSÕES DE DELEÇÃO ADMIN
-- =====================================================

-- Função para admins removerem usuários
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Acesso negado: apenas admins podem remover usuários';
    END IF;
    
    -- Remover o usuário do auth.users (cascade irá remover profile)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- ✅ NOVO v2.0: Função auxiliar para admins listarem emails de usuários
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Acesso negado: apenas admins podem listar emails';
    END IF;
    
    RETURN QUERY
    SELECT 
        au.id AS user_id,
        au.email,
        au.created_at
    FROM auth.users au
    ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;

RAISE NOTICE 'PARTE 5: Permissões de deleção configuradas ✓';

-- =====================================================
-- PARTE 6: SISTEMA DE FORMULÁRIOS (ATUALIZADO v2.0)
-- =====================================================

-- Criar tabela form_configs
CREATE TABLE IF NOT EXISTS public.form_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  -- ✅ v2.1: Mudado para profiles(id)
    title TEXT NOT NULL DEFAULT 'Mentoria individual diretamente comigo.',
    description TEXT,
    quote TEXT,
    background_image TEXT,
    button_text TEXT NOT NULL DEFAULT 'Enviar formulário',
    button_color TEXT NOT NULL DEFAULT '#10b981',
    whatsapp_number TEXT,
    email_notification TEXT,
    show_name BOOLEAN NOT NULL DEFAULT true,
    show_phone BOOLEAN NOT NULL DEFAULT true,
    show_email BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    slug TEXT,
    confirmation_title TEXT DEFAULT 'Formulário enviado!',
    confirmation_message TEXT DEFAULT 'Obrigado pelo seu contato. Retornaremos em breve.',
    confirmation_button_text TEXT DEFAULT 'Enviar outro formulário',
    -- ✅ NOVAS COLUNAS v2.0: Sistema de navegação e posicionamento
    form_position TEXT DEFAULT 'middle-center',
    button_action TEXT DEFAULT 'confirmation',
    external_link_url TEXT,
    button_action_form_id UUID REFERENCES form_configs(id) ON DELETE SET NULL,
    show_confirmation_button BOOLEAN DEFAULT true,
    confirmation_button_action TEXT DEFAULT 'reset',
    confirmation_button_link TEXT,
    confirmation_button_form_id UUID REFERENCES form_configs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ✅ v2.1: Corrigir referência para profiles(id) se ainda referenciar auth.users(id)
DO $$
BEGIN
    -- Verificar se a constraint antiga existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'form_configs' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND tc.table_schema = 'public'
    ) THEN
        -- Remover constraint antiga
        ALTER TABLE public.form_configs
        DROP CONSTRAINT IF EXISTS form_configs_user_id_fkey;
        
        -- Adicionar nova constraint
        ALTER TABLE public.form_configs
        ADD CONSTRAINT form_configs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ form_configs.user_id agora referencia profiles(id) em vez de auth.users(id)';
    END IF;
END $$;

-- ✅ Adicionar novas colunas se não existirem (para migrations incrementais)
DO $$ 
BEGIN
    -- form_position
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'form_position'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN form_position TEXT DEFAULT 'middle-center';
    END IF;
    
    -- button_action
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'button_action'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN button_action TEXT DEFAULT 'confirmation';
    END IF;
    
    -- external_link_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'external_link_url'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN external_link_url TEXT;
    END IF;
    
    -- button_action_form_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'button_action_form_id'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN button_action_form_id UUID REFERENCES form_configs(id) ON DELETE SET NULL;
    END IF;
    
    -- show_confirmation_button
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'show_confirmation_button'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN show_confirmation_button BOOLEAN DEFAULT true;
    END IF;
    
    -- confirmation_button_action
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'confirmation_button_action'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN confirmation_button_action TEXT DEFAULT 'reset';
    END IF;
    
    -- confirmation_button_link
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'confirmation_button_link'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN confirmation_button_link TEXT;
    END IF;
    
    -- confirmation_button_form_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'form_configs' 
        AND column_name = 'confirmation_button_form_id'
    ) THEN
        ALTER TABLE public.form_configs ADD COLUMN confirmation_button_form_id UUID REFERENCES form_configs(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ✅ v2.0: Remover constraint UNIQUE(user_id) - permitir múltiplos forms por usuário
ALTER TABLE public.form_configs 
DROP CONSTRAINT IF EXISTS form_configs_user_id_key;

-- ✅ v2.0: Adicionar constraints de validação
DO $$
BEGIN
    -- Check constraint para button_action
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_button_action'
    ) THEN
        ALTER TABLE public.form_configs
        ADD CONSTRAINT check_button_action 
        CHECK (button_action IN ('confirmation', 'external_link', 'other_form'));
    END IF;
    
    -- Check constraint para confirmation_button_action
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_confirmation_button_action'
    ) THEN
        ALTER TABLE public.form_configs
        ADD CONSTRAINT check_confirmation_button_action 
        CHECK (confirmation_button_action IN ('reset', 'external_link', 'other_form'));
    END IF;
END $$;

-- ✅ v2.0: Criar tabela form_fields com schema CORRETO
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_config_id UUID REFERENCES public.form_configs(id) ON DELETE CASCADE NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'textarea', 'number', 'select', 'checkbox', 'radio')),
    label TEXT NOT NULL,
    placeholder TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    options TEXT[], -- Para select, radio
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_standard_field BOOLEAN DEFAULT false NOT NULL,
    standard_field_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar tabela form_submissions
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_config_id UUID REFERENCES public.form_configs(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    phone TEXT,
    email TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    slug := lower(text_input);
    slug := translate(slug, 
        'áàâãäåéèêëíìîïóòôõöúùûüçñ', 
        'aaaaaaeeeeiiiioooooouuuucn');
    slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
    slug := trim(both '-' from slug);
    RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT, form_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    final_slug TEXT;
    counter INTEGER := 0;
    slug_exists BOOLEAN;
BEGIN
    final_slug := base_slug;
    
    LOOP
        IF form_id IS NULL THEN
            SELECT EXISTS(SELECT 1 FROM form_configs WHERE slug = final_slug) INTO slug_exists;
        ELSE
            SELECT EXISTS(SELECT 1 FROM form_configs WHERE slug = final_slug AND id != form_id) INTO slug_exists;
        END IF;
        
        EXIT WHEN NOT slug_exists;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ✅ NOVO v2.0: Função para buscar form config público (usado em PublicForm)
CREATE OR REPLACE FUNCTION public.get_public_form_config(form_slug text)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    description TEXT,
    quote TEXT,
    background_image TEXT,
    button_text TEXT,
    button_color TEXT,
    whatsapp_number TEXT,
    email_notification TEXT,
    show_name BOOLEAN,
    show_phone BOOLEAN,
    show_email BOOLEAN,
    is_active BOOLEAN,
    slug TEXT,
    confirmation_title TEXT,
    confirmation_message TEXT,
    confirmation_button_text TEXT,
    form_position TEXT,
    button_action TEXT,
    external_link_url TEXT,
    button_action_form_id UUID,
    show_confirmation_button BOOLEAN,
    confirmation_button_action TEXT,
    confirmation_button_link TEXT,
    confirmation_button_form_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        fc.id,
        fc.user_id,
        fc.title,
        fc.description,
        fc.quote,
        fc.background_image,
        fc.button_text,
        fc.button_color,
        fc.whatsapp_number,
        fc.email_notification,
        fc.show_name,
        fc.show_phone,
        fc.show_email,
        fc.is_active,
        fc.slug,
        fc.confirmation_title,
        fc.confirmation_message,
        fc.confirmation_button_text,
        fc.form_position,
        fc.button_action,
        fc.external_link_url,
        fc.button_action_form_id,
        fc.show_confirmation_button,
        fc.confirmation_button_action,
        fc.confirmation_button_link,
        fc.confirmation_button_form_id,
        fc.created_at,
        fc.updated_at
    FROM public.form_configs fc
    WHERE fc.slug = form_slug 
        AND fc.is_active = true;
$$;

-- Gerar slugs para registros existentes
UPDATE form_configs
SET slug = generate_unique_slug(
    generate_slug(title) || '-' || substring(id::text, 1, 8),
    id
)
WHERE slug IS NULL;

-- Tornar slug NOT NULL
ALTER TABLE form_configs 
ALTER COLUMN slug SET NOT NULL;

-- Criar índice único em slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_configs_slug ON form_configs(slug);

-- Enable RLS
ALTER TABLE public.form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para form_configs
DROP POLICY IF EXISTS "Users can view their own form configs" ON public.form_configs;
CREATE POLICY "Users can view their own form configs"
ON public.form_configs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own form configs" ON public.form_configs;
CREATE POLICY "Users can insert their own form configs"
ON public.form_configs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own form configs" ON public.form_configs;
CREATE POLICY "Users can update their own form configs"
ON public.form_configs FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own form configs" ON public.form_configs;
CREATE POLICY "Users can delete their own form configs"
ON public.form_configs FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view active form configs" ON public.form_configs;
CREATE POLICY "Anyone can view active form configs"
ON public.form_configs FOR SELECT
TO public
USING (is_active = true);

-- RLS Policies para form_fields
DROP POLICY IF EXISTS "Users can manage their own form fields" ON public.form_fields;
CREATE POLICY "Users can manage their own form fields"
ON public.form_fields FOR ALL
TO authenticated
USING (
    form_config_id IN (
        SELECT id FROM public.form_configs WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Anyone can view fields of active forms" ON public.form_fields;
CREATE POLICY "Anyone can view fields of active forms"
ON public.form_fields FOR SELECT
TO public
USING (
    form_config_id IN (
        SELECT id FROM public.form_configs WHERE is_active = true
    )
);

-- RLS Policies para form_submissions
DROP POLICY IF EXISTS "Anyone can insert form submissions" ON public.form_submissions;
CREATE POLICY "Anyone can insert form submissions"
ON public.form_submissions FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own form submissions" ON public.form_submissions;
CREATE POLICY "Users can view their own form submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (
    form_config_id IN (
        SELECT id FROM public.form_configs WHERE user_id = auth.uid()
    )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_form_configs_updated_at ON form_configs;
CREATE TRIGGER update_form_configs_updated_at 
BEFORE UPDATE ON form_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_fields_updated_at ON form_fields;
CREATE TRIGGER update_form_fields_updated_at 
BEFORE UPDATE ON form_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id ON public.form_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id_active ON public.form_configs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_config_id ON public.form_fields(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_sort_order ON public.form_fields(form_config_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_config_id ON public.form_submissions(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

RAISE NOTICE 'PARTE 6: Sistema de formulários configurado ✓';

-- =====================================================
-- PARTE 7: SISTEMA DE CARDS COM INTEGRAÇÃO DE FORMS
-- =====================================================

-- Criar tabela cards
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT,
    icon TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    form_config_id UUID REFERENCES public.form_configs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tornar link_url nullable (pode ter form_config_id em vez disso)
ALTER TABLE public.cards 
ALTER COLUMN link_url DROP NOT NULL;

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies para cards
DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own cards" ON public.cards;
CREATE POLICY "Users can insert their own cards"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
CREATE POLICY "Users can update their own cards"
ON public.cards FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own cards" ON public.cards;
CREATE POLICY "Users can delete their own cards"
ON public.cards FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view active cards" ON public.cards;
CREATE POLICY "Public can view active cards"
ON public.cards FOR SELECT
TO public
USING (is_active = true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_form_config_id ON public.cards(form_config_id);
CREATE INDEX IF NOT EXISTS idx_cards_display_order ON public.cards(display_order);
CREATE INDEX IF NOT EXISTS idx_cards_is_active ON public.cards(is_active);
CREATE INDEX IF NOT EXISTS idx_cards_user_status ON public.cards(user_id, is_active);

RAISE NOTICE 'PARTE 7: Sistema de cards configurado ✓';

-- =====================================================
-- PARTE 8: SISTEMA DE ANALYTICS
-- =====================================================

-- Criar tabela profile_views
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Criar tabela card_clicks
CREATE TABLE IF NOT EXISTS public.card_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    clicked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profile_views
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
CREATE POLICY "Anyone can insert profile views"
ON public.profile_views FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile views" ON public.profile_views;
CREATE POLICY "Users can view their own profile views"
ON public.profile_views FOR SELECT
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.profiles WHERE id = auth.uid()
    )
);

-- RLS Policies para card_clicks
DROP POLICY IF EXISTS "Anyone can insert card clicks" ON public.card_clicks;
CREATE POLICY "Anyone can insert card clicks"
ON public.card_clicks FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own card clicks" ON public.card_clicks;
CREATE POLICY "Users can view their own card clicks"
ON public.card_clicks FOR SELECT
TO authenticated
USING (
    card_id IN (
        SELECT id FROM public.cards WHERE user_id = auth.uid()
    )
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON public.profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id_viewed ON public.profile_views(profile_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id ON public.card_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_clicked_at ON public.card_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id_clicked_at ON public.card_clicks(card_id, clicked_at);

RAISE NOTICE 'PARTE 8: Sistema de analytics configurado ✓';

-- =====================================================
-- PARTE 9: STORAGE BUCKETS
-- =====================================================

-- Criar buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('profile-covers', 'profile-covers', true),
    ('card-images', 'card-images', true),
    ('form-backgrounds', 'form-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- IMPORTANTE: CONFIGURAÇÃO DE POLÍTICAS DE STORAGE
-- =====================================================
-- 
-- ⚠️ ATENÇÃO: As políticas RLS para storage.objects NÃO PODEM ser
--   criadas via SQL Editor por questões de segurança do Supabase.
--
-- 📋 VOCÊ DEVE CONFIGURAR MANUALMENTE VIA DASHBOARD:
--   1. Acesse: Storage > Policies no Dashboard do Supabase
--   2. Configure as políticas para cada bucket conforme abaixo
--   3. Veja o arquivo 'STORAGE_POLICIES_SETUP.md' para instruções detalhadas
--
-- =====================================================
-- POLÍTICAS NECESSÁRIAS POR BUCKET:
-- =====================================================
--
-- Para CADA bucket (avatars, profile-covers, card-images, form-backgrounds):
--
-- 1. INSERT Policy (Upload):
--    Nome: "Users can upload to [bucket-name]"
--    Target: authenticated
--    Policy: bucket_id = '[bucket-name]' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- 2. UPDATE Policy (Atualização):
--    Nome: "Users can update in [bucket-name]"
--    Target: authenticated
--    Policy: bucket_id = '[bucket-name]' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- 3. DELETE Policy (Remoção):
--    Nome: "Users can delete from [bucket-name]"
--    Target: authenticated
--    Policy: bucket_id = '[bucket-name]' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- 4. SELECT Policy (Visualização pública):
--    Nome: "Public can view [bucket-name]"
--    Target: public
--    Policy: bucket_id = '[bucket-name]'
--
-- =====================================================

RAISE NOTICE 'PARTE 9: Storage buckets criados ✓';
RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA: Configure as políticas de storage via Dashboard do Supabase';
RAISE NOTICE '📄 Veja STORAGE_POLICIES_SETUP.md para instruções detalhadas';

-- =====================================================
-- PARTE 10: RLS POLICIES PARA ADMINS (NOVA v2.0)
-- =====================================================

-- ===== CARDS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all cards" ON public.cards;
CREATE POLICY "Admins can view all cards"
ON public.cards FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert cards for any user" ON public.cards;
CREATE POLICY "Admins can insert cards for any user"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all cards" ON public.cards;
CREATE POLICY "Admins can update all cards"
ON public.cards FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all cards" ON public.cards;
CREATE POLICY "Admins can delete all cards"
ON public.cards FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== CARD_CLICKS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all card clicks" ON public.card_clicks;
CREATE POLICY "Admins can view all card clicks"
ON public.card_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== PROFILE_VIEWS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all profile views" ON public.profile_views;
CREATE POLICY "Admins can view all profile views"
ON public.profile_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== FORM_CONFIGS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all form configs" ON public.form_configs;
CREATE POLICY "Admins can view all form configs"
ON public.form_configs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert form configs for any user" ON public.form_configs;
CREATE POLICY "Admins can insert form configs for any user"
ON public.form_configs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all form configs" ON public.form_configs;
CREATE POLICY "Admins can update all form configs"
ON public.form_configs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all form configs" ON public.form_configs;
CREATE POLICY "Admins can delete all form configs"
ON public.form_configs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== FORM_FIELDS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all form fields" ON public.form_fields;
CREATE POLICY "Admins can view all form fields"
ON public.form_fields FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert form fields" ON public.form_fields;
CREATE POLICY "Admins can insert form fields"
ON public.form_fields FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all form fields" ON public.form_fields;
CREATE POLICY "Admins can update all form fields"
ON public.form_fields FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete all form fields" ON public.form_fields;
CREATE POLICY "Admins can delete all form fields"
ON public.form_fields FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== FORM_SUBMISSIONS - ADMIN POLICIES =====
DROP POLICY IF EXISTS "Admins can view all form submissions" ON public.form_submissions;
CREATE POLICY "Admins can view all form submissions"
ON public.form_submissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

RAISE NOTICE 'PARTE 10: RLS policies de admin configuradas ✓';

-- =====================================================
-- PARTE 11: OTIMIZAÇÕES DE PERFORMANCE
-- =====================================================

-- Drop materialized views existentes
DROP MATERIALIZED VIEW IF EXISTS cards_with_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS forms_with_metrics CASCADE;

-- Criar índices otimizados adicionais
CREATE INDEX IF NOT EXISTS idx_cards_user_id_active ON public.cards(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id_clicked_at ON public.card_clicks(card_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id_active ON public.form_configs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id_submitted ON public.form_submissions(form_config_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id_viewed ON public.profile_views(profile_id, viewed_at);

-- Criar materialized view para cards com métricas
CREATE MATERIALIZED VIEW cards_with_metrics AS
SELECT 
    c.*,
    COUNT(cc.id) AS click_count
FROM public.cards c
LEFT JOIN public.card_clicks cc ON cc.card_id = c.id
GROUP BY c.id;

-- Criar índice único para refresh concorrente
CREATE UNIQUE INDEX idx_cards_with_metrics_id ON cards_with_metrics(id);

-- Criar materialized view para forms com métricas
CREATE MATERIALIZED VIEW forms_with_metrics AS
SELECT 
    f.*,
    COUNT(fs.id) AS submission_count
FROM public.form_configs f
LEFT JOIN public.form_submissions fs ON fs.form_config_id = f.id
GROUP BY f.id;

-- Criar índice único para refresh concorrente
CREATE UNIQUE INDEX idx_forms_with_metrics_id ON forms_with_metrics(id);

-- Função para refresh de cards metrics
CREATE OR REPLACE FUNCTION refresh_cards_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY cards_with_metrics;
END;
$$;

-- Função para refresh de forms metrics
CREATE OR REPLACE FUNCTION refresh_forms_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY forms_with_metrics;
END;
$$;

-- Trigger function para auto-refresh de cards
CREATE OR REPLACE FUNCTION trigger_refresh_cards_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM refresh_cards_metrics();
    RETURN NULL;
END;
$$;

-- Trigger function para auto-refresh de forms
CREATE OR REPLACE FUNCTION trigger_refresh_forms_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM refresh_forms_metrics();
    RETURN NULL;
END;
$$;

-- Triggers para cards
DROP TRIGGER IF EXISTS refresh_cards_on_card_change ON public.cards;
CREATE TRIGGER refresh_cards_on_card_change
AFTER INSERT OR UPDATE OR DELETE ON public.cards
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_cards_metrics();

DROP TRIGGER IF EXISTS refresh_cards_on_click ON public.card_clicks;
CREATE TRIGGER refresh_cards_on_click
AFTER INSERT OR UPDATE OR DELETE ON public.card_clicks
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_cards_metrics();

-- Triggers para forms
DROP TRIGGER IF EXISTS refresh_forms_on_config_change ON public.form_configs;
CREATE TRIGGER refresh_forms_on_config_change
AFTER INSERT OR UPDATE OR DELETE ON public.form_configs
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_forms_metrics();

DROP TRIGGER IF EXISTS refresh_forms_on_submission ON public.form_submissions;
CREATE TRIGGER refresh_forms_on_submission
AFTER INSERT OR UPDATE OR DELETE ON public.form_submissions
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_forms_metrics();

-- Initial refresh das materialized views
REFRESH MATERIALIZED VIEW cards_with_metrics;
REFRESH MATERIALIZED VIEW forms_with_metrics;

-- Grant permissions
GRANT SELECT ON cards_with_metrics TO authenticated;
GRANT SELECT ON forms_with_metrics TO authenticated;

RAISE NOTICE 'PARTE 11: Otimizações de performance configuradas ✓';

-- =====================================================
-- PARTE 12: VERIFICAÇÃO FINAL E FUNÇÕES AUXILIARES
-- =====================================================

DO $$
DECLARE
    tables_count INTEGER;
    functions_count INTEGER;
    triggers_count INTEGER;
    v_email_column_exists BOOLEAN;
    v_form_position_exists BOOLEAN;
    v_button_action_constraint_exists BOOLEAN;
BEGIN
    -- Contar tabelas criadas
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'user_roles', 'profiles', 'user_invitations',
        'form_configs', 'form_fields', 'form_submissions',
        'cards', 'profile_views', 'card_clicks'
    );
    
    -- Contar funções criadas
    SELECT COUNT(*) INTO functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'has_role', 'handle_new_user_role', 'handle_new_user',
        'validate_invitation_token', 'accept_invitation',
        'admin_delete_user', 'get_user_emails', 'sync_profile_email',
        'generate_slug', 'generate_unique_slug', 'get_public_form_config',
        'update_updated_at_column', 'refresh_cards_metrics',
        'refresh_forms_metrics'
    );
    
    -- Verificar coluna email em profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) INTO v_email_column_exists;
    
    -- Verificar coluna form_position em form_configs
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'form_configs' 
        AND column_name = 'form_position'
    ) INTO v_form_position_exists;
    
    -- Verificar constraint check_button_action
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_button_action'
    ) INTO v_button_action_constraint_exists;
    
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'SETUP COMPLETO v2.1 ✓';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Tabelas criadas: %', tables_count;
    RAISE NOTICE 'Funções criadas: %', functions_count;
    RAISE NOTICE 'Storage buckets: 4 (avatars, profile-covers, card-images, form-backgrounds)';
    RAISE NOTICE 'Materialized views: 2 (cards_with_metrics, forms_with_metrics)';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'VERIFICAÇÕES v2.1:';
    RAISE NOTICE '  - Coluna email em profiles: %', CASE WHEN v_email_column_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '  - Coluna form_position em form_configs: %', CASE WHEN v_form_position_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '  - Constraint check_button_action: %', CASE WHEN v_button_action_constraint_exists THEN '✓' ELSE '✗' END;
    RAISE NOTICE '========================================================';
    RAISE NOTICE '🔥 CORREÇÕES CRÍTICAS v2.1 (Sistema de Convites):';
    RAISE NOTICE '  ✅ accept_invitation(): Migração de dados corrigida (cards, forms, views)';
    RAISE NOTICE '  ✅ Ambiguidade de parâmetros resolvida (user_id -> p_user_id via ALIAS)';
    RAISE NOTICE '  ✅ form_configs agora permite perfis temporários (referencia profiles, não auth.users)';
    RAISE NOTICE '  ✅ Vínculo admin-profile preservado via linked_profile_id';
    RAISE NOTICE '  ✅ Logs detalhados adicionados para debugging';
    RAISE NOTICE '  ✅ Tratamento de erro robusto (EXCEPTION handler)';
    RAISE NOTICE '  ✅ Sem dados órfãos: profile_views migrado corretamente';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'NOVIDADES v2.0:';
    RAISE NOTICE '  ✓ Email sincronizado automaticamente em profiles';
    RAISE NOTICE '  ✓ Schema correto de form_fields (label, placeholder, options)';
    RAISE NOTICE '  ✓ Múltiplos forms por usuário (sem UNIQUE constraint)';
    RAISE NOTICE '  ✓ Sistema de navegação entre forms';
    RAISE NOTICE '  ✓ Posicionamento customizável de forms';
    RAISE NOTICE '  ✓ RLS policies completas para admins';
    RAISE NOTICE '  ✓ Funções auxiliares: get_user_emails(), get_public_form_config()';
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'O banco de dados v2.1 está pronto para uso!';
    RAISE NOTICE '========================================================';
END $$;
