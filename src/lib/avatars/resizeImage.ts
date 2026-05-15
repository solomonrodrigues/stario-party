const TARGET = 256;
const QUALITY = 0.82;
const MAX_BYTES = 100 * 1024;

export async function resizeImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const bitmap = await loadBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported in this browser.');

  const src = squareCrop(bitmap.width, bitmap.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    bitmap,
    src.x,
    src.y,
    src.size,
    src.size,
    0,
    0,
    TARGET,
    TARGET,
  );

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  let quality = QUALITY;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  // Step down quality if we're way over budget; this is rare for 256x256.
  while (dataUrlBytes(dataUrl) > MAX_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

interface CropRect {
  x: number;
  y: number;
  size: number;
}

function squareCrop(w: number, h: number): CropRect {
  const size = Math.min(w, h);
  return {
    x: Math.round((w - size) / 2),
    y: Math.round((h - size) / 2),
    size,
  };
}

function dataUrlBytes(url: string): number {
  // base64 padding: 4 chars = 3 bytes
  const comma = url.indexOf(',');
  if (comma === -1) return url.length;
  const b64 = url.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to <img> fallback (some browsers fail on certain GIFs).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
