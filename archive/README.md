# 📦 Archived SQL Files

## ⚠️ NÃO USE ESTES ARQUIVOS

**Estes arquivos são apenas para referência histórica.**

Para setup atual do banco de dados, use:
```
../complete-database-setup-v2.sql
```

Veja o guia completo em: `../README-DATABASE.md`

---

## 📂 Estrutura do Archive

### `v1.0/`
Primeira versão consolidada do sistema (desatualizada).

**Arquivo:**
- `complete-database-setup.sql` - Versão 1.0 do setup consolidado

**Por que está arquivado:**
- Substituído pela versão 2.0
- Não inclui suporte a múltiplos formulários
- Sistema de storage policies desatualizado
- Falta otimizações de performance

### `individual-migrations/`
Migrações individuais que foram consolidadas na versão 2.0.

**Arquivos (19 migrações):**

#### Sistema de Usuários e Permissões
- `user-roles-auto-setup.sql` - Sistema de roles (admin, moderator, user)
- `add-admin-delete-profile-policy.sql` - Policy para admins deletarem profiles
- `enable-admin-user-deletion.sql` - Função para admins removerem usuários
- `auto-profile-creation.sql` - Criação automática de perfis em signup

#### Sistema de Perfis
- `unified-profiles-setup.sql` - Sistema unificado de perfis
- `remove-profiles-fkey.sql` - Remove FK constraint para perfis pendentes

#### Sistema de Convites
- `user-invitations-setup.sql` - Sistema completo de convites
- `remove-unique-constraint-profile-id.sql` - Permite múltiplos convites por profile
- `fix-invitation-acceptance.sql` - Corrige lógica de aceitação de convites
- `fix-user-creation-flow.sql` - Corrige fluxo de criação de usuários

#### Sistema de Formulários
- `form-config-setup.sql` - Setup básico de formulários
- `form-slug-setup.sql` - Sistema de slugs para URLs amigáveis
- `add-confirmation-fields.sql` - Campos de confirmação customizáveis
- `form-storage-setup.sql` - Storage para backgrounds de forms

#### Sistema de Cards
- `card-form-link-setup.sql` - Integração de cards com formulários

#### Analytics
- `analytics-setup.sql` - Sistema de tracking (views e clicks)

#### Storage
- `complete-storage-setup.sql` - Setup completo de storage buckets

#### Performance
- `performance-optimization.sql` - Índices e materialized views

**Por que estão arquivados:**
- Consolidados em um único arquivo (`complete-database-setup-v2.sql`)
- Executar individualmente pode causar inconsistências
- Ordem de execução crítica (difícil de manter)
- Manutenção complexa (14+ arquivos)

---

## 🔍 Quando Consultar Este Archive?

### ✅ Use Este Archive Para:

1. **Entender o histórico de desenvolvimento**
   - Como features foram implementadas originalmente
   - Decisões técnicas tomadas ao longo do tempo
   - Evolução do schema do banco

2. **Debugging de issues específicas**
   - Comparar implementação antiga vs nova
   - Identificar quando um bug foi introduzido
   - Entender lógica de migrações específicas

3. **Documentação implícita**
   - Comentários nos arquivos SQL originais
   - Explicações de decisões técnicas
   - Exemplos de queries e uso

4. **Referência para novos desenvolvedores**
   - Aprender a estrutura do sistema
   - Ver exemplos de RLS policies
   - Entender triggers e funções

### ❌ NÃO Use Este Archive Para:

1. **Setup de banco de dados**
   - Use `complete-database-setup-v2.sql` na raiz
   - Setup individual pode quebrar o sistema
   - Ordem de execução crítica não garantida

2. **Aplicar migrações em produção**
   - Arquivos desatualizados
   - Podem faltar dependências
   - Risco de inconsistências

3. **Corrigir problemas atuais**
   - Versão 2.0 já inclui correções
   - Aplicar migrações antigas pode piorar
   - Sempre use arquivos da raiz

---

## 📋 Mapeamento: Individual → Consolidado

Esta tabela mostra onde cada migração individual está no arquivo consolidado v2.0:

| Arquivo Individual | Parte no v2.0 | Linhas Aprox. |
|-------------------|---------------|---------------|
| `user-roles-auto-setup.sql` | PARTE 1 | 22-103 |
| `unified-profiles-setup.sql` | PARTE 2 | 105-226 |
| `user-invitations-setup.sql` | PARTE 3 | 228-422 |
| `auto-profile-creation.sql` | PARTE 4 | 424-504 |
| `remove-profiles-fkey.sql` | PARTE 2 | 114-116 |
| `remove-unique-constraint-profile-id.sql` | PARTE 3 | 265-268 |
| `add-admin-delete-profile-policy.sql` | PARTE 5 | 506-560 |
| `enable-admin-user-deletion.sql` | PARTE 5 | 527-560 |
| `form-config-setup.sql` | PARTE 6 | 562-690 |
| `form-slug-setup.sql` | PARTE 6 | 636-662 |
| `add-confirmation-fields.sql` | PARTE 6 | 580-585 |
| `card-form-link-setup.sql` | PARTE 7 | 966-1032 |
| `analytics-setup.sql` | PARTE 8 | 1034-1102 |
| `complete-storage-setup.sql` | PARTE 9 | 1104-1159 |
| `form-storage-setup.sql` | PARTE 9 | 1139-1143 |
| `performance-optimization.sql` | PARTE 11 | 1263-1376 |
| `fix-invitation-acceptance.sql` | PARTE 3 | 339-421 |
| `fix-user-creation-flow.sql` | PARTE 4 | 424-504 |

