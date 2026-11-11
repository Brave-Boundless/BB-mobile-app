import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { groupsCopy as copy } from '@copy/groups';
import { features } from '@/lib/features';
import { useStoryStore } from '@/features/story/store';

import * as api from '../api';
import { GroupsPane } from '../groups-pane';

let mockSession: { user: { id: string; email: string } } | null = null;
jest.mock('@/features/account/auth', () => ({ useSession: () => mockSession }));
jest.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, getSupabase: jest.fn() }));
jest.mock('../api', () => {
  const actual = jest.requireActual<typeof import('../api')>('../api');
  return { ...actual, fetchMine: jest.fn() };
});
const m = jest.mocked(api);

const metrics = { frame: { x: 0, y: 0, width: 390, height: 1600 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}>
      <SafeAreaProvider initialMetrics={metrics}>
        <GroupsPane />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

describe('Groups before they open', () => {
  let fetchMock: jest.Mock<typeof fetch>;
  beforeEach(() => {
    mockSession = null;
    useStoryStore.setState({ waitlisted: false });
    fetchMock = jest.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = fetchMock;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ships switched off', () => {
    expect(features.groups).toBe(false);
  });

  it('says groups are coming and signs the reader up to the Kit community form', async () => {
    await show();
    expect(screen.getByText(copy.soon.title)).toBeTruthy();
    expect(screen.queryByTestId('groups-code')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('groups-soon-email'), ' reader@example.com ');
    await fireEvent.press(screen.getByTestId('groups-soon-notify'));
    expect(await screen.findByText(copy.soon.done)).toBeTruthy();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://app.kit.com/forms/10173540/subscriptions');
    expect(init.body).toBe('email_address=reader%40example.com');
    expect(useStoryStore.getState().waitlisted).toBe(true);
  });

  it('fills in a signed-in reader’s email and checks it before sending', async () => {
    mockSession = { user: { id: 'u', email: 'mark@example.com' } };
    m.fetchMine.mockResolvedValue({ userId: 'u', isModerator: false, displayName: null, group: null, member: null });
    await show();
    expect(screen.getByTestId('groups-soon-email').props.value).toBe('mark@example.com');
    await fireEvent.changeText(screen.getByTestId('groups-soon-email'), 'not-an-email');
    await fireEvent.press(screen.getByTestId('groups-soon-notify'));
    expect(screen.getByText(copy.soon.badEmail)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('says so when offline, and keeps the form', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await show();
    await fireEvent.changeText(screen.getByTestId('groups-soon-email'), 'reader@example.com');
    await fireEvent.press(screen.getByTestId('groups-soon-notify'));
    expect(await screen.findByText(copy.soon.offline)).toBeTruthy();
    expect(useStoryStore.getState().waitlisted).toBe(false);
  });

  it('still shows a moderator their tools', async () => {
    mockSession = { user: { id: 'm', email: 'mod@example.com' } };
    m.fetchMine.mockResolvedValue({ userId: 'm', isModerator: true, displayName: null, group: null, member: null });
    await show();
    await waitFor(() => expect(screen.getByTestId('groups-moderation')).toBeTruthy());
  });
});
