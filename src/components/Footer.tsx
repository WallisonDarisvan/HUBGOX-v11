import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-card border-t border-border fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              HUBGOX
            </h2>
            <p className="text-muted-foreground hidden sm:block">
              © {currentYear} Todos os direitos reservados.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link to="/support" className="hover:text-accent transition-smooth">
              Suporte
            </Link>
            <Link to="/terms-of-service" className="hover:text-accent transition-smooth">
              Termos
            </Link>
            <Link to="/privacy" className="hover:text-accent transition-smooth">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
