import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { askMarkCopy as copy } from '@copy/askmark';
import { useDrillStore } from '@/features/drill/store';

import { AskMarkRequestError, askMark } from '../api';
import { AskMarkScreen } from '../askmark-screen';
import { askMarkContext, drillStarter } from '../context';
import { useAskMarkStore } from '../store';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 1600 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const reply = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: async () => body } as Response);

describe('Ask Mark context', () => {
  beforeEach(() => useDrillStore.getState().reset());

  it('sends nothing before Day 1 or when sharing is off', () => {
    expect(askMarkContext(useDrillStore.getState(), '2026-11-10', true)).toBeNull();
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.openToday('2026-11-10');
    expect(askMarkContext(useDrillStore.getState(), '2026-11-10', false)).toBeNull();
  });

  it('describes the open drill, and how it went once answered', () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    const id = s.openToday('2026-11-10')!;
    expect(askMarkContext(useDrillStore.getState(), '2026-11-10', true)).toEqual({
      phase: 'spine',
      day: 1,
      rule: 1,
      ruleTitle: 'Move Before You’re Ready',
      tier: 'five_minute',
      drill: 'Write the smallest visible step you can take in 5 minutes. Do it now.',
      status: 'pending',
    });
    useDrillStore.getState().answer(id, 'dodged', 'five_minute');
    useDrillStore.getState().setDodgeReason(id, 'fear');
    const ctx = askMarkContext(useDrillStore.getState(), '2026-11-10', true)!;
    expect(ctx).toMatchObject({ status: 'dodged', dodgeReason: 'fear' });
    expect(drillStarter(ctx, false)).toBe('dodged');
  });

  it('never includes the journal', () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    const id = s.openToday('2026-11-10')!;
    useDrillStore.getState().answer(id, 'done', 'five_minute');
    useDrillStore.getState().saveReport(id, 'Private note.');
    expect(JSON.stringify(askMarkContext(useDrillStore.getState(), '2026-11-10', true))).not.toContain('Private note');
  });
});

describe('Ask Mark API', () => {
  it('maps failures to offline / busy / failed', async () => {
    const down = jest.fn(() => Promise.reject(new Error('net'))) as unknown as typeof fetch;
    await expect(askMark([{ role: 'user', content: 'hi' }], { fetchImpl: down })).rejects.toEqual(new AskMarkRequestError('offline'));
    const busy = jest.fn(() => reply({ error: 'x' }, 429)) as unknown as typeof fetch;
    await expect(askMark([{ role: 'user', content: 'hi' }], { fetchImpl: busy })).rejects.toMatchObject({ kind: 'busy' });
    const bad = jest.fn(() => reply({}, 500)) as unknown as typeof fetch;
    await expect(askMark([{ role: 'user', content: 'hi' }], { fetchImpl: bad })).rejects.toMatchObject({ kind: 'failed' });
  });

  it('only sends context when there is some', async () => {
    const f = jest.fn((_u: string, _i: RequestInit) => reply({ message: 'ok', conversationId: 'c1' }));
    await askMark([{ role: 'user', content: 'hi' }], { fetchImpl: f as unknown as typeof fetch });
    expect(JSON.parse(f.mock.calls[0][1].body as string)).not.toHaveProperty('context');
  });
});

describe('Ask Mark screen', () => {
  let fetchMock: jest.Mock<(u: string, i: RequestInit) => Promise<Response>>;
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 9, 0) });
    useDrillStore.getState().reset();
    useAskMarkStore.getState().reset();
    fetchMock = jest.fn((_u: string, _i: RequestInit) => reply({ message: 'Do the **small** thing.\n\nYour move: start.', conversationId: 'conv_1' }));
    (globalThis as { fetch: unknown }).fetch = fetchMock;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  const renderAsk = () =>
    render(
      <SafeAreaProvider initialMetrics={metrics}>
        <AskMarkScreen />
      </SafeAreaProvider>,
    );

  it('shows the welcome, three starters and the AI note', async () => {
    await renderAsk();
    expect(screen.getByText(copy.welcome.title)).toBeTruthy();
    expect(screen.getByTestId('askmark-starter-2')).toBeTruthy();
    expect(screen.queryByTestId('askmark-starter-3')).toBeNull();
    expect(screen.getByText(copy.disclaimer)).toBeTruthy();
    expect(screen.getByText(copy.crisis)).toBeTruthy();
  });

  it('asks, shows the answer, and sends where the reader is', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.openToday('2026-11-10');
    await renderAsk();
    expect(screen.getByText(copy.knows(1, 1))).toBeTruthy();
    // The drill starter leads.
    expect(screen.getByText(copy.drillStarters.today)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('askmark-input'), 'Where do I start?');
    await fireEvent.press(screen.getByTestId('askmark-send'));
    await waitFor(() => expect(screen.getByText('Your move: start.')).toBeTruthy());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages).toEqual([{ role: 'user', content: 'Where do I start?' }]);
    expect(body.context).toMatchObject({ phase: 'spine', day: 1, rule: 1 });
    expect(useAskMarkStore.getState().conversationId).toBe('conv_1');
    expect(screen.getByTestId('askmark-email')).toBeTruthy();
  });

  it('sends no progress when sharing is off', async () => {
    const s = useDrillStore.getState();
    s.start('2026-11-10', '07:00');
    s.openToday('2026-11-10');
    useAskMarkStore.getState().setShareProgress(false);
    await renderAsk();
    expect(screen.getByText(copy.knowsOff)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('askmark-starter-0'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).not.toHaveProperty('context');
  });

  it('says so when offline, and retries the same question', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('net')));
    await renderAsk();
    await fireEvent.press(screen.getByTestId('askmark-starter-0'));
    expect(await screen.findByText(copy.errors.offline)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('askmark-retry'));
    await waitFor(() => expect(screen.getByText('Your move: start.')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(useAskMarkStore.getState().messages.filter((m) => m.role === 'user')).toHaveLength(1);
  });
});
