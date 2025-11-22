/**
 * Utilitário para processar URLs de vídeo de diferentes plataformas
 */

export interface VideoInfo {
  platform: 'youtube' | 'vimeo' | 'unknown';
  videoId: string | null;
  embedUrl: string | null;
  isValid: boolean;
}

/**
 * Extrai informações de um link de vídeo e gera URL de embed
 */
export function parseVideoUrl(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { platform: 'unknown', videoId: null, embedUrl: null, isValid: false };
  }

  const trimmedUrl = url.trim();

  // YouTube
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        platform: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`,
        isValid: true,
      };
    }
  }

  // Vimeo
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        platform: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1&controls=0`,
        isValid: true,
      };
    }
  }

  return { platform: 'unknown', videoId: null, embedUrl: null, isValid: false };
}

/**
 * Valida se uma URL de vídeo é suportada
 */
export function isValidVideoUrl(url: string): boolean {
  return parseVideoUrl(url).isValid;
}