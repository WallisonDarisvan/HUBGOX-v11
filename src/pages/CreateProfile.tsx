import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '../components/ui/alert';
import { z } from 'zod';
import { useResourceLimit } from '../hooks/useResourceLimit';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { LimitBadge } from '../components/LimitBadge';

const createUserSchema = z.object({
  username: z.string()
    .trim()
    .min(3, { message: 'Username deve ter no mínimo 3 caracteres' })
    .max(30, { message: 'Username deve ter no máximo 30 caracteres' })
    .regex(/^[a-z0-9-_]+$/, { message: 'Username deve conter apenas letras minúsculas, números, hífens e underscores' }),
  displayName: z.string()
    .trim()
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
    .optional(),
  email: z.string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email deve ter no máximo 255 caracteres' })
    .optional()
    .or(z.literal('')),
});

const CreateProfile = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const profileLimits = useResourceLimit('profiles');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
  });
  const [inviteData, setInviteData] = useState<{
    publicUrl: string;
    inviteUrl: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) {
      toast.error('Acesso negado');
      return;
    }

    // Revalidar limites antes de criar (forçar busca fresca do banco)
    await profileLimits.revalidate();
    
    // Verificar limite de perfis com dados atualizados
    if (!profileLimits.canCreate) {
      toast.error(`Limite de ${profileLimits.limit} perfis atingido. Faça upgrade do seu plano.`);
      navigate('/pricing');
      return;
    }

    // Validar dados do formulário
    const validation = createUserSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const normalizedUsername = formData.username.toLowerCase().trim();
      const displayName = formData.displayName.trim() || formData.username;
      const email = formData.email.trim() || null;

      // Validar se username já existe em profiles
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, is_activated')
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingProfile) {
        // Se perfil já existe, buscar convite associado
        const { data: existingInvitation } = await (supabase as any)
          .from('user_invitations')
          .select('*')
          .eq('profile_id', existingProfile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingInvitation) {
          // Verificar se o convite está expirado
          const isExpired = existingInvitation.status !== 'pending' || 
                           new Date(existingInvitation.expires_at) < new Date();

          if (isExpired && !existingProfile.is_activated) {
            // Convite expirado e perfil não ativado - criar novo convite
            toast.info('Convite expirado. Criando novo convite...');
            
            // Invalidar convites antigos
            await (supabase as any)
              .from('user_invitations')
              .update({ status: 'cancelled' })
              .eq('profile_id', existingProfile.id);

            // Criar novo convite
            const { data: newInvitation, error: newInvitationError } = await (supabase as any)
              .from('user_invitations')
              .insert({
                invited_by_admin_id: user.id,
                profile_id: existingProfile.id,
                email: email,
              })
              .select()
              .single();

            if (newInvitationError) throw newInvitationError;

            const publicUrl = `${window.location.origin}/${normalizedUsername}`;
            const inviteUrl = `${window.location.origin}/invite/${newInvitation.invitation_token}`;
            
            setInviteData({ publicUrl, inviteUrl });
            setCreated(true);
            toast.success('Novo convite criado com sucesso!');
            setLoading(false);
            return;
          }

          // Convite ainda válido ou perfil já ativado
          const publicUrl = `${window.location.origin}/${normalizedUsername}`;
          const inviteUrl = `${window.location.origin}/invite/${existingInvitation.invitation_token}`;
          
          setInviteData({ publicUrl, inviteUrl });
          setCreated(true);
          toast.info('Este perfil já existe! Aqui estão os links.');
          setLoading(false);
          return;
        }

        if (existingProfile.is_activated) {
          toast.error('Este username já está em uso por um perfil ativo');
          setLoading(false);
          return;
        }
      }

      // Criar profile diretamente (não ativado, aguardando convite)
      const profileId = crypto.randomUUID();
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          username: normalizedUsername,
          display_name: displayName,
          is_activated: false,
        });

      if (profileError) throw profileError;

      // Criar convite vinculado ao profile
      const { data: invitationData, error: invitationError } = await (supabase as any)
        .from('user_invitations')
        .insert({
          invited_by_admin_id: user.id,
          profile_id: profileId,
          email: email,
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      // Gerar URLs
      const publicUrl = `${window.location.origin}/${normalizedUsername}`;
      const inviteUrl = `${window.location.origin}/invite/${invitationData.invitation_token}`;

      setInviteData({ publicUrl, inviteUrl });
      setCreated(true);
      toast.success('Perfil criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = 'Erro ao criar perfil';
      
      if (error.message?.includes('duplicate')) {
        errorMessage = 'Este username já está em uso';
      } else if (error.message?.includes('permission denied') || error.message?.includes('policy')) {
        errorMessage = 'Permissão negada. Verifique as políticas RLS no banco de dados';
      } else if (error.code === '23505') {
        errorMessage = 'Este username já está em uso';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (!user || !isAdmin) {
    return null;
  }

  // Verificar limite antes de mostrar o formulário
  if (!profileLimits.canCreate && !created) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Helmet>
          <title>Limite Atingido | Admin</title>
        </Helmet>
        
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => navigate('/dashboard/profiles')} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <UpgradePrompt 
            resource="perfis" 
            limit={profileLimits.limit} 
            planName={profileLimits.planName} 
          />
          
          <div className="mt-6">
            <LimitBadge used={profileLimits.used} limit={profileLimits.limit} resource="perfis" />
          </div>
        </div>
      </div>
    );
  }

  if (created && inviteData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <Helmet>
          <title>Perfil Criado | Admin</title>
        </Helmet>
        
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => navigate('/dashboard/profiles')} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Gestão
          </Button>

          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Perfil Criado com Sucesso! 🎉</CardTitle>
              <CardDescription>
                Compartilhe os links abaixo com a pessoa que vai usar este perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  A pessoa deve acessar o link de convite para completar o cadastro e definir sua senha.
                  O convite expira em 7 dias.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Link da Página Pública</Label>
                  <div className="flex gap-2">
                    <Input value={inviteData.publicUrl} readOnly className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(inviteData.publicUrl, 'Link público')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.open(inviteData.publicUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Link de Cadastro/Convite</Label>
                  <div className="flex gap-2">
                    <Input value={inviteData.inviteUrl} readOnly className="font-mono text-sm" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(inviteData.inviteUrl, 'Link de convite')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.open(inviteData.inviteUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate('/dashboard/profiles')} className="w-full">
                Ver Todos os Perfis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Criar Novo Perfil | Admin</title>
        <meta name="description" content="Crie um novo perfil e gere link de convite" />
      </Helmet>
      
      <div className="max-w-2xl mx-auto">
        <Button onClick={() => navigate('/dashboard/profiles')} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Criar Novo Perfil</CardTitle>
            <CardDescription>
              Preencha os dados para criar um perfil e gerar link de convite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="nome-do-usuario"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL será: {window.location.origin}/{formData.username || '...'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Nome Completo"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - se não preenchido, usará o username
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - para referência futura
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  Após criar o perfil, você receberá dois links: um para a página pública e outro para o cadastro/convite que deve ser enviado à pessoa.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Perfil'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile;