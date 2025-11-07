import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileWithInvitation {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  invitation_status: 'linked' | 'pending' | 'expired' | null;
  invitation_token?: string;
  invitation_expires_at?: string;
  invitation_email?: string;
  email?: string;
  is_pending: boolean;
}

// Query key factory
export const profileKeys = {
  all: ['profiles'] as const,
  allWithInvitations: ['profiles', 'with-invitations'] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
};

// Fetch all profiles with invitation status (filtered by admin)
export const useProfilesWithInvitations = () => {
  const { user } = useAuth();

  console.log('useProfilesWithInvitations: Hook called with user', user?.id);

  return useQuery({
    queryKey: profileKeys.allWithInvitations,
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('useProfilesWithInvitations: Fetching profiles for user', user.id);

      // 1. Buscar perfis criados pelo admin (incluindo o próprio usando created_by_admin_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, email, is_activated, created_by_admin_id, created_at')
        .or(`id.eq.${user.id},created_by_admin_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (profilesError) {
        console.error('useProfilesWithInvitations: Error fetching profiles', profilesError);
        throw profilesError;
      }

      console.log('useProfilesWithInvitations: Profiles fetched', {
        count: profiles?.length,
        usernames: profiles?.map(p => ({
          username: p.username,
          id: p.id,
          created_by_admin_id: p.created_by_admin_id
        }))
      });

      // 2. Para cada perfil, verificar status do convite (se houver)
      const allProfiles: ProfileWithInvitation[] = [];

      for (const profile of profiles || []) {
        // Buscar convite associado a este perfil
        const { data: invitation } = await supabase
          .from('user_invitations')
          .select('*')
          .or(`profile_id.eq.${profile.id},linked_profile_id.eq.${profile.id}`)
          .maybeSingle();

        let invitationStatus: 'linked' | 'pending' | 'expired';
        const isPending = profile.is_activated === false;

        // Se é o próprio perfil do admin, está sempre vinculado
        if (profile.id === user.id) {
          invitationStatus = 'linked';
        }
        // Se não tem convite OU convite foi aceito, está vinculado
        else if (!invitation || invitation.status === 'accepted') {
          invitationStatus = 'linked';
        }
        // Se convite expirado ou data passou
        else if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
          invitationStatus = 'expired';
        }
        // Se convite pendente
        else if (invitation.status === 'pending') {
          invitationStatus = 'pending';
        }
        // Fallback
        else {
          invitationStatus = 'linked';
        }

        console.log('Profile debug:', {
          id: profile.id,
          username: profile.username,
          is_activated: profile.is_activated,
          created_by_admin_id: profile.created_by_admin_id,
          invitation_found: !!invitation,
          invitation_status: invitation?.status,
          calculated_status: invitationStatus
        });

        allProfiles.push({
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url || '',
          invitation_status: invitationStatus,
          invitation_token: invitation?.invitation_token,
          invitation_expires_at: invitation?.expires_at,
          invitation_email: invitation?.email,
          email: profile.email,
          is_pending: isPending,
        });
      }

      console.log('useProfilesWithInvitations: Total profiles to return', allProfiles.length, allProfiles);
      return allProfiles;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id, // Only execute if user is logged in
  });
};

// Delete profile mutation
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.allWithInvitations });
      queryClient.refetchQueries({ queryKey: profileKeys.allWithInvitations });
      toast.success('Perfil apagado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao apagar perfil: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

// Renew invitation mutation
export const useRenewInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, userId, email }: { profileId: string; userId: string; email?: string }) => {
      // Delete all related invitations
      const { error: deleteError } = await (supabase as any)
        .from('user_invitations')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) throw new Error(`Falha ao deletar convites: ${deleteError.message}`);

      // Small delay to ensure DELETE is processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new invitation
      const { data: newInvitation, error: invitationError } = await (supabase as any)
        .from('user_invitations')
        .insert({
          invited_by_admin_id: userId,
          profile_id: profileId,
          email: email || null,
        })
        .select()
        .single();

      if (invitationError) throw invitationError;

      return newInvitation;
    },
    onSuccess: (newInvitation) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.allWithInvitations });
      queryClient.refetchQueries({ queryKey: profileKeys.allWithInvitations });
      const inviteUrl = `${window.location.origin}/invite/${newInvitation.invitation_token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Novo convite criado e link copiado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar novo convite: ' + (error.message || 'Erro desconhecido'));
    },
  });
};

// Unlink profile mutation
export const useUnlinkProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId, userId, email }: { profileId: string; userId: string; email?: string }) => {
      // 1. Remove user from auth.users
      const { error: deleteAuthError } = await (supabase as any).rpc('admin_delete_user', {
        user_id: profileId
      });
      
      if (deleteAuthError) {
        console.error('Erro ao remover usuário da autenticação:', deleteAuthError);
      }
      
      // 2. Update profile to not activated
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_activated: false })
        .eq('id', profileId);
      
      if (updateError) throw updateError;
      
      // 3. Delete all invitations
      const { error: deleteError } = await (supabase as any)
        .from('user_invitations')
        .delete()
        .eq('profile_id', profileId);
      
      if (deleteError) throw new Error(`Falha ao deletar convites: ${deleteError.message}`);

      // Delay to ensure processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 4. Create new invitation
      const { data: newInvitation, error: invitationError } = await (supabase as any)
        .from('user_invitations')
        .insert({
          invited_by_admin_id: userId,
          profile_id: profileId,
          email: email || null,
        })
        .select()
        .single();
      
      if (invitationError) throw invitationError;

      return newInvitation;
    },
    onSuccess: (newInvitation) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.allWithInvitations });
      queryClient.refetchQueries({ queryKey: profileKeys.allWithInvitations });
      const inviteUrl = `${window.location.origin}/invite/${newInvitation.invitation_token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Perfil desvinculado! Novo link de convite copiado.');
    },
    onError: (error: any) => {
      toast.error('Erro ao desvincular perfil: ' + (error.message || 'Erro desconhecido'));
    },
  });
};
