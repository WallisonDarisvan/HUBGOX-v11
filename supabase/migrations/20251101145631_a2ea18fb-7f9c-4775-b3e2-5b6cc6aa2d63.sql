-- Remove unique constraint on slug (if exists) and add composite unique constraint
DROP INDEX IF EXISTS idx_form_configs_slug;

-- Create composite unique index on (user_id, slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_configs_user_slug ON form_configs(user_id, slug);