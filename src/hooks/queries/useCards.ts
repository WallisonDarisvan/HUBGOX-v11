import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Card {
  id: string;
  title: string;
  link_url: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  user_id: string;
  clicks_count?: number;
  status?: boolean; // Alias for is_active for compatibility
  sort_order?: number; // Alias for display_order for compatibility
}

// RPC function return type
interface CardWithMetricsRPC {
  id: string;
  title: string;
  link_url: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  user_id: string;
  form_config_id: string | null;
  created_at: string;
  updated_at: string;
  clicks_count: number;
  description?: string;
  icon?: string;
}

// Query key factory
export const cardKeys = {
  all: ['cards'] as const,
  byUser: (userId: string) => [...cardKeys.all, 'user', userId] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
  withMetrics: (userId: string) => [...cardKeys.byUser(userId), 'metrics'] as const,
};

// Fetch cards with metrics for a user (direct query - no RPC needed)
export const useCardsWithMetrics = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: cardKeys.withMetrics(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Fetch cards directly from table
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (cardsError) throw cardsError;

      // Get clicks count for each card
      const cardsWithMetrics = await Promise.all(
        (cardsData || []).map(async (card) => {
          const { count } = await supabase
            .from('card_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('card_id', card.id);

          return {
            id: card.id,
            title: card.title,
            link_url: card.link_url,
            image_url: card.image_url,
            is_active: card.is_active,
            display_order: card.display_order,
            user_id: card.user_id,
            clicks_count: count || 0,
            status: card.is_active,
            sort_order: card.display_order,
          } as Card;
        })
      );
      
      return cardsWithMetrics;
    },
    enabled: !!userId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
};

// Fetch single card
export const useCard = (cardId: string | undefined) => {
  return useQuery({
    queryKey: cardKeys.detail(cardId || ''),
    queryFn: async () => {
      if (!cardId) throw new Error('Card ID is required');

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      return data as Card;
    },
    enabled: !!cardId,
    staleTime: 60000, // 1 minute
  });
};

// Delete card mutation
export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: (_, cardId) => {
      // Invalidate all cards queries
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      toast.success('Card excluído com sucesso');
    },
    onError: (error: any) => {
      const errorMessage = error.code === '42501' 
        ? 'Permissão negada para excluir este card'
        : 'Erro ao excluir card';
      toast.error(errorMessage);
    },
  });
};

// Update card mutation
export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Card> }) => {
      const { error } = await supabase
        .from('cards')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      queryClient.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
      toast.success('Card atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar card');
    },
  });
};

// Create card mutation
export const useCreateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Card, 'id'>) => {
      const { error } = await supabase
        .from('cards')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      toast.success('Card criado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar card');
    },
  });
};