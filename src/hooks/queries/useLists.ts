import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LinkList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  title: string;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const listKeys = {
  all: ['lists'] as const,
  lists: (userId: string | undefined | null) => [...listKeys.all, 'list', userId] as const,
  list: (listId: string | undefined) => [...listKeys.all, 'detail', listId] as const,
  items: (listId: string | undefined) => [...listKeys.all, 'items', listId] as const,
};

// Fetch all lists for a user
export const useLists = (userId: string | undefined | null) => {
  return useQuery({
    queryKey: listKeys.lists(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data: lists, error } = await supabase
        .from('link_lists')
        .select(`
          *,
          items_count:list_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return lists.map(list => ({
        ...list,
        items_count: list.items_count?.[0]?.count || 0
      })) as LinkList[];
    },
    enabled: !!userId,
  });
};

// Fetch a single list with its items
export const useList = (listId: string | undefined) => {
  return useQuery({
    queryKey: listKeys.list(listId),
    queryFn: async () => {
      if (!listId) return null;

      const { data, error } = await supabase
        .from('link_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (error) throw error;
      return data as LinkList;
    },
    enabled: !!listId,
  });
};

// Fetch items for a list
export const useListItems = (listId: string | undefined) => {
  return useQuery({
    queryKey: listKeys.items(listId),
    queryFn: async () => {
      if (!listId) return [];

      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ListItem[];
    },
    enabled: !!listId,
  });
};

// Create a new list
export const useCreateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Pick<LinkList, 'user_id' | 'title' | 'description' | 'is_active' | 'slug'>) => {
      const { data: newList, error } = await supabase
        .from('link_lists')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newList;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: listKeys.lists(variables.user_id) });
      toast.success('Lista criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating list:', error);
      toast.error('Erro ao criar lista');
    },
  });
};

// Update a list
export const useUpdateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LinkList> & { id: string }) => {
      const { data: updatedList, error } = await supabase
        .from('link_lists')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKeys.list(data.id) });
      queryClient.invalidateQueries({ queryKey: listKeys.lists(data.user_id) });
      toast.success('Lista atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating list:', error);
      toast.error('Erro ao atualizar lista');
    },
  });
};

// Delete a list
export const useDeleteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('link_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKeys.all });
      toast.success('Lista excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting list:', error);
      toast.error('Erro ao excluir lista');
    },
  });
};

// Create a list item
export const useCreateListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Pick<ListItem, 'list_id' | 'title' | 'url' | 'display_order'>) => {
      const { data: newItem, error } = await supabase
        .from('list_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(data.list_id) });
      toast.success('Item adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating list item:', error);
      toast.error('Erro ao adicionar item');
    },
  });
};

// Update a list item
export const useUpdateListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ListItem> & { id: string }) => {
      const { data: updatedItem, error } = await supabase
        .from('list_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(data.list_id) });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating list item:', error);
      toast.error('Erro ao atualizar item');
    },
  });
};

// Delete a list item
export const useDeleteListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, list_id }: { id: string; list_id: string }) => {
      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { list_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(data.list_id) });
      toast.success('Item excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting list item:', error);
      toast.error('Erro ao excluir item');
    },
  });
};

// Reorder list items
export const useReorderListItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, list_id }: { items: { id: string; display_order: number }[]; list_id: string }) => {
      const updates = items.map(item =>
        supabase
          .from('list_items')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
      );

      await Promise.all(updates);
      return { list_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: listKeys.items(data.list_id) });
    },
    onError: (error) => {
      console.error('Error reordering items:', error);
      toast.error('Erro ao reordenar itens');
    },
  });
};
