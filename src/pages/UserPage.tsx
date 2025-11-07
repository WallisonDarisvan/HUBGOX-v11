import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Instagram, Linkedin, Youtube, Music, MessageCircle, BadgeCheck } from 'lucide-react';
import { LinkCard } from '@/components/LinkCard';
import { SocialIcon } from '@/components/SocialIcon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { parseVideoUrl } from '@/utils/videoUtils';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  cover_type: string | null;
  cover_video_url: string | null;
  custom_phrase: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  whatsapp_url: string | null;
  footer_text_primary: string | null;
  footer_text_secondary: string | null;
  show_verified_badge: boolean | null;
  show_avatar: boolean | null;
}

interface Card {
  id: string;
  title: string;
  link_url: string | null;
  form_config_id: string | null;
  image_url: string | null;
  sort_order: number;
  form_config?: {
    slug: string | null;
  } | null;
}

const UserPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [username]);

  useEffect(() => {
    // Track profile view (only for visitors, not owner)
    if (profile && user?.id !== profile.id) {
      trackProfileView();
    }
  }, [profile, user]);

  const trackProfileView = async () => {
    if (!profile) return;
    
    try {
      await (supabase as any)
        .from('profile_views')
        .insert({ profile_id: profile.id });
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  };

  const loadUserData = async () => {
    if (!username) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData);

      // Load cards for this user
      const { data: cardsData, error: cardsError } = await (supabase as any)
        .from('cards')
        .select(`
          *,
          form_config:form_configs(slug)
        `)
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (cardsError) throw cardsError;
      setCards(cardsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = user?.id === profile?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold mb-4 text-foreground">
            Usuário não encontrado
          </h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível encontrar @{username}
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Voltar para Início
          </Button>
        </div>
      </div>
    );
  }

  const pageTitle = profile?.display_name || username || 'Usuário';
  const pageDescription = profile?.bio || 'Perfil de usuário';
  const pageImage = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
      </Helmet>

      {/* Top Bar for Own Profile */}
      {isOwnProfile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-accent/50 backdrop-blur-sm py-2 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm text-white">
              <p className="font-bold">Tela de Preview</p>
              <p>{profile?.display_name || username}</p>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              size="sm"
            >
              Editar Minha Página
            </Button>
          </div>
        </div>
      )}

      {/* Cover Image or Video */}
      <div className="relative">
        {profile?.cover_type === 'video' && profile?.cover_video_url && (() => {
          const videoInfo = parseVideoUrl(profile.cover_video_url);
          if (videoInfo.isValid && videoInfo.embedUrl) {
            return (
              <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden bg-black">
                <iframe
                  src={videoInfo.embedUrl}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] h-[56.25vw] min-h-full min-w-full pointer-events-none"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
            );
          }
          return null;
        })()}
        
        {profile?.cover_type === 'image' && profile?.cover_image_url && (
          <div className="w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
            <img
              src={profile.cover_image_url}
              alt="Capa do perfil"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      
        <div className="max-w-4xl mx-auto px-4 relative">
          {/* Profile Section */}
          <header className={`text-center ${(profile?.cover_image_url || profile?.cover_video_url) ? '-mt-[200px] md:-mt-[250px] lg:-mt-[300px]' : 'pt-36'} mb-12 relative z-10`}>
            {profile?.show_avatar !== false && (
              <div className="mb-6 inline-block">
                <img
                  src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username}
                  alt={profile?.display_name || username || ''}
                  className="w-32 h-32 rounded-full border-4 border-background shadow-[var(--shadow-glow)] mx-auto object-cover"
                />
              </div>
            )}
            <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2 text-foreground flex items-center justify-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <span>{profile?.display_name || username}</span>
              {profile?.show_verified_badge && (
                <BadgeCheck className="w-6 h-6 text-accent fill-accent/20" />
              )}
            </h1>
            {profile?.custom_phrase && (
              <p className="text-white text-sm mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{profile.custom_phrase}</p>
            )}
            {!profile?.custom_phrase && (
              <p className="text-white text-sm mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">@{username}</p>
            )}
            {profile?.bio && (
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </header>

          {/* Link Cards */}
          <main className="mb-12 max-w-3xl mx-auto px-4 relative z-10">
            {cards.length === 0 ? (
              <div className="text-center text-muted-foreground">
                {isOwnProfile 
                  ? 'Você ainda não criou nenhum link. Vá para o dashboard para adicionar!'
                  : 'Nenhum link disponível'}
              </div>
            ) : (
              <div className={`grid gap-4 ${cards.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                {cards.map((card, index) => (
                  <div 
                    key={card.id} 
                    className={cards.length > 1 && cards.length % 2 !== 0 && index === cards.length - 1 ? 'md:col-span-2 md:max-w-md md:mx-auto' : ''}
                  >
                    <LinkCard
                      title={card.title}
                      url={card.link_url || undefined}
                      formSlug={card.form_config?.slug || undefined}
                      username={username}
                      imageUrl={card.image_url || undefined}
                      cardId={card.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>

        {/* Social Media Icons */}
        {(profile?.instagram_url || profile?.linkedin_url || profile?.youtube_url || 
          profile?.spotify_url || profile?.whatsapp_url) && (
          <footer className="pb-6">
            <div className="flex justify-center gap-6 text-muted-foreground">
              {profile.instagram_url && (
                <SocialIcon
                  icon={Instagram}
                  url={profile.instagram_url}
                  label="Instagram"
                />
              )}
              {profile.linkedin_url && (
                <SocialIcon
                  icon={Linkedin}
                  url={profile.linkedin_url}
                  label="LinkedIn"
                />
              )}
              {profile.youtube_url && (
                <SocialIcon
                  icon={Youtube}
                  url={profile.youtube_url}
                  label="YouTube"
                />
              )}
              {profile.spotify_url && (
                <SocialIcon
                  icon={Music}
                  url={profile.spotify_url}
                  label="Spotify"
                />
              )}
              {profile.whatsapp_url && (
                <SocialIcon
                  icon={MessageCircle}
                  url={profile.whatsapp_url}
                  label="WhatsApp"
                />
              )}
            </div>
          </footer>
        )}

        {/* Footer Section */}
        <footer className="border-t border-border pt-6 pb-8 mt-6 text-center space-y-3">
          {/* Privacy Policy and Terms Links */}
          <div className="space-y-2">
            <div className="flex justify-center gap-4 text-sm">
              <a 
                href="/privacy-policy" 
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Política de Privacidade
              </a>
              <span className="text-foreground/70">|</span>
              <a 
                href="/terms-of-service" 
                className="text-foreground/70 hover:text-foreground transition-colors"
              >
                Termos de Uso
              </a>
            </div>
          </div>

          {/* Primary Footer Text */}
          {profile?.footer_text_primary && (
            <div className="text-sm text-foreground/70">
              {profile.footer_text_primary}
            </div>
          )}

          {/* Secondary Footer Text */}
          {profile?.footer_text_secondary && (
            <div className="text-xs text-foreground/60">
              {profile.footer_text_secondary}
            </div>
          )}
        </footer>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
