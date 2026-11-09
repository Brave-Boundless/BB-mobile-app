import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { groupsCopy as copy } from '@copy/groups';
import { todayCopy } from '@copy/today';
import { Button } from '@/components/button';
import { Chips } from '@/components/chips';
import { confirmDestructive } from '@/components/confirm';
import { getRule } from '@/content';
import { useSession } from '@/features/account/auth';
import { useDrillStore } from '@/features/drill/store';
import { useToday } from '@/features/drill/use-today';
import { isSupabaseConfigured } from '@/lib/supabase';
import { palette } from '@/theme';
import { fadeIn } from '@/theme/motion';

import {
  REPORT_REASONS,
  block,
  createPost,
  deletePost,
  fetchMine,
  fetchThread,
  joinErrorOf,
  joinGroup,
  leaveGroup,
  previewGroup,
  report,
  setRespect,
  type Group,
  type JoinError,
  type Mine,
  type Preview,
  type ReportReason,
} from './api';
import { GROUP_WEEKS, isMuted, isOpen, memberCount, threadItems, weekOf, weekTier, type ThreadItem } from './thread';

const input = 'min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 py-3 font-sans text-base text-bone';

/** Community → Groups: sign in, join with a code, or the group itself. */
export function GroupsPane() {
  const session = useSession();
  const signedIn = isSupabaseConfigured && !!session;
  const mine = useQuery({ queryKey: ['groups', 'mine', session?.user.id], queryFn: fetchMine, enabled: signedIn });

  if (!signedIn) {
    return (
      <Pane>
        <Intro />
        <Text className="mt-6 font-medium text-base text-bone">{copy.none.signIn}</Text>
        <View className="mt-4">
          <Button label={copy.none.signInButton} onPress={() => router.push('/settings')} testID="groups-sign-in" />
        </View>
      </Pane>
    );
  }
  if (mine.isError) return <Offline onRetry={() => void mine.refetch()} />;
  if (!mine.data) return <Pane />;

  return (
    <>
      {mine.data.isModerator ? (
        <View className="px-6 pt-2">
          <Button variant="secondary" label={copy.moderator.open} onPress={() => router.push('/moderation')} testID="groups-moderation" />
        </View>
      ) : null}
      {mine.data.group ? <GroupThread group={mine.data.group} mine={mine.data} /> : <JoinFlow mine={mine.data} />}
    </>
  );
}

function Pane({ children }: { children?: React.ReactNode }) {
  return (
    <ScrollView contentContainerClassName="px-6 pb-16 pt-4" keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

function Intro() {
  return (
    <>
      <Text accessibilityRole="header" className="font-bold text-3xl uppercase text-bone">
        {copy.none.title}
      </Text>
      <Text className="mt-3 font-sans text-lg leading-7 text-bone">{copy.none.body}</Text>
      <Text className="mt-2 font-sans text-base text-ash">{copy.none.pilot}</Text>
    </>
  );
}

function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <Pane>
      <Text className="font-medium text-base text-bone" testID="groups-offline">
        {copy.none.offline}
      </Text>
      <View className="mt-4 items-start">
        <Button variant="text" label={copy.none.retry} onPress={onRetry} />
      </View>
    </Pane>
  );
}

// ── Joining ──────────────────────────────────────────────────────────────

