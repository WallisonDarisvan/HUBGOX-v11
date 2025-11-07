-- Add slug column to form_configs table
ALTER TABLE form_configs 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_configs_slug ON form_configs(slug);

-- Create function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, remove accents, replace non-alphanumeric with hyphens
  slug := lower(text_input);
  slug := translate(slug, 
    'áàâãäåéèêëíìîïóòôõöúùûüçñ', 
    'aaaaaaeeeeiiiioooooouuuucn');
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT, form_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  final_slug := base_slug;
  
  LOOP
    -- Check if slug exists for a different form
    IF form_id IS NULL THEN
      SELECT EXISTS(SELECT 1 FROM form_configs WHERE slug = final_slug) INTO slug_exists;
    ELSE
      SELECT EXISTS(SELECT 1 FROM form_configs WHERE slug = final_slug AND id != form_id) INTO slug_exists;
    END IF;
    
    EXIT WHEN NOT slug_exists;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing records (if any)
UPDATE form_configs
SET slug = generate_unique_slug(
  generate_slug(title) || '-' || substring(id::text, 1, 8),
  id
)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE form_configs 
ALTER COLUMN slug SET NOT NULL;
