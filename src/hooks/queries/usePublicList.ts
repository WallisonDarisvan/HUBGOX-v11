import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkList, ListItem } from "./useLists";

export const usePublicList = (username: string | undefined, slug: string | undefined) => {
  return useQuery({
    queryKey: ['public-list', username, slug],
    queryFn: async () => {
      if (!username || !slug) {
        throw new Error('Username e slug são obrigatórios');
      }

      console.log('🔍 Fetching public list:', { username, slug });

      // Step 1: Find the list by slug
      const { data: listData, error: listError } = await supabase
        .from('link_lists')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      console.log('📋 List query result:', { listData, listError });

      if (listError) {
        console.error('❌ Error fetching list:', listError);
        throw new Error(`Erro ao buscar lista: ${listError.message}`);
      }
      
      if (!listData) {
        console.error('❌ No list found for slug:', slug);
        throw new Error('Lista não encontrada ou inativa');
      }

      // Step 2: Get the profile and verify username matches
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', listData.user_id)
        .maybeSingle();

      console.log('👤 Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }

      if (!profile) {
        console.error('❌ Profile not found for user_id:', listData.user_id);
        throw new Error('Perfil não encontrado');
      }

      // Step 3: Verify username matches
      if (profile.username !== username) {
        console.error('❌ Username mismatch:', { 
          expected: username, 
          actual: profile.username 
        });
        throw new Error('Lista não encontrada para este usuário');
      }

      const list = listData as LinkList;
      console.log('✅ List found:', list);

      // Get list items
      const { data: items, error: itemsError } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', list.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('❌ Error fetching items:', itemsError);
        throw new Error(`Erro ao buscar itens: ${itemsError.message}`);
      }

      console.log('📦 Items found:', items?.length || 0);
      console.log('✅ Success! Returning data:', { 
        listTitle: list.title, 
        itemsCount: items?.length, 
        profileName: profile?.display_name 
      });

      return {
        list,
        items: (items || []) as ListItem[],
        profile
      };
    },
    enabled: !!username && !!slug,
    retry: 2,
    staleTime: 0, // Always fetch fresh data for public lists
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
};