import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LinkCardProps {
  title: string;
  url?: string;
  formSlug?: string;
  username?: string;
  imageUrl?: string;
  cardId?: string;
}

const LinkCardComponent = ({ title, url, formSlug, username, imageUrl, cardId }: LinkCardProps) => {
  const handleClick = async () => {
    if (cardId) {
      try {
        await (supabase as any)
          .from('card_clicks')
          .insert({ card_id: cardId });
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
  };

  const handleTouch = (e: React.TouchEvent) => {
    handleClick();
  };

  const cardClassName = "group relative block w-full aspect-video overflow-hidden rounded-lg border-2 border-foreground/20 hover:border-accent active:border-accent hover:scale-[1.02] active:scale-[1.02] transition-smooth hover:shadow-[var(--shadow-glow)] active:shadow-[var(--shadow-glow)] [-webkit-tap-highlight-color:transparent]";

  const imageContent = imageUrl ? (
    <img 
      src={imageUrl} 
      alt={title}
      className="w-full h-full object-cover"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <div className="w-full h-full bg-secondary" />
  );

  // Use Link for internal navigation (forms), <a> for external URLs
  if (formSlug && username) {
    return (
      <Link
        to={`/${username}/form/${formSlug}`}
        onClick={handleClick}
        onTouchStart={handleTouch}
        className={cardClassName}
      >
        {imageContent}
      </Link>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      onTouchStart={handleTouch}
      className={cardClassName}
    >
      {imageContent}
    </a>
  );
};

// Export memoized version
export const LinkCard = memo(LinkCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.url === nextProps.url &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.cardId === nextProps.cardId &&
    prevProps.formSlug === nextProps.formSlug
  );
});