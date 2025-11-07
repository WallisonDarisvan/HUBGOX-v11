-- =====================================================
-- FIX: Security warnings - Function search_path and extensions
-- =====================================================

-- 1. Fix basic_unaccent function (add search_path)
CREATE OR REPLACE FUNCTION public.basic_unaccent(text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN translate(lower($1),
    'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÇçÑñ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn');
END;
$function$;

-- 2. Fix generate_slug function (add search_path)
CREATE OR REPLACE FUNCTION public.generate_slug(text_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 3. Fix generate_unique_slug function (add search_path)
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug text, form_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 4. Fix update_updated_at_column function (add search_path)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 5. Move unaccent extension from public to extensions schema
-- First create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate unaccent in extensions schema
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- 6. Hide materialized views from API by revoking public access
REVOKE ALL ON public.cards_with_metrics FROM anon, authenticated;
REVOKE ALL ON public.forms_with_metrics FROM anon, authenticated;

-- Grant access only to authenticated users via specific policies
GRANT SELECT ON public.cards_with_metrics TO authenticated;
GRANT SELECT ON public.forms_with_metrics TO authenticated;

-- Add comment explaining why these are restricted
COMMENT ON MATERIALIZED VIEW public.cards_with_metrics IS 'Performance optimization view. Access restricted to authenticated users only.';
COMMENT ON MATERIALIZED VIEW public.forms_with_metrics IS 'Performance optimization view. Access restricted to authenticated users only.';