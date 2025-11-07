# Storage RLS: Multi-Tenancy para Admins

## ⚠️ IMPORTANTE: Configuração Manual Necessária

As políticas de Storage RLS **NÃO PODEM** ser criadas via SQL Editor devido a restrições de segurança do Supabase.

Você deve criar estas políticas manualmente via **Dashboard do Supabase** em:
`Storage > Buckets > [nome-do-bucket] > Policies`

---

## 📋 Políticas a Criar

Para cada bucket (`avatars`, `profile-covers`, `card-images`, `form-backgrounds`), você precisa criar **3 políticas** (INSERT, UPDATE, DELETE).

**Total: 12 políticas** (3 × 4 buckets)

---

## 🔄 Processo de Substituição

Para cada bucket, você deve:

1. **Remover** as políticas existentes que verificam apenas `auth.uid()`
2. **Criar** novas políticas que permitem acesso do usuário OU do admin dono

---

## 📝 Políticas por Bucket

### 1️⃣ BUCKET: `avatars`

#### **INSERT Policy**
- **Nome**: `Admins can upload to avatars for their users`
- **Operação**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**:

```sql
(
  bucket_id = 'avatars' 
  AND (
    -- Usuário pode fazer upload na própria pasta
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Admin pode fazer upload em pastas de seus usuários
    (
      public.has_role(auth.uid(), 'admin')
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
        FROM user_invitations ui
        WHERE ui.invited_by_admin_id = auth.uid()
      )
    )
  )
)
```

#### **UPDATE Policy**
- **Nome**: `Admins can update in avatars for their users`
- **Operação**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:

```sql
(
  bucket_id = 'avatars' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      public.has_role(auth.uid(), 'admin')
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
        FROM user_invitations ui
        WHERE ui.invited_by_admin_id = auth.uid()
      )
    )
  )
)
```

- **WITH CHECK expression**: *(mesmo conteúdo do USING acima)*

#### **DELETE Policy**
- **Nome**: `Admins can delete from avatars for their users`
- **Operação**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:

```sql
(
  bucket_id = 'avatars' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    (
      public.has_role(auth.uid(), 'admin')
      AND (storage.foldername(name))[1]::uuid IN (
        SELECT COALESCE(ui.linked_profile_id, ui.profile_id)
        FROM user_invitations ui
        WHERE ui.invited_by_admin_id = auth.uid()
      )
    )
  )
)
```

---

### 2️⃣ BUCKET: `profile-covers`

Repita o mesmo processo do bucket `avatars`, substituindo:
- `bucket_id = 'avatars'` → `bucket_id = 'profile-covers'`
- Nomes das políticas: `...avatars...` → `...profile-covers...`

**Políticas a criar:**
1. `Admins can upload to profile-covers for their users` (INSERT)
2. `Admins can update in profile-covers for their users` (UPDATE)
3. `Admins can delete from profile-covers for their users` (DELETE)

---

### 3️⃣ BUCKET: `card-images`

Repita o mesmo processo, substituindo:
- `bucket_id = 'avatars'` → `bucket_id = 'card-images'`
- Nomes das políticas: `...avatars...` → `...card-images...`

**Políticas a criar:**
1. `Admins can upload to card-images for their users` (INSERT)
2. `Admins can update in card-images for their users` (UPDATE)
3. `Admins can delete from card-images for their users` (DELETE)

---

### 4️⃣ BUCKET: `form-backgrounds`

Repita o mesmo processo, substituindo:
- `bucket_id = 'avatars'` → `bucket_id = 'form-backgrounds'`
- Nomes das políticas: `...avatars...` → `...form-backgrounds...`

**Políticas a criar:**
1. `Admins can upload to form-backgrounds for their users` (INSERT)
2. `Admins can update in form-backgrounds for their users` (UPDATE)
3. `Admins can delete from form-backgrounds for their users` (DELETE)

---

## 🎯 Como Aplicar no Dashboard

### Passo a Passo:

1. Acesse: `https://supabase.com/dashboard/project/teignlrqltptrhqghoqs/storage/buckets`

