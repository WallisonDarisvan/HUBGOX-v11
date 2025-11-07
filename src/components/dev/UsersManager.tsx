import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchUserByEmail, useAllUsers } from '@/hooks/queries/useDev';

export default function UsersManager() {
  const [email, setEmail] = useState('');
  const [page, setPage] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  
  const searchUsers = useSearchUserByEmail();
  const { data: allUsersData, isLoading } = useAllUsers(0, 10000);

  const handleSearch = () => {
    if (email.trim()) {
      setSearchMode(true);
      searchUsers.mutate(email);
    }
  };

  const handleClearSearch = () => {
    setSearchMode(false);
    setEmail('');
    setPage(0);
  };

  const displayData = searchMode ? searchUsers.data : allUsersData?.users;
  const showPagination = !searchMode && allUsersData && allUsersData.totalPages > 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="email">Buscar por Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Digite o email do usuário"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={handleSearch} disabled={searchUsers.isPending}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          {searchMode && (
            <Button variant="outline" onClick={handleClearSearch}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {isLoading && !searchMode ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : displayData && Array.isArray(displayData) && displayData.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Link Público</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((user: any) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-mono text-xs">
                    {user.username || '-'}
                  </TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{user.plan_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {user.username ? (
                      <a 
                        href={`/${user.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        /{user.username}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {showPagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {page + 1} de {allUsersData.totalPages} ({allUsersData.total} usuários)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= allUsersData.totalPages - 1}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Nenhum usuário encontrado
        </p>
      )}
    </div>
  );
}
