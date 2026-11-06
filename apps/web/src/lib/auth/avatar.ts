import { supabaseBrowser } from "../backend/browser";

export const AVATAR_BUCKET = "carekin-avatars";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function ownedAvatarPath(path: unknown, userId: string): path is string {
  return typeof path === "string" && path.startsWith(`${userId}/`) && /^[a-f0-9-]+\.(webp|png|jpg)$/.test(path.slice(userId.length + 1));
}

export function validatePhoto(file: Pick<File, "size" | "type">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP photo. SVG and HEIC files are not supported.");
  if (!file.size || file.size > MAX_PHOTO_BYTES) throw new Error("Choose a photo smaller than 5 MB.");
}

// Re-encode pixels rather than uploading original camera EXIF/location metadata.
export async function preparePhoto(file: File): Promise<Blob> {
  validatePhoto(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This image could not be opened. Choose another JPG, PNG or WebP photo."); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40_000_000) throw new Error("Choose a photo under 40 megapixels.");
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Unable to prepare this photo.")), "image/webp", 0.88));
  } finally { bitmap.close(); }
}

export async function privateAvatarUrl(path: unknown, userId: string): Promise<string | undefined> {
  if (!ownedAvatarPath(path, userId)) return;
  const { data, error } = await supabaseBrowser().storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  return error ? undefined : data?.signedUrl;
}
