import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useAdminView } from '../contexts/AdminViewContext';
import { usePlan } from '../contexts/PlanContext';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useProfilesWithInvitations } from '../hooks/queries/useProfiles';

interface UserSelectorProps {
  className?: string;
}

export function UserSelector({ className }: UserSelectorProps) {
  const { user } = useAuth();
  const { viewingUserId, setViewingUserId, canAdmin } = useAdminView();
  const navigate = useNavigate();
  const { currentPlan, isLoading: planLoading } = usePlan();
  
  // Use React Query hook
  const { data: profiles = [], isLoading: loading } = useProfilesWithInvitations();
  
  const isLoadingState = loading || planLoading;

  const handleValueChange = (value: string) => {
    if (value === 'manager') {
      setViewingUserId(null);
    } else {
      setViewingUserId(value);
    }
    navigate('/dashboard');
  };

  const currentValue = viewingUserId ?? 'manager';
  const selectedUser = profiles.find(u => u.id === viewingUserId);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <User className="w-4 h-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleValueChange} disabled={isLoadingState}>
        <SelectTrigger className="w-[280px]">
          <SelectValue>
            {isLoadingState ? (
              <span>Carregando permissões...</span>
            ) : viewingUserId ? (
              viewingUserId === user?.id ? (
                <span>👤 <strong>Meu Dashboard</strong></span>
              ) : (
                <span>Visualizando: <strong>{selectedUser?.display_name || selectedUser?.username}</strong></span>
              )
            ) : (
              canAdmin ? 'Gerenciador de Perfis' : 'Meu Dashboard'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {canAdmin && (
            <>
              <SelectItem value="manager">
                <strong>Gerenciador de Perfis</strong>
              </SelectItem>
              <SelectItem value={user!.id}>
                👤 <strong>Meu Dashboard</strong>
              </SelectItem>
            </>
          )}
          {profiles
            .filter(profile => profile.id !== user?.id)
            .map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.display_name || profile.username}
                {` (${profile.username})`}
                {profile.is_pending && <span className="ml-2 text-xs text-yellow-600">• Pendente</span>}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}