import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface PlanLimits {
  plan_id: string;
  plan_name: string;
  price_monthly: number;
  limit_profiles: number;
  limit_cards: number;
  limit_forms: number;
  limit_lists: number;
  allow_video_bg: boolean;
  allow_admin_mode: boolean;
}

interface PlanContextType {
  currentPlan: PlanLimits | null;
  allPlans: PlanLimits[];
  isLoading: boolean;
  canCreate: (resource: 'cards' | 'forms' | 'lists' | 'profiles', profileId?: string) => Promise<boolean>;
  getRemainingSlots: (resource: 'cards' | 'forms' | 'lists' | 'profiles', profileId?: string) => Promise<number>;
  invalidatePlanCache: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os planos disponíveis (para página de pricing)
  const { data: allPlans = [] } = useQuery({
    queryKey: ['plans', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_definitions')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data as PlanLimits[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar plano do usuário atual
  const { data: currentPlan = null, isLoading } = useQuery({
    queryKey: ['plans', 'current', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('PlanContext: Fetching plan for user', user.id);
      
      const { data, error } = await supabase
        .rpc('get_user_plan_limits', { p_user_id: user.id })
        .maybeSingle();
      
      if (error) {
        console.error('PlanContext: Error fetching plan', error);
        throw error;
      }
      
      // Se não retornar dados, buscar plano 'free' como fallback
      if (!data) {
        console.warn('PlanContext: No plan found for user, fetching free plan as fallback');
        const { data: freePlan, error: freePlanError } = await supabase
          .from('plan_definitions')
          .select('*')
          .eq('plan_id', 'free')
          .single();
        
        if (freePlanError) {
          console.error('PlanContext: Error fetching free plan', freePlanError);
          throw freePlanError;
        }
        
        return freePlan as PlanLimits;
      }
      
      console.log('PlanContext: Plan loaded successfully', { 
        plan_id: data.plan_id, 
        allow_admin_mode: data.allow_admin_mode 
      });
      
      return data as PlanLimits | null;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  // Helper para contar perfis usados (Meu Perfil + pendentes + expirados + vinculados)
  const getUsedProfilesCount = async (): Promise<number> => {
    if (!user?.id) return 0;

    // Sempre incluir "Meu Perfil"
    const profileIds = new Set<string>([user.id]);

    // Pegar convites MAIS RECENTES por profile (evitar duplicatas)
    const { data: invitations, error: invitationsError } = await supabase
      .from('user_invitations')
      .select('profile_id, linked_profile_id, status, created_at')
      .eq('invited_by_admin_id', user.id)
      .order('created_at', { ascending: false }); // Mais recente primeiro

    if (invitationsError) {
      console.error('PlanContext: Error fetching invitations for profiles count', invitationsError);
      throw invitationsError;
    }

    // Deduplica: priorizar linked_profile_id (aceito) > profile_id (pendente)
    const seenProfiles = new Set<string>();
    (invitations || []).forEach((inv) => {
      // Se aceito, usar linked_profile_id
      if (inv.status === 'accepted' && inv.linked_profile_id) {
        if (!seenProfiles.has(inv.linked_profile_id)) {
          profileIds.add(inv.linked_profile_id);
          seenProfiles.add(inv.linked_profile_id);
        }
      }
      // Se pendente/expirado, usar profile_id (mas só se não foi visto)
      else if (inv.profile_id && !seenProfiles.has(inv.profile_id)) {
        profileIds.add(inv.profile_id);
        seenProfiles.add(inv.profile_id);
      }
    });

    console.log('PlanContext: Profile count debug', {
      userId: user.id,
      totalProfiles: profileIds.size,
      invitationsCount: invitations?.length || 0,
      profileIds: Array.from(profileIds)
    });

    return profileIds.size;
  };

  // Helper para buscar IDs de perfis gerenciados (para contagem de recursos)
  const getManagedProfileIds = async (): Promise<string[]> => {
    if (!user?.id) return [];

    // Perfil próprio + perfis vinculados via invitations
    const profileIds = new Set<string>([user.id]);

    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('profile_id, linked_profile_id, status, created_at')
      .eq('invited_by_admin_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('PlanContext: Error fetching managed profiles', error);
      return [user.id];
    }

    // Deduplica: priorizar linked_profile_id (aceito) > profile_id (pendente)
    const seenProfiles = new Set<string>();
    (invitations || []).forEach((inv) => {
      // Se aceito, usar linked_profile_id
      if (inv.status === 'accepted' && inv.linked_profile_id) {
        if (!seenProfiles.has(inv.linked_profile_id)) {
          profileIds.add(inv.linked_profile_id);
          seenProfiles.add(inv.linked_profile_id);
        }
      }
      // Se pendente/expirado, usar profile_id (mas só se não foi visto)
      else if (inv.profile_id && !seenProfiles.has(inv.profile_id)) {
        profileIds.add(inv.profile_id);
        seenProfiles.add(inv.profile_id);
      }
    });

    return Array.from(profileIds);
  };

  // Verificar se pode criar recurso
  const canCreate = async (resource: 'cards' | 'forms' | 'lists' | 'profiles', profileId?: string): Promise<boolean> => {
    if (!currentPlan || !user?.id) return false;

    const limitMap = {
      cards: currentPlan.limit_cards,
      forms: currentPlan.limit_forms,
      lists: currentPlan.limit_lists,
      profiles: currentPlan.limit_profiles,
    };

    // Lógica especial para profiles
    if (resource === 'profiles') {
      const used = await getUsedProfilesCount();
      return used < limitMap.profiles;
    }

    const tableMap = {
      cards: 'cards',
      forms: 'form_configs',
      lists: 'link_lists',
    };

    const limit = limitMap[resource];
    const table = tableMap[resource];

    // Se tem admin mode E profileId foi fornecido, conta por perfil específico
    if (currentPlan.allow_admin_mode && profileId) {
      const query = (supabase as any).from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);
      const { count } = await query;
      return (count || 0) < limit;
    }

    // Senão, conta global (comportamento para Free/Individual)
    const managedProfileIds = await getManagedProfileIds();
    const query = (supabase as any).from(table)
      .select('*', { count: 'exact', head: true })
      .in('user_id', managedProfileIds);
    const { count } = await query;
    return (count || 0) < limit;
  };

  // Obter slots restantes
  const getRemainingSlots = async (resource: 'cards' | 'forms' | 'lists' | 'profiles', profileId?: string): Promise<number> => {
    if (!currentPlan || !user?.id) return 0;

    const limitMap = {
      cards: currentPlan.limit_cards,
      forms: currentPlan.limit_forms,
      lists: currentPlan.limit_lists,
      profiles: currentPlan.limit_profiles,
    };

    // Lógica especial para profiles
    if (resource === 'profiles') {
      const used = await getUsedProfilesCount();
      return Math.max(0, limitMap.profiles - used);
    }

    const tableMap = {
      cards: 'cards',
      forms: 'form_configs',
      lists: 'link_lists',
    };

    const limit = limitMap[resource];
    const table = tableMap[resource];

    // Se tem admin mode E profileId foi fornecido, conta por perfil específico
    if (currentPlan.allow_admin_mode && profileId) {
      const query = (supabase as any).from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);
      const { count } = await query;
      return Math.max(0, limit - (count || 0));
    }

    // Senão, conta global (comportamento para Free/Individual)
    const managedProfileIds = await getManagedProfileIds();
    const query = (supabase as any).from(table)
      .select('*', { count: 'exact', head: true })
      .in('user_id', managedProfileIds);
    const { count } = await query;
    return Math.max(0, limit - (count || 0));
  };

  // Invalidar cache para forçar revalidação
  const invalidatePlanCache = async () => {
    await queryClient.invalidateQueries({ queryKey: ['plans', 'current', user?.id] });
  };

  return (
    <PlanContext.Provider value={{ 
      currentPlan, 
      allPlans, 
      isLoading,
      canCreate,
      getRemainingSlots,
      invalidatePlanCache
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider');
  }
  return context;
}
