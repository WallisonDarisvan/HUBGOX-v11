-- Adicionar coluna email na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar função para buscar emails de usuários autenticados (apenas para admins)
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem visualizar emails';
  END IF;
  
  -- Retornar emails dos usuários
  RETURN QUERY
  SELECT id, auth.users.email
  FROM auth.users;
END;
$$;

-- Criar função para sincronizar email do auth.users para profiles
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar email no profile quando houver alteração em auth.users
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para sincronizar email automaticamente
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Sincronizar emails existentes
UPDATE public.profiles p
SET email = (
  SELECT email 
  FROM auth.users u 
  WHERE u.id = p.id
)
WHERE p.email IS NULL;