-- Adicionar políticas RLS de DELETE para profile_views e card_clicks

-- Política para profile_views (usuários podem deletar suas próprias visualizações)
CREATE POLICY "Users can delete their own profile views"
  ON profile_views FOR DELETE
  TO authenticated
  USING (
    profile_id = auth.uid()
  );

-- Política para profile_views (admins podem deletar visualizações dos usuários que convidaram)
CREATE POLICY "Admins can delete profile views of their users"
  ON profile_views FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND profile_id IN (
      SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
      FROM user_invitations ui
      WHERE ui.invited_by_admin_id = auth.uid()
    )
  );

-- Política para card_clicks (usuários podem deletar cliques de seus próprios cards)
CREATE POLICY "Users can delete their own card clicks"
  ON card_clicks FOR DELETE
  TO authenticated
  USING (
    card_id IN (
      SELECT id FROM cards WHERE user_id = auth.uid()
    )
  );

-- Política para card_clicks (admins podem deletar cliques dos cards de seus usuários)
CREATE POLICY "Admins can delete card clicks of their users"
  ON card_clicks FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND card_id IN (
      SELECT c.id
      FROM cards c
      JOIN user_invitations ui ON (ui.profile_id = c.user_id OR ui.linked_profile_id = c.user_id)
      WHERE ui.invited_by_admin_id = auth.uid()
    )
  );