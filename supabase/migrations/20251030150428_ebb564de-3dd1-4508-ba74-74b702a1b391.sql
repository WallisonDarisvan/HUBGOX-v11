-- Drop the policy that exposes sensitive contact information to the public
DROP POLICY IF EXISTS "Anyone can view active form configs" ON form_configs;

-- Create a secure RPC function that returns only safe public fields for forms
CREATE OR REPLACE FUNCTION public.get_public_form_config(form_slug text)
RETURNS TABLE (
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
  is_active boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return only safe fields without sensitive contact information
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
    fc.is_active
  FROM form_configs fc
  WHERE fc.slug = form_slug 
    AND fc.is_active = true;
END;
$$;

-- Grant execute permission to anonymous users for the public form function
GRANT EXECUTE ON FUNCTION public.get_public_form_config(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_form_config(text) TO authenticated;