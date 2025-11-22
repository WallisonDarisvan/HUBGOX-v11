import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useUserRole } from '../hooks/queries/useUserRole';

const authSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }).max(255),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }).max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: userRole, isLoading: isLoadingRole } = useUserRole();

  useEffect(() => {
    if (user && !isLoadingRole) {
      // Redirecionar baseado na role do usuário
      if (userRole === 'dev') {
        navigate('/dev');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, userRole, isLoadingRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados antes de enviar
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    
    if (!isLogin && !username.trim()) {
      toast.error('Username é obrigatório');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Erro ao fazer login');
        } else {
          toast.success('Login realizado!');
        }
      } else {
        const { error } = await signUp(email, password, username, displayName);
        if (error) {
          toast.error(error.message || 'Erro ao criar conta');
        } else {
          toast.success('Conta criada!');
        }
      }
    } catch (error) {
      toast.error('Erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isLogin ? "Login | Admin" : "Criar Conta | Admin";
  const pageDescription = isLogin 
    ? "Entre na sua conta para gerenciar sua página de links." 
    : "Crie uma nova conta para começar a gerenciar seus links.";
  const pageImage = `${window.location.origin}/placeholder.svg`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
      <Card className="w-full max-w-md glass-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">Admin</CardTitle>
          <CardDescription>
            {isLogin ? 'Entre com suas credenciais' : 'Crie uma nova conta de admin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    required
                    placeholder="seu-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu Nome"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-xs text-accent hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-cyan"
              disabled={loading}
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-accent hover:underline"
              disabled={loading}
            >
              {isLogin ? 'Não tem uma conta? Criar conta' : 'Já tem uma conta? Fazer login'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              ← Voltar para a página principal
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;