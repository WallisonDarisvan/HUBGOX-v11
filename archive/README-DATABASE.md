# 🗄️ Database Setup Guide

## 🚀 Quick Start

Para setup completo do banco de dados, execute este arquivo no Supabase SQL Editor:

```sql
complete-database-setup-v2.sql
```

**Tempo estimado:** 2-3 minutos

---

## 📋 Arquivos Principais

### ✅ Arquivos de Produção (USE ESTES)

| Arquivo | Propósito | Quando Usar |
|---------|-----------|-------------|
| `complete-database-setup-v2.sql` | Setup completo do sistema | Setup inicial ou reconstrução |
| `rollback-complete-setup.sql` | Rollback completo | Desfazer todas as alterações |
| `verify-migrations.sql` | Verificação pós-setup | Validar instalação |
| `STORAGE_POLICIES_SETUP.md` | Configuração de storage | Após executar o setup |

### 📦 Arquivos Históricos

Arquivos antigos foram movidos para a pasta `archive/` para organização.  
**NÃO USE** os arquivos em `archive/` - eles são mantidos apenas para referência.

---

## 🎯 O Que Está Incluído no v2.0

### Sistema Completo de Backend

✅ **Sistema de Roles e Permissões**
- Roles: admin, moderator, user
- Função `has_role()` com SECURITY DEFINER
- Atribuição automática de role 'user' em signups

✅ **Perfis Unificados**
- Suporte a perfis ativados e pendentes
- Sincronização automática de email com auth.users
- Geração automática de username único

✅ **Sistema de Convites**
- Convites por email com tokens únicos
- Validação de tokens server-side
- Aceitação de convites com criação de conta

✅ **Formulários Dinâmicos (v2.0 - NOVO)**
- Múltiplos forms por usuário
- Campos customizados (text, email, phone, textarea, etc.)
- Slugs únicos para URLs amigáveis
- Sistema de navegação e posicionamento
- Mensagens de confirmação customizáveis
- Background images para forms

✅ **Cards com Integração**
- Cards podem linkar para URLs externas OU formulários internos
- Imagens customizadas por card
- Sistema de ordenação

✅ **Analytics**
- Tracking de profile views
- Tracking de card clicks
- Métricas agregadas via materialized views

✅ **Storage Buckets**
- avatars (fotos de perfil)
- profile-covers (capas de perfil)
- card-images (imagens dos cards)
- form-backgrounds (backgrounds dos formulários)

✅ **RLS Policies Completas**
- Todas as tabelas protegidas com RLS
- Policies específicas para admins
- Isolation de dados entre usuários

✅ **Otimizações de Performance**
- 15+ índices otimizados
- Materialized views com refresh automático
- Triggers para manutenção automática

---

## 🔧 Como Executar

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Copie todo o conteúdo de `complete-database-setup-v2.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde as mensagens de confirmação (2-3 minutos)
8. Verifique se aparecem mensagens de sucesso ao final

### Opção 2: Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db reset

# Ou execute o arquivo diretamente
supabase db execute -f complete-database-setup-v2.sql
```

### Opção 3: psql (Avançado)

```bash
psql -h YOUR_DB_HOST -U postgres -d YOUR_DB_NAME -f complete-database-setup-v2.sql
```

---

## 📝 Ordem de Execução (Passo a Passo)

### 1. Execute o Setup Principal

```sql
-- Arquivo: complete-database-setup-v2.sql
-- Executa TUDO de uma vez
```

### 2. Configure Storage Policies

⚠️ **IMPORTANTE:** As políticas de storage DEVEM ser configuradas manualmente via Dashboard.

Siga as instruções detalhadas em:
```
STORAGE_POLICIES_SETUP.md
```

### 3. Verifique a Instalação

```sql
-- Arquivo: verify-migrations.sql
-- Valida se tudo foi criado corretamente
```

### 4. Configure o Primeiro Admin

