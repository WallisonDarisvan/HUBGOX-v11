# 📦 Configuração de Políticas de Storage - Guia Completo

## ⚠️ Por que este arquivo existe?

O Supabase protege a tabela `storage.objects` por questões de segurança. Você **NÃO PODE** criar políticas RLS nesta tabela usando SQL direto no SQL Editor. As políticas devem ser configuradas através do **Dashboard do Supabase**.

---

## 🎯 Buckets Criados

O script `complete-database-setup-v2.sql` criou automaticamente os seguintes buckets:

- ✅ `avatars` - Para fotos de perfil dos usuários
- ✅ `profile-covers` - Para imagens de capa de perfil
- ✅ `card-images` - Para imagens dos cards
- ✅ `form-backgrounds` - Para imagens de fundo dos formulários

Agora você precisa **configurar as políticas de acesso** para cada bucket.

---

## 📋 Como Configurar (Passo a Passo)

### 1️⃣ Acesse o Dashboard do Supabase

1. Faça login no [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Clique na aba **Policies**

---

### 2️⃣ Configure as Políticas para Cada Bucket

Você precisará criar **4 políticas** para cada um dos 4 buckets. Total: **16 políticas**.

#### 🔐 Estrutura das Políticas

Para cada bucket, crie as seguintes políticas:

---

#### **Política 1: INSERT (Upload de arquivos)**

**Nome da Policy:**
```
Users can upload to [NOME-DO-BUCKET]
```

**Operação:** `INSERT`

**Target Roles:** `authenticated`

**Policy Definition (USING):**
```sql
bucket_id = '[NOME-DO-BUCKET]' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Explicação:** Permite que usuários autenticados façam upload apenas para suas próprias pastas (identificadas pelo UUID do usuário).

---

#### **Política 2: UPDATE (Atualização de arquivos)**

**Nome da Policy:**
```
Users can update in [NOME-DO-BUCKET]
```

**Operação:** `UPDATE`

**Target Roles:** `authenticated`

**Policy Definition (USING):**
```sql
bucket_id = '[NOME-DO-BUCKET]' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Explicação:** Permite que usuários autenticados atualizem apenas seus próprios arquivos.

---

#### **Política 3: DELETE (Remoção de arquivos)**

**Nome da Policy:**
```
Users can delete from [NOME-DO-BUCKET]
```

**Operação:** `DELETE`

**Target Roles:** `authenticated`

**Policy Definition (USING):**
```sql
bucket_id = '[NOME-DO-BUCKET]' AND auth.uid()::text = (storage.foldername(name))[1]
```

**Explicação:** Permite que usuários autenticados deletem apenas seus próprios arquivos.

---

#### **Política 4: SELECT (Visualização pública)**

**Nome da Policy:**
```
Public can view [NOME-DO-BUCKET]
```

**Operação:** `SELECT`

**Target Roles:** `public` *(permitir usuários anônimos também)*

**Policy Definition (USING):**
```sql
bucket_id = '[NOME-DO-BUCKET]'
```

**Explicação:** Permite que qualquer pessoa (autenticada ou não) visualize os arquivos do bucket.

---

## 📝 Exemplo Completo: Bucket `avatars`

Vamos criar todas as 4 políticas para o bucket `avatars` como exemplo:

### 1. INSERT - Upload de avatares
- **Nome:** `Users can upload to avatars`
- **Operação:** `INSERT`
- **Target:** `authenticated`
- **Policy:**
  ```sql
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### 2. UPDATE - Atualização de avatares
- **Nome:** `Users can update in avatars`
- **Operação:** `UPDATE`
- **Target:** `authenticated`
- **Policy:**
  ```sql
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### 3. DELETE - Remoção de avatares
- **Nome:** `Users can delete from avatars`
- **Operação:** `DELETE`
- **Target:** `authenticated`
- **Policy:**
  ```sql
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

### 4. SELECT - Visualização pública de avatares
- **Nome:** `Public can view avatars`
- **Operação:** `SELECT`
- **Target:** `public`
- **Policy:**
  ```sql
  bucket_id = 'avatars'
  ```

---

## ✅ Checklist de Configuração

Use este checklist para garantir que configurou tudo corretamente:

### Bucket: `avatars`
- [ ] INSERT policy criada
- [ ] UPDATE policy criada
- [ ] DELETE policy criada
- [ ] SELECT policy criada

### Bucket: `profile-covers`
- [ ] INSERT policy criada
- [ ] UPDATE policy criada
- [ ] DELETE policy criada
- [ ] SELECT policy criada

### Bucket: `card-images`
- [ ] INSERT policy criada
- [ ] UPDATE policy criada
- [ ] DELETE policy criada
- [ ] SELECT policy criada

### Bucket: `form-backgrounds`
- [ ] INSERT policy criada
- [ ] UPDATE policy criada
- [ ] DELETE policy criada
- [ ] SELECT policy criada

---

## 🔍 Como Verificar se Funcionou

Após configurar todas as políticas:

1. Tente fazer upload de um arquivo no aplicativo
2. Tente visualizar o arquivo
3. Tente atualizar o arquivo
4. Tente deletar o arquivo

Se todas as operações funcionarem corretamente, a configuração está completa! ✅

---

## 🆘 Solução de Problemas

### Erro: "new row violates row-level security policy"
- **Causa:** Política de INSERT não configurada corretamente
- **Solução:** Verifique se a policy definition do INSERT está correta

### Erro: "permission denied for table objects"
- **Causa:** Você tentou criar políticas via SQL Editor
- **Solução:** Use o Dashboard do Supabase conforme este guia

### Arquivos não aparecem no app
- **Causa:** Política de SELECT não configurada ou bucket não é público
- **Solução:** Verifique se o bucket está marcado como `public` e se a SELECT policy foi criada

---

## 📚 Documentação Oficial

Para mais informações, consulte:
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 Pronto!

Após seguir este guia, seu sistema de storage estará completamente funcional e seguro! 🔒
