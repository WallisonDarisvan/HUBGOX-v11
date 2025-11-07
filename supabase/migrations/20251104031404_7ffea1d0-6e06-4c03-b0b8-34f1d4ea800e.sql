-- Criar tabela para mensagens de suporte
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX idx_support_messages_status ON public.support_messages(status);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode inserir mensagens (permite envio anônimo)
CREATE POLICY "Anyone can insert support messages"
ON public.support_messages
FOR INSERT
TO public
WITH CHECK (true);

-- Política: Usuários logados podem ver suas próprias mensagens
CREATE POLICY "Users can view their own support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: Admins podem ver todas as mensagens
CREATE POLICY "Admins can view all support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();