import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Eye, Upload, Trash2, Copy, ExternalLink, Info } from 'lucide-react';
import { FormFieldManager, FormField } from '@/components/FormFieldManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { UserSelector } from '@/components/UserSelector';
import { PositionSelector } from '@/components/PositionSelector';
interface FormConfig {
  id?: string;
  user_id: string;
  title: string;
  slug?: string;
  description: string | null;
  quote: string | null;
  background_image: string | null;
  button_text: string;
  button_color: string;
  whatsapp_number: string | null;
  email_notification: string | null;
  is_active: boolean;
  form_position: string;
  button_action: string;
  external_link_url: string | null;
  button_action_form_id: string | null;
  confirmation_title: string;
  confirmation_message: string;
  confirmation_button_text: string;
  show_confirmation_button: boolean;
  confirmation_button_action: string;
  confirmation_button_link: string | null;
  confirmation_button_form_id: string | null;
}
const FormBuilder = () => {
  const {
    user,
    isAdmin,
    loading: authLoading
  } = useAuth();
  const {
    viewingUserId,
    isViewingOtherUser
  } = useAdminView();
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const isNew = id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customFields, setCustomFields] = useState<FormField[]>([{
    field_type: 'text',
    label: 'Nome',
    placeholder: 'Seu nome',
    required: true,
    sort_order: 0
  }, {
    field_type: 'phone',
    label: 'Telefone',
    placeholder: 'Seu telefone',
    required: true,
    sort_order: 1
  }, {
    field_type: 'email',
    label: 'Email',
    placeholder: 'Seu email',
    required: true,
    sort_order: 2
  }]);
  const [formConfig, setFormConfig] = useState<FormConfig>({
    user_id: '',
    title: 'Mentoria individual diretamente comigo.',
    slug: '',
    description: null,
    quote: '"Nenhuma mudança real acontece somente no mundo das ideias; é preciso agir".',
    background_image: null,
    button_text: 'Enviar formulário',
    button_color: '#10b981',
    whatsapp_number: null,
    email_notification: null,
    is_active: true,
    form_position: 'middle-center',
    button_action: 'confirmation',
    external_link_url: null,
    button_action_form_id: null,
    confirmation_title: 'Formulário enviado!',
    confirmation_message: 'Obrigado pelo seu contato. Retornaremos em breve.',
    confirmation_button_text: 'Enviar outro formulário',
    show_confirmation_button: true,
    confirmation_button_action: 'reset',
    confirmation_button_link: null,
    confirmation_button_form_id: null
  });
  const [username, setUsername] = useState<string>('');
  const [availableForms, setAvailableForms] = useState<Array<{
    id: string;
    title: string;
    slug: string;
  }>>([]);
  const effectiveUserId = viewingUserId || user?.id;
  const isAdminView = isAdmin && isViewingOtherUser;
  const selectedUserId = viewingUserId;
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      const adminId = isAdminView ? selectedUserId : session.user.id;

      // OPTIMIZATION: Parallelize all data fetching
      if (id && id !== 'new') {
        await Promise.all([
        // Load username
        supabase.from('profiles').select('username').eq('id', adminId).single().then(({
          data
        }) => {
          if (data) setUsername(data.username);
        }),
        // Load form config
        loadFormConfig(id, adminId),
        // Load custom fields
        loadCustomFields(id)]);
      } else {
        // Just load username for new forms
        const {
          data: profileData
        } = await supabase.from('profiles').select('username').eq('id', adminId).single();
        if (profileData) {
          setUsername(profileData.username);
        }

        // Initialize with default fields for new forms
        setCustomFields([{
          field_type: 'text',
          label: 'Nome',
          placeholder: 'Seu nome',
          required: true,
          sort_order: 0
        }, {
          field_type: 'phone',
          label: 'Telefone',
          placeholder: 'Seu telefone',
          required: true,
          sort_order: 1
        }, {
          field_type: 'email',
          label: 'Email',
          placeholder: 'Seu email',
          required: true,
          sort_order: 2
        }]);
      }
      setLoading(false);
    };
    checkAuth();
  }, [id, navigate, isAdminView, selectedUserId]);

  // Load available forms for selection (FIX: Avoid empty string in UUID filter)
  useEffect(() => {
    const loadForms = async () => {
      if (!effectiveUserId) return;
      let query = supabase.from('form_configs').select('id, title, slug').eq('user_id', effectiveUserId);

      // Only add neq filter if id exists and is not 'new'
      if (id && id !== 'new') {
        query = query.neq('id', id);
      }
      const {
        data,
        error
      } = await query.order('title');
      if (!error && data) {
        setAvailableForms(data);
      }
    };
    loadForms();
  }, [effectiveUserId, id]);
  const loadFormConfig = async (formId: string, userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('form_configs').select('*').eq('id', formId).eq('user_id', userId).single();
      if (error) throw error;
      if (data) {
        setFormConfig({
          ...data,
          button_action_form_id: (data as any).button_action_form_id || null,
          confirmation_title: (data as any).confirmation_title || 'Formulário enviado!',
          confirmation_message: (data as any).confirmation_message || 'Obrigado pelo seu contato. Retornaremos em breve.',
          confirmation_button_text: (data as any).confirmation_button_text || 'Enviar outro formulário',
          show_confirmation_button: (data as any).show_confirmation_button ?? true,
          confirmation_button_action: (data as any).confirmation_button_action || 'reset',
          confirmation_button_link: (data as any).confirmation_button_link || null,
          confirmation_button_form_id: (data as any).confirmation_button_form_id || null
        });
      }
    } catch (error) {
      console.error('Error loading form config:', error);
      toast.error('Erro ao carregar configuração');
    }
  };
  const loadCustomFields = async (formConfigId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('form_fields').select('*').eq('form_config_id', formConfigId).order('sort_order', {
        ascending: true
      });
      if (error) throw error;
      const fields = (data || []).map(f => ({
        id: f.id,
        field_type: f.field_type as FormField['field_type'],
        label: f.label,
        placeholder: f.placeholder || '',
        required: f.required,
        options: f.options || [],
        sort_order: f.sort_order
      }));
      setCustomFields(fields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast.error('Erro ao carregar campos');
    }
  };
  const handleFieldsChange = (updatedFields: FormField[]) => {
    setCustomFields(updatedFields);
  };
  const generateSlug = (title: string): string => {
    return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };
  const handleSave = async () => {
    if (!effectiveUserId) return;
    if (formConfig.slug) {
      if (formConfig.slug.length < 3) {
        toast.error('URL do formulário deve ter pelo menos 3 caracteres');
        return;
      }
      if (!/^[a-z0-9-]+$/.test(formConfig.slug)) {
        toast.error('URL deve conter apenas letras minúsculas, números e hífens');
        return;
      }
    }
    setSaving(true);
    try {
      const {
        id: formId,
        ...formData
      } = formConfig;
      const slug = formData.slug || generateSlug(formConfig.title);
      const dataToSave = {
        ...formData,
        user_id: effectiveUserId,
        slug
      };
      const isCreatingNew = !id || id === 'new';
      if (isCreatingNew) {
        if (dataToSave.slug) {
          const {
            data: existing
          } = await supabase.from('form_configs').select('id').eq('slug', dataToSave.slug).eq('user_id', effectiveUserId).maybeSingle();
          if (existing) {
            toast.error('Esta URL já está em uso. Escolha outra.');
            setSaving(false);
            return;
          }
        }
        const {
          data,
          error
        } = await supabase.from('form_configs').insert([dataToSave]).select().single();
        if (error) throw error;
        await saveCustomFields(data.id);
        toast.success('Formulário criado com sucesso');
        navigate('/dashboard?tab=forms');
      } else {
        if (dataToSave.slug) {
          const {
            data: existing
          } = await supabase.from('form_configs').select('id').eq('slug', dataToSave.slug).eq('user_id', effectiveUserId).neq('id', id).maybeSingle();
          if (existing) {
            toast.error('Esta URL já está em uso. Escolha outra.');
            setSaving(false);
            return;
          }
        }
        const {
          error
        } = await supabase.from('form_configs').update(dataToSave).eq('id', id).eq('user_id', effectiveUserId);
        if (error) throw error;
        await saveCustomFields(id);
        toast.success('Formulário salvo com sucesso');
        navigate('/dashboard?tab=forms');
      }
    } catch (error: any) {
      console.error('Error saving form config:', error);
      toast.error('Erro ao salvar formulário');
    } finally {
      setSaving(false);
    }
  };
  const saveCustomFields = async (formConfigId: string) => {
    try {
      const {
        error: deleteError
      } = await supabase.from('form_fields').delete().eq('form_config_id', formConfigId);
      if (deleteError) throw deleteError;
      if (customFields.length > 0) {
        const fieldsToInsert = customFields.map(field => ({
          form_config_id: formConfigId,
          field_type: field.field_type,
          label: field.label,
          placeholder: field.placeholder || null,
          required: field.required,
          options: field.options || null,
          sort_order: field.sort_order
        }));
        const {
          error: insertError
        } = await supabase.from('form_fields').insert(fieldsToInsert);
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving fields:', error);
      throw error;
    }
  };
  const handleView = () => {
    if (isNew) {
      toast.info('Salve o formulário primeiro para visualizar');
      return;
    }
    if (!formConfig.slug || !username) {
      toast.error('Configure a URL do formulário primeiro');
      return;
    }
    window.open(`/${username}/form/${formConfig.slug}`, '_blank');
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveUserId) return;
    
    setUploading(true);
    try {
      // Import dynamically to avoid circular dependencies
      const { processImageFile } = await import('@/utils/imageProcessing');
      
      toast.info('Processando imagem...');
      const { blob } = await processImageFile(file);
      
      const fileName = `${Date.now()}.webp`;
      const filePath = `${effectiveUserId}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('form-backgrounds').upload(filePath, blob, {
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('form-backgrounds').getPublicUrl(filePath);
      setFormConfig({
        ...formConfig,
        background_image: publicUrl
      });
      toast.success('Imagem enviada e otimizada!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };
  const handleRemoveImage = async () => {
    if (!formConfig.background_image) return;
    try {
      const url = new URL(formConfig.background_image);
      const pathParts = url.pathname.split('/');
      const filePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
      const {
        error
      } = await supabase.storage.from('form-backgrounds').remove([filePath]);
      if (error) throw error;
      setFormConfig({
        ...formConfig,
        background_image: null
      });
      toast.success('Imagem removida com sucesso');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Erro ao remover imagem');
    }
  };
  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Configurar Formulário | Dashboard</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/dashboard?tab=forms')} variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                {isNew ? 'Novo Formulário' : 'Editar Formulário'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleView} variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Visualizar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Status do Formulário</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formConfig.is_active ? 'Formulário ativo e visível' : 'Formulário inativo'}
                </p>
              </div>
              <Switch checked={formConfig.is_active} onCheckedChange={checked => setFormConfig({
              ...formConfig,
              is_active: checked
            })} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações Básicas</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Formulário</Label>
                <Input id="title" value={formConfig.title} onChange={e => setFormConfig({
                ...formConfig,
                title: e.target.value
              })} placeholder="Ex: Inscreva-se para mentoria" />
              </div>
              
              <div>
                <Label htmlFor="slug">URL do Formulário</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input id="slug" value={formConfig.slug || ''} onChange={e => setFormConfig({
                    ...formConfig,
                    slug: e.target.value.toLowerCase()
                  })} placeholder="ex: mentoria-individual" />
                  </div>
                  {formConfig.slug && username && <Button variant="outline" size="icon" onClick={() => {
                  const url = `${window.location.origin}/${username}/form/${formConfig.slug}`;
                  navigator.clipboard.writeText(url);
                  toast.success('URL copiada!');
                }}>
                      <Copy className="w-4 h-4" />
                    </Button>}
                </div>
                {formConfig.slug && username && <p className="text-sm text-muted-foreground mt-1">
                    {window.location.origin}/{username}/form/{formConfig.slug}
                  </p>}
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formConfig.description || ''} onChange={e => setFormConfig({
                ...formConfig,
                description: e.target.value
              })} placeholder="Descrição do formulário" rows={3} />
              </div>

              <div>
                <Label htmlFor="quote">Citação</Label>
                <Textarea id="quote" value={formConfig.quote || ''} onChange={e => setFormConfig({
                ...formConfig,
                quote: e.target.value
              })} placeholder="Citação motivacional" rows={2} />
              </div>

              <div>
                <Label>Imagem de Fundo</Label>
                <div className="mt-2 space-y-4">
                  {formConfig.background_image ? <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <img src={formConfig.background_image} alt="Background preview" className="w-full h-full object-cover" />
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleRemoveImage}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div> : <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {uploading ? 'Enviando...' : 'Clique para fazer upload'}
                          </p>
                        </div>
                      </label>
                    </div>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Posição do Formulário</h3>
            <PositionSelector value={formConfig.form_position} onChange={position => setFormConfig({
            ...formConfig,
            form_position: position
          })} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Campos do Formulário</h3>
            <FormFieldManager fields={customFields} onFieldsChange={handleFieldsChange} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações do Botão</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="button-text">Texto do Botão</Label>
                <Input id="button-text" value={formConfig.button_text} onChange={e => setFormConfig({
                ...formConfig,
                button_text: e.target.value
              })} />
              </div>
              
              <div>
                <Label htmlFor="button-color">Cor do Botão</Label>
                <div className="flex gap-2">
                  <Input id="button-color" type="color" value={formConfig.button_color} onChange={e => setFormConfig({
                  ...formConfig,
                  button_color: e.target.value
                })} className="w-20 h-10" />
                  <Input value={formConfig.button_color} onChange={e => setFormConfig({
                  ...formConfig,
                  button_color: e.target.value
                })} placeholder="#10b981" />
                </div>
              </div>

              <div>
                <Label htmlFor="button-action">Ação após Envio</Label>
                <select id="button-action" value={formConfig.button_action} onChange={e => setFormConfig({
                ...formConfig,
                button_action: e.target.value
              })} className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="confirmation">Mensagem de Confirmação</option>
                  <option value="external_link">Link Externo</option>
                  <option value="other_form">Ir para outro formulário</option>
                </select>
              </div>

              {formConfig.button_action === 'external_link' && <div>
                  <Label htmlFor="external-link">URL do Link Externo</Label>
                  <Input id="external-link" type="url" value={formConfig.external_link_url || ''} onChange={e => setFormConfig({
                ...formConfig,
                external_link_url: e.target.value
              })} placeholder="https://exemplo.com/obrigado" />
                </div>}

              {formConfig.button_action === 'other_form' && <div>
                  <Label htmlFor="button-action-form">Selecionar Formulário</Label>
                  <select id="button-action-form" value={formConfig.button_action_form_id || ''} onChange={e => setFormConfig({
                ...formConfig,
                button_action_form_id: e.target.value
              })} className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione um formulário</option>
                    {availableForms.map(form => <option key={form.id} value={form.id}>
                        {form.title}
                      </option>)}
                  </select>
                </div>}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mensagem de Confirmação</h3>
            {formConfig.button_action === 'confirmation' ? <div className="space-y-4">
                <div>
                  <Label htmlFor="confirmation-title">Título da Confirmação</Label>
                  <Input id="confirmation-title" value={formConfig.confirmation_title} onChange={e => setFormConfig({
                ...formConfig,
                confirmation_title: e.target.value
              })} placeholder="Ex: Formulário enviado!" />
                </div>
                
                <div>
                  <Label htmlFor="confirmation-message">Mensagem de Confirmação</Label>
                  <Textarea id="confirmation-message" value={formConfig.confirmation_message} onChange={e => setFormConfig({
                ...formConfig,
                confirmation_message: e.target.value
              })} placeholder="Ex: Obrigado pelo seu contato. Retornaremos em breve." rows={3} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="show-button">Exibir Botão</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar botão na mensagem de confirmação
                    </p>
                  </div>
                  <Switch id="show-button" checked={formConfig.show_confirmation_button} onCheckedChange={checked => setFormConfig({
                ...formConfig,
                show_confirmation_button: checked
              })} />
                </div>

                {formConfig.show_confirmation_button && <>
                    <div>
                      <Label htmlFor="confirmation-button-text">Texto do Botão</Label>
                      <Input id="confirmation-button-text" value={formConfig.confirmation_button_text} onChange={e => setFormConfig({
                  ...formConfig,
                  confirmation_button_text: e.target.value
                })} placeholder="Ex: Enviar outro formulário" />
                    </div>

                    <div>
                      <Label htmlFor="confirmation-button-action">Ação do Botão de Confirmação</Label>
                      <select id="confirmation-button-action" value={formConfig.confirmation_button_action} onChange={e => setFormConfig({
                  ...formConfig,
                  confirmation_button_action: e.target.value
                })} className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="reset">Reiniciar formulário</option>
                        <option value="external_link">Ir para link externo</option>
                        <option value="other_form">Ir para outro formulário</option>
                      </select>
                    </div>

                    {formConfig.confirmation_button_action === 'external_link' && <div>
                        <Label htmlFor="confirmation-button-link">URL do Link Externo</Label>
                        <Input id="confirmation-button-link" type="url" value={formConfig.confirmation_button_link || ''} onChange={e => setFormConfig({
                  ...formConfig,
                  confirmation_button_link: e.target.value
                })} placeholder="https://exemplo.com/obrigado" />
                      </div>}

                    {formConfig.confirmation_button_action === 'other_form' && <div>
                        <Label htmlFor="confirmation-button-form">Selecionar Outro Formulário</Label>
                        <select id="confirmation-button-form" value={formConfig.confirmation_button_form_id || ''} onChange={e => setFormConfig({
                  ...formConfig,
                  confirmation_button_form_id: e.target.value
                })} className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="">Selecione um formulário</option>
                          {availableForms.map(form => <option key={form.id} value={form.id}>
                              {form.title}
                            </option>)}
                        </select>
                      </div>}
                  </>}
              </div> : <p className="text-sm text-muted-foreground">
                A mensagem de confirmação só é exibida quando a ação do botão está configurada como "Mensagem de Confirmação".
              </p>}
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-2 mb-4">
              <h3 className="text-lg font-semibold">Notificações</h3>
              <Info className="w-4 h-4 text-muted-foreground mt-1" />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-notification">Email para Notificações</Label>
                <Input id="email-notification" type="email" value={formConfig.email_notification || ''} onChange={e => setFormConfig({
                ...formConfig,
                email_notification: e.target.value
              })} placeholder="Ex: contato@exemplo.com" />
                <p className="text-xs text-muted-foreground mt-1">
                  Você receberá um email sempre que um formulário for enviado
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>;
};
export default FormBuilder;