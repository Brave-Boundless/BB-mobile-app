// What the group screen shows, worked out from a Thread. Pure, so it's tested.

import { groupsCopy as copy } from '@copy/groups';
import type { DrillTier } from '@/content';

import type { Group, Post, Thread } from './api';

export const GROUP_WEEKS = 3;
export const GROUP_MAX = 8;

export interface ThreadItem {
  post: Post;
  name: string;
  mine: boolean;
  held: boolean;
  respect: number;
  respectedByMe: boolean;
}

/** The days since a group started, as a week number 1–3 (clamped). */
export function weekOf(group: Pick<Group, 'startsOn'>, today: string): number {
  const days = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${group.startsOn}T00:00:00Z`)) / 86_400_000);
  return Math.min(GROUP_WEEKS, Math.max(1, Math.floor(days / 7) + 1));
}

/** Week 1 the five-minute drill, week 2 the uncomfortable one, week 3 the daily one. */
export function weekTier(week: number): DrillTier {
  return week <= 1 ? 'five_minute' : week === 2 ? 'uncomfortable' : 'daily';
}

export function isOpen(group: Pick<Group, 'closedAt' | 'closesOn'>, today: string): boolean {
  return !group.closedAt && today <= group.closesOn;
}

/** A name for every author: You, their group name, or Former member once they've left. */
export function nameFor(thread: Pick<Thread, 'members' | 'names'>, userId: string, me: string): string {
  if (userId === me) return copy.group.you;
  const seat = thread.members.find((m) => m.userId === userId);
  if (!seat || seat.leftAt) return copy.group.formerMember;
  return thread.names[userId] ?? copy.group.formerMember;
}

/**
 * The posts a reader sees: visible ones, plus their own held ones, minus
 * anything from someone they blocked or a post they reported. Hidden posts
 * never show (a moderator took them down).
 */
export function threadItems(thread: Thread, me: string): ThreadItem[] {
  const blocked = new Set(thread.blocked);
  const reported = new Set(thread.reportedPosts);
  return thread.posts
    .filter((p) => (p.status === 'visible' || (p.status === 'held' && p.authorId === me)) && !blocked.has(p.authorId) && !reported.has(p.id))
    .map((post) => {
      const who = thread.respect[post.id] ?? [];
      return {
        post,
        name: nameFor(thread, post.authorId, me),
        mine: post.authorId === me,
        held: post.status === 'held',
        respect: who.length,
        respectedByMe: who.includes(me),
      };
    });
}

/** People in the group now. */
export function memberCount(thread: Pick<Thread, 'members'>): number {
  return thread.members.filter((m) => !m.leftAt).length;
}

/** Muted until a time in the future? */
export function isMuted(mutedUntil: string | null, now = Date.now()): boolean {
  return !!mutedUntil && Date.parse(mutedUntil) > now;
}
