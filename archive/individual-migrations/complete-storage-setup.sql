-- =====================================================
-- COMPLETE STORAGE BUCKETS SETUP
-- =====================================================
-- Cria todos os buckets necessários
-- =====================================================
-- ⚠️ IMPORTANTE: As políticas RLS devem ser configuradas
--    manualmente através do Dashboard do Supabase.
--    Veja o arquivo STORAGE_POLICIES_SETUP.md
-- =====================================================

-- ============================================
-- BUCKET: avatars
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BUCKET: profile-covers
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-covers', 'profile-covers', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BUCKET: card-images
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BUCKET: form-backgrounds
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-backgrounds', 'form-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets criados com sucesso!';
  RAISE NOTICE 'Buckets criados: avatars, profile-covers, card-images, form-backgrounds';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA:';
  RAISE NOTICE 'Configure as políticas RLS via Dashboard do Supabase';
  RAISE NOTICE 'Veja o arquivo STORAGE_POLICIES_SETUP.md para instruções detalhadas';
END $$;
