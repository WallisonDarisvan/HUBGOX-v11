import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminView } from '../contexts/AdminViewContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

const cardSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  link_url: z.string().url('URL inválida').max(500, 'URL muito longa').optional(),
  form_config_id: z.string().uuid().optional(),
}).refine(data => data.link_url || data.form_config_id, {
  message: 'URL ou formulário é obrigatório',
  path: ['link_url'],
});

interface FormConfig {
  id: string;
  title: string;
  slug: string | null;
}

const CardForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { viewingUserId, isViewingOtherUser } = useAdminView();
  const navigate = useNavigate();
  
  const effectiveUserId = isViewingOtherUser ? viewingUserId : user?.id;
  
  const [title, setTitle] = useState('');
  const [linkType, setLinkType] = useState<'url' | 'form'>('url');
  const [linkUrl, setLinkUrl] = useState('');
  const [formConfigId, setFormConfigId] = useState('');
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      // OPTIMIZATION: Parallelize forms and card loading
      if (isEditing) {
        Promise.all([loadForms(), loadCard()]);
      } else {
        loadForms();
      }
    }
  }, [id, user]);

  const loadForms = async () => {
    // Validar effectiveUserId antes
    if (!effectiveUserId) {
      toast.error('Erro: usuário não identificado');
      navigate('/dashboard');
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('form_configs')
        .select('id, title, slug')
        .eq('user_id', effectiveUserId)
        .order('title', { ascending: true });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      let errorMessage = 'Erro ao carregar formulários';
      
      if (error.code === '42501') {
        errorMessage = 'Permissão negada';
      }
      
      toast.error(errorMessage);
    }
  };

  const loadCard = async () => {
    // Validar effectiveUserId
    if (!effectiveUserId) {
      toast.error('Erro: usuário não identificado');
      navigate('/dashboard');
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('cards')
        .select('*')
        .eq('id', id)
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Card não encontrado');
        navigate('/dashboard');
        return;
      }

      setTitle(data.title);
      if (data.form_config_id) {
        setLinkType('form');
        setFormConfigId(data.form_config_id);
      } else {
        setLinkType('url');
        setLinkUrl(data.link_url || '');
      }
      setIsActive(data.is_active);
      setDisplayOrder(data.display_order);
      setExistingImageUrl(data.image_url);
    } catch (error: any) {
      let errorMessage = 'Erro ao carregar card';
      
      if (error.code === '42501') {
        errorMessage = 'Permissão negada para acessar este card';
      }
      
      toast.error(errorMessage);
      navigate('/dashboard');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const bucket = urlParts[urlParts.length - 3];
      const path = urlParts.slice(-2).join('/');
      
      await supabase.storage.from(bucket).remove([path]);
    } catch (error) {
      // Silenciar erro de limpeza (não crítico)
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return existingImageUrl;

    try {
      // Import dynamically to avoid circular dependencies
      const { processImageFile } = await import('../utils/imageProcessing');
      
      toast.info('Processando imagem...');
      const { blob } = await processImageFile(imageFile);

      // Apagar imagem antiga antes de upload
      if (existingImageUrl) {
        await deleteOldImage(existingImageUrl);
      }

      const fileName = `${Math.random()}.webp`;
      const filePath = `${effectiveUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, blob);

      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem');
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      toast.success('Imagem otimizada!');
      return data.publicUrl;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar imagem');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    try {
      const validationData: any = { 
        title: title.trim()
      };
      
      if (linkType === 'url') {
        validationData.link_url = linkUrl.trim();
      } else {
        validationData.form_config_id = formConfigId;
      }
      
      cardSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    // Validar effectiveUserId
    if (!effectiveUserId) {
      toast.error('Erro: usuário não identificado');
      return;
    }

    setLoading(true);

    try {
      console.log('CardForm Debug:', {
        isAdmin,
        userId: user?.id,
        effectiveUserId,
        isViewingOtherUser,
        action: isEditing ? 'UPDATE' : 'INSERT'
      });

      const imageUrl = await uploadImage();

      const cardData: any = {
        title: title.trim(),
        image_url: imageUrl,
        is_active: isActive,
        display_order: displayOrder,
        user_id: effectiveUserId,
      };

      if (linkType === 'url') {
        cardData.link_url = linkUrl.trim();
        cardData.form_config_id = null;
      } else {
        cardData.form_config_id = formConfigId;
        cardData.link_url = null;
      }

      if (isEditing) {
        const { error } = await (supabase as any)
          .from('cards')
          .update(cardData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Card atualizado com sucesso');
      } else {
        const { error } = await (supabase as any)
          .from('cards')
          .insert([cardData]);

        if (error) throw error;
        toast.success('Card criado com sucesso');
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('CardForm Error:', error);
      let errorMessage = 'Erro ao salvar card';
      
      if (error.code === '23505') {
        errorMessage = 'Erro: dados duplicados';
      } else if (error.code === '42501') {
        errorMessage = 'Permissão negada. Verifique se você tem permissão de admin.';
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Erro de validação RLS. Entre em contato com o suporte.';
      } else if (error.message?.includes('Invalid file type')) {
        errorMessage = 'Tipo de arquivo inválido';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }


  const pageTitle = isEditing ? "Editar Card | Gerenciar Links" : "Novo Card | Gerenciar Links";
  const pageDescription = isEditing 
    ? "Edite um card da sua página de links." 
    : "Crie um novo card para sua página de links.";
  const pageImage = `${window.location.origin}/placeholder.svg`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
      </Helmet>
      <div className="max-w-2xl mx-auto">
        
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {isEditing ? 'Editar Card' : 'Novo Card'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="MEU LIVRO: 'O PODER DA IMPERFEIÇÃO'"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-4">
                <Label>Tipo de Link *</Label>
                <RadioGroup value={linkType} onValueChange={(value: 'url' | 'form') => setLinkType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="url" />
                    <Label htmlFor="url" className="font-normal cursor-pointer">URL Externa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="form" id="form" />
                    <Label htmlFor="form" className="font-normal cursor-pointer">Formulário Existente</Label>
                  </div>
                </RadioGroup>
              </div>

              {linkType === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="linkUrl">URL do Link *</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    placeholder="https://exemplo.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-secondary border-border"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="formSelect">Selecione o Formulário *</Label>
                  <Select value={formConfigId} onValueChange={setFormConfigId} disabled={loading}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Escolha um formulário" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {forms.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          Nenhum formulário encontrado
                        </div>
                      ) : (
                        forms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {forms.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Você precisa criar um formulário primeiro
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="image">Imagem de Capa</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="bg-secondary border-border"
                  />
                  {(imagePreview || existingImageUrl) && (
                    <div className="relative">
                      <img
                        src={imagePreview || existingImageUrl || ''}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setExistingImageUrl(null);
                        }}
                        className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  disabled={loading}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Menor número aparece primeiro
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={loading}
                />
                <Label htmlFor="isActive">
                  Card ativo (visível na página principal)
                </Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 gradient-cyan"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Atualizar Card' }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardForm;