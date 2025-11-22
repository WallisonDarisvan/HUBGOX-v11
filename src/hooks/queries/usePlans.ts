import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePlans() {
  return useQuery({
    queryKey: ['plan-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_definitions')
        .select('*')
        .order('plan_name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: any) => {
      const { data, error } = await supabase
        .from('plan_definitions')
        .insert(plan as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-definitions'] });
      toast.success('Plano criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar plano: ' + error.message);
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ plan_id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('plan_definitions')
        .update(updates)
        .eq('plan_id', plan_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-definitions'] });
      toast.success('Plano atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('plan_definitions')
        .delete()
        .eq('plan_id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-definitions'] });
      toast.success('Plano excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir plano: ' + error.message);
    },
  });
}