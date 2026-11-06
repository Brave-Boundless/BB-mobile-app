// status: draft — awaiting Mark's approval
//
// Copy for build step 5b: the Settings tab — morning push time, account
// (optional sign-in), data export, delete. The tagline is the book's brand line.

export const settingsCopy = {
  status: 'draft',

  title: 'Settings',

  // ── Morning push ─────────────────────────────────────────────────────────
  push: {
    title: 'Morning push',
    timeLabel: 'Push at',
    off: 'Pushes are off. Turn them on in your phone’s settings.',
    openSettings: 'Open phone settings',
  },

  // ── Account (optional) ───────────────────────────────────────────────────
  account: {
    title: 'Account',
    signedOut: 'No account. Your record lives on this phone only.',
    why: 'Sign in to back it up and keep it if you change phones.',
    apple: 'Continue with Apple',
    google: 'Continue with Google',
    email: 'Continue with email',

    // Email: one-time code
    emailLabel: 'Email',
    sendCode: 'Send code',
    codeSent: (email: string) => `Enter the 6-digit code sent to ${email}.`,
    codeLabel: 'Code',
    verify: 'Sign in',
    resend: 'Send a new code',
    wrongCode: 'That code didn’t work. Try again or send a new one.',
    badEmail: 'That email doesn’t look right.',
    failed: 'Couldn’t reach the server. Check your connection and try again.',

    signedInAs: (email: string) => `Signed in as ${email}`,
    synced: 'Backed up.',
    syncing: 'Backing up…',
    pending: 'Changes waiting to back up. They go when you’re online.',
    signOut: 'Sign out',
    signOutNote: 'Signing out keeps your record on this phone.',
  },

  // ── Your data ────────────────────────────────────────────────────────────
  data: {
    title: 'Your data',
    exportBody: 'Everything you’ve logged — drills and journal — in one file.',
    export: 'Export my data',
    exportFailed: 'Export didn’t work. Try again.',
  },

  // ── Delete ───────────────────────────────────────────────────────────────
  delete: {
    title: 'Delete',
    bodySignedIn: 'Deletes your account and everything in it, on this phone and on our servers. Can’t be undone.',
    bodySignedOut: 'Erases everything on this phone. Can’t be undone.',
    button: 'Delete everything',
    confirm: {
      title: 'Delete everything?',
      body: 'Your drills, your journal, your account. Gone for good.',
      confirm: 'Delete',
      keep: 'Keep it',
    },
    failed: 'Couldn’t delete your account. Check your connection and try again. Nothing was removed.',
  },

  // ── About ────────────────────────────────────────────────────────────────
  about: {
    book: 'Brave & Boundless by Mark A. Nead',
    version: (v: string) => `Version ${v}`,
    tagline: 'ONLY THE BRAVE BECOME BOUNDLESS',
  },
} as const;
