-- Add confirmation fields to form_configs table
ALTER TABLE form_configs
ADD COLUMN IF NOT EXISTS confirmation_title TEXT DEFAULT 'Formulário enviado!',
ADD COLUMN IF NOT EXISTS confirmation_message TEXT DEFAULT 'Obrigado pelo seu contato. Retornaremos em breve.',
ADD COLUMN IF NOT EXISTS confirmation_button_text TEXT DEFAULT 'Enviar outro formulário';