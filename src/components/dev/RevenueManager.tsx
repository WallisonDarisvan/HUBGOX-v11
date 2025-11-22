import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DollarSign, Users, TrendingUp, Percent, Award } from 'lucide-react';
import { useRevenueMetrics, useRevenueByPlan, useTopAffiliates, useRevenueOverTime } from '../../hooks/queries/useDev';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function RevenueManager() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'all':
        start.setFullYear(2020);
        break;
    }
    
    return { start, end };
  }, [timeRange]);

  const { data: metrics, isLoading: metricsLoading } = useRevenueMetrics(dateRange.start, dateRange.end);
  const { data: planRevenue, isLoading: planLoading } = useRevenueByPlan(dateRange.start, dateRange.end);
  const { data: topAffiliates, isLoading: affiliatesLoading } = useTopAffiliates(dateRange.start, dateRange.end);
  const { data: revenueOverTime, isLoading: timeSeriesLoading } = useRevenueOverTime(dateRange.start, dateRange.end);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receita</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho financeiro da plataforma
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatCurrency(metrics?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afiliados Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : metrics?.affiliatesCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita de Afiliados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatCurrency(metrics?.affiliateRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : formatCurrency(metrics?.profit || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : `${metrics?.conversionRate.toFixed(2) || 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução diária da receita</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : revenueOverTime && revenueOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Receita" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados no período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
            <CardDescription>Faturamento por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando...
              </div>
            ) : planRevenue && planRevenue.filter(p => p.revenue > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planRevenue.filter(p => p.revenue > 0)}
                    dataKey="revenue"
                    nameKey="plan_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.plan_name}: ${formatCurrency(entry.revenue)}`}
                  >
                    {planRevenue.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados no período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Plano</CardTitle>
            <CardDescription>Detalhamento de receita por plano</CardDescription>
          </CardHeader>
          <CardContent>
            {planLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : planRevenue && planRevenue.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Assinantes</TableHead>
                    <TableHead className="text-right">Transações</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planRevenue.map((plan) => (
                    <TableRow key={plan.plan_id}>
                      <TableCell className="font-medium">{plan.plan_name}</TableCell>
                      <TableCell className="text-right">{plan.subscribers}</TableCell>
                      <TableCell className="text-right">{plan.transactions}</TableCell>
                      <TableCell className="text-right">{formatCurrency(plan.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Sem dados no período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Afiliados</CardTitle>
            <CardDescription>
              Afiliados com maior desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            {affiliatesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : topAffiliates && topAffiliates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Receita Gerada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAffiliates.map((affiliate: any) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">
                        {affiliate.profiles?.username || affiliate.profiles?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">{affiliate.total_referrals}</TableCell>
                      <TableCell className="text-right">{formatCurrency(affiliate.total_earnings)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum afiliado ativo
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}