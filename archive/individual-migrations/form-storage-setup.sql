-- Create storage bucket for form background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-backgrounds', 'form-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ⚠️ ATENÇÃO: POLÍTICAS RLS NÃO PODEM SER CRIADAS VIA SQL
-- =====================================================
-- 
-- As políticas RLS para storage.objects devem ser configuradas
-- através do Dashboard do Supabase.
--
-- 📋 Veja o arquivo STORAGE_POLICIES_SETUP.md para instruções
--    detalhadas sobre como configurar as políticas para o bucket
--    'form-backgrounds'.
--
-- =====================================================
