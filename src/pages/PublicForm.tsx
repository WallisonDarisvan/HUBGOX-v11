import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { countries } from '@/lib/countries';
import { CustomFieldRenderer } from '@/components/CustomFieldRenderer';

interface FormConfig {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  quote: string | null;
  background_image: string | null;
  button_text: string;
  button_color: string;
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

interface CustomField {
  id: string;
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  sort_order: number;
}

// Validation schema with comprehensive input sanitization
const createFormSchema = (customFields: CustomField[]) => {
  const schema: any = {};

  customFields.forEach(field => {
    const fieldKey = `custom_${field.id}`;
    
    if (field.required) {
      switch (field.field_type) {
        case 'email':
          schema[fieldKey] = z.string().trim().email('Email inválido').max(255, 'Email muito longo');
          break;
        case 'phone':
          schema[fieldKey] = z.string().trim().min(4, 'Telefone inválido').max(20, 'Telefone muito longo');
          break;
        case 'number':
          schema[fieldKey] = z.string().trim().min(1, `${field.label} é obrigatório`).max(50, 'Número muito longo');
          break;
        case 'textarea':
          schema[fieldKey] = z.string().trim().min(1, `${field.label} é obrigatório`).max(5000, 'Texto muito longo (máximo 5000 caracteres)');
          break;
        case 'checkbox':
          schema[fieldKey] = z.array(z.string().trim().max(500, 'Opção muito longa')).min(1, `Selecione pelo menos uma opção em ${field.label}`);
          break;
        default:
          // text, select, radio
          schema[fieldKey] = z.string().trim().min(1, `${field.label} é obrigatório`).max(500, 'Texto muito longo (máximo 500 caracteres)');
      }
    } else {
      switch (field.field_type) {
        case 'email':
          schema[fieldKey] = z.string().trim().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal(''));
          break;
        case 'phone':
          schema[fieldKey] = z.string().trim().max(20, 'Telefone muito longo').optional().or(z.literal(''));
          break;
        case 'number':
          schema[fieldKey] = z.string().trim().max(50, 'Número muito longo').optional().or(z.literal(''));
          break;
        case 'textarea':
          schema[fieldKey] = z.string().trim().max(5000, 'Texto muito longo (máximo 5000 caracteres)').optional().or(z.literal(''));
          break;
        case 'checkbox':
          schema[fieldKey] = z.array(z.string().trim().max(500, 'Opção muito longa')).optional();
          break;
        default:
          // text, select, radio
          schema[fieldKey] = z.string().trim().max(500, 'Texto muito longo (máximo 500 caracteres)').optional().or(z.literal(''));
      }
    }
  });
  
  if (customFields.some(f => f.field_type === 'phone')) {
    schema.countryCode = z.string().min(1, 'Selecione o país');
  }
  
  return z.object(schema);
};

// Helper function to map position to Tailwind classes
const getPositionClasses = (position: string): string => {
  const positionMap: Record<string, string> = {
    'top-left': 'items-start justify-start',
    'top-center': 'items-start justify-center',
    'top-right': 'items-start justify-end',
    'middle-left': 'items-center justify-start',
    'middle-center': 'items-center justify-center',
    'middle-right': 'items-center justify-end',
    'bottom-left': 'items-end justify-start',
    'bottom-center': 'items-end justify-center',
    'bottom-right': 'items-end justify-end',
  };
  
  return positionMap[position] || 'items-center justify-center';
};

// Helper function to get container margin classes based on position
const getContainerClasses = (position: string): string => {
  if (position.includes('left')) return 'mr-auto';
  if (position.includes('right')) return 'ml-auto';
  return 'mx-auto'; // center positions
};

// Helper function to get grid position for 3x3 layout
const getGridPosition = (position: string): string => {
  const gridMap: Record<string, string> = {
    'top-left': 'col-start-1 row-start-1 items-start',
    'top-center': 'col-start-2 row-start-1 items-start',
    'top-right': 'col-start-3 row-start-1 items-start',
    'middle-left': 'col-start-1 row-start-2 items-center',
    'middle-center': 'col-start-2 row-start-2 items-center',
    'middle-right': 'col-start-3 row-start-2 items-center',
    'bottom-left': 'col-start-1 row-start-3 items-end',
    'bottom-center': 'col-start-2 row-start-3 items-end',
    'bottom-right': 'col-start-3 row-start-3 items-end',
  };
  return gridMap[position] || 'col-start-2 row-start-2 items-center';
};

