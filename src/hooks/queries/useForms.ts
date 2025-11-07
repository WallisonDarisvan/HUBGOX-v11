import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Form {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description?: string;
  custom_fields?: any;
  is_active: boolean;
  background_image?: string | null;
  created_at: string;
  submissions_count?: number;
}

// Query key factory
export const formKeys = {
  all: ['forms'] as const,
  byUser: (userId: string) => [...formKeys.all, 'user', userId] as const,
  detail: (id: string) => [...formKeys.all, 'detail', id] as const,
  withMetrics: (userId: string) => [...formKeys.byUser(userId), 'metrics'] as const,
  submissions: (formId: string) => [...formKeys.all, 'submissions', formId] as const,
};

// Fetch forms with metrics for a user (optimized - no N+1)
export const useFormsWithMetrics = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: formKeys.withMetrics(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      // Single query with aggregation
      const { data, error } = await supabase
        .from('form_configs')
        .select(`
          *,
          form_submissions(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include submissions count
      return (data || []).map(form => ({
        ...form,
        submissions_count: form.form_submissions?.[0]?.count || 0,
      })) as Form[];
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single form
export const useForm = (formId: string | undefined) => {
  return useQuery({
    queryKey: formKeys.detail(formId || ''),
    queryFn: async () => {
      if (!formId) throw new Error('Form ID is required');

      const { data, error } = await supabase
        .from('form_configs')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;
      return data as Form;
    },
    enabled: !!formId,
    staleTime: 60000, // 1 minute
  });
};

// Fetch form submissions
export const useFormSubmissions = (formId: string | undefined) => {
  return useQuery({
    queryKey: formKeys.submissions(formId || ''),
    queryFn: async () => {
      if (!formId) throw new Error('Form ID is required');

      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_config_id', formId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!formId,
    staleTime: 30000, // 30 seconds
  });
};

// Delete form mutation
export const useDeleteForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from('form_configs')
        .delete()
        .eq('id', formId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.all });
      toast.success('Formulário excluído com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir formulário');
    },
  });
};

// Update form mutation
export const useUpdateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Form> }) => {
      const { error } = await supabase
        .from('form_configs')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formKeys.all });
      queryClient.invalidateQueries({ queryKey: formKeys.detail(variables.id) });
      toast.success('Formulário atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar formulário');
    },
  });
};

// Create form mutation
export const useCreateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Form, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('form_configs')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formKeys.all });
      toast.success('Formulário criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar formulário');
    },
  });
};

// Fetch form with custom fields in a single optimized query
export const useFormWithFields = (formId: string | undefined) => {
  return useQuery({
    queryKey: [...formKeys.detail(formId || ''), 'with-fields'],
    queryFn: async () => {
      if (!formId) throw new Error('Form ID is required');

      const { data, error } = await supabase
        .from('form_configs')
        .select(`
          *,
          form_fields(*)
        `)
        .eq('id', formId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!formId,
    staleTime: 60000, // 1 minute
  });
};
