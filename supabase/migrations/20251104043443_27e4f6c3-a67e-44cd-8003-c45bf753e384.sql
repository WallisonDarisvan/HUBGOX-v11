-- Rollback: Não devemos deletar perfis pendentes
-- A lógica de exibição no frontend deve lidar com a apresentação correta

-- Esta migration apenas garante que os linked_profile_ids estejam corretos
-- Reverte qualquer deleção acidental de perfis
-- (Nota: perfis já deletados não podem ser recuperados, mas prevenimos futuras deleções)