import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { pullServer, pushSettings } from '@/features/account/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { useDrillStore } from './store';
import { pushDirty } from './sync';

/** True while the device has no internet. */
export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(
    () => NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false)),
    [],
  );
  return offline;
}

let running = false;
let again = false;
/** User whose server history has been merged in during this app run. */
let pulledFor: string | null = null;

export type SyncState = 'idle' | 'syncing';
const listeners = new Set<(s: SyncState) => void>();
function emit(s: SyncState) {
  for (const l of listeners) l(s);
}

export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(running ? 'syncing' : 'idle');
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

/**
 * Signed in + online: first pull this user's server history and merge it
 * (once per app run), then push local changes and settings. Safe to call
 * often; overlapping calls coalesce into one follow-up run.
 */
export async function syncNow(): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  emit('syncing');
  try {
    const client = getSupabase();
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      pulledFor = null;
      return;
    }
    if (pulledFor !== userId) {
      useDrillStore.getState().mergeServer(await pullServer(client));
      const { notifyAt } = useDrillStore.getState();
      await pushSettings(client, userId, notifyAt, Intl.DateTimeFormat().resolvedOptions().timeZone);
      pulledFor = userId;
    }
    const result = await pushDirty(client, userId, useDrillStore.getState());
    useDrillStore.getState().markSynced(result);
  } catch {
    // Offline or transient failure: rows stay dirty and go next time.
  } finally {
    running = false;
    emit('idle');
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

/** Push time + time zone to the user's row when they change. Signed out or offline: skipped (sent on next sign-in). */
export async function syncSettings(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const client = getSupabase();
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    await pushSettings(client, userId, useDrillStore.getState().notifyAt, Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    // Next sign-in or sync sends it.
  }
}

/** Forget the pulled user (sign-out / delete) so the next sign-in merges again. */
export function resetSyncSession(): void {
  pulledFor = null;
}

/** Syncs on mount, on sign-in, on reconnect, and after every local write. */
export function useBackgroundSync(): void {
  useEffect(() => {
    void syncNow();
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected) void syncNow();
    });
    const unsubStore = useDrillStore.subscribe((s, prev) => {
      if (s.drills !== prev.drills || s.journal !== prev.journal) void syncNow();
      else if (s.notifyAt !== prev.notifyAt) void syncSettings();
    });
    let unsubAuth = () => {};
    if (isSupabaseConfigured) {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') void syncNow();
        if (event === 'SIGNED_OUT') resetSyncSession();
      });
      unsubAuth = () => data.subscription.unsubscribe();
    }
    return () => {
      unsubNet();
      unsubStore();
      unsubAuth();
    };
  }, []);
}
