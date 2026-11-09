import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { rulesCopy as copy } from '@copy/rules';
import { passages, rules } from '@/content';
import { useDrillStore } from '@/features/drill/store';

import { RuleDetailScreen } from '../rule-detail-screen';
import { PathScreen } from '@/features/path/path-screen';
import { stampsCopy } from '@copy/stamps';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const wrap = (el: React.ReactElement) => render(<SafeAreaProvider initialMetrics={metrics}>{el}</SafeAreaProvider>);

describe('Rules screens', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 4, 9, 0) });
    useDrillStore.getState().reset();
    const s = useDrillStore.getState();
    s.start('2026-10-01', '07:00');
    s.answer(s.openToday('2026-10-01')!, 'done', 'five_minute');
    s.answer(useDrillStore.getState().openToday('2026-10-02')!, 'dodged', 'five_minute');
    const d3 = useDrillStore.getState().openToday('2026-10-03')!;
    useDrillStore.getState().answer(d3, 'done', 'daily');
    useDrillStore.getState().saveReport(d3, 'It cost me my excuse.');
    useDrillStore.getState().openToday('2026-10-04'); // Rule 2, day 4
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('Path shows all 15 rules as tiles in the four parts, stamps and today marked', async () => {
    await wrap(<PathScreen />);
    for (const name of ['FIRE', 'FORGE', 'FOUNDATION', 'FIELD']) expect(screen.getByText(name)).toBeTruthy();
    for (const r of rules) expect(screen.getByTestId(`rule-${r.number}`)).toBeTruthy();
    // Rule 1: all three days answered, so its tile is the stamp.
    expect(screen.getByLabelText(stampsCopy.a11y.earned(1, 'Move Before You’re Ready', 2))).toBeTruthy();
    expect(screen.getByTestId('tile-stamp-1')).toBeTruthy();
    expect(screen.getByLabelText(`Rule 2. Tell the Brutal Truth Fast. ${copy.list.current}.`)).toBeTruthy();
    expect(screen.getByLabelText('Rule 15. Make Your Life a Public Service Announcement.')).toBeTruthy();
    expect(screen.getByTestId('path-stats')).toBeTruthy();
    expect(screen.getByText('3 of 45 drills answered · 1 of 15 stamped')).toBeTruthy();
    // Day 3 was a Did it after Day 2's dodge: a streak of one.
    expect(screen.getByText('Streak · 1 drill')).toBeTruthy();
  });

  it('Path leaves the streak out when there is none', async () => {
    useDrillStore.getState().reset();
    await wrap(<PathScreen />);
    expect(screen.queryByTestId('path-streak')).toBeNull();
  });

  it('shows all six card fields and the record for a rule', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: '1' });
    await wrap(<RuleDetailScreen />);
    const r = rules[0];
    for (const text of [r.why_it_matters, r.drills.five_minute, r.drills.uncomfortable, r.drills.daily, r.scorecard, r.mantra]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.getByText(copy.detail.chapter('Burn the Map'))).toBeTruthy();
    expect(screen.getByText('Day 1 · Five-minute drill · Did it')).toBeTruthy();
    expect(screen.getByText('Day 2 · Five-minute drill · Dodged it')).toBeTruthy();
    expect(screen.getByText(copy.detail.fallbackNote)).toBeTruthy(); // day 2 only
    expect(screen.getByText('Day 3 · Daily drill · Did it')).toBeTruthy();
    expect(screen.getByText('It cost me my excuse.')).toBeTruthy();
    expect(screen.getByTestId('rule-stamp')).toBeTruthy(); // all three days answered
    expect(screen.getByTestId('rule-tally')).toHaveTextContent('2 of 3 done');
  });

  it('opens the rule\'s passages from "From the book"', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: '1' });
    await wrap(<RuleDetailScreen />);
    const n = passages.filter((p) => p.rule === 1 && p.use !== 'exercise').length;
    expect(screen.getByText(`${n} passages  ›`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('rule-from-the-book'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/passages', params: { rule: '1' } });
  });

  it('shows the empty record for a rule not reached', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: '4' });
    await wrap(<RuleDetailScreen />);
    expect(screen.getByText(copy.detail.historyEmpty(10))).toBeTruthy();
    expect(screen.getByTestId('rule-tally')).toHaveTextContent('Not reached');
  });

  it('heads a rule with its chapter illustration', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: '8' });
    await wrap(<RuleDetailScreen />);
    expect(screen.getByTestId('chapter-art')).toBeTruthy();
  });
});