const PublicForm = () => {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    phone: '',
    email: '',
    countryCode: '+55',
  });
  

  useEffect(() => {
    loadFormConfig();
  }, [slug]);

  // Initialize checkbox fields with empty arrays
  useEffect(() => {
    if (customFields.length > 0) {
      const checkboxFields = customFields.filter(field => field.field_type === 'checkbox');
      if (checkboxFields.length > 0) {
        const initialCheckboxValues: Record<string, any> = {};
        checkboxFields.forEach(field => {
          const fieldKey = `custom_${field.id}`;
          if (!(fieldKey in formData)) {
            initialCheckboxValues[fieldKey] = [];
          }
        });
        if (Object.keys(initialCheckboxValues).length > 0) {
          setFormData(prev => ({ ...prev, ...initialCheckboxValues }));
        }
      }
    }
  }, [customFields]);

  const loadFormConfig = async () => {
    try {
      console.log('Loading form with username and slug:', { username, slug });
      
      // Query form_configs joined with profiles to filter by username
      const { data, error } = await supabase
        .from('form_configs')
        .select(`
          id, 
          slug, 
          title, 
          description, 
          quote, 
          background_image, 
          button_text, 
          button_color, 
          is_active, 
          form_position,
          button_action,
          external_link_url,
          button_action_form_id,
          confirmation_title,
          confirmation_message,
          confirmation_button_text,
          show_confirmation_button,
          confirmation_button_action,
          confirmation_button_link,
          confirmation_button_form_id,
          user_id,
          profiles!inner(username)
        `)
        .eq('slug', slug)
        .eq('profiles.username', username)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Form config response:', { data, error });

      if (error) throw error;
      
      if (!data) {
        throw new Error('Form not found');
      }

      console.log('Form config loaded successfully:', data);
      setFormConfig({
        ...data,
        button_action: (data as any).button_action || 'confirmation',
        external_link_url: (data as any).external_link_url || null,
        button_action_form_id: (data as any).button_action_form_id || null,
        confirmation_title: (data as any).confirmation_title || 'Formulário enviado!',
        confirmation_message: (data as any).confirmation_message || 'Obrigado pelo seu contato. Retornaremos em breve.',
        confirmation_button_text: (data as any).confirmation_button_text || 'Enviar outro formulário',
        show_confirmation_button: (data as any).show_confirmation_button ?? true,
        confirmation_button_action: (data as any).confirmation_button_action || 'reset',
        confirmation_button_link: (data as any).confirmation_button_link || null,
        confirmation_button_form_id: (data as any).confirmation_button_form_id || null,
      });
      
      // Load custom fields
      if (data.id) {
        await loadCustomFields(data.id);
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Formulário não encontrado ou inativo');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFields = async (formConfigId: string) => {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_config_id', formConfigId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const fields = (data || []) as CustomField[];
      console.log('Custom fields loaded:', fields);
      setCustomFields(fields);
      
      // Initialize custom fields in formData
      const customFieldsData: Record<string, any> = {};
      fields.forEach((field) => {
        const key = `custom_${field.id}`;
        customFieldsData[key] = field.field_type === 'checkbox' ? [] : '';
      });
      
      setFormData(prev => ({ ...prev, ...customFieldsData }));
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const handleConfirmationButtonClick = async () => {
    if (!formConfig) return;

    switch (formConfig.confirmation_button_action) {
      case 'reset':
        setSubmitted(false);
        break;
      
      case 'external_link':
        if (formConfig.confirmation_button_link) {
          window.location.href = formConfig.confirmation_button_link;
        }
        break;
      
      case 'other_form':
        if (formConfig.confirmation_button_form_id) {
          try {
            const { data, error } = await supabase
              .from('form_configs')
              .select('slug')
              .eq('id', formConfig.confirmation_button_form_id)
              .single();
            
            if (!error && data && username) {
              navigate(`/${username}/form/${data.slug}`);
            }
          } catch (error) {
            console.error('Error navigating to form:', error);
            toast.error('Erro ao carregar formulário');
          }
        }
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formConfig) return;


    setSubmitting(true);

    try {
      // Validate form data
      const schema = createFormSchema(customFields);
      const validatedData = schema.parse(formData);

      // Prepare submission data
      const customFieldsData: Record<string, any> = {};
      let submissionName = null;
      let submissionPhone = null;
      let submissionEmail = null;
      
      customFields.forEach(field => {
        const key = `custom_${field.id}`;
        const value = validatedData[key];
        
        if (value !== undefined && value !== '') {
          if (field.field_type === 'text' && field.label.toLowerCase().includes('nome')) {
            submissionName = value;
          } else if (field.field_type === 'phone') {
            submissionPhone = validatedData.countryCode ? `${validatedData.countryCode}${value}` : value;
          } else if (field.field_type === 'email') {
            submissionEmail = value;
          }
          customFieldsData[field.label] = value;
        }
      });

      // Submit form data via Edge Function (captures IP and User Agent)
      const { data, error } = await supabase.functions.invoke('submit-form', {
        body: {
          form_config_id: formConfig.id,
          name: submissionName,
          phone: submissionPhone,
          email: submissionEmail,
          custom_fields: customFieldsData,
        }
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error);

      
      
      // Handle button action
      if (formConfig.button_action === 'external_link' && formConfig.external_link_url) {
        // Redirect to external link
        window.location.href = formConfig.external_link_url;
      } else if (formConfig.button_action === 'other_form' && formConfig.button_action_form_id) {
        // Navigate to another form
        try {
          const { data: targetForm, error: formError } = await supabase
            .from('form_configs')
            .select('slug')
            .eq('id', formConfig.button_action_form_id)
            .single();
          
          if (!formError && targetForm && username) {
            navigate(`/${username}/form/${targetForm.slug}`);
          }
        } catch (error) {
          console.error('Error navigating to form:', error);
          toast.error('Erro ao carregar formulário');
        }
      } else {
        // Show confirmation message
        setSubmitted(true);
      }
      
      // Clear form
      const clearedCustomFields: Record<string, any> = {};
      customFields.forEach(field => {
        const key = `custom_${field.id}`;
        clearedCustomFields[key] = field.field_type === 'checkbox' ? [] : '';
      });
      
      setFormData({
        name: '',
        phone: '',
        email: '',
        countryCode: '+55',
        ...clearedCustomFields,
      });

      toast.success('Formulário enviado com sucesso!');

    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('Error submitting form:', error);
        toast.error('Erro ao enviar formulário. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando formulário...</p>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Formulário não encontrado</h1>
          <p className="text-muted-foreground">Este formulário não existe ou está inativo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Helmet>
        <title>{formConfig.title}</title>
        <meta name="description" content={formConfig.description || formConfig.title} />
      </Helmet>

      {/* Background Image */}
      {formConfig.background_image && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${formConfig.background_image})` }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 ${
        formConfig.description || formConfig.quote
          ? `min-h-screen px-8 md:px-12 lg:px-16 py-20 flex ${getPositionClasses(formConfig.form_position || 'middle-center')}`
          : 'h-screen w-full flex items-stretch p-8'
      }`}>
        <div className={`${
          formConfig.description || formConfig.quote
            ? `w-full max-w-6xl ${getContainerClasses(formConfig.form_position || 'middle-center')}`
            : 'w-full h-full'
        }`}>
          {(() => {
            const hasTextContent = formConfig.description || formConfig.quote;
            
            if (hasTextContent) {
              // Layout com 2 colunas (texto + formulário)
              return (
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                  {/* Left Side - Text Content */}
                  <div className="text-white space-y-6 lg:space-y-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                      {formConfig.title}
                    </h1>
                    
                    {formConfig.description && (
                      <p className="text-lg md:text-xl text-white/80">
                        {formConfig.description}
                      </p>
                    )}

                    {formConfig.quote && (
                      <div className="pt-8 lg:pt-12">
                        <blockquote className="text-xl md:text-2xl lg:text-3xl font-semibold italic text-white/90 leading-relaxed">
                          {formConfig.quote}
                        </blockquote>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Form */}
                  <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
                    <div className="bg-background/95 backdrop-blur-md rounded-xl p-6 md:p-8 shadow-2xl border border-border">
                      {submitted ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold">{formConfig.confirmation_title}</h3>
                          <p className="text-muted-foreground">
                            {formConfig.confirmation_message}
                          </p>
                          {formConfig.show_confirmation_button && (
                            <Button
                              onClick={handleConfirmationButtonClick}
                              variant="outline"
                              className="w-full"
                            >
                              {formConfig.confirmation_button_text}
                            </Button>
                          )}
                        </div>
                       ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {customFields.map((field) => (
                            <CustomFieldRenderer
                              key={field.id}
                              field={field}
                              value={formData[`custom_${field.id}`]}
                              onChange={(value) => setFormData({ ...formData, [`custom_${field.id}`]: value })}
                              countryCode={formData.countryCode}
                              onCountryCodeChange={(code) => setFormData({ ...formData, countryCode: code })}
                            />
                          ))}

                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold"
                            style={{
                              backgroundColor: formConfig.button_color,
                              color: '#ffffff'
                            }}
                            disabled={submitting}
                          >
                            {submitting ? 'Enviando...' : formConfig.button_text}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Layout sem texto (grid 3x3 para posicionamento livre)
              return (
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full auto-rows-fr justify-items-center items-center">
                  <div className={`flex flex-col items-center ${getGridPosition(formConfig.form_position || 'middle-center')}`}>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white mb-8">
                      {formConfig.title}
                    </h1>
                    <div className="bg-background/95 backdrop-blur-md rounded-xl p-6 md:p-8 shadow-2xl border border-border w-full max-w-md">
                      {submitted ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold">{formConfig.confirmation_title}</h3>
                          <p className="text-muted-foreground">
                            {formConfig.confirmation_message}
                          </p>
                          {formConfig.show_confirmation_button && (
                            <Button
                              onClick={handleConfirmationButtonClick}
                              variant="outline"
                              className="w-full"
                            >
                              {formConfig.confirmation_button_text}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {customFields.map((field) => (
                            <CustomFieldRenderer
                              key={field.id}
                              field={field}
                              value={formData[`custom_${field.id}`]}
                              onChange={(value) => setFormData({ ...formData, [`custom_${field.id}`]: value })}
                              countryCode={formData.countryCode}
                              onCountryCodeChange={(code) => setFormData({ ...formData, countryCode: code })}
                            />
                          ))}

                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold"
                            style={{
                              backgroundColor: formConfig.button_color,
                              color: '#ffffff'
                            }}
                            disabled={submitting}
                          >
                            {submitting ? 'Enviando...' : formConfig.button_text}
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
