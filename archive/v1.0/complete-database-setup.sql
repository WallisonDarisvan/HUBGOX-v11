-- =====================================================
-- COMPLETE DATABASE SETUP - CONSOLIDATED MIGRATIONS
-- =====================================================
-- Versão: 1.0.0
-- Data: 2025-11-02
-- Descrição: Setup completo do banco de dados para o sistema
--            de Bio Links e Form Builder
-- =====================================================
-- IMPORTANTE: Execute este arquivo em um banco limpo
--             ou certifique-se de que é idempotente
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
-- PARTE 2: SISTEMA DE PERFIS UNIFICADO
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
    is_activated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remover foreign key constraint (permitir perfis pendentes)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.profiles.id IS 
'User ID - pode ser auth.users.id (usuário ativado) ou UUID aleatório (perfil pendente)';

COMMENT ON TABLE public.profiles IS 
'Perfis de usuários - suporta perfis ativados (com conta) e pendentes (aguardando aceitação de convite)';

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

-- Função accept_invitation (versão corrigida - cria novo profile)
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
    v_theme TEXT;
BEGIN
    -- Buscar dados do convite e profile pendente
    SELECT 
        i.id,
        i.profile_id,
        p.username,
        p.display_name,
        p.bio,
        p.avatar_url,
        p.cover_image_url,
        p.theme
    INTO 
        v_invitation_id,
        v_profile_id,
        v_username,
        v_display_name,
        v_bio,
        v_avatar_url,
        v_cover_image_url,
        v_theme
    FROM public.user_invitations i
    JOIN public.profiles p ON p.id = i.profile_id
    WHERE i.invitation_token = token
        AND i.status = 'pending'
        AND i.expires_at > NOW();
    
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
        cover_image_url,
        theme,
        is_activated
    ) VALUES (
        user_id,
        v_username,
        v_display_name,
        v_bio,
        v_avatar_url,
        v_cover_image_url,
        v_theme,
        true
    );
    
    -- Migrar cards do profile antigo para o novo
    UPDATE public.cards
    SET user_id = user_id
    WHERE user_id = v_profile_id;
    
    -- Migrar form_configs do profile antigo para o novo
    UPDATE public.form_configs
    SET user_id = user_id
    WHERE user_id = v_profile_id;
    
    -- Migrar form_submissions (via form_config_id)
    -- Não precisa migrar diretamente pois segue form_configs
    
    -- Marcar convite como aceito
    UPDATE public.user_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        linked_profile_id = user_id,
        profile_id = user_id
    WHERE id = v_invitation_id;
    
    -- Deletar profile antigo (pendente)
    DELETE FROM public.profiles
    WHERE id = v_profile_id;
    
    RETURN true;
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
        is_activated
    ) VALUES (
        new.id,
        final_username,
        display_name,
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

RAISE NOTICE 'PARTE 5: Permissões de deleção configuradas ✓';

-- =====================================================
-- PARTE 6: SISTEMA DE FORMULÁRIOS
-- =====================================================

-- Criar tabela form_configs
CREATE TABLE IF NOT EXISTS public.form_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Criar tabela form_fields
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_config_id UUID REFERENCES public.form_configs(id) ON DELETE CASCADE NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'textarea', 'select', 'checkbox')),
    field_label TEXT NOT NULL,
    field_placeholder TEXT,
    field_required BOOLEAN DEFAULT false,
    field_options TEXT[], -- Para select
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_form_configs_updated_at ON form_configs;
CREATE TRIGGER update_form_configs_updated_at 
BEFORE UPDATE ON form_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id ON public.form_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_config_id ON public.form_fields(form_config_id);
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
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id ON public.card_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_clicked_at ON public.card_clicks(clicked_at);

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

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ===== AVATARS BUCKET =====
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ===== PROFILE COVERS BUCKET =====
DROP POLICY IF EXISTS "Users can upload their own profile covers" ON storage.objects;
CREATE POLICY "Users can upload their own profile covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own profile covers" ON storage.objects;
CREATE POLICY "Users can update their own profile covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own profile covers" ON storage.objects;
CREATE POLICY "Users can delete their own profile covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-covers' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view profile covers" ON storage.objects;
CREATE POLICY "Public can view profile covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-covers');

-- ===== CARD IMAGES BUCKET =====
DROP POLICY IF EXISTS "Users can upload their own card images" ON storage.objects;
CREATE POLICY "Users can upload their own card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own card images" ON storage.objects;
CREATE POLICY "Users can update their own card images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own card images" ON storage.objects;
CREATE POLICY "Users can delete their own card images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'card-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view card images" ON storage.objects;
CREATE POLICY "Public can view card images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');

-- ===== FORM BACKGROUNDS BUCKET =====
DROP POLICY IF EXISTS "Users can upload form background images" ON storage.objects;
CREATE POLICY "Users can upload form background images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'form-backgrounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own form background images" ON storage.objects;
CREATE POLICY "Users can update their own form background images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'form-backgrounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own form background images" ON storage.objects;
CREATE POLICY "Users can delete their own form background images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'form-backgrounds' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Public can view form background images" ON storage.objects;
CREATE POLICY "Public can view form background images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-backgrounds');

RAISE NOTICE 'PARTE 9: Storage buckets configurados ✓';

-- =====================================================
-- PARTE 10: OTIMIZAÇÕES DE PERFORMANCE
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

RAISE NOTICE 'PARTE 10: Otimizações de performance configuradas ✓';

-- =====================================================
-- PARTE 11: VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    tables_count INTEGER;
    functions_count INTEGER;
    triggers_count INTEGER;
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
        'admin_delete_user', 'generate_slug', 'generate_unique_slug',
        'update_updated_at_column', 'refresh_cards_metrics',
        'refresh_forms_metrics'
    );
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'SETUP COMPLETO ✓';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tabelas criadas: %', tables_count;
    RAISE NOTICE 'Funções criadas: %', functions_count;
    RAISE NOTICE 'Storage buckets: 4 (avatars, profile-covers, card-images, form-backgrounds)';
    RAISE NOTICE 'Materialized views: 2 (cards_with_metrics, forms_with_metrics)';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'O banco de dados está pronto para uso!';
    RAISE NOTICE '================================================';
END $$;
