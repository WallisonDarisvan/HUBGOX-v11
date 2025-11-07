import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }).max(255),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

interface InvitationData {
  username: string;
  display_name: string;
  email?: string;
  profile_id: string;
}

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validInvitation, setValidInvitation] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      toast.error('Token inválido');
      navigate('/');
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    try {
      console.log('[Invite] Validando token:', token);
      const { data, error } = await (supabase as any)
        .rpc('validate_invitation_token', { token });

      if (error) {
        console.error('[Invite] Erro na validação do token:', error);
        throw error;
      }

      console.log('[Invite] Dados recebidos:', data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('[Invite] Convite não encontrado ou expirado');
        toast.error('Convite inválido ou expirado');
        navigate('/');
        return;
      }

      const invitation = data[0];
      console.log('[Invite] Convite válido:', invitation);
      
      setInvitationData({
        username: invitation.username,
        display_name: invitation.display_name,
        email: invitation.email,
        profile_id: invitation.profile_id,
      });
      setValidInvitation(true);

      // Pre-fill email if available
      if (invitation.email) {
        setFormData(prev => ({ ...prev, email: invitation.email }));
      }
    } catch (error: any) {
      console.error('[Invite] Erro ao validar convite:', error);
      toast.error(error.message || 'Erro ao validar convite');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validation = signupSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!invitationData || !token) return;

    setSubmitting(true);

    try {
      console.log('[Invite] Iniciando processo de cadastro para:', formData.email);
      
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            username: invitationData.username,
            display_name: invitationData.display_name,
            invitation_token: token,
          },
        },
      });

      if (signUpError) {
        console.error('[Invite] Erro ao criar usuário:', signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        console.error('[Invite] Usuário não foi criado');
        throw new Error('Falha ao criar usuário');
      }

      console.log('[Invite] Usuário criado:', authData.user.id);
      console.log('[Invite] Aceitando convite...');

      // Accept invitation and link profile
      const { data: acceptResult, error: acceptError } = await (supabase as any)
        .rpc('accept_invitation', {
          token,
          new_user_id: authData.user.id,
        });

      if (acceptError) {
        console.error('[Invite] Erro ao aceitar convite:', acceptError);
        throw acceptError;
      }
      
      if (!acceptResult) {
        console.error('[Invite] accept_invitation retornou false');
        throw new Error('Falha ao aceitar convite - token pode estar expirado ou inválido');
      }

      console.log('[Invite] Convite aceito com sucesso!');
      toast.success('Cadastro realizado com sucesso!');
      
      // Sign in the user
      console.log('[Invite] Fazendo login automático...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('[Invite] Erro no login automático:', signInError);
        toast.info('Por favor, faça login com suas credenciais');
        navigate('/auth');
      } else {
        console.log('[Invite] Login realizado, redirecionando para dashboard');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('[Invite] Erro ao completar cadastro:', error);
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        toast.error('Este email já está cadastrado. Faça login em vez de criar uma nova conta.');
      } else if (error.message?.includes('expirado') || error.message?.includes('expired')) {
        toast.error('Este convite expirou. Solicite um novo convite ao administrador.');
      } else if (error.message?.includes('inválido') || error.message?.includes('invalid')) {
        toast.error('Link de convite inválido. Verifique se copiou o link completo.');
      } else {
        toast.error(`Erro ao completar cadastro: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Validando convite...</p>
      </div>
    );
  }

  if (!validInvitation || !invitationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Helmet>
        <title>Aceitar Convite | Cadastro</title>
        <meta name="description" content="Complete seu cadastro e comece a usar sua página" />
      </Helmet>
      
      <Card className="w-full max-w-md glass-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete seu Cadastro</CardTitle>
          <CardDescription>
            Você foi convidado para criar sua página
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Username:</strong> @{invitationData.username}</p>
                <p><strong>Nome:</strong> {invitationData.display_name}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Sua página será: {window.location.origin}/{invitationData.username}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repita sua senha"
                required
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Criando conta...' : 'Criar Minha Conta'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Ao criar sua conta, você concorda com nossos termos de uso
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
