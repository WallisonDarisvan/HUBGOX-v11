-- =====================================================
-- FIX: Hide materialized views from public API and add form submission validation
-- =====================================================

-- 1. Hide materialized views by moving to internal schema
CREATE SCHEMA IF NOT EXISTS internal;

-- Move materialized views to internal schema (drop and recreate)
DROP MATERIALIZED VIEW IF EXISTS public.cards_with_metrics;
DROP MATERIALIZED VIEW IF EXISTS public.forms_with_metrics;

-- Recreate in internal schema
CREATE MATERIALIZED VIEW internal.cards_with_metrics AS
SELECT 
    c.*,
    COUNT(DISTINCT cc.id) as click_count,
    COUNT(DISTINCT DATE(cc.clicked_at)) as unique_days_clicked
FROM public.cards c
LEFT JOIN public.card_clicks cc ON c.id = cc.card_id
GROUP BY c.id;

CREATE MATERIALIZED VIEW internal.forms_with_metrics AS
SELECT 
    fc.*,
    COUNT(DISTINCT fs.id) as submission_count,
    COUNT(DISTINCT DATE(fs.submitted_at)) as unique_days_submitted
FROM public.form_configs fc
LEFT JOIN public.form_submissions fs ON fc.id = fs.form_config_id
GROUP BY fc.id;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_cards_with_metrics_id ON internal.cards_with_metrics(id);
CREATE UNIQUE INDEX idx_forms_with_metrics_id ON internal.forms_with_metrics(id);

-- Update refresh functions to use new schema
CREATE OR REPLACE FUNCTION public.refresh_cards_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY internal.cards_with_metrics;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_forms_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY internal.forms_with_metrics;
END;
$function$;

-- 2. Add trigger for form submission validation
CREATE OR REPLACE FUNCTION public.validate_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  field_key text;
  field_value text;
  custom_fields_size int;
BEGIN
  -- Validate custom_fields size (max 50KB)
  custom_fields_size := length(NEW.custom_fields::text);
  IF custom_fields_size > 51200 THEN
    RAISE EXCEPTION 'Custom fields data too large: % bytes (max 50KB)', custom_fields_size;
  END IF;
  
  -- Validate each custom field has reasonable length
  IF NEW.custom_fields IS NOT NULL THEN
    FOR field_key, field_value IN SELECT * FROM jsonb_each_text(NEW.custom_fields)
    LOOP
      -- Check individual field length (max 10KB per field)
      IF length(field_value) > 10240 THEN
        RAISE EXCEPTION 'Field "%" is too large: % bytes (max 10KB)', field_key, length(field_value);
      END IF;
    END LOOP;
  END IF;
  
  -- Validate standard fields lengths
  IF NEW.name IS NOT NULL AND length(NEW.name) > 255 THEN
    RAISE EXCEPTION 'Name is too long (max 255 characters)';
  END IF;
  
  IF NEW.email IS NOT NULL AND length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email is too long (max 255 characters)';
  END IF;
  
  IF NEW.phone IS NOT NULL AND length(NEW.phone) > 50 THEN
    RAISE EXCEPTION 'Phone is too long (max 50 characters)';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add trigger to form_submissions
DROP TRIGGER IF EXISTS validate_form_submission_trigger ON public.form_submissions;
CREATE TRIGGER validate_form_submission_trigger
  BEFORE INSERT OR UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_form_submission();

-- Add comment
COMMENT ON FUNCTION public.validate_form_submission() IS 'Server-side validation for form submissions: validates field lengths and custom_fields JSONB size to prevent storage exhaustion and malformed data.';