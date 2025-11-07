import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportMessages } from '@/hooks/queries/useSupportMessages';
import { useSendSupportMessage, type SendSupportMessageData } from '@/hooks/queries/useSendSupportMessage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Footer } from '@/components/Footer';

const supportSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  subject: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres').max(200, 'Assunto deve ter no máximo 200 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres').max(2000, 'Mensagem deve ter no máximo 2000 caracteres'),
});

type SupportFormData = z.infer<typeof supportSchema>;

export default function Support() {
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const { data: messages, isLoading: isLoadingMessages } = useSupportMessages(user?.id);
  const sendMessage = useSendSupportMessage();

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    try {
      const payload: SendSupportMessageData = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        userId: user?.id,
      };
      
      await sendMessage.mutateAsync(payload);
      
      setShowSuccess(true);
      form.reset();
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending support message:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      replied: { label: 'Respondido', variant: 'default' as const },
      closed: { label: 'Fechado', variant: 'outline' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Cabeçalho */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Central de Suporte
            </h1>
            <p className="mt-4 text-muted-foreground">
              Entre em contato conosco. Responderemos o mais breve possível.
            </p>
          </div>

          {/* Mensagem de Sucesso */}
          {showSuccess && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Mensagem enviada com sucesso!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Entraremos em contato em breve através do email fornecido.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem</CardTitle>
              <CardDescription>
                Preencha o formulário abaixo com sua dúvida ou solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto</FormLabel>
                        <FormControl>
                          <Input placeholder="Descreva brevemente o motivo do contato" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva sua dúvida ou problema em detalhes..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={sendMessage.isPending} className="w-full">
                    {sendMessage.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Lista de Mensagens Enviadas (apenas para usuários logados) */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Minhas Mensagens</CardTitle>
                <CardDescription>
                  Histórico de mensagens enviadas para o suporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{message.subject}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(message.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {getStatusBadge(message.status)}
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Você ainda não enviou nenhuma mensagem para o suporte.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
