// status: draft — 2026-11-10
//
// The Soundtrack (Mark, 2026-11-10): the five Brave & Boundless playlists on
// Spotify, opened from a button on Path. Lines marked (website) are
// braveandboundless.com/the-soundtrack wording, reused as-is; the rest is new.

export const soundtrackCopy = {
  status: 'draft',

  // The button on Path, beside Progress and Passages.
  pathButton: 'Soundtrack', // new
  title: 'The Soundtrack', // (website)
  intro:
    'Every rule in this book has a sound. These are the songs that live inside the themes — the music that shaped the thinking, the writing, and the life behind every page.', // (website)

  // One per playlist. "Playlist 01 · The Fire" above the name. (website)
  eyebrow: (n: number, label: string) => `Playlist ${String(n).padStart(2, '0')} · ${label}`,
  play: 'Play on Spotify', // new
  playA11y: (name: string) => `Play ${name} on Spotify`, // new

  outro: 'The book is where the rules live. This is just the soundtrack.', // (website)
} as const;
