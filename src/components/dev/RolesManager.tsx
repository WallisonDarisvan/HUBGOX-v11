import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useSearchUserByEmail, useAssignRole, useRemoveRole, useUserRoles } from '@/hooks/queries/useDev';

export default function RolesManager() {
  const [email, setEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState('');

  const searchUsers = useSearchUserByEmail();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const { data: userRoles } = useUserRoles(selectedUserId);

  const handleSearch = () => {
    if (email.trim()) {
      searchUsers.mutate(email);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleAssignRole = async () => {
    if (selectedUserId && selectedRole) {
      await assignRole.mutateAsync({
        userId: selectedUserId,
        role: selectedRole,
      });
      setSelectedRole('');
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (selectedUserId) {
      await removeRole.mutateAsync({
        userId: selectedUserId,
        role,
      });
    }
  };

  const availableRoles = ['admin', 'moderator', 'user', 'dev'];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="email">Buscar Usuário por Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite o email do usuário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={searchUsers.isPending}>
              Buscar
            </Button>
          </div>
        </div>

        {searchUsers.data && searchUsers.data.length > 0 && (
          <div className="space-y-2">
            <Label>Selecione um usuário:</Label>
            {searchUsers.data.map((user: any) => (
              <div
                key={user.user_id}
                className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                  selectedUserId === user.user_id ? 'bg-accent' : ''
                }`}
                onClick={() => handleSelectUser(user.user_id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {user.user_id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUserId && (
        <div className="space-y-4 pt-4 border-t">
          <div>
            <Label>Roles Atuais:</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {userRoles && Array.isArray(userRoles) && userRoles.length > 0 ? (
                userRoles.map((userRole: any) => (
                  <Badge key={userRole.id} variant="secondary" className="gap-2">
                    {userRole.role}
                    <button
                      onClick={() => handleRemoveRole(userRole.role)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma role atribuída
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="role">Atribuir Nova Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione uma role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAssignRole}
                disabled={!selectedRole || assignRole.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
