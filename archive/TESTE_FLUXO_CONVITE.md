# 🧪 Guia de Teste: Fluxo Completo de Convites

## 📋 Pré-requisitos
- ✅ Usuário admin: **wallisondarisvan@gmail.com** (Plano Agência)
- ✅ 10 perfis temporários já criados (perfis 010-019)
- ✅ Sistema de migração corrigido implementado

---

## 🎯 Objetivo do Teste
Verificar se o fluxo de convite funciona corretamente:
1. Perfil temporário criado pelo admin
2. Dados adicionados ao perfil temporário
3. Convite aceito por novo usuário
4. Todos os dados migrados corretamente
5. Vínculo com criador mantido

---

## 📝 Passo a Passo do Teste

### **Fase 1: Preparar Perfil Temporário** (como Admin)

1. **Fazer login como admin:**
   - Email: `wallisondarisvan@gmail.com`
   - Já está logado ✅

2. **Acessar a página de gerenciamento de usuários:**
   - Ir para `/user-management` ou usar o menu Admin

3. **Selecionar o perfil "019"** (ou qualquer outro pendente):
   - Username: `019`
   - Display name: `019`
   - Status: **Pendente**

4. **Adicionar dados de teste ao perfil 019:**

   **a) Adicionar Cards:**
   - Card 1: "Instagram" → `https://instagram.com/019`
   - Card 2: "LinkedIn" → `https://linkedin.com/in/019`
   - Card 3: "Site Pessoal" → `https://019.com.br`

   **b) Criar um Formulário:**
   - Título: "Contato 019"
   - Descrição: "Entre em contato comigo"
   - Campos: Nome, Email, Telefone

   **c) Criar uma Lista:**
   - Título: "Meus Links"
   - Adicionar 3 itens:
     - Link 1 → `https://link1.com`
     - Link 2 → `https://link2.com`
     - Link 3 → `https://link3.com`

5. **Copiar o link de convite:**
   - Token do convite: `2d170f51-c20a-49ae-8adb-63eea8f7a4ce`
   - URL completa: `https://[seu-dominio]/invite/2d170f51-c20a-49ae-8adb-63eea8f7a4ce`

---

### **Fase 2: Aceitar Convite** (como Novo Usuário)

6. **Abrir em navegador anônimo** (ou fazer logout):
   - Colar a URL do convite no navegador

7. **Preencher formulário de cadastro:**
   - Email: `teste019@example.com` (use um email real se quiser testar confirmação)
   - Senha: `Teste123!`
   - Confirmar senha: `Teste123!`

8. **Clicar em "Criar Minha Conta"**
   - Aguardar processamento
   - Deve aparecer mensagem: "Cadastro realizado com sucesso!"

9. **Verificar login automático:**
   - Deve ser redirecionado para `/dashboard`
   - Deve estar autenticado como o novo usuário

---

### **Fase 3: Verificar Migração de Dados** (como Novo Usuário)

10. **Verificar perfil:**
    - Username deve ser: `019`
    - Display name deve ser: `019`
    - Status deve ser: **Vinculado** ✅

11. **Verificar Cards:**
    - Deve ver os 3 cards criados:
      - Instagram
      - LinkedIn
      - Site Pessoal
    - Todos devem estar editáveis

12. **Verificar Formulários:**
    - Deve ver o formulário "Contato 019"
    - Deve poder editar e visualizar

13. **Verificar Listas:**
    - Deve ver a lista "Meus Links"
    - Deve ter os 3 itens criados
    - Deve poder editar

14. **Verificar visualizações:**
    - Se houver visualizações de perfil, devem estar migradas

---

### **Fase 4: Verificar Vínculo com Criador** (como Admin)

15. **Fazer logout e login como admin novamente:**
    - Email: `wallisondarisvan@gmail.com`

16. **Acessar página de gerenciamento de usuários:**
    - Ir para `/user-management`

17. **Verificar perfil 019:**
    - Status deve ser: **Vinculado** ✅
    - Deve aparecer na lista de perfis gerenciados
    - Admin deve conseguir ver e editar os dados

