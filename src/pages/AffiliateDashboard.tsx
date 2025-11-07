import { useAffiliate, useAffiliateEarnings } from '@/hooks/queries/useAffiliate';
import { useCreateAffiliate } from '@/hooks/queries/useCreateAffiliate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, DollarSign, Users, TrendingUp, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSkeleton from '@/components/SimpleLoadingSkeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AffiliateDashboard() {
  const { data: affiliate, isLoading } = useAffiliate();
  const { data: earnings = [] } = useAffiliateEarnings();
  const createAffiliate = useCreateAffiliate();

  const handleCopyCode = () => {
    if (affiliate?.affiliate_code) {
      navigator.clipboard.writeText(affiliate.affiliate_code);
      toast.success('Código copiado!');
    }
  };

  const handleCopyLink = () => {
    if (affiliate?.affiliate_code) {
      const link = `${window.location.origin}/pricing?ref=${affiliate.affiliate_code}`;
      navigator.clipboard.writeText(link);
      toast.success('Link copiado!');
    }
  };

  const pendingEarnings = earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const paidEarnings = earnings
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // User is not an affiliate yet
  if (!affiliate) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Programa de Afiliados</CardTitle>
            <CardDescription>
              Ganhe comissões compartilhando HubgoX com seus amigos e seguidores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ganhe 10% de comissão</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba 10% de cada venda realizada através do seu link
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Compartilhe facilmente</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba um código único e um link personalizado para compartilhar
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Acompanhe seus ganhos</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboard completo com todas suas comissões e referências
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => createAffiliate.mutate()}
              disabled={createAffiliate.isPending}
              className="w-full"
              size="lg"
            >
              {createAffiliate.isPending ? 'Criando...' : 'Tornar-me Afiliado'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affiliate dashboard
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Afiliado</h1>
        <p className="text-muted-foreground">
          Acompanhe seus ganhos e compartilhe seu código
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliate.total_referrals}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {pendingEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {paidEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">já recebido</p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Code Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seu Código de Afiliado</CardTitle>
          <CardDescription>
            Compartilhe este código ou link para ganhar comissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-lg">
              {affiliate.affiliate_code}
            </code>
            <Button onClick={handleCopyCode} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-3 bg-muted rounded-lg text-sm break-all">
              {window.location.origin}/pricing?ref={affiliate.affiliate_code}
            </code>
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
              {affiliate.status === 'active' ? 'Ativo' : 'Pausado'}
            </Badge>
            <span>•</span>
            <span>Comissão: {Number(affiliate.commission_rate).toFixed(0)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Todas as comissões geradas através das suas indicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão gerada ainda. Comece a compartilhar seu código!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      {format(new Date(earning.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      R$ {Number(earning.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={earning.status === 'paid' ? 'default' : 'secondary'}>
                        {earning.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {earning.paid_at
                        ? format(new Date(earning.paid_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
