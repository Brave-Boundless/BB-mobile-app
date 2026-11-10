import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { soundtrackCopy as copy } from '@copy/soundtrack';
import { playlists } from '@/content/soundtrack';

import { SoundtrackScreen } from '../soundtrack-screen';

describe('Soundtrack', () => {
  it('lists the five playlists with the website’s words', async () => {
    await render(<SoundtrackScreen />);
    expect(playlists).toHaveLength(5);
    for (const p of playlists) {
      expect(screen.getByText(p.name)).toBeTruthy();
      expect(screen.getByText(p.body)).toBeTruthy();
      expect(p.url).toMatch(/^https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]{22}$/);
    }
    expect(screen.getByText(copy.eyebrow(1, 'The Fire'))).toBeTruthy();
    expect(screen.getByText(copy.eyebrow(5, 'Rule 12'))).toBeTruthy();
    expect(screen.getByText(copy.outro)).toBeTruthy();
  });

  it('opens a playlist on Spotify', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<SoundtrackScreen />);
    await fireEvent.press(screen.getByTestId('playlist-2'));
    expect(open).toHaveBeenCalledWith('https://open.spotify.com/playlist/4ARcUY5dWF3ctvtZ9plOeH');
    open.mockRestore();
  });
});
