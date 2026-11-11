import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { groupsCopy as copy } from '@copy/groups';

import * as api from '../api';
import { GroupsPane } from '../groups-pane';

let mockSession: { user: { id: string; email: string } } | null = null;
jest.mock('@/features/account/auth', () => ({ useSession: () => mockSession }));
jest.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, getSupabase: jest.fn() }));
// These tests cover groups as built; the coming-soon screen (groups off) is in coming-soon.test.tsx.
jest.mock('@/lib/features', () => ({ features: { askMark: true, requireAccounts: false, groups: true } }));
jest.mock('../api', () => {
  const actual = jest.requireActual<typeof import('../api')>('../api');
  return {
    ...actual,
    fetchMine: jest.fn(),
    fetchThread: jest.fn(),
    previewGroup: jest.fn(),
    joinGroup: jest.fn(),
    createPost: jest.fn(),
    report: jest.fn(),
    setRespect: jest.fn(),
    block: jest.fn(),
    leaveGroup: jest.fn(),
    deletePost: jest.fn(),
  };
});
const m = jest.mocked(api);

const metrics = { frame: { x: 0, y: 0, width: 390, height: 2400 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const show = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } })}>
      <SafeAreaProvider initialMetrics={metrics}>
        <GroupsPane />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );

const group = { id: 'g1', ruleId: 5 as const, inviteCode: 'FORGE-7K2Q', startsOn: '2026-11-09', closesOn: '2099-11-30', closedAt: null };
const me = { userId: 'me', isModerator: false, displayName: 'Mark', group: null, member: null };
const seat = (userId: string) => ({ userId, joinedAt: '2026-11-09T10:00:00Z', leftAt: null, removed: false, mutedUntil: null });
const annPost = { id: 'p1', groupId: 'g1', authorId: 'ann', kind: 'post' as const, body: 'Cold shower. Hated it.', status: 'visible' as const, flag: null, createdAt: '2026-11-09T12:00:00Z' };

describe('Groups', () => {
  beforeEach(() => {
    mockSession = { user: { id: 'me', email: 'reader@example.com' } };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('asks a signed-out reader to sign in', async () => {
    mockSession = null;
    await show();
    expect(screen.getByText(copy.none.signIn)).toBeTruthy();
    expect(screen.getByTestId('groups-sign-in')).toBeTruthy();
    expect(m.fetchMine).not.toHaveBeenCalled();
  });

  it('says so when a code matches no open group', async () => {
    m.fetchMine.mockResolvedValue(me);
    m.previewGroup.mockResolvedValue(null);
    await show();
    await fireEvent.changeText(await screen.findByTestId('groups-code'), 'fire-zzzz');
    await fireEvent.press(screen.getByTestId('groups-code-join'));
    expect(await screen.findByText(copy.none.badCode)).toBeTruthy();
    expect(m.previewGroup).toHaveBeenCalledWith('FIRE-ZZZZ');
  });

  it('joins with a code: rule, name, 18+ and the rules before the button works', async () => {
    m.fetchMine.mockResolvedValue(me);
    m.previewGroup.mockResolvedValue({ groupId: 'g1', ruleId: 5, members: 3, startsOn: '2026-11-09', closesOn: '2026-11-30', isFull: false });
    m.joinGroup.mockResolvedValue('g1');
    await show();
    await fireEvent.changeText(await screen.findByTestId('groups-code'), 'FORGE-7K2Q');
    await fireEvent.press(screen.getByTestId('groups-code-join'));
    expect(await screen.findByText('Rule 5 · Optimize the Machine')).toBeTruthy();
    expect(screen.getByText(copy.join.meta(3, 3))).toBeTruthy();
    for (const r of copy.join.rules) expect(screen.getByText(r)).toBeTruthy();
    expect(screen.getByTestId('groups-name').props.value).toBe('Mark');

    await fireEvent.press(screen.getByTestId('groups-accept'));
    expect(m.joinGroup).not.toHaveBeenCalled(); // 18+ not ticked
    await fireEvent.press(screen.getByTestId('groups-adult'));
    await fireEvent.press(screen.getByTestId('groups-accept'));
    await waitFor(() => expect(m.joinGroup).toHaveBeenCalledWith('FORGE-7K2Q', 'Mark', true));
  });

  describe('in a group', () => {
    beforeEach(() => {
      m.fetchMine.mockResolvedValue({ ...me, group, member: seat('me') });
      m.fetchThread.mockResolvedValue({
        group,
        posts: [annPost],
        members: [seat('me'), seat('ann')],
        names: { me: 'Mark', ann: 'Ann' },
        respect: {},
        blocked: [],
        reportedPosts: [],
      });
    });

    it('shows the rule, this week’s drill and the posts', async () => {
      await show();
      expect(await screen.findByText('Cold shower. Hated it.')).toBeTruthy();
      expect(screen.getByText('Ann')).toBeTruthy();
      expect(screen.getByText('Rule 5 · Optimize the Machine')).toBeTruthy();
      expect(screen.getByText(/This week · /)).toBeTruthy();
    });

    it('shows the 988 screen when a post is held as a crisis', async () => {
      m.createPost.mockResolvedValue({ ...annPost, id: 'p2', authorId: 'me', body: 'help', status: 'held', flag: 'crisis' });
      const call = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      await show();
      await fireEvent.changeText(await screen.findByTestId('group-composer'), 'I want to die');
      await fireEvent.press(screen.getByTestId('group-post'));
      expect(await screen.findByTestId('group-crisis')).toBeTruthy();
      expect(screen.getByText(copy.crisis.title)).toBeTruthy();
      await fireEvent.press(screen.getByTestId('group-crisis-call'));
      expect(call).toHaveBeenCalledWith('tel:988');
      expect(m.createPost).toHaveBeenCalledWith('g1', 'I want to die', 'post');
    });

    it('reports a post with a reason', async () => {
      m.report.mockResolvedValue(undefined);
      await show();
      await fireEvent.press(await screen.findByTestId('more-p1'));
      await fireEvent.press(screen.getByTestId('report-p1'));
      await fireEvent.press(screen.getByTestId('report-reason-p1-abuse'));
      await fireEvent.press(screen.getByTestId('report-send-p1'));
      await waitFor(() => expect(m.report).toHaveBeenCalledWith({ postId: 'p1' }, 'abuse'));
      expect(await screen.findByText(copy.report.sent)).toBeTruthy();
    });

    it('gives respect', async () => {
      m.setRespect.mockResolvedValue(undefined);
      await show();
      await fireEvent.press(await screen.findByTestId('respect-p1'));
      expect(m.setRespect).toHaveBeenCalledWith('p1', true);
    });
  });
});
