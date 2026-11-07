// Account choices kept on the phone: whether the reader ticked the newsletter
// box at sign-up (sent to Kit once they're signed in) and whether it went.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AccountState {
  /** Ticked the box; waiting to send once signed in. */
  newsletterWanted: boolean;
  /** Kit has it. */
  newsletterJoined: boolean;
  setNewsletterWanted(v: boolean): void;
  markNewsletterJoined(): void;
  reset(): void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      newsletterWanted: false,
      newsletterJoined: false,
      setNewsletterWanted: (v) => set({ newsletterWanted: v }),
      markNewsletterJoined: () => set({ newsletterWanted: false, newsletterJoined: true }),
      reset: () => set({ newsletterWanted: false, newsletterJoined: false }),
    }),
    {
      name: 'bb.account.v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
