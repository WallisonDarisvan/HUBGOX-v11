import { memo } from 'react';
import { LinkCard } from './LinkCard';

interface LinkCardProps {
  title: string;
  url?: string;
  formSlug?: string;
  username?: string;
  imageUrl?: string;
  cardId?: string;
}

// Memoized version of LinkCard for performance
export const LinkCardMemoized = memo(LinkCard, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.title === nextProps.title &&
    prevProps.url === nextProps.url &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.cardId === nextProps.cardId &&
    prevProps.formSlug === nextProps.formSlug
  );
});

LinkCardMemoized.displayName = 'LinkCardMemoized';