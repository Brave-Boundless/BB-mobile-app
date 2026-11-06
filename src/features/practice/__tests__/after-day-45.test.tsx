import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { todayCopy } from '@copy/today';
import { wrapupCopy as copy } from '@copy/wrapup';
import { addDays, toLocalDate } from '@/features/drill/local-date';
import { planMorningNotifications } from '@/features/drill/notification-plan';
import { initialDrillData, mergeServerRows, useDrillStore } from '@/features/drill/store';
import { TodayScreen } from '@/features/drill/today-screen';

const START = '2026-10-31';
const metrics = { frame: { x: 0, y: 0, width: 390, height: 4000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

/** Plays all 45 days, dodging the given days. Returns the date of day 45. */
function finishSpine(dodge: number[]): string {
  const s = () => useDrillStore.getState();
  s().start(START, '07:00');
  s().markNotificationsAsked();
  let date = START;
  for (let day = 1; day <= 45; day++) {
    s().answer(s().openToday(date)!, dodge.includes(day) ? 'dodged' : 'done', 'five_minute');
    if (day < 45) date = addDays(date, 1);
  }
  return date;
}

describe('After Day 45 on Today', () => {
  let d1: string;
  beforeEach(() => {
    useDrillStore.getState().reset();
    const d45 = finishSpine([13, 14, 15, 4]);
    d1 = addDays(d45, 1);
    const [y, m, d] = d1.split('-').map(Number);
    jest.useFakeTimers({ now: new Date(y, m - 1, d, 8) });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('wrap-up → restart + daily set → answer → note', async () => {
    await show();
    expect(screen.getByText(copy.wrapup.headline)).toBeTruthy();
    expect(screen.getByText(copy.wrapup.tally(41, 4))).toBeTruthy();
    // Dodge pattern: rule 5 (3 dodges) then rule 2 (1)
    expect(screen.getByText(copy.wrapup.dodgeRow(3, 3))).toBeTruthy();
    expect(screen.getByText(copy.wrapup.dodgeRow(1, 3))).toBeTruthy();

    // Nothing picked
    await fireEvent.press(screen.getByText(copy.wrapup.cta));
    expect(screen.getByText(copy.wrapup.needOne)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('restart-toggle'));
    await fireEvent.press(screen.getByTestId('keep-7'));
    await fireEvent.press(screen.getByTestId('keep-1'));
    expect(screen.getByLabelText(copy.wrapup.keepA11y('Pain Is Tuition; Don’t Drop Out', true))).toBeTruthy();
    await fireEvent.press(screen.getByText(copy.wrapup.cta));

    expect(useDrillStore.getState().practice).toMatchObject({ dailySet: [1, 7], restartRules: [5, 2], startedOn: d1 });
    expect(await screen.findByText(copy.practice.dayLabel(46))).toBeTruthy();
    expect(screen.getByText(copy.practice.restartLabel(1, 2))).toBeTruthy();
    // Restart: rule 5's five-minute drill; daily set: rules 1 and 7 daily drills
    expect(screen.getByText('Water + walk: 16 oz, 5-min brisk loop.')).toBeTruthy();
    expect(screen.getByText('“MVP the day” — ship one imperfect deliverable before noon.')).toBeTruthy();
    expect(screen.getByText('Log one “tuition > tactic” conversion.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(`${todayCopy.drill.a11y.did} Optimize the Machine.`));
    expect(screen.getByText('Energy is earned.')).toBeTruthy();
    await fireEvent.press(screen.getAllByText(copy.practice.addNote)[0]);
    expect(screen.getByText(todayCopy.evening.promptDone)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(`${todayCopy.drill.a11y.dodged} Move Before You’re Ready.`));
    await fireEvent.press(screen.getByLabelText(`${todayCopy.drill.a11y.did} Pain Is Tuition; Don’t Drop Out.`));
    expect(screen.getByText(copy.practice.allAnswered)).toBeTruthy();
  });

  it('no dodges: says so and offers no restart; change daily set later', async () => {
    useDrillStore.getState().reset();
    const d45 = finishSpine([]);
    await show();
    expect(screen.getByText(copy.wrapup.noDodges)).toBeTruthy();
    expect(screen.queryByTestId('restart-toggle')).toBeNull();
    await fireEvent.press(screen.getByTestId('keep-3'));
    await fireEvent.press(screen.getByText(copy.wrapup.cta));
    expect(await screen.findByText(copy.practice.dailySet)).toBeTruthy();

    await fireEvent.press(screen.getByText(copy.practice.change));
    expect(screen.queryByText(copy.wrapup.headline)).toBeNull(); // edit mode: keep list only
    await fireEvent.press(screen.getByTestId('keep-9'));
    await fireEvent.press(screen.getByText(copy.wrapup.cta));
    expect(useDrillStore.getState().practice?.dailySet).toEqual([3, 9]);
    expect(useDrillStore.getState().practice?.startedOn).toBe(addDays(d45, 1));
  });
});

describe('after Day 45: pushes and sign-in merge', () => {
  beforeEach(() => {
    useDrillStore.getState().reset();
  });

  it('pushes the restart rule while it runs, then rotates the daily set', () => {
    const d45 = finishSpine([13]);
    const d1 = addDays(d45, 1);
    useDrillStore.getState().setPractice({ dailySet: [1, 7], restartRules: [5], startedOn: d1 });
    const data = useDrillStore.getState();
    const [y, m, d] = d1.split('-').map(Number);
    const plan = planMorningNotifications(Object.values(data.drills), new Date(y, m - 1, d, 6), d1, '07:00', data);
    expect(plan).toHaveLength(7);
    expect(plan.every((n) => n.title === 'Optimize the Machine' && n.body === 'Energy is earned.')).toBe(true);

    useDrillStore.getState().setPractice({ dailySet: [1, 7], restartRules: [], startedOn: d1 });
    const data2 = useDrillStore.getState();
    const titles = new Set(
      planMorningNotifications(Object.values(data2.drills), new Date(y, m - 1, d, 6), d1, '07:00', data2).map((n) => n.title),
    );
    expect(titles).toEqual(new Set(['Move Before You’re Ready', 'Pain Is Tuition; Don’t Drop Out']));
    expect(toLocalDate(new Date(y, m - 1, d))).toBe(d1);
  });

  it('sign-in merge: server choices fill an empty phone; unsent local choices win', () => {
    const server = { drills: [], journal: [], practice: { dailySet: [2], restartRules: [], startedOn: '2026-12-15' } } as never;
    expect(mergeServerRows(initialDrillData, server).practice).toEqual({ dailySet: [2], restartRules: [], startedOn: '2026-12-15' });
    const local = { ...initialDrillData, practice: { dailySet: [9], restartRules: [], startedOn: '2026-12-16' } as never, practiceDirty: true };
    expect(mergeServerRows(local, server).practice).toMatchObject({ dailySet: [9] });
  });
});
