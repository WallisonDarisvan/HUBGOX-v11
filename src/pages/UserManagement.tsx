import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, ExternalLink, Copy, Clock, CheckCircle, XCircle, Trash2, RefreshCw, X, UserX, LayoutDashboard } from 'lucide-react';
import { useProfilesWithInvitations, useDeleteProfile, useRenewInvitation, useUnlinkProfile, type ProfileWithInvitation } from '@/hooks/queries/useProfiles';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResourceLimit } from '@/hooks/useResourceLimit';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { LimitBadge } from '@/components/LimitBadge';

interface UserManagementProps {
  isEmbedded?: boolean;
}

const UserManagement = ({ isEmbedded = false }: UserManagementProps) => {
  const { user } = useAuth();
  const { currentPlan } = usePlan();
  const canAdmin = currentPlan?.allow_admin_mode || false;
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithInvitation | null>(null);
  const { setViewingUserId } = useAdminView();

  // Use React Query hooks
  const { data: profiles = [], isLoading: loading } = useProfilesWithInvitations();
  const deleteProfileMutation = useDeleteProfile();
  const renewInvitationMutation = useRenewInvitation();
  const unlinkProfileMutation = useUnlinkProfile();
  
  console.log('UserManagement: Profiles data', { profiles, loading, canAdmin });
  
  // Resource limits
  const profileLimits = useResourceLimit('profiles');

  // Access control - moved to useEffect to prevent setState during render
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!canAdmin) {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  }, [user, canAdmin, navigate]);

  // Early return for loading or unauthorized
  if (!user || !canAdmin) {
    return null;
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link de convite copiado!');
  };

  const copyPublicLink = (username: string) => {
    const publicUrl = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link público copiado!');
  };

  const renewInvitation = async (profile: ProfileWithInvitation) => {
    if (!user) return;
    
    await renewInvitationMutation.mutateAsync({
      profileId: profile.id,
      userId: user.id,
      email: profile.invitation_email,
    });
    
    // Update selected profile with new invitation data
    const updatedProfiles = profiles.find(p => p.id === profile.id);
    if (updatedProfiles) {
      setSelectedProfile(updatedProfiles);
    }
  };

  const deleteProfile = async (profile: ProfileWithInvitation) => {
    await deleteProfileMutation.mutateAsync(profile.id);
  };

  const unlinkProfile = async (profile: ProfileWithInvitation) => {
    if (!user) return;
    
    await unlinkProfileMutation.mutateAsync({
      profileId: profile.id,
      userId: user.id,
      email: profile.invitation_email,
    });
  };

  const getStatusBadge = (status: 'linked' | 'pending' | 'expired' | null, isOwnProfile: boolean = false) => {
    if (isOwnProfile) {
      return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1" />Meu Perfil</Badge>;
    }
    
    switch (status) {
      case 'linked':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Vinculado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Gerenciador de Perfis | Admin</title>
        <meta name="description" content="Gerencie perfis e convites do sistema" />
      </Helmet>
      
      <div className="max-w-6xl mx-auto">
        {!isEmbedded && (
          <div className="flex items-center justify-between mb-6">
            <Button onClick={() => navigate('/dashboard')} variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <LimitBadge used={profileLimits.used} limit={profileLimits.limit} resource="perfis" />
              {profileLimits.canCreate ? (
                <Button onClick={() => navigate('/dashboard/profiles/new')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Novo Perfil
                </Button>
              ) : (
                <Button disabled>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Limite atingido
                </Button>
              )}
            </div>
          </div>
        )}

        {isEmbedded && (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Gerenciador de Perfis</h1>
            <div className="flex items-center gap-3">
              <LimitBadge used={profileLimits.used} limit={profileLimits.limit} resource="perfis" />
              {profileLimits.canCreate ? (
                <Button onClick={() => navigate('/dashboard/profiles/new')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Novo Perfil
                </Button>
              ) : (
                <Button disabled>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Limite atingido
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!profileLimits.canCreate && (
          <div className="mb-6">
            <UpgradePrompt 
              resource="perfis" 
              limit={profileLimits.limit} 
              planName={profileLimits.planName} 
            />
          </div>
        )}

        {!isEmbedded && <h1 className="text-3xl font-bold mb-8">Gerenciador de Perfis</h1>}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map(profile => (
            <Card 
              key={profile.id} 
              className="glass-card border-border cursor-pointer hover:border-accent transition-colors"
              onClick={() => setSelectedProfile(profile)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {profile.is_pending ? (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                      alt={profile.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{profile.display_name || profile.username}</h3>
                    <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                    <div className="mt-2">
                      {getStatusBadge(profile.invitation_status, profile.id === user?.id)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal de Detalhes do Perfil */}
        <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
          <DialogContent className="glass-card border-border max-w-2xl">
            {selectedProfile && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-2xl">Detalhes do Perfil</DialogTitle>
                      <DialogDescription>
                        Gerencie as informações e links deste perfil
                      </DialogDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingUserId(selectedProfile.id);
                        navigate('/dashboard');
                        setSelectedProfile(null);
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Informações do Perfil */}
                  <div className="flex items-center gap-4">
                    {selectedProfile.is_pending ? (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="w-10 h-10 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={selectedProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfile.username}`}
                        alt={selectedProfile.username}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedProfile.display_name || selectedProfile.username}</h3>
                      <p className="text-muted-foreground">@{selectedProfile.username}</p>
                      {(selectedProfile.email || selectedProfile.invitation_email) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedProfile.email || selectedProfile.invitation_email}
                        </p>
                      )}
                      <div className="mt-2">
                        {getStatusBadge(selectedProfile.invitation_status, selectedProfile.id === user?.id)}
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Convite */}
                  {selectedProfile.is_pending && (
                    <Alert className="bg-background/50">
                      <AlertDescription>
                        A pessoa deve acessar o link de convite para completar o cadastro e definir sua senha.
                        O convite expira em 7 dias.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Links */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Link da Página Pública</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={`${window.location.origin}/${selectedProfile.username}`}
                          readOnly 
                          className="font-mono text-sm" 
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyPublicLink(selectedProfile.username)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(`${window.location.origin}/${selectedProfile.username}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedProfile.invitation_token && selectedProfile.invitation_status === 'pending' && (
                      <div className="space-y-2">
                        <Label>Link de Cadastro/Convite</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={`${window.location.origin}/invite/${selectedProfile.invitation_token}`}
                            readOnly 
                            className="font-mono text-sm" 
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyInviteLink(selectedProfile.invitation_token!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => window.open(`${window.location.origin}/invite/${selectedProfile.invitation_token}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedProfile.invitation_status === 'expired' && (
                      <div className="space-y-2">
                        <Alert className="border-red-500/50 bg-red-500/10">
                          <AlertDescription className="text-red-700">
                            Convite expirado em {new Date(selectedProfile.invitation_expires_at!).toLocaleDateString()}
                          </AlertDescription>
                        </Alert>
                        <Button
                          className="w-full"
                          onClick={() => renewInvitation(selectedProfile)}
                          disabled={renewInvitationMutation.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${renewInvitationMutation.isPending ? 'animate-spin' : ''}`} />
                          {renewInvitationMutation.isPending ? 'Criando...' : 'Criar Novo Convite'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-4 border-t border-border space-y-3">
                    {/* Botão de Desvincular - só aparece para perfis vinculados */}
                    {selectedProfile.invitation_status === 'linked' && !selectedProfile.is_pending && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/10"
                            disabled={unlinkProfileMutation.isPending}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {unlinkProfileMutation.isPending ? 'Desvinculando...' : 'Desvincular Perfil'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar desvinculação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desvincular <strong>@{selectedProfile.username}</strong>?
                              <br /><br />
                              O vínculo com o usuário será removido do sistema de autenticação e o perfil voltará ao status pendente.
                              Um novo link de convite será gerado e copiado automaticamente.
                              <br /><br />
                              A pessoa precisará criar uma nova senha usando o link de convite.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                unlinkProfile(selectedProfile);
                                setSelectedProfile(null);
                              }}
                              className="bg-yellow-600 text-white hover:bg-yellow-700"
                            >
                              Desvincular
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Botão de Apagar */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={deleteProfileMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deleteProfileMutation.isPending ? 'Apagando...' : 'Apagar Perfil'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja apagar o perfil <strong>@{selectedProfile.username}</strong>?
                            {selectedProfile.is_pending 
                              ? ' O perfil pendente e o convite associado serão removidos permanentemente.'
                              : ' Todos os dados associados a este perfil serão removidos permanentemente.'}
                            <br /><br />
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteProfile(selectedProfile);
                              setSelectedProfile(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Apagar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum perfil cadastrado</p>
            <Button onClick={() => navigate('/dashboard/profiles/new')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Primeiro Perfil
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
