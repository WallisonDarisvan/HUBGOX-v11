# 📚 Guia de Migração Consolidada

## 📋 Índice
- [Visão Geral](#visão-geral)
- [O Que Foi Consolidado](#o-que-foi-consolidado)
- [Como Usar](#como-usar)
- [Estrutura do Arquivo](#estrutura-do-arquivo)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)
- [Checklist de Verificação](#checklist-de-verificação)

---

## 🎯 Visão Geral

Este guia documenta a **migração consolidada** que unifica múltiplos arquivos SQL individuais em um único arquivo executável: `complete-database-setup-v2.sql`.

**⚠️ NOTA:** Arquivos SQL antigos foram movidos para a pasta `archive/` para melhor organização. Sempre use `complete-database-setup-v2.sql` na raiz do projeto.

### Por Que Consolidar?

✅ **Simplicidade** - Um único arquivo para executar  
✅ **Menos erros** - Não há risco de pular migrações  
✅ **Portabilidade** - Fácil de versionar e compartilhar  
✅ **Manutenção** - Mais fácil de documentar e revisar  
✅ **Idempotência** - Pode ser executado múltiplas vezes com segurança  

---

## 📦 O Que Foi Consolidado

### Migrações Originais (14 arquivos)
1. `user-roles-auto-setup.sql`
2. `unified-profiles-setup.sql`
3. `remove-profiles-fkey.sql`
4. `user-invitations-setup.sql`
5. `remove-unique-constraint-profile-id.sql`
6. `auto-profile-creation.sql`
7. `fix-invitation-acceptance.sql`
8. `add-admin-delete-profile-policy.sql`
9. `enable-admin-user-deletion.sql`
10. `form-config-setup.sql`
11. `form-slug-setup.sql`
12. `add-confirmation-fields.sql`
13. `card-form-link-setup.sql`
14. `analytics-setup.sql`
15. `complete-storage-setup.sql`
16. `form-storage-setup.sql`
17. `performance-optimization.sql`

### Arquivo Consolidado v2.0
- `complete-database-setup-v2.sql` (1 arquivo - **USE ESTE**)
- `rollback-complete-setup.sql` (opcional, para desfazer)

**📦 Arquivos antigos:** Movidos para `archive/` - veja `archive/README.md` para detalhes.

---

## 🚀 Como Usar

### Opção 1: Novo Projeto (Banco Limpo)

```bash
# Execute o arquivo consolidado v2.0 no Supabase SQL Editor
psql -f complete-database-setup-v2.sql
```

Ou no **Supabase Dashboard**:
1. Acesse **SQL Editor**
2. Copie todo o conteúdo de `complete-database-setup-v2.sql`
3. Cole e execute
4. Aguarde as mensagens de confirmação

**📚 Documentação Completa:** Veja `README-DATABASE.md` para guia detalhado.

### Opção 2: Projeto Existente (Migração)

⚠️ **ATENÇÃO**: Se você já executou algumas migrações antigas:

1. **Faça backup do banco de dados**
```bash
pg_dump -h YOUR_HOST -U postgres -d YOUR_DB > backup.sql
```

2. **Execute o rollback** (opcional, se quiser limpar tudo)
```bash
psql -f rollback-complete-setup.sql
```

3. **Execute a migração consolidada v2.0**
```bash
psql -f complete-database-setup-v2.sql
```

### Opção 3: Verificar O Que Já Existe

Se você não tem certeza do estado atual do banco:

```sql
-- Verificar tabelas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'user_roles', 'profiles', 'user_invitations',
    'form_configs', 'form_fields', 'form_submissions',
    'cards', 'profile_views', 'card_clicks'
);

-- Verificar funções existentes
SELECT proname 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'has_role', 'handle_new_user_role', 'handle_new_user',
    'validate_invitation_token', 'accept_invitation'
);
```

---

## 📂 Estrutura do Arquivo

O arquivo `complete-database-setup-v2.sql` está organizado em **11 partes**:

**📦 Arquivos antigos:** Para referência da estrutura antiga, veja `archive/README.md`.

### Parte 1: Roles e Permissões
- Enum `app_role` (admin, moderator, user)
- Tabela `user_roles`
- Função `has_role()` com SECURITY DEFINER
- Trigger automático para novos usuários

### Parte 2: Sistema de Perfis Unificado
- Tabela `profiles` com suporte a perfis pendentes
- Coluna `is_activated` (true = ativo, false = pendente)
- Remoção da FK constraint para permitir perfis sem auth.users
- RLS policies completas

### Parte 3: Sistema de Convites
- Tabela `user_invitations`
- Constraint UNIQUE condicional (apenas pending)
- Funções `validate_invitation_token()` e `accept_invitation()`
- RLS policies para admins e público

### Parte 4: Auto-Criação de Perfis
- Função `handle_new_user()` para signups normais
- Geração automática de username único
- Trigger que executa após signup

### Parte 5: Permissões de Deleção
- Policy RLS para admins apagarem profiles
- Função `admin_delete_user()` para remover do auth.users

### Parte 6: Sistema de Formulários
- Tabelas: `form_configs`, `form_fields`, `form_submissions`
- Sistema de slugs únicos
- Campos de confirmação customizáveis
- RLS policies para usuários e público

### Parte 7: Cards com Integração de Forms
- Tabela `cards`
- Suporte a `link_url` OU `form_config_id`
- RLS policies
- Índices otimizados

### Parte 8: Sistema de Analytics
- Tabelas: `profile_views`, `card_clicks`
- RLS para tracking público e visualização privada
- Índices para queries rápidas

### Parte 9: Storage Buckets
- 4 buckets: avatars, profile-covers, card-images, form-backgrounds
- RLS policies para upload/delete (owner only)
- Read público para todos os buckets

### Parte 10: Otimizações de Performance
- Materialized views: `cards_with_metrics`, `forms_with_metrics`
- Funções de refresh automático
- 15+ índices otimizados
- Triggers para auto-refresh

### Parte 11: Verificação Final
- Contagem de tabelas, funções e triggers criados
- Mensagens de sucesso
- Relatório final

---

## 🔧 Troubleshooting

### Erro: "relation already exists"

**Causa**: Você já executou parte das migrações antes.

**Solução**:
```sql
-- Opção 1: Continue (o script é idempotente)
-- Apenas ignore os erros de "already exists"

-- Opção 2: Faça rollback completo e execute novamente
-- Execute rollback-complete-setup.sql primeiro
```

### Erro: "permission denied for schema public"

**Causa**: Usuário não tem permissões necessárias.

**Solução**:
```sql
-- Execute como superuser (postgres)
-- Ou garanta que seu usuário tem permissões:
GRANT ALL ON SCHEMA public TO your_user;
```

### Erro: "could not create unique index"

**Causa**: Dados duplicados já existem na tabela.

**Solução**:
```sql
-- Encontre e remova duplicatas primeiro
SELECT username, COUNT(*) 
FROM profiles 
GROUP BY username 
HAVING COUNT(*) > 1;

-- Depois execute novamente a migração
```

### Erro: "trigger ... already exists"

**Causa**: Triggers já foram criados anteriormente.

**Solução**: O script já usa `DROP TRIGGER IF EXISTS`, então isso não deveria acontecer. Se acontecer, execute manualmente:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
```

---

## 🔄 Rollback

Se precisar desfazer **TUDO**:

### ⚠️ AVISO CRÍTICO
O rollback irá:
- **DELETAR TODAS AS TABELAS** do sistema
- **REMOVER TODOS OS DADOS** (perfis, cards, forms, submissions)
- **DELETAR TODOS OS ARQUIVOS** dos storage buckets
- **REMOVER FUNÇÕES E TRIGGERS**

### Como Executar

1. **Faça backup primeiro**:
```bash
pg_dump -h YOUR_HOST -U postgres -d YOUR_DB > backup_antes_rollback.sql
```

2. **Execute o rollback**:
```bash
psql -f rollback-complete-setup.sql
```

3. **Verifique**:
```sql
-- Deve retornar 0 para ambos
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%profile%' OR table_name LIKE '%card%';
```

---

## ✅ Checklist de Verificação

Após executar a migração, verifique:

### Tabelas Criadas
- [ ] `user_roles` ✓
- [ ] `profiles` ✓
- [ ] `user_invitations` ✓
- [ ] `form_configs` ✓
- [ ] `form_fields` ✓
- [ ] `form_submissions` ✓
- [ ] `cards` ✓
- [ ] `profile_views` ✓
- [ ] `card_clicks` ✓

### Funções Criadas
- [ ] `has_role()` ✓
- [ ] `handle_new_user_role()` ✓
- [ ] `handle_new_user()` ✓
- [ ] `validate_invitation_token()` ✓
- [ ] `accept_invitation()` ✓
- [ ] `admin_delete_user()` ✓
- [ ] `generate_slug()` ✓
- [ ] `generate_unique_slug()` ✓
- [ ] `refresh_cards_metrics()` ✓
- [ ] `refresh_forms_metrics()` ✓

### Storage Buckets Criados
- [ ] `avatars` ✓
- [ ] `profile-covers` ✓
- [ ] `card-images` ✓
- [ ] `form-backgrounds` ✓

### Materialized Views
- [ ] `cards_with_metrics` ✓
- [ ] `forms_with_metrics` ✓

### Triggers Ativos
- [ ] `on_auth_user_created_role` ✓
- [ ] `on_auth_user_created_profile` ✓
- [ ] `update_form_configs_updated_at` ✓
- [ ] Triggers de refresh automático ✓

### RLS Habilitado
- [ ] Todas as tabelas têm RLS enabled ✓
- [ ] `storage.objects` tem RLS enabled ✓
- [ ] Policies aplicadas corretamente ✓

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (14 arquivos) | Depois (1 arquivo) |
|---------|---------------------|---------------------|
| **Arquivos** | 14 migrações separadas | 1 arquivo consolidado |
| **Tempo de execução** | ~5-10 min (manual) | ~2-3 min (automático) |
| **Risco de erro** | Alto (pular migração) | Baixo (tudo incluído) |
| **Manutenção** | Difícil (múltiplos arquivos) | Fácil (um só lugar) |
| **Documentação** | Espalhada | Centralizada |
| **Idempotência** | Parcial | Completa |
| **Portabilidade** | Baixa | Alta |

---

## 🎯 Próximos Passos

Após executar a migração consolidada:

1. **Teste o sistema**:
   - Crie um usuário via signup normal
   - Verifique se o profile foi criado automaticamente
   - Teste o sistema de convites

2. **Configure o primeiro admin**:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

3. **Monitore os logs**:
   - Verifique se os triggers estão funcionando
   - Confirme que as materialized views estão sendo atualizadas

4. **Documente customizações**:
   - Se fez alguma alteração, documente aqui
   - Mantenha este guia atualizado

---

## 📝 Notas de Versão

### v2.0.0 (2025-11-02)
- 🎉 **REORGANIZAÇÃO:** Arquivos SQL movidos para `archive/`
- 📚 **NOVO:** `README-DATABASE.md` - Guia completo de database
- 📚 **NOVO:** `archive/README.md` - Documentação do histórico
- ✨ **MELHORIA:** Estrutura de arquivos mais organizada
- ✨ **MELHORIA:** Documentação consolidada e clara
- 🔧 **CORREÇÃO:** Políticas de storage via Dashboard

### v1.0.0 (2025-10-30)
- ✅ Consolidação inicial de 14 migrações
- ✅ Adicionado rollback completo
- ✅ Documentação completa
- ✅ Verificação automática de integridade

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a seção [Troubleshooting](#troubleshooting)
2. Revise o checklist de verificação
3. Consulte os logs do PostgreSQL:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## 📄 Licença

Este projeto usa a mesma licença do projeto principal.

---

**Última atualização**: 2025-11-02  
**Versão**: 1.0.0  
**Autor**: Sistema consolidado de migrações
