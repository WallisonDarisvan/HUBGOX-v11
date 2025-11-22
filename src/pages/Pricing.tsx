import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePlan } from '@/contexts/PlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AFFILIATE_CODE_KEY = 'affiliate_ref_code';
const AFFILIATE_EXPIRY_KEY = 'affiliate_ref_expiry';
const AFFILIATE_EXPIRY_DAYS = 30;

export default function Pricing() {
  const { allPlans, currentPlan } = usePlan();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // Capture affiliate referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store code and expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + AFFILIATE_EXPIRY_DAYS);
      
      localStorage.setItem(AFFILIATE_CODE_KEY, refCode);
      localStorage.setItem(AFFILIATE_EXPIRY_KEY, expiryDate.toISOString());
      
      toast.success('Código de afiliado aplicado! Você tem 30 dias para completar a compra.');
      console.log('Affiliate code captured:', refCode);
    }
  }, [searchParams]);

  const getPlanTier = (planId: string) => {
    const order = ['free', 'individual', 'agency', 'corporate'];
    return order.indexOf(planId);
  };

  const handleCheckout = async (planId: string) => {
    if (!user) {
      toast.error('Você precisa fazer login para assinar um plano');
      navigate('/auth');
      return;
    }

    setLoadingPlanId(planId);
    
    try {
      // Verificar se há código de afiliado no localStorage
      const affiliateCode = localStorage.getItem(AFFILIATE_CODE_KEY);
      const affiliateExpiry = localStorage.getItem(AFFILIATE_EXPIRY_KEY);
      
      let validAffiliateCode = null;
      
      if (affiliateCode && affiliateExpiry) {
        const expiryDate = new Date(affiliateExpiry);
        if (expiryDate > new Date()) {
          validAffiliateCode = affiliateCode;
          console.log('Using valid affiliate code:', validAffiliateCode);
        } else {
          // Limpar código expirado
          localStorage.removeItem(AFFILIATE_CODE_KEY);
          localStorage.removeItem(AFFILIATE_EXPIRY_KEY);
        }
      }
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { 
          plan_id: planId,
          affiliate_code: validAffiliateCode 
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar checkout. Tente novamente.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Planos e Preços</title>
        <meta name="description" content="Escolha o plano ideal para suas necessidades" />
      </Helmet>
      
      <Navbar />
      
      <div className="flex-1 bg-gradient-to-b from-background to-muted py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
            <p className="text-muted-foreground text-lg">
              Selecione o plano que melhor se adequa às suas necessidades
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allPlans.map(plan => {
              const isCurrent = currentPlan?.plan_id === plan.plan_id;
              const isPopular = plan.plan_id === 'individual';
              
              const currentTier = currentPlan ? getPlanTier(currentPlan.plan_id) : -1;
              const planTier = getPlanTier(plan.plan_id);
              
              const isUpgrade = planTier > currentTier;
              const isDowngrade = currentTier !== -1 && planTier < currentTier;
              const isNextUpgrade = isUpgrade && planTier === currentTier + 1;
              
              return (
                <Card 
                  key={plan.plan_id} 
                  className={`relative transition-all ${
                    isCurrent 
                      ? 'border-accent shadow-xl ring-2 ring-accent/20 scale-105' 
                      : isNextUpgrade 
                      ? 'border-primary/40 shadow-lg ring-1 ring-primary/10' 
                      : isUpgrade && !isNextUpgrade
                      ? 'border-border'
                      : isDowngrade
                      ? 'opacity-60 border-muted'
                      : 'border-border'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-accent text-accent-foreground px-4 py-1.5 text-xs font-bold shadow-lg">
                        Seu Plano Atual
                      </Badge>
                    </div>
                  )}
                  {isNextUpgrade && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold shadow-md">
                        Upgrade Recomendado
                      </Badge>
                    </div>
                  )}
                  {isPopular && !isCurrent && !isNextUpgrade && isUpgrade && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-primary/60 to-primary/40 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        R$ {plan.price_monthly.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start">
                        <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.limit_cards} {plan.limit_cards === 1 ? 'card' : 'cards'}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.limit_forms} {plan.limit_forms === 1 ? 'formulário' : 'formulários'}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.limit_lists} {plan.limit_lists === 1 ? 'lista' : 'listas'}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.limit_profiles} {plan.limit_profiles === 1 ? 'perfil' : 'perfis'}
                        </span>
                      </li>
                      {plan.allow_video_bg && (
                        <li className="flex items-start">
                          <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Vídeo de fundo</span>
                        </li>
                      )}
                      {plan.allow_admin_mode && (
                        <li className="flex items-start">
                          <Check className="w-5 h-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">Modo Agência</span>
                        </li>
                      )}
                    </ul>
                    
                    <Button 
                      className="w-full"
                      variant={
                        isCurrent 
                          ? 'outline' 
                          : isNextUpgrade 
                          ? 'default' 
                          : isUpgrade 
                          ? 'default' 
                          : 'ghost'
                      }
                      disabled={isCurrent || loadingPlanId === plan.plan_id || plan.plan_id === 'free'}
                      onClick={() => handleCheckout(plan.plan_id)}
                    >
                      {loadingPlanId === plan.plan_id
                        ? 'Processando...'
                        : isCurrent 
                        ? 'Plano Atual' 
                        : plan.plan_id === 'free'
                        ? 'Plano Gratuito'
                        : isUpgrade 
                        ? 'Assinar Plano' 
                        : 'Ver Plano'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
