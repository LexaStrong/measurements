import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Compresses an image client-side to a manageable size (max dimension 1200px, JPEG/WebP)
 * to minimize storage footprint and ensure lightning-fast offline and online saves.
 */
export const compressImage = (
  file: File | Blob,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be acquired'));
          return;
        }

        // Draw image onto canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp, fallback to jpeg
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Uploads a reference design image to Supabase Storage bucket `garment-designs`.
 * Path format: {userId}/{recordId}_{timestamp}.jpg
 * Returns the public URL of the uploaded image.
 */
export const uploadReferenceDesign = async (
  supabase: SupabaseClient,
  userId: string,
  recordId: string,
  imageBlob: Blob
): Promise<string> => {
  const timestamp = Date.now();
  const filePath = `${userId}/${recordId}_${timestamp}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('garment-designs')
    .upload(filePath, imageBlob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('garment-designs').getPublicUrl(filePath);
  return data.publicUrl;
};