2. Para cada bucket (`avatars`, `profile-covers`, `card-images`, `form-backgrounds`):
   
   a. Clique no bucket
   
   b. Clique na aba **"Policies"**
   
   c. **REMOVA** as políticas antigas:
      - `Users can upload their own [bucket]`
      - `Users can update their own [bucket]`
      - `Users can delete their own [bucket]`
   
   d. Clique em **"New Policy"**
   
   e. Selecione **"Create a custom policy"**
   
   f. Preencha os campos:
      - **Policy name**: Nome da política (ex: `Admins can upload to avatars for their users`)
      - **Policy command**: Selecione a operação (INSERT, UPDATE ou DELETE)
      - **Target roles**: `authenticated`
      - **USING expression**: Cole o SQL correspondente
      - **WITH CHECK expression**: Cole o SQL (para INSERT e UPDATE)
   
   g. Clique em **"Save policy"**
   
   h. Repita para as 3 políticas (INSERT, UPDATE, DELETE)

3. **Manter política SELECT existente**:
   - `Public can view [bucket]` → **NÃO REMOVER** (permite visualização pública)

---

## ✅ Checklist de Verificação

Após configurar todas as políticas, verifique:

### Bucket `avatars`:
- [ ] INSERT: `Admins can upload to avatars for their users`
- [ ] UPDATE: `Admins can update in avatars for their users`
- [ ] DELETE: `Admins can delete from avatars for their users`
- [ ] SELECT: `Public can view avatars` (existente - não mexer)

### Bucket `profile-covers`:
- [ ] INSERT: `Admins can upload to profile-covers for their users`
- [ ] UPDATE: `Admins can update in profile-covers for their users`
- [ ] DELETE: `Admins can delete from profile-covers for their users`
- [ ] SELECT: `Public can view profile covers` (existente - não mexer)

### Bucket `card-images`:
- [ ] INSERT: `Admins can upload to card-images for their users`
- [ ] UPDATE: `Admins can update in card-images for their users`
- [ ] DELETE: `Admins can delete from card-images for their users`
- [ ] SELECT: `Public can view card images` (existente - não mexer)

### Bucket `form-backgrounds`:
- [ ] INSERT: `Admins can upload to form-backgrounds for their users`
- [ ] UPDATE: `Admins can update in form-backgrounds for their users`
- [ ] DELETE: `Admins can delete from form-backgrounds for their users`
- [ ] SELECT: `Public can view form background images` (existente - não mexer)

---

## 🧪 Como Testar

Após aplicar todas as políticas:

1. **Login como Admin A**
2. Acesse `/dashboard/users`
3. Edite um usuário criado por você
4. Tente fazer upload de:
   - Avatar → ✅ Deve funcionar
   - Capa → ✅ Deve funcionar
5. Vá para `/dashboard/card/new`
6. Tente fazer upload de imagem no card → ✅ Deve funcionar

7. **Login como Admin B** (outro admin)
8. Acesse `/dashboard/users`
9. Você **NÃO** deve ver usuários do Admin A
10. Se tentar manipular URL para acessar usuário do Admin A → ❌ Deve falhar

---

## 🔍 Solução de Problemas

### Erro: `new row violates row-level security policy`

**Causa**: Política não foi criada corretamente ou está faltando.

**Solução**:
1. Verifique se todas as 12 políticas foram criadas
2. Verifique se o SQL foi copiado corretamente (atenção a aspas e parênteses)
3. Teste a query SQL no SQL Editor antes de usar na política

### Erro: `permission denied for table objects`

**Causa**: Política foi criada com sintaxe incorreta ou função `has_role` não existe.

**Solução**:
1. Execute `SELECT public.has_role(auth.uid(), 'admin');` no SQL Editor (deve retornar true/false)
2. Verifique se a função `has_role` foi criada no script `complete-database-setup-v2.sql`

### Admin consegue ver usuários de outro admin

**Causa**: Políticas de database RLS não foram aplicadas corretamente.

**Solução**:
1. Execute novamente `restrict-admin-to-their-users.sql`
2. Verifique com `verify-multi-tenancy.sql`

---

## 📚 Referências

- [Supabase Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Folder Structure](https://supabase.com/docs/guides/storage/uploads/file-paths)

---

## 🎯 Próximos Passos

Após configurar Storage:

1. Execute `verify-multi-tenancy.sql` para validar isolamento
2. Teste upload de imagens como admin
3. Teste isolamento entre dois admins diferentes
4. Documente quaisquer casos de uso específicos do seu sistema
