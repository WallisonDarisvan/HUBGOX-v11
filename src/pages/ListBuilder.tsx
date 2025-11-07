import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useList, useListItems, useCreateList, useUpdateList, useCreateListItem, useUpdateListItem, useDeleteListItem, useReorderListItems } from '@/hooks/queries/useLists';
import { useProfile } from '@/hooks/queries/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAdminView } from '@/contexts/AdminViewContext';

interface ListItemFormData {
  title: string;
  url: string;
}

const SortableListItem = ({ item, onEdit, onDelete }: { 
  item: { id: string; title: string; url: string };
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-sm text-muted-foreground truncate">{item.url}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function ListBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { viewingUserId, isViewingOtherUser } = useAdminView();
  const currentUserId = isViewingOtherUser ? viewingUserId : user?.id;
  const isEditMode = !!id;

  const { data: list } = useList(id);
  const { data: items = [] } = useListItems(id);
  const { data: ownProfile } = useProfile(currentUserId);
  const createList = useCreateList();
  const updateList = useUpdateList();
  const createItem = useCreateListItem();
  const updateItem = useUpdateListItem();
  const deleteItem = useDeleteListItem();
  const reorderItems = useReorderListItems();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; title: string; url: string } | null>(null);
  const [itemForm, setItemForm] = useState<ListItemFormData>({ title: '', url: '' });
  const [localItems, setLocalItems] = useState(items);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setSlug(list.slug);
      setDescription(list.description || '');
      setIsActive(list.is_active);
    }
  }, [list]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditMode && title) {
      const generatedSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, isEditMode]);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleSaveList = async () => {
    if (!currentUserId) return;

    if (isEditMode && id) {
      await updateList.mutateAsync({
        id,
        title,
        slug,
        description: description || null,
        is_active: isActive,
      });
    } else {
      const newList = await createList.mutateAsync({
        user_id: currentUserId,
        title,
        slug,
        description: description || null,
        is_active: isActive,
      });
      navigate(`/dashboard/list/${newList.id}`);
    }
  };

  const handleSaveItem = async () => {
    if (!id) return;

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        title: itemForm.title,
        url: itemForm.url,
      });
      setEditingItem(null);
    } else {
      await createItem.mutateAsync({
        list_id: id,
        title: itemForm.title,
        url: itemForm.url,
        display_order: items.length,
      });
    }

    setItemForm({ title: '', url: '' });
    setShowItemForm(false);
  };

  const handleEditItem = (item: { id: string; title: string; url: string }) => {
    setEditingItem(item);
    setItemForm({ title: item.title, url: item.url });
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;
    await deleteItem.mutateAsync({ id: itemId, list_id: id });
    setDeleteConfirm(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        if (id) {
          reorderItems.mutate({
            list_id: id,
            items: reordered.map((item, index) => ({
              id: item.id,
              display_order: index,
            })),
          });
        }

        return reordered;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Lista' : 'Nova Lista'}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Lista</CardTitle>
            <CardDescription>Configure os detalhes principais da sua lista</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Minhas Redes Sociais"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="minhas-redes-sociais"
              />
              <p className="text-sm text-muted-foreground">
                URL pública: /{ownProfile?.username || 'usuario'}/list/{slug || 'slug'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional da lista"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active">Lista ativa</Label>
            </div>

            <Button onClick={handleSaveList} disabled={!title.trim()}>
              {isEditMode ? 'Atualizar Lista' : 'Criar Lista'}
            </Button>
          </CardContent>
        </Card>

        {isEditMode && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Itens da Lista</CardTitle>
                  <CardDescription>Gerencie os links da sua lista</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm({ title: '', url: '' });
                    setShowItemForm(!showItemForm);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showItemForm && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-title">Título do Botão *</Label>
                      <Input
                        id="item-title"
                        value={itemForm.title}
                        onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                        placeholder="Ex: Instagram"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-url">URL *</Label>
                      <Input
                        id="item-url"
                        type="url"
                        value={itemForm.url}
                        onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveItem}
                        disabled={!itemForm.title.trim() || !itemForm.url.trim()}
                      >
                        {editingItem ? 'Atualizar' : 'Adicionar'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                          setItemForm({ title: '', url: '' });
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {localItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localItems.map((item) => (
                        <SortableListItem
                          key={item.id}
                          item={item}
                          onEdit={() => handleEditItem(item)}
                          onDelete={() => setDeleteConfirm(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteItem(deleteConfirm)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
