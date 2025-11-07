-- Add columns to identify standard fields in form_fields table
ALTER TABLE public.form_fields 
ADD COLUMN is_standard_field boolean DEFAULT false NOT NULL,
ADD COLUMN standard_field_type text;