18. **Verificar no banco de dados:**
    ```sql
    -- Execute esta query no SQL Editor do Supabase
    SELECT 
        ui.status,
        ui.profile_id,
        ui.linked_profile_id,
        ui.invited_by_admin_id,
        p_temp.username as profile_temp,
        p_linked.username as profile_linked
    FROM user_invitations ui
    LEFT JOIN profiles p_temp ON p_temp.id = ui.profile_id
    LEFT JOIN profiles p_linked ON p_linked.id = ui.linked_profile_id
    WHERE ui.invitation_token = '2d170f51-c20a-49ae-8adb-63eea8f7a4ce';
    ```

    **Resultado esperado:**
    - `status` = `'accepted'`
    - `profile_id` = ID do perfil temporário (deve ser NULL após deleção)
    - `linked_profile_id` = ID do novo usuário
    - `invited_by_admin_id` = ID do admin (wallisondarisvan)

---

## ✅ Checklist de Validação

### Migração de Dados:
- [ ] Todos os **cards** foram migrados
- [ ] Todos os **formulários** foram migrados
- [ ] Todas as **listas** foram migradas
- [ ] Todos os **itens de lista** foram migrados
- [ ] Todas as **visualizações de perfil** foram migradas

### Vínculo com Criador:
- [ ] `profile_id` no convite **não foi alterado** (preserva histórico)
- [ ] `linked_profile_id` foi preenchido corretamente
- [ ] Admin consegue ver o perfil vinculado
- [ ] Admin consegue editar dados do perfil vinculado

### Limpeza:
- [ ] Perfil temporário foi **deletado** após migração
- [ ] Não há dados órfãos no banco
- [ ] Convite marcado como **aceito**

### Funcionalidade:
- [ ] Novo usuário consegue fazer login
- [ ] Novo usuário vê todos os seus dados
- [ ] Novo usuário consegue editar seus dados
- [ ] Admin consegue gerenciar o perfil vinculado

---

## 🐛 Problemas Conhecidos Corrigidos

### ✅ Bug 1: Migração Incompleta
**Antes:** Apenas cards e forms eram migrados  
**Agora:** Cards, forms, listas, itens de lista e visualizações são migrados

### ✅ Bug 2: Perda de Vínculo com Criador
**Antes:** `profile_id` era sobrescrito, perdendo rastreamento  
**Agora:** `profile_id` é preservado, apenas `linked_profile_id` é preenchido

### ✅ Bug 3: Bug de Sintaxe SQL
**Antes:** `SET user_id = user_id` não funcionava (referência ambígua)  
**Agora:** `SET user_id = accept_invitation.user_id` usa o parâmetro correto

### ✅ Bug 4: Dados Órfãos
**Antes:** Deletar perfil temporário antes de migrar causava perda de dados  
**Agora:** Perfil só é deletado APÓS migração completa

---

## 📊 Logs para Verificar

Após aceitar o convite, verifique os logs no Supabase (Edge Function Logs):

```
accept_invitation: Iniciando para token=... user_id=...
accept_invitation: Convite válido encontrado
accept_invitation: Profile configurado com sucesso
accept_invitation: 3 cards migrados
accept_invitation: 1 form_configs migrados
accept_invitation: 1 link_lists migrados
accept_invitation: 0 profile_views migrados
accept_invitation: Convite marcado como aceito
accept_invitation: Profile temporário deletado
accept_invitation: Processo concluído com sucesso!
```

---

## 🔄 Testar Cenários Adicionais

### Teste 2: Convite Expirado
1. Execute: `SELECT expire_old_invitations();`
2. Ou aguarde 7 dias
3. Tente aceitar convite expirado
4. Deve mostrar: "Convite inválido ou expirado"

### Teste 3: Múltiplos Perfis
1. Aceite 3-4 convites diferentes
2. Verifique que admin vê todos
3. Verifique que cada usuário vê apenas o seu

### Teste 4: Renovação de Convite
1. Tente renovar um convite expirado
2. Novo token deve ser gerado
3. Convite antigo deve ser deletado

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console (F12)
2. Verifique os Edge Function Logs no Supabase
3. Execute as queries de verificação do banco de dados
4. Documente o erro e compartilhe os logs
