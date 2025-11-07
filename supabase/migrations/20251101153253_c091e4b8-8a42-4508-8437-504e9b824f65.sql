-- Add new columns for confirmation button control
ALTER TABLE form_configs
ADD COLUMN IF NOT EXISTS show_confirmation_button BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS confirmation_button_action TEXT DEFAULT 'reset',
ADD COLUMN IF NOT EXISTS confirmation_button_link TEXT,
ADD COLUMN IF NOT EXISTS confirmation_button_form_id UUID;

-- Add check constraint for confirmation_button_action
ALTER TABLE form_configs
ADD CONSTRAINT check_confirmation_button_action 
CHECK (confirmation_button_action IN ('reset', 'external_link', 'other_form'));