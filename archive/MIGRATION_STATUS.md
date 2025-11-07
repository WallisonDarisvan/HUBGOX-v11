# Status das Migrações do Sistema

Este documento mantém o controle de todas as migrações SQL aplicadas ao banco de dados.

**⚠️ IMPORTANTE:** Arquivos SQL individuais foram movidos para `archive/individual-migrations/` para melhor organização. Use sempre `complete-database-setup-v2.sql` para setup do banco de dados.

**📚 Documentação Completa:** Veja `README-DATABASE.md` para guia de uso detalhado.

## 📋 Migrações Principais

### ✅ 1. Roles e Permissões
**Arquivo:** `archive/individual-migrations/user-roles-auto-setup.sql` *(arquivado)*  
**Status:** ✅ Consolidado em `complete-database-setup-v2.sql`
**Descrição:** Cria sistema de roles (admin, moderator, user) e atribui automaticamente role 'user' para novos usuários  
**Dependências:** Nenhuma  
**Ordem de execução:** 1

**Componentes:**
- Enum `app_role` (admin, moderator, user)
- Tabela `user_roles`
- Função `handle_new_user_role()`
- Trigger `on_auth_user_created_role`

---

### ✅ 2. Função de Verificação de Role
**Arquivo:** Incluído em múltiplos arquivos de setup  
**Status:** ✅ Pronto para executar  
**Descrição:** Função `SECURITY DEFINER` para verificar roles sem recursão RLS  
**Dependências:** user-roles-auto-setup.sql  
**Ordem de execução:** 2

**Função:**
```sql
public.has_role(_user_id uuid, _role app_role)
```

---

### ✅ 3. Sistema de Perfis Unificado
**Arquivo:** `archive/individual-migrations/unified-profiles-setup.sql` *(arquivado)*  
**Status:** ✅ Consolidado em `complete-database-setup-v2.sql`
**Descrição:** Sistema unificado de perfis que suporta perfis ativados e pendentes  
**Dependências:** user-roles-auto-setup.sql  
**Ordem de execução:** 3

**Componentes:**
- Coluna `is_activated` em profiles
- Migração de `pending_profiles` para `profiles`
- Atualização de `accept_invitation()`
- Atualização de `validate_invitation_token()`
- RLS policies atualizadas

---

### ✅ 4. Sistema de Convites
**Arquivo:** `archive/individual-migrations/user-invitations-setup.sql` *(arquivado)*  
**Status:** ✅ Consolidado em `complete-database-setup-v2.sql`
**Descrição:** Sistema completo de convites de usuários  
**Dependências:** unified-profiles-setup.sql  
**Ordem de execução:** 4

**Componentes:**
- Tabela `user_invitations`
- Função `validate_invitation_token()`
- Função `accept_invitation()`
- RLS policies para convites

---

### ✅ 5. Remoção de Foreign Key em Profiles
**Arquivo:** `remove-profiles-fkey.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Remove constraint de FK para permitir perfis pendentes  
**Dependências:** unified-profiles-setup.sql  
**Ordem de execução:** 5

---

### ✅ 6. Fix de Constraint de Profile ID
**Arquivo:** `remove-unique-constraint-profile-id.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Permite múltiplos convites históricos por profile  
**Dependências:** user-invitations-setup.sql  
**Ordem de execução:** 6

---

### ✅ 7. Permissão de Deleção para Admins
**Arquivo:** `add-admin-delete-profile-policy.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Permite que admins apaguem perfis  
**Dependências:** unified-profiles-setup.sql  
**Ordem de execução:** 7

---

### ✅ 8. Deleção Completa de Usuários
**Arquivo:** `enable-admin-user-deletion.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Permite admins removerem usuários do auth.users  
**Dependências:** add-admin-delete-profile-policy.sql  
**Ordem de execução:** 8

**Função:**
```sql
public.admin_delete_user(user_id uuid)
```

---

