-- Create form_configs table to store form configuration
CREATE TABLE IF NOT EXISTS form_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Mentoria individual diretamente comigo.',
  description TEXT,
  quote TEXT,
  background_image TEXT,
  button_text TEXT NOT NULL DEFAULT 'Enviar formulário',
  button_color TEXT NOT NULL DEFAULT '#10b981',
  whatsapp_number TEXT,
  email_notification TEXT,
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_phone BOOLEAN NOT NULL DEFAULT true,
  show_email BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create form_submissions table to store form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_config_id UUID REFERENCES form_configs(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id ON form_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_config_id ON form_submissions(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);

-- Enable RLS
ALTER TABLE form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_configs
-- Users can view their own form configs
CREATE POLICY "Users can view their own form configs"
  ON form_configs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own form configs
CREATE POLICY "Users can insert their own form configs"
  ON form_configs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own form configs
CREATE POLICY "Users can update their own form configs"
  ON form_configs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own form configs
CREATE POLICY "Users can delete their own form configs"
  ON form_configs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can view active form configs (for public form pages)
CREATE POLICY "Anyone can view active form configs"
  ON form_configs FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for form_submissions
-- Anyone can insert form submissions (for public forms)
CREATE POLICY "Anyone can insert form submissions"
  ON form_submissions FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view submissions for their own forms
CREATE POLICY "Users can view their own form submissions"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (
    form_config_id IN (
      SELECT id FROM form_configs WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_form_configs_updated_at BEFORE UPDATE ON form_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
