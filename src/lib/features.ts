// Features that are built in pieces. A flag flips when its build step lands.

export const features = {
  /** Ask Mark in the app (build step 9, live). Shows the "Ask Mark about this" buttons. */
  askMark: true,
  /**
   * Required sign-up before Day 1 (Mark, 2026-11-07). Off until sign-in codes
   * reach everyone (custom SMTP in Supabase); flipping it ships as an update.
   * Off, accounts stay optional as before.
   */
  requireAccounts: false,
} as const;
