-- Adicionar política RLS para permitir acesso público a formulários ativos
CREATE POLICY "Public can view active form configs by slug"
  ON form_configs FOR SELECT
  TO public
  USING (is_active = true);