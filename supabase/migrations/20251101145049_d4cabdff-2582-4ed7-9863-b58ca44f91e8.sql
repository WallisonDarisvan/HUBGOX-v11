-- Remove the unique constraint on user_id to allow multiple forms per user
ALTER TABLE form_configs DROP CONSTRAINT IF EXISTS form_configs_user_id_key;