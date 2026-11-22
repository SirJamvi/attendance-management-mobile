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

export interface CapturePhotoOptions {
  direction?: CameraDirection;
  source?: CameraSource;
  maxWidth?: number;
  quality?: number;
  promptHeader?: string;
}

export interface DetailedPhotoResult {
  dataUrl: string;
  photoDate: Date | null;
  hasExifDate: boolean;
  isOlderThan7Days: boolean;
  daysAgo: number;
}

/**
 * Helper to parse various EXIF date string formats:
 * - "YYYY:MM:DD HH:MM:SS" (Standard EXIF)
 * - "YYYY-MM-DDTHH:MM:SS" (ISO)
 * - Unix timestamp
 */
export function parseExifDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateVal === 'string') {
    const exifMatch = dateVal.trim().match(/^(\d{4}):(\d{2}):(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
    if (exifMatch) {
      const year = parseInt(exifMatch[1], 10);
      const month = parseInt(exifMatch[2], 10) - 1;
      const day = parseInt(exifMatch[3], 10);
      const hour = exifMatch[4] ? parseInt(exifMatch[4], 10) : 0;
      const min = exifMatch[5] ? parseInt(exifMatch[5], 10) : 0;
      const sec = exifMatch[6] ? parseInt(exifMatch[6], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Open Capacitor Camera / Gallery and return a detailed result with EXIF date analysis.
 */
export async function captureDetailedPhoto(
  options?: CapturePhotoOptions
): Promise<DetailedPhotoResult | null> {
  const maxWidth = Math.min(options?.maxWidth ?? 640, 640);
  const quality = Math.min(options?.quality ?? 0.5, 0.55);
  const direction = options?.direction ?? CameraDirection.Rear;
  const source = options?.source ?? CameraSource.Camera;

  const photo = await Camera.getPhoto({
    quality: Math.min(Math.round(quality * 100), 55),
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source,
    saveToGallery: false,
    direction,
    width: maxWidth,
    promptLabelHeader: options?.promptHeader || 'Pilih Foto',
    promptLabelCancel: 'Batal',
    promptLabelPicture: 'Ambil Foto',
    promptLabelPhoto: 'Dari Galeri',
    presentationStyle: 'fullscreen',
  });

  if (!photo.dataUrl) {
    return null;
  }

  // Extract EXIF date if available
  let photoDate: Date | null = null;
  const exif = photo.exif;
  if (exif) {
    const rawDate = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime || exif.DateCreated;
    photoDate = parseExifDate(rawDate);
  }

  let daysAgo = 0;
  let isOlderThan7Days = false;
  if (photoDate) {
    const now = new Date();
    const diffMs = now.getTime() - photoDate.getTime();
    daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    isOlderThan7Days = daysAgo > 7;
  }

  const compressedDataUrl = await compressImageDataUrl(photo.dataUrl, maxWidth, quality);

  return {
    dataUrl: compressedDataUrl,
    photoDate,
    hasExifDate: photoDate !== null,
    isOlderThan7Days,
    daysAgo,
  };
}

/**
 * Open Capacitor Camera directly and return a client-compressed JPEG Data URL.
 */
export async function captureCompressedPhoto(options?: CapturePhotoOptions): Promise<string | null> {
  const detailed = await captureDetailedPhoto(options);
  return detailed ? detailed.dataUrl : null;
}
