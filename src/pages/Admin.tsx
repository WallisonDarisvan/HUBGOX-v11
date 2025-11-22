import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, LogOut, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

interface Card {
  id: string;
  title: string;
  link_url: string;
  image_url: string | null;
  status: boolean;
  sort_order: number;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !isAdmin) {
      toast.error('Você não tem permissão para acessar esta área');
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      loadCards();
    }
  }, [user, isAdmin]);

  const loadCards = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cards')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
      toast.error('Erro ao carregar cards');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await (supabase as any)
        .from('cards')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Card excluído com sucesso');
      loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Erro ao excluir card');
    } finally {
      setDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus cards</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              Ver Página
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-destructive/50 hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Add New Card Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard/card/new')}
            className="gradient-cyan"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Card
          </Button>
        </div>

        {/* Cards List */}
        <div className="grid gap-4">
          {cards.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum card criado ainda. Clique em "Novo Card" para começar.
              </CardContent>
            </Card>
          ) : (
            cards.map((card) => (
              <Card key={card.id} className="glass-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2 break-all">
                        {card.link_url}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${card.status ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {card.status ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    {card.image_url && (
                      <img
                        src={card.image_url}
                        alt={card.title}
                        className="w-20 h-20 object-cover rounded ml-4"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/dashboard/card/${card.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => setDeleteId(card.id)}
                      variant="outline"
                      size="sm"
                      className="border-destructive/50 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;