### ✅ 9. Setup de Formulários
**Arquivo:** `form-config-setup.sql` + `form-slug-setup.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Sistema completo de formulários customizados  
**Dependências:** unified-profiles-setup.sql  
**Ordem de execução:** 9

**Componentes:**
- Tabela `form_configs`
- Tabela `form_submissions`
- Coluna `slug` em form_configs
- Função `get_public_form_config()`
- RLS policies

---

### ✅ 10. Cards com Link para Formulários
**Arquivo:** `card-form-link-setup.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Permite cards linkarem para formulários internos  
**Dependências:** form-config-setup.sql  
**Ordem de execução:** 10

**Mudanças:**
- Coluna `form_config_id` em cards (nullable)
- `link_url` agora é nullable
- Índice `idx_cards_form_config_id`

---

### ✅ 11. Analytics Setup
**Arquivo:** `analytics-setup.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Sistema de analytics (views de perfil, clicks em cards)  
**Dependências:** card-form-link-setup.sql  
**Ordem de execução:** 11

**Componentes:**
- Tabela `profile_views`
- Tabela `card_clicks`
- Função `get_user_cards_with_metrics()`
- RLS policies

---

### ✅ 12. Storage Buckets Completo
**Arquivo:** `complete-storage-setup.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Todos os buckets de storage e suas RLS policies  
**Dependências:** Nenhuma (independente)  
**Ordem de execução:** 12

**Buckets:**
- `avatars` (public)
- `profile-covers` (public)
- `card-images` (public)
- `form-backgrounds` (public)

**RLS Policies por bucket:**
- INSERT (apenas próprio user)
- UPDATE (apenas próprio user)
- DELETE (apenas próprio user)
- SELECT (público)

---

### ✅ 13. Otimizações de Performance
**Arquivo:** `performance-optimization.sql`  
**Status:** ✅ Pronto para executar  
**Descrição:** Índices e materialized views para performance  
**Dependências:** analytics-setup.sql  
**Ordem de execução:** 13 (ÚLTIMA)

**Componentes:**
- Materialized view `cards_with_metrics`
- Materialized view `forms_with_metrics`
- Função `refresh_cards_metrics()`
- Função `refresh_forms_metrics()`
- Triggers de auto-refresh
- 15+ índices otimizados

---

### ✅ 14. Auto Criação de Perfis
**Arquivo:** `auto-profile-creation.sql`  
**Status:** ✅ NOVA - Pronto para executar  
**Descrição:** Cria perfis automaticamente para signups normais (não convites)  
**Dependências:** unified-profiles-setup.sql, user-invitations-setup.sql  
**Ordem de execução:** 14

**Componentes:**
- Função `handle_new_user()` atualizada
- Trigger `on_auth_user_created_profile`
- Geração automática de username único

---

## 📊 Script de Verificação

**Arquivo:** `verify-migrations.sql`  
**Descrição:** Script que verifica se todas as migrações foram aplicadas corretamente

**Verificações:**
- ✅ Todas as tabelas principais
- ✅ Materialized views
- ✅ Funções essenciais
- ✅ Triggers
- ✅ Storage buckets
- ✅ Índices críticos

**Como usar:**
```sql
-- Execute no SQL Editor do Supabase
\i verify-migrations.sql
```

---

## 🚀 Ordem Recomendada de Execução

**⚠️ IMPORTANTE:** Não execute arquivos individuais. Use o arquivo consolidado:

### Setup Completo (Recomendado)
```bash
# Execute APENAS este arquivo no Supabase SQL Editor
complete-database-setup-v2.sql
```

### Arquivos Individuais (Referência Histórica)
Os arquivos individuais foram movidos para `archive/individual-migrations/` e estão listados abaixo apenas para referência. **NÃO OS EXECUTE INDIVIDUALMENTE**.

