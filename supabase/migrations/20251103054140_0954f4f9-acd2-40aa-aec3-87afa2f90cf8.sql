-- Add slug column to link_lists table
ALTER TABLE link_lists 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_lists_slug ON link_lists(slug);

-- Generate slugs for existing records (if any)
UPDATE link_lists
SET slug = generate_unique_slug(
  generate_slug(title) || '-' || substring(id::text, 1, 8),
  id
)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE link_lists 
ALTER COLUMN slug SET NOT NULL;

-- Update RLS policy to allow public access to active lists by slug
CREATE POLICY "Public can view active lists by slug"
ON link_lists
FOR SELECT
USING (is_active = true);

-- Update RLS policy to allow public access to items of active lists
CREATE POLICY "Public can view items of active lists"
ON list_items
FOR SELECT
USING (
  list_id IN (
    SELECT id FROM link_lists WHERE is_active = true
  )
);