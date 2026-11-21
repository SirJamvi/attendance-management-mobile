import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Compress a Data URL image on the client using HTML5 Canvas.
 * Defaults: maxWidth = 1280px, quality = 0.75 (JPEG) for fast mobile field uploads.
 */
export function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 720,
  quality = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof Image === 'undefined') {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth) {
          const ratio = maxWidth / targetWidth;
          targetWidth = maxWidth;
          targetHeight = Math.round(targetHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed || dataUrl);
      } catch (err) {
        console.warn('⚠️ Image compression fallback to original:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Open Capacitor Camera directly and return a client-compressed JPEG Data URL.
 */
export async function captureCompressedPhoto(options?: {
  direction?: CameraDirection;
  maxWidth?: number;
  quality?: number;
  promptHeader?: string;
}): Promise<string | null> {
  const maxWidth = Math.min(options?.maxWidth ?? 640, 640);
  const quality = Math.min(options?.quality ?? 0.5, 0.55);
  const direction = options?.direction ?? CameraDirection.Rear;

  const photo = await Camera.getPhoto({
    quality: Math.min(Math.round(quality * 100), 55),
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    saveToGallery: false,
    direction,
    width: maxWidth,
    promptLabelHeader: options?.promptHeader || 'Ambil Foto',
    promptLabelCancel: 'Batal',
    promptLabelPicture: 'Ambil Foto',
    presentationStyle: 'fullscreen',
  });

  if (!photo.dataUrl) {
    return null;
  }

  return compressImageDataUrl(photo.dataUrl, maxWidth, quality);
}
