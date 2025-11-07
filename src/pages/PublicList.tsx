import { useParams, useNavigate } from 'react-router-dom';
import { usePublicList } from '@/hooks/queries/usePublicList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PublicList() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePublicList(username, slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('🔴 PublicList Error:', { username, slug, error, errorMessage });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl mb-4">📋</div>
            <h1 className="text-2xl font-bold">Lista não encontrada</h1>
            <p className="text-muted-foreground">
              A lista que você está procurando não existe ou não está mais disponível.
            </p>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                <p className="font-semibold mb-1">Detalhes do erro:</p>
                <p className="text-xs font-mono">{errorMessage}</p>
                <p className="text-xs mt-2 opacity-70">
                  Verifique o console para mais informações
                </p>
              </div>
            )}
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { list, items } = data;

  return (
    <>
      <Helmet>
        <title>{list.title} - Lista de Links</title>
        <meta name="description" content={list.description || `Confira a lista de links: ${list.title}`} />
        <meta property="og:title" content={list.title} />
        <meta property="og:description" content={list.description || `Lista de links de ${username}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="max-w-2xl mx-auto p-6 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">{list.title}</h1>
            {list.description && (
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                {list.description}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhum link disponível nesta lista.
                </CardContent>
              </Card>
            ) : (
              items.map((item) => (
                <Button
                  key={item.id}
                  asChild
                  variant="outline"
                  className="w-full h-auto py-4 px-6 text-left justify-between hover:scale-[1.02] transition-transform"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <span className="font-medium text-base">{item.title}</span>
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  </a>
                </Button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-8">
            <Button
              variant="ghost"
              onClick={() => navigate(`/${username}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              Ver perfil de @{username}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
