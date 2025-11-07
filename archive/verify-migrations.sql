-- =====================================================
-- MIGRATION VERIFICATION SCRIPT
-- =====================================================
-- Execute este script para verificar se todas as
-- migrações foram aplicadas corretamente
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
  v_missing TEXT := '';
  v_all_good BOOLEAN := true;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INICIANDO VERIFICAÇÃO DE MIGRAÇÕES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR TABELAS
  -- ============================================
  RAISE NOTICE '1. Verificando Tabelas...';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ profiles' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ profiles';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_roles';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ user_roles' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ user_roles';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'cards';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ cards' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ cards';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_configs';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ form_configs' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ form_configs';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'form_submissions';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ form_submissions' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ form_submissions';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_invitations';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ user_invitations' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ user_invitations';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'card_clicks';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ card_clicks' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ card_clicks';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profile_views';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ profile_views' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ profile_views';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR MATERIALIZED VIEWS
  -- ============================================
  RAISE NOTICE '2. Verificando Materialized Views...';
  
  SELECT COUNT(*) INTO v_count FROM pg_matviews 
  WHERE schemaname = 'public' AND matviewname = 'cards_with_metrics';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ cards_with_metrics' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ cards_with_metrics';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_matviews 
  WHERE schemaname = 'public' AND matviewname = 'forms_with_metrics';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ forms_with_metrics' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ forms_with_metrics';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR FUNÇÕES
  -- ============================================
  RAISE NOTICE '3. Verificando Funções...';
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'has_role';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ has_role()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ has_role()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'validate_invitation_token';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ validate_invitation_token()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ validate_invitation_token()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'accept_invitation';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ accept_invitation()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ accept_invitation()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ handle_new_user()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ handle_new_user()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'handle_new_user_role';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ handle_new_user_role()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ handle_new_user_role()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'admin_delete_user';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ admin_delete_user()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ admin_delete_user()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'refresh_cards_metrics';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ refresh_cards_metrics()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ refresh_cards_metrics()';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'refresh_forms_metrics';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ refresh_forms_metrics()' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ refresh_forms_metrics()';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR TRIGGERS
  -- ============================================
  RAISE NOTICE '4. Verificando Triggers...';
  
  SELECT COUNT(*) INTO v_count FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created_profile';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ on_auth_user_created_profile' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ on_auth_user_created_profile';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created_role';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ on_auth_user_created_role' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ on_auth_user_created_role';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR STORAGE BUCKETS
  -- ============================================
  RAISE NOTICE '5. Verificando Storage Buckets...';
  
  SELECT COUNT(*) INTO v_count FROM storage.buckets WHERE id = 'avatars';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ avatars bucket' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ avatars bucket';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM storage.buckets WHERE id = 'profile-covers';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ profile-covers bucket' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ profile-covers bucket';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM storage.buckets WHERE id = 'card-images';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ card-images bucket' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ card-images bucket';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM storage.buckets WHERE id = 'form-backgrounds';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ form-backgrounds bucket' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ form-backgrounds bucket';
  END IF;

  RAISE NOTICE '';

  -- ============================================
  -- VERIFICAR ÍNDICES CRÍTICOS
  -- ============================================
  RAISE NOTICE '6. Verificando Índices Críticos...';
  
  SELECT COUNT(*) INTO v_count FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname = 'idx_profiles_username';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ idx_profiles_username' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ idx_profiles_username';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname = 'idx_form_configs_slug';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ idx_form_configs_slug' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ idx_form_configs_slug';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname = 'idx_cards_user_status';
  IF v_count = 0 THEN 
    v_missing := v_missing || '  ❌ idx_cards_user_status' || E'\n';
    v_all_good := false;
  ELSE
    RAISE NOTICE '  ✅ idx_cards_user_status';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  IF v_all_good THEN
    RAISE NOTICE '✅ TODAS AS MIGRAÇÕES ESTÃO APLICADAS!';
  ELSE
    RAISE NOTICE '❌ MIGRAÇÕES FALTANDO:';
    RAISE NOTICE '%', v_missing;
    RAISE NOTICE '';
    RAISE NOTICE 'Execute as migrações faltantes na ordem correta.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
