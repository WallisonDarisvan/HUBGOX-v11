import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, GripVertical, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface FormField {
  id?: string;
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  sort_order: number;
}

interface FormFieldManagerProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
}

interface SortableFieldItemProps {
  field: FormField;
  index: number;
  onUpdate: (index: number, field: FormField) => void;
  onDelete: (index: number) => void;
  fieldId: string;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({ field, index, onUpdate, onDelete, fieldId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <AccordionItem value={fieldId} ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 pr-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <AccordionTrigger className="flex-1 hover:no-underline py-4">
          <span className="text-sm font-medium">{field.label || 'Novo Campo'}</span>
        </AccordionTrigger>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
          }}
          className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AccordionContent>
        <div className="space-y-4 px-4 pb-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de Campo</Label>
            <Select
              value={field.field_type}
              onValueChange={(value: any) => onUpdate(index, { ...field, field_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="textarea">Texto Longo</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="select">Seleção</SelectItem>
                <SelectItem value="checkbox">Múltipla Escolha</SelectItem>
                <SelectItem value="radio">Escolha Única</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Label do Campo</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(index, { ...field, label: e.target.value })}
              placeholder="Ex: Seu nome completo"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Placeholder (Opcional)</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(index, { ...field, placeholder: e.target.value })}
              placeholder="Ex: Digite aqui..."
            />
          </div>

          {(field.field_type === 'select' || field.field_type === 'checkbox' || field.field_type === 'radio') && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Opções</Label>
              <div className="space-y-2">
                {field.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[optionIndex] = e.target.value;
                        onUpdate(index, { ...field, options: newOptions });
                      }}
                      placeholder={`Opção ${optionIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== optionIndex);
                        onUpdate(index, { ...field, options: newOptions });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(field.options || []), ''];
                    onUpdate(index, { ...field, options: newOptions });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate(index, { ...field, required: checked })}
            />
            <Label className="text-sm">Campo obrigatório</Label>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export const FormFieldManager = ({ fields, onFieldsChange }: FormFieldManagerProps) => {
  const [expandedField, setExpandedField] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((_, index) => `field-${index}` === active.id);
      const newIndex = fields.findIndex((_, index) => `field-${index}` === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
        ...field,
        sort_order: index,
      }));
      onFieldsChange(newFields);
    }
  };

  const handleAddField = () => {
    const newField: FormField = {
      field_type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      sort_order: fields.length,
    };
    const newFields = [...fields, newField];
    onFieldsChange(newFields);
    setExpandedField(`field-${fields.length}`);
  };

  const handleUpdateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    onFieldsChange(newFields);
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index).map((field, idx) => ({
      ...field,
      sort_order: idx,
    }));
    onFieldsChange(newFields);
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          Nenhum campo adicionado ainda.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((_, index) => `field-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <Accordion type="single" collapsible value={expandedField} onValueChange={setExpandedField}>
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={`field-${index}`}
                  field={field}
                  index={index}
                  onUpdate={handleUpdateField}
                  onDelete={handleDeleteField}
                  fieldId={`field-${index}`}
                />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      )}
      
      <Button
        type="button"
        onClick={handleAddField}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Campo
      </Button>
    </div>
  );
};