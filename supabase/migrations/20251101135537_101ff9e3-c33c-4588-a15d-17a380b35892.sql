-- Create form_fields table to store custom form fields
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_config_id UUID REFERENCES form_configs(id) ON DELETE CASCADE NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'textarea', 'number', 'select', 'checkbox', 'radio')),
  label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  options TEXT[], -- For select, radio, checkbox types
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_fields_form_config_id ON form_fields(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_sort_order ON form_fields(form_config_id, sort_order);

-- Enable RLS
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_fields
-- Users can view fields for their own forms
CREATE POLICY "Users can view their own form fields"
  ON form_fields FOR SELECT
  TO authenticated
  USING (
    form_config_id IN (
      SELECT id FROM form_configs WHERE user_id = auth.uid()
    )
  );

-- Users can insert fields for their own forms
CREATE POLICY "Users can insert their own form fields"
  ON form_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    form_config_id IN (
      SELECT id FROM form_configs WHERE user_id = auth.uid()
    )
  );

-- Users can update fields for their own forms
CREATE POLICY "Users can update their own form fields"
  ON form_fields FOR UPDATE
  TO authenticated
  USING (
    form_config_id IN (
      SELECT id FROM form_configs WHERE user_id = auth.uid()
    )
  );

-- Users can delete fields for their own forms
CREATE POLICY "Users can delete their own form fields"
  ON form_fields FOR DELETE
  TO authenticated
  USING (
    form_config_id IN (
      SELECT id FROM form_configs WHERE user_id = auth.uid()
    )
  );

-- Anyone can view fields for active forms (for public form pages)
CREATE POLICY "Anyone can view active form fields"
  ON form_fields FOR SELECT
  TO public
  USING (
    form_config_id IN (
      SELECT id FROM form_configs WHERE is_active = true
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can view all form fields"
  ON form_fields FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert form fields"
  ON form_fields FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all form fields"
  ON form_fields FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all form fields"
  ON form_fields FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update form_submissions to store custom field data
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;