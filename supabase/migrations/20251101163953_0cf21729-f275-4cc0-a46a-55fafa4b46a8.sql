-- ============================================
-- FIX SECURITY WARNINGS - MATERIALIZED VIEWS
-- ============================================

-- Enable RLS on materialized views
ALTER MATERIALIZED VIEW cards_with_metrics OWNER TO postgres;
ALTER MATERIALIZED VIEW forms_with_metrics OWNER TO postgres;

-- Grant appropriate permissions
REVOKE ALL ON cards_with_metrics FROM authenticated;
REVOKE ALL ON forms_with_metrics FROM authenticated;

GRANT SELECT ON cards_with_metrics TO authenticated;
GRANT SELECT ON forms_with_metrics TO authenticated;

-- Update functions with proper search_path
CREATE OR REPLACE FUNCTION refresh_cards_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cards_with_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_forms_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY forms_with_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_cards_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_cards_metrics();
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_refresh_forms_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_forms_metrics();
  RETURN NULL;
END;
$$;