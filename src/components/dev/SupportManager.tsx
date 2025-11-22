import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { CheckCircle2, Eye } from 'lucide-react';
import { useSupportMessages } from '../../hooks/queries/useSupportMessages';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import LoadingSkeleton from '../SimpleLoadingSkeleton';

export default function SupportManager() {
  const { data: messages, isLoading, refetch } = useSupportMessages();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [response, setResponse] = useState('');

  const handleMarkAsResolved = async (id: string) => {
    const { error } = await supabase
      .from('support_messages')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao marcar como resolvida');
    } else {
      toast.success('Mensagem marcada como resolvida');
      refetch();
    }
  };

  const handleViewMessage = (message: any) => {
    setSelectedMessage(message);
    setResponse('');
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages?.map((message) => (
            <TableRow key={message.id}>
              <TableCell>{message.name}</TableCell>
              <TableCell>{message.email}</TableCell>
              <TableCell>{message.subject}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    message.status === 'resolved' ? 'secondary' : 'default'
                  }
                >
                  {message.status === 'pending' ? 'Pendente' : 'Resolvida'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(message.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewMessage(message)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {message.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkAsResolved(message.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={() => setSelectedMessage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mensagem de Suporte</DialogTitle>
            <DialogDescription>
              De: {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Assunto:</p>
              <p className="text-sm">{selectedMessage?.subject}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Mensagem:</p>
              <p className="text-sm whitespace-pre-wrap">
                {selectedMessage?.message}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Status:</p>
              <Badge
                variant={
                  selectedMessage?.status === 'resolved' ? 'secondary' : 'default'
                }
              >
                {selectedMessage?.status === 'pending' ? 'Pendente' : 'Resolvida'}
              </Badge>
            </div>
            {selectedMessage?.status === 'pending' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Responder:</p>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMessage(null)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => handleMarkAsResolved(selectedMessage.id)}>
                    Marcar como Resolvida
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}