function JoinFlow({ mine }: { mine: Mine }) {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<JoinError | null>(null);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState(mine.displayName ?? '');
  const [adult, setAdult] = useState(false);

  const look = async () => {
    setChecking(true);
    setError(null);
    try {
      const p = await previewGroup(code);
      if (!p) setError('bad_code');
      else if (p.isFull) setError('full');
      else setPreview(p);
    } catch {
      setError('failed');
    } finally {
      setChecking(false);
    }
  };

  const join = useMutation({
    mutationFn: () => joinGroup(code, name, adult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
    onError: (e) => setError(joinErrorOf(e)),
  });

  const errorText =
    error === 'full' ? copy.none.full : error === 'removed' ? copy.group.removed : error === 'failed' ? copy.none.offline : error ? copy.none.badCode : null;

  if (!preview) {
    return (
      <Pane>
        <Intro />
        <Text className="mt-8 font-medium text-base text-bone">{copy.none.codeLabel}</Text>
        <TextInput
          accessibilityLabel={copy.none.codeLabel}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder={copy.none.codePlaceholder}
          placeholderTextColor={palette.ash}
          autoCapitalize="characters"
          autoCorrect={false}
          className={`mt-2 ${input}`}
          testID="groups-code"
        />
        {errorText ? (
          <Text accessibilityRole="alert" className="mt-2 font-medium text-base text-ember-soft" testID="groups-code-error">
            {errorText}
          </Text>
        ) : null}
        <View className="mt-4">
          <Button label={copy.none.join} onPress={() => void look()} disabled={!code.trim() || checking} testID="groups-code-join" />
        </View>
      </Pane>
    );
  }

  const rule = getRule(preview.ruleId);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <Pane>
        <Text accessibilityRole="header" className="font-bold text-2xl text-bone">
          {copy.join.title(rule.number, rule.title)}
        </Text>
        <Text className="mt-1 font-medium text-base text-ash">{copy.join.meta(preview.members, GROUP_WEEKS)}</Text>

        <Text className="mt-8 font-medium text-base text-bone">{copy.join.nameLabel}</Text>
        <TextInput
          accessibilityLabel={copy.join.nameLabel}
          value={name}
          onChangeText={setName}
          maxLength={40}
          className={`mt-2 ${input}`}
          testID="groups-name"
        />
        <Text className="mt-1 font-sans text-sm text-ash">{copy.join.nameHint}</Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: adult }}
          onPress={() => setAdult((a) => !a)}
          testID="groups-adult"
          className="mt-6 min-h-12 flex-row items-center gap-3">
          <View className={`h-7 w-7 items-center justify-center border-2 ${adult ? 'border-ember bg-ember' : 'border-ash'}`}>
            {adult ? <Text className="font-bold text-base text-charcoal-950">✓</Text> : null}
          </View>
          <Text className="font-medium text-base text-bone">{copy.join.adult}</Text>
        </Pressable>

        <Text className="mt-8 font-medium text-sm uppercase tracking-widest text-ash">{copy.join.rulesTitle}</Text>
        <View className="mt-3 gap-3">
          {copy.join.rules.map((r, i) => (
            <View key={r} className="flex-row gap-3">
              <Text className="w-5 font-bold text-base text-ember-soft">{i + 1}</Text>
              <Text className="flex-1 font-sans text-base leading-6 text-bone">{r}</Text>
            </View>
          ))}
        </View>
        <Text className="mt-4 font-sans text-sm text-ash">{copy.join.termsNote}</Text>

        {errorText ? (
          <Text accessibilityRole="alert" className="mt-4 font-medium text-base text-ember-soft">
            {errorText}
          </Text>
        ) : null}
        <View className="mt-6">
          <Button
            label={copy.join.accept}
            onPress={() => join.mutate()}
            disabled={!name.trim() || !adult || join.isPending}
            testID="groups-accept"
          />
        </View>
      </Pane>
    </KeyboardAvoidingView>
  );
}

// ── The group ────────────────────────────────────────────────────────────

