import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminView } from '@/contexts/AdminViewContext';
import { usePlan } from '@/contexts/PlanContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { parseVideoUrl } from '@/utils/videoUtils';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/hooks/queries/useProfile';
import { Footer } from '@/components/Footer';

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  cover_type: 'image' | 'video';
  cover_video_url: string;
  custom_phrase: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  spotify_url: string;
  whatsapp_url: string;
  footer_text_primary: string;
  footer_text_secondary: string;
  show_verified_badge: boolean;
  show_avatar: boolean;
}

const Profile = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { currentPlan } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Se admin passar userId via state, usa esse ID, senão usa o do usuário logado
  const editingUserId = (location.state as any)?.userId || user?.id;
  const [formData, setFormData] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    cover_image_url: '',
    cover_type: 'image',
    cover_video_url: '',
    custom_phrase: '',
    instagram_url: '',
    linkedin_url: '',
    youtube_url: '',
    spotify_url: '',
    whatsapp_url: '',
    footer_text_primary: '',
    footer_text_secondary: '',
    show_verified_badge: false,
    show_avatar: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user || !editingUserId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', editingUserId)
        .single();

      if (error) throw error;
      if (!data) {
        setLoading(false);
        return;
      }

      setFormData({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        cover_image_url: data.cover_image_url || '',
        cover_type: data.cover_type || 'image',
        cover_video_url: data.cover_video_url || '',
        custom_phrase: data.custom_phrase || '',
        instagram_url: data.instagram_url || '',
        linkedin_url: data.linkedin_url || '',
        youtube_url: data.youtube_url || '',
        spotify_url: data.spotify_url || '',
        whatsapp_url: data.whatsapp_url || '',
        footer_text_primary: data.footer_text_primary || '',
        footer_text_secondary: data.footer_text_secondary || '',
        show_verified_badge: data.show_verified_badge || false,
        show_avatar: data.show_avatar !== false,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingUserId) return;

    setSaving(true);
    try {
      console.log('Profile Debug:', {
        isAdmin,
        userId: user?.id,
        editingUserId,
        isEditingSelf: user?.id === editingUserId
      });

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          custom_phrase: formData.custom_phrase,
          cover_type: formData.cover_type,
          cover_video_url: formData.cover_video_url,
          instagram_url: formData.instagram_url,
          linkedin_url: formData.linkedin_url,
          youtube_url: formData.youtube_url,
          spotify_url: formData.spotify_url,
          whatsapp_url: formData.whatsapp_url,
          footer_text_primary: formData.footer_text_primary,
          footer_text_secondary: formData.footer_text_secondary,
          show_verified_badge: formData.show_verified_badge,
          show_avatar: formData.show_avatar,
        })
        .eq('id', editingUserId);

      if (error) throw error;

      // Invalidar cache do useProfile para atualizar navbar
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(editingUserId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });

      toast.success('Perfil atualizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile Error:', error);
      let errorMessage = 'Erro ao atualizar perfil';
      
      if (error.code === '23505') {
        errorMessage = 'Este username já está em uso';
      } else if (error.code === '42501') {
        errorMessage = 'Permissão negada. Verifique se você tem permissão de admin.';
      } else if (error.code === 'PGRST116') {
        errorMessage = 'Erro de validação RLS. Entre em contato com o suporte.';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !editingUserId) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      // Import dynamically to avoid circular dependencies
      const { processImageFile } = await import('@/utils/imageProcessing');
      
      toast.info('Processando imagem...');
      const { blob } = await processImageFile(file);
      
      const fileName = `${editingUserId}/${Math.random()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', editingUserId);

      if (updateError) throw updateError;

      setFormData({ ...formData, avatar_url: publicUrl });
      
      // Invalidar cache do useProfile para atualizar navbar
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(editingUserId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      
      toast.success('Avatar atualizado e otimizado!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !editingUserId) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      // Import dynamically to avoid circular dependencies
      const { processImageFile } = await import('@/utils/imageProcessing');
      
      toast.info('Processando imagem...');
      const { blob } = await processImageFile(file);
      
      const fileName = `${editingUserId}/${Math.random()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('profile-covers')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-covers')
        .getPublicUrl(fileName);

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ cover_image_url: publicUrl })
        .eq('id', editingUserId);

      if (updateError) throw updateError;

      setFormData({ ...formData, cover_image_url: publicUrl });
      
      // Invalidar cache do useProfile
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(editingUserId) });
      
      toast.success('Capa atualizada e otimizada!');
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast.error(error.message || 'Erro ao fazer upload da capa');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const pageTitle = "Editar Perfil | Personalizar Página";
  const pageDescription = "Personalize sua página pública, adicione suas informações e redes sociais.";
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
            <CardTitle className="text-2xl">Editar Perfil</CardTitle>
            <CardDescription>
              Personalize sua página pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image or Video */}
              <div className="space-y-4">
                <Label>Capa do Perfil</Label>
                
                {/* Tipo de Capa: Imagem ou Vídeo */}
                <RadioGroup
                  value={formData.cover_type}
                  onValueChange={(value: 'image' | 'video') => 
                    setFormData({ ...formData, cover_type: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="cover-image" />
                    <Label htmlFor="cover-image" className="cursor-pointer font-normal">
                      Imagem
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="video" 
                      id="cover-video" 
                      disabled={!currentPlan?.allow_video_bg}
                    />
                    <Label 
                      htmlFor="cover-video" 
                      className={`font-normal ${!currentPlan?.allow_video_bg ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      Vídeo {!currentPlan?.allow_video_bg && '(Requer upgrade)'}
                    </Label>
                  </div>
                </RadioGroup>

                {/* Imagem */}
                {formData.cover_type === 'image' && (
                  <div className="space-y-4">
                    {formData.cover_image_url && (
                      <div className="w-full aspect-[21/9] rounded-lg overflow-hidden border-2 border-border">
                        <img
                          src={formData.cover_image_url}
                          alt="Capa do perfil"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploading}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Label htmlFor="cover-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" disabled={uploading} asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Enviando...' : formData.cover_image_url ? 'Alterar Imagem' : 'Adicionar Imagem'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                )}

                {/* Vídeo */}
                {formData.cover_type === 'video' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cover_video_url">Link do Vídeo (YouTube ou Vimeo)</Label>
                      <Input
                        id="cover_video_url"
                        value={formData.cover_video_url}
                        onChange={(e) => setFormData({ ...formData, cover_video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Cole o link completo do YouTube ou Vimeo
                      </p>
                    </div>
                    
                    {/* Preview do Vídeo */}
                    {formData.cover_video_url && (() => {
                      const videoInfo = parseVideoUrl(formData.cover_video_url);
                      if (videoInfo.isValid && videoInfo.embedUrl) {
                        return (
                          <div className="w-full aspect-[21/9] rounded-lg overflow-hidden border-2 border-border">
                            <iframe
                              src={videoInfo.embedUrl}
                              className="w-full h-full"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          </div>
                        );
                      } else if (formData.cover_video_url.trim()) {
                        return (
                          <p className="text-sm text-destructive">
                            Link de vídeo inválido. Use um link do YouTube ou Vimeo.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Enviando...' : 'Alterar Foto'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="seu-username"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua URL será: {window.location.origin}/{formData.username}
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de Exibição</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Seu Nome"
                />
              </div>

              {/* Verified Badge Toggle */}
              <div className="flex items-center justify-between space-x-2 p-4 border border-border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="verified-badge" className="text-base">
                    Selo de Verificado
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir um selo de verificado ao lado do seu nome
                  </p>
                </div>
                <Switch
                  id="verified-badge"
                  checked={formData.show_verified_badge}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, show_verified_badge: checked })
                  }
                />
              </div>

              {/* Show Avatar Toggle */}
              <div className="flex items-center justify-between space-x-2 p-4 border border-border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="show-avatar" className="text-base">
                    Exibir Foto de Perfil
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar foto de perfil na página pública
                  </p>
                </div>
                <Switch
                  id="show-avatar"
                  checked={formData.show_avatar}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, show_avatar: checked })
                  }
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                />
              </div>

              {/* Custom Phrase */}
              <div className="space-y-2">
                <Label htmlFor="custom_phrase">Frase Personalizada</Label>
                <Input
                  id="custom_phrase"
                  value={formData.custom_phrase}
                  onChange={(e) => setFormData({ ...formData, custom_phrase: e.target.value })}
                  placeholder="Será exibida no lugar de @username"
                />
                <p className="text-xs text-muted-foreground">
                  Esta frase será exibida na sua página pública no lugar do @username
                </p>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="font-semibold">Redes Sociais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input
                    id="instagram_url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/seu-usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/seu-usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_url">YouTube</Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/@seu-canal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotify_url">Spotify</Label>
                  <Input
                    id="spotify_url"
                    value={formData.spotify_url}
                    onChange={(e) => setFormData({ ...formData, spotify_url: e.target.value })}
                    placeholder="https://open.spotify.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_url">WhatsApp</Label>
                  <Input
                    id="whatsapp_url"
                    value={formData.whatsapp_url}
                    onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                    placeholder="https://wa.me/5511999999999"
                  />
                </div>
              </div>

              {/* Footer Customization */}
              <div className="space-y-4">
                <h3 className="font-semibold">Rodapé Personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Personalize o rodapé da sua página pública
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="footer_text_primary">Texto Principal do Rodapé</Label>
                  <Input
                    id="footer_text_primary"
                    value={formData.footer_text_primary}
                    onChange={(e) => setFormData({ ...formData, footer_text_primary: e.target.value })}
                    placeholder="Ex: Nome | CNPJ: 00.000.000/0001-00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparece abaixo dos links de Política e Termos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text_secondary">Texto Secundário do Rodapé</Label>
                  <Input
                    id="footer_text_secondary"
                    value={formData.footer_text_secondary}
                    onChange={(e) => setFormData({ ...formData, footer_text_secondary: e.target.value })}
                    placeholder="Ex: Endereço | Telefones | E-mail"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparece em tamanho menor abaixo do texto principal
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="gradient-cyan">
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
