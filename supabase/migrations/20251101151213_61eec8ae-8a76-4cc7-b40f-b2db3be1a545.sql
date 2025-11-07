-- Add button action fields to form_configs table
ALTER TABLE form_configs
ADD COLUMN IF NOT EXISTS button_action TEXT DEFAULT 'confirmation',
ADD COLUMN IF NOT EXISTS external_link_url TEXT DEFAULT NULL;

-- Add check constraint to ensure button_action is valid
ALTER TABLE form_configs
ADD CONSTRAINT valid_button_action CHECK (button_action IN ('confirmation', 'external_link'));