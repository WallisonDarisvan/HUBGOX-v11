-- =====================================================
-- ROLLBACK: Complete Database Setup
-- =====================================================
-- ATENÇÃO: Este script irá REMOVER TODAS as tabelas,
--          funções, triggers e dados do sistema!
-- =====================================================
-- Use apenas se precisar fazer um reset completo
-- =====================================================

-- Desabilitar triggers temporariamente
SET session_replication_role = 'replica';

-- =====================================================
-- PARTE 1: REMOVER MATERIALIZED VIEWS
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS cards_with_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS forms_with_metrics CASCADE;

RAISE NOTICE 'Materialized views removidas ✓';

-- =====================================================
-- PARTE 2: REMOVER TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS update_form_configs_updated_at ON form_configs;
DROP TRIGGER IF EXISTS refresh_cards_on_card_change ON public.cards;
DROP TRIGGER IF EXISTS refresh_cards_on_click ON public.card_clicks;
DROP TRIGGER IF EXISTS refresh_forms_on_config_change ON public.form_configs;
DROP TRIGGER IF EXISTS refresh_forms_on_submission ON public.form_submissions;

RAISE NOTICE 'Triggers removidos ✓';

-- =====================================================
-- PARTE 3: REMOVER FUNÇÕES
-- =====================================================

DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.handle_new_user_role();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.validate_invitation_token(uuid);
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
DROP FUNCTION IF EXISTS generate_slug(text);
DROP FUNCTION IF EXISTS generate_unique_slug(text, uuid);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS refresh_cards_metrics();
DROP FUNCTION IF EXISTS refresh_forms_metrics();
DROP FUNCTION IF EXISTS trigger_refresh_cards_metrics();
DROP FUNCTION IF EXISTS trigger_refresh_forms_metrics();

RAISE NOTICE 'Funções removidas ✓';

-- =====================================================
-- PARTE 4: REMOVER TABELAS (ordem reversa de dependência)
-- =====================================================

DROP TABLE IF EXISTS public.card_clicks CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.form_submissions CASCADE;
DROP TABLE IF EXISTS public.form_fields CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.form_configs CASCADE;
DROP TABLE IF EXISTS public.user_invitations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

RAISE NOTICE 'Tabelas removidas ✓';

-- =====================================================
-- PARTE 5: REMOVER STORAGE BUCKETS E POLICIES
-- =====================================================

-- Remover policies de storage
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own profile covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile covers" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own card images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view card images" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload form background images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own form background images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own form background images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view form background images" ON storage.objects;

-- Deletar buckets (cuidado: isso remove todos os arquivos!)
DELETE FROM storage.buckets WHERE id IN ('avatars', 'profile-covers', 'card-images', 'form-backgrounds');

RAISE NOTICE 'Storage buckets e policies removidos ✓';

-- =====================================================
-- PARTE 6: REMOVER ENUM TYPES
-- =====================================================

DROP TYPE IF EXISTS public.app_role CASCADE;

RAISE NOTICE 'Enum types removidos ✓';

-- =====================================================
-- PARTE 7: REABILITAR TRIGGERS
-- =====================================================

SET session_replication_role = 'origin';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    remaining_tables INTEGER;
    remaining_functions INTEGER;
BEGIN
    -- Contar tabelas restantes relacionadas ao sistema
    SELECT COUNT(*) INTO remaining_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'user_roles', 'profiles', 'user_invitations',
        'form_configs', 'form_fields', 'form_submissions',
        'cards', 'profile_views', 'card_clicks'
    );
    
    -- Contar funções restantes relacionadas ao sistema
    SELECT COUNT(*) INTO remaining_functions
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
    RAISE NOTICE 'ROLLBACK COMPLETO ✓';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tabelas restantes: %', remaining_tables;
    RAISE NOTICE 'Funções restantes: %', remaining_functions;
    RAISE NOTICE '================================================';
    
    IF remaining_tables = 0 AND remaining_functions = 0 THEN
        RAISE NOTICE 'Rollback executado com sucesso!';
        RAISE NOTICE 'O banco foi completamente limpo.';
    ELSE
        RAISE WARNING 'Atenção: Alguns objetos podem não ter sido removidos.';
        RAISE WARNING 'Verifique manualmente se necessário.';
    END IF;
    
    RAISE NOTICE '================================================';
END $$;