export function GroupThread({ group, mine, readOnly }: { group: Group; mine: Pick<Mine, 'userId' | 'member'>; readOnly?: boolean }) {
  const qc = useQueryClient();
  const today = useToday();
  const thread = useQuery({ queryKey: ['groups', 'thread', group.id], queryFn: () => fetchThread(group.id), refetchInterval: 20_000 });
  const [draft, setDraft] = useState('');
  const [failed, setFailed] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const todays = useDrillStore((s) => Object.values(s.drills).find((d) => d.scheduledFor === today && d.status !== 'pending'));

  const refresh = () => qc.invalidateQueries({ queryKey: ['groups'] });
  const post = useMutation({
    mutationFn: (p: { body: string; kind: 'post' | 'checkin' }) => createPost(group.id, p.body, p.kind),
    onSuccess: (p) => {
      setDraft('');
      setFailed(false);
      if (p.flag === 'crisis') setCrisis(true);
      void refresh();
    },
    onError: () => setFailed(true),
  });

  if (crisis) return <CrisisView onBack={() => setCrisis(false)} />;
  if (thread.isError) return <Offline onRetry={() => void thread.refetch()} />;

  const rule = getRule(group.ruleId);
  const open = isOpen(group, today);
  const week = weekOf(group, today);
  const tier = weekTier(week);
  const items = thread.data ? threadItems(thread.data, mine.userId) : [];
  const muted = isMuted(mine.member?.mutedUntil ?? null);
  const canWrite = open && !readOnly && !muted;
  const checkInBody = todays ? (todays.status === 'done' ? copy.group.checkInDone : copy.group.checkInDodged) : null;
  const checkedIn = !!checkInBody && items.some((i) => i.mine && i.post.kind === 'checkin' && i.post.createdAt.slice(0, 10) >= today);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-4" keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="font-bold text-2xl text-bone">
          {copy.join.title(rule.number, rule.title)}
        </Text>
        <Text className="mt-1 font-medium text-base text-ash" testID="group-meta">
          {`${copy.group.week(week, GROUP_WEEKS)} · ${copy.group.members(thread.data ? memberCount(thread.data) : 0)}`}
        </Text>

        <View className="mt-5 border-l-4 border-ember bg-charcoal-900 p-4">
          <Text className="font-bold text-sm uppercase tracking-widest text-ember-soft">{`${copy.group.prompt} · ${todayCopy.drill.tier[tier]}`}</Text>
          <Text className="mt-2 font-medium text-lg leading-7 text-bone">{rule.drills[tier]}</Text>
        </View>

        {!open ? (
          <View className="mt-6">
            <Text className="font-bold text-lg text-bone">{copy.group.closed}</Text>
            <Text className="mt-1 font-sans text-base text-ash">{copy.group.closedNext}</Text>
          </View>
        ) : null}

        <View className="mt-6 gap-3" testID="group-posts">
          {thread.data && items.length === 0 ? <Text className="font-sans text-base text-ash">{copy.group.empty}</Text> : null}
          {items.map((item) => (
            <PostCard key={item.post.id} item={item} groupId={group.id} readOnly={!!readOnly} onChanged={refresh} />
          ))}
        </View>

        {!readOnly && open ? (
          <View className="mt-8 items-start">
            <Button
              variant="text"
              label={copy.group.leave}
              onPress={() =>
                confirmDestructive({
                  title: copy.group.leaveConfirm,
                  body: '',
                  confirm: copy.group.leaveYes,
                  keep: copy.group.leaveNo,
                  onConfirm: () => void leaveGroup(group.id).then(refresh),
                })
              }
              testID="group-leave"
            />
          </View>
        ) : null}
      </ScrollView>

      {muted && open && !readOnly ? <Text className="border-t border-charcoal-700 px-4 py-3 font-medium text-base text-ash">{copy.group.muted}</Text> : null}
      {canWrite ? (
        <View className="border-t border-charcoal-700 px-4 py-3">
          {failed ? (
            <Text accessibilityRole="alert" className="mb-2 font-medium text-sm text-ember-soft">
              {copy.group.sendFailed}
            </Text>
          ) : null}
          {checkInBody && !checkedIn ? (
            <View className="mb-2 items-start">
              <Button
                variant="text"
                label={copy.group.checkIn}
                onPress={() => post.mutate({ body: checkInBody, kind: 'checkin' })}
                testID="group-checkin"
              />
            </View>
          ) : null}
          <View className="flex-row items-end gap-2">
            <TextInput
              accessibilityLabel={copy.group.composer}
              value={draft}
              onChangeText={setDraft}
              placeholder={copy.group.composer}
              placeholderTextColor={palette.ash}
              multiline
              maxLength={1000}
              className="max-h-32 min-h-12 flex-1 border border-charcoal-700 bg-charcoal-900 px-3 py-3 font-sans text-base text-bone"
              testID="group-composer"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !draft.trim() || post.isPending }}
              disabled={!draft.trim() || post.isPending}
              onPress={() => post.mutate({ body: draft, kind: 'post' })}
              testID="group-post"
              className={`min-h-12 justify-center px-4 ${draft.trim() && !post.isPending ? 'bg-ember' : 'bg-charcoal-800'}`}>
              <Text className={`font-bold text-base ${draft.trim() && !post.isPending ? 'text-charcoal-950' : 'text-ash'}`}>{copy.group.post}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function PostCard({ item, groupId, readOnly, onChanged }: { item: ThreadItem; groupId: string; readOnly: boolean; onChanged: () => void }) {
  const [menu, setMenu] = useState<'closed' | 'open' | 'report' | 'reported'>('closed');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const { post } = item;
  const checkin = post.kind === 'checkin';

  const toggleRespect = () => void setRespect(post.id, !item.respectedByMe).then(onChanged);
  const sendReport = async () => {
    if (!reason) return;
    await report({ postId: post.id }, reason);
    setMenu('reported');
  };

  return (
    <Animated.View entering={fadeIn()} className={`p-4 ${checkin ? 'border border-charcoal-700' : 'bg-charcoal-900'}`} testID={`group-post-${post.id}`}>
      <Text className={`font-bold text-sm ${item.mine ? 'text-ember-soft' : 'text-ash'}`}>{item.name}</Text>
      <Text className={`mt-1 font-sans text-lg leading-7 ${checkin ? 'font-bold text-bone' : 'text-bone'}`}>{post.body}</Text>
      {item.held ? (
        <Text className="mt-2 font-medium text-sm text-ash" testID="group-post-held">
          {copy.group.held}
        </Text>
      ) : null}

      {menu === 'reported' ? (
        <Text accessibilityRole="alert" className="mt-3 font-medium text-sm text-ember-soft">
          {copy.report.sent}
        </Text>
      ) : !item.held ? (
        <View className="mt-2 flex-row items-center gap-x-5">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.respectedByMe, disabled: readOnly }}
            accessibilityLabel={`${copy.group.respect}. ${copy.group.respectA11y(item.respect)}`}
            disabled={readOnly}
            onPress={toggleRespect}
            testID={`respect-${post.id}`}
            className="min-h-11 flex-row items-center gap-2">
            <View className={`h-5 w-5 border-2 ${item.respectedByMe ? 'border-ember bg-ember' : 'border-ash'}`} />
            <Text className={`font-bold text-base ${item.respectedByMe ? 'text-ember-soft' : 'text-ash'}`}>
              {item.respect > 0 ? `${copy.group.respect} · ${item.respect}` : copy.group.respect}
            </Text>
          </Pressable>
          {!readOnly ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: menu !== 'closed' }}
              onPress={() => setMenu(menu === 'closed' ? 'open' : 'closed')}
              testID={`more-${post.id}`}
              className="min-h-11 justify-center">
              <Text className="font-bold text-base text-ash">{copy.group.more}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {menu === 'open' ? (
        <View className="mt-1 flex-row flex-wrap gap-x-6">
          {item.mine ? (
            <Button
              variant="text"
              label={copy.group.deletePost}
              onPress={() =>
                confirmDestructive({
                  title: copy.group.deleteConfirm,
                  body: '',
                  confirm: copy.group.deletePost,
                  keep: copy.block.no,
                  onConfirm: () => void deletePost(post.id).then(onChanged),
                })
              }
              testID={`delete-${post.id}`}
            />
          ) : (
            <>
              <Button variant="text" label={copy.report.action} onPress={() => setMenu('report')} testID={`report-${post.id}`} />
              <Button
                variant="text"
                label={copy.block.action}
                onPress={() =>
                  confirmDestructive({
                    title: copy.block.confirm(item.name),
                    body: '',
                    confirm: copy.block.yes,
                    keep: copy.block.no,
                    onConfirm: () => void block(post.authorId, true).then(onChanged),
                  })
                }
                testID={`block-${post.id}`}
              />
            </>
          )}
        </View>
      ) : null}

      {menu === 'report' ? (
        <View className="mt-3" testID={`report-sheet-${post.id}`}>
          <Text className="font-bold text-base text-bone">{copy.report.title}</Text>
          <View className="mt-2">
            <Chips
              chips={REPORT_REASONS.map((k) => ({ key: k, label: copy.report.reasons[k] }))}
              selected={reason}
              onSelect={setReason}
              testID={`report-reason-${post.id}`}
            />
          </View>
          <View className="mt-3 flex-row gap-3">
            <Button label={copy.report.send} onPress={() => void sendReport()} disabled={!reason} testID={`report-send-${post.id}`} />
            <Button variant="text" label={copy.block.no} onPress={() => setMenu('closed')} />
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

function CrisisView({ onBack }: { onBack: () => void }) {
  return (
    <Pane>
      <View testID="group-crisis">
        <Text accessibilityRole="header" className="font-bold text-3xl leading-10 text-bone">
          {copy.crisis.title}
        </Text>
        <Text className="mt-4 font-sans text-lg leading-7 text-bone">{copy.crisis.body}</Text>
        <View className="mt-8">
          <Button label={copy.crisis.call} onPress={() => void Linking.openURL('tel:988')} testID="group-crisis-call" />
        </View>
        <Text className="mt-3 font-sans text-base text-ash">{copy.crisis.note}</Text>
        <View className="mt-8 items-start">
          <Button variant="text" label={copy.crisis.back} onPress={onBack} testID="group-crisis-back" />
        </View>
      </View>
    </Pane>
  );
}
