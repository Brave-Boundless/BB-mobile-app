import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { practiceCopy as copy } from '@copy/practice';
import { todayCopy } from '@copy/today';

import { effortTrend, ruleRecap } from '../after-answer';
import { useDrillStore } from '../store';
import { TodayScreen } from '../today-screen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2400 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderToday = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

/** Starts on 2026-11-10 and answers days 1..n, one per date. Returns the ids. */
function answerDays(n: number, status: 'done' | 'dodged' = 'done'): string[] {
  const s = useDrillStore.getState();
  s.start('2026-11-01', '07:00');
  s.markNotificationsAsked();
  const ids: string[] = [];
  for (let d = 1; d <= n; d++) {
    const date = `2026-11-${String(d).padStart(2, '0')}`;
    const id = useDrillStore.getState().openToday(date)!;
    useDrillStore.getState().answer(id, status, useDrillStore.getState().drills[id].tier);
    ids.push(id);
  }
  return ids;
}

describe('Today after answering (step 7)', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 8, 0) });
    useDrillStore.getState().reset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks how hard a done drill was and plans tomorrow', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.markNotificationsAsked();
    await renderToday();
    await fireEvent.press(await screen.findByLabelText(todayCopy.drill.a11y.did));

    expect(await screen.findByText(copy.rating.prompt)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(copy.rating.a11y(4, 'Hard')));
    const row = Object.values(useDrillStore.getState().drills)[0];
    expect(row.effort).toBe(4);

    await fireEvent.press(screen.getByTestId('flow-next'));
    expect(screen.getByText(copy.plan.headline(1, todayCopy.drill.tier.uncomfortable))).toBeTruthy();
    await fireEvent.press(screen.getByTestId('plan-midday'));
    expect(useDrillStore.getState().plan).toEqual({ forDate: '2026-11-11', at: '12:30' });
    expect(screen.getByTestId('plan-set')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('plan-none'));
    expect(useDrillStore.getState().plan).toBeNull();
  });

  it('asks what got in the way of a dodge, without a lecture', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.markNotificationsAsked();
    await renderToday();
    await fireEvent.press(await screen.findByLabelText(todayCopy.drill.a11y.dodged));
    expect(await screen.findByText(copy.dodge.prompt)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('reason-fear'));
    expect(Object.values(useDrillStore.getState().drills)[0].dodgeReason).toBe('fear');
    expect(screen.queryByText(copy.rating.prompt)).toBeNull();
  });

  it('skipping the question hides it', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.markNotificationsAsked();
    await renderToday();
    await fireEvent.press(await screen.findByLabelText(todayCopy.drill.a11y.did));
    // Next without a rating counts as skipping: the resting screen doesn't ask again.
    await fireEvent.press(await screen.findByTestId('flow-next'));
    await fireEvent.press(await screen.findByTestId('flow-finish'));
    expect(screen.queryByText(copy.rating.prompt)).toBeNull();
    expect(useDrillStore.getState().askSkipped[Object.keys(useDrillStore.getState().drills)[0]]).toBe(true);
  });

  it('shows the rule recap after a rule’s third drill', async () => {
    jest.setSystemTime(new Date(2026, 10, 3, 20, 0));
    const ids = answerDays(3);
    useDrillStore.getState().rate(ids[1], 5);
    useDrillStore.getState().saveReport(ids[2], 'Shipped before noon.');
    await renderToday();
    expect(await screen.findByTestId('rule-recap')).toBeTruthy();
    expect(screen.getByText(copy.recap.headline(1))).toBeTruthy();
    expect(screen.getByText(copy.recap.tally(3, 0))).toBeTruthy();
    expect(screen.getByText(copy.recap.hardest('Brutal'))).toBeTruthy();
    expect(screen.getByText(copy.recap.next(2, 'Tell the Brutal Truth Fast'))).toBeTruthy();
    expect(router.push).not.toHaveBeenCalledWith(expect.stringContaining('recap'));
  });

  it('brings back a note from at least a week ago', async () => {
    jest.setSystemTime(new Date(2026, 10, 9, 20, 0));
    const ids = answerDays(9);
    useDrillStore.setState(() => ({
      journal: {
        j1: { id: 'j1', drillDayId: ids[0], body: 'The old me.', createdAt: '2026-11-01T20:00:00Z', updatedAt: 'u', dirty: false, deleted: false },
      },
    }));
    await renderToday();
    expect(await screen.findByTestId('look-back')).toBeTruthy();
    expect(screen.getByText(copy.lookBack.label(1))).toBeTruthy();
    expect(screen.getByText('The old me.')).toBeTruthy();
    expect(useDrillStore.getState().lookBack).toEqual({ on: '2026-11-09', journalId: 'j1' });
  });
});

describe('recap and trend logic', () => {
  beforeEach(() => useDrillStore.getState().reset());

  it('builds a recap only once all three drills are answered', () => {
    const ids = answerDays(2);
    expect(ruleRecap(useDrillStore.getState(), 1)).toBeUndefined();
    const id3 = useDrillStore.getState().openToday('2026-11-03')!;
    useDrillStore.getState().answer(id3, 'dodged', 'daily');
    expect(ruleRecap(useDrillStore.getState(), 1)).toMatchObject({ done: 2, dodged: 1, next: 2 });
    expect(ids).toHaveLength(2);
  });

  it('compares the hardest early drill with the latest daily drill', () => {
    const ids = answerDays(3);
    const st = useDrillStore.getState();
    st.rate(ids[1], 5);
    st.rate(ids[2], 2);
    expect(effortTrend(useDrillStore.getState(), 1)).toEqual({ ruleId: 1, first: 5, firstDay: 2, last: 2 });
    expect(effortTrend(useDrillStore.getState(), 2)).toBeUndefined();
  });
});
