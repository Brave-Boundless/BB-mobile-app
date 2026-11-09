import { describe, expect, it } from '@jest/globals';

import { groupsCopy as copy } from '@copy/groups';

import { joinErrorOf, type Thread } from '../api';
import { isMuted, isOpen, memberCount, nameFor, threadItems, weekOf, weekTier } from '../thread';

const group = { id: 'g', ruleId: 5 as const, inviteCode: 'FORGE-7K2Q', startsOn: '2026-11-09', closesOn: '2026-11-30', closedAt: null };
const seat = (userId: string, leftAt: string | null = null) => ({ userId, joinedAt: '2026-11-09T10:00:00Z', leftAt, removed: false, mutedUntil: null });
const post = (id: string, authorId: string, status: 'visible' | 'held' | 'hidden' = 'visible') => ({
  id,
  groupId: 'g',
  authorId,
  kind: 'post' as const,
  body: `post ${id}`,
  status,
  flag: null,
  createdAt: '2026-11-09T12:00:00Z',
});

const thread = (over: Partial<Thread> = {}): Thread => ({
  group,
  posts: [post('1', 'me'), post('2', 'ann'), post('3', 'ben'), post('4', 'me', 'held'), post('5', 'ann', 'held'), post('6', 'ann', 'hidden'), post('7', 'cat')],
  members: [seat('me'), seat('ann'), seat('ben'), seat('cat', '2026-11-10T00:00:00Z')],
  names: { me: 'Mark', ann: 'Ann', ben: 'Ben', cat: 'Cat' },
  respect: { '2': ['me', 'ben'] },
  blocked: [],
  reportedPosts: [],
  ...over,
});

describe('groups thread', () => {
  it('counts weeks from the start, 1 to 3', () => {
    expect(weekOf(group, '2026-11-09')).toBe(1);
    expect(weekOf(group, '2026-11-15')).toBe(1);
    expect(weekOf(group, '2026-11-16')).toBe(2);
    expect(weekOf(group, '2026-11-23')).toBe(3);
    expect(weekOf(group, '2026-12-20')).toBe(3);
    expect(weekOf(group, '2026-11-01')).toBe(1);
    expect([1, 2, 3].map(weekTier)).toEqual(['five_minute', 'uncomfortable', 'daily']);
  });

  it('is open until closed or past its last day', () => {
    expect(isOpen(group, '2026-11-30')).toBe(true);
    expect(isOpen(group, '2026-12-01')).toBe(false);
    expect(isOpen({ ...group, closedAt: '2026-11-10T00:00:00Z' }, '2026-11-11')).toBe(false);
  });

  it('names authors: You, their name, or Former member after leaving', () => {
    const t = thread();
    expect(nameFor(t, 'me', 'me')).toBe(copy.group.you);
    expect(nameFor(t, 'ann', 'me')).toBe('Ann');
    expect(nameFor(t, 'cat', 'me')).toBe(copy.group.formerMember);
    expect(nameFor(t, 'gone', 'me')).toBe(copy.group.formerMember);
  });

  it('shows visible posts and your own held ones, never hidden or others’ held', () => {
    const ids = threadItems(thread(), 'me').map((i) => i.post.id);
    expect(ids).toEqual(['1', '2', '3', '4', '7']);
    const mine = threadItems(thread(), 'me').find((i) => i.post.id === '4')!;
    expect(mine.held).toBe(true);
    expect(mine.mine).toBe(true);
  });

  it('drops blocked people and posts you reported', () => {
    const ids = threadItems(thread({ blocked: ['ann'], reportedPosts: ['3'] }), 'me').map((i) => i.post.id);
    expect(ids).toEqual(['1', '4', '7']);
  });

  it('counts respect and knows if you gave it', () => {
    const ann = threadItems(thread(), 'me').find((i) => i.post.id === '2')!;
    expect(ann.respect).toBe(2);
    expect(ann.respectedByMe).toBe(true);
  });

  it('counts current members only', () => {
    expect(memberCount(thread())).toBe(3);
  });

  it('knows a mute from an expired one', () => {
    const now = Date.parse('2026-11-10T12:00:00Z');
    expect(isMuted('2026-11-11T00:00:00Z', now)).toBe(true);
    expect(isMuted('2026-11-10T00:00:00Z', now)).toBe(false);
    expect(isMuted(null, now)).toBe(false);
  });

  it('maps server errors to join errors', () => {
    expect(joinErrorOf({ message: 'full' })).toBe('full');
    expect(joinErrorOf({ message: 'bad_code' })).toBe('bad_code');
    expect(joinErrorOf({ message: 'removed' })).toBe('removed');
    expect(joinErrorOf(new Error('network'))).toBe('failed');
  });
});
