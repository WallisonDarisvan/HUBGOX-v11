-- Criar tabela de definições de planos
CREATE TABLE plan_definitions (
  plan_id TEXT PRIMARY KEY,
  plan_name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2) DEFAULT 0.00,
  
  -- Limites de recursos
  limit_profiles INT DEFAULT 1 NOT NULL,
  limit_cards INT DEFAULT 5 NOT NULL,
  limit_forms INT DEFAULT 0 NOT NULL,
  limit_lists INT DEFAULT 0 NOT NULL,
  
  -- Feature flags
  allow_video_bg BOOLEAN DEFAULT false NOT NULL,
  allow_admin_mode BOOLEAN DEFAULT false NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plan_definitions_updated_at
  BEFORE UPDATE ON plan_definitions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE plan_definitions ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode ler os planos (para página de pricing)
CREATE POLICY "Anyone can view plan definitions"
  ON plan_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Inserir os 4 planos
INSERT INTO plan_definitions 
  (plan_id, plan_name, price_monthly, limit_profiles, limit_cards, limit_forms, limit_lists, allow_video_bg, allow_admin_mode)
VALUES
  ('free', 'Plano Gratuito', 0, 1, 5, 0, 0, false, false),
  ('individual', 'Plano Individual', 29.90, 1, 10, 1, 1, true, false),
  ('agency', 'Plano Agência', 299.00, 20, 10, 10, 10, true, true),
  ('corporate', 'Plano Corporativo', 1000.00, 150, 20, 20, 20, true, true);

-- Criar tabela que vincula usuários aos planos
CREATE TABLE user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plan_definitions(plan_id) DEFAULT 'free',
  
  -- Stripe integration (futuro)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seu próprio plano
CREATE POLICY "Users can view own plan"
  ON user_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins podem ver planos de todos
CREATE POLICY "Admins can view all plans"
  ON user_plans FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Função para criar plano free automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan_id)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger que executa após criação de usuário
CREATE TRIGGER on_auth_user_created_set_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_plan();

-- Função para buscar limites do plano de um usuário
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(p_user_id UUID)
RETURNS TABLE(
  plan_id TEXT,
  plan_name TEXT,
  limit_profiles INT,
  limit_cards INT,
  limit_forms INT,
  limit_lists INT,
  allow_video_bg BOOLEAN,
  allow_admin_mode BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pd.plan_id,
    pd.plan_name,
    pd.limit_profiles,
    pd.limit_cards,
    pd.limit_forms,
    pd.limit_lists,
    pd.allow_video_bg,
    pd.allow_admin_mode
  FROM user_plans up
  JOIN plan_definitions pd ON pd.plan_id = up.plan_id
  WHERE up.user_id = p_user_id;
$$;