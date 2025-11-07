import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCreateAffiliate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user profile to create code
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      // Generate unique code: HUBGOX-NAME-XXXX
      const baseName = (profile.display_name || profile.username || 'USER')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
      
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const affiliateCode = `HUBGOX-${baseName}-${randomSuffix}`;

      // Create affiliate
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          commission_rate: 10.0, // 10% default
          status: 'active',
          total_earnings: 0,
          total_referrals: 0
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate'] });
      toast.success('Você agora é um afiliado! Compartilhe seu código e ganhe comissões.');
    },
    onError: (error: Error) => {
      console.error('Error creating affiliate:', error);
      toast.error('Erro ao criar afiliado. Tente novamente.');
    },
  });
}
