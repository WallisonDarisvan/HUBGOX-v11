import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft, Pencil, Trash2, FileText, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { UserSelector } from '@/components/UserSelector';
import { Helmet } from 'react-helmet-async';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormsWithMetrics, useDeleteForm } from '@/hooks/queries/useForms';
import { useProfile } from '@/hooks/queries/useProfile';

const FormsList = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { viewingUserId, isViewingOtherUser } = useAdminView();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveUserId = viewingUserId || user?.id;

  // Use React Query hooks
  const { data: profile } = useProfile(effectiveUserId);
  const { data: forms = [], isLoading: formsLoading } = useFormsWithMetrics(effectiveUserId);
  const deleteFormMutation = useDeleteForm();

  const username = profile?.username || '';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, navigate, user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFormMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (authLoading || formsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Meus Formulários | Dashboard</title>
      </Helmet>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                {isViewingOtherUser ? 'Formulários do Perfil' : 'Meus Formulários'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isViewingOtherUser ? 'Gerencie os formulários deste perfil' : 'Gerencie seus formulários de contato'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard/form/new')}
            className="gradient-cyan"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Formulário
          </Button>
        </div>

        {/* Forms List */}
        <div className="grid gap-4">
          {forms.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="mb-4">Nenhum formulário criado ainda.</p>
                <Button
                  onClick={() => navigate('/dashboard/form/new')}
                  className="gradient-cyan"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Formulário
                </Button>
              </CardContent>
            </Card>
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="glass-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{form.title}</CardTitle>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {form.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded ${form.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {form.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                          {form.submissions_count || 0} {form.submissions_count === 1 ? 'submissão' : 'submissões'}
                        </span>
                      </div>
                    </div>
                    {form.background_image && (
                      <img
                        src={form.background_image}
                        alt={form.title}
                        className="w-20 h-20 object-cover rounded ml-4"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => navigate(`/dashboard/form/${form.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => navigate(`/dashboard/form/${form.id}/submissions`)}
                      variant="outline"
                      size="sm"
                      className="gradient-cyan"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Submissões ({form.submissions_count || 0})
                    </Button>
                    {username && (
                      <Button
                        onClick={() => {
                          const url = `${window.location.origin}/${username}/form/${form.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Link copiado!');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Copiar Link
                      </Button>
                    )}
                    <Button
                      onClick={() => setDeleteId(form.id)}
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
              Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita e todas as submissões serão perdidas.
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

export default FormsList;
