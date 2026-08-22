import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'fbf_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  try {
    const fromEnvUrl = import.meta.env.VITE_SUPABASE_URL;
    const fromEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (fromEnvUrl && fromEnvKey && !fromEnvUrl.includes('your-supabase-url')) {
      return { url: fromEnvUrl, anonKey: fromEnvKey };
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Supabase configuration:', e);
  }
  return null;
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.location.reload(); // Re-initialize client with new credentials
  } catch (e) {
    console.error('Error saving Supabase configuration:', e);
  }
}

export function clearStoredSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch (e) {
    console.error('Error clearing Supabase configuration:', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getStoredSupabaseConfig();
  if (config?.url && config?.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return null;
}

export const isSupabaseConnected = (): boolean => {
  return getStoredSupabaseConfig() !== null;
};
