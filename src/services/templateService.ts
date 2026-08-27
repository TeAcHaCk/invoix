import type { CustomTemplatePreset } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import {
  getCustomTemplates,
  saveCustomTemplate as saveTemplateLocally,
  deleteCustomTemplate as deleteTemplateLocally,
} from '../utils/customTemplateStorage';

/**
 * Cloud sync for custom templates.
 *
 * Templates were localStorage-only, so one designed on a laptop did not exist on
 * a phone and clearing browser data destroyed it. For a paying user the saved
 * brand template is the last thing they expect to be device-local.
 *
 * Local storage is kept as the fast path and the offline fallback — the same
 * shape as documents — so the editor still works with no connection.
 */

/** Mirrors the columns in supabase_migration_custom_templates.sql. */
interface TemplateRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  theme: string | null;
  template: CustomTemplatePreset;
  updated_at: string;
}

const toRow = (t: CustomTemplatePreset, userId: string) => ({
  id: t.id,
  user_id: userId,
  name: t.name,
  description: t.description ?? null,
  industry: t.industry ?? null,
  theme: t.theme ?? null,
  template: t,
  updated_at: new Date().toISOString(),
});

/**
 * Returns the user's templates, merging cloud and local.
 *
 * Cloud wins on conflict — it is the shared truth across devices — but local
 * entries the cloud has not seen are preserved, so a template created offline is
 * never dropped just because a sync ran.
 */
export const fetchCustomTemplates = async (
  userId?: string
): Promise<CustomTemplatePreset[]> => {
  const local = getCustomTemplates();

  const supabase = getSupabaseClient();
  if (!supabase || !userId) return local;

  try {
    const { data, error } = await supabase
      .from('custom_templates')
      .select('template')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch cloud templates, using local:', error.message);
      return local;
    }

    const cloud = (data || [])
      .map((r) => (r as { template: CustomTemplatePreset }).template)
      .filter(Boolean);

    const merged = new Map<string, CustomTemplatePreset>();
    cloud.forEach((t) => merged.set(t.id, t));
    local.forEach((t) => {
      if (!merged.has(t.id)) merged.set(t.id, t);
    });

    // Write the merged view back so the local cache reflects other devices.
    Array.from(merged.values()).forEach(saveTemplateLocally);

    return Array.from(merged.values());
  } catch (err) {
    console.error('Error fetching cloud templates:', err);
    return local;
  }
};

export interface TemplateSaveResult {
  success: boolean;
  isCloud: boolean;
  /** Message safe to show the user when the template stayed on this device. */
  error?: string;
}

/**
 * Saves a template locally, then to the cloud.
 *
 * Local first so the editor never blocks on the network. `isCloud: false` means
 * it exists only on this device — the caller should say so rather than implying
 * it is available everywhere.
 */
export const saveCustomTemplate = async (
  template: CustomTemplatePreset,
  userId?: string
): Promise<TemplateSaveResult> => {
  saveTemplateLocally(template);

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return {
      success: true,
      isCloud: false,
      error: 'Saved on this device only. Sign in to use this template everywhere.',
    };
  }

  try {
    const { error } = await supabase
      .from('custom_templates')
      .upsert(toRow(template, userId));

    if (error) {
      console.warn('Template cloud save failed:', error.message);
      return {
        success: true,
        isCloud: false,
        error: 'Saved on this device, but syncing failed. It will not appear on your other devices yet.',
      };
    }

    return { success: true, isCloud: true };
  } catch (err) {
    console.error('Template cloud save error:', err);
    return {
      success: true,
      isCloud: false,
      error: 'Saved on this device, but syncing failed.',
    };
  }
};

/** Deletes everywhere. A template left in the cloud would reappear on next sync. */
export const deleteCustomTemplate = async (
  templateId: string,
  userId?: string
): Promise<boolean> => {
  deleteTemplateLocally(templateId);

  const supabase = getSupabaseClient();
  if (!supabase || !userId) return true;

  try {
    const { error } = await supabase
      .from('custom_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Template cloud delete failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Template cloud delete error:', err);
    return false;
  }
};

/**
 * One-time migration of templates created before sync existed.
 *
 * Without this, everything a user built while templates were local-only stays
 * invisible on their other devices forever. Safe to call on every sign-in: the
 * upsert is keyed on the template id.
 */
export const pushLocalTemplatesToCloud = async (userId?: string): Promise<number> => {
  const supabase = getSupabaseClient();
  const local = getCustomTemplates();
  if (!supabase || !userId || local.length === 0) return 0;

  try {
    const { error } = await supabase
      .from('custom_templates')
      .upsert(local.map((t) => toRow(t, userId)));

    if (error) {
      console.warn('Could not back up local templates:', error.message);
      return 0;
    }
    return local.length;
  } catch (err) {
    console.error('Template backfill error:', err);
    return 0;
  }
};

export type { TemplateRow };
