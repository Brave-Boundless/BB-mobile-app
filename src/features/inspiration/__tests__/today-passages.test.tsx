import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { inspirationCopy as copy } from '@copy/inspiration';
import { todayCopy } from '@copy/today';
import { useDrillStore } from '@/features/drill/store';
import { TodayScreen } from '@/features/drill/today-screen';

import { eveningPassage, morningPassage } from '../daily';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2400 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const renderToday = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

/** Redesign step 1: the morning passage moved from under the drill to the second screen after answering. */
async function toPassageScreen() {
  await renderToday();
  await fireEvent.press(await screen.findByLabelText(todayCopy.drill.a11y.did));
  await fireEvent.press(await screen.findByTestId('flow-next'));
}

describe('passages on Today', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 8, 0) });
    useDrillStore.getState().reset();
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.markNotificationsAsked();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows this morning’s passage after answering, verbatim', async () => {
    await toPassageScreen();
    const expected = morningPassage({ drills: {} }, '2026-11-10', 1, 1)!.passage;
    expect(await screen.findByTestId('morning-passage')).toBeTruthy();
    expect(screen.getByText(copy.morning)).toBeTruthy();
    expect(screen.getByText(expected.text)).toBeTruthy();
    expect(screen.getByText(copy.source(1, 'Burn the Map'))).toBeTruthy();
  });

  it('shows the evening passage once the note is saved', async () => {
    await renderToday();
    await fireEvent.press(await screen.findByLabelText(todayCopy.drill.a11y.did));
    expect(screen.queryByTestId('evening-passage')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('evening-input'), 'Small step, done.');
    await fireEvent.press(screen.getByTestId('flow-next'));
    await fireEvent.press(await screen.findByTestId('flow-finish'));
    expect(await screen.findByTestId('evening-passage')).toBeTruthy();
    expect(screen.getByText(eveningPassage(1, 1)!.text)).toBeTruthy();
  });

  it('saves and unsaves a passage', async () => {
    await toPassageScreen();
    const id = morningPassage({ drills: {} }, '2026-11-10', 1, 1)!.passage.id;
    await fireEvent.press(await screen.findByTestId('morning-passage-save'));
    expect(useDrillStore.getState().savedPassages[id]).toBeTruthy();
    expect(screen.getByText(copy.saved)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('morning-passage-save'));
    expect(useDrillStore.getState().savedPassages[id]).toBeUndefined();
  });

  it('shares the passage as a 1080 x 1920 image with the text alongside (iOS)', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await toPassageScreen();
    await fireEvent.press(await screen.findByTestId('morning-passage-share'));
    await act(async () => {});
    // Nothing is captured until the card has been laid out.
    expect(captureRef).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('share-card-host', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 640 } } });
    await waitFor(() => expect(captureRef).toHaveBeenCalled());
    expect(jest.mocked(captureRef).mock.calls[0][1]).toMatchObject({ format: 'png', width: 1080, height: 1920, useRenderInContext: true });
    const text = morningPassage({ drills: {} }, '2026-11-10', 1, 1)!.passage.text;
    await waitFor(() => expect(share).toHaveBeenCalledWith({ url: 'file:///tmp/share-card.png', message: copy.share.message(text) }));
    expect(screen.queryByText(copy.share.failed)).toBeNull();
  });

  it('shares the text when the image cannot be made', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(captureRef).mockRejectedValueOnce(new Error('drawViewHierarchyInRect was not successful'));
    await toPassageScreen();
    await fireEvent.press(await screen.findByTestId('morning-passage-share'));
    await fireEvent(await screen.findByTestId('share-card-host', { includeHiddenElements: true }), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 640 } } });
    const text = morningPassage({ drills: {} }, '2026-11-10', 1, 1)!.passage.text;
    await waitFor(() => expect(share).toHaveBeenCalledWith({ message: copy.share.message(text) }));
    expect(screen.queryByText(copy.share.failed)).toBeNull();
    warn.mockRestore();
  });
});
