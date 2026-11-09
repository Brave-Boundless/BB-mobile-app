import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { inspirationCopy as copy } from '@copy/inspiration';
import { passages } from '@/content';
import { useDrillStore } from '@/features/drill/store';

import { LibraryScreen } from '../library-screen';

const reading = passages.filter((p) => p.use !== 'exercise');

describe('Passages library', () => {
  beforeEach(() => useDrillStore.getState().reset());

  it('filters by situation and clears on a second tap', async () => {
    await render(<LibraryScreen embedded />);
    const fear = reading.filter((p) => p.situations.includes('fear'));
    const notFear = reading.find((p) => !p.situations.includes('fear'))!;
    await fireEvent.press(screen.getByTestId('situation-fear'));
    expect(screen.getByText(fear[0].text)).toBeTruthy();
    expect(screen.queryByText(notFear.text)).toBeNull();
    await fireEvent.press(screen.getByTestId('situation-fear'));
    expect(screen.queryByTestId('library-empty')).toBeNull();
  });

  it('shows saved passages, or says how to save one', async () => {
    await render(<LibraryScreen embedded />);
    await fireEvent.press(screen.getByTestId('library-view-saved'));
    expect(screen.getByText(copy.library.empty)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('library-view-all'));
    await fireEvent.press(screen.getByTestId(`passage-${reading[0].id}-save`));
    await fireEvent.press(screen.getByTestId('library-view-saved'));
    expect(screen.getByText(reading[0].text)).toBeTruthy();
    expect(screen.queryByText(copy.library.empty)).toBeNull();
  });

  it('groups by rule, never showing exercises', async () => {
    await render(<LibraryScreen embedded />);
    await fireEvent.press(screen.getByTestId('library-view-byRule'));
    expect(screen.getByText('Rule 1 · Move Before You’re Ready')).toBeTruthy();
    const ex = passages.find((p) => p.use === 'exercise' && p.rule === 1)!;
    expect(screen.queryByText(ex.text)).toBeNull();
  });

  it('opened from a rule, shows only that rule until another view is picked', async () => {
    await render(<LibraryScreen embedded rule={5} />);
    const five = reading.find((p) => p.rule === 5)!;
    const one = reading.find((p) => p.rule === 1)!;
    expect(screen.getByText(five.text)).toBeTruthy();
    expect(screen.queryByText(one.text)).toBeNull();
    expect(screen.queryByText('Rule 1 · Move Before You’re Ready')).toBeNull();
    await fireEvent.press(screen.getByTestId('library-view-byRule'));
    expect(screen.getByText('Rule 1 · Move Before You’re Ready')).toBeTruthy();
  });

  it('can open on Saved', async () => {
    await render(<LibraryScreen embedded initialView="saved" />);
    expect(screen.getByText(copy.library.empty)).toBeTruthy();
  });
});
