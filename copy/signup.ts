// status: approved — Mark, 2026-11-07
//
// Required sign-up (Mark, 2026-11-07: readers should create an account, "so I
// can market to them"). The account is required for backup, sync and groups;
// marketing is a separate, opt-in box (App Store 5.1.1, CAN-SPAM, GDPR), off
// by default, feeding the Kit newsletter form 9157427 like Share Your Story.
//
// Where it shows:
//   - New readers: after the "15 rules. 3 drills each. 45 days." intro,
//     before "Start Day 1".
//   - Readers already using the app: once, on next open. Their progress so
//     far moves into the new account.
//   - After signing out.
// The sign-in buttons and the email-code steps reuse the approved wording in
// copy/settings.ts (Continue with Apple / email, Send code, Enter the 6-digit
// code…, wrong-code and no-connection errors).
//
// Tone: short, imperative, no exclamation points.

export const signupCopy = {
  status: 'approved',

  // ── The sign-up screen ────────────────────────────────────────────────────
  screen: {
    headline: 'Make it yours.',
    body: 'Create your account before Day 1. Takes ten seconds.',
    // Three short reasons, shown as a list.
    why: [
      'Your drills and notes, backed up.',
      'Change phones and keep every day.',
      'Your seat in a group when they open.',
    ],
    // Buttons: settings.account.apple / .email (approved). Google later.
    privacy: 'We’ll never sell your email. Ever.', // (website wording)
  },

  // ── Newsletter box (unticked by default) ───────────────────────────────────
  newsletter: {
    label: 'Send me Mark’s newsletter.',
    detail: 'New chapters, events and drills. Unsubscribe any time.',
  },

  // ── Readers already using the app (shown once, on next open) ──────────────
  existing: {
    headline: 'Lock in your progress.',
    body: (answered: number) =>
      answered === 1
        ? 'You’ve answered 1 drill. Create your account to keep it backed up.'
        : `You’ve answered ${answered} drills. Create your account to keep them backed up.`,
    note: 'Everything you’ve done so far moves into your account.',
  },

  // ── No connection on first open ────────────────────────────────────────────
  offline: 'You need a connection to create your account. After that, the app works offline.',

  // ── Settings (replaces the optional-account lines) ────────────────────────
  settings: {
    // Joining works from the app (Kit's public form). Leaving is Kit's
    // unsubscribe link in every email; the app can't do it without a server.
    newsletterTitle: 'Newsletter',
    newsletterJoin: 'Send me Mark’s newsletter',
    newsletterJoined: 'You’re on the list.',
    newsletterHint: 'New chapters, events and drills. To leave, use the unsubscribe link in any email.',
    // Replaces settings.account.signOutNote
    signOutNote: 'Your record stays backed up. Sign in again to pick up where you left off.',
  },
} as const;
