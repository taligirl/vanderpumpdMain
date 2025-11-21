// src/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from localStorage safely (works with Step 4A)
function readLS(key: string): string {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}

// Optional env bridges (some hosts inject __ENV)
const env =
  (typeof window !== 'undefined' ? (window as any).__ENV : undefined) ||
  (import.meta as any)?.env ||
  {};

function resolveSupabaseConfig() {
  const lsUrl = readLS('vp_supabase_url');
  const lsKey = readLS('vp_supabase_key');
  const envUrl = String(env.VITE_SUPABASE_URL || '');
  const envKey = String(env.VITE_SUPABASE_ANON_KEY || '');

  const url = lsUrl || envUrl;
  const key = lsKey || envKey;

  return {
    url,
    key,
    hasConfig: Boolean(url && key),
  };
}

function createStubClient() {
  const noCfg = async () => ({ data: null, error: new Error('Supabase not configured') });

  const chain = {
    select: noCfg,
    insert: noCfg,
    upsert: noCfg,
    update: noCfg,
    delete: noCfg,
    eq() { return chain; },
    in() { return chain; },
    order() { return chain; },
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null })
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: noCfg,
      signUp: noCfg,
      resetPasswordForEmail: noCfg,
      updateUser: noCfg,
      signOut: async () => ({ error: null }),
    },
    from() { return chain; },
  };
}

const { url: SUPABASE_URL, key: SUPABASE_KEY, hasConfig } = resolveSupabaseConfig();

// Consider both env and localStorage so manual config works in the UI
export const hasSupabaseConfig = hasConfig;

// If configured, make a real client; otherwise a no-op stub so the app keeps running
export const supabase: SupabaseClient | any = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : createStubClient();
