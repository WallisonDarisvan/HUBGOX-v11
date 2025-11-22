import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAffiliate() {
  return useQuery({
    queryKey: ['affiliate'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching affiliate:', error);
        return null;
      }

      return data;
    },
  });
}

export function useAffiliateEarnings() {
  return useQuery({
    queryKey: ['affiliate-earnings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First get the affiliate record
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!affiliate) return [];

      // Then get earnings
      const { data, error } = await supabase
        .from('affiliate_earnings')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching earnings:', error);
        return [];
      }

      return data || [];
    },
  });
}