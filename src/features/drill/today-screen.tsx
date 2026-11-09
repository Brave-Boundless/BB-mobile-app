import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deeperCopy } from '@copy/deeper';
import { howItWorksCopy } from '@copy/howitworks';
import { redesignCopy } from '@copy/redesign';
import { structureCopy as structure } from '@copy/structure';
import { todayCopy as copy } from '@copy/today';
import { Button } from '@/components/button';
import { TopBar } from '@/components/top-actions';
import { SignUpScreen } from '@/features/account/signup-screen';
import { accountsRequired, useAuthState } from '@/features/account/session';
import { chapterArt, partTextColor } from '@/content/art';
import { Reveal, Rise } from '@/components/motion';
import { TimeField } from '@/components/time-field';
import { getPart, getRule, type DrillTier } from '@/content';
import { fadeIn } from '@/theme/motion';
import { AfterDay45 } from '@/features/practice/after-day-45';

import { EveningPassage } from '@/features/inspiration/today-passages';

import { AnswerFlow } from './answer-flow';
import { DayStrip } from './day-strip';

import { HowHard, LookBack, PlanTomorrow, RuleRecapCard, WhatGotInTheWay } from './after-answer-view';
import { EveningPrompt } from './evening-prompt';
import { Grid45, Pips } from './pips';
import { requestNotifications, rescheduleMorningPushes } from './notifications';
import { todayState } from './progress';
import { SPINE_LENGTH, milestoneFor, spineDay } from './spine';
import { allPips } from './structure';
import { useDrillStore, type DrillDayRow } from './store';
import { syncNow, useOffline } from './use-sync';
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

  const start = useDrillStore((s) => s.start);
  const { session } = useAuthState();
  // First-time reader who tapped Start Day 1 without an account: the push time they picked.
  const [signingUp, setSigningUp] = useState<string | null>(null);

  // Signed in from the sign-up screen: pull any history this account already
  // has (a returning reader on a new phone), then start Day 1 if there was none.
  useEffect(() => {
    if (signingUp === null || !session) return;
    const pickedTime = signingUp;
    void syncNow().then(() => {
      if (!useDrillStore.getState().startedOn) start(today, pickedTime);
      setSigningUp(null);
    });
  }, [signingUp, session, start, today]);

  // The drill just answered on this screen: its after-answer screens show until
  // See you tomorrow (or Undo). Reopening the app later shows the resting view.
  const [flowId, setFlowId] = useState<string | null>(null);

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
  const flowRow = flowId ? drills[flowId] : undefined;
  if (flowRow && flowRow.status !== 'pending') {
    return <AnswerFlow row={flowRow} today={today} onFinish={() => setFlowId(null)} />;
  }
  if (signingUp !== null && !session) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-charcoal-950">
        <SignUpScreen variant="new" offline={offline} />
      </SafeAreaView>
    );
  }

  let body: React.ReactNode;
  if (!startedOn)
    body = <StartView onStart={(time) => (accountsRequired && !session ? setSigningUp(time) : start(today, time))} />;
  else if (!notificationsAsked && Platform.OS !== 'web') body = <NotifyAskView onDenied={() => setPushDenied(true)} />;
  else if (state.kind === 'complete') body = <AfterDay45 today={today} editing={editingSet} setEditing={setEditingSet} />;
  else {
    const row = records.find((r) => r.day === state.day && r.day <= SPINE_LENGTH);
    body = !row ? null : row.status === 'pending' ? <DrillView row={row} onAnswered={setFlowId} /> : <AnsweredView row={row} today={today} />;
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
      <TopBar help helpTestID="how-it-works-today" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          key={scrollKey}
          contentContainerClassName="grow px-6 pb-8 pt-2"
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── first run ────────────────────────────────────────────────────────────

const EMPTY_GRID = Array.from({ length: 15 }, () => ['ahead', 'ahead', 'ahead'] as const);

function StartView({ onStart }: { onStart: (notifyAt: string) => void }) {
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
          <Button label={copy.start.cta} onPress={() => onStart(notifyAt)} testID="start-day-1" />
          <View className="mt-4 items-center">
            <Button variant="text" label={howItWorksCopy.link} onPress={() => router.push('/how-it-works')} testID="how-it-works-start" />
          </View>
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

function DrillView({ row, onAnswered }: { row: DrillDayRow; onAnswered: (id: string) => void }) {
  const answer = useDrillStore((s) => s.answer);
  const drills = useDrillStore((s) => s.drills);
  const [fiveMinute, setFiveMinute] = useState(false);
  const rule = getRule(row.ruleId);
  const part = getPart(rule.part);
  const { tier: scheduledTier, dayOfRule } = spineDay(row.day);
  const tier: DrillTier = fiveMinute ? 'five_minute' : scheduledTier;
  const art = chapterArt[rule.number];
  const position = structure.position(row.day, SPINE_LENGTH, rule.number, dayOfRule);

  const respond = (status: 'done' | 'dodged') => {
    answer(row.id, status, tier);
    onAnswered(row.id);
    const milestone = milestoneFor(row.day);
    if (milestone) router.push(`/milestone/${milestone}`);
  };

  return (
    <View className="flex-1">
      <Rise index={0}>
        <View className="flex-row items-baseline gap-2">
          <Text className="font-bold text-3xl text-bone">{row.day}</Text>
          <Text className="font-bold text-base tracking-widest text-ash">{`/ ${SPINE_LENGTH}`}</Text>
        </View>
        <View className="mt-3">
          <DayStrip rows={allPips({ drills })} label={position} testID="drill-position-strip" />
        </View>
      </Rise>

      <Rise index={1}>
        <View className="mt-5 overflow-hidden bg-charcoal-900" style={{ height: 260 }}>
          {art ? (
            <Image
              source={art.source}
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
              testID="today-art"
            />
          ) : null}
          <View className="absolute bottom-0 left-0 flex-row items-center gap-2 bg-charcoal-950 py-2 pl-3 pr-4">
            <View style={{ width: 10, height: 10, backgroundColor: partTextColor[rule.part] }} />
            <Text style={{ color: partTextColor[rule.part] }} className="font-bold text-xs tracking-widest">
              {redesignCopy.partChip(part.name, rule.number)}
            </Text>
          </View>
        </View>
        <Text accessibilityRole="header" className="mt-5 font-bold text-3xl uppercase leading-9 text-bone">
          {rule.title}
        </Text>
      </Rise>

      <Rise index={2}>
        {/* The drill is the way into Go deeper. Keyed by tier: the five-minute swap cross-fades. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.drill.tier[tier]}. ${rule.drills[tier]}. ${deeperCopy.openA11y}`}
          onPress={() => router.push(`/drill/${rule.number}/${tier}`)}
          testID="go-deeper"
          className="mt-5 border border-charcoal-700 p-4 active:opacity-80">
          <Animated.View key={tier} entering={fadeIn()}>
            <View className="flex-row items-center gap-3">
              <Pips pips={[0, 1, 2].map((i) => (i < dayOfRule - 1 ? 'done' : i === dayOfRule - 1 ? 'current' : 'ahead'))} size={10} label="" />
              <Text className="flex-1 font-bold text-xs uppercase tracking-widest text-ember-soft">{copy.drill.tier[tier]}</Text>
              <Text className="font-bold text-lg text-ash">›</Text>
            </View>
            <Text className="mt-2 font-medium text-xl leading-7 text-bone" testID="drill-text">
              {rule.drills[tier]}
            </Text>
          </Animated.View>
        </Pressable>
        {scheduledTier !== 'five_minute' ? (
          <View className="mt-1 items-start">
            <Button
              variant="text"
              label={fiveMinute ? copy.drill.backToFull : copy.drill.fiveMinuteFallback}
              onPress={() => setFiveMinute((v) => !v)}
            />
          </View>
        ) : null}
      </Rise>

      <Rise index={3} base={120}>
        <View className="mt-6 flex-row gap-3">
          <View className="flex-1">
            <Button label={copy.drill.did} accessibilityLabel={copy.drill.a11y.did} onPress={() => respond('done')} testID="did-it" />
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              label={copy.drill.dodged}
              accessibilityLabel={copy.drill.a11y.dodged}
              onPress={() => respond('dodged')}
              testID="dodged-it"
            />
          </View>
        </View>
      </Rise>
    </View>
  );
}

// ── after answering ──────────────────────────────────────────────────────

function AnsweredView({ row, today }: { row: DrillDayRow; today: string }) {
  const undo = useDrillStore((s) => s.undo);
  const drills = useDrillStore((s) => s.drills);
  const rule = getRule(row.ruleId);
  const done = row.status === 'done';
  const position = structure.position(row.day, SPINE_LENGTH, rule.number, spineDay(row.day).dayOfRule);
  // The after-answer screens already asked; only ask again if they were closed early.
  const asked = done ? !!row.effort : !!row.dodgeReason;

  return (
    <View className="flex-1">
      <View className="flex-row items-baseline gap-2">
        <Text className="font-bold text-3xl text-bone">{row.day}</Text>
        <Text className="font-bold text-base tracking-widest text-ash">{`/ ${SPINE_LENGTH}`}</Text>
      </View>
      <View className="mt-3">
        <DayStrip rows={allPips({ drills })} label={position} testID="drill-position-strip" />
      </View>
      <Animated.View entering={fadeIn()}>
        <Text accessibilityRole="header" className="mt-8 font-bold text-3xl text-bone">
          {done ? copy.answered.done : copy.answered.dodged}
        </Text>
      </Animated.View>
      {done ? (
        <Reveal delay={180}>
          <Text className="mt-3 font-bold text-3xl uppercase leading-9 text-ember-soft">{rule.mantra}</Text>
        </Reveal>
      ) : null}

      {asked ? null : <Rise base={200}>{done ? <HowHard row={row} /> : <WhatGotInTheWay row={row} />}</Rise>}

      <Rise base={240}>
        <EveningPrompt row={row} />
      </Rise>

      <EveningPassage row={row} />

      <RuleRecapCard row={row} />

      <Rise base={280}>
        <PlanTomorrow row={row} today={today} />
      </Rise>

      <Rise base={320}>
        <View className="mt-10">
          <Text className="font-sans text-base text-ash">{copy.answered.nextUnlocks}</Text>
          <View className="mt-2 items-start">
            <Button variant="text" label={copy.answered.undo} onPress={() => undo(row.id)} testID="undo" />
          </View>
        </View>
      </Rise>

      <Rise base={360}>
        <LookBack today={today} ruleId={row.ruleId} />
      </Rise>
    </View>
  );
}
