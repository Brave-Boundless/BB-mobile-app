// status: draft — for Mark's review, 2026-11-07
//
// Links to the website and Brave & Boundless on social (Mark, 2026-11-07). Same accounts as
// braveandboundless.com's footer. Shown in Settings ("Follow Mark", above the
// version line), at the end of Community → Share Your Story ("Follow along"),
// and as the handle on the passage share card.

export const socialCopy = {
  status: 'draft',

  settingsTitle: 'Follow Mark',
  communityTitle: 'Follow along',
  communityBody: 'Stories, drills and the work behind the book.',

  // Under the site on the 1080 × 1920 passage share card.
  shareHandle: '@braveandboundless',

  // VoiceOver, one per icon.
  a11y: (network: string) => `Brave & Boundless on ${network}`,
  websiteA11y: 'braveandboundless.com',
} as const;
