import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { usePlan } from '@/contexts/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, User, ExternalLink, FileText, RotateCcw, Copy, List } from 'lucide-react';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/components/Footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCardsWithMetrics, useDeleteCard } from '@/hooks/queries/useCards';
import { useProfile, useProfileMetrics, useResetMetrics } from '@/hooks/queries/useProfile';
import { useFormsWithMetrics, useDeleteForm } from '@/hooks/queries/useForms';
import { useLists, useDeleteList } from '@/hooks/queries/useLists';
import UserManagement from './UserManagement';
import { useResourceLimit } from '@/hooks/useResourceLimit';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { LimitBadge } from '@/components/LimitBadge';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { viewingUserId, isViewingOtherUser, isAdminMode } = useAdminView();
  const navigate = useNavigate();
  const { currentPlan } = usePlan();
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [showResetMetrics, setShowResetMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'cards' | 'forms' | 'lists'>('profile');

  // viewingUserId pode ser:
  // - null: Modo Administrador (gestão de usuários)
  // - user.id: Meu Dashboard (cards/forms do próprio admin)
  // - outro_id: Dashboard do usuário convidado
  const isViewingOwnProfile = viewingUserId === user?.id;
  const effectiveUserId = viewingUserId || user?.id;

  // Modo admin puro: APENAS quando viewingUserId é null (usa isAdminMode do contexto)
  const adminModeEffective = isAdminMode;

  // Use React Query hooks - só carrega cards e forms se não estiver em modo admin
  const { data: ownProfile } = useProfile(user?.id);
  const { data: viewedUserProfile } = useProfile(isViewingOtherUser ? viewingUserId : null);
  const { data: cards = [], isLoading: cardsLoading } = useCardsWithMetrics(adminModeEffective ? null : effectiveUserId);
  const { data: forms = [], isLoading: formsLoading } = useFormsWithMetrics(adminModeEffective ? null : effectiveUserId);
  const { data: lists = [] } = useLists(adminModeEffective ? null : effectiveUserId);
  const { data: metrics } = useProfileMetrics(adminModeEffective ? null : effectiveUserId);
  const deleteCardMutation = useDeleteCard();
  const deleteFormMutation = useDeleteForm();
  const deleteListMutation = useDeleteList();
  const resetMetricsMutation = useResetMetrics();
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  
  // Resource limits - passa effectiveUserId para contar por perfil em planos com admin mode
  const cardLimits = useResourceLimit('cards', effectiveUserId);
  const formLimits = useResourceLimit('forms', effectiveUserId);
  const listLimits = useResourceLimit('lists', effectiveUserId);

  const profile = isViewingOtherUser ? viewedUserProfile : ownProfile;
  const profileViews = metrics?.profile_views || 0;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleDeleteCard = async () => {
    if (!deleteCardId) return;
    await deleteCardMutation.mutateAsync(deleteCardId);
    setDeleteCardId(null);
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId) return;
    await deleteFormMutation.mutateAsync(deleteFormId);
    setDeleteFormId(null);
  };

  const handleDeleteList = async () => {
    if (!deleteListId) return;
    await deleteListMutation.mutateAsync(deleteListId);
    setDeleteListId(null);
  };

  const handleResetMetrics = async () => {
    if (!effectiveUserId) return;
    const cardIds = cards.map(card => card.id);
    await resetMetricsMutation.mutateAsync({ userId: effectiveUserId, cardIds });
    setShowResetMetrics(false);
  };

  console.log('Dashboard state:', {
    authLoading, 
    cardsLoading, 
    user: !!user, 
    effectiveUserId,
    cards: cards?.length || 0 
  });

  if (authLoading) {
    console.log('Dashboard showing loading state:', { authLoading });
    return <DashboardSkeleton />;
  }

  const pageTitle = "Meu Dashboard | Gerenciar Links";
  const pageDescription = "Gerencie seus links, personalize sua página e acompanhe seu conteúdo.";
  const pageImage = `${window.location.origin}/placeholder.svg`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
      </Helmet>
      
      <div className="max-w-6xl mx-auto p-4 md:p-8">

        {/* Se está em modo administrador, mostra gestão de usuários */}
        {adminModeEffective ? (
          <UserManagement isEmbedded />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold">
                  {isViewingOtherUser ? 'Dashboard do Perfil' : 'Meu Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {isViewingOtherUser 
                    ? `Gerenciando página de ${viewedUserProfile?.display_name || viewedUserProfile?.username}` 
                    : 'Gerencie sua página de links'}
                </p>
              </div>
            </div>

        {/* Profile Info Card */}
        {(isViewingOtherUser ? viewedUserProfile : profile) && (
          <Card className="glass-card border-border mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isViewingOtherUser ? 'Página pública do perfil:' : 'Sua página pública:'}
                  </p>
                  <p className="text-lg font-semibold">
                    {window.location.origin}/{isViewingOtherUser ? viewedUserProfile?.username : profile?.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/${(isViewingOtherUser ? viewedUserProfile?.username : profile?.username)}`)}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Página
                  </Button>
                  <Button
                    onClick={() => {
                      const username = isViewingOtherUser ? viewedUserProfile?.username : profile?.username;
                      navigator.clipboard.writeText(`${window.location.origin}/${username}`);
                      toast.success('Link copiado!');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Copiar Link
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Visitas ao perfil:</p>
                    <p className="text-2xl font-bold text-accent">{profileViews}</p>
                  </div>
                  <Button
                    onClick={() => setShowResetMetrics(true)}
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 hover:bg-destructive/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Zerar Métricas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Plus className="w-4 h-4 mr-2" />
              Meus Cards
            </TabsTrigger>
            <TabsTrigger value="forms">
              <FileText className="w-4 h-4 mr-2" />
              Meus Formulários
            </TabsTrigger>
            <TabsTrigger value="lists">
              <List className="w-4 h-4 mr-2" />
              Minhas Listas
            </TabsTrigger>
          </TabsList>

          {/* Profile Edit Content */}
          <TabsContent value="profile" className="mt-0">
            <Card className="glass-card border-border">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Editar Perfil</h3>
                  <p className="text-muted-foreground mb-6">
                    Personalize seu perfil, adicione foto, bio e links sociais
                  </p>
                  <Button
                    onClick={() => navigate('/profile', { 
                      state: { userId: viewingUserId }
                    })}
                    className="gradient-cyan"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Ir para Edição de Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards List Content */}
          <TabsContent value="cards" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <LimitBadge used={cardLimits.used} limit={cardLimits.limit} resource="cards" />
              
              {cardLimits.canCreate ? (
                <Button
                  onClick={() => navigate('/dashboard/card/new')}
                  className="gradient-cyan"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Card
                </Button>
              ) : (
                <Button disabled className="opacity-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Limite atingido
                </Button>
              )}
            </div>
            
            {!cardLimits.canCreate && (
              <div className="mb-4">
                <UpgradePrompt 
                  resource="cards" 
                  limit={cardLimits.limit} 
                  planName={cardLimits.planName} 
                />
              </div>
            )}
            <div className="grid gap-4">
              {cards.length === 0 ? (
                <Card className="glass-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={Plus}
                      title="Nenhum card criado"
                      description="Crie seu primeiro card para começar a compartilhar seus links. Cards são os blocos que aparecem na sua página pública."
                      actionLabel="Criar Meu Primeiro Card"
                      onAction={() => navigate('/dashboard/card/new')}
                    />
                  </CardContent>
                </Card>
              ) : (
                cards.map((card) => (
                  <Card key={card.id} className="glass-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{card.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-2 break-all">
                            {card.link_url}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${card.status ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {card.status ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                              {card.clicks_count || 0} {card.clicks_count === 1 ? 'clique' : 'cliques'}
                            </span>
                          </div>
                        </div>
                        {card.image_url && (
                          <img
                            src={card.image_url}
                            alt={card.title}
                            className="w-20 h-20 object-cover rounded ml-4"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/dashboard/card/${card.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => setDeleteCardId(card.id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Forms List Content */}
          <TabsContent value="forms" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <LimitBadge used={formLimits.used} limit={formLimits.limit} resource="formulários" />
              
              {formLimits.canCreate ? (
                <Button
                  onClick={() => navigate('/dashboard/form/new')}
                  className="gradient-cyan"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Formulário
                </Button>
              ) : (
                <Button disabled className="opacity-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Limite atingido
                </Button>
              )}
            </div>
            
            {!formLimits.canCreate && (
              <div className="mb-4">
                <UpgradePrompt 
                  resource="formulários" 
                  limit={formLimits.limit} 
                  planName={formLimits.planName} 
                />
              </div>
            )}
            <div className="grid gap-4">
              {forms.length === 0 ? (
                <Card className="glass-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={FileText}
                      title="Nenhum formulário criado"
                      description="Crie seu primeiro formulário para começar a capturar leads e informações. Formulários podem ser vinculados aos seus cards."
                      actionLabel="Criar Meu Primeiro Formulário"
                      onAction={() => navigate('/dashboard/form/new')}
                    />
                  </CardContent>
                </Card>
              ) : (
                forms.map((form) => (
                  <Card key={form.id} className="glass-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{form.title}</CardTitle>
                          {form.slug && (
                            <p className="text-sm text-muted-foreground mt-2">
                              /{(isViewingOtherUser ? viewedUserProfile?.username : profile?.username)}/form/{form.slug}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${form.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {form.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                              {form.submissions_count || 0} {form.submissions_count === 1 ? 'submissão' : 'submissões'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => navigate(`/dashboard/form/${form.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => navigate(`/dashboard/form/${form.id}/submissions`)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Submissões
                        </Button>
                        {form.slug && (
                          <Button
                            onClick={() => {
                              const username = isViewingOtherUser ? viewedUserProfile?.username : profile?.username;
                              navigator.clipboard.writeText(`${window.location.origin}/${username}/form/${form.slug}`);
                              toast.success('Link copiado!');
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Link
                          </Button>
                        )}
                        <Button
                          onClick={() => setDeleteFormId(form.id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Lists Content */}
          <TabsContent value="lists" className="mt-0">
            <div className="mb-4 flex justify-between items-center">
              <LimitBadge used={listLimits.used} limit={listLimits.limit} resource="listas" />
              
              {listLimits.canCreate ? (
                <Button
                  onClick={() => navigate('/dashboard/list/new')}
                  className="gradient-cyan"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Lista
                </Button>
              ) : (
                <Button disabled className="opacity-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Limite atingido
                </Button>
              )}
            </div>
            
            {!listLimits.canCreate && (
              <div className="mb-4">
                <UpgradePrompt 
                  resource="listas" 
                  limit={listLimits.limit} 
                  planName={listLimits.planName} 
                />
              </div>
            )}
            <div className="grid gap-4">
              {lists.length === 0 ? (
                <Card className="glass-card border-border">
                  <CardContent className="pt-6">
                    <EmptyState
                      icon={List}
                      title="Nenhuma lista criada"
                      description="Crie sua primeira lista de links para organizar e compartilhar múltiplos botões em uma única página."
                      actionLabel="Criar Minha Primeira Lista"
                      onAction={() => navigate('/dashboard/list/new')}
                    />
                  </CardContent>
                </Card>
              ) : (
                lists.map((list) => (
                  <Card key={list.id} className="glass-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{list.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            /{profile?.username}/list/{list.slug}
                          </p>
                          {list.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {list.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${list.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {list.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                              {list.items_count || 0} {list.items_count === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/${profile?.username}/list/${list.slug}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Link copiado!');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Link
                        </Button>
                        <Button
                          onClick={() => window.open(`/${profile?.username}/list/${list.slug}`, '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Página
                        </Button>
                        <Button
                          onClick={() => navigate(`/dashboard/list/${list.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => setDeleteListId(list.id)}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Card Confirmation Dialog */}
      <AlertDialog open={!!deleteCardId} onOpenChange={(open) => !open && setDeleteCardId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Form Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={(open) => !open && setDeleteFormId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita e todas as submissões serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteForm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete List Confirmation Dialog */}
      <AlertDialog open={!!deleteListId} onOpenChange={(open) => !open && setDeleteListId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita e todos os itens da lista serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Metrics Confirmation Dialog */}
      <AlertDialog open={showResetMetrics} onOpenChange={setShowResetMetrics}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar reset de métricas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja zerar todas as métricas de visitas e cliques? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetMetrics}
              className="bg-destructive hover:bg-destructive/90"
            >
              Zerar Métricas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
        )}
      </div>
      
      <Footer />
    </>
  );
};

export default Dashboard;
