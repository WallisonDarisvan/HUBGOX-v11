-- Adicionar suporte para vídeo como capa do perfil
ALTER TABLE profiles 
ADD COLUMN cover_type text DEFAULT 'image' CHECK (cover_type IN ('image', 'video')),
ADD COLUMN cover_video_url text;