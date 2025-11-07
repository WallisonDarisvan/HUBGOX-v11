-- =====================================================
-- STORAGE RLS POLICIES SETUP
-- =====================================================
-- Configura políticas RLS para todos os buckets de storage
-- Permite: leitura pública, upload/update/delete apenas pelo dono
-- =====================================================

-- ============================================
-- BUCKET: card-images
-- ============================================

-- Limpeza preventiva
DROP POLICY IF EXISTS "Public can view card-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to card-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update card-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from card-images" ON storage.objects;

-- SELECT: Leitura pública
CREATE POLICY "Public can view card-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');

-- INSERT: Upload apenas na pasta do próprio usuário
CREATE POLICY "Users can upload to card-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Atualização apenas na pasta do próprio usuário
CREATE POLICY "Users can update card-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Remoção apenas na pasta do próprio usuário
CREATE POLICY "Users can delete from card-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'card-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- BUCKET: avatars
-- ============================================

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from avatars" ON storage.objects;

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload to avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete from avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- BUCKET: profile-covers
-- ============================================

DROP POLICY IF EXISTS "Public can view profile-covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to profile-covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile-covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from profile-covers" ON storage.objects;

CREATE POLICY "Public can view profile-covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-covers');

CREATE POLICY "Users can upload to profile-covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update profile-covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete from profile-covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- BUCKET: form-backgrounds
-- ============================================

DROP POLICY IF EXISTS "Public can view form-backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to form-backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can update form-backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from form-backgrounds" ON storage.objects;

CREATE POLICY "Public can view form-backgrounds"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-backgrounds');

CREATE POLICY "Users can upload to form-backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update form-backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'form-backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'form-backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete from form-backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'form-backgrounds'
  AND auth.uid()::text = (storage.foldername(name))[1]
);