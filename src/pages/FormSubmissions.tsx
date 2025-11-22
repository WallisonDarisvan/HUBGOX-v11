import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Trash2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserSelector } from '@/components/UserSelector';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Submission {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  submitted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  custom_fields: Record<string, any> | null;
}

interface FormConfig {
  id: string;
  title: string;
  show_name: boolean;
  show_phone: boolean;
  show_email: boolean;
}

const FormSubmissions = () => {
  const { id } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { viewingUserId, isViewingOtherUser } = useAdminView();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const effectiveUserId = viewingUserId || user?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (effectiveUserId && id) {
      loadData();
    }
  }, [effectiveUserId, authLoading, navigate, id]);

  const loadData = async () => {
    if (!effectiveUserId || !id) return;

    try {
      // Load form config
      const { data: configData, error: configError } = await (supabase as any)
        .from('form_configs')
        .select('id, title, show_name, show_phone, show_email')
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .single();

      if (configError) throw configError;
      setFormConfig(configData);

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await (supabase as any)
        .from('form_submissions')
        .select('*')
        .eq('form_config_id', id)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await (supabase as any)
        .from('form_submissions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Submissão excluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Erro ao excluir submissão');
    } finally {
      setDeleteId(null);
    }
  };

  // Get all unique custom field keys across all submissions
  const getAllCustomFieldKeys = (): string[] => {
    const keysSet = new Set<string>();
    submissions.forEach(sub => {
      if (sub.custom_fields) {
        Object.keys(sub.custom_fields).forEach(key => keysSet.add(key));
      }
    });
    return Array.from(keysSet).sort();
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error('Nenhuma submissão para exportar');
      return;
    }

    // Prepare CSV headers
    const headers = ['Data/Hora'];
    
    // Add custom field headers
    const customFieldKeys = getAllCustomFieldKeys();
    customFieldKeys.forEach(key => headers.push(key));
    
    headers.push('IP', 'Navegador');

    // Prepare CSV rows
    const rows = submissions.map(sub => {
      const row = [format(new Date(sub.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })];
      
      // Add custom field values
      customFieldKeys.forEach(key => {
        const value = sub.custom_fields?.[key];
        row.push(Array.isArray(value) ? value.join(', ') : (value || '-'));
      });
      
      row.push(sub.ip_address || '-', sub.user_agent || '-');
      return row;
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `submissoes-${formConfig?.title || 'formulario'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exportado com sucesso');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Formulário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Submissões - {formConfig.title} | Dashboard</title>
      </Helmet>
      <div className="max-w-7xl mx-auto">
        {/* Admin View Alert */}
        {isAdmin && isViewingOtherUser && (
          <Alert className="mb-6 border-accent bg-accent/10">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Você está visualizando as submissões de um formulário de outro perfil.
            </AlertDescription>
          </Alert>
        )}

        {/* Admin User Selector */}
        {isAdmin && <UserSelector className="mb-6" />}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard/form')}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">Submissões</h1>
              <p className="text-muted-foreground mt-2">{formConfig.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {submissions.length} {submissions.length === 1 ? 'submissão' : 'submissões'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={submissions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Submissions Table */}
        {submissions.length === 0 ? (
          <Card className="glass-card border-border">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Nenhuma submissão ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle>Lista de Submissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px] min-w-[300px]">Data/Hora</TableHead>
                      {/* Dynamic custom field headers */}
                      {getAllCustomFieldKeys().map(key => (
                        <TableHead key={key} className="w-[300px] min-w-[300px]">{key}</TableHead>
                      ))}
                      <TableHead className="text-right w-[300px] min-w-[300px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const allKeys = getAllCustomFieldKeys();
                      
                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="whitespace-nowrap w-[300px] min-w-[300px]">
                            {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          {/* Dynamic custom field values */}
                          {allKeys.map(key => {
                            const value = submission.custom_fields?.[key];
                            return (
                              <TableCell key={key} className="w-[300px] min-w-[300px]">
                                {Array.isArray(value) ? value.join(', ') : (value || '-')}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right">
                            <Button
                              onClick={() => setDeleteId(submission.id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta submissão? Esta ação não pode ser desfeita.
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

export default FormSubmissions;