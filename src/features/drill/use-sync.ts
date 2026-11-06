import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

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

/** Push dirty rows if signed in and online. Safe to call often. */
export async function syncNow(): Promise<void> {
  if (running || !isSupabaseConfigured) return;
  running = true;
  try {
    const client = getSupabase();
    const { data } = await client.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    const result = await pushDirty(client, userId, useDrillStore.getState());
    useDrillStore.getState().markSynced(result);
  } catch {
    // Offline or transient failure: rows stay dirty and go next time.
  } finally {
    running = false;
  }
}

/** Syncs on mount, on reconnect, and after every local write. */
export function useBackgroundSync(): void {
  useEffect(() => {
    void syncNow();
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected) void syncNow();
    });
    const unsubStore = useDrillStore.subscribe((s, prev) => {
      if (s.drills !== prev.drills || s.journal !== prev.journal) void syncNow();
    });
    return () => {
      unsubNet();
      unsubStore();
    };
  }, []);
}