```sql
-- Promover seu usuário a admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 🔍 Verificação Pós-Setup

### Checklist de Validação

Execute estas queries para confirmar que tudo está funcionando:

```sql
-- 1. Verificar tabelas criadas (deve retornar 9)
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'user_roles', 'profiles', 'user_invitations',
    'form_configs', 'form_fields', 'form_submissions',
    'cards', 'profile_views', 'card_clicks'
);

-- 2. Verificar storage buckets (deve retornar 4)
SELECT COUNT(*) 
FROM storage.buckets 
WHERE id IN ('avatars', 'profile-covers', 'card-images', 'form-backgrounds');

-- 3. Verificar materialized views (deve retornar 2)
SELECT COUNT(*) 
FROM pg_matviews 
WHERE schemaname = 'public'
AND matviewname IN ('cards_with_metrics', 'forms_with_metrics');

-- 4. Verificar funções críticas (deve retornar 10+)
SELECT COUNT(*) 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';
```

### Mensagens de Sucesso Esperadas

Ao executar o setup, você deve ver estas mensagens no output:

```
✅ PARTE 1: Sistema de roles e permissões criado ✓
✅ PARTE 2: Sistema de perfis unificado criado ✓
✅ PARTE 3: Sistema de convites criado ✓
✅ PARTE 4: Auto-criação de perfis configurada ✓
✅ PARTE 5: Permissões de deleção para admins configuradas ✓
✅ PARTE 6: Sistema de formulários criado ✓
✅ PARTE 7: Sistema de cards criado ✓
✅ PARTE 8: Sistema de analytics criado ✓
✅ PARTE 9: Storage buckets criados ✓
✅ PARTE 10: RLS policies de admin criadas ✓
✅ PARTE 11: Otimizações de performance aplicadas ✓

════════════════════════════════════════════════════════════════
🎉 SETUP CONCLUÍDO COM SUCESSO!
════════════════════════════════════════════════════════════════
```

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

**Causa:** Você já executou parte das migrações antes.

**Solução:**
```sql
-- Opção 1: O script é idempotente, continue normalmente
-- Ignore os erros "already exists"

-- Opção 2: Faça rollback completo primeiro
-- Execute rollback-complete-setup.sql e depois execute novamente o setup
```

### Erro: "permission denied for schema public"

**Causa:** Usuário não tem permissões necessárias.

**Solução:**
- Execute como superuser (postgres)
- Ou no Dashboard do Supabase (já usa credenciais corretas)

### Erro: "could not create unique index"

**Causa:** Dados duplicados já existem na tabela.

**Solução:**
```sql
-- Encontre duplicatas primeiro
SELECT username, COUNT(*) 
FROM profiles 
GROUP BY username 
HAVING COUNT(*) > 1;

-- Remova duplicatas manualmente e execute novamente
```

### Storage Policies Não Funcionam

**Causa:** Políticas de storage devem ser configuradas via Dashboard.

**Solução:**
1. Siga o guia em `STORAGE_POLICIES_SETUP.md`
2. Configure as políticas manualmente no Dashboard
3. Storage > Policies > Create Policy

---

## 🔄 Rollback (Desfazer Tudo)

### ⚠️ AVISO CRÍTICO

O rollback irá:
- ❌ **DELETAR TODAS AS TABELAS** do sistema
- ❌ **REMOVER TODOS OS DADOS** (perfis, cards, forms, submissions)
- ❌ **DELETAR STORAGE BUCKETS** e seus arquivos
- ❌ **REMOVER TODAS AS FUNÇÕES E TRIGGERS**

### Como Fazer Rollback

**1. Faça backup primeiro:**
```bash
# Via Supabase CLI
supabase db dump -f backup_antes_rollback.sql

# Ou via Dashboard: Settings > Database > Backup
```

**2. Execute o rollback:**
```sql
-- Arquivo: rollback-complete-setup.sql
-- Execute no SQL Editor
```

**3. Verifique:**
```sql
-- Deve retornar 0
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 📊 Estrutura do Banco (Visão Geral)

