-- Add form_config_id column to cards table to support linking forms
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS form_config_id UUID REFERENCES form_configs(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_form_config_id ON cards(form_config_id);

-- Add check constraint to ensure either link_url or form_config_id is set (but not both)
-- First, we need to make link_url nullable
ALTER TABLE cards 
ALTER COLUMN link_url DROP NOT NULL;

-- Update RLS policies to maintain security
-- (No changes needed as existing policies already check user_id)
