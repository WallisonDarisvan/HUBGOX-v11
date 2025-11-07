-- Analytics Tables Setup
-- Execute this SQL in your Supabase SQL Editor

-- Create profile_views table to track page visits
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Create card_clicks table to track card clicks
CREATE TABLE IF NOT EXISTS card_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id ON card_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_clicked_at ON card_clicks(clicked_at);

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_views
-- Allow anyone to insert (for tracking)
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Only profile owner can view their stats
CREATE POLICY "Users can view their own profile views"
  ON profile_views FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for card_clicks
-- Allow anyone to insert (for tracking)
CREATE POLICY "Anyone can insert card clicks"
  ON card_clicks FOR INSERT
  TO public
  WITH CHECK (true);

-- Only card owner can view their stats
CREATE POLICY "Users can view their own card clicks"
  ON card_clicks FOR SELECT
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM cards WHERE user_id = auth.uid()
    )
  );