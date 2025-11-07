-- =====================================================
-- MIGRATION: Complete System Fix
-- Adds missing columns, triggers, and materialized views
-- =====================================================

-- ===================
-- STEP 1: Add missing columns to profiles table
-- ===================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_phrase TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS spotify_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_url TEXT,
ADD COLUMN IF NOT EXISTS footer_text_primary TEXT,
ADD COLUMN IF NOT EXISTS footer_text_secondary TEXT,
ADD COLUMN IF NOT EXISTS show_verified_badge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_avatar BOOLEAN DEFAULT true;

-- ===================
-- STEP 2: Create Materialized Views for Performance
-- ===================

-- Drop existing materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS public.cards_with_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.forms_with_metrics CASCADE;

-- Create cards_with_metrics materialized view
CREATE MATERIALIZED VIEW public.cards_with_metrics AS
SELECT 
    c.*,
    COALESCE(cc.click_count, 0) AS click_count
FROM public.cards c
LEFT JOIN (
    SELECT card_id, COUNT(*) AS click_count
    FROM public.card_clicks
    GROUP BY card_id
) cc ON c.id = cc.card_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_cards_with_metrics_id ON public.cards_with_metrics(id);

-- Create forms_with_metrics materialized view
CREATE MATERIALIZED VIEW public.forms_with_metrics AS
SELECT 
    fc.*,
    COALESCE(fs.submission_count, 0) AS submission_count
FROM public.form_configs fc
LEFT JOIN (
    SELECT form_config_id, COUNT(*) AS submission_count
    FROM public.form_submissions
    GROUP BY form_config_id
) fs ON fc.id = fs.form_config_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_forms_with_metrics_id ON public.forms_with_metrics(id);

-- ===================
-- STEP 3: Recreate Missing Triggers
-- ===================

-- Trigger: Auto-assign 'user' role on signup
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- Trigger: Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Sync email between auth.users and profiles
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.sync_profile_email();

-- Trigger: Update form_configs updated_at timestamp
DROP TRIGGER IF EXISTS update_form_configs_updated_at ON public.form_configs;
CREATE TRIGGER update_form_configs_updated_at
    BEFORE UPDATE ON public.form_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update cards updated_at timestamp
DROP TRIGGER IF EXISTS update_cards_updated_at ON public.cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Refresh cards_with_metrics on card_clicks change
DROP TRIGGER IF EXISTS refresh_cards_metrics_on_click ON public.card_clicks;
CREATE TRIGGER refresh_cards_metrics_on_click
    AFTER INSERT OR DELETE ON public.card_clicks
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_cards_metrics();

-- Trigger: Refresh forms_with_metrics on form_submissions change
DROP TRIGGER IF EXISTS refresh_forms_metrics_on_submission ON public.form_submissions;
CREATE TRIGGER refresh_forms_metrics_on_submission
    AFTER INSERT OR DELETE ON public.form_submissions
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_forms_metrics();

-- Initial refresh of materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY public.cards_with_metrics;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.forms_with_metrics;