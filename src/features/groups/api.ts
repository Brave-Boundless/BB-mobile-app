// Community groups, pilot (step 11a). Every read and write goes to Supabase;
// RLS and the functions in 20261109230000_community_groups.sql decide what a
// reader may see and do. Nothing here is cached on the phone beyond the
// query cache: groups need a connection.

import type { RuleId } from '@/content';
import { getSupabase } from '@/lib/supabase';

export type ReportReason = 'abuse' | 'spam' | 'unsafe' | 'other';
export const REPORT_REASONS: readonly ReportReason[] = ['abuse', 'spam', 'unsafe', 'other'];

export interface Group {
  id: string;
  ruleId: RuleId;
  inviteCode: string;
  startsOn: string;
  closesOn: string;
  closedAt: string | null;
}

export interface Member {
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  removed: boolean;
  mutedUntil: string | null;
}

export interface Post {
  id: string;
  groupId: string;
  authorId: string;
  kind: 'post' | 'checkin';
  body: string;
  status: 'visible' | 'held' | 'hidden';
  flag: 'filter' | 'crisis' | null;
  createdAt: string;
}

export interface Mine {
  userId: string;
  isModerator: boolean;
  displayName: string | null;
  /** The reader's latest group, joined and not left; null if none. */
  group: Group | null;
  member: Member | null;
}

export interface Thread {
  group: Group;
  posts: Post[];
  members: Member[];
  /** user id → display name, for everyone with a post or a seat. */
  names: Record<string, string>;
  /** post id → user ids who gave respect. */
  respect: Record<string, string[]>;
  blocked: string[];
  reportedPosts: string[];
}

export interface Preview {
  groupId: string;
  ruleId: RuleId;
  members: number;
  startsOn: string;
  closesOn: string;
  isFull: boolean;
}

export type JoinError = 'bad_code' | 'full' | 'removed' | 'adult' | 'name' | 'failed';

/** A Postgres error raised by our functions (`raise exception 'full'`) → its code. */
export function joinErrorOf(e: unknown): JoinError {
  const message = typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
  for (const k of ['bad_code', 'full', 'removed', 'adult', 'name'] as const) if (message.includes(k)) return k;
  return 'failed';
}

const toGroup = (r: Record<string, unknown>): Group => ({
  id: r.id as string,
  ruleId: r.rule_id as RuleId,
  inviteCode: r.invite_code as string,
  startsOn: r.starts_on as string,
  closesOn: r.closes_on as string,
  closedAt: (r.closed_at as string | null) ?? null,
});

const toMember = (r: Record<string, unknown>): Member => ({
  userId: r.user_id as string,
  joinedAt: r.joined_at as string,
  leftAt: (r.left_at as string | null) ?? null,
  removed: Boolean(r.removed),
  mutedUntil: (r.muted_until as string | null) ?? null,
});

