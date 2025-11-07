-- Policy: Admins can upload any form background
CREATE POLICY "Admins can upload any form background"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-backgrounds' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update any form background
CREATE POLICY "Admins can update any form background"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'form-backgrounds' AND
  public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete any form background
CREATE POLICY "Admins can delete any form background"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'form-backgrounds' AND
  public.has_role(auth.uid(), 'admin')
);