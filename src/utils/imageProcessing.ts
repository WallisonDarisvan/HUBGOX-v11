/**
 * Image Processing Utilities
 * 
 * Handles automatic image compression and WebP conversion for all uploads.
 * Ensures images stay under 500KB with optimal quality.
 */

interface ProcessedImage {
  blob: Blob;
  fileName: string;
}

/**
 * Compress image to WebP format with maximum size constraint
 * Uses iterative quality reduction and resizing if needed
 */
export async function compressImageToWebP(
  file: File,
  maxSizeKB: number = 500
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Erro ao criar canvas'));
        return;
      }

      let width = img.width;
      let height = img.height;
      let quality = 0.9;
      let blob: Blob | null = null;

      // Strategy: Try quality reduction first, then dimension reduction
      const qualitySteps = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
      const sizeSteps = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];

      // Try different size and quality combinations
      for (const sizeMultiplier of sizeSteps) {
        width = Math.floor(img.width * sizeMultiplier);
        height = Math.floor(img.height * sizeMultiplier);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        for (const q of qualitySteps) {
          blob = await new Promise<Blob | null>((res) => {
            canvas.toBlob((b) => res(b), 'image/webp', q);
          });

          if (!blob) continue;

          // Check if size is acceptable
          if (blob.size <= maxSizeKB * 1024) {
            resolve(blob);
            return;
          }
        }
      }

      // If still too large, use minimum settings
      canvas.width = Math.floor(img.width * 0.4);
      canvas.height = Math.floor(img.height * 0.4);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      blob = await new Promise<Blob | null>((res) => {
        canvas.toBlob((b) => res(b), 'image/webp', 0.3);
      });

      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Erro ao comprimir imagem'));
      }
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process an image file: validate, compress, and convert to WebP
 * 
 * @param file - The image file to process
 * @returns Processed WebP blob and new filename
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo inválido. Use JPG, PNG, GIF ou WEBP.');
  }

  // Compress and convert to WebP
  const blob = await compressImageToWebP(file);

  // Generate new filename with .webp extension
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const fileName = `${originalName}.webp`;

  return { blob, fileName };
}