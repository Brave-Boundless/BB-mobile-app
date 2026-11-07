import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deeperCopy } from '@copy/deeper';
import { structureCopy as structure } from '@copy/structure';
import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { ArtThumb } from '@/components/art';
import { chapterArt } from '@/content/art';
import { Reveal, Rise } from '@/components/motion';
import { TimeField } from '@/components/time-field';
import { getRule, type DrillTier } from '@/content';
import { fadeIn } from '@/theme/motion';
import { AfterDay45 } from '@/features/practice/after-day-45';

import { HowHard, LookBack, PlanTomorrow, RuleRecapCard, WhatGotInTheWay } from './after-answer-view';
import { EveningPrompt } from './evening-prompt';
import { Grid45, Pips } from './pips';
import { requestNotifications, rescheduleMorningPushes } from './notifications';
import { todayState } from './progress';
import { SPINE_LENGTH, milestoneFor, spineDay } from './spine';
import { rulePips } from './structure';
import { useDrillStore, type DrillDayRow } from './store';
import { useOffline } from './use-sync';
import { useToday } from './use-today';

function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useDrillStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useDrillStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

// ── screen ───────────────────────────────────────────────────────────────

export function TodayScreen() {
  const hydrated = useHydrated();
  const today = useToday();
  const offline = useOffline();
  const [pushDenied, setPushDenied] = useState(false);
  // After Day 45: editing the daily set. Lives here so the scroll view can reset with it.
  const [editingSet, setEditingSet] = useState(false);

  const startedOn = useDrillStore((s) => s.startedOn);
  const notificationsAsked = useDrillStore((s) => s.notificationsAsked);
  const notifyAt = useDrillStore((s) => s.notifyAt);
  const drills = useDrillStore((s) => s.drills);
  const practice = useDrillStore((s) => s.practice);
  const openToday = useDrillStore((s) => s.openToday);

  const records = useMemo(() => Object.values(drills), [drills]);
  const state = useMemo(() => todayState(records, today), [records, today]);

  // Create (or carry over) today's drill row once the user has started.
  useEffect(() => {
    if (hydrated && startedOn && state.kind === 'drill') openToday(today);
  }, [hydrated, startedOn, state, today, openToday]);

  // Keep the next 7 mornings scheduled with the right rule.
  const scheduleKey = records.map((r) => `${r.day}:${r.ruleId}:${r.status}:${r.scheduledFor}`).join('|');
  useEffect(() => {
    if (hydrated && startedOn) void rescheduleMorningPushes(useDrillStore.getState(), notifyAt);
  }, [hydrated, startedOn, scheduleKey, notifyAt, today, practice]);

  if (!hydrated) return <Shell />;

  let body: React.ReactNode;
  if (!startedOn) body = <StartView today={today} />;
  else if (!notificationsAsked && Platform.OS !== 'web') body = <NotifyAskView onDenied={() => setPushDenied(true)} />;
  else if (state.kind === 'complete') body = <AfterDay45 today={today} editing={editingSet} setEditing={setEditingSet} />;
  else {
    const row = records.find((r) => r.day === state.day && r.day <= SPINE_LENGTH);
    body = !row ? null : row.status === 'pending' ? <DrillView row={row} /> : <AnsweredView row={row} today={today} />;
  }

  return (
    // A new view (wrap-up → daily set, edit → daily set) opens at the top, not where the last one was scrolled.
    <Shell offline={offline} scrollKey={state.kind === 'complete' ? `${practice?.startedOn ?? 'wrapup'}:${practice?.dailySet.join(',')}:${editingSet}` : 'spine'}>
      {pushDenied ? <Text className="mb-6 font-sans text-sm text-ash">{copy.notifications.deniedNote}</Text> : null}
      {body}
    </Shell>
  );
}

