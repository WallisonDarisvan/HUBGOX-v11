-- Policy: Admins can upload any avatar
CREATE POLICY "Admins can upload any avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update any avatar
CREATE POLICY "Admins can update any avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete any avatar
CREATE POLICY "Admins can delete any avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can upload any profile cover
CREATE POLICY "Admins can upload any profile cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update any profile cover
CREATE POLICY "Admins can update any profile cover"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete any profile cover
CREATE POLICY "Admins can delete any profile cover"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-covers' AND
  public.has_role(auth.uid(), 'admin')
);