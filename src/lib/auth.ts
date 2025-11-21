import { supabase, hasSupabaseConfig } from '../supabaseClient';
import React from 'react';
import { pushToast } from '../components/Toast';

export function detectRecoveryFromUrl(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const path = window.location.pathname || '';

    const hash = window.location.hash || '';     // e.g. #access_token=...&type=recovery
    const search = window.location.search || ''; // e.g. ?access_token=...&type=recovery

    const parts: string[] = [];
    if (hash.startsWith('#')) parts.push(hash.slice(1));
    if (search.startsWith('?')) parts.push(search.slice(1));

    const combined = parts.join('&');

    if (combined) {
      const params = new URLSearchParams(combined);
      const t =
        (params.get('type') || '') ||
        (params.get('action') || '') ||
        (params.get('mode') || '');

      const val = (t || '').toLowerCase();
      if (val && (val === 'recovery' || val.includes('recovery'))) {
        return true;
      }
    }

    // Fallback: Supabase password reset callback route
    if (path === '/auth/callback' || path.includes('/auth/callback')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/** Safe helper: returns the current user or null (never throws). */
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  } catch {
    return null;
  }
}

/** Require login; shows alert and returns null if not logged in. */
export async function requireAuth(): Promise<{ id: string; email?: string } | null> {
  if (!hasSupabaseConfig) { pushToast('Connect Supabase first.'); return null; }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const user = data?.user ?? null;

    if (!user) {
      pushToast('Please log in first (top-right).');
      return null;
    }

    // Optional gate (kept identical to your App.tsx comments):
    // Only allow “email” provider writes (blocks GitHub/Google) — disabled by default.
    return { id: user.id, email: (user as any)?.email };
  } catch {
    pushToast('Please log in first (top-right).');
    return null;
  }
}

/** useSupabaseAuth: keeps auth state (user) + recovery flag in sync */
export function useSupabaseAuth() {
  const [user, setUser] = React.useState<any>(null);
  const [recovery, setRecovery] = React.useState(false);

  React.useEffect(() => {
    if (!hasSupabaseConfig) {
      setUser(null);
      return;
    }

    let unsub: any;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);

      const sub = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      unsub = sub.data?.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

    React.useEffect(() => {
    if (detectRecoveryFromUrl()) setRecovery(true);
  }, []);

  return { user, recovery };
}
