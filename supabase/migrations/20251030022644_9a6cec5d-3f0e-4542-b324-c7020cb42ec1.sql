-- =====================================================
-- FASE 1: CORREÇÕES EMERGENCIAIS - Sistema Unificado de Perfis
-- =====================================================

-- 1.1 Adicionar coluna is_activated (se já não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT true;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_activated 
ON public.profiles(is_activated);

CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON public.profiles(username);

CREATE INDEX IF NOT EXISTS idx_user_invitations_profile_id 
ON public.user_invitations(profile_id);

-- 1.2 Atualizar função validate_invitation_token
DROP FUNCTION IF EXISTS public.validate_invitation_token(uuid);

CREATE FUNCTION public.validate_invitation_token(token uuid)
RETURNS TABLE (
  invitation_id uuid,
  profile_id uuid,
  username text,
  display_name text,
  email text
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
    AND i.expires_at > now();
END;
$$;

-- 1.3 Atualizar função accept_invitation
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

CREATE FUNCTION public.accept_invitation(
  token uuid,
  user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_invitation_id uuid;
BEGIN
  -- Buscar profile_id do convite
  SELECT 
    i.profile_id,
    i.id
  INTO 
    v_profile_id,
    v_invitation_id
  FROM public.user_invitations i
  WHERE i.invitation_token = token
    AND i.status = 'pending'
    AND i.expires_at > now();
  
  IF v_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Atualizar o profile existente com o user_id e marcar como ativado
  UPDATE public.profiles
  SET id = user_id,
      is_activated = true
  WHERE id = v_profile_id;
  
  -- Marcar convite como aceito
  UPDATE public.user_invitations
  SET status = 'accepted',
      accepted_at = now(),
      linked_profile_id = user_id,
      profile_id = user_id
  WHERE id = v_invitation_id;
  
  RETURN true;
END;
$$;

-- 1.4 Corrigir RLS Policies de profiles
-- Remover policies duplicadas
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Manter: "Public profiles are viewable by everyone" (já permite anon ver tudo)
-- Vamos atualizar para verificar is_activated
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public can view activated profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (is_activated = true);

-- Usuários autenticados podem ver próprio perfil (mesmo se não ativado)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins podem ver todos (já existe "Admins can view all profiles")

-- 1.5 Adicionar Foreign Keys com ON DELETE
-- cards.form_config_id
DO $$
BEGIN
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_form_config_id_fkey;
  ALTER TABLE cards ADD CONSTRAINT cards_form_config_id_fkey 
    FOREIGN KEY (form_config_id) REFERENCES form_configs(id) 
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- cards.user_id -> profiles(id)
DO $$
BEGIN
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
  ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- form_configs.user_id -> profiles(id)
DO $$
BEGIN
  ALTER TABLE form_configs DROP CONSTRAINT IF EXISTS form_configs_user_id_fkey;
  ALTER TABLE form_configs ADD CONSTRAINT form_configs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 1.6 Storage Policies
-- card-images: Users podem fazer upload apenas em sua pasta
DROP POLICY IF EXISTS "Users can upload to own folder in card-images" ON storage.objects;
CREATE POLICY "Users can upload to own folder in card-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'card-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- avatars: Users podem fazer upload apenas em sua pasta
DROP POLICY IF EXISTS "Users can upload to own folder in avatars" ON storage.objects;
CREATE POLICY "Users can upload to own folder in avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- profile-covers: Users podem fazer upload apenas em sua pasta
DROP POLICY IF EXISTS "Users can upload to own folder in profile-covers" ON storage.objects;
CREATE POLICY "Users can upload to own folder in profile-covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- form-backgrounds: Users podem fazer upload apenas em sua pasta
DROP POLICY IF EXISTS "Users can upload to own folder in form-backgrounds" ON storage.objects;
CREATE POLICY "Users can upload to own folder in form-backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-backgrounds' AND
  (storage.foldername(name))[1] = auth.uid()::text
);