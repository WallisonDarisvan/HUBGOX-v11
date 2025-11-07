import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Pause, Play, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Affiliate {
  id: string;
  user_id: string;
  affiliate_code: string;
  commission_rate: number;
  total_earnings: number;
  total_referrals: number;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    email: string;
  };
}

function useAllAffiliates() {
  return useQuery({
    queryKey: ['all-affiliates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('total_earnings', { ascending: false });

      if (error) throw error;

      // Buscar profiles separadamente
      if (!data || data.length === 0) return [];

      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return data.map(affiliate => ({
        ...affiliate,
        profiles: profileMap.get(affiliate.user_id),
      })) as Affiliate[];
    },
  });
}

function useToggleAffiliateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ affiliateId, newStatus }: { affiliateId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: newStatus })
        .eq('id', affiliateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-affiliates'] });
      toast.success('Status do afiliado atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}

export default function AffiliatesManager() {
  const { data: affiliates, isLoading } = useAllAffiliates();
  const toggleStatus = useToggleAffiliateStatus();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (affiliate: Affiliate) => {
    setTogglingId(affiliate.id);
    const newStatus = affiliate.status === 'active' ? 'paused' : 'active';
    await toggleStatus.mutateAsync({ affiliateId: affiliate.id, newStatus });
    setTogglingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!affiliates || affiliates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum afiliado cadastrado ainda</p>
      </Card>
    );
  }

  const totalEarnings = affiliates.reduce((sum, a) => sum + Number(a.total_earnings), 0);
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total de Afiliados</p>
          <p className="text-2xl font-bold">{affiliates.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
          <p className="text-2xl font-bold">{activeAffiliates}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Ganho</p>
          <p className="text-2xl font-bold">
            {totalEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Referidos</TableHead>
              <TableHead>Total Ganho</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{affiliate.profiles?.username || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{affiliate.profiles?.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.affiliate_code}</code>
                </TableCell>
                <TableCell>{affiliate.commission_rate}%</TableCell>
                <TableCell>{affiliate.total_referrals}</TableCell>
                <TableCell>
                  {Number(affiliate.total_earnings).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                    {affiliate.status === 'active' ? 'Ativo' : 'Pausado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(affiliate)}
                    disabled={togglingId === affiliate.id}
                  >
                    {togglingId === affiliate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : affiliate.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
