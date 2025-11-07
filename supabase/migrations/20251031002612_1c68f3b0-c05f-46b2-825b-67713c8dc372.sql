-- Add DELETE policies for profile_views and card_clicks to allow users to delete their own metrics

-- Policy for users to delete their own profile views
CREATE POLICY "Users can delete their own profile views"
  ON profile_views FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Policy for admins to delete all profile views
CREATE POLICY "Admins can delete all profile views"
  ON profile_views FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Policy for users to delete their own card clicks
CREATE POLICY "Users can delete their own card clicks"
  ON card_clicks FOR DELETE
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM cards WHERE user_id = auth.uid()
    )
  );

-- Policy for admins to delete all card clicks
CREATE POLICY "Admins can delete all card clicks"
  ON card_clicks FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));