1. ~~`user-roles-auto-setup.sql`~~ → **Consolidado no v2.0**
2. ~~`unified-profiles-setup.sql`~~ → **Consolidado no v2.0**
3. ~~`user-invitations-setup.sql`~~ → **Consolidado no v2.0**
4. ~~`remove-profiles-fkey.sql`~~ → **Consolidado no v2.0**
5. ~~`remove-unique-constraint-profile-id.sql`~~ → **Consolidado no v2.0**
6. ~~`add-admin-delete-profile-policy.sql`~~ → **Consolidado no v2.0**
7. ~~`enable-admin-user-deletion.sql`~~ → **Consolidado no v2.0**
8. ~~`form-config-setup.sql`~~ → **Consolidado no v2.0**
9. ~~`card-form-link-setup.sql`~~ → **Consolidado no v2.0**
10. ~~`analytics-setup.sql`~~ → **Consolidado no v2.0**
11. ~~`complete-storage-setup.sql`~~ → **Consolidado no v2.0**
12. ~~`performance-optimization.sql`~~ → **Consolidado no v2.0**
13. ~~`auto-profile-creation.sql`~~ → **Consolidado no v2.0**

**Verificação:** Execute `verify-migrations.sql` após o setup.

**📚 Mais informações:** Veja `archive/README.md` para mapeamento detalhado das migrações.

---

## ⚠️ Notas Importantes

### Segurança
- ✅ Todas as funções críticas usam `SECURITY DEFINER`
- ✅ RLS habilitado em todas as tabelas
- ✅ Verificação de roles server-side (nunca client-side)
- ✅ Isolation de dados entre usuários

### Performance
- ✅ Materialized views para queries pesadas
- ✅ Índices em colunas frequentemente consultadas
- ✅ Triggers de auto-refresh otimizados
- ✅ Queries otimizadas com joins eficientes

### Manutenção
- ⚠️ Refresh manual das materialized views se necessário:
  ```sql
  SELECT refresh_cards_metrics();
  SELECT refresh_forms_metrics();
  ```
- ⚠️ Monitorar tamanho das tabelas de analytics
- ⚠️ Considerar particionamento para alta volumetria

---

## 📝 Checklist Pós-Migração

- [ ] Executar todas as migrações na ordem correta
- [ ] Executar `verify-migrations.sql` e confirmar todos ✅
- [ ] Criar primeiro usuário admin manualmente:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::app_role
  FROM auth.users
  WHERE email = 'seu-email@exemplo.com'
  ON CONFLICT (user_id, role) DO NOTHING;
  ```
- [ ] Testar signup de novo usuário normal
- [ ] Testar criação de convite por admin
- [ ] Testar aceitação de convite
- [ ] Testar criação de cards e formulários
- [ ] Verificar analytics funcionando
- [ ] Verificar upload de arquivos em todos os buckets
- [ ] Monitorar logs de erro

---

---

## 📦 Reorganização de Arquivos (v2.0)

### Estrutura Anterior (até v1.0)
```
projeto/
├── complete-database-setup.sql
├── user-roles-auto-setup.sql
├── unified-profiles-setup.sql
├── ... (15+ arquivos SQL na raiz)
```

### Estrutura Atual (v2.0)
```
projeto/
├── complete-database-setup-v2.sql  ← USE ESTE
├── rollback-complete-setup.sql
├── verify-migrations.sql
├── README-DATABASE.md              ← NOVO: Guia completo
├── archive/                        ← NOVO: Arquivos históricos
│   ├── README.md
│   ├── v1.0/
│   │   └── complete-database-setup.sql
│   └── individual-migrations/
│       ├── user-roles-auto-setup.sql
│       ├── unified-profiles-setup.sql
│       └── ... (17 outros arquivos)
```

**Benefícios:**
- ✅ Clareza: Um arquivo principal para usar
- ✅ Organização: Arquivos antigos separados
- ✅ Histórico: Preservado para referência
- ✅ Documentação: Guias detalhados criados

---

**Última atualização:** 2025-11-02  
**Versão do sistema:** 2.0.0  
**Status:** Reorganizado e consolidado
