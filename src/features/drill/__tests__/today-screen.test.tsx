import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { redesignCopy } from '@copy/redesign';
import { todayCopy as copy } from '@copy/today';

import { useDrillStore } from '../store';
import { TodayScreen } from '../today-screen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderToday = async () =>
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

describe('Today screen', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 8, 0) });
    useDrillStore.getState().reset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs first run → Day 1 → Did it → report-back', async () => {
    await renderToday();

    // First run
    expect(await screen.findByText(redesignCopy.welcome.headline)).toBeTruthy();
    expect(screen.getByLabelText(redesignCopy.welcome.gridA11y)).toBeTruthy();
    for (const line of redesignCopy.welcome.steps) expect(screen.getByText(line)).toBeTruthy();
    await fireEvent.press(screen.getByText(copy.start.cta));

    // Push ask: decline
    await fireEvent.press(await screen.findByText(copy.notifications.deny));

    // Day 1: rule 1, five-minute drill, verbatim from the card
    expect(await screen.findByLabelText('Drill 1 of 45 · Rule 1 · Drill 1 of 3')).toBeTruthy();
    expect(screen.getByText('Move Before You’re Ready')).toBeTruthy();
    expect(screen.getByText('Write the smallest visible step you can take in 5 minutes. Do it now.')).toBeTruthy();
    // No fallback on a five-minute day
    expect(screen.queryByText(copy.drill.fiveMinuteFallback)).toBeNull();

    // VoiceOver labels on both buttons
    expect(screen.getByLabelText(copy.drill.a11y.did)).toBeTruthy();
    expect(screen.getByLabelText(copy.drill.a11y.dodged)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(copy.drill.a11y.did));
    expect(await screen.findByText(copy.answered.done)).toBeTruthy();
    expect(screen.getByText('Action beats anxiety.')).toBeTruthy();
    expect(screen.getByText(copy.evening.promptDone)).toBeTruthy();

    // Four sentences is too long
    await fireEvent.changeText(screen.getByTestId('evening-input'), 'One. Two. Three. Four.');
    await fireEvent.press(screen.getByTestId('flow-next'));
    expect(screen.getByText(copy.evening.tooLong)).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('evening-input'), 'It cost me my excuse.');
    await fireEvent.press(screen.getByTestId('flow-next'));
    // Second screen: the passage and tomorrow, then back to a resting Today.
    expect(await screen.findByTestId('answer-flow-2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('flow-finish'));
    expect(await screen.findByText(copy.evening.saved)).toBeTruthy();
    expect(screen.getByText('It cost me my excuse.')).toBeTruthy();
  });

  it('dodging shows no lecture and asks what you learned', async () => {
    await renderToday();
    await fireEvent.press(await screen.findByText(copy.start.cta));
    await fireEvent.press(await screen.findByText(copy.notifications.deny));
    await fireEvent.press(await screen.findByLabelText(copy.drill.a11y.dodged));
    expect(await screen.findByText(copy.answered.dodged)).toBeTruthy();
    expect(screen.queryByText('Action beats anxiety.')).toBeNull();
    expect(screen.getByText(copy.evening.promptDodged)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('undo'));
    expect(await screen.findByLabelText('Drill 1 of 45 · Rule 1 · Drill 1 of 3')).toBeTruthy();
    expect(screen.getByLabelText(copy.drill.a11y.did)).toBeTruthy();
  });

  it('offers the five-minute fallback on day 2 and opens the FIRE milestone on day 12', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-01', '07:00');
    s.markNotificationsAsked();
    // Answer days 1-11 on earlier dates
    for (let d = 1; d <= 11; d++) {
      const id = s.openToday(`2026-10-${String(d + 10).padStart(2, '0')}`)!;
      useDrillStore.getState().answer(id, 'done', 'five_minute');
    }
    await renderToday();
    expect(await screen.findByLabelText('Drill 12 of 45 · Rule 4 · Drill 3 of 3')).toBeTruthy();
    expect(screen.getByText('Post-game yourself: 3 wins, 1 fix, 1 next rep.')).toBeTruthy();

    await fireEvent.press(screen.getByText(copy.drill.fiveMinuteFallback));
    expect(screen.getByText('Identify today’s one “game play” (conversation, pitch, set). Prep 3 bullets.')).toBeTruthy();
    await fireEvent.press(screen.getByText(copy.drill.backToFull));

    await act(async () => {
      await fireEvent.press(screen.getByLabelText(copy.drill.a11y.did));
    });
    expect(router.push).toHaveBeenCalledWith('/milestone/1');
  });
});
