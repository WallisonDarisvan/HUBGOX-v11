-- Create security definer function to get public list by slug
CREATE OR REPLACE FUNCTION public.get_public_list(p_username TEXT, p_slug TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  is_active BOOLEAN,
  slug TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ll.id,
    ll.user_id,
    ll.title,
    ll.description,
    ll.is_active,
    ll.slug,
    ll.created_at,
    ll.updated_at
  FROM link_lists ll
  JOIN profiles p ON p.id = ll.user_id
  WHERE p.username = p_username
    AND ll.slug = p_slug
    AND ll.is_active = true;
$$;