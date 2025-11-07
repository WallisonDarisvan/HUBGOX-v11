-- =====================================================
-- CORREÇÃO: Conflito entre trigger e accept_invitation
-- =====================================================
-- Problema: handle_new_user cria profile, depois accept_invitation
-- tenta criar outro profile com mesmo ID -> erro
-- Solução: handle_new_user não deve criar profile se for convite
-- =====================================================

-- Atualizar handle_new_user para detectar convites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_invitation_signup boolean;
BEGIN
  -- Verificar se é um signup via convite (tem username no metadata)
  is_invitation_signup := (NEW.raw_user_meta_data->>'username') IS NOT NULL;
  
  -- Se for signup via convite, NÃO criar profile aqui
  -- O accept_invitation vai cuidar disso
  IF is_invitation_signup THEN
    RETURN NEW;
  END IF;
  
  -- Se NÃO for convite, criar profile normalmente (cadastro direto)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, username, display_name, is_activated)
    VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1),
      split_part(NEW.email, '@', 1),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 
'Cria profile automaticamente para cadastros diretos. Para convites, deixa accept_invitation cuidar da criação.';