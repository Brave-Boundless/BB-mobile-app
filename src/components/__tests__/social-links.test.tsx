import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { socialCopy } from '@copy/social';
import { socialLinks } from '@/content/social';

import { SocialLinks } from '../social-links';

describe('SocialLinks', () => {
  it('links the four accounts from the website, all https', () => {
    expect(socialLinks.map((s) => s.key)).toEqual(['instagram', 'tiktok', 'facebook', 'x']);
    for (const s of socialLinks) expect(s.url).toMatch(/^https:\/\//);
  });

  it('opens each account and labels it for VoiceOver', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<SocialLinks />);
    for (const s of socialLinks) {
      const button = screen.getByLabelText(socialCopy.a11y(s.name));
      fireEvent.press(button);
      expect(open).toHaveBeenLastCalledWith(s.url);
    }
  });
});
