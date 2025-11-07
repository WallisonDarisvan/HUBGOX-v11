import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, MessageSquare, Layers, DollarSign, UserCheck } from 'lucide-react';
import { useIsDevUser } from '@/hooks/queries/useDev';
import LoadingSkeleton from '@/components/SimpleLoadingSkeleton';
import PlansManager from '@/components/dev/PlansManager';
import UsersManager from '@/components/dev/UsersManager';
import SupportManager from '@/components/dev/SupportManager';
import { RevenueManager } from '@/components/dev/RevenueManager';
import AffiliatesManager from '@/components/dev/AffiliatesManager';

export default function DevPortal() {
  const navigate = useNavigate();
  const { data: isDev, isLoading } = useIsDevUser();

  useEffect(() => {
    if (!isLoading && !isDev) {
      navigate('/');
    }
  }, [isDev, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isDev) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portal DEV</h1>
        <p className="text-muted-foreground">
          Painel de administração para desenvolvedores
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Afiliados
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Suporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Planos</CardTitle>
              <CardDescription>
                Criar, editar e gerenciar planos disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlansManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                Buscar usuários e visualizar informações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Afiliados</CardTitle>
              <CardDescription>
                Gerenciar afiliados, visualizar ganhos e controlar status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AffiliatesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueManager />
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens de Suporte</CardTitle>
              <CardDescription>
                Visualizar e responder mensagens de suporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
