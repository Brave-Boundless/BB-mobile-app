import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { progressCopy as copy } from '@copy/progress';
import { stampsCopy } from '@copy/stamps';
import { rules } from '@/content';
import { useDrillStore } from '@/features/drill/store';

import { ProgressScreen } from '../progress-screen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ProgressScreen />
    </SafeAreaProvider>,
  );

describe('Progress screen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 5, 9, 0) });
    useDrillStore.getState().reset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('before starting: not started, zero streak, nothing reached', async () => {
    await show();
    expect(screen.getByText(copy.day.notStarted)).toBeTruthy();
    expect(screen.getByText(copy.streak.zero)).toBeTruthy();
    expect(screen.getByLabelText(copy.map.cellA11y(1, 0, 0))).toBeTruthy();
    expect(screen.getAllByText(copy.scorecards.notReached)).toHaveLength(15);
    expect(screen.getByText(stampsCopy.passport.count(0))).toBeTruthy();
    expect(screen.queryByTestId('stamp-1')).toBeNull();
  });

  it('after four days: day, streak with mantra, map and scorecards', async () => {
    const outcomes = ['done', 'dodged', 'done', 'done'] as const;
    outcomes.forEach((o, i) => {
      const s = useDrillStore.getState();
      if (i === 0) s.start('2026-10-01', '07:00');
      s.answer(useDrillStore.getState().openToday(`2026-10-0${i + 1}`)!, o, 'five_minute');
    });
    await show();
    expect(screen.getByTestId('progress-day').props.children).toBe(copy.day.value(5, 45)); // day 4 answered yesterday → day 5 today
    expect(screen.getByTestId('progress-streak').props.children).toBe(copy.streak.value(2));
    expect(screen.getByText('Clarity now saves carnage later.')).toBeTruthy();
    expect(screen.getByLabelText(copy.map.cellA11y(1, 2, 3))).toBeTruthy();
    expect(screen.getByLabelText(copy.map.cellA11y(2, 1, 1))).toBeTruthy();
    for (const r of rules) expect(screen.getByText(r.scorecard)).toBeTruthy();
    expect(screen.getByText(copy.scorecards.tally(2, 3))).toBeTruthy();
    // Rule 1's three days are answered: its stamp is in the passport; rule 2's is not.
    expect(screen.getByText(stampsCopy.passport.count(1))).toBeTruthy();
    expect(screen.getByTestId('stamp-1')).toBeTruthy();
    expect(screen.getByLabelText(stampsCopy.a11y.earned(1, 'Move Before You’re Ready', 2))).toBeTruthy();
    expect(screen.getByLabelText(stampsCopy.a11y.notYet(2, 'Tell the Brutal Truth Fast'))).toBeTruthy();
  });
});