function Shell({ children, offline, scrollKey }: { children?: React.ReactNode; offline?: boolean; scrollKey?: string }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
      {offline ? (
        <View accessibilityRole="alert" className="bg-charcoal-800 px-6 py-2">
          <Text className="font-sans text-sm text-ash">{copy.offline}</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          key={scrollKey}
          contentContainerClassName="grow px-6 pb-8 pt-6"
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── first run ────────────────────────────────────────────────────────────

const EMPTY_GRID = Array.from({ length: 15 }, () => ['ahead', 'ahead', 'ahead'] as const);

function StartView({ today }: { today: string }) {
  const start = useDrillStore((s) => s.start);
  const [notifyAt, setNotifyAt] = useState(useDrillStore.getState().notifyAt);

  return (
    <View className="flex-1 justify-between">
      <View>
        <Rise index={0}>
          <Text accessibilityRole="header" className="font-bold text-3xl text-bone">
            {structure.intro.headline}
          </Text>
        </Rise>
        <Rise index={1}>
          <Text className="mt-4 font-sans text-lg text-ash">{structure.intro.body}</Text>
          <View className="mt-6">
            <Grid45 rows={EMPTY_GRID} label={structure.intro.headline} testID="intro-grid" />
          </View>
        </Rise>
        <Rise index={2}>
          <View className="mt-6 gap-3">
            {(['five_minute', 'uncomfortable', 'daily'] as const).map((t, i) => (
              <View key={t} className="flex-row items-start gap-3">
                <Pips pips={(['ahead', 'ahead', 'ahead'] as const).map((p, j) => (j === i ? 'done' : p))} label="" />
                <Text className="flex-1 font-medium text-base leading-6 text-bone">{structure.intro.tiers[t]}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-4 font-sans text-base text-ash">{structure.intro.pace}</Text>
        </Rise>

        <Rise index={3}>
          <View className="mt-10 bg-charcoal-900 p-5">
            <Text className="font-medium text-base text-bone">{copy.start.notifyLabel}</Text>
            <TimeField value={notifyAt} onChange={setNotifyAt} />
            <Text className="mt-2 font-sans text-sm text-ash">{copy.start.notifyHint}</Text>
          </View>
        </Rise>
      </View>

      <Rise index={4} base={120}>
        <View className="mt-10">
          <Button label={copy.start.cta} onPress={() => start(today, notifyAt)} testID="start-day-1" />
        </View>
      </Rise>
    </View>
  );
}

function NotifyAskView({ onDenied }: { onDenied: () => void }) {
  const markAsked = useDrillStore((s) => s.markNotificationsAsked);

  return (
    <View className="flex-1 justify-between">
      <Rise>
        <Text accessibilityRole="header" className="font-bold text-2xl text-bone">
          {copy.notifications.ask}
        </Text>
      </Rise>
      <Rise index={1} base={120}>
      <View className="mt-10 gap-3">
        <Button
          label={copy.notifications.allow}
          testID="notify-allow"
          onPress={async () => {
            const granted = await requestNotifications();
            if (!granted) onDenied();
            markAsked();
          }}
        />
        <Button variant="secondary" label={copy.notifications.deny} onPress={markAsked} testID="notify-deny" />
      </View>
      </Rise>
    </View>
  );
}

// ── the drill ────────────────────────────────────────────────────────────

function DrillView({ row }: { row: DrillDayRow }) {
  const answer = useDrillStore((s) => s.answer);
  const drills = useDrillStore((s) => s.drills);
  const [fiveMinute, setFiveMinute] = useState(false);
  const rule = getRule(row.ruleId);
  const { tier: scheduledTier, dayOfRule } = spineDay(row.day);
  const pips = rulePips({ drills }, rule.number);
  const tier: DrillTier = fiveMinute ? 'five_minute' : scheduledTier;

  const respond = (status: 'done' | 'dodged') => {
    answer(row.id, status, tier);
    const part = milestoneFor(row.day);
    if (part) router.push(`/milestone/${part}`);
  };

  return (
    <View className="flex-1 justify-between">
      <View>
        <Rise index={0}>
          <Text className="font-medium text-sm uppercase tracking-widest text-ash" testID="drill-position">
            {structure.position(row.day, SPINE_LENGTH, rule.number, dayOfRule)}
          </Text>
        </Rise>
        <Rise index={1}>
          <View className="mt-6 flex-row items-end gap-4">
            <View className="flex-1">
              <Text className="font-medium text-base text-ash">{copy.drill.ruleLabel(rule.number)}</Text>
              <Text accessibilityRole="header" className="mt-1 font-bold text-2xl text-bone">
                {rule.title}
              </Text>
              <View className="mt-3">
                <Pips pips={pips} size={12} label={structure.pipsA11y(dayOfRule - 1)} testID="rule-pips" />
              </View>
            </View>
            {chapterArt[rule.number] ? <ArtThumb art={chapterArt[rule.number]!} width={72} testID="today-art" /> : null}
          </View>
        </Rise>

        <Rise index={2}>
          {/* Keyed by tier: swapping in the five-minute drill cross-fades. */}
          <Animated.View key={tier} entering={fadeIn()}>
            <Text className="mt-8 font-medium text-sm uppercase tracking-widest text-ember-soft">
              {copy.drill.tier[tier]}
            </Text>
            <Text className="mt-2 font-medium text-2xl leading-9 text-bone" testID="drill-text">
              {rule.drills[tier]}
            </Text>
          </Animated.View>
        </Rise>

        <View className="mt-4 flex-row flex-wrap items-start gap-x-4">
          <Button
            variant="text"
            label={deeperCopy.open}
            accessibilityLabel={deeperCopy.openA11y}
            onPress={() => router.push(`/drill/${rule.number}/${tier}`)}
            testID="go-deeper"
          />
          {scheduledTier !== 'five_minute' ? (
            <Button
              variant="text"
              label={fiveMinute ? copy.drill.backToFull : copy.drill.fiveMinuteFallback}
              onPress={() => setFiveMinute((v) => !v)}
            />
          ) : null}
        </View>
      </View>

      <Rise index={3} base={120}>
      <View className="mt-10 gap-3">
        <Button label={copy.drill.did} accessibilityLabel={copy.drill.a11y.did} onPress={() => respond('done')} testID="did-it" />
        <Button
          variant="secondary"
          label={copy.drill.dodged}
          accessibilityLabel={copy.drill.a11y.dodged}
          onPress={() => respond('dodged')}
          testID="dodged-it"
        />
      </View>
      </Rise>
    </View>
  );
}

// ── after answering ──────────────────────────────────────────────────────

function AnsweredView({ row, today }: { row: DrillDayRow; today: string }) {
  const undo = useDrillStore((s) => s.undo);
  const rule = getRule(row.ruleId);
  const done = row.status === 'done';

  return (
    <View className="flex-1">
      <Text className="font-medium text-sm uppercase tracking-widest text-ash">
        {structure.position(row.day, SPINE_LENGTH, rule.number, spineDay(row.day).dayOfRule)}
      </Text>
      <Animated.View entering={fadeIn()}>
        <Text accessibilityRole="header" className="mt-6 font-bold text-3xl text-bone">
          {done ? copy.answered.done : copy.answered.dodged}
        </Text>
      </Animated.View>
      {done ? (
        <Reveal delay={180}>
          <Text className="mt-3 font-medium text-2xl text-ember-soft">{rule.mantra}</Text>
        </Reveal>
      ) : null}

      <Rise base={done ? 420 : 200}>
        {done ? <HowHard row={row} /> : <WhatGotInTheWay row={row} />}
      </Rise>

      <Rise base={done ? 520 : 240}>
        <EveningPrompt row={row} />
      </Rise>

      <RuleRecapCard row={row} />

      <Rise base={done ? 560 : 280}>
        <PlanTomorrow row={row} today={today} />
      </Rise>

      <Rise base={done ? 600 : 320}>
      <View className="mt-10">
        <Text className="font-sans text-base text-ash">{copy.answered.nextUnlocks}</Text>
        <View className="mt-2 items-start">
          <Button variant="text" label={copy.answered.undo} onPress={() => undo(row.id)} testID="undo" />
        </View>
      </View>
      </Rise>

      <Rise base={done ? 640 : 360}>
        <LookBack today={today} ruleId={row.ruleId} />
      </Rise>
    </View>
  );
}
