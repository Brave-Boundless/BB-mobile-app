import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { howItWorksCopy } from '@copy/howitworks';
import { HowItWorksScreen } from '../how-it-works-screen';


describe('How this works', () => {
  it('shows every approved section and line', async () => {
    await render(<HowItWorksScreen />);
    expect(screen.getByText(howItWorksCopy.intro)).toBeTruthy();
    for (const s of howItWorksCopy.sections) {
      expect(screen.getByText(s.heading)).toBeTruthy();
      for (const line of s.body) expect(screen.getByText(line)).toBeTruthy();
    }
  });

  it('keeps the tone rules', () => {
    const all = JSON.stringify(howItWorksCopy);
    expect(all).not.toMatch(/!/);
  });
});