const toPost = (r: Record<string, unknown>): Post => ({
  id: r.id as string,
  groupId: r.group_id as string,
  authorId: r.author_id as string,
  kind: r.kind as Post['kind'],
  body: r.body as string,
  status: r.status as Post['status'],
  flag: (r.flag as Post['flag']) ?? null,
  createdAt: r.created_at as string,
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw res.error;
  return res.data;
}

async function myId(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('not_signed_in');
  return id;
}

export async function fetchMine(): Promise<Mine> {
  const db = getSupabase();
  const userId = await myId();
  const [mod, profile, members] = await Promise.all([
    db.rpc('is_moderator'),
    db.from('group_profiles').select('display_name').eq('user_id', userId).maybeSingle(),
    db.from('group_members').select('*, groups(*)').eq('user_id', userId).is('left_at', null).order('joined_at', { ascending: false }).limit(1),
  ]);
  const row = (check(members) as Record<string, unknown>[])[0];
  return {
    userId,
    isModerator: Boolean(check(mod)),
    displayName: (check(profile) as { display_name: string } | null)?.display_name ?? null,
    group: row ? toGroup(row.groups as Record<string, unknown>) : null,
    member: row ? toMember(row) : null,
  };
}

export async function fetchThread(groupId: string): Promise<Thread> {
  const db = getSupabase();
  const userId = await myId();
  const [group, posts, members, blocks, reports] = await Promise.all([
    db.from('groups').select('*').eq('id', groupId).single(),
    db.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: true }).limit(500),
    db.from('group_members').select('*').eq('group_id', groupId),
    db.from('blocks').select('blocked_id').eq('blocker_id', userId),
    db.from('reports').select('post_id').eq('reporter_id', userId).not('post_id', 'is', null),
  ]);
  const postRows = (check(posts) as Record<string, unknown>[]).map(toPost);
  const memberRows = (check(members) as Record<string, unknown>[]).map(toMember);
  const ids = [...new Set([...postRows.map((p) => p.authorId), ...memberRows.map((m) => m.userId)])];
  const postIds = postRows.map((p) => p.id);
  const [profiles, reactions] = await Promise.all([
    ids.length ? db.from('group_profiles').select('user_id, display_name').in('user_id', ids) : Promise.resolve({ data: [], error: null }),
    postIds.length ? db.from('post_reactions').select('post_id, user_id').in('post_id', postIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const names: Record<string, string> = {};
  for (const p of check(profiles) as { user_id: string; display_name: string }[]) names[p.user_id] = p.display_name;
  const respect: Record<string, string[]> = {};
  for (const r of check(reactions) as { post_id: string; user_id: string }[]) (respect[r.post_id] ??= []).push(r.user_id);
  return {
    group: toGroup(check(group) as Record<string, unknown>),
    posts: postRows,
    members: memberRows,
    names,
    respect,
    blocked: (check(blocks) as { blocked_id: string }[]).map((b) => b.blocked_id),
    reportedPosts: (check(reports) as { post_id: string }[]).map((r) => r.post_id),
  };
}

export async function previewGroup(code: string): Promise<Preview | null> {
  const rows = check(await getSupabase().rpc('preview_group', { code })) as Record<string, unknown>[] | null;
  const r = rows?.[0];
  if (!r) return null;
  return {
    groupId: r.group_id as string,
    ruleId: r.rule_id as RuleId,
    members: r.members as number,
    startsOn: r.starts_on as string,
    closesOn: r.closes_on as string,
    isFull: Boolean(r.is_full),
  };
}

export async function joinGroup(code: string, name: string, adult: boolean): Promise<string> {
  return check(await getSupabase().rpc('join_group', { code, name, adult })) as string;
}

export async function leaveGroup(groupId: string): Promise<void> {
  check(await getSupabase().rpc('leave_group', { gid: groupId }));
}

/** Posts; the server sets status and flag. A 'crisis' flag means: show the 988 screen. */
export async function createPost(groupId: string, body: string, kind: Post['kind'] = 'post'): Promise<Post> {
  const authorId = await myId();
  const row = check(
    await getSupabase().from('group_posts').insert({ group_id: groupId, author_id: authorId, body: body.trim(), kind }).select('*').single(),
  );
  return toPost(row as Record<string, unknown>);
}

export async function deletePost(postId: string): Promise<void> {
  check(await getSupabase().from('group_posts').delete().eq('id', postId));
}

export async function setRespect(postId: string, on: boolean): Promise<void> {
  const db = getSupabase();
  const userId = await myId();
  if (on) check(await db.from('post_reactions').upsert({ post_id: postId, user_id: userId }, { ignoreDuplicates: true }));
  else check(await db.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId));
}

export async function report(target: { postId?: string; userId?: string }, reason: ReportReason): Promise<void> {
  const reporterId = await myId();
  check(
    await getSupabase()
      .from('reports')
      .insert({ reporter_id: reporterId, post_id: target.postId ?? null, reported_user_id: target.userId ?? null, reason }),
  );
}

export async function block(userId: string, on: boolean): Promise<void> {
  const db = getSupabase();
  const me = await myId();
  if (on) check(await db.from('blocks').upsert({ blocker_id: me, blocked_id: userId }, { ignoreDuplicates: true }));
  else check(await db.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', userId));
}

export async function renameMe(displayName: string): Promise<void> {
  const me = await myId();
  check(await getSupabase().from('group_profiles').update({ display_name: displayName.trim() }).eq('user_id', me));
}

// ── Moderators ──────────────────────────────────────────────────────────

export interface ModGroup extends Group {
  members: number;
}

export interface QueueItem {
  key: string;
  post: Post | null;
  /** Open reports on this post, or on this person if there's no post. */
  reasons: ReportReason[];
  reportedUserId: string | null;
  reportIds: string[];
  urgent: boolean;
}

export interface ModView {
  groups: ModGroup[];
  queue: QueueItem[];
  names: Record<string, string>;
}

export async function fetchModeration(): Promise<ModView> {
  const db = getSupabase();
  const [groups, members, held, reports] = await Promise.all([
    db.from('groups').select('*').order('created_at', { ascending: false }),
    db.from('group_members').select('group_id, user_id, left_at'),
    db.from('group_posts').select('*').eq('status', 'held').order('created_at', { ascending: true }),
    db.from('reports').select('*, group_posts(*)').eq('status', 'open').order('created_at', { ascending: true }),
  ]);
  const memberRows = check(members) as { group_id: string; user_id: string; left_at: string | null }[];
  const counts: Record<string, number> = {};
  for (const m of memberRows) if (!m.left_at) counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;

  const items = new Map<string, QueueItem>();
  for (const p of (check(held) as Record<string, unknown>[]).map(toPost)) {
    items.set(p.id, { key: p.id, post: p, reasons: [], reportedUserId: p.authorId, reportIds: [], urgent: p.flag === 'crisis' });
  }
  for (const r of check(reports) as Record<string, unknown>[]) {
    const post = r.group_posts ? toPost(r.group_posts as Record<string, unknown>) : null;
    const key = post?.id ?? `user:${r.reported_user_id as string}`;
    const item = items.get(key) ?? { key, post, reasons: [], reportedUserId: post?.authorId ?? (r.reported_user_id as string), reportIds: [], urgent: false };
    item.reasons.push(r.reason as ReportReason);
    item.reportIds.push(r.id as string);
    if (r.reason === 'unsafe') item.urgent = true;
    items.set(key, item);
  }
  const queue = [...items.values()].sort((a, b) => Number(b.urgent) - Number(a.urgent));

  const ids = [...new Set([...memberRows.map((m) => m.user_id), ...queue.map((q) => q.reportedUserId).filter((x): x is string => !!x)])];
  const names: Record<string, string> = {};
  if (ids.length) {
    const profiles = check(await db.from('group_profiles').select('user_id, display_name').in('user_id', ids)) as { user_id: string; display_name: string }[];
    for (const p of profiles) names[p.user_id] = p.display_name;
  }
  return {
    groups: (check(groups) as Record<string, unknown>[]).map((g) => ({ ...toGroup(g), members: counts[g.id as string] ?? 0 })),
    queue,
    names,
  };
}

export async function moderatePost(postId: string, show: boolean): Promise<void> {
  check(await getSupabase().rpc('moderate_post', { pid: postId, show }));
}

export async function moderateMember(groupId: string, userId: string, action: 'mute' | 'remove'): Promise<void> {
  check(await getSupabase().rpc('moderate_member', { gid: groupId, uid: userId, action }));
}

export async function resolveReports(ids: string[]): Promise<void> {
  if (!ids.length) return;
  check(await getSupabase().from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).in('id', ids));
}

export async function createGroup(ruleId: RuleId, startsOn: string): Promise<string> {
  return check(await getSupabase().rpc('create_group', { rule: ruleId, starts: startsOn })) as string;
}

export async function closeGroup(groupId: string): Promise<void> {
  check(await getSupabase().rpc('close_group', { gid: groupId }));
}

/** For "Export my data": your group name, your groups and your posts. Null if you never joined. */
export async function fetchMyCommunity(): Promise<{
  groupName: string;
  groups: { rule: number; startsOn: string; joinedAt: string; leftAt: string | null }[];
  posts: { rule: number | null; kind: string; status: string; writtenAt: string; body: string }[];
} | null> {
  const db = getSupabase();
  const me = await myId();
  const profile = check(await db.from('group_profiles').select('display_name').eq('user_id', me).maybeSingle()) as { display_name: string } | null;
  if (!profile) return null;
  const [members, posts] = await Promise.all([
    db.from('group_members').select('joined_at, left_at, groups(rule_id, starts_on)').eq('user_id', me),
    db.from('group_posts').select('kind, status, body, created_at, groups(rule_id)').eq('author_id', me).order('created_at'),
  ]);
  type G = { rule_id: number; starts_on?: string } | null;
  return {
    groupName: profile.display_name,
    groups: (check(members) as unknown as { joined_at: string; left_at: string | null; groups: G }[]).map((m) => ({
      rule: m.groups?.rule_id ?? 0,
      startsOn: m.groups?.starts_on ?? '',
      joinedAt: m.joined_at,
      leftAt: m.left_at,
    })),
    posts: (check(posts) as unknown as { kind: string; status: string; body: string; created_at: string; groups: G }[]).map((p) => ({
      rule: p.groups?.rule_id ?? null,
      kind: p.kind,
      status: p.status,
      writtenAt: p.created_at,
      body: p.body,
    })),
  };
}
