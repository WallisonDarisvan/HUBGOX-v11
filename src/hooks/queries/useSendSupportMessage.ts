import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SendSupportMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}

export function useSendSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendSupportMessageData) => {
      // Salvar mensagem no banco de dados
      const { data: messageData, error: dbError } = await supabase
        .from('support_messages')
        .insert({
          user_id: data.userId || null,
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Enviar email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        },
      });

      if (emailError) {
        console.error('Error sending support email:', emailError);
        // Não falhar se o email não for enviado, a mensagem já foi salva
      }

      return messageData;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Mensagem enviada!',
        description: 'Entraremos em contato em breve.',
      });
      
      // Invalidar cache de mensagens se o usuário estiver logado
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['support-messages', variables.userId] });
      }
    },
    onError: (error) => {
      console.error('Error sending support message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    },
  });
}