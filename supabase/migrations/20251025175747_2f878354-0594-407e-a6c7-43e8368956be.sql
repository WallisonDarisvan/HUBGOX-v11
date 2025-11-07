-- Criar perfil para o usuário existente (se ainda não existe)
INSERT INTO public.profiles (id, username, display_name)
VALUES (
  '99425aac-046b-4492-835d-8f1e71307d94',
  'user_99425aac',
  'Usuário'
)
ON CONFLICT (id) DO NOTHING;