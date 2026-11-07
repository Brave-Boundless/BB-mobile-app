import { useEffect } from 'react';

import { useAccountStore } from './account-store';
import { joinNewsletter } from './newsletter';
import { useAuthState } from './session';

/** Once signed in, sends a ticked newsletter box to Kit (retried on later launches if it fails). */
export function useNewsletterOnSignIn(): void {
  const { session } = useAuthState();
  const wanted = useAccountStore((s) => s.newsletterWanted);
  const email = session?.user.email;
  useEffect(() => {
    if (!email || !wanted) return;
    joinNewsletter(email)
      .then(() => useAccountStore.getState().markNewsletterJoined())
      .catch(() => undefined);
  }, [email, wanted]);
}
