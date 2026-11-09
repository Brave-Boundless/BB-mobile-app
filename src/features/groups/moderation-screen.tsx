import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, Text, TextInput, View } from 'react-native';

import { groupsCopy as copy } from '@copy/groups';
import { Button } from '@/components/button';
import { Chips } from '@/components/chips';
import { confirmDestructive } from '@/components/confirm';
import { getRule, rules, type RuleId } from '@/content';
import { useToday } from '@/features/drill/use-today';
import { palette } from '@/theme';

import {
  closeGroup,
  createGroup,
  fetchModeration,
  moderateMember,
  moderatePost,
  resolveReports,
  type ModGroup,
  type QueueItem,
} from './api';
import { isOpen } from './thread';

/**
 * Moderation (moderators only; the server checks too): what's waiting, a new
 * group with its invite code, and every group with its code and size.
 */
export function ModerationScreen() {
  const qc = useQueryClient();
  const mod = useQuery({ queryKey: ['groups', 'moderation'], queryFn: fetchModeration, refetchInterval: 30_000 });
  const refresh = () => qc.invalidateQueries({ queryKey: ['groups'] });

  return (
    <ScrollView className="flex-1 bg-charcoal-950" contentContainerClassName="px-6 pb-16 pt-2" keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" className="font-bold text-3xl uppercase text-bone">
        {copy.moderator.title}
      </Text>
      {mod.isError ? (
        <View className="mt-4">
          <Text className="font-medium text-base text-bone">{copy.none.offline}</Text>
          <View className="mt-2 items-start">
            <Button variant="text" label={copy.none.retry} onPress={() => void mod.refetch()} />
          </View>
        </View>
      ) : null}
      {mod.data ? (
        <>
          <Text className="mt-2 font-medium text-lg text-ember-soft" testID="mod-queue-count">
            {copy.moderator.queue(mod.data.queue.length)}
          </Text>
          <View className="mt-4 gap-3">
            {mod.data.queue.map((item) => (
              <QueueCard key={item.key} item={item} name={item.reportedUserId ? mod.data.names[item.reportedUserId] : undefined} onDone={refresh} />
            ))}
          </View>

          <NewGroup onCreated={refresh} />

          <Text className="mt-10 font-medium text-sm uppercase tracking-widest text-ash">{copy.moderator.groups}</Text>
          <View className="mt-3 gap-3">
            {mod.data.groups.length === 0 ? <Text className="font-sans text-base text-ash">{copy.moderator.noGroups}</Text> : null}
            {mod.data.groups.map((g) => (
              <GroupRow key={g.id} group={g} onChanged={refresh} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function QueueCard({ item, name, onDone }: { item: QueueItem; name?: string; onDone: () => void }) {
  const post = item.post;
  const act = (p: Promise<void>) => void p.then(onDone);
  return (
    <View className={`p-4 ${item.urgent ? 'border-2 border-ember' : 'border border-charcoal-700'}`} testID={`mod-item-${item.key}`}>
      {item.urgent ? <Text className="font-bold text-sm uppercase tracking-widest text-ember-soft">{copy.moderator.urgent}</Text> : null}
      <Text className="mt-1 font-bold text-sm text-ash">
        {[name, post?.status === 'held' ? copy.moderator.held : null, item.reasons.length ? `${copy.moderator.reports}: ${item.reasons.map((r) => copy.report.reasons[r]).join(', ')}` : null]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {post ? <Text className="mt-2 font-sans text-lg leading-7 text-bone">{post.body}</Text> : null}
      <View className="mt-2 flex-row flex-wrap gap-x-5">
        {post && post.status !== 'visible' ? (
          <Button variant="text" label={copy.moderator.approve} onPress={() => act(moderatePost(post.id, true))} testID={`mod-show-${item.key}`} />
        ) : null}
        {post && post.status !== 'hidden' ? (
          <Button variant="text" label={copy.moderator.hide} onPress={() => act(moderatePost(post.id, false))} testID={`mod-hide-${item.key}`} />
        ) : null}
        {post && item.reportedUserId ? (
          <>
            <Button variant="text" label={copy.moderator.mute} onPress={() => act(moderateMember(post.groupId, item.reportedUserId!, 'mute'))} />
            <Button
              variant="text"
              label={copy.moderator.remove}
              onPress={() =>
                confirmDestructive({
                  title: copy.moderator.removeConfirm(name ?? copy.group.formerMember),
                  body: '',
                  confirm: copy.moderator.remove,
                  keep: copy.block.no,
                  onConfirm: () => act(moderateMember(post.groupId, item.reportedUserId!, 'remove')),
                })
              }
            />
          </>
        ) : null}
        {item.reportIds.length ? (
          <Button variant="text" label={copy.moderator.resolve} onPress={() => act(resolveReports(item.reportIds))} testID={`mod-resolve-${item.key}`} />
        ) : null}
      </View>
    </View>
  );
}

function NewGroup({ onCreated }: { onCreated: () => void }) {
  const today = useToday();
  const [rule, setRule] = useState<RuleId | null>(null);
  const [starts, setStarts] = useState(today);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(starts);

  const create = async () => {
    if (!rule || !validDate) return;
    setBusy(true);
    try {
      setCode(await createGroup(rule, starts));
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-10 bg-charcoal-900 p-5">
      <Text className="font-bold text-xl text-bone">{copy.moderator.newGroup}</Text>
      <Text className="mt-4 font-medium text-base text-bone">{copy.moderator.newGroupRule}</Text>
      <View className="mt-2">
        <Chips
          chips={rules.map((r) => ({ key: String(r.number), label: String(r.number), a11y: `Rule ${r.number}. ${r.title}` }))}
          selected={rule ? String(rule) : null}
          onSelect={(k) => {
            setRule(Number(k) as RuleId);
            setCode(null);
          }}
          testID="mod-rule"
        />
      </View>
      {rule ? <Text className="mt-2 font-medium text-base text-ash">{getRule(rule).title}</Text> : null}
      <Text className="mt-4 font-medium text-base text-bone">{copy.moderator.newGroupStart}</Text>
      <TextInput
        accessibilityLabel={copy.moderator.newGroupStart}
        value={starts}
        onChangeText={setStarts}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={palette.ash}
        className="mt-2 min-h-12 border border-charcoal-700 bg-charcoal-950 px-3 py-3 font-sans text-base text-bone"
        testID="mod-starts"
      />
      <View className="mt-4">
        <Button label={copy.moderator.create} onPress={() => void create()} disabled={!rule || !validDate || busy} testID="mod-create" />
      </View>
      {code ? (
        <View className="mt-4">
          <Text className="font-bold text-2xl text-ember-soft" selectable testID="mod-code">
            {copy.moderator.code(code)}
          </Text>
          <View className="mt-2 items-start">
            <Button variant="text" label={copy.moderator.shareCode} onPress={() => void Share.share({ message: code })} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function GroupRow({ group, onChanged }: { group: ModGroup; onChanged: () => void }) {
  const today = useToday();
  const rule = getRule(group.ruleId);
  const open = isOpen(group, today);
  return (
    <View className="border border-charcoal-700 p-4" testID={`mod-group-${group.id}`}>
      <Text className="font-bold text-base text-bone">{copy.join.title(rule.number, rule.title)}</Text>
      <Text className="mt-1 font-medium text-base text-ash" selectable>
        {[group.inviteCode, copy.group.members(group.members), `${group.startsOn} → ${group.closesOn}`, open ? null : copy.moderator.closedTag]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <View className="mt-1 flex-row flex-wrap gap-x-5">
        <Button variant="text" label={copy.moderator.readGroup} onPress={() => router.push(`/group/${group.id}`)} />
        {open ? (
          <>
            <Button variant="text" label={copy.moderator.shareCode} onPress={() => void Share.share({ message: group.inviteCode })} />
            <Button
              variant="text"
              label={copy.moderator.closeGroup}
              onPress={() =>
                confirmDestructive({
                  title: copy.moderator.closeGroup,
                  body: copy.join.title(rule.number, rule.title),
                  confirm: copy.moderator.closeGroup,
                  keep: copy.block.no,
                  onConfirm: () => void closeGroup(group.id).then(onChanged),
                })
              }
            />
          </>
        ) : null}
      </View>
    </View>
  );
}
