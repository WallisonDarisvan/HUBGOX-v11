import { useEffect, useState } from 'react';
import { Instagram, Linkedin, Youtube, Music, MessageCircle } from 'lucide-react';
import { LinkCard } from '@/components/LinkCard';
import { SocialIcon } from '@/components/SocialIcon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Card {
  id: string;
  title: string;
  link_url: string;
  image_url: string | null;
  sort_order: number;
}

const Index = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cards')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Section */}
        <header className="text-center mb-12">
          <div className="mb-6 inline-block">
            <img
              src="https://framerusercontent.com/images/6FDdcvePWy3gQ6iumqo9tjKHmpg.png"
              alt="Guilherme Batilani"
              className="w-32 h-32 rounded-full border-2 border-accent shadow-[var(--shadow-glow)] mx-auto object-cover"
            />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3 text-foreground">
            Guilherme Batilani
          </h1>
          <h2 className="font-heading text-xl md:text-2xl text-muted-foreground mb-4">
            Comunicador, escritor e palestrante
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Guilherme Batilani é comunicador, escritor e palestrante, especializado em comportamento humano, 
            que ganhou notoriedade após mais de 40 participações em podcasts e acumula mais de 500 milhões 
            de visualizações na internet.
          </p>
        </header>

        {/* Admin Button */}
        {isAdmin && (
          <div className="mb-8 text-center">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="gradient-cyan border-accent/50"
            >
              Gerenciar Cards
            </Button>
          </div>
        )}

        {/* Link Cards */}
        <main className="space-y-4 mb-12">
          {loading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : cards.length === 0 ? (
            <div className="text-center text-muted-foreground">Nenhum card disponível</div>
          ) : (
            cards.map((card) => (
              <LinkCard
                key={card.id}
                title={card.title}
                url={card.link_url}
                imageUrl={card.image_url || undefined}
              />
            ))
          )}
        </main>

        {/* Social Media Icons */}
        <footer className="space-y-8">
          <div className="flex justify-center gap-6 text-muted-foreground">
            <SocialIcon
              icon={Instagram}
              url="https://instagram.com/guilhermebatilani"
              label="Instagram"
            />
            <SocialIcon
              icon={Linkedin}
              url="https://linkedin.com/in/guilhermebatilani"
              label="LinkedIn"
            />
            <SocialIcon
              icon={Youtube}
              url="https://youtube.com/@guilhermebatilani"
              label="YouTube"
            />
            <SocialIcon
              icon={Music}
              url="https://open.spotify.com/show/guilhermebatilani"
              label="Spotify"
            />
            <SocialIcon
              icon={MessageCircle}
              url="https://wa.me/5511999999999"
              label="WhatsApp"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Guilherme Batilani. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
