import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../hooks/queries/usePlans';
import LoadingSkeleton from '../SimpleLoadingSkeleton';

export default function PlansManager() {
  const { data: plans, isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    plan_id: '',
    plan_name: '',
    limit_profiles: 1,
    limit_cards: 10,
    limit_forms: 5,
    limit_lists: 5,
    price_monthly: 0,
    allow_admin_mode: false,
    allow_video_bg: false,
  });

  const handleOpenDialog = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData(plan);
    } else {
      setEditingPlan(null);
      setFormData({
        plan_id: '',
        plan_name: '',
        limit_profiles: 1,
        limit_cards: 10,
        limit_forms: 5,
        limit_lists: 5,
        price_monthly: 0,
        allow_admin_mode: false,
        allow_video_bg: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingPlan) {
      await updatePlan.mutateAsync({ plan_id: editingPlan.plan_id, ...formData });
    } else {
      await createPlan.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      await deletePlan.mutateAsync(planId);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                Configure os limites e informações do plano
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan_id">ID do Plano</Label>
                <Input
                  id="plan_id"
                  placeholder="ex: premium, basic, free"
                  value={formData.plan_id}
                  onChange={(e) =>
                    setFormData({ ...formData, plan_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })
                  }
                  disabled={!!editingPlan}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único do plano (não pode ser alterado depois)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan_name">Nome do Plano</Label>
                <Input
                  id="plan_name"
                  placeholder="ex: Plano Premium"
                  value={formData.plan_name}
                  onChange={(e) =>
                    setFormData({ ...formData, plan_name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="limit_profiles">Limite de Perfis</Label>
                  <Input
                    id="limit_profiles"
                    type="number"
                    value={formData.limit_profiles}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limit_profiles: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit_cards">Limite de Cards</Label>
                  <Input
                    id="limit_cards"
                    type="number"
                    value={formData.limit_cards}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limit_cards: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit_forms">Limite de Formulários</Label>
                  <Input
                    id="limit_forms"
                    type="number"
                    value={formData.limit_forms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limit_forms: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit_lists">Limite de Listas</Label>
                  <Input
                    id="limit_lists"
                    type="number"
                    value={formData.limit_lists}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limit_lists: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Mensal (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_admin_mode"
                  checked={formData.allow_admin_mode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_admin_mode: checked })
                  }
                />
                <Label htmlFor="allow_admin_mode">Permitir Modo Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_video_bg"
                  checked={formData.allow_video_bg}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_video_bg: checked })
                  }
                />
                <Label htmlFor="allow_video_bg">Permitir Vídeo de Fundo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingPlan ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Perfis</TableHead>
            <TableHead>Cards</TableHead>
            <TableHead>Forms</TableHead>
            <TableHead>Listas</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans?.map((plan) => (
            <TableRow key={plan.plan_id}>
              <TableCell className="font-medium">{plan.plan_name}</TableCell>
              <TableCell>{plan.limit_profiles}</TableCell>
              <TableCell>{plan.limit_cards}</TableCell>
              <TableCell>{plan.limit_forms}</TableCell>
              <TableCell>{plan.limit_lists}</TableCell>
              <TableCell>R$ {plan.price_monthly?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <span className="text-green-600">Disponível</span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plan.plan_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}