### Tabelas Principais

| Tabela | Descrição | Registros Típicos |
|--------|-----------|-------------------|
| `profiles` | Perfis de usuários | 1 por usuário |
| `user_roles` | Roles de usuários | 1+ por usuário |
| `user_invitations` | Convites pendentes | Variável |
| `form_configs` | Configurações de forms | 1+ por usuário |
| `form_fields` | Campos dos forms | 5-20 por form |
| `form_submissions` | Submissões de forms | Variável |
| `cards` | Cards de links | 5-20 por usuário |
| `profile_views` | Tracking de views | Crescente |
| `card_clicks` | Tracking de clicks | Crescente |

### Materialized Views (Performance)

| View | Atualização | Propósito |
|------|-------------|-----------|
| `cards_with_metrics` | Automática | Cards + contagem de clicks |
| `forms_with_metrics` | Automática | Forms + contagem de submissions |

### Storage Buckets

| Bucket | Público | Tamanho Máx/Arquivo |
|--------|---------|---------------------|
| `avatars` | ✅ | 2MB |
| `profile-covers` | ✅ | 5MB |
| `card-images` | ✅ | 2MB |
| `form-backgrounds` | ✅ | 5MB |

---

## 🔐 Segurança

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado com políticas específicas:

- ✅ **Usuários** só acessam seus próprios dados
- ✅ **Admins** têm acesso ampliado (via `has_role()`)
- ✅ **Público** pode inserir analytics e submissions
- ✅ **Funções críticas** usam `SECURITY DEFINER`

### Funções de Segurança

```sql
-- Verificar role do usuário (bypassa RLS)
public.has_role(_user_id uuid, _role app_role)

-- Deletar usuário (apenas admins)
public.admin_delete_user(user_id uuid)

-- Validar token de convite
public.validate_invitation_token(token text)

-- Aceitar convite
public.accept_invitation(token text, user_id uuid)
```

---

## 📚 Documentos Relacionados

- `STORAGE_POLICIES_SETUP.md` - Configuração de storage buckets
- `CONSOLIDATED_MIGRATION_GUIDE.md` - Guia de migração consolidada
- `MIGRATION_STATUS.md` - Status das migrações
- `PERFORMANCE_OPTIMIZATION_README.md` - Otimizações de performance
- `archive/README.md` - Explicação dos arquivos arquivados

---

## 🆘 Suporte

### Antes de Pedir Ajuda

1. ✅ Verifique a seção [Troubleshooting](#troubleshooting)
2. ✅ Execute `verify-migrations.sql` para diagnóstico
3. ✅ Revise os logs do PostgreSQL no Dashboard
4. ✅ Consulte `CONSOLIDATED_MIGRATION_GUIDE.md`

### Logs Úteis

```sql
-- Ver atividade do banco
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Ver funções criadas
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Ver triggers ativos
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## 📝 Changelog

### v2.0.0 (2025-11-02)
- ✨ **NOVO:** Múltiplos formulários por usuário
- ✨ **NOVO:** Sistema de navegação e posicionamento em forms
- ✨ **NOVO:** Background images para formulários
- ✨ **NOVO:** Mensagens de confirmação customizáveis
- ✨ **NOVO:** Cards podem linkar forms internos
- 🔧 **MELHORIA:** Políticas de storage via Dashboard
- 🔧 **MELHORIA:** Documentação consolidada
- 🔧 **MELHORIA:** Script idempotente completo

### v1.0.0 (2025-10-30)
- 🎉 Versão inicial consolidada
- ✅ Sistema de roles
- ✅ Perfis unificados
- ✅ Sistema de convites
- ✅ Formulários básicos
- ✅ Analytics

---

**Última atualização:** 2025-11-02  
**Versão:** 2.0.0  
**Autor:** Sistema de Database Setup
