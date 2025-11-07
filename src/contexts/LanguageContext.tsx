import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'pt-BR' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  'pt-BR': {
    // Landing Page
    'landing.title': 'Crie Seu Cartão Digital Profissional',
    'landing.subtitle': 'Compartilhe suas informações de contato, redes sociais e portfólio em uma única página elegante',
    'landing.cta.start': 'Começar Gratuitamente',
    'landing.cta.login': 'Entrar',
    'landing.features.title': 'Recursos Poderosos',
    'landing.features.subtitle': 'Tudo que você precisa para criar sua presença digital profissional',
    'landing.feature.cards.title': 'Cartões Personalizáveis',
    'landing.feature.cards.desc': 'Crie cartões digitais bonitos com suas informações e estilo',
    'landing.feature.forms.title': 'Formulários Customizados',
    'landing.feature.forms.desc': 'Colete informações de visitantes com formulários personalizados',
    'landing.feature.analytics.title': 'Análises Detalhadas',
    'landing.feature.analytics.desc': 'Acompanhe visualizações e engajamento em tempo real',
    'landing.pricing.title': 'Planos Simples e Transparentes',
    'landing.pricing.subtitle': 'Escolha o plano perfeito para suas necessidades',
    'landing.plan.free': 'Gratuito',
    'landing.plan.free.desc': 'Ideal para começar',
    'landing.plan.free.feature1': '1 perfil',
    'landing.plan.free.feature2': 'Até 5 cards de links',
    'landing.plan.free.feature3': 'Nenhum formulário',
    'landing.plan.free.feature4': 'Análise básica de cliques',
    'landing.plan.free.cta': 'Começar Grátis',
    'landing.plan.individual': 'Individual',
    'landing.plan.individual.price': 'R$ 29,90',
    'landing.plan.individual.period': '/mês',
    'landing.plan.individual.desc': 'Para profissionais autônomos',
    'landing.plan.individual.feature1': '1 perfil',
    'landing.plan.individual.feature2': 'Até 10 cards de links',
    'landing.plan.individual.feature3': '1 formulário personalizado',
    'landing.plan.individual.feature4': 'Captura de leads',
    'landing.plan.individual.feature5': 'Análise avançada',
    'landing.plan.individual.cta': 'Começar Agora',
    'landing.plan.agency': 'Agência',
    'landing.plan.agency.price': 'R$ 299,00',
    'landing.plan.agency.period': '/mês',
    'landing.plan.agency.desc': 'Para agências e gestores de tráfego',
    'landing.plan.agency.feature1': 'Até 20 perfis gerenciados',
    'landing.plan.agency.feature2': '10 cards por perfil',
    'landing.plan.agency.feature3': '10 formulários por perfil',
    'landing.plan.agency.feature4': 'Modo de administração completo',
    'landing.plan.agency.feature5': 'Gestão centralizada de clientes',
    'landing.plan.agency.cta': 'Começar Agora',
    'landing.plan.corporate': 'Corporativo',
    'landing.plan.corporate.price': 'R$ 1.000,00',
    'landing.plan.corporate.period': '/mês',
    'landing.plan.corporate.desc': 'Para grandes empresas e franquias',
    'landing.plan.corporate.feature1': 'Até 150 perfis gerenciados',
    'landing.plan.corporate.feature2': '20 cards por perfil',
    'landing.plan.corporate.feature3': '20 formulários por perfil',
    'landing.plan.corporate.feature4': 'Modo admin completo',
    'landing.plan.corporate.feature5': 'Suporte prioritário',
    'landing.plan.corporate.feature6': 'Onboarding personalizado',
    'landing.plan.corporate.cta': 'Falar com Vendas',
    'landing.cta.ready.title': 'Pronto para começar?',
    'landing.cta.ready.subtitle': 'Comece gratuitamente e crie sua página profissional em minutos',
    'landing.cta.ready.button': 'Criar Minha Página Grátis',
    'landing.footer.rights': 'Todos os direitos reservados.',
  },
  'en': {
    // Landing Page
    'landing.title': 'Create Your Professional Digital Card',
    'landing.subtitle': 'Share your contact info, social media, and portfolio in one elegant page',
    'landing.cta.start': 'Start Free',
    'landing.cta.login': 'Login',
    'landing.features.title': 'Powerful Features',
    'landing.features.subtitle': 'Everything you need to create your professional digital presence',
    'landing.feature.cards.title': 'Customizable Cards',
    'landing.feature.cards.desc': 'Create beautiful digital cards with your information and style',
    'landing.feature.forms.title': 'Custom Forms',
    'landing.feature.forms.desc': 'Collect information from visitors with personalized forms',
    'landing.feature.analytics.title': 'Detailed Analytics',
    'landing.feature.analytics.desc': 'Track views and engagement in real-time',
    'landing.pricing.title': 'Simple and Transparent Pricing',
    'landing.pricing.subtitle': 'Choose the perfect plan for your needs',
    'landing.plan.free': 'Free',
    'landing.plan.free.desc': 'Ideal to get started',
    'landing.plan.free.feature1': '1 profile',
    'landing.plan.free.feature2': 'Up to 5 link cards',
    'landing.plan.free.feature3': 'No forms',
    'landing.plan.free.feature4': 'Basic click analytics',
    'landing.plan.free.cta': 'Get Started',
    'landing.plan.individual': 'Individual',
    'landing.plan.individual.price': '$7.90',
    'landing.plan.individual.period': '/month',
    'landing.plan.individual.desc': 'For self-employed professionals',
    'landing.plan.individual.feature1': '1 profile',
    'landing.plan.individual.feature2': 'Up to 10 link cards',
    'landing.plan.individual.feature3': '1 custom form',
    'landing.plan.individual.feature4': 'Lead capture',
    'landing.plan.individual.feature5': 'Advanced analytics',
    'landing.plan.individual.cta': 'Get Started',
    'landing.plan.agency': 'Agency',
    'landing.plan.agency.price': '$79.00',
    'landing.plan.agency.period': '/month',
    'landing.plan.agency.desc': 'For agencies and traffic managers',
    'landing.plan.agency.feature1': 'Up to 20 managed profiles',
    'landing.plan.agency.feature2': '10 cards per profile',
    'landing.plan.agency.feature3': '10 forms per profile',
    'landing.plan.agency.feature4': 'Full admin mode',
    'landing.plan.agency.feature5': 'Centralized client management',
    'landing.plan.agency.cta': 'Get Started',
    'landing.plan.corporate': 'Corporate',
    'landing.plan.corporate.price': '$250.00',
    'landing.plan.corporate.period': '/month',
    'landing.plan.corporate.desc': 'For large companies and franchises',
    'landing.plan.corporate.feature1': 'Up to 150 managed profiles',
    'landing.plan.corporate.feature2': '20 cards per profile',
    'landing.plan.corporate.feature3': '20 forms per profile',
    'landing.plan.corporate.feature4': 'Full admin mode',
    'landing.plan.corporate.feature5': 'Priority support',
    'landing.plan.corporate.feature6': 'Personalized onboarding',
    'landing.plan.corporate.cta': 'Contact Sales',
    'landing.cta.ready.title': 'Ready to get started?',
    'landing.cta.ready.subtitle': 'Start for free and create your professional page in minutes',
    'landing.cta.ready.button': 'Create My Page Free',
    'landing.footer.rights': 'All rights reserved.',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
