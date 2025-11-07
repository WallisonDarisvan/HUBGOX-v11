-- Create function to get cards with metrics for a user
CREATE OR REPLACE FUNCTION public.get_user_cards_with_metrics(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  link_url text,
  image_url text,
  status boolean,
  sort_order integer,
  user_id uuid,
  form_config_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  clicks_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $$
BEGIN
  -- Verify user has access to their own data or is admin
  IF NOT (auth.uid() = p_user_id OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    cwm.id,
    cwm.title,
    cwm.link_url,
    cwm.image_url,
    cwm.status,
    cwm.sort_order,
    cwm.user_id,
    cwm.form_config_id,
    cwm.created_at,
    cwm.updated_at,
    cwm.click_count as clicks_count
  FROM internal.cards_with_metrics cwm
  WHERE cwm.user_id = p_user_id
  ORDER BY cwm.sort_order ASC;
END;
$$;