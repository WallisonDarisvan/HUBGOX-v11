-- Corrigir índice único para permitir multi-tenancy nos slugs
-- Remove o índice único global que impede diferentes usuários de terem o mesmo slug
DROP INDEX IF EXISTS public.idx_form_configs_slug;

-- Cria índice único composto (user_id + slug)
-- Permite que diferentes usuários tenham o mesmo slug, mas cada usuário não pode ter slugs duplicados
CREATE UNIQUE INDEX idx_form_configs_user_slug 
ON public.form_configs (user_id, slug);