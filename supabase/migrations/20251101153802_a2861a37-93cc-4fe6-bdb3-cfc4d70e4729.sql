-- Add column for button action form navigation
ALTER TABLE form_configs
ADD COLUMN IF NOT EXISTS button_action_form_id UUID;

-- Update check constraint to include other_form option
ALTER TABLE form_configs
DROP CONSTRAINT IF EXISTS check_button_action;

ALTER TABLE form_configs
ADD CONSTRAINT check_button_action 
CHECK (button_action IN ('confirmation', 'external_link', 'other_form'));