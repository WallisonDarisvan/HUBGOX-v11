import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useIsDevUser() {
  return useQuery({
    queryKey: ['is-dev'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking dev status:', error);
        return false;
      }

      // Check if role exists and equals 'dev' (temporary check until enum is updated)
      return data && (data.role as string) === 'dev';
    },
  });
}

export function useSearchUserByEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      // Buscar profiles por email
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, email, created_at')
        .ilike('email', `%${email}%`)
        .limit(20);

      if (error) throw error;
      
      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Buscar planos para cada perfil
      const userIds = profiles.map(p => p.id);
      const { data: userPlans } = await supabase
        .from('user_plans')
        .select('user_id, plan_id, plan_definitions(plan_name)')
        .in('user_id', userIds);

      // Criar mapa de planos por usuário
      const planMap = new Map();
      userPlans?.forEach(up => {
        planMap.set(up.user_id, (up as any).plan_definitions?.plan_name || 'Sem plano');
      });

      return profiles.map(p => ({
        user_id: p.id,
        username: p.username,
        email: p.email,
        created_at: p.created_at,
        plan_name: planMap.get(p.id) || 'Sem plano',
      }));
    },
    onError: (error) => {
      toast.error('Erro ao buscar usuário: ' + error.message);
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role atribuída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir role: ' + error.message);
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover role: ' + error.message);
    },
  });
}

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useAllUsers(page: number = 0, pageSize: number = 10) {
  return useQuery({
    queryKey: ['all-users', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Buscar profiles com email
      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('id, username, email, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        return {
          users: [],
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize),
        };
      }

      // Buscar planos para cada perfil
      const userIds = profiles.map(p => p.id);
      const { data: userPlans } = await supabase
        .from('user_plans')
        .select('user_id, plan_id, plan_definitions(plan_name)')
        .in('user_id', userIds);

      // Criar mapa de planos por usuário
      const planMap = new Map();
      userPlans?.forEach(up => {
        planMap.set(up.user_id, (up as any).plan_definitions?.plan_name || 'Sem plano');
      });
      
      return {
        users: profiles.map(p => ({
          user_id: p.id,
          username: p.username,
          email: p.email,
          created_at: p.created_at,
          plan_name: planMap.get(p.id) || 'Sem plano',
        })),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
}

export function useRevenueMetrics(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['revenue-metrics', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get completed transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, affiliate_commission')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (txError) throw txError;

      // Get total affiliates
      const { count: affiliatesCount, error: affError } = await supabase
        .from('affiliates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (affError) throw affError;

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get paid users (users with completed transactions)
      const { data: paidUserIds, error: paidError } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (paidError) throw paidError;

      const uniquePaidUsers = new Set(paidUserIds?.map(t => t.user_id)).size;

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const affiliateRevenue = transactions?.reduce((sum, t) => sum + Number(t.affiliate_commission || 0), 0) || 0;
      const profit = totalRevenue - affiliateRevenue;
      const conversionRate = totalUsers ? (uniquePaidUsers / totalUsers) * 100 : 0;

      return {
        totalRevenue,
        affiliatesCount: affiliatesCount || 0,
        affiliateRevenue,
        profit,
        conversionRate,
      };
    },
  });
}

export function useRevenueByPlan(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['revenue-by-plan', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('plan_id, amount')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (txError) throw txError;

      // Get plan details
      const { data: plans, error: plansError } = await supabase
        .from('plan_definitions')
        .select('plan_id, plan_name');

      if (plansError) throw plansError;

      // Get user counts per plan
      const { data: userPlans, error: upError } = await supabase
        .from('user_plans')
        .select('plan_id, user_id');

      if (upError) throw upError;

      // Aggregate by plan
      const planMap = new Map();
      
      transactions?.forEach(tx => {
        const current = planMap.get(tx.plan_id) || { revenue: 0, transactions: 0 };
        planMap.set(tx.plan_id, {
          revenue: current.revenue + Number(tx.amount),
          transactions: current.transactions + 1,
        });
      });

      return plans?.map(plan => {
        const stats = planMap.get(plan.plan_id) || { revenue: 0, transactions: 0 };
        const subscribers = userPlans?.filter(up => up.plan_id === plan.plan_id).length || 0;
        
        return {
          plan_id: plan.plan_id,
          plan_name: plan.plan_name,
          revenue: stats.revenue,
          transactions: stats.transactions,
          subscribers,
        };
      }) || [];
    },
  });
}

export function useTopAffiliates(startDate: Date, endDate: Date, limit: number = 10) {
  return useQuery({
    queryKey: ['top-affiliates', startDate.toISOString(), endDate.toISOString(), limit],
    queryFn: async () => {
      const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select(`
          id,
          user_id,
          affiliate_code,
          total_referrals,
          total_earnings,
          profiles:user_id (username, email)
        `)
        .eq('status', 'active')
        .order('total_earnings', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return affiliates || [];
    },
  });
}

export function useRevenueOverTime(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['revenue-over-time', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('transaction_date, amount')
        .eq('status', 'completed')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, number>();
      
      transactions?.forEach(tx => {
        const date = new Date(tx.transaction_date).toLocaleDateString('pt-BR');
        const current = dateMap.get(date) || 0;
        dateMap.set(date, current + Number(tx.amount));
      });

      return Array.from(dateMap.entries()).map(([date, amount]) => ({
        date,
        amount,
      }));
    },
  });
}