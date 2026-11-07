import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { features } from '@/lib/features';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { authOptions } from './auth';

/**
 * Accounts are required (Mark, 2026-11-07) wherever sign-in can work. Builds
 * without Supabase (local web previews) skip the gate.
 */
export const accountsRequired = features.requireAccounts && isSupabaseConfigured && authOptions.email;

/** The current session, and whether the saved one has been read yet (so the gate doesn't flash). */
export function useAuthState(): { loaded: boolean; session: Session | null } {
  const [state, setState] = useState<{
    loaded: boolean;
    session: Session | null;
  }>({
    loaded: !isSupabaseConfigured,
    session: null,
  });
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const client = getSupabase();
    void client.auth.getSession().then(({ data }) => setState({ loaded: true, session: data.session }));
    const { data } = client.auth.onAuthStateChange((_e, s) => setState({ loaded: true, session: s }));
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