---

## 🔄 Como Foi Feita a Consolidação

### Processo de Migração (v1.0 → v2.0)

1. **Análise de Dependências**
   - Identificadas dependências entre migrações
   - Mapeada ordem correta de execução
   - Encontradas duplicações e conflitos

2. **Consolidação do Código**
   - Mesclados arquivos em ordem lógica
   - Removidas duplicações
   - Padronizados comentários e estrutura

3. **Adição de Features v2.0**
   - Sistema de múltiplos formulários
   - Sistema de navegação em forms
   - Background images para forms
   - Integração cards-forms melhorada

4. **Testes e Validação**
   - Testado em banco limpo
   - Testado com dados existentes
   - Validada idempotência

5. **Documentação**
   - Criado README-DATABASE.md
   - Atualizado CONSOLIDATED_MIGRATION_GUIDE.md
   - Documentadas todas as mudanças

---

## 📊 Estatísticas do Archive

- **Total de arquivos:** 20
- **Linhas de SQL:** ~2,500
- **Tabelas criadas:** 9
- **Funções criadas:** 10+
- **Triggers criados:** 5+
- **Storage buckets:** 4
- **RLS policies:** 50+

---

## 🎯 Evolução do Sistema

### Cronologia de Desenvolvimento

#### Fase 1: Fundação (v0.1 - v0.5)
- Sistema básico de usuários
- Perfis simples
- Cards básicos

#### Fase 2: Permissões (v0.6 - v0.8)
- Sistema de roles
- RLS policies
- Funções SECURITY DEFINER

#### Fase 3: Convites (v0.9 - v0.12)
- Sistema de convites
- Perfis pendentes
- Aceitação de convites

#### Fase 4: Formulários (v0.13 - v0.15)
- Formulários básicos
- Slugs e URLs amigáveis
- Mensagens de confirmação

#### Fase 5: Integração (v0.16 - v0.18)
- Cards linkam formulários
- Analytics de uso
- Storage para imagens

#### Fase 6: Performance (v0.19 - v1.0)
- Materialized views
- Índices otimizados
- Triggers de refresh

#### Fase 7: Consolidação (v1.0 - v2.0)
- Migração consolidada
- Múltiplos formulários
- Documentação completa

---

## 💡 Lições Aprendidas

### Do Que Funcionou ✅

1. **Migrações pequenas e focadas**
   - Fácil de testar
   - Fácil de reverter
   - Clara responsabilidade

2. **Nomes descritivos**
   - `add-admin-delete-profile-policy.sql` é claro
   - Fácil de encontrar o que precisa
   - Auto-documentação

3. **Comentários extensivos**
   - Explicam o "por quê"
   - Facilitam manutenção futura
   - Ajudam novos desenvolvedores

### Do Que Não Funcionou ❌

1. **Muitos arquivos soltos**
   - Difícil manter ordem
   - Risco de pular migração
   - Complexo de versionar

2. **Dependências implícitas**
   - Nem sempre claras
   - Causam erros sutis
   - Difícil de debugar

3. **Sem validação automatizada**
   - Erros só aparecem em runtime
   - Falta checklist de integridade
   - Sem rollback automático

### Melhorias na v2.0 ✨

1. **Arquivo único consolidado**
   - Ordem garantida
   - Impossível pular etapas
   - Fácil de executar

2. **Idempotência completa**
   - Pode executar múltiplas vezes
   - Sem erros de "already exists"
   - Seguro para re-execução

3. **Validação automática**
   - Verifica tudo ao final
   - Conta tabelas/funções
   - Relatório de sucesso

4. **Documentação integrada**
   - README completo
   - Troubleshooting extensivo
   - Exemplos práticos

---

## 🔗 Links Úteis

### Documentação Principal
- `../README-DATABASE.md` - Guia completo de uso
- `../CONSOLIDATED_MIGRATION_GUIDE.md` - Guia de migração
- `../STORAGE_POLICIES_SETUP.md` - Setup de storage

### Arquivos Ativos
- `../complete-database-setup-v2.sql` - Setup atual
- `../rollback-complete-setup.sql` - Rollback completo
- `../verify-migrations.sql` - Verificação

---

## 📝 Notas Finais

Este archive é mantido para:
- 📚 **Histórico** - Preservar evolução do projeto
- 🔍 **Referência** - Consulta de implementações antigas
- 🎓 **Educação** - Aprender decisões técnicas
- 🐛 **Debug** - Comparar versões para troubleshooting

**Não use para:**
- ❌ Setup de produção
- ❌ Aplicar migrações
- ❌ Atualizar banco existente

**Use sempre:**
- ✅ `complete-database-setup-v2.sql` para setup
- ✅ `README-DATABASE.md` para guia
- ✅ `STORAGE_POLICIES_SETUP.md` para storage

---

**Última atualização:** 2025-11-02  
**Versão do archive:** 2.0.0  
**Arquivos preservados:** 20  
**Período coberto:** 2025-09 até 2025-11
