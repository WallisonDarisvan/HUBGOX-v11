import { Helmet } from 'react-helmet-async';

const Landing = () => {
  const pageTitle = "Bink - Sua Página de Links e Formulários Profissional";
  const pageDescription = "Crie sua página de links personalizados e formulários profissionais. Planos a partir de R$19,90/mês.";
  const pageImage = `${window.location.origin}/placeholder.svg`;

  return (
    <div className="min-h-screen bg-background">
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

      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Landing Page em Construção
          </h1>
        </div>
      </section>
    </div>
  );
};

export default Landing;