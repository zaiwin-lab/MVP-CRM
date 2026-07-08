import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the app is wired to a real Supabase project (shared office mode). */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The Supabase client, or null when running in local demo mode.
 * Everything else in the app checks `isSupabaseConfigured` before using this.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
