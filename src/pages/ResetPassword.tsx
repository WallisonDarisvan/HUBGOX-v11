import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }).max(255),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        toast.error(error.message || 'Erro ao enviar email');
      } else {
        toast.success('Email enviado! Verifique sua caixa de entrada.');
        setTimeout(() => navigate('/auth'), 2000);
      }
    } catch (error) {
      toast.error('Erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Helmet>
        <title>Redefinir Senha | Admin</title>
        <meta name="description" content="Redefinir sua senha de acesso" />
      </Helmet>
      <Card className="w-full max-w-md glass-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber o link de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu-email@exemplo.com"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-cyan"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              ← Voltar para login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
