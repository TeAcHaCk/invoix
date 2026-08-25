import { getSupabaseClient } from '../lib/supabase';

/**
 * Uploads document images to Supabase Storage instead of embedding them as
 * base64 inside every document.
 *
 * Base64 inflates a payload by ~33%, and the document is copied into
 * localStorage (a ~5 MB cap) and re-sent to Supabase on every autosave. Storing
 * a URL instead is what makes "unlimited documents" actually true.
 *
 * Every function degrades safely: with no Supabase connection, callers keep the
 * data URL they already had, so the offline / local-only flow keeps working.
 */

export const ASSET_BUCKET = 'invoix-assets';

/** Folder namespace. Kept in sync with the RLS path check in the migration. */
export type AssetKind = 'logo' | 'watermark' | 'signature' | 'stamp';

/** Mirrors the bucket's allowed_mime_types. Enforced server-side regardless. */
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB, same ceiling as the bucket

export interface UploadResult {
  /** Public URL to store on the document, or null when the upload did not happen. */
  url: string | null;
  error?: string;
  /** True when Supabase was unavailable — the caller should keep its data URL. */
  skipped?: boolean;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** True for an already-uploaded asset, false for a base64 data URL or empty. */
export const isStoredAssetUrl = (value?: string | null): boolean =>
  Boolean(value && /^https?:\/\//i.test(value));

/** True for an inline base64 image that has not been uploaded yet. */
export const isDataUrl = (value?: string | null): boolean =>
  Boolean(value && value.startsWith('data:'));

/** Converts a data URL to a Blob so existing base64 images can be migrated. */
export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
    const [header, encoded] = dataUrl.split(',');
    if (!header || !encoded) return null;

    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';

    if (header.includes('base64')) {
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(encoded)], { type: mime });
  } catch (err) {
    console.error('Could not decode data URL:', err);
    return null;
  }
};

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Uploads one image and returns its public URL.
 *
 * The path is `{userId}/{kind}/{uuid}.{ext}` — the leading segment is what the
 * storage RLS policy checks, so a user can only write inside their own folder.
 */
export const uploadAsset = async (
  file: Blob,
  kind: AssetKind,
  userId?: string
): Promise<UploadResult> => {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    // Local-only mode: the caller keeps whatever data URL it already had.
    return { url: null, skipped: true };
  }

  if (file.size > MAX_BYTES) {
    return {
      url: null,
      error: `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use one under 2 MB.`,
    };
  }

  const mime = file.type || 'image/png';
  if (!ALLOWED_MIME.includes(mime)) {
    return { url: null, error: 'Please use a PNG, JPG, WEBP or SVG image.' };
  }

  const path = `${userId}/${kind}/${randomId()}.${EXT_BY_MIME[mime] || 'png'}`;

  try {
    const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
      contentType: mime,
      cacheControl: '31536000', // immutable: the path carries a fresh uuid each time
      upsert: false,
    });

    if (error) {
      console.error('Asset upload failed:', error.message);
      return { url: null, error: 'Could not upload the image. Please try again.' };
    }

    const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    console.error('Asset upload error:', err);
    return { url: null, error: 'Could not upload the image. Please try again.' };
  }
};

/**
 * Uploads a base64 image if it is not already a URL.
 *
 * This is the call sites want: hand it whatever is on the document today and it
 * returns what should be stored. Never throws, and never returns empty — on any
 * failure it hands back the original value so nothing is lost.
 */
export const uploadIfDataUrl = async (
  value: string | undefined,
  kind: AssetKind,
  userId?: string
): Promise<string | undefined> => {
  if (!value || !isDataUrl(value)) return value;

  const blob = dataUrlToBlob(value);
  if (!blob) return value;

  const result = await uploadAsset(blob, kind, userId);
  return result.url ?? value;
};

/** Removes a previously uploaded asset. Ignores anything that is not ours. */
export const deleteAsset = async (publicUrl?: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase || !isStoredAssetUrl(publicUrl)) return false;

  const marker = `/${ASSET_BUCKET}/`;
  const index = publicUrl!.indexOf(marker);
  if (index === -1) return false;

  const path = publicUrl!.slice(index + marker.length).split('?')[0];

  try {
    const { error } = await supabase.storage.from(ASSET_BUCKET).remove([path]);
    if (error) {
      console.warn('Could not delete asset:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not delete asset:', err);
    return false;
  }
};
