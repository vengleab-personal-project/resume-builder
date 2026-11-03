import { PROFILE_PHOTO_MAX_LENGTH } from '@/shared/lib/profile';

/**
 * Browser-side photo preparation, shared by the builder's photo input and the profile
 * page. A photo used to be stored exactly as picked - a multi-MB data URL in
 * localStorage and in every autosave body. It is now downscaled and re-encoded to a few
 * tens of KB first, which is also what keeps it under the profile's size cap.
 */

export const PHOTO_MAX_EDGE_PX = 512;

export type ImageErrorCode = 'NOT_AN_IMAGE' | 'DECODE_FAILED' | 'TOO_LARGE';

export class ImageError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode) {
    super(code);
    this.name = 'ImageError';
    this.code = code;
  }
}

const ACCEPTED_TYPES = /^image\/(png|jpe?g|webp|gif|bmp)$/;

const decode = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('DECODE_FAILED'));
    };
    img.src = url;
  });

// Quality steps tried, in order, until the result fits the cap. A normal photo fits on
// the first; the later steps are for large, noisy ones.
const ATTEMPTS: ReadonlyArray<{ edge: number; quality: number }> = [
  { edge: PHOTO_MAX_EDGE_PX, quality: 0.85 },
  { edge: PHOTO_MAX_EDGE_PX, quality: 0.7 },
  { edge: 384, quality: 0.7 },
  { edge: 256, quality: 0.6 },
];

/**
 * Downscales `file` to at most `PHOTO_MAX_EDGE_PX` on its longer side (aspect ratio
 * kept, nothing cropped) and returns it as a JPEG data URL under the profile's cap.
 */
export async function resizeImageToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.test(file.type)) throw new ImageError('NOT_AN_IMAGE');

  const img = await decode(file);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (!longest) throw new ImageError('DECODE_FAILED');

  for (const { edge, quality } of ATTEMPTS) {
    const scale = Math.min(1, edge / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('DECODE_FAILED');
    // JPEG has no alpha: a transparent PNG would otherwise turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= PROFILE_PHOTO_MAX_LENGTH) return dataUrl;
  }

  throw new ImageError('TOO_LARGE');
}
