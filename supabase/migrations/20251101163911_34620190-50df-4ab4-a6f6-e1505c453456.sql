-- ============================================
-- PERFORMANCE OPTIMIZATION SQL
-- Database views, indices, and optimizations
-- ============================================

-- ============================================
-- SECTION 1: DROP EXISTING VIEWS IF EXISTS
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS cards_with_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS forms_with_metrics CASCADE;

-- ============================================
-- SECTION 2: CREATE OPTIMIZED INDICES
-- ============================================

-- Cards indices
CREATE INDEX IF NOT EXISTS idx_cards_user_status ON cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cards_sort_order ON cards(user_id, sort_order);

-- Card clicks indices
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id ON card_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_created_at ON card_clicks(clicked_at);

-- Form configs indices
CREATE INDEX IF NOT EXISTS idx_form_configs_user_id ON form_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_form_configs_slug ON form_configs(slug);
CREATE INDEX IF NOT EXISTS idx_form_configs_active ON form_configs(user_id, is_active);

-- Form submissions indices
CREATE INDEX IF NOT EXISTS idx_form_submissions_config_id ON form_submissions(form_config_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);

-- Profile views indices
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(viewed_at);

-- Profiles indices
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- User roles indices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- ============================================
-- SECTION 3: CREATE MATERIALIZED VIEWS
-- ============================================

-- Materialized view for cards with click metrics
CREATE MATERIALIZED VIEW cards_with_metrics AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.link_url,
  c.image_url,
  c.status,
  c.sort_order,
  c.created_at,
  c.updated_at,
  COALESCE(COUNT(cc.id), 0) as clicks_count
FROM cards c
LEFT JOIN card_clicks cc ON c.id = cc.card_id
GROUP BY c.id, c.user_id, c.title, c.link_url, c.image_url, c.status, c.sort_order, c.created_at, c.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_cards_with_metrics_id ON cards_with_metrics(id);
CREATE INDEX idx_cards_with_metrics_user_id ON cards_with_metrics(user_id);

-- Materialized view for forms with submission counts
CREATE MATERIALIZED VIEW forms_with_metrics AS
SELECT 
  fc.id,
  fc.user_id,
  fc.title,
  fc.slug,
  fc.description,
  fc.is_active,
  fc.created_at,
  fc.updated_at,
  COALESCE(COUNT(fs.id), 0) as submissions_count
FROM form_configs fc
LEFT JOIN form_submissions fs ON fc.id = fs.form_config_id
GROUP BY fc.id, fc.user_id, fc.title, fc.slug, fc.description, fc.is_active, fc.created_at, fc.updated_at;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_forms_with_metrics_id ON forms_with_metrics(id);
CREATE INDEX idx_forms_with_metrics_user_id ON forms_with_metrics(user_id);

-- ============================================
-- SECTION 4: CREATE REFRESH FUNCTIONS
-- ============================================

-- Function to refresh cards metrics
CREATE OR REPLACE FUNCTION refresh_cards_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cards_with_metrics;
END;
$$;

-- Function to refresh forms metrics
CREATE OR REPLACE FUNCTION refresh_forms_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY forms_with_metrics;
END;
$$;

-- ============================================
-- SECTION 5: CREATE TRIGGERS FOR AUTO-REFRESH
-- ============================================

-- Trigger function to refresh cards metrics after changes
CREATE OR REPLACE FUNCTION trigger_refresh_cards_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh in background (non-blocking)
  PERFORM refresh_cards_metrics();
  RETURN NULL;
END;
$$;

-- Trigger function to refresh forms metrics after changes
CREATE OR REPLACE FUNCTION trigger_refresh_forms_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh in background (non-blocking)
  PERFORM refresh_forms_metrics();
  RETURN NULL;
END;
$$;

-- Create triggers for cards
DROP TRIGGER IF EXISTS trigger_cards_refresh ON cards;
CREATE TRIGGER trigger_cards_refresh
AFTER INSERT OR UPDATE OR DELETE ON cards
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_cards_metrics();

-- Create triggers for card_clicks
DROP TRIGGER IF EXISTS trigger_card_clicks_refresh ON card_clicks;
CREATE TRIGGER trigger_card_clicks_refresh
AFTER INSERT OR DELETE ON card_clicks
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_cards_metrics();

-- Create triggers for form_configs
DROP TRIGGER IF EXISTS trigger_forms_refresh ON form_configs;
CREATE TRIGGER trigger_forms_refresh
AFTER INSERT OR UPDATE OR DELETE ON form_configs
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_forms_metrics();

-- Create triggers for form_submissions
DROP TRIGGER IF EXISTS trigger_form_submissions_refresh ON form_submissions;
CREATE TRIGGER trigger_form_submissions_refresh
AFTER INSERT OR DELETE ON form_submissions
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_forms_metrics();

-- ============================================
-- SECTION 6: INITIAL REFRESH
-- ============================================

SELECT refresh_cards_metrics();
SELECT refresh_forms_metrics();

-- ============================================
-- SECTION 7: GRANT PERMISSIONS
-- ============================================

-- Grant select permissions on materialized views to authenticated users
GRANT SELECT ON cards_with_metrics TO authenticated;
GRANT SELECT ON forms_with_metrics TO authenticated;