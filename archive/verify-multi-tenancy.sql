-- =====================================================
-- VERIFICAÇÃO: Multi-Tenancy entre Admins
-- =====================================================
-- Use estas queries para verificar se o isolamento
-- entre admins está funcionando corretamente.
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Listar todas as políticas "all" restantes (deveria retornar 0 linhas)
SELECT 
    tablename,
    policyname,
    cmd AS operation,
    CASE 
        WHEN policyname LIKE '%all%' THEN '⚠️ REMOVER'
        ELSE '✅ OK'
    END AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND policyname LIKE '%Admin%'
    AND policyname LIKE '%all%'
ORDER BY tablename, cmd;

-- Se retornar linhas, execute:
-- DROP POLICY IF EXISTS "[policyname]" ON [tablename];

RAISE NOTICE '================================================';
RAISE NOTICE 'Verificação de Políticas "all" concluída';
RAISE NOTICE 'Se aparecer alguma linha acima, remova essas políticas!';
RAISE NOTICE '================================================';

-- Listar todas as políticas "their users" (deveria retornar 10+ linhas)
SELECT 
    tablename,
    policyname,
    cmd AS operation,
    '✅ Correto' AS status
FROM pg_policies
WHERE schemaname = 'public'
    AND policyname LIKE '%their users%'
ORDER BY tablename, cmd;

RAISE NOTICE '================================================';
RAISE NOTICE 'Políticas "their users" listadas acima';
RAISE NOTICE 'Deveria haver pelo menos 10 políticas';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 2: VERIFICAR ESTRUTURA DE DADOS
-- =====================================================

-- Listar todos os admins e quantos usuários cada um convidou
SELECT 
    p.id AS admin_id,
    p.username AS admin_username,
    p.email AS admin_email,
    COUNT(ui.id) AS users_invited,
    STRING_AGG(p2.username, ', ') AS invited_usernames
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN user_invitations ui ON ui.invited_by_admin_id = p.id
LEFT JOIN profiles p2 ON (p2.id = ui.profile_id OR p2.id = ui.linked_profile_id)
WHERE ur.role = 'admin'
GROUP BY p.id, p.username, p.email
ORDER BY users_invited DESC;

RAISE NOTICE '================================================';
RAISE NOTICE 'Admins e seus usuários convidados listados acima';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 3: TESTE DE ISOLAMENTO (Substitua IDs)
-- =====================================================

-- INSTRUÇÕES:
-- 1. Copie o ID de dois admins diferentes da query acima
-- 2. Substitua [ADMIN_A_ID] e [ADMIN_B_ID] abaixo
-- 3. Execute as queries

-- Verificar usuários do Admin A
-- Substitua [ADMIN_A_ID] pelo ID real do admin
/*
SELECT 
    p.id,
    p.username,
    p.email,
    ui.invited_by_admin_id,
    'Pertence ao Admin A' AS ownership
FROM profiles p
JOIN user_invitations ui ON (ui.profile_id = p.id OR ui.linked_profile_id = p.id)
WHERE ui.invited_by_admin_id = '[ADMIN_A_ID]';
*/

-- Verificar usuários do Admin B
-- Substitua [ADMIN_B_ID] pelo ID real do admin
/*
SELECT 
    p.id,
    p.username,
    p.email,
    ui.invited_by_admin_id,
    'Pertence ao Admin B' AS ownership
FROM profiles p
JOIN user_invitations ui ON (ui.profile_id = p.id OR ui.linked_profile_id = p.id)
WHERE ui.invited_by_admin_id = '[ADMIN_B_ID]';
*/

-- Verificar se há sobreposição (NÃO deveria retornar nenhuma linha)
/*
SELECT 
    p.id,
    p.username,
    '⚠️ PROBLEMA: Usuário compartilhado entre admins!' AS issue
FROM profiles p
WHERE p.id IN (
    SELECT ui1.profile_id 
    FROM user_invitations ui1
    WHERE ui1.invited_by_admin_id = '[ADMIN_A_ID]'
)
AND p.id IN (
    SELECT ui2.profile_id 
    FROM user_invitations ui2
    WHERE ui2.invited_by_admin_id = '[ADMIN_B_ID]'
);
*/

RAISE NOTICE '================================================';
RAISE NOTICE 'Para testar isolamento:';
RAISE NOTICE '1. Descomente as queries acima';
RAISE NOTICE '2. Substitua [ADMIN_A_ID] e [ADMIN_B_ID]';
RAISE NOTICE '3. Execute novamente';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 4: VERIFICAR FUNÇÃO admin_delete_user
-- =====================================================

-- Verificar se a função tem validação de ownership
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%invited_by_admin_id%' 
        THEN '✅ Tem validação de ownership'
        ELSE '⚠️ NÃO tem validação - INSEGURO!'
    END AS security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'admin_delete_user';

RAISE NOTICE '================================================';
RAISE NOTICE 'Verificação da função admin_delete_user concluída';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 5: TESTE DE PERMISSÕES (Execute como Admin)
-- =====================================================

