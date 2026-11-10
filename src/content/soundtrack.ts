import type { PartId } from './types';

/**
 * The five Brave & Boundless playlists (braveandboundless.com/the-soundtrack):
 * one per part of the book, plus one for Rule 12. Names and blurbs are the
 * website's. Each opens Spotify's https link, which the phone hands to the
 * Spotify app when it's installed, or the browser.
 */
export interface Playlist {
  n: number;
  /** "The Fire", "The Forge", … or "Rule 12". */
  label: string;
  name: string;
  body: string;
  /** Colours the card: the part it belongs to (Rule 12 is FOUNDATION). */
  part: PartId;
  url: string;
}

export const playlists: Playlist[] = [
  {
    n: 1,
    label: 'The Fire',
    name: 'Grit & Resilience',
    body: 'Getting knocked down and dragging yourself back up. The dark years, the refusal to quit, the moment the fire inside burned brighter than the fire around you.',
    part: 1,
    url: 'https://open.spotify.com/playlist/7aE3foBRg8DXMlkkj5cxxt',
  },
  {
    n: 2,
    label: 'The Forge',
    name: 'Discipline & Ambition',
    body: 'Outworking the room. Building something from nothing. The sound of early mornings, late nights, and the grind that nobody sees but everyone eventually feels.',
    part: 2,
    url: 'https://open.spotify.com/playlist/4ARcUY5dWF3ctvtZ9plOeH',
  },
  {
    n: 3,
    label: 'The Foundation',
    name: 'Roots & Identity',
    body: 'Where you came from. The weight you carry and the cycles you chose to break. The music of becoming who you actually are instead of who you were told to be.',
    part: 3,
    url: 'https://open.spotify.com/playlist/0gWioJiO0YJsl0nMRAKyCs',
  },
  {
    n: 4,
    label: 'The Field',
    name: 'Love & Loyalty',
    body: 'The people who make all of it worth it. These are the songs for the ones you build your life around — the ones who never leave.',
    part: 4,
    url: 'https://open.spotify.com/playlist/0176fXuMYvD8Vr8wV1vQBN',
  },
  {
    n: 5,
    label: 'Rule 12',
    name: 'Humble & Kind',
    body: 'The rebellion of choosing grace in a cynical world. Kindness isn’t weakness — it’s the hardest, most powerful thing a person can choose to do. These songs know that.',
    part: 3,
    url: 'https://open.spotify.com/playlist/6imbbe2aafj16MErJxi09x',
  },
];
