import { QueryClient } from '@tanstack/react-query';

// Server state. Offline behaviour for Today + Journal (local-first writes,
// sync on reconnect) lands with build step 2.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
  },
});