-- INSTRUÇÕES PARA TESTE MANUAL:
-- 1. Faça login como Admin A no app
-- 2. Execute a query abaixo via SQL Editor (ela usa auth.uid())
-- 3. Deveria retornar apenas usuários do Admin A

/*
-- Usuários visíveis pelo admin atual (logado)
SELECT 
    p.id,
    p.username,
    p.email,
    'Você pode gerenciar este usuário' AS permission
FROM profiles p
JOIN user_invitations ui ON (ui.profile_id = p.id OR ui.linked_profile_id = p.id)
WHERE ui.invited_by_admin_id = auth.uid();
*/

RAISE NOTICE '================================================';
RAISE NOTICE 'Para testar permissões:';
RAISE NOTICE '1. Faça login como admin no app';
RAISE NOTICE '2. Descomente a query acima';
RAISE NOTICE '3. Execute no SQL Editor';
RAISE NOTICE '4. Deveria retornar apenas seus usuários';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 6: VERIFICAR STORAGE POLICIES (MANUAL)
-- =====================================================

-- ATENÇÃO: Storage RLS não pode ser verificado via SQL
-- Você precisa verificar manualmente no Dashboard:

RAISE NOTICE '================================================';
RAISE NOTICE 'VERIFICAÇÃO DE STORAGE (MANUAL)';
RAISE NOTICE '================================================';
RAISE NOTICE 'Acesse: https://supabase.com/dashboard/project/teignlrqltptrhqghoqs/storage/buckets';
RAISE NOTICE '';
RAISE NOTICE 'Para cada bucket (avatars, profile-covers, card-images, form-backgrounds):';
RAISE NOTICE '1. Clique no bucket';
RAISE NOTICE '2. Aba "Policies"';
RAISE NOTICE '3. Verifique se existem 4 políticas:';
RAISE NOTICE '   - Admins can upload to [bucket] for their users (INSERT)';
RAISE NOTICE '   - Admins can update in [bucket] for their users (UPDATE)';
RAISE NOTICE '   - Admins can delete from [bucket] for their users (DELETE)';
RAISE NOTICE '   - Public can view [bucket] (SELECT - existente)';
RAISE NOTICE '';
RAISE NOTICE 'Total esperado: 16 políticas (4 por bucket x 4 buckets)';
RAISE NOTICE '================================================';

-- =====================================================
-- PARTE 7: CHECKLIST FINAL
-- =====================================================

DO $$
DECLARE
    all_policies_count INTEGER;
    their_users_count INTEGER;
    admin_count INTEGER;
    users_without_owner INTEGER;
BEGIN
    -- Contar políticas problemáticas
    SELECT COUNT(*) INTO all_policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND policyname LIKE '%Admin%'
        AND policyname LIKE '%all%';
    
    -- Contar políticas corretas
    SELECT COUNT(*) INTO their_users_count
    FROM pg_policies
    WHERE schemaname = 'public'
        AND policyname LIKE '%their users%';
    
    -- Contar admins
    SELECT COUNT(DISTINCT ur.user_id) INTO admin_count
    FROM user_roles ur
    WHERE ur.role = 'admin';
    
    -- Contar usuários sem owner (órfãos)
    SELECT COUNT(*) INTO users_without_owner
    FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 FROM user_invitations ui
        WHERE ui.profile_id = p.id OR ui.linked_profile_id = p.id
    )
    AND NOT EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = p.id AND ur.role = 'admin'
    );
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'CHECKLIST FINAL DE MULTI-TENANCY';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Database RLS:';
    RAISE NOTICE '  - Políticas "all" restantes: % (esperado: 0)', all_policies_count;
    RAISE NOTICE '  - Políticas "their users": % (esperado: >= 10)', their_users_count;
    RAISE NOTICE '';
    RAISE NOTICE '✓ Estrutura de Dados:';
    RAISE NOTICE '  - Total de admins: %', admin_count;
    RAISE NOTICE '  - Usuários órfãos: % (esperado: 0)', users_without_owner;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Storage RLS:';
    RAISE NOTICE '  - Verificação MANUAL necessária via Dashboard';
    RAISE NOTICE '  - Consulte: storage-admin-multi-tenancy-policies.md';
    RAISE NOTICE '';
    
    IF all_policies_count = 0 AND their_users_count >= 10 THEN
        RAISE NOTICE '✅ DATABASE RLS: CONFIGURADO CORRETAMENTE';
    ELSE
        RAISE NOTICE '❌ DATABASE RLS: PRECISA DE AJUSTES';
    END IF;
    
    IF users_without_owner > 0 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Existem % usuários sem owner', users_without_owner;
        RAISE NOTICE '   Estes usuários não serão visíveis para nenhum admin!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Aplicar Storage RLS via Dashboard';
    RAISE NOTICE '2. Testar upload de imagens como admin';
    RAISE NOTICE '3. Testar isolamento entre dois admins';
    RAISE NOTICE '================================================';
END $$;
