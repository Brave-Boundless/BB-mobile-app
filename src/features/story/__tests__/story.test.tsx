import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { storyCopy as copy } from '@copy/story';

import { KIT_NEWSLETTER_FORM, KIT_STORY_FORM, StoryRequestError, checkStory, submitStory } from '../kit';
import { StoryScreen } from '../story-screen';
import { emptyStory, useStoryStore } from '../store';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 3000 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const ok = () => Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 'success' }) } as Response);
const full = { name: 'Sam', email: 'sam@example.com', kind: 'inIt' as const, story: 'Still in it.', newsletter: false };

describe('Kit submission', () => {
  it('posts the story fields to the story form, like the website', async () => {
    const f = jest.fn((_u: string, _i: RequestInit) => ok());
    await submitStory(full, f as unknown as typeof fetch);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe(`https://app.kit.com/forms/${KIT_STORY_FORM}/subscriptions`);
    const body = new URLSearchParams(f.mock.calls[0][1].body as string);
    expect(Object.fromEntries(body)).toEqual({
      email_address: 'sam@example.com',
      'fields[first_name]': 'Sam',
      'fields[which_describes_you]': 'In it right now',
      'fields[story]': 'Still in it.',
    });
  });

  it('subscribes to the newsletter only when ticked, after the story', async () => {
    const f = jest.fn((_u: string, _i: RequestInit) => ok());
    await submitStory({ ...full, newsletter: true }, f as unknown as typeof fetch);
    expect(f.mock.calls.map((c) => c[0])).toEqual([
      `https://app.kit.com/forms/${KIT_STORY_FORM}/subscriptions`,
      `https://app.kit.com/forms/${KIT_NEWSLETTER_FORM}/subscriptions`,
    ]);
    expect(Object.fromEntries(new URLSearchParams(f.mock.calls[1][1].body as string))).toEqual({
      email_address: 'sam@example.com',
      'fields[first_name]': 'Sam',
    });
  });

  it('reports offline and failed', async () => {
    const down = jest.fn(() => Promise.reject(new Error('net'))) as unknown as typeof fetch;
    await expect(submitStory(full, down)).rejects.toEqual(new StoryRequestError('offline'));
    const bad = jest.fn(() => Promise.resolve({ ok: false, status: 422 } as Response)) as unknown as typeof fetch;
    await expect(submitStory(full, bad)).rejects.toMatchObject({ kind: 'failed' });
  });

  it('needs a name, a valid email and a story', () => {
    expect(checkStory({ ...full, name: ' ' })).toBe('missing');
    expect(checkStory({ ...full, email: 'nope' })).toBe('missing');
    expect(checkStory({ ...full, story: '  ' })).toBe('empty');
    expect(checkStory(full)).toBeNull();
  });
});

describe('Share Your Story screen', () => {
  let fetchMock: jest.Mock<(u: string, i: RequestInit) => Promise<Response>>;
  beforeEach(() => {
    useStoryStore.setState({ draft: emptyStory });
    fetchMock = jest.fn((_u: string, _i: RequestInit) => ok());
    (globalThis as { fetch: unknown }).fetch = fetchMock;
  });

  const renderIt = () =>
    render(
      <SafeAreaProvider initialMetrics={metrics}>
        <StoryScreen />
      </SafeAreaProvider>,
    );

  it('shows the website’s wording, the 988 line and an unticked newsletter box', async () => {
    await renderIt();
    expect(screen.getByText(copy.intro.madeIt.title)).toBeTruthy();
    expect(screen.getByText(copy.form.title)).toBeTruthy();
    expect(screen.getByText(copy.privacy.crisis)).toBeTruthy();
    expect(screen.getByTestId('story-newsletter').props.value).toBe(false);
  });

  it('asks for what’s missing, then sends and keeps name and email for next time', async () => {
    await renderIt();
    await fireEvent.press(screen.getByTestId('story-submit'));
    expect(screen.getByText(copy.errors.missing)).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('story-name'), 'Sam');
    await fireEvent.changeText(screen.getByTestId('story-email'), 'sam@example.com');
    await fireEvent.press(screen.getByTestId('story-submit'));
    expect(screen.getByText(copy.errors.empty)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('story-kind-made'));
    await fireEvent.changeText(screen.getByTestId('story-text'), 'I got out.');
    await fireEvent.press(screen.getByTestId('story-submit'));
    await waitFor(() => expect(screen.getByTestId('story-sent')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useStoryStore.getState().draft).toEqual({ ...emptyStory, name: 'Sam', email: 'sam@example.com' });
  });

  it('keeps the draft when offline', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('net')));
    useStoryStore.setState({ draft: full });
    await renderIt();
    await fireEvent.press(screen.getByTestId('story-submit'));
    expect(await screen.findByText(copy.errors.offline)).toBeTruthy();
    expect(useStoryStore.getState().draft.story).toBe('Still in it.');
  });
});
