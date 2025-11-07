import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  theme?: string | null;
  social_links?: any;
}

export interface ProfileMetrics {
  profile_views: number;
}

// Query key factory
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
  byUsername: (username: string) => [...profileKeys.all, 'username', username] as const,
  metrics: (userId: string) => [...profileKeys.all, 'metrics', userId] as const,
};

// Fetch profile by user ID
export const useProfile = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: profileKeys.detail(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch profile by username
export const useProfileByUsername = (username: string | undefined) => {
  return useQuery({
    queryKey: profileKeys.byUsername(username || ''),
    queryFn: async () => {
      if (!username) throw new Error('Username is required');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
    staleTime: 60000, // 1 minute
  });
};

// Fetch profile metrics (views, clicks, etc.)
export const useProfileMetrics = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: profileKeys.metrics(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      if (error) throw error;

      return {
        profile_views: count || 0,
      } as ProfileMetrics;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<Profile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success('Perfil atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });
};

// Reset metrics mutation
export const useResetMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardIds }: { userId: string; cardIds: string[] }) => {
      // Delete profile views
      const { error: viewsError } = await supabase
        .from('profile_views')
        .delete()
        .eq('profile_id', userId);

      if (viewsError) {
        console.error('Error deleting profile views:', viewsError);
        throw new Error(`Erro ao deletar visualizações: ${viewsError.message}`);
      }

      // Delete card clicks
      if (cardIds.length > 0) {
        const { error: clicksError } = await supabase
          .from('card_clicks')
          .delete()
          .in('card_id', cardIds);

        if (clicksError) {
          console.error('Error deleting card clicks:', clicksError);
          throw new Error(`Erro ao deletar cliques: ${clicksError.message}`);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.metrics(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      toast.success('Métricas zeradas com sucesso');
    },
    onError: (error: any) => {
      console.error('Reset metrics error:', error);
      const errorMessage = error.message || 'Erro ao zerar métricas';
      toast.error(errorMessage);
    },
  });
};
