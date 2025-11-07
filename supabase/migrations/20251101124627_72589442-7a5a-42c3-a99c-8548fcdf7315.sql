-- Add form_position column to form_configs table
ALTER TABLE public.form_configs 
ADD COLUMN form_position TEXT DEFAULT 'middle-center';

COMMENT ON COLUMN public.form_configs.form_position IS 'Position of the form on screen: top-left, top-center, top-right, middle-left, middle-center, middle-right, bottom-left, bottom-center, bottom-right';

-- Drop and recreate the get_public_form_config function to include form_position
DROP FUNCTION IF EXISTS public.get_public_form_config(text);

CREATE FUNCTION public.get_public_form_config(form_slug text)
RETURNS TABLE(
  id uuid, 
  slug text, 
  title text, 
  description text, 
  quote text, 
  background_image text, 
  button_text text, 
  button_color text, 
  show_name boolean, 
  show_phone boolean, 
  show_email boolean, 
  is_active boolean,
  form_position text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.slug,
    fc.title,
    fc.description,
    fc.quote,
    fc.background_image,
    fc.button_text,
    fc.button_color,
    fc.show_name,
    fc.show_phone,
    fc.show_email,
    fc.is_active,
    fc.form_position
  FROM form_configs fc
  WHERE fc.slug = form_slug 
    AND fc.is_active = true;
END;
$function$;