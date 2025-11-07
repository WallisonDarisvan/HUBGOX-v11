-- Corrigir perfis ativados sem linked_profile_id associado
-- Vincula perfis ativos aos seus convites correspondentes
UPDATE user_invitations ui
SET 
  linked_profile_id = p_ativo.id,
  status = 'accepted',
  accepted_at = COALESCE(ui.accepted_at, now())
FROM profiles p_pendente
JOIN profiles p_ativo ON p_ativo.display_name = p_pendente.display_name
WHERE ui.profile_id = p_pendente.id
  AND ui.status = 'pending'
  AND p_pendente.is_activated = false
  AND p_ativo.is_activated = true
  AND ui.linked_profile_id IS NULL;

-- Deletar perfis pendentes órfãos que já foram vinculados
DELETE FROM profiles
WHERE is_activated = false
  AND id IN (
    SELECT profile_id 
    FROM user_invitations 
    WHERE linked_profile_id IS NOT NULL
  );